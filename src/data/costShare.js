/**
 * USDA cost-share: the money most farmers leave on the table.
 *
 * The critical, under-communicated fact: USDA EQIP frequently pays MORE for the
 * exact same practice than a carbon program does. A carbon program might pay you
 * $12/ac to plant cover crops. EQIP pays $34–$75/ac for the same cover crops.
 * A farmer who signs a carbon contract without first checking EQIP may be
 * signing a 10-year commitment for a fraction of the available money.
 *
 * WHY THERE ARE NO PER-STATE "TYPICAL" RATES HERE
 * -----------------------------------------------
 * EQIP payment rates are set by each STATE NRCS office and revised annually. There
 * is no national rate. Any website that shows you a confident single number for
 * your state has either scraped a stale PDF or made it up. This tool shows the
 * observed national spread, flags it as an estimate, and sends the farmer to the
 * authoritative state schedule. That is the honest answer, and it is also the
 * useful one.
 */

export const COST_SHARE_PROGRAMS = {
  eqip: {
    id: 'eqip',
    name: 'EQIP',
    fullName: 'Environmental Quality Incentives Program',
    operator: 'USDA NRCS',
    src: 'nrcsEqip',
    url: 'https://www.nrcs.usda.gov/programs-initiatives/environmental-quality-incentives-program',
    findLocalUrl: 'https://www.nrcs.usda.gov/getting-assistance/payment-schedules',

    structure: 'Cost-share on practice implementation',
    costSharePct: { standard: 0.75, underserved: 0.90 },
    paymentLimit: 450000,
    contractLength: '1–10 years',

    // Observed national spread of state-set cover crop (practice 340) rates.
    // Iowa sits near the bottom (~$34/ac); the highest state schedules reach ~$75/ac.
    rates: {
      'cover-crops':         { low: 34, high: 75, estimate: true },
      'no-till':             { low: 12, high: 28, estimate: true },
      'nutrient-management': { low: 8,  high: 22, estimate: true },
    },

    caveat:
      'Rates are set per-state and revised annually — there is no national rate. The figures shown ' +
      'are the observed spread across state schedules and are an ESTIMATE for planning only. Your ' +
      'state’s actual published schedule is authoritative. Confirm before you budget.',

    keyFacts: [
      'Covers up to 75% of practice cost — 90% for beginning and historically underserved producers.',
      'National batching deadline of 15 January for the first funding round (new as of FY2026).',
      'Competitive: historically only about 44% of applications nationally receive funding.',
      'Payment limit of $450,000 per person across the Farm Bill period.',
    ],
  },

  csp: {
    id: 'csp',
    name: 'CSP',
    fullName: 'Conservation Stewardship Program',
    operator: 'USDA NRCS',
    src: 'nrcsPaymentSchedules',
    url: 'https://www.nrcs.usda.gov/programs-initiatives/csp-conservation-stewardship-program',
    findLocalUrl: 'https://www.nrcs.usda.gov/contact/find-a-service-center',

    structure: 'Annual payment for whole-farm conservation performance',
    contractLength: '5 years',
    minimumAnnual: 4000,

    caveat:
      'CSP pays for conservation PERFORMANCE across the whole operation rather than reimbursing a ' +
      'single practice, so a per-acre rate is not the right mental model and this tool does not ' +
      'invent one. It has a guaranteed minimum of $4,000/year, and it can be held at the same time ' +
      'as an EQIP contract.',

    keyFacts: [
      'Five-year contracts with a guaranteed minimum payment of $4,000 per year.',
      'Can be held simultaneously with an EQIP contract on the same operation.',
      'Rewards existing stewardship, not just new practice adoption — so you may already qualify.',
      'Renewable if you continue to improve conservation performance.',
    ],
  },
};

/**
 * THE STACKING RULE — the thing farmers most often get wrong.
 *
 * The governing principle is simple to state and easy to violate:
 * you cannot be paid twice for the SAME activity, but you can be paid by different
 * programs for DIFFERENT activities on the same operation.
 */
export const STACKING_RULES = {
  headline: 'You cannot be paid twice for the same activity — but you can be paid for different activities.',

  allowed: [
    'Holding an EQIP contract and a CSP contract at the same time.',
    'Taking EQIP cost-share for cover crops on one field and enrolling different fields in a carbon program.',
    'Layering a state cost-share program on top of a federal one, where the state permits it.',
  ],

  danger: [
    'Taking EQIP payment for cover crops AND carbon-program payment for the carbon from those same cover crops, on the same acres. This is the classic trap.',
    'Enrolling the same carbon attributes in two carbon programs — expressly prohibited by Indigo, and almost certainly by the others.',
    'Assuming a carbon program’s additionality rules will accept practices you were already being paid to do. Many will not: if USDA already paid you to adopt it, a carbon program may rule it non-additional and refuse to credit it.',
  ],

  advice:
    'Check USDA cost-share FIRST, before you sign any carbon contract. EQIP frequently pays more for ' +
    'the same practice, with a shorter commitment and no permanence obligation. A carbon contract ' +
    'should be what you do with the acres cost-share does not cover — not your opening move.',

  src: 'nrcsEqip',
};
