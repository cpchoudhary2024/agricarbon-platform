/**
 * Turn a US counties TopoJSON into two artifacts:
 *
 *   src/data/countyPaths.json  — pre-projected, rounded SVG paths for the choropleth
 *   src/data/countyGeom.json   — simplified lon/lat WKT outlines, for the SSURGO harvester
 *
 * WHY PRE-PROJECT AT BUILD TIME
 * -----------------------------
 * The alternative is shipping an 822 KB TopoJSON plus d3-geo and topojson-client to the browser
 * and projecting 3,000 polygons on every page load. The projection never changes and county
 * borders do not move, so we do the work once and ship flat path data.
 *
 * The projection is the same Albers equal-area conic already implemented for the CropScape
 * lookup (api/_lib/albers.js). Equal-area matters for a choropleth: a projection that inflates
 * northern states would visually overweight them, which for a map about soil is exactly the sort
 * of quiet distortion this project exists to avoid.
 *
 * Run:  curl -so /tmp/counties.json https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json
 *       node scripts/build-map.mjs
 */

import { readFileSync, writeFileSync } from 'fs';
import { toAlbers } from '../api/_lib/albers.js';

const topo = JSON.parse(readFileSync('/tmp/counties.json', 'utf8'));

/** Non-CONUS FIPS prefixes. Albers CONUS mangles Alaska and Hawaii, and SSURGO coverage differs. */
const EXCLUDE = new Set(['02', '15', '60', '66', '69', '72', '78']);

const STATE_BY_FIPS = {
  '01':'AL','04':'AZ','05':'AR','06':'CA','08':'CO','09':'CT','10':'DE','11':'DC','12':'FL',
  '13':'GA','16':'ID','17':'IL','18':'IN','19':'IA','20':'KS','21':'KY','22':'LA','23':'ME',
  '24':'MD','25':'MA','26':'MI','27':'MN','28':'MS','29':'MO','30':'MT','31':'NE','32':'NV',
  '33':'NH','34':'NJ','35':'NM','36':'NY','37':'NC','38':'ND','39':'OH','40':'OK','41':'OR',
  '42':'PA','44':'RI','45':'SC','46':'SD','47':'TN','48':'TX','49':'UT','50':'VT','51':'VA',
  '53':'WA','54':'WV','55':'WI','56':'WY',
};

/* ── Minimal TopoJSON decoder ───────────────────────────────────────────
   TopoJSON stores shared borders once, delta-encoded and quantized. Decoding is
   ~25 lines, which is cheaper than adding a dependency.                     */

const { scale: [sx, sy], translate: [tx, ty] } = topo.transform;

const arcs = topo.arcs.map((arc) => {
  let x = 0, y = 0;
  return arc.map(([dx, dy]) => {
    x += dx; y += dy;
    return [x * sx + tx, y * sy + ty]; // → [lon, lat]
  });
});

const arcPoints = (i) => (i >= 0 ? arcs[i] : arcs[~i].slice().reverse());

const ringPoints = (ring) => {
  const pts = [];
  for (const i of ring) {
    const seg = arcPoints(i);
    pts.push(...(pts.length ? seg.slice(1) : seg)); // adjacent arcs share an endpoint
  }
  return pts;
};

/* ── Collect CONUS counties ─────────────────────────────────────────── */

const counties = [];

for (const g of topo.objects.counties.geometries) {
  const fips = g.id;
  if (!fips || EXCLUDE.has(fips.slice(0, 2))) continue;
  const st = STATE_BY_FIPS[fips.slice(0, 2)];
  if (!st) continue;

  const polys =
    g.type === 'Polygon'        ? [g.arcs]
    : g.type === 'MultiPolygon' ? g.arcs
    : null;
  if (!polys) continue;

  counties.push({
    fips,
    st,
    name: g.properties?.name ?? fips,
    polys: polys.map((poly) => poly.map(ringPoints)), // lon/lat rings
  });
}

/* ── Artifact 1: WKT outlines for the SSURGO harvester ──────────────── */

const MAX_PTS = 60; // SDA rejects very long WKT; 60 points traces a county closely enough

const wkt = {};

for (const c of counties) {
  // Use the largest ring (the mainland body of the county), simplified.
  const biggest = c.polys
    .map((p) => p[0])
    .sort((a, b) => b.length - a.length)[0];
  if (!biggest || biggest.length < 4) continue;

  const step = Math.max(1, Math.ceil(biggest.length / MAX_PTS));
  const pts = biggest.filter((_, i) => i % step === 0);
  if (pts.length < 4) continue;
  pts.push(pts[0]); // close the ring

  wkt[c.fips] = {
    name: c.name,
    st: c.st,
    wkt: `polygon((${pts.map(([x, y]) => `${x.toFixed(4)} ${y.toFixed(4)}`).join(',')}))`,
  };
}

writeFileSync(new URL('../src/data/countyGeom.json', import.meta.url), JSON.stringify({ wkt }));
console.log(`${Object.keys(wkt).length} county WKT outlines → src/data/countyGeom.json`);

/* ── Artifact 2: projected SVG paths ────────────────────────────────── */

let minX = Infinity, minY = Infinity, maxX = -Infinity, maxY = -Infinity;

const projected = counties.map((c) => ({
  ...c,
  polys: c.polys.map((poly) =>
    poly.map((ring) =>
      ring.map(([lon, lat]) => {
        const { x, y } = toAlbers(lon, lat);
        if (x < minX) minX = x;
        if (x > maxX) maxX = x;
        if (y < minY) minY = y;
        if (y > maxY) maxY = y;
        return [x, y];
      })
    )
  ),
}));

const W = 960;
const k = W / (maxX - minX);
const H = Math.round((maxY - minY) * k);

// Quantize to whole pixels of the 960px-wide viewBox. One pixel at this scale is about 4.5 km
// on the ground — far finer than a county — so the shapes are visually identical, but snapping
// to the grid collapses long runs of near-duplicate points and cuts the payload by ~5x.
// The SVG scales up cleanly regardless, since the browser interpolates the path.
const r1 = (v) => Math.round(v);

const paths = {};
const states = {};

for (const c of projected) {
  let d = '';
  for (const poly of c.polys) {
    for (const ring of poly) {
      if (ring.length < 3) continue;
      let seg = '';
      let px = null, py = null;
      for (const [x, y] of ring) {
        const sxp = r1((x - minX) * k);
        const syp = r1((maxY - y) * k); // Albers y grows north; SVG y grows down
        if (sxp === px && syp === py) continue; // drop points that collapse under rounding
        seg += `${seg ? 'L' : 'M'}${sxp} ${syp}`;
        px = sxp; py = syp;
      }
      if (seg) d += seg + 'Z';
    }
  }
  if (!d) continue;
  paths[c.fips] = d;
  states[c.fips] = c.st;
}

const out = { width: W, height: H, paths, states };
writeFileSync(new URL('../src/data/countyPaths.json', import.meta.url), JSON.stringify(out));

const kb = (JSON.stringify(out).length / 1024).toFixed(0);
console.log(`${Object.keys(paths).length} county paths → src/data/countyPaths.json`);
console.log(`viewBox 0 0 ${W} ${H} · ${kb} KB`);
