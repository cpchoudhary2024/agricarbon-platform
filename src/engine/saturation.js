/**
 * CARBON SATURATION — the scientific core of this tool.
 * ====================================================
 *
 * THE QUESTION NO CALCULATOR ASKS
 * -------------------------------
 * Every carbon calculator on the market implicitly assumes soil is an infinite sponge:
 * adopt the practice, accrue X tons per acre per year, forever. That is not how soil works.
 *
 * Soil has a FINITE capacity to protect organic carbon. Carbon persists in soil largely by
 * binding to fine mineral surfaces (clay and silt); once those surfaces are occupied, additional
 * carbon has nowhere stable to go. Hassink (1997) quantified this, and Six et al. (2002)
 * generalised it into the theory of carbon saturation.
 *
 * The consequence is the single most actionable fact in agricultural carbon, and nobody tells
 * farmers about it:
 *
 *   A soil near its protective capacity will gain little carbon no matter what you do.
 *   A soil far below capacity has real headroom.
 *
 * This is why the same practice yields 0.2 t C/ha/yr on one farm and 0.9 on another — and why a
 * national average rate is close to meaningless for an individual field.
 *
 * WHAT WE COMPUTE
 * ---------------
 * From the USDA SSURGO soil survey for the user's actual coordinates, we get organic matter %,
 * clay %, silt %, and bulk density. From those:
 *
 *   SOC_current (g C/kg) = OM% × 10 / 1.724          [van Bemmelen: OM → organic C]
 *   fine_fraction (<20µm) ≈ clay% + 0.5 × silt%      [see APPROXIMATION below]
 *   C_sat (g C/kg)        = 4.09 + 0.37 × fine_fraction   [Hassink 1997]
 *   CSI                   = SOC_current / C_sat      [Carbon Saturation Index]
 *
 * HONEST LIMITATIONS — read these, they are load-bearing
 * -----------------------------------------------------
 * 1. APPROXIMATION. Hassink's equation is defined on the <20 µm particle fraction. SSURGO reports
 *    clay (<2 µm) and silt (2–50 µm) but not the <20 µm cut. We approximate <20 µm as
 *    clay + 0.5 × silt. This is an estimate. We say so, and we expose the inputs so anyone can
 *    check our arithmetic.
 *
 * 2. TOTAL SOC ≠ MINERAL-ASSOCIATED SOC. Hassink's C_sat is the capacity of the mineral-associated
 *    (protected) pool. SSURGO reports TOTAL organic matter, which also includes particulate organic
 *    matter (POM) — carbon that is not mineral-protected (Cotrufo et al. 2019). SSURGO does not
 *    fractionate. So CSI is an INDEX, not a direct measurement of saturation.
 *
 *    This is why a CSI above 1.0 is possible and is NOT a bug: it means the soil holds more total
 *    carbon than its fine fraction can protect, so much of that carbon sits in unprotected pools.
 *    That is a real, meaningful, and rather alarming signal — it implies both low headroom for new
 *    carbon AND elevated vulnerability of existing carbon to loss. Corn Belt Mollisols routinely
 *    land here, which is a substantial part of why carbon projects in the Corn Belt underdeliver.
 *
 * 3. Georgiou et al. (2022) is the more rigorous modern treatment of mineral carbon capacity. We
 *    use the simpler Hassink form deliberately, because it can be computed from the inputs a
 *    farmer's own field actually has in SSURGO, and because it can be shown transparently on a
 *    web page. We link to Georgiou for anyone who wants the state of the art.
 */

/** van Bemmelen conversion factor: organic matter → organic carbon. */
const OM_TO_OC = 1.724;

/** Hassink (1997): C_sat (g C/kg) = 4.09 + 0.37 × (% particles < 20 µm). */
const HASSINK_INTERCEPT = 4.09;
const HASSINK_SLOPE = 0.37;

/**
 * Estimate the <20 µm fraction from SSURGO's clay (<2 µm) and silt (2–50 µm).
 * Silt spans 2–50 µm; the 2–20 µm portion is roughly half of it by mass in typical
 * agricultural soils. This is an approximation and is flagged as such throughout the UI.
 */
export function fineFraction(clayPct, siltPct) {
  return clayPct + 0.5 * siltPct;
}

/** Convert SSURGO organic-matter % to soil organic carbon in g C per kg soil. */
export function omToSocGkg(omPct) {
  return (omPct * 10) / OM_TO_OC;
}

/**
 * Convert g C/kg to a stock in metric tons C per hectare over a given depth.
 *   stock (t C/ha) = SOC(g/kg) × BD(g/cm³) × depth(cm) / 10
 */
export function socStockTonsPerHa(socGkg, bulkDensity, depthCm = 30) {
  return (socGkg * bulkDensity * depthCm) / 10;
}

/**
 * The main model. Takes SSURGO properties, returns the saturation picture.
 */
export function carbonSaturation({ omPct, clayPct, siltPct, bulkDensity, depthCm = 30 }) {
  const fine = fineFraction(clayPct, siltPct);
  const socGkg = omToSocGkg(omPct);
  const cSatGkg = HASSINK_INTERCEPT + HASSINK_SLOPE * fine;

  const csi = socGkg / cSatGkg;
  const deficitGkg = cSatGkg - socGkg; // positive = headroom

  const socStock = socStockTonsPerHa(socGkg, bulkDensity, depthCm);
  const capacityStock = socStockTonsPerHa(cSatGkg, bulkDensity, depthCm);
  const deficitStock = capacityStock - socStock; // t C/ha of headroom

  return {
    fineFractionPct: round(fine, 1),
    socGkg: round(socGkg, 1),
    cSatGkg: round(cSatGkg, 1),
    csi: round(csi, 2),
    deficitGkg: round(deficitGkg, 1),
    socStockTonsPerHa: round(socStock, 1),
    capacityStockTonsPerHa: round(capacityStock, 1),
    deficitStockTonsPerHa: round(deficitStock, 1),
    /** Headroom expressed as CO2e per acre — the unit a carbon contract is written in. */
    headroomCO2ePerAcre: round((Math.max(0, deficitStock) * (44 / 12)) / 2.4710538, 2),
    band: saturationBand(csi),
  };
}

/**
 * Interpretation bands.
 *
 * These thresholds are a judgement call about how to communicate a continuous index, and we say so.
 * The underlying number (CSI) is always shown, so a reader who disagrees with our cut-points can
 * apply their own.
 */
export function saturationBand(csi) {
  if (csi < 0.6) {
    return {
      key: 'high-headroom',
      label: 'Large headroom',
      color: '#15803D',
      verdict: 'Strong physical capacity to stabilise new carbon',
      body:
        'Your soil holds substantially less carbon than its mineral fraction can protect. Carbon you ' +
        'build here has somewhere stable to go, and is more likely to persist. On the physics, this is ' +
        'a genuinely good carbon-farming candidate — which is a different question from whether the ' +
        'contract on offer is a good deal.',
      sequestrationMultiplier: 1.25,
    };
  }
  if (csi < 0.9) {
    return {
      key: 'moderate-headroom',
      label: 'Moderate headroom',
      color: '#4D7C0F',
      verdict: 'Reasonable capacity remaining',
      body:
        'Your soil is below its mineral protective capacity but not dramatically so. Expect accrual ' +
        'in the middle of the published range, and expect it to slow as you approach capacity.',
      sequestrationMultiplier: 1.0,
    };
  }
  if (csi < 1.1) {
    return {
      key: 'near-capacity',
      label: 'Approaching capacity',
      color: '#B45309',
      verdict: 'Limited headroom — expect underperformance',
      body:
        'Your soil is at or near the limit of what its mineral fraction can physically protect. ' +
        'Additional carbon has diminishing places to bind. Expect accrual at the LOW end of published ' +
        'ranges, and be sceptical of any program projecting otherwise. A per-ton contract is a poor fit ' +
        'here: you would be carrying measurement risk on a soil that is physically unlikely to deliver.',
      sequestrationMultiplier: 0.55,
    };
  }
  return {
    key: 'saturated',
    label: 'At or beyond mineral capacity',
    color: '#B91C1C',
    verdict: 'Little room for new stable carbon — and existing carbon is vulnerable',
    body:
      'Your soil already holds more total organic carbon than its fine mineral fraction can protect. ' +
      'This is common in Corn Belt Mollisols and other historically prairie soils, and it has two ' +
      'consequences that no carbon program will volunteer. First, there is little room to stabilise ' +
      'NEW carbon — so per-ton payments are unlikely to materialise. Second, a large share of the ' +
      'carbon already there sits in unprotected particulate form (Cotrufo et al. 2019) and is ' +
      'vulnerable to loss if you till — which matters a great deal if you have signed a permanence ' +
      'obligation. If you enrol at all, strongly prefer a flat per-acre program.',
    sequestrationMultiplier: 0.3,
  };
}

/**
 * Adjust a published national sequestration range to THIS field.
 *
 * This is the payoff of the whole exercise: the literature's range is what happened across many
 * fields with many different saturation states. Knowing where this field sits lets us scale it.
 * We do NOT invent precision — we scale the published range and keep it a range.
 */
export function fieldAdjustedRange({ low, central, high }, band) {
  const m = band.sequestrationMultiplier;
  return {
    low: round(low * m, 3),
    central: round(central * m, 3),
    high: round(high * m, 3),
    multiplier: m,
  };
}

const round = (n, d) => {
  const f = 10 ** d;
  return Math.round(n * f) / f;
};
