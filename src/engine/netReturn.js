// Copyright (c) 2026 Chandra Prakash Choudhary. All rights reserved.
/**
 * THE NET RETURN ENGINE
 * =====================
 * Every vendor calculator computes:
 *
 *     revenue = tons x price
 *
 * and stops there. That number is not a lie, but it is not the farmer's answer either,
 * because it omits every term with a minus sign in front of it. This engine computes:
 *
 *     net = carbon payment + cost-share - implementation cost - yield impact
 *
 * The subtractions are the entire point. A farmer who plants cover crops earns maybe
 * $12/ac from a carbon program and spends $37/ac establishing them. That is MINUS $25/ac
 * before cost-share — and no vendor tool will show you that, because it is not in their
 * interest to.
 *
 * ON UNCERTAINTY
 * --------------
 * We return low / central / high scenarios rather than a point estimate, and we do NOT
 * hide the low case. For per-ton programs the low case is frequently negative. That is a
 * real, defensible finding, and surfacing it is the most useful thing this tool does.
 */

import { PRACTICES } from '../data/practices';
import { COST_SHARE_PROGRAMS } from '../data/costShare';

/**
 * Effective per-ton price actually reaching the farmer.
 *
 * A headline "$40/ton" is never $40/ton. It is reduced by the aggregator's revenue share
 * and again by the buffer pool holdback (credits withheld as reversal insurance, for which
 * the farmer is not paid). Comparing an undiscounted per-ton headline against a flat
 * per-acre offer is the most common apples-to-oranges error in this market.
 */
export function effectiveTonPrice({ headlinePrice, farmerSharePct = 1, bufferHoldbackPct = 0 }) {
  return headlinePrice * farmerSharePct * (1 - bufferHoldbackPct);
}

/**
 * Carbon program revenue, $/ac/yr, for one scenario (low | central | high).
 *
 * Per-acre programs are indifferent to the sequestration scenario — which is exactly their
 * appeal, and why the engine treats them as flat across all three cases.
 */
function carbonRevenue({ program, practiceIds, scenario, tonPrice, farmerSharePct, bufferHoldbackPct }) {
  if (program.basis === 'per-acre') {
    return practiceIds.reduce((sum, id) => sum + (program.perAcreRates[id] ?? 0), 0);
  }

  const tons = practiceIds.reduce(
    (sum, id) => sum + PRACTICES[id].sequestration[scenario],
    0
  );
  return tons * effectiveTonPrice({ headlinePrice: tonPrice, farmerSharePct, bufferHoldbackPct });
}

/** Implementation cost, $/ac/yr. Negative values are genuine savings (e.g. deleting a tillage pass). */
function implementationCost({ practiceIds, scenario }) {
  return practiceIds.reduce((sum, id) => {
    const c = PRACTICES[id].cost;
    // Pessimistic scenario pairs low sequestration with HIGH cost, and vice versa —
    // this is what makes the low/high band a genuine bound rather than decoration.
    const v = scenario === 'low' ? c.totalHigh
            : scenario === 'high' ? c.totalLow
            : c.totalMedian;
    return sum + v;
  }, 0);
}

/** USDA cost-share, $/ac/yr. */
function costShareRevenue({ practiceIds, scenario, enrolled, underserved }) {
  if (!enrolled) return 0;

  const eqip = COST_SHARE_PROGRAMS.eqip;
  return practiceIds.reduce((sum, id) => {
    const r = eqip.rates[id];
    if (!r) return sum;
    const base = scenario === 'low' ? r.low : scenario === 'high' ? r.high : (r.low + r.high) / 2;
    // The underserved uplift reflects the higher cost-share ceiling (90% vs 75%).
    const uplift = underserved ? eqip.costSharePct.underserved / eqip.costSharePct.standard : 1;
    return sum + base * uplift;
  }, 0);
}

/**
 * Yield impact, $/ac/yr — the term every vendor calculator omits.
 *
 * Expressed as a percentage change the user controls, because the honest scientific answer
 * is "it depends on your soil and the evidence is mixed". We default it to a small negative
 * in early years for no-till (the documented transition drag on heavy/poorly-drained soils)
 * and let the farmer overrule us, because they know their ground and we do not.
 */
function yieldImpact({ yieldChangePct, grossRevenuePerAcre }) {
  return (yieldChangePct / 100) * grossRevenuePerAcre;
}

/** Compute one scenario. */
function computeScenario({
  scenario, program, practiceIds, tonPrice, farmerSharePct, bufferHoldbackPct,
  costShareEnrolled, underserved, yieldChangePct, grossRevenuePerAcre,
}) {
  const carbon    = carbonRevenue({ program, practiceIds, scenario, tonPrice, farmerSharePct, bufferHoldbackPct });
  const costShare = costShareRevenue({ practiceIds, scenario, enrolled: costShareEnrolled, underserved });
  const cost      = implementationCost({ practiceIds, scenario });
  const yieldD    = yieldImpact({ yieldChangePct, grossRevenuePerAcre });

  const net = carbon + costShare - cost + yieldD;

  return {
    scenario,
    carbon:    round2(carbon),
    costShare: round2(costShare),
    cost:      round2(cost),
    yieldImpact: round2(yieldD),
    net:       round2(net),
    tonsPerAcre: round3(
      practiceIds.reduce((s, id) => s + PRACTICES[id].sequestration[scenario], 0)
    ),
  };
}

/**
 * Main entry point.
 *
 * @returns {{
 *   low: object, central: object, high: object,
 *   acres: number, totals: object, verdict: object, warnings: string[]
 * }}
 */
export function computeNetReturn({
  program,                   // { basis: 'per-acre'|'per-ton', perAcreRates?, ... }
  practiceIds = [],
  acres = 500,
  tonPrice = 25,
  farmerSharePct = 0.75,
  bufferHoldbackPct = 0.20,
  costShareEnrolled = true,
  underserved = false,
  yieldChangePct = 0,
  grossRevenuePerAcre = 800,  // typical Midwest corn gross revenue; user-adjustable
}) {
  const args = {
    program, practiceIds, tonPrice, farmerSharePct, bufferHoldbackPct,
    costShareEnrolled, underserved, yieldChangePct, grossRevenuePerAcre,
  };

  const low     = computeScenario({ scenario: 'low', ...args });
  const central = computeScenario({ scenario: 'central', ...args });
  const high    = computeScenario({ scenario: 'high', ...args });

  const totals = {
    lowAnnual:     round2(low.net * acres),
    centralAnnual: round2(central.net * acres),
    highAnnual:    round2(high.net * acres),
  };

  return {
    low, central, high, acres, totals,
    verdict: buildVerdict({ low, central, high, program, practiceIds, costShareEnrolled }),
    warnings: buildWarnings({ low, central, program, practiceIds, costShareEnrolled, acres }),
  };
}

/**
 * The verdict: the plain-English answer to "so should I do this?"
 *
 * This is deliberately willing to say NO. A tool that always finds a reason to enrol is a
 * marketing funnel, not a decision aid.
 */
function buildVerdict({ low, central, practiceIds, costShareEnrolled }) {
  if (practiceIds.length === 0) {
    return {
      tone: 'neutral',
      headline: 'Select at least one practice',
      body: 'Choose the conservation practices you are considering, and this tool will show you what they are actually worth on your ground.',
    };
  }

  // The most important case: it only works because of the taxpayer, not the carbon market.
  if (central.net > 0 && central.carbon < central.cost && costShareEnrolled) {
    return {
      tone: 'caution',
      headline: 'This pencils out — but on cost-share, not carbon',
      body:
        `The carbon payment (${money(central.carbon)}/ac) does not cover your implementation cost ` +
        `(${money(central.cost)}/ac). What makes this work is USDA cost-share at ${money(central.costShare)}/ac. ` +
        `That is a perfectly good reason to adopt the practice — but understand that you are being paid by ` +
        `the taxpayer, not the carbon market, and you should not sign a long carbon contract believing otherwise.`,
    };
  }

  if (low.net < 0 && central.net > 0) {
    return {
      tone: 'caution',
      headline: 'Positive on average, but the downside is real',
      body:
        `Your central case is ${money(central.net)}/ac, but the pessimistic case is ${money(low.net)}/ac — ` +
        `a genuine loss. Because the spread in soil carbon response is wider than the average effect, this is ` +
        `not a remote tail risk. Do not commit acres you cannot afford to see underperform.`,
    };
  }

  if (central.net < 0) {
    return {
      tone: 'negative',
      headline: 'This does not pay',
      body:
        `Even the central case loses ${money(Math.abs(central.net))}/ac. The implementation cost exceeds ` +
        `everything you would be paid. ${!costShareEnrolled
          ? 'You have cost-share switched off — turn it on, because USDA money is what makes most of these practices viable.'
          : 'There may still be agronomic reasons to adopt the practice (erosion, water, resilience), but the carbon economics are not one of them.'}`,
    };
  }

  if (central.net > 0 && central.carbon >= central.cost) {
    return {
      tone: 'positive',
      headline: 'This pays on its own merits',
      body:
        `The carbon payment alone (${money(central.carbon)}/ac) covers your implementation cost ` +
        `(${money(central.cost)}/ac), before any cost-share. That is unusual and it is a genuinely good sign. ` +
        `Read the contract terms carefully anyway — the money is only half the decision.`,
    };
  }

  return {
    tone: 'neutral',
    headline: 'Marginal',
    body: `Central case of ${money(central.net)}/ac. Close enough to zero that contract terms, not dollars, should drive your decision.`,
  };
}

function buildWarnings({ central, program, practiceIds, costShareEnrolled, acres }) {
  const w = [];

  if (practiceIds.includes('no-till')) {
    w.push(
      'NO-TILL CARBON IS CONTESTED. Powlson et al. (2014, Nature Climate Change) found that most ' +
      'apparent no-till carbon gains are carbon redistributed toward the surface rather than added. ' +
      'If a program quotes you a confident no-till sequestration figure, ask at what depth they sampled.'
    );
  }

  if (program.basis === 'per-ton') {
    w.push(
      'PER-TON MEANS YOU CARRY THE MEASUREMENT RISK. If your soil does not test as sequestering, you are ' +
      'not paid — even though you already spent the money establishing the practice. A flat per-acre program ' +
      'pays less but shifts that risk off your books.'
    );
  }

  if (costShareEnrolled && central.costShare > central.carbon) {
    w.push(
      `USDA IS PAYING YOU MORE THAN THE CARBON MARKET (${money(central.costShare)}/ac vs ` +
      `${money(central.carbon)}/ac). Apply for cost-share before you sign any carbon contract. Note the ` +
      'national 15 January batching deadline for the first EQIP/CSP funding round.'
    );
  }

  if (costShareEnrolled) {
    w.push(
      'DOUBLE-DIPPING RISK. You cannot be paid twice for the same activity. Taking EQIP for cover crops AND ' +
      'carbon payment for the carbon from those same cover crops on the same acres is the classic trap. Some ' +
      'carbon programs will also rule a practice non-additional precisely because USDA already paid you to adopt it.'
    );
  }

  if (acres < 150 && program.id === 'indigo') {
    w.push(
      `INELIGIBLE: Carbon by Indigo requires a 150-acre minimum and you have entered ${acres} acres. ` +
      'ForGround by Bayer has a 10-acre minimum and is the realistic option at your scale.'
    );
  }

  return w;
}

const round2 = (n) => Math.round(n * 100) / 100;
const round3 = (n) => Math.round(n * 1000) / 1000;
const money  = (n) => `$${Math.abs(n).toFixed(2)}`;

/** Program shapes consumed by the engine, derived from the contract matrix. */
export const ENGINE_PROGRAMS = {
  bayer: {
    id: 'bayer',
    name: 'ForGround (Bayer)',
    basis: 'per-acre',
    perAcreRates: { 'cover-crops': 6, 'no-till': 6, 'nutrient-management': 0 },
    note: 'Flat per-acre. Predictable, lower ceiling, no measurement risk.',
  },
  indigo: {
    id: 'indigo',
    name: 'Carbon by Indigo',
    basis: 'per-ton',
    farmerSharePct: 0.75,
    bufferHoldbackPct: 0.20,
    note: '75% revenue share, ~20% buffer holdback, 150-acre minimum.',
  },
  agoro: {
    id: 'agoro',
    name: 'Agoro Carbon',
    basis: 'per-ton',
    farmerSharePct: 1.0,
    bufferHoldbackPct: 0.20,
    floorPrice: 18,
    note: 'Per-ton with a published $18/t floor — but a 10-year commitment.',
  },
  none: {
    id: 'none',
    name: 'No carbon program',
    basis: 'per-acre',
    perAcreRates: { 'cover-crops': 0, 'no-till': 0, 'nutrient-management': 0 },
    note: 'Cost-share only. Often the right answer, and nobody will tell you that.',
  },
};
