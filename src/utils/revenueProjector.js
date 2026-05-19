// Carbon Credit Revenue Projector
// Builds a year-by-year cashflow given the user's CO₂e trajectory and
// a chosen carbon price. Also estimates a break-even point against a
// supplied (or default) up-front certification & monitoring cost.

// Indicative typical USD costs for small/medium projects (Verra VCS,
// Gold Standard, Plan Vivo bundled). Used only if user does not provide
// their own up-front cost figure.
const DEFAULT_UPFRONT_COST_USD = 12000; // validation + baseline soil sampling
const DEFAULT_ANNUAL_MRV_USD   = 2500;  // monitoring, reporting, verification

export function projectRevenue({
  trajectory,         // [{ year, co2e (cumulative tonnes) }, ...]
  carbonPrice,        // USD per tonne CO₂e
  upfrontCost = DEFAULT_UPFRONT_COST_USD,
  annualMrv   = DEFAULT_ANNUAL_MRV_USD,
}) {
  if (!trajectory?.length || !(carbonPrice > 0)) return null;

  let prevCumulative = 0;
  let cumulativeRevenue = 0;
  let cumulativeCost = upfrontCost;
  let breakEvenYear = null;

  const rows = trajectory.map((pt, i) => {
    const yearlyCO2e   = Math.max(0, pt.co2e - prevCumulative);
    const yearlyGross  = yearlyCO2e * carbonPrice;
    const yearlyCost   = i === 0 ? upfrontCost + annualMrv : annualMrv;
    const yearlyNet    = yearlyGross - yearlyCost;
    cumulativeRevenue += yearlyGross;
    cumulativeCost    += i === 0 ? annualMrv : annualMrv; // upfront already added
    const cumulativeNet = cumulativeRevenue - cumulativeCost;
    if (breakEvenYear === null && cumulativeNet >= 0 && pt.year > 0) {
      breakEvenYear = pt.year;
    }
    prevCumulative = pt.co2e;
    return {
      year: pt.year,
      co2eCumulative: parseFloat(pt.co2e.toFixed(2)),
      co2eYearly:     parseFloat(yearlyCO2e.toFixed(2)),
      grossRevenue:   parseFloat(yearlyGross.toFixed(2)),
      costs:          parseFloat(yearlyCost.toFixed(2)),
      netCashflow:    parseFloat(yearlyNet.toFixed(2)),
      cumulativeNet:  parseFloat(cumulativeNet.toFixed(2)),
    };
  });

  const totalGross = cumulativeRevenue;
  const totalCost  = cumulativeCost;
  const totalNet   = totalGross - totalCost;

  return {
    rows,
    totalGross: parseFloat(totalGross.toFixed(2)),
    totalCost:  parseFloat(totalCost.toFixed(2)),
    totalNet:   parseFloat(totalNet.toFixed(2)),
    breakEvenYear,
    upfrontCost,
    annualMrv,
    carbonPrice,
  };
}

export function revenueCsv(projection, meta = {}) {
  if (!projection) return '';
  const header = [
    `# AgriCarbon — Carbon Credit Revenue Projection`,
    `# Carbon price: $${projection.carbonPrice}/t CO₂e`,
    `# Up-front cost (validation + baseline): $${projection.upfrontCost}`,
    `# Annual MRV cost: $${projection.annualMrv}`,
    meta.climateZone ? `# Climate zone: ${meta.climateZone}` : null,
    meta.area        ? `# Farm area: ${meta.area} ha`        : null,
    `# Break-even year: ${projection.breakEvenYear ?? 'not reached within horizon'}`,
    `# Total gross revenue: $${projection.totalGross.toLocaleString()}`,
    `# Total costs: $${projection.totalCost.toLocaleString()}`,
    `# Total net: $${projection.totalNet.toLocaleString()}`,
    ``,
    `Year,Cumulative_CO2e_t,Annual_CO2e_t,Gross_Revenue_USD,Costs_USD,Net_Cashflow_USD,Cumulative_Net_USD`,
  ].filter(Boolean).join('\n');

  const body = projection.rows.map(r =>
    [r.year, r.co2eCumulative, r.co2eYearly, r.grossRevenue, r.costs, r.netCashflow, r.cumulativeNet].join(',')
  ).join('\n');

  return header + '\n' + body + '\n';
}

export function downloadRevenueCsv(projection, meta = {}) {
  const csv = revenueCsv(projection, meta);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `agricarbon-revenue-projection-${Date.now()}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}
