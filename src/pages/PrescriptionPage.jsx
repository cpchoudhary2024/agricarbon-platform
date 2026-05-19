import { useState, useMemo } from 'react';

const F = { head: '#030C06', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };
const G = { 700: '#155233', 600: '#166534', 100: '#DCFCE7' };

// ─── Soil reference ranges (USDA NRCS / Cornell CASH / Penn State) ─
const SOIL_REFS = {
  pH:  { label: 'Soil pH',              unit: '',          optimal: [6.0, 7.0],   ranges: [[0,5.5,'Very Acidic','#C4694A'],[5.5,6.0,'Acidic','#D97706'],[6.0,7.0,'Optimal','#22C55E'],[7.0,7.5,'Slightly Alkaline','#D97706'],[7.5,14,'Alkaline','#C4694A']] },
  om:  { label: 'Organic Matter',       unit: '%',         optimal: [3.0, 5.0],   ranges: [[0,1.5,'Very Low','#C4694A'],[1.5,3.0,'Low','#D97706'],[3.0,5.0,'Optimal','#22C55E'],[5.0,8.0,'High','#86EFAC'],[8.0,100,'Very High','#22C55E']] },
  n:   { label: 'Total Nitrogen',       unit: 'ppm',       optimal: [20, 40],     ranges: [[0,10,'Very Low','#C4694A'],[10,20,'Low','#D97706'],[20,40,'Optimal','#22C55E'],[40,60,'High','#D97706'],[60,1000,'Very High','#C4694A']] },
  p:   { label: 'Phosphorus (P)',        unit: 'ppm',       optimal: [20, 40],     ranges: [[0,10,'Very Low','#C4694A'],[10,20,'Low','#D97706'],[20,40,'Optimal','#22C55E'],[40,80,'High','#D97706'],[80,1000,'Very High — Env. Risk','#C4694A']] },
  k:   { label: 'Potassium (K)',         unit: 'ppm',       optimal: [125, 200],   ranges: [[0,75,'Very Low','#C4694A'],[75,125,'Low','#D97706'],[125,200,'Optimal','#22C55E'],[200,300,'High','#86EFAC'],[300,10000,'Very High','#D97706']] },
  ca:  { label: 'Calcium (Ca)',          unit: 'ppm',       optimal: [1000, 2000], ranges: [[0,500,'Very Low','#C4694A'],[500,1000,'Low','#D97706'],[1000,2000,'Optimal','#22C55E'],[2000,4000,'High','#86EFAC'],[4000,100000,'Very High','#D97706']] },
  mg:  { label: 'Magnesium (Mg)',        unit: 'ppm',       optimal: [50, 150],    ranges: [[0,25,'Very Low','#C4694A'],[25,50,'Low','#D97706'],[50,150,'Optimal','#22C55E'],[150,300,'High','#D97706'],[300,10000,'Very High','#C4694A']] },
  s:   { label: 'Sulfur (S)',            unit: 'ppm',       optimal: [10, 25],     ranges: [[0,5,'Very Low','#C4694A'],[5,10,'Low','#D97706'],[10,25,'Optimal','#22C55E'],[25,50,'High','#86EFAC'],[50,1000,'Very High','#D97706']] },
  cec: { label: 'CEC',                  unit: 'meq/100g',  optimal: [10, 30],     ranges: [[0,5,'Very Low (Sandy)','#D97706'],[5,10,'Low','#86EFAC'],[10,20,'Medium','#22C55E'],[20,30,'High','#22C55E'],[30,100,'Very High (Clay)','#86EFAC']] },
  zn:  { label: 'Zinc (Zn)',            unit: 'ppm',       optimal: [1.0, 3.0],   ranges: [[0,0.5,'Deficient','#C4694A'],[0.5,1.0,'Low','#D97706'],[1.0,3.0,'Optimal','#22C55E'],[3.0,10,'High','#86EFAC'],[10,1000,'Very High','#D97706']] },
};

// ─── Amendment prescriptions (USDA NRCS / Penn State Extension) ──
const AMENDMENTS = {
  pH: {
    low: {
      name: 'Agricultural Lime (CaCO₃)',
      formula: (v, cec) => Math.round((6.5 - v) * 1000 * Math.max(0.5, (cec || 15) / 10)),
      unit: 'kg/ha',
      target: '6.5 pH',
      note: 'Apply 3–6 months before planting. Do not exceed 4,000 kg/ha per application; split if needed.',
      alt: 'Dolomitic lime if Mg is also deficient',
      source: 'USDA NRCS / NRCS Soil Quality Guide',
    },
    high: {
      name: 'Elemental Sulfur',
      formula: (v, cec) => Math.round((v - 6.5) * 150 * Math.max(0.5, (cec || 15) / 10)),
      unit: 'kg/ha',
      target: '6.5 pH',
      note: 'Sulfur is slow-acting (6–12 months to lower pH). Acidifying fertilizers (ammonium sulfate) can accelerate.',
      alt: 'Iron sulfate (faster acting) or aluminum sulfate',
      source: 'Penn State Extension',
    },
  },
  p: {
    low: {
      name: 'DAP (18-46-0) or Rock Phosphate (organic)',
      formula: (v) => Math.round((30 - v) * 2.29 * 1.5),
      unit: 'kg P₂O₅/ha',
      target: '30 ppm P',
      note: 'P is relatively immobile — band application is 2–3× more efficient than broadcast.',
      alt: 'Bone meal or composted manure for organic certification',
      source: 'Iowa State Extension',
    },
  },
  k: {
    low: {
      name: 'Muriate of Potash (MOP, 0-0-60)',
      formula: (v) => Math.round(Math.max(0, 150 - v) * 1.2),
      unit: 'kg K₂O/ha',
      target: '150 ppm K',
      note: 'Apply in split applications on sandy soils to reduce leaching. Avoid high single applications near seeds.',
      alt: 'Sulfate of Potash (SOP) for chloride-sensitive crops (vegetables, tobacco)',
      source: 'UC Davis Cooperative Extension',
    },
  },
  mg: {
    low: {
      name: 'Dolomitic Limestone or Kieserite',
      formula: (v) => Math.round(Math.max(0, 80 - v) * 8),
      unit: 'kg MgO/ha',
      target: '80 ppm Mg',
      note: 'If pH is also low, use dolomitic lime (fixes both). If pH is fine, use Kieserite (MgSO₄·H₂O).',
      alt: 'Epsom salt foliar spray (MgSO₄) for emergency correction during crop growth',
      source: 'Cornell CALS Extension',
    },
  },
  s: {
    low: {
      name: 'Gypsum (CaSO₄·2H₂O)',
      formula: (v) => Math.round(Math.max(0, 15 - v) * 20),
      unit: 'kg S/ha',
      target: '15 ppm S',
      note: 'Gypsum also improves Ca, soil structure, and water infiltration. Does not affect soil pH.',
      alt: 'Ammonium sulfate (21-0-0-24S) when nitrogen is also needed',
      source: 'USDA NRCS',
    },
  },
  zn: {
    low: {
      name: 'Zinc Sulfate (ZnSO₄)',
      formula: (v) => Math.round(Math.max(0, 1.5 - v) * 8),
      unit: 'kg Zn/ha',
      target: '1.5 ppm Zn',
      note: 'Broadcast and incorporate, or apply as foliar at 0.5–1 kg/ha. Most effective at soil pH < 7.',
      alt: 'Chelated Zn-EDTA for high-pH soils where Zn availability is reduced',
      source: 'USDA NRCS Micronutrient Guide',
    },
  },
};

// ─── Water quality reference (EPA NPDWR / NPDES) ──────────────────
const WATER_FIELDS = [
  { key: 'pH',       label: 'Water pH',                  placeholder: '6.5–8.5 (EPA range)', step: '0.1',
    interpret: v => {
      if (v >= 6.5 && v <= 8.5) return [{ text: 'Meets EPA drinking water standard (6.5–8.5)', ok: true }, { text: 'Suitable for irrigation (6.0–8.5)', ok: true }];
      if (v < 6.5)              return [{ text: 'Below EPA drinking water standard — corrosion risk', ok: false }, { text: v >= 6.0 ? 'Acceptable for irrigation' : 'Not recommended for irrigation', ok: v >= 6.0 }];
      return [{ text: 'Above EPA drinking water standard — scaling risk', ok: false }, { text: 'Acceptable for most irrigation', ok: true }];
    },
    note: 'EPA NPDWR secondary standard: 6.5–8.5. pH affects solubility of pipe metals and chemical treatment.' },
  { key: 'nitrate',  label: 'Nitrate-N (NO₃-N) mg/L',   placeholder: 'EPA limit: 10 mg/L', step: '0.1',
    interpret: v => [
      { text: v <= 10 ? `Safe — below EPA MCL of 10 mg/L (yours: ${v})` : `⚠ Exceeds EPA primary MCL of 10 mg/L — blue-baby syndrome risk`, ok: v <= 10 },
      { text: v <= 3  ? 'Low ecological risk' : '⚠ Ecological concern — eutrophication risk in receiving waters', ok: v <= 3 },
    ],
    note: 'EPA Maximum Contaminant Level (MCL): 10 mg/L NO₃-N. Above 3 mg/L causes ecological concern in streams.' },
  { key: 'do',       label: 'Dissolved Oxygen (mg/L)',   placeholder: 'Good: ≥ 8 mg/L', step: '0.1',
    interpret: v => [{
      text: v >= 8 ? 'Excellent — supports all aquatic life' : v >= 6 ? 'Good — adequate for most species' : v >= 4 ? '⚠ Fair — stress for sensitive species' : '⚠ Poor — hypoxic; aquatic mortality risk',
      ok: v >= 6,
    }],
    note: 'EPA 304(a) aquatic life criterion: ≥ 6 mg/L for warm-water fisheries. Below 4 mg/L causes widespread mortality.' },
  { key: 'turbidity',label: 'Turbidity (NTU)',           placeholder: 'Drink limit: 1 NTU', step: '0.5',
    interpret: v => [
      { text: v <= 1   ? 'Meets EPA drinking water turbidity standard (≤ 1 NTU)' : `⚠ Exceeds EPA drinking standard — filtration required`, ok: v <= 1 },
      { text: v <= 25  ? 'Acceptable for aquatic habitat' : '⚠ Significant aquatic habitat degradation — EPA 304(a)', ok: v <= 25 },
    ],
    note: 'EPA drinking standard: ≤ 1 NTU. Habitat degradation concern above 25 NTU (EPA 304(a)).' },
];

// ─── Helpers ──────────────────────────────────────────────────────
function getStatus(ref, val) {
  const v = parseFloat(val);
  if (isNaN(v) || val === '') return null;
  for (const [min, max, label, color] of ref.ranges) {
    if (v >= min && v < max) return { label, color };
  }
  return null;
}

function isLow(ref, val)  { const v = parseFloat(val); return !isNaN(v) && val !== '' && v < ref.optimal[0]; }
function isHigh(ref, val) { const v = parseFloat(val); return !isNaN(v) && val !== '' && v > ref.optimal[1]; }

const S = {
  page:  { minHeight: '100vh', background: '#FEFDF9', fontFamily: 'Inter, sans-serif', paddingTop: '80px' },
  inner: { maxWidth: '1080px', margin: '0 auto', padding: 'clamp(24px,4vw,52px) clamp(16px,3vw,40px)' },
  label: { fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: G[700], display: 'block', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #DDD5C4', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.head, background: '#FEFDF9', outline: 'none', boxSizing: 'border-box', fontVariantNumeric: 'tabular-nums' },
};

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 22px', border: 'none', borderBottom: active ? `3px solid ${G[700]}` : '3px solid transparent', background: 'transparent', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: active ? F.head : F.faint, cursor: 'pointer', whiteSpace: 'nowrap' }}>
      {children}
    </button>
  );
}

// ─── Soil Prescription ────────────────────────────────────────────
function SoilPrescription() {
  const blank = Object.fromEntries(Object.keys(SOIL_REFS).map(k => [k, '']));
  const [vals, setVals] = useState(blank);
  const [area, setArea] = useState(50);
  const set = k => e => setVals(p => ({ ...p, [k]: e.target.value }));

  const prescriptions = useMemo(() => {
    const list = [];
    const cec  = parseFloat(vals.cec) || 15;

    // pH
    if (isLow(SOIL_REFS.pH, vals.pH)) {
      const rate = AMENDMENTS.pH.low.formula(parseFloat(vals.pH), cec);
      list.push({ ...AMENDMENTS.pH.low, key: 'pH-low', param: 'Soil pH', status: 'Too Low', severity: 'critical', rate, total: rate * area });
    } else if (isHigh(SOIL_REFS.pH, vals.pH)) {
      const rate = AMENDMENTS.pH.high.formula(parseFloat(vals.pH), cec);
      list.push({ ...AMENDMENTS.pH.high, key: 'pH-high', param: 'Soil pH', status: 'Too High', severity: 'high', rate, total: rate * area });
    }
    // Other nutrients
    for (const [key, amd] of Object.entries(AMENDMENTS)) {
      if (key === 'pH' || !amd.low) continue;
      const ref = SOIL_REFS[key];
      if (!ref || vals[key] === '') continue;
      if (isLow(ref, vals[key])) {
        const rate = amd.low.formula(parseFloat(vals[key]), cec);
        list.push({ ...amd.low, key: `${key}-low`, param: ref.label, status: 'Deficient', severity: 'high', rate, total: rate * area });
      }
    }
    return list;
  }, [vals, area]);

  return (
    <div>
      {/* Input grid */}
      <div style={{ background: '#F7F2E8', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        <div style={{ display: 'flex', gap: '16px', flexWrap: 'wrap', marginBottom: '16px', alignItems: 'flex-end' }}>
          <div style={{ minWidth: '120px' }}>
            <label style={S.label}>Field Area (ha)</label>
            <input type="number" value={area} min="0.1" step="0.5" onChange={e => setArea(Math.max(0.1, +e.target.value))} style={S.input} />
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.faint, margin: '0 0 8px' }}>Leave any field blank to skip that nutrient.</p>
        </div>
        <p style={S.label}>Soil Test Values</p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: '12px' }}>
          {Object.entries(SOIL_REFS).map(([key, ref]) => {
            const st = getStatus(ref, vals[key]);
            return (
              <div key={key}>
                <label style={{ ...S.label, marginBottom: '4px' }}>{ref.label}{ref.unit ? ` (${ref.unit})` : ''}</label>
                <input type="number" value={vals[key]} step="any" placeholder="—" onChange={set(key)} style={{ ...S.input, borderColor: st ? `${st.color}80` : '#DDD5C4' }} />
                {st && <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: st.color, background: `${st.color}15`, padding: '2px 8px', borderRadius: '10px', display: 'inline-block', marginTop: '4px' }}>{st.label}</span>}
              </div>
            );
          })}
        </div>
      </div>

      {/* Prescription results */}
      {prescriptions.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F7F2E8', borderRadius: '14px' }}>
          {Object.values(vals).every(v => v === '') ? (
            <>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: F.muted, margin: '0 0 8px' }}>Enter your soil test values above</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.faint }}>Amendment prescriptions with NRCS-calibrated dosage rates will appear automatically.</p>
            </>
          ) : (
            <>
              <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: '#22C55E', margin: '0 0 8px' }}>✓ All values within optimal range</p>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.faint }}>No amendments needed for the nutrients entered. Continue annual monitoring.</p>
            </>
          )}
        </div>
      ) : (
        <>
          <p style={{ ...S.label, marginBottom: '16px' }}>{prescriptions.length} amendment recommendation{prescriptions.length > 1 ? 's' : ''} · {area} ha field</p>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {prescriptions.map(rx => (
              <div key={rx.key} style={{ background: '#FEFDF9', border: '1px solid #DDD5C4', borderLeft: `4px solid ${rx.severity === 'critical' ? '#C4694A' : '#CA8A04'}`, borderRadius: '12px', padding: '18px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '12px' }}>
                  <div>
                    <div style={{ display: 'flex', gap: '8px', alignItems: 'center', marginBottom: '3px', flexWrap: 'wrap' }}>
                      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '-0.02em' }}>{rx.name}</p>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: rx.severity === 'critical' ? '#C4694A' : '#CA8A04', background: rx.severity === 'critical' ? '#FEE2E2' : '#FEF3C7', padding: '2px 8px', borderRadius: '4px', textTransform: 'uppercase' }}>{rx.param}: {rx.status}</span>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0 }}>Target: {rx.target} · Source: {rx.source}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '26px', fontWeight: 700, color: G[700], margin: 0, lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>{rx.rate.toLocaleString()} <span style={{ fontSize: '12px', fontWeight: 400, color: F.faint }}>{rx.unit}</span></p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '2px 0 0' }}>application rate</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 600, color: F.muted, margin: '4px 0 0', fontVariantNumeric: 'tabular-nums' }}>Total: {Math.round(rx.total).toLocaleString()} {rx.unit}</p>
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: '0 0 6px', lineHeight: 1.6 }}>{rx.note}</p>
                {rx.alt && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.faint, margin: 0 }}><strong style={{ color: F.muted }}>Alternative:</strong> {rx.alt}</p>}
              </div>
            ))}
          </div>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '16px', textAlign: 'center' }}>
            Rates are estimates based on USDA NRCS calibrations and Penn State / Iowa State Extension methodologies. Confirm with a certified agronomist before large-scale application.
          </p>
        </>
      )}
    </div>
  );
}

// ─── Water Quality ────────────────────────────────────────────────
function WaterQuality() {
  const blank = Object.fromEntries(WATER_FIELDS.map(f => [f.key, '']));
  const [vals, setVals] = useState(blank);
  const set = k => e => setVals(p => ({ ...p, [k]: e.target.value }));
  const hasAny = Object.values(vals).some(v => v !== '');

  return (
    <div>
      <div style={{ background: '#F0F9FF', border: '1px solid #BAE6FD', borderRadius: '12px', padding: '14px 18px', marginBottom: '22px' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#0369A1', margin: 0, lineHeight: 1.6 }}>
          <strong>EPA Standards Applied:</strong> Drinking water values are compared against EPA National Primary and Secondary Drinking Water Regulations (NPDWR). Ecological values use EPA 304(a) Aquatic Life Criteria and NPDES general permit thresholds.
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '14px', marginBottom: '28px' }}>
        {WATER_FIELDS.map(f => (
          <div key={f.key}>
            <label style={S.label}>{f.label}</label>
            <input type="number" value={vals[f.key]} step={f.step} placeholder={f.placeholder}
              onChange={set(f.key)} style={S.input} />
          </div>
        ))}
      </div>

      {hasAny ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {WATER_FIELDS.map(f => {
            const v = parseFloat(vals[f.key]);
            if (!vals[f.key] || isNaN(v)) return null;
            const results = f.interpret(v);
            const anyConcern = results.some(r => !r.ok);
            return (
              <div key={f.key} style={{ background: '#FEFDF9', border: '1px solid #DDD5C4', borderLeft: `4px solid ${anyConcern ? '#C4694A' : '#22C55E'}`, borderRadius: '12px', padding: '16px 18px' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, color: F.head, margin: '0 0 10px', letterSpacing: '-0.02em' }}>
                  {f.label}: <span style={{ fontVariantNumeric: 'tabular-nums' }}>{vals[f.key]}</span>
                </p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '7px', marginBottom: '8px' }}>
                  {results.map((r, i) => (
                    <span key={i} style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600, color: r.ok ? G[700] : '#C4694A', background: r.ok ? G[100] : '#FEE2E2', padding: '3px 10px', borderRadius: '20px' }}>{r.text}</span>
                  ))}
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0, lineHeight: 1.5 }}>{f.note}</p>
              </div>
            );
          })}
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '8px', textAlign: 'center' }}>
            Sources: EPA NPDWR (40 CFR 141–143) · EPA 304(a) Aquatic Life Criteria · NPDES General Permit
          </p>
        </div>
      ) : (
        <div style={{ textAlign: 'center', padding: '48px 20px', background: '#F7F2E8', borderRadius: '14px' }}>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', color: F.muted, margin: '0 0 8px' }}>Enter water test values above</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.faint }}>Results appear here — compared against EPA drinking water and ecological thresholds.</p>
        </div>
      )}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function PrescriptionPage() {
  const [tab, setTab] = useState('soil');

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Page title + summary */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: G[700], margin: '0 0 8px' }}>Enhanced Lab Report</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: F.head, margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.05 }}>Soil Prescription & Water Quality</h1>

          <div style={{ background: 'linear-gradient(135deg, #F0F9FF, #E0F2FE)', border: '1px solid #BAE6FD', borderRadius: '14px', padding: '20px 24px', maxWidth: '720px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13.5px', color: F.body, margin: 0, lineHeight: 1.75 }}>
              Soil lab reports tell you what's in your soil — but not what to do about it. <strong>Enter your soil test values</strong> and this tool automatically generates NRCS-calibrated amendment prescriptions: the specific product, the exact application rate in kg/ha, and the total quantity needed for your field. A separate tab analyzes irrigation and drinking water samples against EPA thresholds. Covers 10 soil nutrients and 4 key water quality parameters.
            </p>
          </div>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid #DDD5C4', marginBottom: '28px', gap: '0' }}>
          <TabBtn active={tab === 'soil'}  onClick={() => setTab('soil')}>🧪 Soil Amendment Prescriptions</TabBtn>
          <TabBtn active={tab === 'water'} onClick={() => setTab('water')}>💧 Water Quality Analysis</TabBtn>
        </div>

        {tab === 'soil'  && <SoilPrescription />}
        {tab === 'water' && <WaterQuality />}
      </div>
    </div>
  );
}
