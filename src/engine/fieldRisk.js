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

const DRAINAGE_RISK = {
  'Very poorly drained': {
    level: 'high', color: '#B91C1C', expectedYieldPct: -6,
    label: 'High risk of transition yield drag',
    body: 'Very poorly drained soils are the worst case for no-till establishment. Residue keeps an ' +
          'already-wet, cold seedbed colder and wetter, delaying emergence. Expect a meaningful yield ' +
          'penalty in early years. Strip-till or tile drainage first would be the sober move — and if a ' +
          'carbon program is pushing you straight to full no-till here, that is a reason to slow down.',
  },
  'Poorly drained': {
    level: 'high', color: '#B91C1C', expectedYieldPct: -5,
    label: 'High risk of transition yield drag',
    body: 'Poorly drained soils reliably show a no-till transition penalty from cold, wet spring ' +
          'seedbeds. Budget for a yield hit in the first few years. Consider strip-till, which gets you ' +
          'most of the residue benefit while still warming the seed row.',
  },
  'Somewhat poorly drained': {
    level: 'moderate', color: '#B45309', expectedYieldPct: -3,
    label: 'Moderate risk of transition yield drag',
    body: 'Somewhat poorly drained soils typically show a modest early yield penalty under no-till that ' +
          'fades over roughly 3–5 years as structure and biology adjust. Real, but manageable — and ' +
          'usually worth planning for rather than being surprised by.',
  },
  'Moderately well drained': {
    level: 'low', color: '#4D7C0F', expectedYieldPct: -1,
    label: 'Low risk of transition yield drag',
    body: 'Moderately well drained soils generally tolerate no-till with little or no yield penalty. ' +
          'Any early effect is usually small and short-lived.',
  },
  'Well drained': {
    level: 'low', color: '#15803D', expectedYieldPct: 0,
    label: 'Minimal yield-drag risk',
    body: 'Well drained soils are the best case for no-till. The cold-wet-seedbed mechanism that drives ' +
          'transition yield drag largely does not apply here. You should not expect a meaningful penalty.',
  },
  'Somewhat excessively drained': {
    level: 'low', color: '#15803D', expectedYieldPct: 0,
    label: 'Minimal yield-drag risk — and residue helps you',
    body: 'On freely draining soils, no-till residue helps rather than hurts: it conserves moisture. If ' +
          'anything, expect residue cover to reduce drought stress.',
  },
  'Excessively drained': {
    level: 'low', color: '#15803D', expectedYieldPct: 0,
    label: 'Minimal yield-drag risk — and residue helps you',
    body: 'Excessively drained soils lose moisture readily. No-till residue conserves it. The transition ' +
          'yield-drag concern largely does not apply, and cover may be a net agronomic benefit.',
  },
};

export function yieldDragRisk(drainageClass) {
  const hit = DRAINAGE_RISK[drainageClass];
  if (hit) return { ...hit, drainageClass, known: true };

  return {
    level: 'unknown', color: '#64748B', expectedYieldPct: 0, drainageClass: drainageClass || 'Unknown',
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
