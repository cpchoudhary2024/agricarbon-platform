/**
 * Central citation registry.
 *
 * RULE: every quantitative value rendered anywhere in this application must
 * carry a `src` key that resolves to an entry in this file. If a number cannot
 * be traced to a primary source, it does not ship. There are no "typical"
 * values, no house estimates, and no unattributed coefficients.
 *
 * `retrieved` is the date the figure was last checked against the source.
 * `tier` communicates evidential weight, and is surfaced in the UI:
 *   'peer-reviewed' — journal article or meta-analysis
 *   'government'    — USDA / federal agency publication
 *   'program'       — a carbon program's own published terms (self-reported)
 *   'third-party'   — independent verification or legal-aid analysis
 */

export const SOURCES = {
  powlson2014: {
    title: 'Limited potential of no-till agriculture for climate change mitigation',
    authors: 'Powlson, D.S., Stirling, C.M., Jat, M.L., et al.',
    org: 'Nature Climate Change 4, 678–683',
    year: 2014,
    url: 'https://www.nature.com/articles/nclimate2292',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'Finds that apparent SOC gains under no-till largely reflect an altered depth ' +
          'distribution of carbon rather than a net increase in stock. Deep sampling often ' +
          'shows little or no additional sequestration. This is the single most important ' +
          'caveat in agricultural carbon accounting and is omitted by every commercial calculator.',
  },

  joshi2023: {
    title: 'A global meta-analysis of cover crop response on soil carbon storage within a corn production system',
    authors: 'Joshi, D.R., Sieverding, H.L., Xu, H., et al.',
    org: 'Agronomy Journal 115(4)',
    year: 2023,
    url: 'https://acsess.onlinelibrary.wiley.com/doi/10.1002/agj2.21340',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'Cover crops increased SOC by 7.3% (95% CI: 4.9–9.6%) relative to no-cover-crop ' +
          'controls. Provides the empirical basis for the cover-crop accrual range used here.',
  },

  sareCoverCropEconomics: {
    title: 'Cover Crop Economics: Opportunities to Improve Your Bottom Line in Row Crops',
    authors: 'Myers, R., Weber, A., Tellatin, S.',
    org: 'USDA SARE (Sustainable Agriculture Research & Education)',
    year: 2019,
    url: 'https://www.sare.org/publications/cover-crop-economics/',
    retrieved: '2026-07-11',
    tier: 'government',
    note: 'The standard public budget for cover-crop establishment. Seed $10–50/ac, ' +
          'seeding $5–18/ac, termination $0–10/ac. Median surveyed all-in cost $37/ac.',
  },

  nrcsPaymentSchedules: {
    title: 'NRCS Conservation Program Payment Schedules',
    org: 'USDA Natural Resources Conservation Service',
    year: 2026,
    url: 'https://www.nrcs.usda.gov/getting-assistance/payment-schedules',
    retrieved: '2026-07-11',
    tier: 'government',
    note: 'EQIP and CSP payment rates are set per-state, not nationally. Rates below are ' +
          'the observed national spread; a farmer must confirm their own state schedule.',
  },

  nrcsEqip: {
    title: 'Environmental Quality Incentives Program (EQIP)',
    org: 'USDA Natural Resources Conservation Service',
    year: 2026,
    url: 'https://www.nrcs.usda.gov/programs-initiatives/environmental-quality-incentives-program',
    retrieved: '2026-07-11',
    tier: 'government',
    note: 'Covers up to 75% of practice cost; up to 90% for beginning and historically ' +
          'underserved producers. Payment limit $450,000 per person over the Farm Bill period.',
  },

  nrcsBatching2026: {
    title: 'USDA Announces January 15 National Batching Deadline for Major NRCS Conservation Programs',
    org: 'USDA Natural Resources Conservation Service',
    year: 2026,
    url: 'https://www.nrcs.usda.gov/programs-initiatives/regenerative-pilot-program/news/usda-announces-january-15-national-batching',
    retrieved: '2026-07-11',
    tier: 'government',
    note: 'Establishes a national January 15 batching deadline for the first funding round of ' +
          'EQIP, CSP, ACEP and AMA — replacing the previous rolling, state-by-state ranking periods.',
  },

  agDataTransparentIndigo: {
    title: 'Ag Carbon Verified: Carbon by Indigo',
    org: 'Ag Data Transparent (Janzen Schroeder Ag Law)',
    year: 2026,
    url: 'https://www.agdatatransparent.com/ag-carbon-verified/2026/2/23/carbon-by-indigo',
    retrieved: '2026-07-11',
    tier: 'third-party',
    note: 'The only independent, third-party contract verification of a US agricultural carbon ' +
          'program in existence as of this writing. That it stands alone is itself the clearest ' +
          'evidence of the transparency gap this site exists to close.',
  },

  flagCarbonContracts: {
    title: "Farmers' Guide to Carbon Market Contracts",
    org: 'Farmers’ Legal Action Group (FLAG)',
    year: 2025,
    url: 'https://www.flaginc.org/',
    retrieved: '2026-07-11',
    tier: 'third-party',
    note: 'Legal-aid analysis of the contract terms that most commonly harm farmers: early ' +
          'termination forfeiture, unilateral amendment rights, and permanence obligations that ' +
          'outlive the payment stream.',
  },

  bayerForGround: {
    title: 'Bayer Carbon Program — ForGround',
    org: 'Bayer (program self-reported terms)',
    year: 2026,
    url: 'https://bayerforground.com/carbon-initiative',
    retrieved: '2026-07-11',
    tier: 'program',
    note: 'Pays a flat rate per enrolled acre, not per ton of carbon. Up to $6/ac for reduced/no/' +
          'strip-till and up to $6/ac for cover crops.',
  },

  agoroCarbon: {
    title: 'Agoro Carbon Alliance — Our Carbon Program',
    org: 'Agoro Carbon Alliance / Yara (program self-reported terms)',
    year: 2026,
    url: 'https://agorocarbonalliance.com/our-carbon-program/',
    retrieved: '2026-07-11',
    tier: 'program',
    note: 'Pays per verified ton against a soil-sampled baseline, with guaranteed payments over a ' +
          '10-year commitment. Published floor prices: $18/t at year 5, $20/t at year 11 (Option A).',
  },

  indigoCarbon: {
    title: 'Carbon by Indigo — Program Overview',
    org: 'Indigo Ag (program self-reported terms)',
    year: 2026,
    url: 'https://www.indigoag.com/carbon-credits',
    retrieved: '2026-07-11',
    tier: 'program',
    note: 'Returns 75% of the weighted credit sale price to the grower. Minimum 150 acres.',
  },

  truterra: {
    title: 'Truterra Carbon Program',
    org: 'Truterra / Land O’Lakes (program self-reported terms)',
    year: 2026,
    url: 'https://www.truterraag.com/',
    retrieved: '2026-07-11',
    tier: 'program',
    note: 'Paid over $21M to farmers for 1.1M+ metric tons across its first three years — an ' +
          'implied realised average of roughly $19/ton.',
  },

  nppFarmerPerspectives: {
    title: 'Farmer perspectives on carbon markets incentivizing agricultural soil carbon sequestration',
    org: 'npj Climate Action 2, 27',
    year: 2023,
    url: 'https://www.nature.com/articles/s44168-023-00055-4',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'Farmers describe the process of receiving offset credits as convoluted, burdensome and ' +
          'unpredictable. Establishes the demand-side case for a neutral comparison tool.',
  },

  landInterestedUncertain: {
    title: 'Interested but Uncertain: Carbon Markets and Data Sharing among U.S. Crop Farmers',
    org: 'Land 12(8), 1526',
    year: 2023,
    url: 'https://www.mdpi.com/2073-445X/12/8/1526',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'Most surveyed US crop farmers are aware of and interested in carbon markets, but hold ' +
          'high levels of concern and uncertainty that prevent actual participation.',
  },

  rffMeasurementGaps: {
    title: 'Measurement Gaps in Mitigating US Agricultural Greenhouse Gas Emissions',
    org: 'Resources for the Future',
    year: 2023,
    url: 'https://www.rff.org/publications/issue-briefs/measurement-gaps-mitigating-us-agricultural-greenhouse-gas-emissions-farm-bill/',
    retrieved: '2026-07-11',
    tier: 'third-party',
    note: 'Documents that high measurement, verification and reporting costs are a primary barrier ' +
          'to farmer participation, and fall hardest on smaller operations.',
  },

  // ── Soil carbon saturation: the science behind the field-level model ──────

  hassink1997: {
    title: 'The capacity of soils to preserve organic C and N by their association with clay and silt particles',
    authors: 'Hassink, J.',
    org: 'Plant and Soil 191, 77–87',
    year: 1997,
    url: 'https://link.springer.com/article/10.1023/A:1004213929699',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'The foundational result: soil cannot hold unlimited carbon. Its capacity to physically protect ' +
          'organic carbon is set by its fine mineral fraction (<20 µm), because carbon is stabilised by ' +
          'binding to mineral surfaces. Gives C_sat (g C/kg) = 4.09 + 0.37 × (% particles <20 µm). This is ' +
          'the equation behind this tool’s Carbon Saturation Index.',
  },

  six2002: {
    title: 'Stabilization mechanisms of soil organic matter: Implications for C-saturation of soils',
    authors: 'Six, J., Conant, R.T., Paul, E.A., Paustian, K.',
    org: 'Plant and Soil 241, 155–176',
    year: 2002,
    url: 'https://link.springer.com/article/10.1023/A:1016125726789',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'Establishes carbon saturation as a general property of soils and formalises why a soil near its ' +
          'protective capacity gains little carbon regardless of management. The single most important ' +
          'concept missing from every commercial carbon calculator.',
  },

  georgiou2022: {
    title: 'Global stocks and capacity of mineral-associated soil organic carbon',
    authors: 'Georgiou, K., Jackson, R.B., Vindušková, O., et al.',
    org: 'Nature Communications 13, 3797',
    year: 2022,
    url: 'https://www.nature.com/articles/s41467-022-31540-9',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'The modern, globally-gridded treatment of mineral carbon capacity, from 1,144 soil profiles. ' +
          'Finds mineral-associated carbon sits at only ~42% of mineralogical capacity in surface soils, and ' +
          'that agricultural soils show the LARGEST undersaturation — meaning real headroom exists, but it ' +
          'varies enormously field to field. That variation is precisely why a national average is useless ' +
          'and a field-specific number is not.',
  },

  cotrufo2019: {
    title: 'Soil carbon storage informed by particulate and mineral-associated organic matter',
    authors: 'Cotrufo, M.F., Ranalli, M.G., Haddix, M.L., Six, J., Lugato, E.',
    org: 'Nature Geoscience 12, 989–994',
    year: 2019,
    url: 'https://www.nature.com/articles/s41561-019-0484-6',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'Distinguishes mineral-associated organic matter (MAOM — protected, persistent) from particulate ' +
          'organic matter (POM — unprotected, easily lost). Carbon added to a soil already at its mineral ' +
          'capacity accumulates as POM and is vulnerable to reversal. This is the mechanism behind ' +
          'permanence risk, and it is why saturation matters for a farmer signing a 100-year commitment.',
  },

  raca: {
    title: 'Rapid Carbon Assessment (RaCA)',
    org: 'USDA NRCS Soil and Plant Science Division',
    year: 2016,
    url: 'https://www.nrcs.usda.gov/resources/data-and-reports/rapid-carbon-assessment-raca',
    retrieved: '2026-07-11',
    tier: 'government',
    note: '145,127 soil samples from 6,237 profiles, with carbon measured in a laboratory rather ' +
          'than estimated — the largest public measured soil-carbon dataset in the United States, ' +
          'and entirely independent of SSURGO. We use it to test this tool’s saturation model ' +
          'against reality. Note that RaCA’s site coordinates are restricted (available only by ' +
          'request and approval) to protect landowner privacy, which constrains what can be checked.',
  },

  // ── The federal data infrastructure this tool runs on ─────────────────────

  ssurgo: {
    title: 'SSURGO / Soil Data Access — Web Soil Survey',
    org: 'USDA NRCS National Cooperative Soil Survey',
    year: 2026,
    url: 'https://sdmdataaccess.nrcs.usda.gov/',
    retrieved: '2026-07-11',
    tier: 'government',
    note: 'The authoritative soil survey of the United States, queried live for the exact coordinates you ' +
          'enter. Supplies this tool with your soil series, organic matter, clay and silt content, bulk ' +
          'density and drainage class. Public, free, and — remarkably — almost never joined to farm economics.',
  },

  cropscape: {
    title: 'CropScape — Cropland Data Layer (CDL)',
    org: 'USDA NASS (National Agricultural Statistics Service)',
    year: 2026,
    url: 'https://nassgeodata.gmu.edu/CropScape/',
    retrieved: '2026-07-11',
    tier: 'government',
    note: 'Satellite-derived crop classification at 30 m resolution for every acre in the US, every year ' +
          'since 2008. This tool reads your field’s actual multi-year rotation history from it, which is ' +
          'what determines whether a carbon program will judge your practice change “additional”.',
  },

  ipcc2006: {
    title: '2006 IPCC Guidelines for National Greenhouse Gas Inventories, Vol. 4 Ch. 2',
    org: 'Intergovernmental Panel on Climate Change',
    year: 2006,
    url: 'https://www.ipcc-nggip.iges.or.jp/public/2006gl/vol4.html',
    retrieved: '2026-07-11',
    tier: 'peer-reviewed',
    note: 'Tier 1 stock-change factors. IMPORTANT: these are designed for NATIONAL inventory ' +
          'accounting, not field-level estimation. This tool does not use them to predict outcomes ' +
          'on a specific farm, and explains why.',
  },
};

/** Resolve a source key to its record, failing loudly rather than silently rendering nothing. */
export function cite(key) {
  const s = SOURCES[key];
  if (!s) throw new Error(`Uncited value: no source registered under "${key}"`);
  return s;
}

export const TIER_LABELS = {
  'peer-reviewed': { label: 'Peer-reviewed', color: '#1D4ED8' },
  'government':    { label: 'US Government', color: '#15803D' },
  'third-party':   { label: 'Independent',   color: '#7C3AED' },
  'program':       { label: 'Self-reported', color: '#B45309' },
};
