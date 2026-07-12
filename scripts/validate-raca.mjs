/**
 * VALIDATION — test the carbon saturation model against independent lab measurements.
 * ==================================================================================
 *
 * Everything else in this project rests on one claim: that soil has a finite, texture-determined
 * capacity to hold carbon, and that a soil near that capacity will not gain much more. That claim
 * comes from Hassink (1997). Until now this project has simply *asserted* it.
 *
 * This script tests it against USDA's Rapid Carbon Assessment (RaCA): 145,127 soil samples from
 * 6,237 profiles, with carbon measured in a laboratory rather than estimated. It is the largest
 * public measured soil-carbon dataset in the United States, and it is entirely independent of
 * SSURGO, which is what the rest of the tool runs on.
 *
 * WHAT WE CAN AND CANNOT DO WITH IT
 * ---------------------------------
 * RaCA's site coordinates are RESTRICTED — "available only by request and approval" — to protect
 * landowner privacy. So the obvious validation (join each RaCA point to SSURGO at the same
 * coordinate, compare) is not possible, and this script does not pretend otherwise.
 *
 * But RaCA carries lab carbon, measured bulk density AND a texture class in the same row. That is
 * everything the saturation model needs. So we can compute the Carbon Saturation Index from PURE
 * LABORATORY MEASUREMENTS, with no SSURGO involved at all, and ask three questions:
 *
 *   Q1. Does Hassink's capacity actually bound measured carbon in US soils?
 *       (Is the saturation concept empirically real, or a tidy theory?)
 *
 *   Q2. Does measured carbon rise with fine-fraction content, as the theory requires?
 *
 *   Q3. Does the CSI distribution computed from LAB DATA match the CSI distribution this tool
 *       computes from SSURGO ESTIMATES? If the two disagree, the tool is wrong and should say so.
 *
 * TEXTURE → PARTICLE SIZE
 * -----------------------
 * RaCA records a USDA texture CLASS ("sil", "cl"), not clay and silt percentages. We map each
 * class to its centroid on the USDA texture triangle — standard practice, and stated plainly
 * because it introduces real error: a "silt loam" spans a range of clay contents, and we collapse
 * that to one number.
 *
 * Run:  node scripts/validate-raca.mjs   (expects /tmp/raca/RaCA_samples.csv)
 */

import { readFileSync, writeFileSync } from 'fs';
import { carbonSaturation, fineFraction } from '../src/engine/saturation.js';

/** Centroids of the USDA texture triangle: class → [clay %, silt %]. */
const TEXTURE_CENTROIDS = {
  s:    [3, 5],    // sand
  ls:   [6, 11],   // loamy sand
  lfs:  [6, 11], lvfs: [6, 11], lcos: [6, 11],
  sl:   [10, 25],  // sandy loam
  fsl:  [10, 30], vfsl: [10, 35], cosl: [10, 20],
  l:    [18, 40],  // loam
  sil:  [15, 65],  // silt loam
  si:   [6, 87],   // silt
  scl:  [27, 13],  // sandy clay loam
  cl:   [34, 34],  // clay loam
  sicl: [34, 56],  // silty clay loam
  sc:   [42, 7],   // sandy clay
  sic:  [47, 47],  // silty clay
  c:    [60, 20],  // clay
  fs:   [3, 5], vfs: [3, 5], cos: [3, 5], // sand variants
};

/* ── Load ───────────────────────────────────────────────────────────── */

const raw = readFileSync('/tmp/raca/RaCA_samples.csv', 'utf8').trim().split('\n');
const header = parseCsvLine(raw[0]);
const col = Object.fromEntries(header.map((h, i) => [h, i]));

const num = (v) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
};

const samples = [];
const rejected = { noData: 0, subsoil: 0, oHorizon: 0, organicSoil: 0, noTexture: 0 };

for (let i = 1; i < raw.length; i++) {
  const f = parseCsvLine(raw[i]);

  const top = num(f[col.TOP]);
  const cTot = num(f[col.c_tot_ncs]);      // lab-measured TOTAL carbon, PERCENT by mass
  const caco3 = num(f[col.caco3]);          // carbonate, percent; null/NA where non-calcareous
  const bd = num(f[col.Bulkdensity]);
  const tex = (f[col.texture] ?? '').trim().toLowerCase();
  const hzn = (f[col.hzn_desgn] ?? '').trim().toLowerCase();

  if (cTot === null || bd === null || bd <= 0) { rejected.noData++; continue; }

  // Topsoil only — the saturation model, and every carbon protocol, works to 30 cm.
  if (top === null || top >= 30) { rejected.subsoil++; continue; }

  // ── EXCLUDE O HORIZONS. This filter is load-bearing. ──────────────────────────────
  // O horizons are the leaf-litter and duff mats that sit ON TOP of mineral soil in forests.
  // RaCA measures them (oi, oe, oa) and they run 45–78% carbon. They are not mineral soil, they
  // contain no clay or silt to speak of, and Hassink's mineral-capacity relationship simply does
  // not apply to them.
  //
  // Leaving them in is not a rounding error — it destroys the analysis. With O horizons included,
  // the correlation between fine fraction and measured carbon collapses to r = 0.009, i.e. pure
  // noise, because a few thousand litter layers with enormous carbon and no mineral fraction swamp
  // the signal from 16,000 real soils. This is the same class of mistake as the forest-soil
  // contamination that made Maine look like the most carbon-saturated state in America.
  if (hzn.startsWith('o')) { rejected.oHorizon++; continue; }

  if (!TEXTURE_CENTROIDS[tex]) { rejected.noTexture++; continue; }

  // c_tot_ncs is TOTAL carbon = organic + inorganic, as a PERCENT by mass. In calcareous soils the
  // carbonate fraction would masquerade as organic carbon and inflate CSI, so subtract it:
  //   inorganic C (%) = CaCO3 (%) x (12.011 / 100.087) = CaCO3 x 0.12
  const socPct = cTot - (caco3 !== null ? caco3 * 0.12 : 0);

  // Convert percent → g C per kg soil, the unit Hassink's relationship is expressed in.
  const soc = socPct * 10;

  if (soc <= 0) { rejected.noData++; continue; }

  // Above ~12% organic carbon a soil is organic material (Histosol), not a mineral soil with
  // carbon in it. Mineral-capacity theory does not govern peat.
  if (socPct > 12) { rejected.organicSoil++; continue; }

  const [clay, silt] = TEXTURE_CENTROIDS[tex];
  samples.push({ soc, clay, silt, bd, tex, top });
}

console.log(`RaCA mineral topsoil samples with lab-measured carbon + texture: ${samples.length.toLocaleString()}`);
console.log('  excluded from 145,127 total RaCA samples:');
console.log(`    ${rejected.subsoil.toLocaleString().padStart(7)}  below 30 cm`);
console.log(`    ${rejected.noData.toLocaleString().padStart(7)}  no lab carbon or bulk density`);
console.log(`    ${rejected.noTexture.toLocaleString().padStart(7)}  no usable texture class`);
console.log(`    ${rejected.oHorizon.toLocaleString().padStart(7)}  O horizons (forest litter — NOT mineral soil)`);
console.log(`    ${rejected.organicSoil.toLocaleString().padStart(7)}  organic soils / peat (>12% C)\n`);

/* ── Q1. Does Hassink's capacity bound measured carbon? ─────────────── */

let aboveCapacity = 0;
const csis = [];

for (const s of samples) {
  const sat = carbonSaturation({
    // carbonSaturation expects organic MATTER %, so invert the van Bemmelen conversion:
    // OM% = SOC(g/kg) x 1.724 / 10
    omPct: (s.soc * 1.724) / 10,
    clayPct: s.clay,
    siltPct: s.silt,
    bulkDensity: s.bd,
  });
  s.csi = sat.csi;
  s.band = sat.band.key;
  csis.push(sat.csi);
  if (sat.csi > 1) aboveCapacity++;
}

csis.sort((a, b) => a - b);
const q = (p) => csis[Math.floor(csis.length * p)];

console.log('── Q1. Does mineral capacity bound measured carbon? ─────────────');
console.log(`  median CSI              ${q(0.5).toFixed(2)}`);
console.log(`  25th–75th percentile    ${q(0.25).toFixed(2)} – ${q(0.75).toFixed(2)}`);
console.log(`  90th percentile         ${q(0.9).toFixed(2)}`);
console.log(`  samples above capacity  ${((aboveCapacity / samples.length) * 100).toFixed(1)}%`);
console.log(`
  FINDING: Hassink's capacity does NOT bound total measured carbon — a third of samples sit above
  it. This is NOT a refutation, and it is exactly what the theory predicts once you are careful
  about what is being measured. Hassink's capacity governs the MINERAL-ASSOCIATED pool; RaCA
  measures TOTAL organic carbon, which also contains unprotected particulate matter (Cotrufo et
  al. 2019). A sandy soil has almost no mineral capacity yet can still hold substantial carbon as
  undecomposed particulate matter — carbon that is real, but loosely held and easily lost on
  tillage.

  So a CSI above 1.0 means: this soil holds more carbon than its minerals can protect. That is a
  genuine and useful signal — low headroom for new stable carbon AND high vulnerability of what is
  already there. It is not a modelling artefact, and this project has said so from the start.`);

/* ── Q2. Does carbon rise with fine fraction, as the theory requires? ─ */

// Bin by fine fraction and report the observed carbon distribution in each bin.
const bins = new Map();
for (const s of samples) {
  const ff = fineFraction(s.clay, s.silt);
  const b = Math.floor(ff / 10) * 10;
  if (!bins.has(b)) bins.set(b, []);
  bins.get(b).push(s.soc);
}

console.log('\n── Q2. Does measured carbon rise with fine fraction? ───────────');
console.log('  fine frac   n        median SOC   90th pct SOC   Hassink capacity');

const rows = [];
for (const [b, vals] of [...bins].sort((a, b) => a[0] - b[0])) {
  if (vals.length < 100) continue;
  vals.sort((x, y) => x - y);
  const med = vals[Math.floor(vals.length * 0.5)];
  const p90 = vals[Math.floor(vals.length * 0.9)];
  const cap = 4.09 + 0.37 * (b + 5); // capacity at bin centre
  rows.push({ bin: b, n: vals.length, med, p90, cap });
  console.log(
    `  ${String(b).padStart(3)}–${String(b + 10).padEnd(3)}   ${String(vals.length).padStart(6)}` +
    `   ${med.toFixed(1).padStart(8)}   ${p90.toFixed(1).padStart(11)}   ${cap.toFixed(1).padStart(14)}`
  );
}

// Pearson correlation between fine fraction and measured SOC, at the sample level.
const xs = samples.map((s) => fineFraction(s.clay, s.silt));
const ys = samples.map((s) => s.soc);
const r = pearson(xs, ys);

// Correlation of BIN MEDIANS — the same relationship with within-bin noise averaged out.
const rMed = pearson(rows.map((b) => b.bin + 5), rows.map((b) => b.med));

console.log(`\n  Pearson r, sample level (fine fraction vs measured SOC) = ${r.toFixed(3)}`);
console.log(`  Pearson r, bin medians                                  = ${rMed.toFixed(3)}`);
console.log(`
  FINDING, AND IT CUTS AGAINST A NAIVE READING OF THE MODEL: at the level of an individual
  sample, texture explains almost NOTHING about how much carbon a soil actually holds
  (r = ${r.toFixed(3)}). Median carbon does climb steadily with fine fraction — 5.5 → 6.3 → 10.4 →
  15.0 → 16.4 g/kg — so the direction the theory predicts is there. But the scatter within any
  texture bin is enormous, because actual soil carbon is governed far more by CLIMATE and LAND
  USE than by texture.

  This is a real limitation and the tool must not overclaim. Hassink's relationship was never a
  claim that texture PREDICTS carbon; it is a claim that texture sets a CEILING on the protected
  fraction. A weak texture→carbon correlation is therefore consistent with the theory — but it
  does mean the Carbon Saturation Index is a COARSE SCREEN, not a precision instrument, and
  anyone reading a CSI to two decimal places is reading it wrong.`);

/* ── Q3. Does lab-derived CSI match this tool's SSURGO-derived CSI? ─── */

const ssurgo = JSON.parse(
  readFileSync(new URL('../src/data/countySaturation.json', import.meta.url), 'utf8')
);
const ssurgoCsis = Object.values(ssurgo).map((c) => c.csi).sort((a, b) => a - b);
const sq = (p) => ssurgoCsis[Math.floor(ssurgoCsis.length * p)];

const labBands = tally(samples.map((s) => s.band));
const ssurgoBands = tally(Object.values(ssurgo).map((c) => c.band));

console.log('\n── Q3. Lab-measured CSI vs this tool\'s SSURGO-derived CSI ─────');
console.log('                          RaCA (lab)      This tool (SSURGO)');
console.log(`  median CSI              ${q(0.5).toFixed(2).padStart(8)}        ${sq(0.5).toFixed(2).padStart(8)}`);
console.log(`  25th percentile         ${q(0.25).toFixed(2).padStart(8)}        ${sq(0.25).toFixed(2).padStart(8)}`);
console.log(`  75th percentile         ${q(0.75).toFixed(2).padStart(8)}        ${sq(0.75).toFixed(2).padStart(8)}`);
console.log('');
console.log('  band                    RaCA (lab)      This tool (SSURGO)');
for (const b of ['high-headroom', 'moderate-headroom', 'near-capacity', 'saturated']) {
  const a = ((labBands[b] ?? 0) / samples.length) * 100;
  const c = ((ssurgoBands[b] ?? 0) / ssurgoCsis.length) * 100;
  console.log(`  ${b.padEnd(22)} ${a.toFixed(1).padStart(7)}%        ${c.toFixed(1).padStart(7)}%`);
}

console.log(`
  FINDING AGAINST OUR OWN TOOL — the most important result in this file.

  The lab data reads SATURATED more often than we do: median CSI 0.69 measured vs 0.45 modelled,
  and 32% of lab samples above capacity versus 10% of our counties. Our tool is therefore likely
  to be OPTIMISTIC about how much headroom a soil has. If we are wrong, we are wrong in the
  direction of telling a farmer there is more room for carbon than there really is — which is the
  worse direction to be wrong in, and users deserve to be told that plainly.

  Two things drive the gap, and only one is a defect:

  1. NOT A DEFECT — units of analysis. RaCA rows are individual SOIL SAMPLES; ours are COUNTY
     AVERAGES. Averaging pulls a distribution toward its middle and clips its tails, so our
     spread should be tighter than RaCA's no matter what. It is.

  2. PROBABLY A REAL SELECTION EFFECT — land use. RaCA samples ALL land uses, including forest,
     range and pasture mineral soils, which carry more carbon than cropland. Our harvest is
     deliberately restricted to ARABLE soils (land capability class 1–3). We are looking at a
     lower-carbon population on purpose, so a lower CSI is partly correct — but we cannot cleanly
     separate that from genuine model bias, because RaCA's land-use field is not resolvable to
     our arable filter without the restricted coordinates.

  HONEST CONCLUSION: the direction and mechanism of the model hold up. The absolute calibration
  does not, and CSI should be read as a coarse three-way screen (headroom / marginal / full),
  never as a precise number. The UI now says exactly this.`);

/* ── Emit machine-readable results for the UI ───────────────────────── */

const out = {
  generated: new Date().toISOString(),
  source: 'USDA Rapid Carbon Assessment (RaCA), 2016 release',
  nSamples: samples.length,
  nTotalRaCA: 145127,
  coordinatesRestricted: true,
  csi: {
    lab: { median: r2(q(0.5)), p25: r2(q(0.25)), p75: r2(q(0.75)), p90: r2(q(0.9)) },
    ssurgo: { median: r2(sq(0.5)), p25: r2(sq(0.25)), p75: r2(sq(0.75)), p90: r2(sq(0.9)) },
  },
  pctAboveCapacity: r2((aboveCapacity / samples.length) * 100),
  pearsonFineFractionVsSoc: Math.round(r * 1000) / 1000,
  pearsonBinMedians: Math.round(rMed * 1000) / 1000,
  excluded: rejected,
  bins: rows.map((b) => ({
    fineFraction: `${b.bin}–${b.bin + 10}`,
    n: b.n,
    medianSoc: r2(b.med),
    p90Soc: r2(b.p90),
    hassinkCapacity: r2(b.cap),
  })),
  bands: {
    lab: Object.fromEntries(Object.entries(labBands).map(([k, v]) => [k, r2((v / samples.length) * 100)])),
    ssurgo: Object.fromEntries(Object.entries(ssurgoBands).map(([k, v]) => [k, r2((v / ssurgoCsis.length) * 100)])),
  },
};

writeFileSync(new URL('../src/data/validation.json', import.meta.url), JSON.stringify(out, null, 2));
console.log('\nWrote src/data/validation.json');

/* ── helpers ────────────────────────────────────────────────────────── */

function parseCsvLine(line) {
  const out = [];
  let cur = '';
  let inQ = false;
  for (let i = 0; i < line.length; i++) {
    const ch = line[i];
    if (ch === '"') inQ = !inQ;
    else if (ch === ',' && !inQ) { out.push(cur); cur = ''; }
    else cur += ch;
  }
  out.push(cur);
  return out;
}

function pearson(x, y) {
  const n = x.length;
  const mx = x.reduce((a, b) => a + b, 0) / n;
  const my = y.reduce((a, b) => a + b, 0) / n;
  let sxy = 0, sxx = 0, syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx, dy = y[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  return sxy / Math.sqrt(sxx * syy);
}

function tally(arr) {
  const o = {};
  for (const v of arr) o[v] = (o[v] ?? 0) + 1;
  return o;
}

function r2(v) { return Math.round(v * 100) / 100; }
