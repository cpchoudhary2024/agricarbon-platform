import { SOC_REF, F_LU, getFMGValue, F_IN, C_TO_CO2 } from '../data/ipccCoefficients';

/**
 * Calculate SOC sequestration potential using IPCC Tier 1 methodology
 * Formula: ΔSOC = (SOC_ref × F_LU × F_MG × F_IN - SOC_ref) × Area
 * CO2e = ΔSOC × 3.667 (conversion from C to CO₂)
 */
export const calculateSocSequestration = ({
  climateZone,
  cropType,
  tillage,
  inputs,
  area,
  years = 20
}) => {
  try {
    // Get reference SOC value
    const socRefData = SOC_REF[climateZone];
    if (!socRefData) throw new Error(`Invalid climate zone: ${climateZone}`);

    // Get land use factor
    const fLuData = F_LU[cropType];
    if (!fLuData) throw new Error(`Invalid crop type: ${cropType}`);

    // Get management factor (climate-specific)
    const fMgData = getFMGValue(climateZone, tillage);
    if (!fMgData) throw new Error(`Invalid tillage practice: ${tillage}`);

    // Get input factor
    const fInData = F_IN[inputs];
    if (!fInData) throw new Error(`Invalid input level: ${inputs}`);

    // Extract central values
    const socRef = socRefData.value;
    const fLu = fLuData.value;
    const fMg = fMgData.value;
    const fIn = fInData.value;

    // Calculate ΔSOC (change in soil organic carbon) per hectare
    // Formula: (SOC_ref × F_LU × F_MG × F_IN - SOC_ref) × Area
    const deltaSocPerHa = (socRef * fLu * fMg * fIn - socRef);
    const deltaSocTotal = deltaSocPerHa * area;

    // Convert to CO₂ equivalent
    const co2ePerHaPerYear = deltaSocPerHa * C_TO_CO2;
    const co2eTotalPerYear = deltaSocTotal * C_TO_CO2;
    const co2eTotal = co2eTotalPerYear * years;

    // Calculate uncertainty ranges (using standard error propagation)
    // For multiplicative factors: Δ(A×B) ≈ √(A²×ΔB² + B²×ΔA²)
    const socRefUncertainty = socRefData.uncertainty / socRef;
    const fLuUncertainty = fLuData.uncertainty / fLu;
    const fMgUncertainty = fMgData.uncertainty / fMg;
    const fInUncertainty = fInData.uncertainty / fIn;

    // Combined relative uncertainty
    const combinedUncertaintyPercentage = Math.sqrt(
      socRefUncertainty ** 2 +
      fLuUncertainty ** 2 +
      fMgUncertainty ** 2 +
      fInUncertainty ** 2
    );

    const deltaSocTotalUncertainty = Math.abs(deltaSocTotal * combinedUncertaintyPercentage);
    const co2eTotalUncertainty = Math.abs(co2eTotal * combinedUncertaintyPercentage);

    return {
      // Primary results
      co2eTotal: parseFloat(co2eTotal.toFixed(2)),
      co2eTotalUncertainty: parseFloat(co2eTotalUncertainty.toFixed(2)),
      co2ePerHaPerYear: parseFloat(co2ePerHaPerYear.toFixed(4)),
      deltaSocPerHa: parseFloat(deltaSocPerHa.toFixed(4)),

      // Detailed breakdown
      socRef,
      fLu,
      fMg,
      fIn,
      area,
      years,
      
      // For comparisons
      deltaSocTotal: parseFloat(deltaSocTotal.toFixed(2)),
      co2eTotalPerYear: parseFloat(co2eTotalPerYear.toFixed(2))
    };
  } catch (error) {
    console.error('Calculation error:', error);
    throw error;
  }
};

/**
 * Calculate the SOC stock for a single land-use state (no delta yet).
 * Returns the equilibrium SOC stock (t C ha⁻¹) and derived values.
 */
export const calculateSocStock = ({ climateZone, cropType, tillage, inputs }) => {
  const socRef = SOC_REF[climateZone]?.value;
  const fLu    = F_LU[cropType]?.value;
  const fMg    = getFMGValue(climateZone, tillage)?.value;
  const fIn    = F_IN[inputs]?.value;
  if (!socRef || !fLu || !fMg || !fIn) throw new Error('Invalid parameters');
  return { socStock: socRef * fLu * fMg * fIn, socRef, fLu, fMg, fIn };
};

/**
 * Baseline vs Scenario delta — the correct model for real farms already in production.
 * ΔSOC/ha = SOC_scenario − SOC_baseline  (t C ha⁻¹ per IPCC 20-yr equilibrium period)
 * CO₂e    = ΔSOC × area × 3.667 × (years/20) capped at 20-yr IPCC horizon
 */
export const calculateDelta = ({
  climateZone,
  area,
  years = 20,
  baseline: { cropType: bCrop, tillage: bTill, inputs: bIn },
  scenario: { cropType: sCrop, tillage: sTill, inputs: sIn },
  carbonPrice = 0,
}) => {
  const base = calculateSocStock({ climateZone, cropType: bCrop, tillage: bTill, inputs: bIn });
  const scen = calculateSocStock({ climateZone, cropType: sCrop, tillage: sTill, inputs: sIn });

  const deltaSocPerHa = scen.socStock - base.socStock;
  const timeScale     = Math.min(years, 20) / 20;
  const co2ePerHa     = deltaSocPerHa * C_TO_CO2 * timeScale;
  const co2eTotal     = co2ePerHa * area;

  // Uncertainty: propagate from each factor's relative uncertainty
  const relUncBase = Math.sqrt(
    (SOC_REF[climateZone].uncertainty / base.socRef) ** 2 +
    (F_LU[bCrop].uncertainty / base.fLu) ** 2 +
    (getFMGValue(climateZone, bTill).uncertainty / base.fMg) ** 2 +
    (F_IN[bIn].uncertainty / base.fIn) ** 2
  );
  const relUncScen = Math.sqrt(
    (SOC_REF[climateZone].uncertainty / scen.socRef) ** 2 +
    (F_LU[sCrop].uncertainty / scen.fLu) ** 2 +
    (getFMGValue(climateZone, sTill).uncertainty / scen.fMg) ** 2 +
    (F_IN[sIn].uncertainty / scen.fIn) ** 2
  );
  const co2eUncertainty = Math.abs(co2eTotal) * Math.sqrt(relUncBase ** 2 + relUncScen ** 2);

  // Trajectory: cumulative CO₂e at each integer year (linear ramp to equilibrium)
  const trajectory = Array.from({ length: Math.min(years, 20) + 1 }, (_, yr) => ({
    year: yr,
    co2e: parseFloat((co2ePerHa * area * (yr / Math.min(years, 20))).toFixed(2)),
  }));

  const marketValue = carbonPrice > 0 ? co2eTotal * carbonPrice : null;

  return {
    baselineSocStock: parseFloat(base.socStock.toFixed(4)),
    scenarioSocStock: parseFloat(scen.socStock.toFixed(4)),
    deltaSocPerHa:    parseFloat(deltaSocPerHa.toFixed(4)),
    co2eTotal:        parseFloat(co2eTotal.toFixed(2)),
    co2eUncertainty:  parseFloat(co2eUncertainty.toFixed(2)),
    co2ePerHaPerYear: parseFloat((co2ePerHa / Math.min(years, 20)).toFixed(4)),
    trajectory,
    marketValue:      marketValue !== null ? parseFloat(marketValue.toFixed(2)) : null,
    // Pass-through for report generation
    inputs: { climateZone, area, years, baseline: { cropType: bCrop, tillage: bTill, inputs: bIn }, scenario: { cropType: sCrop, tillage: sTill, inputs: sIn }, carbonPrice },
    factors: { base, scen },
  };
};

/**
 * Calculate results for all management practices (for comparison chart)
 */
export const calculateAllTillagePractices = ({
  climateZone,
  cropType,
  inputs,
  area,
  years = 20
}) => {
  const tillageOptions = ['full-tillage', 'reduced-tillage', 'no-till'];
  return tillageOptions.map(tillage => {
    const result = calculateSocSequestration({
      climateZone,
      cropType,
      tillage,
      inputs,
      area,
      years
    });
    return {
      name: ['Full Tillage', 'Reduced Tillage', 'No-Till'][tillageOptions.indexOf(tillage)],
      value: result.co2eTotal,
      uncertainty: result.co2eTotalUncertainty,
      practice: tillage
    };
  });
};

/**
 * Calculate results for all input levels (for comparison chart)
 */
export const calculateAllInputLevels = ({
  climateZone,
  cropType,
  tillage,
  area,
  years = 20
}) => {
  const inputOptions = ['low', 'medium', 'high', 'high-manure'];
  return inputOptions.map(input => {
    const result = calculateSocSequestration({
      climateZone,
      cropType,
      tillage,
      inputs: input,
      area,
      years
    });
    return {
      name: ['Low', 'Medium', 'High', 'High + Manure'][inputOptions.indexOf(input)],
      value: result.co2eTotal,
      uncertainty: result.co2eTotalUncertainty,
      input
    };
  });
};

// ─── Co-benefits (rule-based scoring 0–100) ───────────────────────────────
const TILLAGE_SCORE  = { 'full-tillage': 0, 'reduced-tillage': 55, 'no-till': 100 };
const INPUT_SCORE    = { 'low': 0, 'medium': 40, 'high': 72, 'high-manure': 100 };
const CROP_SCORE     = { 'annual-crops': 20, 'perennial-crops': 90, 'perennial-grass': 90, 'paddy-rice': 10, 'set-aside': 85, 'long-term-cultivated': 35 };

export const calculateCoBenefits = ({ baseline, scenario }) => {
  const d = (key, store) => (store[scenario[key]] ?? 50) - (store[baseline[key]] ?? 50);

  const dTill = d('tillage',  TILLAGE_SCORE);
  const dIn   = d('inputs',   INPUT_SCORE);
  const dCrop = d('cropType', CROP_SCORE);

  const clamp = v => Math.round(Math.min(100, Math.max(-100, v)));

  return {
    waterRetention:    clamp(dTill * 0.45 + dIn  * 0.30 + dCrop * 0.25),
    erosionProtection: clamp(dTill * 0.55 + dCrop * 0.35 + dIn  * 0.10),
    biodiversity:      clamp(dCrop * 0.50 + dIn  * 0.30 + dTill * 0.20),
    yieldStability:    clamp(dIn   * 0.45 + dTill * 0.35 + dCrop * 0.20),
    soilHealth:        clamp(dTill * 0.35 + dIn  * 0.35 + dCrop * 0.30),
  };
};

// ─── Carbon market eligibility ────────────────────────────────────────────
export const getMarketEligibility = (co2eTotal) => {
  const abs = Math.abs(co2eTotal);
  if (abs < 100)  return { tier: 'sub-threshold', label: 'Aggregation Required', color: '#A08070', note: 'Below 100 t — join a farmer aggregation programme to access voluntary markets.' };
  if (abs < 1000) return { tier: 'voluntary-small', label: 'Voluntary Market Eligible', color: '#B8900D', note: 'Plan Vivo or Gold Standard Landscape are best fits. Aggregation may improve economics.' };
  if (abs < 5000) return { tier: 'voluntary-mid', label: 'Verra VCS / Gold Standard', color: '#4A7C59', note: 'Direct registration likely viable. Engage a Validation & Verification Body (VVB) for Tier 2 soil sampling.' };
  return { tier: 'institutional', label: 'Institutional / Compliance Scale', color: '#2D5A3D', note: 'At this scale, compliance markets (Article 6 bilateral agreements) and institutional buyers become accessible.' };
};

// ─── Best single-change recommendation ────────────────────────────────────
export const getBestUpgrade = (climateZone, baseline) => {
  const candidates = [
    { change: 'Switch to No-Till', desc: 'Eliminates soil disturbance, rebuilds aggregate structure.', params: { ...baseline, tillage: 'no-till' } },
    { change: 'Add Organic Amendments', desc: 'Manure or compost significantly boosts F_IN factor.', params: { ...baseline, inputs: 'high-manure' } },
    { change: 'Convert to Perennial Crops', desc: 'Permanent root systems deliver the highest long-term SOC gains.', params: { ...baseline, cropType: 'perennial-crops' } },
    { change: 'Reduced Tillage + High Input', desc: 'Combined tillage reduction with improved residue management.', params: { ...baseline, tillage: 'reduced-tillage', inputs: 'high' } },
  ];

  const baseStock = calculateSocStock({ climateZone, cropType: baseline.cropType, tillage: baseline.tillage, inputs: baseline.inputs });

  const scored = candidates.map(c => {
    try {
      const s = calculateSocStock({ climateZone, ...c.params });
      return { ...c, delta: s.socStock - baseStock.socStock };
    } catch { return { ...c, delta: 0 }; }
  }).filter(c => c.delta > 0);

  scored.sort((a, b) => b.delta - a.delta);
  return scored[0] ?? null;
};
