// Net Present Value and related financial metrics for carbon farming projects.
// All monetary values in USD. Area in hectares.

export function calcNPV(discountRate, cashflows) {
  return cashflows.reduce((sum, cf, t) => sum + cf / Math.pow(1 + discountRate, t), 0);
}

// Newton-Raphson IRR approximation (returns null if no solution found)
export function calcIRR(cashflows, guess = 0.1) {
  let rate = guess;
  for (let i = 0; i < 200; i++) {
    const f  = cashflows.reduce((s, cf, t) => s + cf / Math.pow(1 + rate, t), 0);
    const df = cashflows.reduce((s, cf, t) => s - t * cf / Math.pow(1 + rate, t + 1), 0);
    if (Math.abs(df) < 1e-12) break;
    const next = rate - f / df;
    if (Math.abs(next - rate) < 1e-7) return next;
    rate = next;
  }
  return null;
}

// Returns first year t where cumulative cashflow >= 0
export function calcPayback(cashflows) {
  let cumulative = 0;
  for (let t = 0; t < cashflows.length; t++) {
    cumulative += cashflows[t];
    if (cumulative >= 0) return t;
  }
  return null;
}

/**
 * Build a complete year-by-year financial model for a carbon farming project.
 *
 * @param {object} params
 *   area             – farm area in hectares
 *   co2ePerHaPerYear – annual sequestration rate (t CO₂e/ha/yr) from main calculator
 *   carbonPrice      – USD / t CO₂e
 *   years            – projection horizon (1–20)
 *   implCosts        – {
 *     coverCropSeed,       coverCropTermination,  noTillDrill,
 *     laborAdjustment,     soilSampling,          certification
 *   }  (all per ha per year unless noted; certification is {upfront, annual})
 *   annualSubsidyPerHa   – USD / ha / yr (from subsidy checker)
 *   yieldImpact          – fraction of gross carbon revenue added/lost due to yield change (e.g. 0.05)
 *   discountRate         – e.g. 0.07 for 7%
 */
export function buildFinancialModel({
  area,
  co2ePerHaPerYear,
  carbonPrice,
  years,
  implCosts,
  annualSubsidyPerHa = 0,
  yieldImpact = 0,
  discountRate = 0.07,
}) {
  const {
    coverCropSeed        = 0,
    coverCropTermination = 0,
    noTillDrill          = 0,
    laborAdjustment      = 0, // negative = savings
    soilSampling         = 0, // every 5 years; we prorate
    certification        = { upfront: 12000, annual: 2500 },
  } = implCosts || {};

  // Annual implementation cost per hectare (cover crops, termination, labor, etc.)
  const annualImplPerHa = coverCropSeed + coverCropTermination + noTillDrill + laborAdjustment + (soilSampling / 5);
  const annualImplTotal = annualImplPerHa * area;

  const certUpfront = certification.upfront || 12000;
  const certAnnual  = certification.annual  || 2500;

  const rows = [];
  const cashflows = []; // for NPV/IRR

  // Year 0 — upfront costs, no revenue
  const year0CF = -(certUpfront + annualImplTotal);
  rows.push({
    year: 0,
    label: 'Year 0 (Setup)',
    carbonRevenue: 0,
    subsidyRevenue: 0,
    yieldEffect: 0,
    implCost: annualImplTotal,
    certCost: certUpfront,
    totalCost: annualImplTotal + certUpfront,
    netCashflow: year0CF,
    cumulativeNet: year0CF,
  });
  cashflows.push(year0CF);

  let cumNet = year0CF;

  for (let yr = 1; yr <= years; yr++) {
    const carbonRevenue   = co2ePerHaPerYear * area * carbonPrice;
    const subsidyRevenue  = annualSubsidyPerHa * area;
    const yieldEffect     = carbonRevenue * yieldImpact;
    const totalRevenue    = carbonRevenue + subsidyRevenue + yieldEffect;
    const totalCost       = annualImplTotal + certAnnual;
    const netCashflow     = totalRevenue - totalCost;
    cumNet               += netCashflow;

    rows.push({
      year: yr,
      label: `Year ${yr}`,
      carbonRevenue: parseFloat(carbonRevenue.toFixed(2)),
      subsidyRevenue: parseFloat(subsidyRevenue.toFixed(2)),
      yieldEffect: parseFloat(yieldEffect.toFixed(2)),
      implCost: parseFloat(annualImplTotal.toFixed(2)),
      certCost: parseFloat(certAnnual.toFixed(2)),
      totalCost: parseFloat(totalCost.toFixed(2)),
      netCashflow: parseFloat(netCashflow.toFixed(2)),
      cumulativeNet: parseFloat(cumNet.toFixed(2)),
    });
    cashflows.push(netCashflow);
  }

  const npv       = calcNPV(discountRate, cashflows);
  const irr       = calcIRR(cashflows);
  const payback   = calcPayback(cashflows);
  const totalGrossRevenue = rows.slice(1).reduce((s, r) => s + r.carbonRevenue + r.subsidyRevenue + r.yieldEffect, 0);
  const totalCosts        = rows.reduce((s, r) => s + r.totalCost, 0);

  return {
    rows,
    cashflows,
    npv: parseFloat(npv.toFixed(2)),
    irr: irr != null ? parseFloat((irr * 100).toFixed(2)) : null,
    paybackYear: payback,
    totalGrossRevenue: parseFloat(totalGrossRevenue.toFixed(2)),
    totalCosts: parseFloat(totalCosts.toFixed(2)),
    totalNet: parseFloat((totalGrossRevenue - totalCosts).toFixed(2)),
    discountRate,
    area,
    years,
  };
}

// Alternative investment comparison benchmarks (10-yr annualized returns, approximate)
export const INVESTMENT_BENCHMARKS = [
  { label: 'S&P 500 (equities)',    rate: 0.103, color: '#1e40af', type: 'market' },
  { label: '10-yr US Treasury',     rate: 0.045, color: '#0891b2', type: 'market' },
  { label: 'Real Estate (REITs)',   rate: 0.082, color: '#7c3aed', type: 'market' },
  { label: 'USDA FSA Farm Loans',   rate: 0.055, color: '#92400E', type: 'market' },
  { label: 'Carbon Farming (this)', rate: null,  color: '#155233', type: 'project' },
];
