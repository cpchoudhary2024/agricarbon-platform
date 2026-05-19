const CROP_LABEL = {
  'annual-crops':      'annual crops',
  'perennial-crops':   'perennial / tree crops',
  'perennial-grass':   'perennial grassland',
  'paddy-rice':        'paddy rice',
  'set-aside':         'set-aside / fallow land',
  'long-term-cultivated': 'long-term cultivated land',
};
const TILLAGE_LABEL = {
  'full-tillage':    'conventional full tillage',
  'reduced-tillage': 'reduced tillage',
  'no-till':         'no-till / direct seeding',
};
const INPUT_LABEL = {
  'low':         'low organic inputs',
  'medium':      'medium inputs',
  'high':        'high organic inputs',
  'high-manure': 'high inputs with manure',
};

// Common carbon equivalencies
const CAR_TONNES_PER_YEAR      = 4.6;   // average petrol car
const TREE_TONNES_PER_10_YEARS = 0.22;  // one tree over 10 years
const FLIGHT_TONNES_RTN_NYC    = 1.7;   // return economy London–New York
const HOME_ELEC_YEAR           = 1.5;   // average UK home electricity/year

export function generateFarmerSummary(result) {
  const { inputs, baselineSocStock, scenarioSocStock, deltaSocPerHa,
          co2eTotal, co2eUncertainty, trajectory, marketValue } = result;
  const { climateZone, area, years, baseline, scenario, carbonPrice } = inputs;

  const bCrop   = CROP_LABEL[baseline.cropType]   ?? baseline.cropType;
  const bTill   = TILLAGE_LABEL[baseline.tillage]  ?? baseline.tillage;
  const bIn     = INPUT_LABEL[baseline.inputs]     ?? baseline.inputs;
  const sCrop   = CROP_LABEL[scenario.cropType]    ?? scenario.cropType;
  const sTill   = TILLAGE_LABEL[scenario.tillage]  ?? scenario.tillage;
  const sIn     = INPUT_LABEL[scenario.inputs]     ?? scenario.inputs;

  const isGain  = deltaSocPerHa > 0;
  const absTotal = Math.abs(co2eTotal);

  // Equivalencies (only show if meaningful numbers)
  const cars    = Math.round(absTotal / CAR_TONNES_PER_YEAR);
  const trees   = Math.round(absTotal / TREE_TONNES_PER_10_YEARS);
  const flights = Math.round(absTotal / FLIGHT_TONNES_RTN_NYC);
  const homes   = Math.round(absTotal / HOME_ELEC_YEAR);

  // Mid-point trajectory value (Year 10)
  const midPoint = trajectory.find(p => p.year === 10)?.co2e ?? null;

  return {
    headline: isGain
      ? `Your soil can lock away ${co2eTotal.toFixed(0)} extra tonnes of CO₂`
      : `This change would reduce your soil's carbon storage`,

    story: isGain
      ? buildGainStory({ bCrop, bTill, bIn, sCrop, sTill, sIn, area, years,
          baselineSocStock, scenarioSocStock, deltaSocPerHa, co2eTotal,
          co2eUncertainty, midPoint, cars, trees, flights, homes,
          marketValue, carbonPrice })
      : buildLossStory({ bCrop, bTill, bIn, sCrop, sTill, sIn, area,
          deltaSocPerHa, co2eTotal }),

    bullets: isGain ? buildBullets({ cars, trees, flights, homes, absTotal }) : [],
    isGain,
  };
}

function buildGainStory({ bCrop, bTill, bIn, sCrop, sTill, sIn, area, years,
    baselineSocStock, scenarioSocStock, deltaSocPerHa, co2eTotal,
    co2eUncertainty, midPoint, cars, trees, marketValue, carbonPrice }) {

  const pct = baselineSocStock > 0
    ? (((scenarioSocStock - baselineSocStock) / baselineSocStock) * 100).toFixed(1)
    : '—';

  let story = `Right now, your ${bCrop} grown under ${bTill} with ${bIn} stores roughly `
    + `${baselineSocStock.toFixed(1)} tonnes of carbon per hectare in the soil. `
    + `By switching to ${sTill} with ${sIn}, your soil would store `
    + `${scenarioSocStock.toFixed(1)} tonnes per hectare — that is `
    + `${Math.abs(deltaSocPerHa).toFixed(2)} tonnes more per hectare, `
    + `a ${pct}% improvement in carbon storage. `;

  story += `Across your ${area} hectare${area !== 1 ? 's' : ''} over ${years} years, `
    + `this management change could remove approximately ${co2eTotal.toFixed(0)} tonnes `
    + `of CO₂ from the atmosphere (±${co2eUncertainty.toFixed(0)} t uncertainty). `;

  if (midPoint !== null && years > 10) {
    story += `By the halfway mark — Year 10 — you would already have sequestered `
      + `around ${midPoint.toFixed(0)} tonnes. `;
  }

  story += `Every tonne of carbon your soil gains makes your land more drought-resistant, `
    + `less prone to erosion, and more productive season after season, `
    + `because carbon-rich soil holds more water and feeds more microbial life.`;

  if (marketValue && carbonPrice) {
    story += ` At a carbon price of $${carbonPrice}/tonne, this sequestration could generate `
      + `up to $${marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} USD `
      + `in additional farm income through voluntary carbon markets.`;
  }

  return story;
}

function buildLossStory({ bCrop, bTill, bIn, sCrop, sTill, sIn, area,
    deltaSocPerHa, co2eTotal }) {
  return `Your current practice — ${bTill} with ${bIn} growing ${bCrop} — actually stores `
    + `more carbon per hectare than the planned scenario using ${sTill} with ${sIn}. `
    + `The planned change would reduce carbon storage by ${Math.abs(deltaSocPerHa).toFixed(3)} `
    + `tonnes per hectare, releasing approximately ${Math.abs(co2eTotal).toFixed(0)} tonnes `
    + `of CO₂ equivalent across your ${area} hectares over the selected time period. `
    + `Try adjusting the Scenario panel — switching to no-till and higher organic inputs typically `
    + `delivers the largest carbon gains from any starting point.`;
}

function buildBullets({ cars, trees, flights, homes, absTotal }) {
  const bullets = [];
  if (cars > 0)    bullets.push(`Taking ${cars.toLocaleString()} petrol car${cars > 1 ? 's' : ''} off the road for a full year`);
  if (trees > 0)   bullets.push(`Planting ${trees.toLocaleString()} trees and letting them grow for 10 years`);
  if (flights > 0) bullets.push(`Offsetting ${flights.toLocaleString()} return flights from London to New York`);
  if (homes > 0)   bullets.push(`Powering ${homes.toLocaleString()} average home${homes > 1 ? 's' : ''} with clean electricity for a year`);
  return bullets;
}
