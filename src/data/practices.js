/**
 * Practice-level evidence base: what each conservation practice actually costs,
 * what it plausibly sequesters, and how confident the literature is.
 *
 * DESIGN NOTE ON UNITS
 * --------------------
 * Everything here is per ACRE and in short-ton-free metric tons of CO2e, because
 * that is the unit US farmers are actually paid in ("$/ton" in a carbon contract
 * means metric ton CO2e). Mixing hectares into a US farmer tool is a usability bug.
 *
 * DESIGN NOTE ON RANGES
 * ---------------------
 * Every sequestration figure is a RANGE, never a point estimate. A point estimate
 * would be a lie: the field-to-field variance in SOC accrual is larger than the
 * mean effect for most practices. The `confidence` field tells the user how much
 * to trust the range, and `caveat` explains the specific reason for doubt.
 */

import { C_TO_CO2 } from './constants';

// Meta-analyses report SOC accrual in Mg C ha-1 yr-1 (0–30 cm).
// Convert to t CO2e per acre per year: (Mg C/ha/yr) x 3.667 / 2.471
const perHaCarbonToPerAcreCO2e = (mgC) => (mgC * C_TO_CO2) / 2.471;

export const PRACTICES = {
  'cover-crops': {
    id: 'cover-crops',
    name: 'Cover Crops',
    blurb: 'Planting a non-harvested crop (cereal rye, clover, radish) between cash crops.',

    // Joshi et al. 2023 meta-analysis and companion field syntheses report
    // 0.2–0.9 Mg C ha-1 yr-1 for cover cropping at 0–30 cm depth.
    sequestration: {
      lowMgC: 0.2,
      centralMgC: 0.55,
      highMgC: 0.9,
      get low()     { return perHaCarbonToPerAcreCO2e(this.lowMgC); },
      get central() { return perHaCarbonToPerAcreCO2e(this.centralMgC); },
      get high()    { return perHaCarbonToPerAcreCO2e(this.highMgC); },
      src: 'joshi2023',
      confidence: 'moderate',
      caveat:
        'Cover crops are the best-evidenced soil carbon practice, but accrual depends heavily on ' +
        'biomass produced. A poorly-established cover crop that winter-kills early sequesters ' +
        'little. The low end of this range is the realistic outcome in a dry fall or a late ' +
        'harvest that squeezes the planting window.',
    },

    // SARE Cover Crop Economics (2019), inflated to present-day input costs is NOT
    // done here — we present SARE's surveyed figures as published, and say so.
    cost: {
      seedLow: 10, seedHigh: 50,
      seedingLow: 5, seedingHigh: 18,
      terminationLow: 0, terminationHigh: 10,
      totalLow: 15, totalHigh: 78, totalMedian: 37,
      src: 'sareCoverCropEconomics',
      caveat:
        'SARE’s surveyed median all-in cost is $37/ac. Termination is often $0 because it folds ' +
        'into a burndown herbicide pass the farmer was making anyway; if it needs its own pass, ' +
        'budget the high end.',
    },

    // Cover crops are the one practice with a credible mechanism for yield GAIN
    // over time (water infiltration, organic matter), but the evidence is genuinely mixed.
    yieldEffect: {
      note:
        'Evidence is mixed and this tool refuses to pretend otherwise. The 2019 National Cover ' +
        'Crop Survey found +5% soybean and +2% corn yields among adopters — but adopters are ' +
        'self-selected, and controlled field experiments in Maryland found no statistically ' +
        'significant yield effect in either crop. Expect roughly neutral yields, with downside ' +
        'risk in the first two years while you learn termination timing.',
      src: 'sareCoverCropEconomics',
    },
  },

  'no-till': {
    id: 'no-till',
    name: 'No-Till / Strip-Till',
    blurb: 'Planting directly into undisturbed residue, eliminating the tillage pass.',

    // This is the honest one. Powlson et al. (2014) is the reason the range starts at ZERO.
    sequestration: {
      lowMgC: 0.0,
      centralMgC: 0.25,
      highMgC: 0.6,
      get low()     { return perHaCarbonToPerAcreCO2e(this.lowMgC); },
      get central() { return perHaCarbonToPerAcreCO2e(this.centralMgC); },
      get high()    { return perHaCarbonToPerAcreCO2e(this.highMgC); },
      src: 'powlson2014',
      confidence: 'contested',
      caveat:
        'The carbon benefit of no-till is the most overstated number in this entire industry. ' +
        'Powlson et al. (2014, Nature Climate Change) showed that most apparent gains are carbon ' +
        'REDISTRIBUTED toward the surface, not carbon added: sample to 30 cm and no-till looks ' +
        'great, sample deeper and the gain often vanishes. This range therefore starts at zero. ' +
        'If a carbon program quotes you a confident no-till sequestration figure, ask them at what ' +
        'depth they sampled.',
    },

    // No-till is usually cost-NEGATIVE: you delete a tillage pass. That saving is real
    // and is the single most under-appreciated fact in the farmer economics.
    cost: {
      totalLow: -25, totalHigh: 15, totalMedian: -8,
      src: 'sareCoverCropEconomics',
      caveat:
        'No-till typically SAVES money by eliminating tillage passes (fuel, labour, equipment ' +
        'hours) — which is why the median is negative. Costs turn positive if you must buy or ' +
        'retrofit a no-till drill, or if heavier residue drives higher herbicide use.',
    },

    yieldEffect: {
      note:
        'A transition yield drag is well-documented on poorly-drained and heavy clay soils, where ' +
        'cold wet spring seedbeds delay emergence. It typically fades over 3–5 years as soil ' +
        'structure and biology adjust. On well-drained soils the drag is often negligible from ' +
        'year one. This is the cost every vendor calculator omits.',
      src: 'sareCoverCropEconomics',
    },
  },

  'nutrient-management': {
    id: 'nutrient-management',
    name: 'Nutrient Management',
    blurb: 'Right-rate/right-time nitrogen to cut nitrous oxide emissions and fertiliser spend.',

    // NOTE: this practice's climate benefit is primarily AVOIDED N2O, not soil carbon.
    // We deliberately encode it with a near-zero SOC accrual so the tool does not
    // silently credit it as sequestration.
    sequestration: {
      lowMgC: 0.0,
      centralMgC: 0.05,
      highMgC: 0.15,
      get low()     { return perHaCarbonToPerAcreCO2e(this.lowMgC); },
      get central() { return perHaCarbonToPerAcreCO2e(this.centralMgC); },
      get high()    { return perHaCarbonToPerAcreCO2e(this.highMgC); },
      src: 'rffMeasurementGaps',
      confidence: 'contested',
      caveat:
        'Nutrient management earns its climate benefit mainly by AVOIDING nitrous oxide emissions, ' +
        'not by building soil carbon — and N2O is far harder to measure than carbon, so the ' +
        'measurement gap here is the widest of any practice. The soil-carbon figure shown is ' +
        'deliberately near zero to avoid double-counting a benefit that is not sequestration.',
    },

    cost: {
      totalLow: -30, totalHigh: 20, totalMedian: -10,
      src: 'rffMeasurementGaps',
      caveat:
        'Usually cost-saving, because the practice is largely about not over-applying nitrogen you ' +
        'already paid for. Costs arise from soil testing, tissue sampling, and variable-rate ' +
        'application equipment or services.',
    },

    yieldEffect: {
      note:
        'Designed to be yield-neutral. Real risk exists if rates are cut too aggressively in a ' +
        'high-mineralisation year, but a properly written nutrient management plan targets the ' +
        'same yield with less input.',
      src: 'rffMeasurementGaps',
    },
  },
};

/** Practice keys in the order we want them presented. */
export const PRACTICE_LIST = ['cover-crops', 'no-till', 'nutrient-management'];

export const CONFIDENCE_META = {
  moderate: {
    label: 'Moderate confidence',
    color: '#15803D',
    desc: 'Supported by meta-analysis, though field-to-field variance remains large.',
  },
  contested: {
    label: 'Contested',
    color: '#B45309',
    desc: 'The peer-reviewed literature actively disagrees on the size — and sometimes the ' +
          'existence — of this effect. Treat any confident number with suspicion.',
  },
};
