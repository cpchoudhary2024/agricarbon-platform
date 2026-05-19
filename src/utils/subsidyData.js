// US Federal and State agricultural conservation payment estimates.
// Sources: USDA NRCS EQIP payment schedule FY2024-2025 (nrcs.usda.gov),
//          USDA FSA CSP payment tables (fsa.usda.gov),
//          Berkeley Carbon Trading Project state incentive survey 2024.
// All values in USD/acre/year unless noted. Convert to per-ha: ÷ 0.405.

// ─── FEDERAL PROGRAMS ─────────────────────────────────────────────

export const EQIP_PRACTICES = [
  {
    code: '340',
    name: 'Cover Crop',
    description: 'Annual planting of non-harvested cover crops to improve soil health and reduce erosion.',
    perAcreMin: 38,
    perAcreMax: 65,
    perAcreTypical: 50,
    eligiblePractices: ['cover-crops'],
    source: 'USDA NRCS EQIP Practice Code 340 — FY2025 Payment Schedule',
  },
  {
    code: '329',
    name: 'No-Till / Reduced Tillage',
    description: 'Eliminating or significantly reducing soil disturbance during crop establishment.',
    perAcreMin: 12,
    perAcreMax: 28,
    perAcreTypical: 20,
    eligiblePractices: ['no-till', 'reduced-tillage'],
    source: 'USDA NRCS EQIP Practice Code 329 — FY2025 Payment Schedule',
  },
  {
    code: '590',
    name: 'Nutrient Management',
    description: 'Developing and implementing a nutrient management plan to optimize inputs and reduce emissions.',
    perAcreMin: 8,
    perAcreMax: 22,
    perAcreTypical: 14,
    eligiblePractices: ['nutrient-management'],
    source: 'USDA NRCS EQIP Practice Code 590 — FY2025 Payment Schedule',
  },
  {
    code: '638',
    name: 'Water & Sediment Control Basin',
    description: 'Earthen embankment and water control structure to trap sediment and reduce runoff.',
    perAcreMin: 5,
    perAcreMax: 18,
    perAcreTypical: 10,
    eligiblePractices: ['water-management'],
    source: 'USDA NRCS EQIP Practice Code 638 — FY2025',
  },
  {
    code: '342',
    name: 'Critical Area Planting',
    description: 'Establishing permanent vegetative cover on highly erodible or disturbed areas.',
    perAcreMin: 25,
    perAcreMax: 80,
    perAcreTypical: 45,
    eligiblePractices: ['perennial-grass', 'set-aside'],
    source: 'USDA NRCS EQIP Practice Code 342 — FY2025',
  },
];

// EQIP: up to $450,000 per person over 6 years. Small/beginning farmers: 50% higher rates.
export const EQIP_META = {
  maxPayment6yr: 450000,
  contractLength: '1–10 years',
  paymentTiming: 'After practice implementation is verified',
  beginnerFarmerBonus: 0.5, // 50% higher payment rates
  eligibilityUrl: 'https://www.nrcs.usda.gov/programs-initiatives/eqip-environmental-quality-incentives',
  applicationDeadline: 'Continuous — local NRCS office sets ranking periods',
};

// CSP (Conservation Stewardship Program): 5-year contracts
export const CSP_TIERS = [
  {
    tier: 'Base',
    perAcreMin: 18,
    perAcreMax: 40,
    perAcreTypical: 28,
    description: 'Annual payment for existing conservation performance + stewardship activities.',
  },
  {
    tier: 'Enhancement — Cover Crops',
    perAcreMin: 20,
    perAcreMax: 55,
    perAcreTypical: 35,
    description: 'Supplemental payment for implementing a multi-species cover crop mix with documented grazing or green manure termination.',
  },
  {
    tier: 'Enhancement — No-Till + Residue Mgmt',
    perAcreMin: 15,
    perAcreMax: 38,
    perAcreTypical: 25,
    description: 'Supplemental payment for no-till combined with prescribed residue management thresholds.',
  },
  {
    tier: 'Enhancement — Soil Health',
    perAcreMin: 10,
    perAcreMax: 30,
    perAcreTypical: 18,
    description: 'Supplemental payment for adopting a comprehensive soil health management system.',
  },
];

export const CSP_META = {
  contractLength: '5 years',
  maxAnnualPayment: 40000, // per entity
  renewalEligible: true,
  eligibilityUrl: 'https://www.fsa.usda.gov/programs-and-services/conservation-programs/conservation-stewardship-program/',
};

// ─── STATE PROGRAMS ───────────────────────────────────────────────

export const STATE_PROGRAMS = {
  CA: {
    name: 'California',
    programs: [
      {
        name: 'Healthy Soils Program (CDFA)',
        perAcreMin: 40,
        perAcreMax: 100,
        perAcreTypical: 65,
        description: 'Incentive payments for implementing soil health practices. Cover crops: $40-100/ac. Compost application: $200-400/acre (one-time).',
        eligiblePractices: ['cover-crops', 'compost', 'no-till'],
        url: 'https://www.cdfa.ca.gov/oefi/healthysoils/',
      },
    ],
  },
  IA: {
    name: 'Iowa',
    programs: [
      {
        name: 'Iowa Nutrient Reduction Strategy — Cover Crop Cost-Share',
        perAcreMin: 15,
        perAcreMax: 30,
        perAcreTypical: 22,
        description: 'IDALS watershed improvement program cost-share for cover crop seed, planting, and termination.',
        eligiblePractices: ['cover-crops'],
        url: 'https://www.iowaagriculture.gov/NRS.asp',
      },
      {
        name: 'SOILMAN Cover Crop Initiative (Iowa Soybean Association)',
        perAcreMin: 5,
        perAcreMax: 10,
        perAcreTypical: 7,
        description: 'Flat rate per acre for enrolled cover crop acres. Limited annual funding.',
        eligiblePractices: ['cover-crops'],
        url: 'https://www.iasoybeans.com',
      },
    ],
  },
  IL: {
    name: 'Illinois',
    programs: [
      {
        name: 'Illinois Nutrient Loss Reduction Strategy Cover Crop Program',
        perAcreMin: 15,
        perAcreMax: 35,
        perAcreTypical: 25,
        description: 'County-level cost-share through IDOA and local SWCDs for cover crop seed and establishment.',
        eligiblePractices: ['cover-crops'],
        url: 'https://www2.illinois.gov/sites/agr/Pages/SoilWater.aspx',
      },
    ],
  },
  MN: {
    name: 'Minnesota',
    programs: [
      {
        name: 'BWSR Soil Health Cost-Share',
        perAcreMin: 20,
        perAcreMax: 50,
        perAcreTypical: 35,
        description: 'Board of Water and Soil Resources grants for cover crops, no-till, and perennial systems. Amount varies by county and practice.',
        eligiblePractices: ['cover-crops', 'no-till', 'perennial-grass'],
        url: 'https://bwsr.state.mn.us/',
      },
    ],
  },
  OH: {
    name: 'Ohio',
    programs: [
      {
        name: 'Ohio H2Ohio Cover Crop Program',
        perAcreMin: 18,
        perAcreMax: 40,
        perAcreTypical: 28,
        description: 'Targeted payments in priority watersheds. Cover crops prioritized for Lake Erie phosphorus reduction.',
        eligiblePractices: ['cover-crops'],
        url: 'https://h2.ohio.gov/',
      },
    ],
  },
  IN: {
    name: 'Indiana',
    programs: [
      {
        name: 'Indiana Office of Community and Rural Affairs — Clean Water Indiana',
        perAcreMin: 15,
        perAcreMax: 30,
        perAcreTypical: 20,
        description: 'Watershed-focused cost-share for cover crops and nutrient management.',
        eligiblePractices: ['cover-crops', 'nutrient-management'],
        url: 'https://www.in.gov/ocra/',
      },
    ],
  },
  NY: {
    name: 'New York',
    programs: [
      {
        name: 'NY Soil and Water Conservation Committee — Agricultural Environmental Management',
        perAcreMin: 20,
        perAcreMax: 55,
        perAcreTypical: 35,
        description: 'AEM program provides technical and financial assistance for soil health and nutrient management practices.',
        eligiblePractices: ['cover-crops', 'no-till', 'nutrient-management'],
        url: 'https://www.nys-soilandwater.org/',
      },
    ],
  },
  PA: {
    name: 'Pennsylvania',
    programs: [
      {
        name: 'PA Agriculture Conservation Assistance Program (ACAP)',
        perAcreMin: 25,
        perAcreMax: 60,
        perAcreTypical: 40,
        description: 'State-funded cost-share for Chesapeake Bay watershed practices including cover crops and conservation tillage.',
        eligiblePractices: ['cover-crops', 'no-till'],
        url: 'https://www.agriculture.pa.gov/',
      },
    ],
  },
  TX: {
    name: 'Texas',
    programs: [
      {
        name: 'Texas AgriLife Extension Cover Crop Cost-Share',
        perAcreMin: 10,
        perAcreMax: 25,
        perAcreTypical: 15,
        description: 'County-level SWCD programs. Funding and rates vary widely by county; contact local SWCD office.',
        eligiblePractices: ['cover-crops'],
        url: 'https://www.texasagrilife.org/',
      },
    ],
  },
  KS: {
    name: 'Kansas',
    programs: [
      {
        name: 'Kansas Water Plan — Conservation Practices',
        perAcreMin: 10,
        perAcreMax: 25,
        perAcreTypical: 18,
        description: 'State water plan funded cost-share for practices that improve water quality and soil health.',
        eligiblePractices: ['cover-crops', 'no-till'],
        url: 'https://www.kdhe.ks.gov/',
      },
    ],
  },
  NE: {
    name: 'Nebraska',
    programs: [
      {
        name: 'Nebraska Natural Resources District Programs',
        perAcreMin: 10,
        perAcreMax: 30,
        perAcreTypical: 20,
        description: 'Natural Resources Districts offer locally-funded cost-share. Rates vary by NRD and available funding.',
        eligiblePractices: ['cover-crops', 'no-till', 'nutrient-management'],
        url: 'https://www.nrdnet.org/',
      },
    ],
  },
  MI: {
    name: 'Michigan',
    programs: [
      {
        name: 'MI Agriculture Environmental Assurance Program (MAEAP)',
        perAcreMin: 15,
        perAcreMax: 35,
        perAcreTypical: 22,
        description: 'Certification-based program providing technical assistance. Some counties offer direct cost-share through conservation districts.',
        eligiblePractices: ['cover-crops', 'nutrient-management'],
        url: 'https://www.michigan.gov/mdard/farms/conservation',
      },
    ],
  },
  WI: {
    name: 'Wisconsin',
    programs: [
      {
        name: 'Wisconsin Land and Water Conservation Grant',
        perAcreMin: 20,
        perAcreMax: 45,
        perAcreTypical: 30,
        description: 'County-administered grants for cover crops, no-till, and manure management. Administered by DATCP.',
        eligiblePractices: ['cover-crops', 'no-till'],
        url: 'https://datcp.wi.gov/',
      },
    ],
  },
  CO: {
    name: 'Colorado',
    programs: [
      {
        name: 'Colorado Agriculture Conservation Program',
        perAcreMin: 10,
        perAcreMax: 30,
        perAcreTypical: 18,
        description: 'State-level CDPHE and CDA programs for dryland cover crops. Limited funding; contact local SWCD.',
        eligiblePractices: ['cover-crops'],
        url: 'https://cdphe.colorado.gov/',
      },
    ],
  },
  OR: {
    name: 'Oregon',
    programs: [
      {
        name: 'Oregon Department of Agriculture — Conservation Incentive Grant',
        perAcreMin: 20,
        perAcreMax: 50,
        perAcreTypical: 32,
        description: 'Grants for cover crops, no-till, and perennial systems. Priority on Willamette Valley and Eastern Oregon dryland wheat systems.',
        eligiblePractices: ['cover-crops', 'no-till', 'perennial-grass'],
        url: 'https://www.oregon.gov/ODA/',
      },
    ],
  },
  WA: {
    name: 'Washington',
    programs: [
      {
        name: 'WA Conservation Commission — Voluntary Stewardship Program',
        perAcreMin: 15,
        perAcreMax: 40,
        perAcreTypical: 25,
        description: 'Voluntary Stewardship Program for critical areas. Additional wheat commission programs for eastern WA dryland systems.',
        eligiblePractices: ['cover-crops', 'no-till'],
        url: 'https://scc.wa.gov/programs/voluntary-stewardship-program/',
      },
    ],
  },
  OTHER: {
    name: 'Other State',
    programs: [
      {
        name: 'Contact Your Local NRCS / SWCD Office',
        perAcreMin: 0,
        perAcreMax: 30,
        perAcreTypical: 15,
        description: 'Most states have county-level Soil and Water Conservation District (SWCD) cost-share programs. Payment rates vary by county, funding availability, and practice. Contact your local NRCS office to get accurate current rates.',
        eligiblePractices: ['cover-crops', 'no-till', 'nutrient-management'],
        url: 'https://www.nrcs.usda.gov/contact/find-a-service-center',
      },
    ],
  },
};

// ─── Eligibility estimator ─────────────────────────────────────────

/**
 * Returns estimated annual subsidy payments for a given farm configuration.
 * @param {object} params
 *   state          – 2-letter US state code (or 'OTHER')
 *   areaHa         – farm area in hectares
 *   practices      – array of practice keys (e.g. ['cover-crops', 'no-till'])
 *   beginnerFarmer – boolean; triggers EQIP 50% bonus
 */
export function estimateSubsidies({ state = 'OTHER', areaHa = 1, practices = [], beginnerFarmer = false }) {
  const areaAc = areaHa / 0.405;

  // Federal EQIP
  const eqipPractices = EQIP_PRACTICES.filter(p =>
    p.eligiblePractices.some(ep => practices.includes(ep))
  );
  const eqipAnnual = eqipPractices.reduce((sum, p) => {
    const base = p.perAcreTypical * areaAc;
    return sum + (beginnerFarmer ? base * (1 + EQIP_META.beginnerFarmerBonus) : base);
  }, 0);

  // Cap EQIP at 6-year limit / 6
  const eqipAnnualCapped = Math.min(eqipAnnual, EQIP_META.maxPayment6yr / 6);

  // CSP base + applicable enhancements
  const cspBase = CSP_TIERS[0].perAcreTypical * areaAc;
  const cspEnhancements = [];
  if (practices.includes('cover-crops'))
    cspEnhancements.push(CSP_TIERS[1].perAcreTypical * areaAc);
  if (practices.includes('no-till') || practices.includes('reduced-tillage'))
    cspEnhancements.push(CSP_TIERS[2].perAcreTypical * areaAc);
  const cspAnnual = Math.min(
    cspBase + cspEnhancements.reduce((s, v) => s + v, 0),
    CSP_META.maxAnnualPayment
  );

  // State programs
  const stateProg = STATE_PROGRAMS[state] || STATE_PROGRAMS.OTHER;
  const stateAnnual = stateProg.programs
    .filter(p => p.eligiblePractices.some(ep => practices.includes(ep)))
    .reduce((sum, p) => sum + p.perAcreTypical * areaAc, 0);

  const totalAnnual = eqipAnnualCapped + cspAnnual + stateAnnual;
  const perHaAnnual = totalAnnual / areaHa;

  return {
    eqip:      { annual: parseFloat(eqipAnnualCapped.toFixed(0)), practices: eqipPractices },
    csp:       { annual: parseFloat(cspAnnual.toFixed(0)) },
    state:     { annual: parseFloat(stateAnnual.toFixed(0)), programs: stateProg.programs },
    totalAnnual: parseFloat(totalAnnual.toFixed(0)),
    perHaAnnual: parseFloat(perHaAnnual.toFixed(2)),
    areaAc:    parseFloat(areaAc.toFixed(1)),
    stateLabel: stateProg.name,
  };
}

export const US_STATES = [
  ['CA', 'California'], ['IA', 'Iowa'], ['IL', 'Illinois'],
  ['MN', 'Minnesota'], ['OH', 'Ohio'], ['IN', 'Indiana'],
  ['NY', 'New York'], ['PA', 'Pennsylvania'], ['TX', 'Texas'],
  ['KS', 'Kansas'], ['NE', 'Nebraska'], ['MI', 'Michigan'],
  ['WI', 'Wisconsin'], ['CO', 'Colorado'], ['OR', 'Oregon'],
  ['WA', 'Washington'], ['OTHER', 'Other / Not Listed'],
];

export const PRACTICE_OPTIONS = [
  { key: 'cover-crops',        label: 'Cover Crops' },
  { key: 'no-till',            label: 'No-Till / Direct Seeding' },
  { key: 'reduced-tillage',    label: 'Reduced Tillage' },
  { key: 'nutrient-management',label: 'Nutrient Management Plan' },
  { key: 'perennial-grass',    label: 'Perennial Grassland' },
  { key: 'set-aside',          label: 'Set-Aside / Fallow' },
  { key: 'compost',            label: 'Compost Application' },
  { key: 'water-management',   label: 'Water / Sediment Control' },
];
