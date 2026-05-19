// Sensitivity Analysis — One-At-a-Time (OAT) Tornado method.
// For each input parameter (climate zone, crop, tillage, inputs) we
// recompute the scenario ΔSOC while holding every OTHER input fixed at
// the user's choice, then sweep the parameter across its full range to
// find the min / max CO₂e outcome it produces. The width of each bar
// reveals which decision moves the needle most — standard practice in
// LCA, energy modelling, and IPCC-style assessments.

import { calculateDelta } from './carbonCalc';
import { SOC_REF, F_LU } from '../data/ipccCoefficients';

const TILLAGE_OPTIONS = ['full-tillage', 'reduced-tillage', 'no-till'];
const INPUT_OPTIONS   = ['low', 'medium', 'high', 'high-manure'];
const CLIMATE_OPTIONS = Object.keys(SOC_REF);
const CROP_OPTIONS    = Object.keys(F_LU);

const LABELS = {
  climate: 'Climate Zone',
  crop:    'Crop / Land Use',
  tillage: 'Tillage Practice',
  inputs:  'Organic Input Level',
};

const PARAM_COLORS = {
  climate: '#2D5A3D',
  crop:    '#4A7C59',
  tillage: '#B8900D',
  inputs:  '#C4694A',
};

function safeCalc(opts) {
  try { return calculateDelta(opts).co2eTotal; } catch { return null; }
}

export function tornadoAnalysis({ climateZone, area, years, baseline, scenario, carbonPrice }) {
  const central = safeCalc({ climateZone, area, years, baseline, scenario, carbonPrice });
  if (central == null) return null;

  const sweep = (paramKey, options, applyTo) => {
    const results = options.map(val => {
      const cfg = { climateZone, area, years, baseline: { ...baseline }, scenario: { ...scenario }, carbonPrice };
      if (paramKey === 'climate') cfg.climateZone = val;
      else if (applyTo === 'scenario') cfg.scenario[paramKey] = val;
      const v = safeCalc(cfg);
      return { val, value: v };
    }).filter(r => r.value != null);

    if (!results.length) return null;
    const lo = results.reduce((a, b) => a.value < b.value ? a : b);
    const hi = results.reduce((a, b) => a.value > b.value ? a : b);
    return {
      name: LABELS[paramKey === 'climate' ? 'climate' : paramKey === 'cropType' ? 'crop' : paramKey],
      color: PARAM_COLORS[paramKey === 'climate' ? 'climate' : paramKey === 'cropType' ? 'crop' : paramKey],
      lowValue:  lo.value,
      highValue: hi.value,
      lowChoice:  lo.val,
      highChoice: hi.val,
      range: Math.abs(hi.value - lo.value),
      deltaFromCentralLow:  lo.value - central,
      deltaFromCentralHigh: hi.value - central,
    };
  };

  const rows = [
    sweep('climate',  CLIMATE_OPTIONS, null),
    sweep('cropType', CROP_OPTIONS,    'scenario'),
    sweep('tillage',  TILLAGE_OPTIONS, 'scenario'),
    sweep('inputs',   INPUT_OPTIONS,   'scenario'),
  ].filter(Boolean);

  // Sort by widest range — that's a tornado plot.
  rows.sort((a, b) => b.range - a.range);

  const maxRange = rows[0]?.range || 1;
  const maxAbsDelta = Math.max(
    ...rows.flatMap(r => [Math.abs(r.deltaFromCentralLow), Math.abs(r.deltaFromCentralHigh)]),
    1,
  );

  return { central, rows, maxRange, maxAbsDelta };
}
