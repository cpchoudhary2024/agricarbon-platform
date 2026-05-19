/**
 * Generate CSV content for results download
 */
export const generateResultsCSV = (inputs, results, comparisons) => {
  const lines = [];

  // Header
  lines.push('AgriCarbon Estimator - Results Export');
  lines.push('');

  // Metadata
  lines.push(`Export Date,${new Date().toISOString()}`);
  lines.push('');

  // Input Parameters
  lines.push('INPUT PARAMETERS');
  lines.push(`Climate Zone,"${inputs.climateZone}"`);
  lines.push(`Crop Type,"${inputs.cropType}"`);
  lines.push(`Tillage Practice,"${inputs.tillage}"`);
  lines.push(`Organic Input Level,"${inputs.inputs}"`);
  lines.push(`Farm Area (ha),${inputs.area}`);
  lines.push(`Project Duration (years),${inputs.years}`);
  lines.push('');

  // Results
  lines.push('RESULTS');
  lines.push(`Total CO₂e Sequestered (tonnes),"${results.co2eTotal}"`);
  lines.push(`Uncertainty Range (±),"${results.co2eTotalUncertainty}"`);
  lines.push(`Per Hectare Annual Rate (t CO₂e/ha/yr),"${results.co2ePerHaPerYear}"`);
  lines.push(`Annual Total (t CO₂e/yr),"${results.co2eTotalPerYear}"`);
  lines.push(`Change in SOC per Hectare (t C/ha),"${results.deltaSocPerHa}"`);
  lines.push('');

  // Equivalencies
  lines.push('CLIMATE IMPACT EQUIVALENCIES');
  lines.push(`Trees Planted Equivalent,"${results.treesEquivalent}"`);
  lines.push(`Cars Off Road Equivalent (years),"${results.carsEquivalent}"`);
  lines.push('');

  // IPCC Coefficients Used
  lines.push('IPCC COEFFICIENTS USED');
  lines.push(`SOC Reference (t C/ha),${results.socRef}`);
  lines.push(`F_LU (Land Use Factor),${results.fLu}`);
  lines.push(`F_MG (Management Factor),${results.fMg}`);
  lines.push(`F_IN (Input Factor),${results.fIn}`);
  lines.push('');

  // Methodology Notes
  lines.push('METHODOLOGY NOTES');
  lines.push('This analysis uses IPCC 2006 Tier 1 methodology from:');
  lines.push('IPCC (2006). 2006 IPCC Guidelines for National Greenhouse Gas Inventories,');
  lines.push('Volume 4: Agriculture, Forestry and Other Land Use. Chapter 2.');
  lines.push('');
  lines.push('IMPORTANT LIMITATIONS:');
  lines.push('- Results represent Tier 1 estimates using default global coefficients');
  lines.push('- For project-level carbon credits, Tier 2 or 3 with local soil sampling is required');
  lines.push('- 20-year time horizon per IPCC default');
  lines.push('- Permanence assumes continued maintenance of practices');
  lines.push('- Uncertainty ranges reflect published IPCC variability');
  lines.push('');

  // Citation
  lines.push('HOW TO CITE THESE RESULTS');
  lines.push('AgriCarbon Estimator (2024). Soil carbon sequestration estimate [Calculator].');
  lines.push('Retrieved from https://agricarbon.estimator.local');
  lines.push('Based on IPCC (2006) Vol.4 Ch.2 methodology.');

  return lines.join('\n');
};

/**
 * Trigger CSV download
 */
export const downloadCSV = (csvContent, filename = 'agricarbon-results.csv') => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
