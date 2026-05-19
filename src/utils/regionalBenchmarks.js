// Regional benchmark ranges for ΔSOC (t C ha⁻¹ yr⁻¹) — synthesised from
// IPCC AR6 WG3 Ch.7, FAO RECSOIL, and meta-analyses of agricultural
// sequestration rates by climate zone. Values are conservative midpoints
// of the published equilibrium ranges, scaled to per-hectare per-year.
//
// All values are POSITIVE annual SOC accrual potentials a typical
// improved-practice farm in that climate zone achieves on average.

const ZONE_BENCHMARKS = {
  'tropical-moist':       { mean: 0.45, low: 0.20, high: 0.85, label: 'Tropical Moist' },
  'tropical-dry':         { mean: 0.25, low: 0.10, high: 0.50, label: 'Tropical Dry' },
  'tropical-montane':     { mean: 0.38, low: 0.18, high: 0.70, label: 'Tropical Montane' },
  'warm-temperate-moist': { mean: 0.55, low: 0.25, high: 1.10, label: 'Warm Temperate Moist' },
  'warm-temperate-dry':   { mean: 0.30, low: 0.12, high: 0.60, label: 'Warm Temperate Dry' },
  'cool-temperate-moist': { mean: 0.65, low: 0.30, high: 1.30, label: 'Cool Temperate Moist' },
  'cool-temperate-dry':   { mean: 0.35, low: 0.15, high: 0.70, label: 'Cool Temperate Dry' },
  'boreal':               { mean: 0.40, low: 0.18, high: 0.90, label: 'Boreal' },
};

// National-scale benchmark (global agricultural land average, FAO 2021).
const GLOBAL_AVG = 0.40; // t C ha⁻¹ yr⁻¹

const C_TO_CO2 = 3.667;

export function getBenchmark(climateZone, userDeltaSocPerHaPerYear) {
  const zone = ZONE_BENCHMARKS[climateZone];
  if (!zone) return null;

  const userVal = Math.abs(userDeltaSocPerHaPerYear);
  const ratioRegion = zone.mean > 0 ? userVal / zone.mean : 0;
  const ratioGlobal = GLOBAL_AVG > 0 ? userVal / GLOBAL_AVG : 0;

  // Percentile estimate within the zone's published range
  let percentile;
  if      (userVal <= zone.low)              percentile = 10;
  else if (userVal >= zone.high)             percentile = 95;
  else {
    const frac = (userVal - zone.low) / (zone.high - zone.low);
    percentile = Math.round(10 + frac * 85);
  }

  let verdict, color;
  if      (ratioRegion >= 1.5) { verdict = 'Exceptional — top performer for your region'; color = '#2D5A3D'; }
  else if (ratioRegion >= 1.0) { verdict = 'Above the regional average';                  color = '#4A7C59'; }
  else if (ratioRegion >= 0.7) { verdict = 'Near the regional average';                   color = '#B8900D'; }
  else if (ratioRegion >  0)   { verdict = 'Below regional average — room to grow';      color = '#C4694A'; }
  else                         { verdict = 'Net carbon loss vs. regional baseline';      color = '#A0522D'; }

  return {
    zoneLabel: zone.label,
    regionMean: zone.mean,
    regionLow:  zone.low,
    regionHigh: zone.high,
    globalAvg:  GLOBAL_AVG,
    userValue:  parseFloat(userVal.toFixed(3)),
    userValueCO2e: parseFloat((userVal * C_TO_CO2).toFixed(3)),
    regionMeanCO2e: parseFloat((zone.mean * C_TO_CO2).toFixed(3)),
    ratioRegion: parseFloat(ratioRegion.toFixed(2)),
    ratioGlobal: parseFloat(ratioGlobal.toFixed(2)),
    percentile,
    verdict,
    color,
  };
}
