// USA Soil & Water Test Report Interpreter
// Reference ranges drawn from:
//   • USDA NRCS Soil Quality Indicator Sheets
//   • Cornell Soil Health Assessment (CASH) framework
//   • University Extension lab guidelines (Penn State, Iowa State, UGA, UC Davis)
//   • US EPA National Primary & Secondary Drinking Water Regulations (40 CFR 141/143)
//   • EPA "Parameters of Water Quality" — irrigation suitability bands
//
// Each parameter returns:
//   { status: 'low' | 'optimal' | 'high' | 'critical',
//     verdict: short label,
//     guidance: 2–4 sentence USA-tailored, crop-aware recommendation,
//     refRange: "x – y unit" string for display }

// ─── Helpers ──────────────────────────────────────────────────────
const band = (v, low, high) => {
  if (v == null || isNaN(v)) return 'unknown';
  if (v < low)  return 'low';
  if (v > high) return 'high';
  return 'optimal';
};

const critical = (v, criticalLow, criticalHigh) => {
  if (v == null || isNaN(v)) return false;
  return v < criticalLow || v > criticalHigh;
};

// ─── SOIL PARAMETER LOGIC ─────────────────────────────────────────
// Crop context tweaks recommendations.
const CROP_PROFILES = {
  'corn':       { name: 'Corn (maize)',          pHLow: 6.0, pHHigh: 7.0, nDemand: 'high'   },
  'soybean':    { name: 'Soybean',                pHLow: 6.2, pHHigh: 7.0, nDemand: 'low'    },
  'wheat':      { name: 'Wheat',                  pHLow: 6.0, pHHigh: 7.5, nDemand: 'medium' },
  'cotton':     { name: 'Cotton',                 pHLow: 5.8, pHHigh: 7.5, nDemand: 'medium' },
  'rice':       { name: 'Rice',                   pHLow: 5.5, pHHigh: 6.8, nDemand: 'high'   },
  'alfalfa':    { name: 'Alfalfa / hay',          pHLow: 6.5, pHHigh: 7.5, nDemand: 'low'    },
  'vegetables': { name: 'Mixed vegetables',       pHLow: 6.0, pHHigh: 7.0, nDemand: 'high'   },
  'orchard':    { name: 'Orchard / tree fruit',   pHLow: 6.0, pHHigh: 7.0, nDemand: 'medium' },
  'pasture':    { name: 'Pasture / grazing',      pHLow: 5.8, pHHigh: 7.0, nDemand: 'medium' },
  'generic':    { name: 'Generic cropland',       pHLow: 6.0, pHHigh: 7.0, nDemand: 'medium' },
};

export const CROP_LIST = Object.entries(CROP_PROFILES).map(([k, v]) => ({ key: k, label: v.name }));

// ── pH ───────────────────────────────────────────────────────────
function interpretSoilPH(value, cropProfile) {
  const refLow  = cropProfile.pHLow;
  const refHigh = cropProfile.pHHigh;
  const status  = band(value, refLow, refHigh);
  const isCrit  = critical(value, 5.0, 8.5);

  let verdict, guidance;
  if (status === 'optimal') {
    verdict = 'In the optimal range for your crop';
    guidance = `pH ${value} sits squarely in the agronomic window for ${cropProfile.name}. Maintain by avoiding heavy ammonium fertilizer pulses; recheck every 3 years per NRCS guidance.`;
  } else if (status === 'low') {
    const limeRate = value < 5.5 ? '2–4 tons/acre' : '1–2 tons/acre';
    verdict = isCrit ? 'CRITICAL — strongly acidic' : 'Below optimal — acidic';
    guidance = `pH ${value} is below the ${refLow}–${refHigh} window for ${cropProfile.name}. Apply agricultural lime at roughly ${limeRate} (Penn State Extension rule of thumb; confirm with a buffer-pH test from your lab). Aluminum toxicity becomes a yield-limiting factor below pH 5.5.`;
  } else {
    verdict = isCrit ? 'CRITICAL — strongly alkaline' : 'Above optimal — alkaline';
    guidance = `pH ${value} exceeds ${refHigh}. Elemental sulfur at 300–600 lb/acre (UC Davis SSP recommendation) will gradually lower pH; expect 6–12 months to see effect. Above pH 7.8 iron, manganese, and zinc become unavailable — watch for interveinal chlorosis.`;
  }
  return { name: 'Soil pH', value, unit: '', refRange: `${refLow} – ${refHigh}`, status: isCrit ? 'critical' : status, verdict, guidance };
}

// ── Soil Organic Matter (OM%) ────────────────────────────────────
function interpretOM(value) {
  // NRCS / Cornell CASH: <2% degraded, 2–4 typical Midwest cropland, >5% excellent
  const status = value < 2 ? 'low' : value > 5 ? 'high' : 'optimal';
  let verdict, guidance;
  if (status === 'low') {
    verdict = 'Depleted — below NRCS healthy threshold';
    guidance = `Organic matter at ${value}% is below the 2% threshold NRCS flags as degraded. Build OM with cover crops (cereal rye, hairy vetch — both qualify for NRCS EQIP cost-share), retain crop residues, and reduce tillage intensity. Expect ~0.1–0.2% OM gain per year with consistent practice change.`;
  } else if (status === 'high') {
    verdict = 'Excellent — well above regional averages';
    guidance = `OM at ${value}% is exceptional for US cropland (Midwest average is ~3.5%). Maintain by continuing conservation practices. This level qualifies you favorably for ecosystem service payments under USDA NRCS CSP and most carbon market programs.`;
  } else {
    verdict = 'Healthy — typical productive cropland';
    guidance = `OM at ${value}% is within the productive range for US cropland. To push toward 4–5%, layer cover-crop diversity (≥3 species mixes) and consider integrating livestock or compost amendments where logistically possible.`;
  }
  return { name: 'Organic Matter', value, unit: '%', refRange: '2.0 – 5.0%', status, verdict, guidance };
}

// ── Phosphorus (P, Mehlich-3 or Bray-1, ppm) ────────────────────
function interpretP(value) {
  // Iowa State / Penn State P interp for row crops:
  //  <15 ppm low, 15–30 optimum, 30–50 high, >50 excessive (env risk)
  const status =
    value < 15 ? 'low' :
    value > 50 ? 'critical' :
    value > 30 ? 'high' : 'optimal';
  let verdict, guidance;
  if (status === 'low') {
    verdict = 'Deficient — yield-limiting';
    guidance = `P at ${value} ppm will limit early-season root development and yield. Apply 40–80 lb P₂O₅/acre as starter (banded 2"×2" placement triples agronomic efficiency vs. broadcast — Iowa State recommendation). Triple superphosphate or MAP are the most cost-effective sources.`;
  } else if (status === 'optimal') {
    verdict = 'Optimal — maintain via crop removal';
    guidance = `P at ${value} ppm is in the agronomic optimum. Replace only what the crop removes (~0.4 lb P₂O₅ per bushel of corn, 0.8 per bushel of soybean) to avoid environmental loading.`;
  } else if (status === 'high') {
    verdict = 'Build-up — reduce inputs';
    guidance = `P at ${value} ppm exceeds crop needs. Skip P fertilization for 1–2 seasons and re-test. Higher P levels increase runoff risk in adjacent surface waters (a regulated concern under USDA conservation compliance for highly-erodible land).`;
  } else {
    verdict = 'CRITICAL — environmental risk';
    guidance = `P at ${value} ppm presents a significant water-quality risk. Halt all P inputs. In Chesapeake Bay, Lake Erie, and Mississippi-basin watersheds, fields above 50 ppm P are subject to enhanced nutrient management plan requirements (state-specific). Build buffer strips along waterways.`;
  }
  return { name: 'Phosphorus (P)', value, unit: 'ppm', refRange: '15 – 30 ppm (optimal)', status, verdict, guidance };
}

// ── Potassium (K, ppm) ───────────────────────────────────────────
function interpretK(value) {
  const status =
    value < 100 ? 'low' :
    value > 250 ? 'high' :
    value > 160 ? 'optimal' : 'low';   // 100–160 marginal still flagged low
  let verdict, guidance;
  if (status === 'low') {
    verdict = 'Below sufficiency — supplement';
    guidance = `K at ${value} ppm is below the 160 ppm sufficiency threshold most US universities use for row crops. Apply 60–120 lb K₂O/acre as muriate of potash (KCl) for non-chloride-sensitive crops, or sulfate of potash (SOP) for tobacco, potatoes, or vegetables.`;
  } else if (status === 'high') {
    verdict = 'Build-up — reduce or skip';
    guidance = `K at ${value} ppm is above crop needs. Skip K applications for 1–2 cycles. High K can suppress magnesium uptake — monitor Mg levels and Ca:Mg:K ratios on your next test.`;
  } else {
    verdict = 'Sufficient — maintenance only';
    guidance = `K at ${value} ppm is sufficient. Apply maintenance rates equal to crop removal (~0.2 lb K₂O per bushel of corn, 1.4 per bushel of soybean grain).`;
  }
  return { name: 'Potassium (K)', value, unit: 'ppm', refRange: '160 – 250 ppm', status, verdict, guidance };
}

// ── CEC ─────────────────────────────────────────────────────────
function interpretCEC(value) {
  // Penn State / Cornell: <10 sandy/low-buffer, 10–25 typical loam, >25 clay/peat
  const status = value < 10 ? 'low' : value > 25 ? 'high' : 'optimal';
  let verdict, guidance;
  if (status === 'low') {
    verdict = 'Low buffering — sandy soil';
    guidance = `CEC of ${value} meq/100g indicates sandy or low-OM soil with limited nutrient-holding capacity. Split N applications into 2–3 in-season events to reduce leaching. Build CEC over time by raising OM (1% OM ≈ +2–5 CEC units).`;
  } else if (status === 'high') {
    verdict = 'High buffering — clay-dominated';
    guidance = `CEC of ${value} meq/100g is typical of clay or organic-rich soils. Nutrient retention is excellent, but watch drainage and timing — wet clay soils are prone to compaction. Subsoiling at correct moisture (Proctor density planning) preserves structure.`;
  } else {
    verdict = 'Productive loam';
    guidance = `CEC of ${value} meq/100g indicates a productive loam profile. Good native buffering — standard fertilizer programs work well.`;
  }
  return { name: 'CEC', value, unit: 'meq/100g', refRange: '10 – 25 meq/100g', status, verdict, guidance };
}

// ── Nitrogen (nitrate-N, ppm — surface 0–12") ───────────────────
function interpretN(value, cropProfile) {
  const status = value < 10 ? 'low' : value > 25 ? 'high' : 'optimal';
  let verdict, guidance;
  if (status === 'low') {
    const rate = cropProfile.nDemand === 'high' ? '160–220' : cropProfile.nDemand === 'medium' ? '100–140' : '40–60';
    verdict = 'Pre-plant N deficit';
    guidance = `Nitrate-N at ${value} ppm is low for ${cropProfile.name}. Plan ${rate} lb N/acre using the Late-Spring Nitrate Test (LSNT) or PSNT to refine sidedress timing. Splitting between pre-plant and V5–V6 sidedress is the highest-efficiency strategy.`;
  } else if (status === 'high') {
    verdict = 'Carry-over — reduce N program';
    guidance = `Nitrate-N at ${value} ppm shows significant carry-over from previous season. Credit this fully in your N budget (1 ppm NO₃-N ≈ 4 lb N/acre in the top foot). Avoid pre-plant N; rely on in-season tools.`;
  } else {
    verdict = 'Adequate baseline';
    guidance = `Nitrate-N at ${value} ppm provides a reasonable baseline. For ${cropProfile.name}, plan in-season N based on tissue testing or in-field reference strips.`;
  }
  return { name: 'Nitrate-N', value, unit: 'ppm', refRange: '10 – 25 ppm', status, verdict, guidance };
}

// ─── WATER PARAMETERS (irrigation / well water) ──────────────────
// Standards: EPA NPDWR (drinking), and FAO 29 / UC Davis irrigation guides.

function interpretWaterPH(value) {
  const status = band(value, 6.5, 8.5);
  let verdict, guidance;
  if (status === 'optimal') {
    verdict = 'Within EPA secondary standard';
    guidance = `pH ${value} is within EPA's 6.5–8.5 secondary drinking-water range and FAO-29 irrigation suitability band. Safe for crop application and livestock.`;
  } else if (status === 'low') {
    verdict = 'Acidic — corrosive risk';
    guidance = `pH ${value} is below EPA 6.5. Acidic water corrodes metal irrigation lines and leaches copper/lead from plumbing. Install a neutralizing filter (calcite/magnesia media); recheck quarterly.`;
  } else {
    verdict = 'Alkaline — scale & bicarbonate risk';
    guidance = `pH ${value} is above EPA 8.5. Alkaline water deposits scale on emitters and elevates bicarbonate, which raises soil pH over time. Acid injection (sulfuric or urea-sulfuric) at the pump head is the standard remediation for drip systems.`;
  }
  return { name: 'Water pH', value, unit: '', refRange: '6.5 – 8.5 (EPA)', status, verdict, guidance };
}

function interpretEC(value) {
  // dS/m. <0.7 no salinity restriction, 0.7–3.0 slight–moderate, >3.0 severe (FAO-29)
  const status = value < 0.7 ? 'optimal' : value > 3.0 ? 'critical' : 'high';
  let verdict, guidance;
  if (status === 'optimal') {
    verdict = 'No salinity restriction';
    guidance = `EC ${value} dS/m falls in FAO-29's "no restriction" band. Suitable for all common US row crops including salt-sensitive species (beans, onions, carrots).`;
  } else if (status === 'high') {
    verdict = 'Slight to moderate salinity';
    guidance = `EC ${value} dS/m will reduce yields for salt-sensitive crops (beans, lettuce, strawberries). Manage with 15–25% leaching fraction, switch to drip irrigation to avoid foliar salt deposition, and choose tolerant cultivars (cotton, barley, durum wheat all handle this range).`;
  } else {
    verdict = 'CRITICAL — severe salinity';
    guidance = `EC ${value} dS/m is in FAO-29 severe-restriction territory. Only highly tolerant crops (barley, bermudagrass, sugar beet) will perform. In US southwest, blend with a fresher source to reach EC <2.0, or invest in reverse osmosis. Watch for sodium adsorption — request a full SAR analysis.`;
  }
  return { name: 'Electrical Conductivity', value, unit: 'dS/m', refRange: '< 0.7 dS/m (FAO-29)', status, verdict, guidance };
}

function interpretNitrateWater(value) {
  // EPA MCL for nitrate-N in drinking water = 10 mg/L
  const status = value > 10 ? 'critical' : value > 5 ? 'high' : 'optimal';
  let verdict, guidance;
  if (status === 'critical') {
    verdict = 'EXCEEDS EPA MCL — health hazard';
    guidance = `Nitrate-N at ${value} mg/L exceeds the EPA Maximum Contaminant Level of 10 mg/L. Do NOT use for infant formula or pregnant women — causes methemoglobinemia ("blue baby syndrome"). Switch domestic supply, install reverse osmosis or ion-exchange treatment, and investigate upgradient nutrient sources (fertilizer, septic, livestock).`;
  } else if (status === 'high') {
    verdict = 'Elevated — monitor closely';
    guidance = `Nitrate-N at ${value} mg/L is below the EPA MCL but elevated. Re-test quarterly; trending up suggests nearby N loading. For irrigation, credit this against fertilizer needs (1 mg/L NO₃-N ≈ 2.7 lb N/acre per foot of water applied).`;
  } else {
    verdict = 'Safe for all uses';
    guidance = `Nitrate-N at ${value} mg/L is well within EPA limits. Safe for drinking, livestock, and irrigation.`;
  }
  return { name: 'Nitrate-N', value, unit: 'mg/L', refRange: '< 10 mg/L (EPA MCL)', status, verdict, guidance };
}

function interpretHardness(value) {
  // mg/L as CaCO₃: <60 soft, 60–120 moderate, 120–180 hard, >180 very hard (USGS)
  const status = value < 60 ? 'low' : value > 180 ? 'high' : 'optimal';
  let verdict, guidance;
  if (status === 'low') {
    verdict = 'Soft water';
    guidance = `Hardness ${value} mg/L (soft). Generally desirable, but soft water dissolves metal piping more aggressively — verify lead and copper are under EPA limits (15 ppb / 1.3 ppm respectively).`;
  } else if (status === 'high') {
    verdict = 'Very hard — scale risk';
    guidance = `Hardness ${value} mg/L is very hard. Expect scale on drip emitters and boilers. Acid injection or polyphosphate dosing prevents emitter plugging. Consider point-of-use softening for household lines (whole-house softeners remove Ca/Mg by ion exchange).`;
  } else {
    verdict = 'Moderate — within USGS norms';
    guidance = `Hardness ${value} mg/L sits in the moderate-to-hard band typical of US groundwater. No specific action needed.`;
  }
  return { name: 'Hardness (CaCO₃)', value, unit: 'mg/L', refRange: '60 – 180 mg/L', status, verdict, guidance };
}

function interpretChloride(value) {
  // EPA secondary standard: 250 mg/L (taste); irrigation: >140 mg/L flags Cl⁻ toxicity for sensitive crops
  const status = value > 250 ? 'critical' : value > 140 ? 'high' : 'optimal';
  let verdict, guidance;
  if (status === 'critical') {
    verdict = 'Above EPA secondary standard';
    guidance = `Chloride ${value} mg/L exceeds the EPA 250 mg/L secondary (taste/aesthetic) standard. Will damage Cl-sensitive crops (avocado, citrus, grape, strawberry). Source likely brackish intrusion or road salt — investigate upgradient.`;
  } else if (status === 'high') {
    verdict = 'High — sensitive crops at risk';
    guidance = `Chloride ${value} mg/L exceeds the 140 mg/L threshold for sensitive crops. Use drip rather than overhead sprinkler to avoid foliar burn, and apply a 20% leaching fraction.`;
  } else {
    verdict = 'Within limits';
    guidance = `Chloride ${value} mg/L is acceptable for all uses.`;
  }
  return { name: 'Chloride', value, unit: 'mg/L', refRange: '< 250 mg/L (EPA)', status, verdict, guidance };
}

// ─── Public API ──────────────────────────────────────────────────
export function interpretSoilReport(inputs) {
  const crop = CROP_PROFILES[inputs.crop] || CROP_PROFILES.generic;
  const results = [];
  if (inputs.pH         != null && inputs.pH         !== '') results.push(interpretSoilPH(parseFloat(inputs.pH), crop));
  if (inputs.om         != null && inputs.om         !== '') results.push(interpretOM(parseFloat(inputs.om)));
  if (inputs.phosphorus != null && inputs.phosphorus !== '') results.push(interpretP(parseFloat(inputs.phosphorus)));
  if (inputs.potassium  != null && inputs.potassium  !== '') results.push(interpretK(parseFloat(inputs.potassium)));
  if (inputs.cec        != null && inputs.cec        !== '') results.push(interpretCEC(parseFloat(inputs.cec)));
  if (inputs.nitrogen   != null && inputs.nitrogen   !== '') results.push(interpretN(parseFloat(inputs.nitrogen), crop));
  return finalize(results, 'soil', crop);
}

export function interpretWaterReport(inputs) {
  const results = [];
  if (inputs.pH        != null && inputs.pH        !== '') results.push(interpretWaterPH(parseFloat(inputs.pH)));
  if (inputs.ec        != null && inputs.ec        !== '') results.push(interpretEC(parseFloat(inputs.ec)));
  if (inputs.nitrate   != null && inputs.nitrate   !== '') results.push(interpretNitrateWater(parseFloat(inputs.nitrate)));
  if (inputs.hardness  != null && inputs.hardness  !== '') results.push(interpretHardness(parseFloat(inputs.hardness)));
  if (inputs.chloride  != null && inputs.chloride  !== '') results.push(interpretChloride(parseFloat(inputs.chloride)));
  return finalize(results, 'water');
}

function finalize(results, type, cropProfile = null) {
  if (!results.length) return null;
  const counts = { optimal: 0, low: 0, high: 0, critical: 0 };
  results.forEach(r => { counts[r.status] = (counts[r.status] || 0) + 1; });
  const total = results.length;
  const healthScore = Math.round(
    (counts.optimal * 100 + counts.low * 50 + counts.high * 50 + counts.critical * 0) / total
  );

  const priorities = results
    .filter(r => r.status === 'critical' || r.status === 'low' || r.status === 'high')
    .sort((a, b) => (a.status === 'critical' ? -1 : 1));

  return {
    type,
    cropProfile: cropProfile ? cropProfile.name : null,
    results,
    counts,
    healthScore,
    priorities,
    summary: buildSummary(counts, total, type),
  };
}

function buildSummary(counts, total, type) {
  if (counts.critical) {
    return `${counts.critical} of ${total} parameter${counts.critical > 1 ? 's' : ''} need urgent attention. Address the critical-level items first — they can either limit yield or trigger regulatory issues.`;
  }
  if (counts.low + counts.high === 0) {
    return `Excellent — every ${type} parameter you supplied is in its optimal band. Maintain current practices and re-test on your normal cadence (soil: every 3 years; water: annually for irrigation, quarterly for drinking).`;
  }
  return `${counts.optimal} of ${total} parameters are optimal; ${counts.low + counts.high} need adjustment. Work through the priority items below in order — most are correctable within one growing season.`;
}
