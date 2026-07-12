/**
 * THE CONTRACT RISK MATRIX
 * ========================
 * The core artifact of this project, and the reason it exists.
 *
 * Every US agricultural carbon program publishes what it will PAY you.
 * None of them publish, side by side, what you are AGREEING TO.
 *
 * Those are different questions, and the second one is where farmers get hurt:
 * a 10-year commitment on land you rent, a permanence obligation that outlives
 * your payment stream, a unilateral amendment clause, forfeiture of unvested
 * money if you exit early. This file puts those terms next to each other.
 *
 * SOURCING DISCIPLINE
 * -------------------
 * Terms marked tier 'program' are SELF-REPORTED by the company. They are not
 * independently audited, and the UI says so plainly. As of July 2026 exactly one
 * US ag carbon program (Indigo) has undergone independent third-party contract
 * verification — which tells you most of what you need to know about the state of
 * this market.
 *
 * `verify` is the honest escape hatch: where a term is genuinely not published,
 * we say "not published" rather than inventing a plausible-looking value, and we
 * tell the farmer to demand it in writing before signing.
 */

const NOT_PUBLISHED = {
  value: 'Not published',
  risk: 'unknown',
  detail: 'This program does not publish this term. Demand it in writing before you sign — ' +
          'a term that is not in the contract is not a promise.',
};

export const PROGRAMS = [
  {
    id: 'indigo',
    name: 'Carbon by Indigo',
    operator: 'Indigo Ag',
    url: 'https://www.indigoag.com/carbon-credits',
    src: 'indigoCarbon',
    verifiedBy: 'agDataTransparentIndigo',
    independentlyVerified: true,

    paymentBasis: {
      value: 'Per verified ton',
      detail: 'You are paid for tons of CO₂e actually verified on your ground, not a flat acre ' +
              'rate. Upside if your soils respond well; nothing if they do not.',
      risk: 'medium',
    },
    paymentRate: {
      value: '75% of credit sale price',
      detail: 'Indigo returns 75% of the weighted sale price of the credit to the grower and ' +
              'retains 25%. Your income therefore floats with the voluntary carbon market, which ' +
              'has historically ranged from roughly $15 to $80 per ton.',
      risk: 'medium',
    },
    contractLength: {
      value: '5 years, auto-renewing',
      detail: 'A 5-year term that renews annually thereafter. Shorter than Agoro, but note the ' +
              'renewal is automatic — you must act to stop it.',
      risk: 'medium',
    },
    earlyExit: {
      value: 'Forfeit unvested payments (pre-2026 credits only)',
      detail: 'Historically, payments vested over 5 years (50/20/10/10/10%) and leaving early meant ' +
              'permanently forfeiting everything unvested. IMPORTANT UPDATE: credits generated on or ' +
              'after 1 January 2026 are NOT subject to vesting. If you are reading older guidance ' +
              'that describes the vesting schedule, it is out of date.',
      risk: 'low',
    },
    permanence: {
      value: '100 years (project-level)',
      detail: 'The underlying Climate Action Reserve Soil Enrichment Protocol requires credits to ' +
              'remain permanent for 100 years. Because Indigo runs an aggregated project, permanence ' +
              'is held at the PROJECT level rather than on your individual field — which meaningfully ' +
              'reduces your personal reversal exposure. Roughly 20% of credits are withheld into a ' +
              'buffer pool to cover reversals.',
      risk: 'low',
    },
    buffer: {
      value: '~20% holdback',
      detail: 'About one credit in five is withheld into an insurance buffer pool against reversal ' +
              'risk. You are not paid for those. Any per-ton price you are quoted should be ' +
              'discounted by this before you compare it to a flat per-acre offer.',
      risk: 'medium',
    },
    minimumAcreage: {
      value: '150 acres',
      detail: 'The highest minimum of the major programs. Effectively excludes small operations, ' +
              'which is precisely the equity problem documented by Resources for the Future.',
      risk: 'high',
    },
    landOwnership: {
      value: 'Not required',
      detail: 'You do not need to own the land — good news for the ~40% of US farmland that is ' +
              'rented. You will still need the landlord’s cooperation for a multi-year commitment.',
      risk: 'low',
    },
    stacking: {
      value: 'No double-enrolment',
      detail: 'You cannot enrol the same carbon attributes in another carbon program. This does NOT ' +
              'automatically bar you from USDA cost-share, but the interaction is fact-specific — ' +
              'see the stacking warning in this tool.',
      risk: 'medium',
    },
    verificationCost: NOT_PUBLISHED,
  },

  {
    id: 'bayer',
    name: 'ForGround',
    operator: 'Bayer',
    url: 'https://bayerforground.com/carbon-initiative',
    src: 'bayerForGround',
    independentlyVerified: false,

    paymentBasis: {
      value: 'Flat per acre',
      detail: 'You are paid per ENROLLED ACRE, not per ton of carbon. This is the single most ' +
              'important distinction in the whole market: your payment does not depend on whether ' +
              'your soil actually sequesters anything. Lower ceiling, but far more predictable — and ' +
              'it insulates you from the measurement uncertainty that dominates this field.',
      risk: 'low',
    },
    paymentRate: {
      value: 'Up to $6/ac till + $6/ac cover crop',
      detail: 'Up to $6/ac for reduced-, no- or strip-till, and up to $6/ac for cover crops — so up ' +
              'to about $12/ac if you do both. Modest, but it is cash that does not depend on a soil ' +
              'sample going your way. Fields with a practice change since 2019 may also qualify for a ' +
              'one-time historical payment of up to $48/ac.',
      risk: 'low',
    },
    contractLength: {
      value: '5-year performance period',
      detail: 'Enrolling in 2026 starts a 5-year performance period for that field. Bayer may, at its ' +
              'discretion, offer renewal for up to three additional 5-year periods.',
      risk: 'medium',
    },
    earlyExit: NOT_PUBLISHED,
    permanence: {
      value: 'Tied to practice maintenance',
      detail: 'Because payment is per-acre for practice adoption rather than per-ton for sequestration, ' +
              'the permanence exposure is structurally lower than a per-ton program. You are being paid ' +
              'to farm a certain way, not insuring a carbon stock.',
      risk: 'low',
    },
    buffer: {
      value: 'Not applicable',
      detail: 'No buffer holdback, because you are not paid per ton.',
      risk: 'low',
    },
    minimumAcreage: {
      value: '10 acres',
      detail: 'By far the most accessible minimum of the major programs. This is the realistic entry ' +
              'point for a small or diversified operation.',
      risk: 'low',
    },
    landOwnership: NOT_PUBLISHED,
    stacking: NOT_PUBLISHED,
    verificationCost: {
      value: 'Borne by program',
      detail: 'Because payment is per-acre rather than per-ton, there is no farmer-funded soil ' +
              'sampling campaign to underwrite.',
      risk: 'low',
    },
  },

  {
    id: 'agoro',
    name: 'Agoro Carbon Alliance',
    operator: 'Agoro / Yara',
    url: 'https://agorocarbonalliance.com/our-carbon-program/',
    src: 'agoroCarbon',
    independentlyVerified: false,

    paymentBasis: {
      value: 'Per verified ton (soil-sampled)',
      detail: 'Paid for new tons captured above a soil-sampled baseline. The baseline sampling is ' +
              'more rigorous than most — which cuts both ways: better science, but a real baseline ' +
              'means no credit for carbon you already had.',
      risk: 'medium',
    },
    paymentRate: {
      value: 'Floor $18/t (yr 5), $20/t (yr 11)',
      detail: 'Agoro is unusual in publishing GUARANTEED FLOOR prices — $18/ton at year 5 and $20/ton ' +
              'at year 11 under Option A ($16.50 and $20 under Option B) — with variable upside above ' +
              'the floor if credits sell higher. A published floor is a genuinely farmer-favourable ' +
              'term and almost no one else offers it.',
      risk: 'low',
    },
    contractLength: {
      value: '10 years',
      detail: 'THE LONGEST COMMITMENT IN THE MARKET, and the term that should give you the most pause. ' +
              'Ten years is longer than most cash-rent arrangements, longer than most equipment notes, ' +
              'and longer than many farmers intend to keep farming a given parcel. Do not sign this on ' +
              'rented ground without your landlord locked in for the same period.',
      risk: 'high',
    },
    earlyExit: NOT_PUBLISHED,
    permanence: {
      value: 'Tied to 10-year commitment',
      detail: 'Carbon must stay in the ground. Reverting to tillage inside the commitment period ' +
              'triggers reversal obligations.',
      risk: 'high',
    },
    buffer: NOT_PUBLISHED,
    minimumAcreage: NOT_PUBLISHED,
    landOwnership: NOT_PUBLISHED,
    stacking: NOT_PUBLISHED,
    verificationCost: {
      value: 'Borne by program',
      detail: 'Agoro funds the soil sampling and pairs enrolees with local agronomists — the most ' +
              'hands-on support model of the major programs. That agronomic support has real cash ' +
              'value and is a legitimate reason to accept the longer term.',
      risk: 'low',
    },
  },

  {
    id: 'truterra',
    name: 'Truterra',
    operator: 'Land O’Lakes',
    url: 'https://www.truterraag.com/',
    src: 'truterra',
    independentlyVerified: false,

    paymentBasis: {
      value: 'Per verified ton',
      detail: 'Paid per ton of carbon sequestered or emissions reduced, verified against a baseline.',
      risk: 'medium',
    },
    paymentRate: {
      value: '~$19/t realised (implied)',
      detail: 'Truterra reports paying over $21M for more than 1.1M metric tons in its first three ' +
              'years — an implied realised average of roughly $19/ton. This is a useful reality check ' +
              'against headline credit prices of $60–80/ton: what farmers ACTUALLY received was a ' +
              'fraction of the number in the press release.',
      risk: 'medium',
    },
    contractLength: NOT_PUBLISHED,
    earlyExit: NOT_PUBLISHED,
    permanence: NOT_PUBLISHED,
    buffer: NOT_PUBLISHED,
    minimumAcreage: NOT_PUBLISHED,
    landOwnership: NOT_PUBLISHED,
    stacking: NOT_PUBLISHED,
    verificationCost: NOT_PUBLISHED,
  },
];

/** The rows of the matrix, in the order a farmer should actually think about them. */
export const MATRIX_ROWS = [
  { key: 'paymentBasis',     label: 'How you are paid',        why: 'Per-acre pays regardless of results. Per-ton pays only if the carbon shows up in a soil sample. This is the fork in the road.' },
  { key: 'paymentRate',      label: 'How much',                why: 'Compare like with like: a per-ton price must be discounted by the buffer holdback and the aggregator’s cut before you set it against a flat per-acre offer.' },
  { key: 'contractLength',   label: 'How long you are locked in', why: 'The term is the real cost. Ten years on rented ground is a very different risk from five on ground you own.' },
  { key: 'earlyExit',        label: 'Cost of getting out',     why: 'Forfeiture clauses are where farmers lose money. Ask what happens if you sell the farm or lose the lease.' },
  { key: 'permanence',       label: 'Permanence obligation',   why: 'The carbon must stay put — sometimes for 100 years. Understand whether that obligation sits on you or on the project.' },
  { key: 'buffer',           label: 'Buffer holdback',         why: 'Credits withheld as reversal insurance. You are not paid for these, so they silently cut your effective per-ton price.' },
  { key: 'minimumAcreage',   label: 'Minimum acres',           why: 'Determines whether you can participate at all. Ranges from 10 to 150 acres.' },
  { key: 'landOwnership',    label: 'Must you own the land?',  why: 'Roughly 40% of US farmland is rented. A multi-year carbon commitment on leased ground needs your landlord’s buy-in.' },
  { key: 'stacking',         label: 'Can you stack USDA money?', why: 'You cannot be paid twice for the same activity. Getting this wrong can mean paying money back.' },
  { key: 'verificationCost', label: 'Who pays for sampling?',  why: 'Soil sampling and verification is expensive, and if it lands on you it can swallow the payment entirely.' },
];

export const RISK_META = {
  low:     { label: 'Favourable',  color: '#15803D', bg: 'rgba(21,128,61,0.10)' },
  medium:  { label: 'Read closely', color: '#B45309', bg: 'rgba(180,83,9,0.10)' },
  high:    { label: 'High risk',   color: '#B91C1C', bg: 'rgba(185,28,28,0.10)' },
  unknown: { label: 'Not published', color: '#64748B', bg: 'rgba(100,116,139,0.10)' },
};
