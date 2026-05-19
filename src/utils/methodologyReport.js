const LABEL = {
  climateZone: {
    'cool-temperate-moist': 'Cool Temperate Moist',
    'cool-temperate-dry':   'Cool Temperate Dry',
    'warm-temperate-moist': 'Warm Temperate Moist',
    'warm-temperate-dry':   'Warm Temperate Dry',
    'tropical-moist':       'Tropical Moist',
    'tropical-dry':         'Tropical Dry',
    'tropical-montane':     'Tropical Montane',
    'boreal':               'Boreal',
  },
  cropType: {
    'annual-crops':  'Annual Crops',
    'perennial-grass':'Perennial Grass',
    'paddy-rice':    'Paddy Rice',
    'set-aside':     'Set-Aside / Fallow',
  },
  tillage: {
    'full-tillage':    'Full Tillage (reference)',
    'reduced-tillage': 'Reduced Tillage',
    'no-till':         'No-Till / Direct Seeding',
  },
  inputs: {
    'low':          'Low Input',
    'medium':       'Medium Input',
    'high':         'High Input',
    'high-manure':  'High Input + Manure',
  },
};

const fmt = (v, dec = 2) => (typeof v === 'number' ? v.toFixed(dec) : '–');

export function generateMethodologyReport(result) {
  const { inputs, factors, baselineSocStock, scenarioSocStock, deltaSocPerHa,
          co2eTotal, co2eUncertainty, co2ePerHaPerYear, marketValue } = result;
  const { climateZone, area, years, baseline, scenario, carbonPrice } = inputs;
  const date = new Date().toISOString().split('T')[0];

  return `
═══════════════════════════════════════════════════════════════
 AGRICARBON ESTIMATOR — AUDIT-READY METHODOLOGY REPORT
 Generated: ${date}
═══════════════════════════════════════════════════════════════

METHODOLOGY BASIS
─────────────────
Standard      : IPCC 2006 Guidelines for National GHG Inventories
                Volume 4: Agriculture, Forestry and Other Land Use
                Chapter 2: Generic Methodologies Applicable to Multiple
                           Land-Use Categories (Tier 1)
Formula       : SOC = SOC_ref × F_LU × F_MG × F_IN
Delta         : ΔSOC/ha = SOC_scenario − SOC_baseline
CO₂e Factor   : 44/12 = 3.667 (IPCC standard C → CO₂ conversion)
Time Horizon  : ${Math.min(years, 20)} years (IPCC Tier 1 maximum: 20 yr)

PROJECT PARAMETERS
──────────────────
Climate Zone  : ${LABEL.climateZone[climateZone] ?? climateZone}
Area          : ${area} hectares

BASELINE STATE (Current Practice)
──────────────────────────────────
Crop / Land Use  : ${LABEL.cropType[baseline.cropType] ?? baseline.cropType}
Management       : ${LABEL.tillage[baseline.tillage] ?? baseline.tillage}
Input Level      : ${LABEL.inputs[baseline.inputs] ?? baseline.inputs}

  SOC_ref  = ${fmt(factors.base.socRef, 1)} t C ha⁻¹
  F_LU     = ${fmt(factors.base.fLu, 3)}
  F_MG     = ${fmt(factors.base.fMg, 3)}
  F_IN     = ${fmt(factors.base.fIn, 3)}
  ─────────────────────────────────
  SOC_baseline = ${fmt(baselineSocStock, 4)} t C ha⁻¹

SCENARIO STATE (Planned Intervention)
──────────────────────────────────────
Crop / Land Use  : ${LABEL.cropType[scenario.cropType] ?? scenario.cropType}
Management       : ${LABEL.tillage[scenario.tillage] ?? scenario.tillage}
Input Level      : ${LABEL.inputs[scenario.inputs] ?? scenario.inputs}

  SOC_ref  = ${fmt(factors.scen.socRef, 1)} t C ha⁻¹
  F_LU     = ${fmt(factors.scen.fLu, 3)}
  F_MG     = ${fmt(factors.scen.fMg, 3)}
  F_IN     = ${fmt(factors.scen.fIn, 3)}
  ─────────────────────────────────
  SOC_scenario = ${fmt(scenarioSocStock, 4)} t C ha⁻¹

RESULTS
───────
ΔSOC per hectare   : ${fmt(deltaSocPerHa, 4)} t C ha⁻¹
CO₂e per ha/yr     : ${fmt(co2ePerHaPerYear, 4)} t CO₂e ha⁻¹ yr⁻¹
Total CO₂e (${Math.min(years,20)} yr) : ${fmt(co2eTotal, 2)} t CO₂e ± ${fmt(co2eUncertainty, 2)} t CO₂e
Area × Period      : ${area} ha × ${Math.min(years,20)} yr${
    marketValue !== null
      ? `\nCarbon Price       : $${carbonPrice}/t CO₂e\nEstimated Value    : $${fmt(marketValue, 2)} USD`
      : ''
  }

UNCERTAINTY NOTE
────────────────
Uncertainty is propagated from IPCC Tier 1 published standard errors
for each coefficient (SOC_ref, F_LU, F_MG, F_IN) using the formula:
  σ_rel = √(σ_ref² + σ_LU² + σ_MG² + σ_IN²)  [root-sum-of-squares]

LIMITATIONS & CAVEATS
──────────────────────
• Tier 1 uses global default coefficients intended for national-scale
  screening. Results should NOT be used for project-level carbon credit
  certification without Tier 2 or Tier 3 local soil measurements.
• The 20-year equilibrium assumption may not reflect actual rates on
  specific soil types or management histories.
• Methane (CH₄) and nitrous oxide (N₂O) fluxes (particularly relevant
  for paddy rice and high-manure inputs) are NOT included in this SOC-
  only estimate.
• On-farm verification via direct soil sampling is required for any
  regulated carbon market registration (e.g., Verra VCS, Gold Standard).

═══════════════════════════════════════════════════════════════
 END OF REPORT — AgriCarbon Estimator (Open Source)
═══════════════════════════════════════════════════════════════
`.trim();
}
