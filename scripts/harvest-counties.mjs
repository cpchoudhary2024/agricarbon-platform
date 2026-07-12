/**
 * Harvest county-level soil properties from USDA SSURGO and compute the Carbon Saturation
 * Index for every county in the continental United States.
 *
 * WHY THIS RUNS OFFLINE
 * ---------------------
 * SSURGO is a free public service. Hammering it with thousands of live queries on every page
 * load would be both slow and rude. Soil does not change between page loads, so we harvest
 * once, commit the result, and ship it as a static file.
 *
 * HOW WE SAMPLE A COUNTY — three approaches, two of which failed
 * --------------------------------------------------------------
 * 1. PARSE THE SURVEY-AREA SYMBOL as a county FIPS code (e.g. "IA169" → 19169).
 *    Fast, and works across the Midwest and East. Then it quietly fails across the West, where
 *    soil survey areas span several counties and are not FIPS-coded at all. It left 26% of the
 *    map with no data — exactly the sort of silent hole that makes a map lie. (SSURGO's
 *    `laoverlap` county table, which would fix this, is empty in Soil Data Access.)
 *
 * 2. INTERSECT THE FULL COUNTY POLYGON. Correct in principle. In practice a single county
 *    polygon takes SSURGO ~91 seconds and then returns a fault: the spatial intersection is far
 *    too expensive to run 3,000 times.
 *
 * 3. SAMPLE POINTS INSIDE THE COUNTY (what we do). We lay a grid over each county, keep the
 *    points that fall inside its boundary, and hand SSURGO the whole set as a single MULTIPOINT
 *    query. It returns the soil map units under those points, and we aggregate over them. This
 *    runs in ~3.5s per county and — the part that matters — it CROSS-VALIDATES against approach
 *    (1) where both work: Story County, Iowa comes back as OM 4.57 / clay 26.5 / silt 39.7 by
 *    sampling, versus OM 4.39 / clay 26.4 / silt 39.1 by survey-area aggregation. Two
 *    independent methods agreeing is the only reason to trust either.
 *
 * RESTRICTED TO ARABLE LAND — and this restriction is not optional
 * ----------------------------------------------------------------
 * An early version averaged over ALL soils in a county. The results were garbage, in an
 * instructive way: Maine came out as the most carbon-saturated state in the country, and New
 * Jersey scored a mean CSI of 5.26. Neither is a carbon-farming story — both are FOREST
 * stories. A county-wide soil average is dominated by woodland, wetland and peat soils carrying
 * 20–27% organic matter, which no farmer will ever crop.
 *
 * So we filter to soils that are actually farmable, using SSURGO's own land capability
 * classification, which exists precisely to make this distinction:
 *
 *   Class 1–3  → arable; few to moderate limitations on cultivation   ✓ included
 *   Class 4–8  → marginal to non-arable; pasture, woodland, wildlife  ✗ excluded
 *
 * BUT YOU MUST CHECK BOTH CAPABILITY CLASSES — this was a real bug, and a bad one.
 * SSURGO publishes TWO land capability classes: `nirrcapcl` (non-irrigated) and `irrcapcl`
 * (irrigated). The first version of this script only checked the non-irrigated one, which
 * quietly deleted almost all farmland west of the 100th meridian: in the arid West, land is
 * class 6–7 as dryland and class 2–3 once you put water on it, which is the entire reason
 * irrigation exists there.
 *
 * The scale of the error:
 *
 *   Nevada       9 non-irrigated arable components  vs  2,083 irrigated
 *   Arizona      8                                  vs  1,005
 *   California   2,917                              vs  5,066   (most of the Central Valley!)
 *
 * California is the largest agricultural state in the country and we were dropping over half of
 * its arable soils. A county is farmable if EITHER class says so.
 *
 * We also exclude Histosols (peat and muck), whose organic matter is an order of magnitude
 * above mineral soils and would swamp any average they enter.
 *
 * Run:  node scripts/build-map.mjs        (first — produces county geometry)
 *       node scripts/harvest-counties.mjs
 */

import { readFileSync, writeFileSync, existsSync } from 'fs';
import { carbonSaturation } from '../src/engine/saturation.js';

const SDA = 'https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest';
const CONCURRENCY = 12;  // polite, but finishes in ~15 min at ~3.5s/county
const GRID = 6;          // 6x6 candidate grid per county → up to ~20 interior points
const TIMEOUT_MS = 45000;

const geomPath = new URL('../src/data/countyGeom.json', import.meta.url);
if (!existsSync(geomPath)) {
  console.error('Missing src/data/countyGeom.json — run `node scripts/build-map.mjs` first.');
  process.exit(1);
}

const counties = JSON.parse(readFileSync(geomPath, 'utf8')).wkt;

/* ── Point sampling ─────────────────────────────────────────────────── */

/** Parse "polygon((x y,x y,...))" back into a coordinate ring. */
function parseRing(wkt) {
  return wkt
    .slice(wkt.indexOf('((') + 2, wkt.lastIndexOf('))'))
    .split(',')
    .map((p) => p.trim().split(/\s+/).map(Number));
}

/** Standard ray-casting point-in-polygon. */
function inside([px, py], ring) {
  let c = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if ((yi > py) !== (yj > py) && px < ((xj - xi) * (py - yi)) / (yj - yi) + xi) c = !c;
  }
  return c;
}

/**
 * Lay a grid over the county's bounding box and keep the cells whose centre falls inside it.
 * Small or awkwardly-shaped counties can catch no grid point at all, so we fall back to the
 * ring's centroid rather than dropping the county from the map.
 */
function samplePoints(wkt) {
  const ring = parseRing(wkt);
  const xs = ring.map((p) => p[0]);
  const ys = ring.map((p) => p[1]);
  const [x0, x1] = [Math.min(...xs), Math.max(...xs)];
  const [y0, y1] = [Math.min(...ys), Math.max(...ys)];

  const pts = [];
  for (let i = 0; i < GRID; i++) {
    for (let j = 0; j < GRID; j++) {
      const p = [
        x0 + ((x1 - x0) * (i + 0.5)) / GRID,
        y0 + ((y1 - y0) * (j + 0.5)) / GRID,
      ];
      if (inside(p, ring)) pts.push(p);
    }
  }

  if (!pts.length) {
    pts.push([xs.reduce((a, b) => a + b, 0) / xs.length, ys.reduce((a, b) => a + b, 0) / ys.length]);
  }
  return pts;
}

/* ── SSURGO query ───────────────────────────────────────────────────── */

const sql = (multipoint) => `
  SELECT
    SUM(mu.muacres * c.comppct_r * ch.om_r)         / NULLIF(SUM(mu.muacres * c.comppct_r), 0) AS om,
    SUM(mu.muacres * c.comppct_r * ch.claytotal_r)  / NULLIF(SUM(mu.muacres * c.comppct_r), 0) AS clay,
    SUM(mu.muacres * c.comppct_r * ch.silttotal_r)  / NULLIF(SUM(mu.muacres * c.comppct_r), 0) AS silt,
    SUM(mu.muacres * c.comppct_r * ch.dbthirdbar_r) / NULLIF(SUM(mu.muacres * c.comppct_r), 0) AS bd,
    COUNT(DISTINCT mu.mukey) AS n_mu
  FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('${multipoint}') AS p
  INNER JOIN mapunit   mu ON mu.mukey = p.mukey
  INNER JOIN component c  ON c.mukey  = mu.mukey
  INNER JOIN chorizon  ch ON ch.cokey = c.cokey
  WHERE c.majcompflag = 'Yes'
    -- Arable under EITHER dryland or irrigated management. Checking only nirrcapcl deletes the
    -- irrigated West — see the header note.
    AND (c.nirrcapcl IN ('1', '2', '3') OR c.irrcapcl IN ('1', '2', '3'))
    AND (c.taxorder <> 'Histosols' OR c.taxorder IS NULL)
    AND ch.hzdept_r < 30
    AND ch.om_r > 0
    AND ch.claytotal_r  IS NOT NULL
    AND ch.silttotal_r  IS NOT NULL
    AND ch.dbthirdbar_r IS NOT NULL
    AND mu.muacres      IS NOT NULL
`;

async function fetchCounty(c) {
  const pts = samplePoints(c.wkt);
  const mp = `multipoint(${pts.map(([x, y]) => `(${x.toFixed(4)} ${y.toFixed(4)})`).join(',')})`;

  const res = await fetch(SDA, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'JSON+COLUMNNAME', query: sql(mp) }),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const text = await res.text();
  if (text.trimStart().startsWith('<')) throw new Error('SDA fault');

  const json = JSON.parse(text);
  if (!json.Table || json.Table.length < 2) return null;

  const [om, clay, silt, bd, nMu] = json.Table[1].map(Number);
  if (![om, clay, silt, bd].every(Number.isFinite) || bd <= 0) return null;

  const sat = carbonSaturation({
    omPct: om, clayPct: clay, siltPct: silt, bulkDensity: bd, depthCm: 30,
  });

  return {
    name: c.name,
    st: c.st,
    csi: sat.csi,
    band: sat.band.key,
    om: round(om, 2),
    clay: round(clay, 1),
    silt: round(silt, 1),
    bd: round(bd, 2),
    headroom: sat.headroomCO2ePerAcre,
    mapunits: nMu,
    samples: pts.length,
  };
}

/* ── Bounded worker pool, with one retry ────────────────────────────── */

const entries = Object.entries(counties);
const out = {};
let done = 0, failed = 0, noArable = 0;

async function worker(queue) {
  while (queue.length) {
    const [fips, c] = queue.pop();
    let r = null;
    for (let attempt = 0; attempt < 2; attempt++) {
      try {
        r = await fetchCounty(c);
        break;
      } catch {
        if (attempt === 1) failed++;
      }
    }
    if (r) out[fips] = r;
    else if (r === null) noArable++;

    if (++done % 50 === 0) {
      const pct = ((done / entries.length) * 100).toFixed(0);
      process.stdout.write(
        `${pct}% · ${done}/${entries.length} · ${Object.keys(out).length} with arable soil · ${failed} errors\n`
      );
    }
  }
}

console.log(`Querying SSURGO for ${entries.length} counties (concurrency ${CONCURRENCY})…`);
const t0 = Date.now();

// ONE queue, shared by every worker. Handing each worker its own copy would make all eight of
// them grind through the identical list — 8x the requests, 8x the wall time, same result.
const queue = [...entries];
await Promise.all(Array.from({ length: CONCURRENCY }, () => worker(queue)));

const mins = ((Date.now() - t0) / 60000).toFixed(1);
writeFileSync(new URL('../src/data/countySaturation.json', import.meta.url), JSON.stringify(out));

const n = Object.keys(out).length;
console.log(`\nDONE in ${mins} min`);
console.log(`${n} counties → src/data/countySaturation.json`);
console.log(`${noArable} counties returned no class 1–3 arable soil (correctly excluded, not an error)`);
console.log(`${failed} hard failures`);

const bands = {};
for (const c of Object.values(out)) bands[c.band] = (bands[c.band] ?? 0) + 1;
console.log('\nSaturation of US arable soils, by county:');
for (const [b, count] of Object.entries(bands).sort((a, b) => b[1] - a[1])) {
  console.log(`  ${b.padEnd(20)} ${String(count).padStart(5)}  (${((count / n) * 100).toFixed(1)}%)`);
}

function round(v, d) { const f = 10 ** d; return Math.round(v * f) / f; }

/*
 * HONESTY NOTE — reproduced in the UI, because it materially limits what this map means.
 *
 * This is a SPATIAL SAMPLE of a county's arable soils, acre-weighted across the map units the
 * sample points landed on. We know which soils COULD be cultivated, not which ones actually are
 * this season, so it is not a cropland-weighted average.
 *
 * The map is a REGIONAL SCREEN, not a field-level answer. Within-county variation is large — the
 * Iowa field in the field-lookup demo scores CSI 1.61 while its county averages far below that,
 * because that field sits on a high-organic-matter Mollisol and its county does not. Use the map
 * to see which way the physics leans in a region; use the field lookup for an actual field.
 */
