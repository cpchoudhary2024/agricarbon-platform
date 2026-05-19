import { useEffect, useRef, useState } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { interpretSoilReport, interpretWaterReport, CROP_LIST } from '../utils/testReportInterpreter';

gsap.registerPlugin(ScrollTrigger);

// ── Design tokens ──────────────────────────────────────────────────
const F  = { head: '#052E16', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };
const G  = { '700': '#155233', '500': '#166534', '300': '#4ADE80', '100': '#DCFCE7' };
const T  = { '700': '#A0522D', '500': '#C4694A' };
const Au = { '500': '#CA8A04', '700': '#92400E' };

const PANEL = {
  background: 'rgba(254,253,249,0.98)',
  backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(21,128,61,0.12)',
  borderRadius: '18px', padding: '22px',
  boxShadow: '0 8px 40px rgba(5,46,22,0.07), 0 1px 3px rgba(5,46,22,0.04)',
};
const CARD = { background: '#F7F2E8', border: '1px solid #DDD5C4', borderRadius: '12px', padding: '14px' };
const SEL  = {
  width: '100%', padding: '10px 14px',
  background: '#FEFDF9', border: '1.5px solid #DDD5C4', borderRadius: '9px',
  color: F.body, fontFamily: 'Inter,sans-serif', fontSize: '13px',
  outline: 'none', appearance: 'none', WebkitAppearance: 'none', cursor: 'pointer',
  letterSpacing: '-0.01em',
};
const LBL = {
  display: 'block', fontSize: '10px', fontWeight: 700, color: F.faint,
  marginBottom: '6px', letterSpacing: '0.12em', textTransform: 'uppercase',
  fontFamily: 'Inter, sans-serif',
};

const BASE_OVERLAY = {
  position: 'fixed', inset: 0, width: '100vw', height: '100vh',
  zIndex: 11, pointerEvents: 'none',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  padding: '80px 3vw 10px', overflowY: 'auto', overflowX: 'hidden',
  opacity: 0, visibility: 'hidden',
};

const IDEAL_SOIL  = { pH: '6.5', om: '4.2', phosphorus: '22', potassium: '180', cec: '15', nitrogen: '15' };
const IDEAL_WATER = { pH: '7.2', ec: '0.5', nitrate: '2', hardness: '120', chloride: '40' };

const STATUS_COLOR = {
  optimal:  G['700'],
  low:      T['500'],
  high:     Au['500'],
  critical: T['700'],
  unknown:  F.faint,
};

const STATUS_BG = {
  optimal:  G['100'],
  low:      'rgba(196,105,74,0.08)',
  high:     'rgba(202,138,4,0.08)',
  critical: 'rgba(160,82,45,0.1)',
  unknown:  '#F7F2E8',
};

function StatusPill({ status }) {
  const labels = { optimal: 'OPTIMAL', low: 'LOW', high: 'HIGH', critical: 'CRITICAL', unknown: '—' };
  return (
    <span style={{
      display: 'inline-block', padding: '3px 10px',
      fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 800,
      letterSpacing: '0.1em', color: '#FEFDF9',
      background: STATUS_COLOR[status] || F.faint, borderRadius: '5px',
    }}>{labels[status] || status}</span>
  );
}

function ParamRow({ r }) {
  return (
    <div style={{
      ...CARD,
      borderLeft: `4px solid ${STATUS_COLOR[r.status] || F.faint}`,
      background: STATUS_BG[r.status] || '#F7F2E8',
      marginBottom: '10px',
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '8px', marginBottom: '8px' }}>
        <div>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: F.head, marginRight: '10px' }}>{r.name}</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '13px', color: F.body, fontWeight: 600 }}>{r.value}{r.unit ? ` ${r.unit}` : ''}</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '11px', color: F.faint, marginLeft: '12px' }}>ref: {r.refRange}</span>
        </div>
        <StatusPill status={r.status} />
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: STATUS_COLOR[r.status], marginBottom: '5px', lineHeight: 1.5 }}>
        {r.verdict}
      </div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.body, lineHeight: 1.68 }}>
        {r.guidance}
      </div>
    </div>
  );
}

function Input({ label, val, onChange, hint }) {
  return (
    <div>
      <label style={LBL}>{label}</label>
      <input
        type="number" step="0.01" value={val}
        onChange={e => onChange(e.target.value)}
        placeholder="—" style={SEL}
      />
      {hint && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, margin: '4px 0 0', lineHeight: 1.5 }}>{hint}</p>}
    </div>
  );
}

export default function TestReportInterpreter() {
  const ref = useRef();
  const [mode, setMode] = useState('soil');
  const [crop, setCrop] = useState('corn');

  const [soil,  setSoil]  = useState({ pH: '', om: '', phosphorus: '', potassium: '', cec: '', nitrogen: '' });
  const [water, setWater] = useState({ pH: '', ec: '', nitrate: '', hardness: '', chloride: '' });
  const [report, setReport] = useState(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const triggers = [];
    gsap.set(el, { y: 60 });
    const inT = gsap.to(el, { opacity: 1, visibility: 'visible', y: 0, ease: 'power3.out', paused: true });
    triggers.push(ScrollTrigger.create({ trigger: '#scroll-root', start: '78% top', end: '85% top', scrub: 1, onUpdate: s => inT.progress(s.progress) }));
    const outT = gsap.to(el, { opacity: 0, visibility: 'hidden', ease: 'power2.in', paused: true });
    triggers.push(ScrollTrigger.create({ trigger: '#scroll-root', start: '96% top', end: '100% top', scrub: 1, onUpdate: s => outT.progress(s.progress) }));
    return () => triggers.forEach(t => t.kill());
  }, []);

  const setSoilField  = (k, v) => setSoil(s  => ({ ...s, [k]: v }));
  const setWaterField = (k, v) => setWater(s => ({ ...s, [k]: v }));

  const loadIdeal = () => {
    if (mode === 'soil') setSoil(IDEAL_SOIL);
    else                 setWater(IDEAL_WATER);
    setReport(null);
  };

  const analyse = () => {
    const r = mode === 'soil'
      ? interpretSoilReport({ ...soil, crop })
      : interpretWaterReport(water);
    setReport(r);
    requestAnimationFrame(() => {
      document.getElementById('test-report-results')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });
  };

  const reset = () => {
    if (mode === 'soil') setSoil({ pH: '', om: '', phosphorus: '', potassium: '', cec: '', nitrogen: '' });
    else                 setWater({ pH: '', ec: '', nitrate: '', hardness: '', chloride: '' });
    setReport(null);
  };

  const scoreColor = report
    ? report.healthScore >= 70 ? G['700'] : report.healthScore >= 40 ? Au['500'] : T['500']
    : G['700'];

  return (
    <div ref={ref} style={BASE_OVERLAY}>
      <div className="light-page-overlay" />
      <div style={{ width: '100%', maxWidth: '1080px', paddingBottom: '36px', pointerEvents: 'auto', position: 'relative', zIndex: 1 }}>

        {/* ── Header ── */}
        <div style={{
          ...PANEL,
          marginBottom: '16px',
          borderTop: `4px solid ${Au['500']}`,
          background: 'linear-gradient(135deg, rgba(254,253,249,0.99) 0%, rgba(252,248,240,0.98) 100%)',
        }}>
          <div style={{ display: 'flex', alignItems: 'flex-start', gap: '16px', flexWrap: 'wrap' }}>
            <div style={{
              width: '52px', height: '52px', borderRadius: '16px', flexShrink: 0,
              background: `${Au['500']}15`,
              border: `1px solid ${Au['500']}25`,
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '24px',
            }}>🔬</div>
            <div style={{ flex: 1 }}>
              <p className="eyebrow-premium" style={{ color: Au['700'] }}>USA Soil & Water Test Interpreter · NRCS · EPA</p>
              <h2 style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(22px,2.8vw,42px)',
                fontWeight: 700, color: F.head, margin: '0 0 8px',
                letterSpacing: '-0.03em', lineHeight: 1.05,
              }}>
                Read your lab report<br />
                <em style={{ color: Au['500'] }}>like an agronomist</em>
              </h2>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px,1.2vw,14px)', color: F.muted, margin: 0, maxWidth: '680px', lineHeight: 1.68 }}>
                Drop in the numbers from your USDA-extension soil test or well-water analysis and get plain-English, USA-specific guidance: what's limiting your yield, what's a regulatory concern, and exactly which inputs or amendments will fix it.
              </p>
            </div>
          </div>
        </div>

        {/* ── Mode toggle + crop ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '12px', marginBottom: '14px' }}>
          <div style={PANEL}>
            <label style={LBL}>Report Type</label>
            <div style={{ display: 'flex', gap: '6px' }}>
              {[['soil', '🌱', 'Soil Test'], ['water', '💧', 'Water Test']].map(([k, icon, l]) => (
                <button key={k} onClick={() => { setMode(k); setReport(null); }} style={{
                  flex: 1, padding: '10px 8px', borderRadius: '9px', cursor: 'pointer',
                  fontFamily: 'Inter,sans-serif', fontSize: '13px', fontWeight: 700,
                  display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  background: mode === k
                    ? 'linear-gradient(135deg, #155233, #166534)'
                    : '#FEFDF9',
                  color:  mode === k ? '#FEFDF9' : F.muted,
                  border: `1.5px solid ${mode === k ? '#155233' : '#DDD5C4'}`,
                  transition: 'all 0.18s',
                  boxShadow: mode === k ? '0 4px 16px rgba(21,82,51,0.25)' : 'none',
                }}>
                  {icon} {l}
                </button>
              ))}
            </div>
          </div>

          {mode === 'soil' && (
            <div style={PANEL}>
              <label style={LBL}>Crop Context (for tailored guidance)</label>
              <select style={SEL} value={crop} onChange={e => setCrop(e.target.value)}>
                {CROP_LIST.map(c => <option key={c.key} value={c.key}>{c.label}</option>)}
              </select>
            </div>
          )}

          <div style={PANEL}>
            <label style={LBL}>Quick Start</label>
            <button onClick={loadIdeal} className="btn-outline-terra" style={{ width: '100%', justifyContent: 'center', padding: '10px' }}>
              Load Ideal Reference Values
            </button>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '8px 0 0', lineHeight: 1.55 }}>
              See what a healthy USA cropland {mode === 'soil' ? 'soil test' : 'well-water analysis'} looks like.
            </p>
          </div>
        </div>

        {/* ── Input form ── */}
        <div style={{ ...PANEL, marginBottom: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '18px' }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '9px',
              background: mode === 'soil' ? `${G['700']}15` : 'rgba(59,130,246,0.1)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '15px',
            }}>{mode === 'soil' ? '🌿' : '💧'}</div>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700,
              color: F.head, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase',
            }}>
              {mode === 'soil' ? 'Soil Test Values' : 'Water Test Values'}
            </p>
          </div>

          {mode === 'soil' ? (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px' }}>
              <Input label="pH"                  val={soil.pH}         onChange={v => setSoilField('pH', v)}         hint="Optimal 6.0–7.0" />
              <Input label="Organic Matter (%)"  val={soil.om}         onChange={v => setSoilField('om', v)}         hint="NRCS healthy ≥ 2%" />
              <Input label="Phosphorus (ppm)"    val={soil.phosphorus} onChange={v => setSoilField('phosphorus', v)} hint="Mehlich-3 / Bray-1" />
              <Input label="Potassium (ppm)"     val={soil.potassium}  onChange={v => setSoilField('potassium', v)}  hint="≥ 160 ppm sufficient" />
              <Input label="CEC (meq/100g)"      val={soil.cec}        onChange={v => setSoilField('cec', v)}        hint="10–25 typical loam" />
              <Input label="Nitrate-N (ppm)"     val={soil.nitrogen}   onChange={v => setSoilField('nitrogen', v)}   hint={'0–12" depth'} />
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(160px,1fr))', gap: '12px' }}>
              <Input label="pH"                    val={water.pH}       onChange={v => setWaterField('pH', v)}       hint="EPA 6.5–8.5" />
              <Input label="EC (dS/m)"             val={water.ec}       onChange={v => setWaterField('ec', v)}       hint="< 0.7 dS/m FAO-29" />
              <Input label="Nitrate-N (mg/L)"      val={water.nitrate}  onChange={v => setWaterField('nitrate', v)}  hint="EPA MCL 10 mg/L" />
              <Input label="Hardness (mg/L CaCO₃)" val={water.hardness} onChange={v => setWaterField('hardness', v)} hint="60–180 typical US" />
              <Input label="Chloride (mg/L)"       val={water.chloride} onChange={v => setWaterField('chloride', v)} hint="EPA 2° std 250" />
            </div>
          )}

          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '14px 0 0', lineHeight: 1.55 }}>
            Leave any value blank if your report doesn't include it — only the parameters you supply are analyzed.
          </p>
        </div>

        {/* ── Actions ── */}
        <div style={{ display: 'flex', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
          <button onClick={analyse} className="btn-forest" style={{ flex: '1 1 220px', justifyContent: 'center', padding: '14px' }}>
            Analyze My Report →
          </button>
          <button onClick={reset} className="btn-outline-terra" style={{ flex: '0 1 140px', justifyContent: 'center' }}>
            Clear All
          </button>
        </div>

        {/* ── Results ── */}
        {report && (
          <div id="test-report-results">
            {/* Overall health score */}
            <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${scoreColor}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', justifyContent: 'space-between', gap: '16px' }}>
                <div style={{ flex: '1 1 280px' }}>
                  <p className="eyebrow-premium" style={{ marginBottom: '8px' }}>
                    Overall {report.type === 'soil' ? 'Soil' : 'Water'} Health Score
                    {report.cropProfile ? ` · ${report.cropProfile}` : ''}
                  </p>
                  <h3 style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: 'clamp(18px,2.2vw,30px)', fontWeight: 700, color: F.head, margin: '0 0 10px',
                    letterSpacing: '-0.02em',
                  }}>
                    {report.summary}
                  </h3>
                  <div style={{ display: 'flex', gap: '14px', flexWrap: 'wrap', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted }}>
                    <span><b style={{ color: G['700'] }}>{report.counts.optimal}</b> optimal</span>
                    {report.counts.low      > 0 && <span><b style={{ color: T['500'] }}>{report.counts.low}</b> low</span>}
                    {report.counts.high     > 0 && <span><b style={{ color: Au['500'] }}>{report.counts.high}</b> high</span>}
                    {report.counts.critical > 0 && <span><b style={{ color: T['700'] }}>{report.counts.critical}</b> critical</span>}
                  </div>
                </div>

                {/* Score ring */}
                <div style={{
                  width: '116px', height: '116px', borderRadius: '50%', flexShrink: 0,
                  background: `conic-gradient(${scoreColor} ${report.healthScore * 3.6}deg, #EDE7DA 0deg)`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  boxShadow: `0 4px 24px ${scoreColor}25`,
                }}>
                  <div style={{
                    width: '92px', height: '92px', borderRadius: '50%', background: '#FEFDF9',
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '32px', fontWeight: 700, color: F.head, lineHeight: 1 }}>{report.healthScore}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', color: F.faint, letterSpacing: '0.1em', marginTop: '2px' }}>/ 100</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Priority actions */}
            {report.priorities.length > 0 && (
              <div style={{ ...PANEL, marginBottom: '14px', borderLeft: `4px solid ${T['500']}` }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '14px' }}>
                  <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'rgba(196,105,74,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>⚠️</div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: T['700'], margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                    Priority Actions — work through these first
                  </p>
                </div>
                {report.priorities.map((r, i) => <ParamRow key={i} r={r} />)}
              </div>
            )}

            {/* Full breakdown */}
            <div style={{ ...PANEL, marginBottom: '14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: `${G['700']}12`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '15px', flexShrink: 0 }}>📋</div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
                  Full Parameter Breakdown
                </p>
              </div>
              {report.results.map((r, i) => <ParamRow key={i} r={r} />)}
            </div>

            {/* Sources footnote */}
            <div style={{
              padding: '14px 18px',
              background: '#F7F2E8', border: '1px solid #DDD5C4',
              borderLeft: `3px solid ${Au['500']}`,
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.7,
            }}>
              <strong style={{ color: Au['700'] }}>Sources:</strong> USDA NRCS Soil Quality Indicator Sheets · Cornell CASH framework · Penn State, Iowa State, UC Davis Extension · US EPA NPDWR (40 CFR 141/143) · FAO-29 irrigation suitability. Guidance is educational; for a certified Nutrient Management Plan, work with a state-certified TSP.
            </div>
          </div>
        )}

        {/* Default hint */}
        {!report && (
          <div style={{
            padding: '16px 20px',
            background: '#F7F2E8', border: '1px solid #DDD5C4',
            borderLeft: `3px solid ${G['500']}`,
            borderRadius: '12px',
            fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, lineHeight: 1.68,
          }}>
            <strong style={{ color: G['700'] }}>Where to find your numbers:</strong> Soil tests from your county Extension office or labs like Waypoint Analytical / Midwest Labs report all six soil parameters on the first page. Water tests from a state-certified lab (find via the EPA Drinking Water Lab Locator) report pH, EC, nitrate, and hardness as a standard panel.
          </div>
        )}
      </div>
    </div>
  );
}
