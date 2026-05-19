// IPCC 2006 Guidelines for National GHG Inventories, Volume 4, Chapter 2
// All values must match published tables exactly

// SOC_REF VALUES (t C/ha, to 0–30cm depth) — IPCC Table 2.3
export const SOC_REF = {
  'tropical-moist': {
    value: 65,
    uncertainty: 14,
    label: 'Tropical moist'
  },
  'tropical-dry': {
    value: 38,
    uncertainty: 12,
    label: 'Tropical dry'
  },
  'tropical-montane': {
    value: 50,
    uncertainty: 13,
    label: 'Tropical montane'
  },
  'warm-temperate-moist': {
    value: 88,
    uncertainty: 25,
    label: 'Warm temperate moist'
  },
  'warm-temperate-dry': {
    value: 50,
    uncertainty: 12,
    label: 'Warm temperate dry'
  },
  'cool-temperate-moist': {
    value: 95,
    uncertainty: 24,
    label: 'Cool temperate moist'
  },
  'cool-temperate-dry': {
    value: 50,
    uncertainty: 14,
    label: 'Cool temperate dry'
  },
  'boreal': {
    value: 115,
    uncertainty: 26,
    label: 'Boreal'
  }
};

// F_LU FACTORS (land use) — IPCC Table 2.4
export const F_LU = {
  'annual-crops': {
    value: 1.00,
    uncertainty: 0.05,
    label: 'Annual crops (reference)'
  },
  'long-term-cultivated': {
    value: 0.82,
    uncertainty: 0.07,
    label: 'Long-term cultivated'
  },
  'paddy-rice': {
    value: 1.10,
    uncertainty: 0.08,
    label: 'Paddy rice'
  },
  'perennial-crops': {
    value: 1.00,
    uncertainty: 0.05,
    label: 'Perennial/tree crops'
  },
  'perennial-grass': {
    value: 1.00,
    uncertainty: 0.05,
    label: 'Perennial grassland'
  },
  'set-aside': {
    value: 0.93,
    uncertainty: 0.06,
    label: 'Set-aside (<20 years)'
  }
};

// F_MG FACTORS (management) — IPCC Table 2.5
// Values shown are for tropical moist; actual values vary by climate zone
export const F_MG = {
  'full-tillage': {
    'tropical-moist': { value: 1.00, uncertainty: 0.06 },
    'tropical-dry': { value: 1.00, uncertainty: 0.06 },
    'tropical-montane': { value: 1.00, uncertainty: 0.06 },
    'warm-temperate-moist': { value: 1.00, uncertainty: 0.06 },
    'warm-temperate-dry': { value: 1.00, uncertainty: 0.06 },
    'cool-temperate-moist': { value: 1.00, uncertainty: 0.06 },
    'cool-temperate-dry': { value: 1.00, uncertainty: 0.06 },
    'boreal': { value: 1.00, uncertainty: 0.06 },
    label: 'Full tillage (reference)'
  },
  'reduced-tillage': {
    'tropical-moist': { value: 1.08, uncertainty: 0.08 },
    'tropical-dry': { value: 1.05, uncertainty: 0.07 },
    'tropical-montane': { value: 1.06, uncertainty: 0.07 },
    'warm-temperate-moist': { value: 1.09, uncertainty: 0.08 },
    'warm-temperate-dry': { value: 1.06, uncertainty: 0.07 },
    'cool-temperate-moist': { value: 1.11, uncertainty: 0.09 },
    'cool-temperate-dry': { value: 1.07, uncertainty: 0.07 },
    'boreal': { value: 1.09, uncertainty: 0.08 },
    label: 'Reduced tillage'
  },
  'no-till': {
    'tropical-moist': { value: 1.15, uncertainty: 0.09 },
    'tropical-dry': { value: 1.12, uncertainty: 0.09 },
    'tropical-montane': { value: 1.13, uncertainty: 0.09 },
    'warm-temperate-moist': { value: 1.18, uncertainty: 0.10 },
    'warm-temperate-dry': { value: 1.14, uncertainty: 0.09 },
    'cool-temperate-moist': { value: 1.23, uncertainty: 0.11 },
    'cool-temperate-dry': { value: 1.17, uncertainty: 0.10 },
    'boreal': { value: 1.20, uncertainty: 0.10 },
    label: 'No-till'
  }
};

// F_IN FACTORS (inputs) — IPCC Table 2.6
export const F_IN = {
  'low': {
    value: 0.92,
    uncertainty: 0.08,
    label: 'Low (below average residues, no amendments)'
  },
  'medium': {
    value: 1.00,
    uncertainty: 0.05,
    label: 'Medium (average)'
  },
  'high': {
    value: 1.11,
    uncertainty: 0.08,
    label: 'High (above average residues OR manure)'
  },
  'high-manure': {
    value: 1.17,
    uncertainty: 0.10,
    label: 'High with manure (both)'
  }
};

// Conversion factor: C to CO₂ equivalent
export const C_TO_CO2 = 3.667;

// Utility function to get F_MG value for specific climate and management
export const getFMGValue = (climate, management) => {
  return F_MG[management]?.[climate] || F_MG[management]?.['tropical-moist'];
};
