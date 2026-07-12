/**
 * FIELD-SPECIFIC RISK MODELS
 * ==========================
 * Two questions a farmer desperately wants answered, whose answers are already sitting in free
 * federal databases, and which no carbon program will answer for them:
 *
 *   1. "Will no-till cost me yield on THIS field?"     → SSURGO drainage class
 *   2. "Will they even count my practice as new?"      → CDL rotation history
 *
 * The second one is the sharpest. A farmer can sign a multi-year contract, change their farming,
 * and then discover their practice was ruled NON-ADDITIONAL — because satellite records show they
 * were already doing it. Additionality is assessed against exactly this kind of historical record.
 * Better to find out now, for free, than after signing.
 */

/* ─────────────────────────────────────────────────────────────────────────
   1. YIELD-DRAG RISK FROM SOIL DRAINAGE
   ─────────────────────────────────────────────────────────────────────────
   The transition yield drag under no-till is not uniform — it is overwhelmingly a
   function of drainage. On poorly drained, heavy soils, undisturbed residue keeps the
   seedbed cold and wet in spring, delaying emergence and costing yield. On well-drained
   soils the effect is often negligible from year one.

   SSURGO publishes a drainage class for every soil in the United States. This is the
   single most useful free predictor of whether no-till will hurt, and it is simply
   never surfaced to farmers deciding on a carbon contract.
*/

/*
 * THE NUMBERS BELOW ARE CITED. AN EARLIER VERSION'S WERE NOT.
 * ----------------------------------------------------------
 * This table used to hold −6%, −5%, −3%, −1%, 0% — figures that were nowhere in the literature and
 * that I had simply judged to be about right. They were not about right. When I finally went and
 * read the meta-analyses, the real evidence was roughly FOUR TIMES more severe at the bad end:
 *
 *   Pittelkow et al. (2015), Field Crops Research — 678 studies, 6,005 paired observations:
 *     no-till reduces yield by 5.1% ON AVERAGE, but MATCHES conventional tillage under rainfed
 *     dry conditions. The average hides everything that matters.
 *
 *   Al-Kaisi et al. (2015) / DeFelice et al. (2006):
 *     on POORLY DRAINED northern soils the corn penalty has been measured at close to 20%.
 *     Losses concentrate in cold, wet, poorly drained ground; no-till yields MORE in the warm,
 *     well-drained South.
 *
 * Which is the whole argument for this tool: drainage is not a footnote, it is the single most
 * important free fact about your field, and no carbon program will look it up for you.
 *
 * Values are RANGES, never point estimates, for the same reason everything else here is.
 */

const DRAINAGE_RISK = {
  'Very poorly drained': {
    level: 'high', color: '#B91C1C',
    yieldPct: { low: -20, central: -12, high: -5 },
    src: 'alkaisi2015',
    label: 'High risk of transition yield drag',
    body: 'The worst case for no-till. Residue keeps an already-wet, cold seedbed colder and wetter, ' +
          'delaying emergence. On poorly drained northern ground the measured corn penalty runs as high ' +
          'as 20% — four times the global average. Tile drainage or strip-till first is the sober move. ' +
          'If a carbon program is pushing you straight into full no-till here, that is a reason to slow ' +
          'down, not to sign.',
  },
  'Poorly drained': {
    level: 'high', color: '#B91C1C',
    yieldPct: { low: -20, central: -10, high: -5 },
    src: 'alkaisi2015',
    label: 'High risk of transition yield drag',
    body: 'Poorly drained soils reliably show a no-till penalty from cold, wet spring seedbeds, and the ' +
          'measured corn penalty on this kind of ground reaches close to 20%. Budget for a real yield ' +
          'hit in the early years. Strip-till gets you most of the residue benefit while still warming ' +
          'the seed row.',
  },
  'Somewhat poorly drained': {
    level: 'moderate', color: '#B45309',
    yieldPct: { low: -10, central: -5.1, high: 0 },
    src: 'pittelkow2015',
    label: 'Moderate risk of transition yield drag',
    body: 'Expect something close to the global average penalty of about 5%, fading over roughly 3–5 ' +
          'years as structure and biology adjust. Real, but manageable — and much better planned for ' +
          'than discovered.',
  },
  'Moderately well drained': {
    level: 'low', color: '#4D7C0F',
    yieldPct: { low: -5.1, central: -2, high: 0 },
    src: 'pittelkow2015',
    label: 'Low risk of transition yield drag',
    body: 'Generally tolerates no-till with little penalty. Any early effect is usually small and ' +
          'short-lived, and rotation plus residue retention shrinks it further.',
  },
  'Well drained': {
    level: 'low', color: '#15803D',
    yieldPct: { low: -2, central: 0, high: 2 },
    src: 'pittelkow2015',
    label: 'Minimal yield-drag risk',
    body: 'The best case. The cold-wet-seedbed mechanism that drives transition yield drag largely does ' +
          'not apply, and no-till matches conventional tillage on well-drained rainfed ground. Do not ' +
          'let anyone talk you into budgeting a penalty you are unlikely to pay.',
  },
  'Somewhat excessively drained': {
    level: 'low', color: '#15803D',
    yieldPct: { low: 0, central: 1, high: 3 },
    src: 'pittelkow2015',
    label: 'Minimal risk — residue is likely to HELP',
    body: 'On freely draining ground, no-till residue conserves moisture rather than trapping it. ' +
          'No-till performs best in exactly these rainfed, drier conditions, and residue cover may ' +
          'reduce drought stress.',
  },
  'Excessively drained': {
    level: 'low', color: '#15803D',
    yieldPct: { low: 0, central: 1, high: 3 },
    src: 'pittelkow2015',
    label: 'Minimal risk — residue is likely to HELP',
    body: 'Excessively drained soils lose moisture readily and no-till residue conserves it. The ' +
          'transition-drag concern does not really apply here; cover is more likely to be a net ' +
          'agronomic gain.',
  },
};

export function yieldDragRisk(drainageClass) {
  const hit = DRAINAGE_RISK[drainageClass];
  if (hit) {
    return { ...hit, expectedYieldPct: hit.yieldPct.central, drainageClass, known: true };
  }

  return {
    level: 'unknown', color: '#64748B',
    yieldPct: { low: 0, central: 0, high: 0 },
    expectedYieldPct: 0,
    src: null,
    drainageClass: drainageClass || 'Unknown',
    known: false,
    label: 'Drainage class not reported for this soil',
    body: 'SSURGO does not report a drainage class for this map unit, so we will not guess at your ' +
          'yield-drag risk. Your local NRCS office or agronomist can assess drainage on the ground.',
  };
}

/* ─────────────────────────────────────────────────────────────────────────
   2. ADDITIONALITY RISK FROM ROTATION HISTORY
   ─────────────────────────────────────────────────────────────────────────
   "Additionality" is the requirement that carbon credits reflect a change that would not have
   happened anyway. If satellite records show you have ALREADY been running a diverse rotation or
   were already in perennial cover, a program may decline to credit you — after you have signed.

   The USDA Cropland Data Layer records what was grown on every 30m pixel in the US every year
   since 2008. We read the actual history of the user's field and tell them what it implies.
*/

/** CDL categories that indicate the land is already in a low-disturbance / high-carbon state. */
const PERENNIAL_OR_COVER = [
  'Alfalfa', 'Other Hay/Non Alfalfa', 'Grassland/Pasture', 'Grass/Pasture',
  'Fallow/Idle Cropland', 'Clover/Wildflowers', 'Sod/Grass Seed', 'Switchgrass',
];

const NON_CROP = [
  'Developed', 'Developed/Open Space', 'Developed/Low Intensity',
  'Developed/Medium Intensity', 'Developed/High Intensity',
  'Deciduous Forest', 'Evergreen Forest', 'Mixed Forest', 'Shrubland',
  'Open Water', 'Woody Wetlands', 'Herbaceous Wetlands', 'Barren',
];

export function additionalityRisk(rotation) {
  // rotation: [{ year, crop }]
  const crops = rotation.filter(r => r.crop && r.crop !== '?').map(r => r.crop);

  if (crops.length === 0) {
    return {
      level: 'unknown', color: '#64748B',
      label: 'No crop history available',
      body: 'We could not read a crop history for this location.',
      isCropland: false,
    };
  }

  const nonCropYears = crops.filter(c => NON_CROP.some(n => c.includes(n)));
  if (nonCropYears.length >= crops.length / 2) {
    return {
      level: 'blocker', color: '#B91C1C',
      label: 'This does not look like cropland',
      body: `Satellite records classify this location as "${crops[crops.length - 1]}" in most recent ` +
            'years. Either the coordinates are off — try dropping the pin in the middle of the field ' +
            'rather than near a road or building — or this parcel is not row-cropped, in which case ' +
            'cropland carbon programs do not apply.',
      isCropland: false,
    };
  }

  const perennialYears = crops.filter(c => PERENNIAL_OR_COVER.some(p => c.includes(p)));

  if (perennialYears.length >= crops.length * 0.6) {
    return {
      level: 'high', color: '#B91C1C',
      label: 'High additionality risk — you may already be doing it',
      body: 'Your field has been in perennial cover, hay or pasture for most of the recorded years. ' +
            'That is excellent for soil carbon — and precisely the problem for a carbon contract. A ' +
            'program may rule that you were already sequestering, that no practice CHANGE occurred, and ' +
            'therefore that you are not additional. Get a written additionality determination BEFORE you ' +
            'sign anything. This is the single most common way farmers end up bound by a contract that ' +
            'pays them nothing.',
      isCropland: true,
    };
  }

  // Distinct crops → rotational diversity
  const distinct = new Set(crops);
  const isMonoculture = distinct.size === 1;
  const isSimpleRotation = distinct.size === 2;

  if (isMonoculture) {
    return {
      level: 'low', color: '#15803D',
      label: 'Low additionality risk — clear headroom to change',
      body: `Your field shows continuous ${crops[0]} across the recorded years. A monoculture with ` +
            'conventional management is the clearest possible case for additionality: any move to cover ' +
            'crops, no-till or rotation is unambiguously a change from your documented baseline. It also ' +
            'means you likely have real agronomic headroom — continuous monoculture is typically where ' +
            'soil carbon has been most depleted.',
      isCropland: true,
    };
  }

  if (isSimpleRotation) {
    return {
      level: 'low', color: '#15803D',
      label: 'Low additionality risk',
      body: `Your field shows a ${[...distinct].join('/')} rotation — the standard Corn Belt pattern. ` +
            'Adding cover crops or moving to no-till would be a clear change from this documented ' +
            'baseline, so additionality should not be an obstacle. Note that the rotation ITSELF will not ' +
            'be credited: it is your baseline, not your improvement.',
      isCropland: true,
    };
  }

  return {
    level: 'moderate', color: '#B45309',
    label: 'Moderate additionality risk — you are already diversified',
    body: `Your field shows a diverse rotation (${[...distinct].join(', ')}). Diversity is good farming, ` +
          'but it complicates a carbon claim: the more you were already doing, the less room there is for ' +
          'a creditable CHANGE, and the more likely a program is to discount your baseline. Ask for a ' +
          'written additionality assessment against your actual history before signing.',
    isCropland: true,
  };
}

/** Summarise a rotation into a compact human string, e.g. "Corn → Soy → Corn → Soy → Corn". */
export function rotationSummary(rotation) {
  return rotation
    .filter(r => r.crop && r.crop !== '?')
    .map(r => shortCrop(r.crop))
    .join(' → ');
}

function shortCrop(c) {
  if (c.startsWith('Soybean')) return 'Soy';
  if (c.startsWith('Winter Wheat')) return 'W.Wheat';
  if (c.startsWith('Spring Wheat')) return 'S.Wheat';
  if (c.includes('Grassland') || c.includes('Grass/Pasture')) return 'Pasture';
  if (c.includes('Fallow')) return 'Fallow';
  if (c.includes('Developed')) return 'Developed';
  if (c.includes('Alfalfa')) return 'Alfalfa';
  return c;
}
