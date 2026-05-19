import { useEffect, useRef, useState } from 'react';
import { Link } from 'react-router-dom';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine, ResponsiveContainer,
} from 'recharts';
import { calculateDelta, calculateCoBenefits, getMarketEligibility, getBestUpgrade } from '../utils/carbonCalc';
import { generateMethodologyReport } from '../utils/methodologyReport';
import { generateFarmerSummary } from '../utils/farmerSummary';
import { calculateSoilHealthScore } from '../utils/soilHealthScore';
import { getBenchmark } from '../utils/regionalBenchmarks';
import { projectRevenue, downloadRevenueCsv } from '../utils/revenueProjector';
import { tornadoAnalysis } from '../utils/sensitivityAnalysis';
import { loadScenarios, addScenario, deleteScenario, buildShareUrl, decodeStateFromHash } from '../utils/scenarioLibrary';
import { SOC_REF } from '../data/ipccCoefficients';
import { generatePdfReport } from '../utils/pdfReport';
import CarbonPriceTracker from './CarbonPriceTracker';

gsap.registerPlugin(ScrollTrigger);

// ─── Design tokens ───────────────────────────────────────────────
const F  = { head: '#052E16', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };
const G  = { '700': '#155233', '500': '#166534', '300': '#4ADE80', '100': '#DCFCE7', '50': '#F0FDF4' };
const T  = { '700': '#A0522D', '500': '#C4694A' };
const Au = { '500': '#CA8A04', '700': '#92400E' };

const PANEL = {
  background: 'rgba(254,253,249,0.98)',
  backdropFilter: 'blur(32px)', WebkitBackdropFilter: 'blur(32px)',
  border: '1px solid rgba(21,128,61,0.12)',
  borderRadius: '18px', padding: '22px',
  boxShadow: '0 8px 40px rgba(5,46,22,0.07), 0 1px 3px rgba(5,46,22,0.04)',
};
const CARD = { background: '#F7F2E8', border: '1px solid #DDD5C4', borderRadius: '12px', padding: '16px' };
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
  zIndex: 10, pointerEvents: 'none',
  display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
  padding: '80px 3vw 10px', overflowY: 'auto', overflowX: 'hidden',
  opacity: 0, visibility: 'hidden',
};

// ─── Helpers ─────────────────────────────────────────────────────
function Lbl({ children }) { return <label style={LBL}>{children}</label>; }
function Field({ label, children }) {
  return <div style={{ marginBottom: '12px' }}><Lbl>{label}</Lbl>{children}</div>;
}

function CropSelect({ value, onChange, style }) {
  return (
    <select style={{ ...SEL, ...style }} value={value} onChange={e => onChange(e.target.value)}>
      <option value="annual-crops">Annual Crops</option>
      <option value="perennial-crops">Perennial / Tree Crops</option>
      <option value="perennial-grass">Perennial Grassland</option>
      <option value="paddy-rice">Paddy Rice</option>
      <option value="set-aside">Set-Aside / Fallow</option>
    </select>
  );
}

function PracticePanel({ title, accentColor, values, onChange }) {
  const s = k => e => onChange(k, e.target.value);
  return (
    <div style={{ ...PANEL, borderTop: `3px solid ${accentColor}`, padding: '20px' }}>
      <p style={{
        fontFamily: 'Inter, sans-serif',
        fontSize: '10px', fontWeight: 700, letterSpacing: '0.16em',
        textTransform: 'uppercase', color: accentColor, margin: '0 0 16px',
      }}>{title}</p>
      <Field label="Crop / Land Use">
        <CropSelect value={values.cropType} onChange={v => onChange('cropType', v)} />
      </Field>
      <Field label="Tillage Practice">
        <select style={SEL} value={values.tillage} onChange={s('tillage')}>
          <option value="full-tillage">Full Tillage (reference)</option>
          <option value="reduced-tillage">Reduced Tillage</option>
          <option value="no-till">No-Till / Direct Seeding</option>
        </select>
      </Field>
      <Field label="Organic Input Level">
        <select style={SEL} value={values.inputs} onChange={s('inputs')}>
          <option value="low">Low — below-average residues, no amendments</option>
          <option value="medium">Medium — average farm management</option>
          <option value="high">High — above-average residues or manure</option>
          <option value="high-manure">High + Manure — both amendments combined</option>
        </select>
      </Field>
    </div>
  );
}

function ChartTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: '#FEFDF9', border: '1px solid #DDD5C4', borderRadius: '12px',
      padding: '12px 16px', boxShadow: '0 8px 32px rgba(3,12,6,0.12)',
    }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.faint, margin: '0 0 4px' }}>Year {label}</p>
      <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: G['700'], margin: 0, lineHeight: 1 }}>
        {payload[0].value.toLocaleString(undefined, { maximumFractionDigits: 1 })}
        <span style={{ fontSize: '12px', fontWeight: 400, color: F.faint, marginLeft: '4px' }}>t CO₂e</span>
      </p>
    </div>
  );
}

function CoBenefitBar({ label, value, icon }) {
  const isPos = value >= 0;
  const pct   = Math.abs(value);
  const color = isPos ? G['500'] : T['500'];
  return (
    <div style={{ marginBottom: '12px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.body, display: 'flex', gap: '7px', alignItems: 'center' }}>
          <span>{icon}</span>{label}
        </span>
        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color, minWidth: 44, textAlign: 'right' }}>
          {isPos ? '+' : ''}{value}%
        </span>
      </div>
      <div style={{ height: '5px', background: '#EDE7DA', borderRadius: '3px', overflow: 'hidden' }}>
        <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: '3px', transition: 'width 0.7s ease' }} />
      </div>
    </div>
  );
}

function KpiCard({ label, value, unit, accent }) {
  return (
    <div style={{ ...CARD, textAlign: 'center', borderTop: `3px solid ${accent}`, transition: 'transform 0.2s', cursor: 'default' }}
      className="result-card-hover">
      <div style={{
        fontFamily: 'Cormorant Garamond, serif',
        fontSize: 'clamp(22px, 2.8vw, 38px)',
        fontWeight: 700, color: accent, lineHeight: 1, marginBottom: '5px',
        letterSpacing: '-0.02em',
      }}>{value}</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', letterSpacing: '0.1em', color: F.faint, textTransform: 'uppercase', marginBottom: '3px' }}>{unit}</div>
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.4 }}>{label}</div>
    </div>
  );
}

// ─── Step wizard helpers ──────────────────────────────────────────
const WIZ_STEPS = [
  { n: 1, label: 'Farm Setup',        sub: 'Climate · Area · Years' },
  { n: 2, label: 'Current Practice',  sub: 'Your baseline today' },
  { n: 3, label: 'Future Scenario',   sub: 'Planned intervention' },
  { n: 4, label: 'Your Results',      sub: 'Carbon analysis' },
];

function StepBar({ current }) {
  return (
    <div style={{ ...PANEL, padding: '16px 24px', marginBottom: '16px' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: G['500'], letterSpacing: '0.16em', textTransform: 'uppercase', margin: '0 0 14px' }}>
        Calculate your carbon uplift — Step {current} of 4
      </p>
      <div style={{ display: 'flex', alignItems: 'flex-start' }}>
        {WIZ_STEPS.map((s, i) => (
          <div key={s.n} style={{ display: 'flex', alignItems: 'flex-start', flex: i < WIZ_STEPS.length - 1 ? 1 : 'none' }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px', minWidth: '72px' }}>
              <div style={{
                width: '34px', height: '34px', borderRadius: '50%',
                background: current > s.n ? G['700'] : current === s.n ? G['700'] : '#EDE7DA',
                color: current >= s.n ? '#FEFDF9' : F.faint,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: current > s.n ? '15px' : '13px', fontWeight: 700, fontFamily: 'Inter, sans-serif',
                boxShadow: current === s.n ? `0 0 0 4px ${G['100']}` : 'none',
                border: current === s.n ? `2px solid ${G['500']}` : 'none',
                transition: 'all 0.3s',
                flexShrink: 0,
              }}>{current > s.n ? '✓' : s.n}</div>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: current === s.n ? 700 : 500, color: current >= s.n ? G['700'] : F.faint, lineHeight: 1.3 }}>{s.label}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, marginTop: '2px', display: current === s.n ? 'block' : 'none' }}>{s.sub}</div>
              </div>
            </div>
            {i < WIZ_STEPS.length - 1 && (
              <div style={{ flex: 1, height: '2px', background: current > s.n ? G['700'] : '#EDE7DA', marginTop: '16px', transition: 'background 0.4s', minWidth: '20px' }} />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

function StepGuide({ n, title, desc, tip }) {
  const colors = { 1: G['700'], 2: T['500'], 3: G['500'], 4: Au['700'] };
  const bgs    = { 1: G['100'], 2: 'rgba(196,105,74,0.08)', 3: G['100'], 4: 'rgba(202,138,4,0.08)' };
  const c = colors[n]; const bg = bgs[n];
  return (
    <div style={{ background: bg, border: `1px solid ${c}25`, borderLeft: `4px solid ${c}`, borderRadius: '12px', padding: '16px 20px', marginBottom: '14px', display: 'flex', gap: '14px', alignItems: 'flex-start' }}>
      <div style={{ width: '32px', height: '32px', borderRadius: '9px', flexShrink: 0, background: c, color: '#FEFDF9', display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 700 }}>{n}</div>
      <div>
        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,1.8vw,20px)', fontWeight: 700, color: F.head, marginBottom: '4px', letterSpacing: '-0.01em' }}>{title}</div>
        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, lineHeight: 1.65 }}>{desc}</div>
        {tip && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: Au['700'], marginTop: '8px', fontStyle: 'italic' }}>💡 {tip}</div>}
      </div>
    </div>
  );
}

// ─── Main ─────────────────────────────────────────────────────────
export default function CalculatorOverlay() {
  const ref = useRef();

  const [climate, setClimate] = useState('tropical-moist');
  const [area,    setArea]    = useState(10);
  const [years,   setYears]   = useState(20);
  const [price,   setPrice]   = useState('');

  const [base, setBase] = useState({ cropType: 'annual-crops', tillage: 'full-tillage', inputs: 'low' });
  const [scen, setScen] = useState({ cropType: 'annual-crops', tillage: 'no-till',     inputs: 'high' });

  const [result,   setResult]  = useState(null);
  const [cobens,   setCobens]  = useState(null);
  const [market,   setMarket]  = useState(null);
  const [bestUp,   setBestUp]  = useState(null);
  const [summary,  setSummary] = useState(null);
  const [busy,     setBusy]    = useState(false);
  const [copied,   setCopied]  = useState(false);

  const [scenarios,   setScenarios]   = useState(() => loadScenarios());
  const [saveName,    setSaveName]    = useState('');
  const [linkCopied,  setLinkCopied]  = useState(false);
  const [showLibrary, setShowLibrary] = useState(false);
  const [wizStep,     setWizStep]     = useState(1);

  useEffect(() => {
    const decoded = decodeStateFromHash();
    if (!decoded) return;
    if (decoded.climate) setClimate(decoded.climate);
    if (decoded.area    != null) setArea(decoded.area);
    if (decoded.years   != null) setYears(decoded.years);
    if (decoded.price   != null) setPrice(decoded.price);
    if (decoded.base) setBase(b => ({ ...b, ...decoded.base }));
    if (decoded.scen) setScen(s => ({ ...s, ...decoded.scen }));
  }, []);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const triggers = [];

    gsap.set(el, { y: 60 });
    const inT = gsap.to(el, { opacity: 1, visibility: 'visible', y: 0, ease: 'power3.out', paused: true });
    triggers.push(ScrollTrigger.create({ trigger: '#scroll-root', start: '57% top', end: '66% top', scrub: 1, onUpdate: s => inT.progress(s.progress) }));

    const outT = gsap.to(el, { opacity: 0, visibility: 'hidden', ease: 'power2.in', paused: true });
    triggers.push(ScrollTrigger.create({ trigger: '#scroll-root', start: '72% top', end: '77% top', scrub: 1, onUpdate: s => outT.progress(s.progress) }));

    return () => triggers.forEach(t => t.kill());
  }, []);

  const upBase = (k, v) => setBase(b => ({ ...b, [k]: v }));
  const upScen = (k, v) => setScen(s => ({ ...s, [k]: v }));

  const calculate = () => {
    setBusy(true);
    setTimeout(() => {
      try {
        const r  = calculateDelta({ climateZone: climate, area: parseFloat(area) || 1, years: parseInt(years) || 20, baseline: base, scenario: scen, carbonPrice: parseFloat(price) || 0 });
        const cb = calculateCoBenefits({ baseline: base, scenario: scen });
        const mk = getMarketEligibility(r.co2eTotal);
        const bu = getBestUpgrade(climate, base);
        const sm = generateFarmerSummary(r);
        setResult(r); setCobens(cb); setMarket(mk); setBestUp(bu); setSummary(sm);
      } catch (e) { console.error(e); }
      setBusy(false);
    }, 300);
  };

  const exportReport = () => {
    if (!result) return;
    const txt  = generateMethodologyReport(result);
    const blob = new Blob([txt], { type: 'text/plain' });
    const url  = URL.createObjectURL(blob);
    Object.assign(document.createElement('a'), { href: url, download: `agricarbon-report-${Date.now()}.txt` }).click();
    URL.revokeObjectURL(url);
  };

  const copyCitation = () => {
    navigator.clipboard.writeText('IPCC (2006). 2006 IPCC Guidelines for National Greenhouse Gas Inventories, Volume 4: Agriculture, Forestry and Other Land Use. Editors: Eggleston H.S., Buendia L., Miwa K., Ngara T. & Tanabe K. Published by IGES, Japan.');
    setCopied(true); setTimeout(() => setCopied(false), 2800);
  };

  const isPos = result ? result.deltaSocPerHa >= 0 : true;
  const resultColor = isPos ? G['700'] : T['500'];

  const healthScenario = calculateSoilHealthScore(scen);
  const healthBaseline = calculateSoilHealthScore(base);

  const benchmark  = result ? getBenchmark(climate, result.co2ePerHaPerYear / 3.667) : null;
  const projection = result && parseFloat(price) > 0
    ? projectRevenue({ trajectory: result.trajectory, carbonPrice: parseFloat(price) })
    : null;
  const tornado = result ? tornadoAnalysis({
    climateZone: climate, area: parseFloat(area) || 1, years: parseInt(years) || 20,
    baseline: base, scenario: scen, carbonPrice: parseFloat(price) || 0,
  }) : null;

  const saveCurrentScenario = () => {
    const name  = (saveName || '').trim() || `Scenario ${scenarios.length + 1}`;
    const entry = addScenario({
      name, climate, area: parseFloat(area) || 1, years: parseInt(years) || 20,
      price, base, scen,
      co2eTotal: result?.co2eTotal,
      deltaSocPerHa: result?.deltaSocPerHa,
      soilHealth: healthScenario.score,
    });
    setScenarios(loadScenarios());
    setSaveName('');
    setShowLibrary(true);
    return entry;
  };

  const loadScenario = (s) => {
    setClimate(s.climate); setArea(s.area); setYears(s.years); setPrice(s.price || '');
    setBase(s.base); setScen(s.scen);
    setResult(null); setCobens(null); setMarket(null); setBestUp(null); setSummary(null);
    setShowLibrary(false);
  };

  const removeScenario = (id) => setScenarios(deleteScenario(id));

  const copyShareLink = async () => {
    const url = buildShareUrl({ climate, area, years, price, base, scen });
    try { await navigator.clipboard.writeText(url); } catch { /* noop */ }
    window.history.replaceState(null, '', url);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2400);
  };

  const exportPdf = () => {
    if (!result) return;
    generatePdfReport({
      result,
      inputs: {
        climateZone: climate,
        climateZoneLabel: SOC_REF[climate]?.label || climate,
        area: parseFloat(area) || 1, years: parseInt(years) || 20,
        baseline: base, scenario: scen,
        carbonPrice: parseFloat(price) || 0,
      },
      soilHealth: healthScenario, benchmark, projection, tornado,
    });
  };

  return (
    <div ref={ref} style={BASE_OVERLAY}>
      <div className="light-page-overlay" />
      <div style={{ width: '100%', maxWidth: '1080px', paddingBottom: '28px', pointerEvents: 'auto', position: 'relative', zIndex: 1 }}>

        {/* ── Page header ── */}
        <div style={{ ...PANEL, marginBottom: '16px', borderTop: `4px solid ${G['700']}`, background: 'linear-gradient(135deg, rgba(254,253,249,0.99) 0%, rgba(247,242,232,0.98) 100%)' }}>
          <p className="eyebrow-premium">IPCC Tier 1 Carbon Calculator · Step {wizStep} of 4</p>
          <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(22px,3vw,42px)', fontWeight: 700, color: F.head, margin: '0 0 8px', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            Calculate Your Carbon Uplift in 4 Steps
          </h2>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(12px,1.2vw,13px)', color: F.muted, margin: 0, maxWidth: '560px', lineHeight: 1.65 }}>
            Compare <em>what you do now</em> (Baseline) against a <em>planned change</em> (Scenario) to quantify the true carbon additionality of any practice — using the same IPCC Tier 1 framework governments use for national inventories.
          </p>
        </div>

        {/* ── Step progress bar ── */}
        <StepBar current={wizStep} />

        {/* ══ STEP 1 — Farm Setup ══════════════════════════════════════ */}
        {wizStep === 1 && (
          <>
            <StepGuide n={1} title="Set Up Your Farm"
              desc="Your climate zone determines the IPCC reference carbon stock (SOC_ref). Farm area and time horizon set the scale and duration of your carbon claim. These three values are required for every calculation."
              tip="Not sure of your climate zone? Warm Temperate Moist covers most of the US and Europe. Tropical Moist covers South/Southeast Asia, Central America, and Sub-Saharan Africa." />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(200px,1fr))', gap: '12px', marginBottom: '14px' }}>
              <div style={PANEL}>
                <Lbl>Climate Zone</Lbl>
                <select style={SEL} value={climate} onChange={e => setClimate(e.target.value)}>
                  <option value="tropical-moist">Tropical Moist</option>
                  <option value="tropical-dry">Tropical Dry</option>
                  <option value="tropical-montane">Tropical Montane</option>
                  <option value="warm-temperate-moist">Warm Temperate Moist</option>
                  <option value="warm-temperate-dry">Warm Temperate Dry</option>
                  <option value="cool-temperate-moist">Cool Temperate Moist</option>
                  <option value="cool-temperate-dry">Cool Temperate Dry</option>
                  <option value="boreal">Boreal</option>
                </select>
              </div>
              <div style={PANEL}>
                <Lbl>Farm Area (ha)</Lbl>
                <input type="number" min="0.1" step="0.1" style={SEL} value={area} onChange={e => setArea(e.target.value)} />
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '6px 0 0' }}>1 hectare ≈ 2.47 acres</p>
              </div>
              <div style={PANEL}>
                <Lbl>Time Horizon — <strong style={{ color: G['700'] }}>{years} yr</strong></Lbl>
                <input type="range" min="1" max="20" className="slider-premium" value={years} onChange={e => setYears(e.target.value)} style={{ marginTop: '10px' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '4px' }}>
                  <span>1 yr</span><span>20 yr (IPCC max)</span>
                </div>
              </div>
            </div>
            <div style={{ ...PANEL, padding: '14px 18px', borderLeft: `3px solid ${G['500']}` }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0, lineHeight: 1.7 }}>
                <strong style={{ color: F.body }}>How it works:</strong> AgriCarbon uses the IPCC Tier 1 SOC stock-change method.
                It looks up your climate zone's reference carbon stock (SOC_ref from IPCC Table 2.3),
                then multiplies it by three factors — land-use (F<sub>LU</sub>), management (F<sub>MG</sub>), and organic inputs (F<sub>IN</sub>) — to
                estimate how much soil carbon changes over your chosen time horizon.
              </p>
            </div>
          </>
        )}

        {/* ══ STEP 2 — Baseline (Current Practice) ═════════════════════ */}
        {wizStep === 2 && (
          <>
            <StepGuide n={2} title="Your Current Practice — The Baseline"
              desc="Describe exactly what you are doing on this land right now. This is the 'before' in your before/after comparison. The carbon credit you earn is the difference between this baseline and your future scenario."
              tip="Be accurate, not aspirational. If you sometimes apply manure but not consistently, choose Medium rather than High + Manure. A credible baseline is the foundation of any auditable carbon claim." />
            <PracticePanel title="Baseline — Current Practice" accentColor={T['500']} values={base} onChange={upBase} />
            <div style={{ ...PANEL, padding: '14px 20px', display: 'flex', gap: '14px', alignItems: 'flex-start', borderLeft: `3px solid ${Au['500']}` }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '9px', background: `${Au['500']}18`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '16px', flexShrink: 0 }}>📋</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, lineHeight: 1.7 }}>
                <strong style={{ color: Au['700'] }}>What each option means:</strong>{' '}
                <em>Full Tillage</em> = plowing every season. <em>Reduced Tillage</em> = some tillage but crop residues remain. <em>No-Till</em> = seeds drilled directly with no soil inversion.{' '}
                <em>Organic inputs</em> = crop residues, compost, and manure left in the field: Low = below-average, Medium = typical farm, High = above-average or manure added.
              </div>
            </div>
          </>
        )}

        {/* ══ STEP 3 — Scenario (Future Practice) ══════════════════════ */}
        {wizStep === 3 && (
          <>
            <StepGuide n={3} title="Your Planned Practice Change — The Scenario"
              desc="What one intervention are you considering? Change just one variable from your baseline to isolate its exact carbon impact. Your Soil Health Score updates live as you adjust inputs below."
              tip="The single highest-impact change in most systems is switching from Full Tillage to No-Till. Adding cover crops (High organic inputs) is the second most effective lever." />
            <PracticePanel title="Scenario — Planned Intervention" accentColor={G['700']} values={scen} onChange={upScen} />

            {/* Live Soil Health preview */}
            <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${healthScenario.grade.color}` }}>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '20px', alignItems: 'center' }}>
                <div style={{ width: '96px', height: '96px', borderRadius: '50%', flexShrink: 0, background: `conic-gradient(${healthScenario.grade.color} ${healthScenario.score * 3.6}deg, #EDE7DA 0deg)`, display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.6s ease', boxShadow: `0 4px 24px ${healthScenario.grade.color}30` }}>
                  <div style={{ width: '74px', height: '74px', borderRadius: '50%', background: '#FEFDF9', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '30px', fontWeight: 700, color: F.head, lineHeight: 1 }}>{healthScenario.score}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', color: F.faint, letterSpacing: '0.1em', marginTop: '2px' }}>/ 100</div>
                  </div>
                </div>
                <div style={{ flex: '1 1 200px' }}>
                  <p className="eyebrow-premium" style={{ marginBottom: '4px' }}>Live Soil Health Score</p>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,2vw,24px)', fontWeight: 700, color: F.head, margin: '0 0 4px', letterSpacing: '-0.02em' }}>
                    Grade {healthScenario.grade.letter} — <span style={{ color: healthScenario.grade.color }}>{healthScenario.grade.label}</span>
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, margin: 0, lineHeight: 1.6 }}>
                    Baseline: <b style={{ color: healthBaseline.grade.color }}>{healthBaseline.grade.letter}</b> ({healthBaseline.score}) ·{' '}
                    Change: <b style={{ color: healthScenario.score >= healthBaseline.score ? G['700'] : T['500'] }}>
                      {healthScenario.score >= healthBaseline.score ? '+' : ''}{healthScenario.score - healthBaseline.score} pts
                    </b>
                  </p>
                  <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                    {[['Tillage', healthScenario.breakdown.tillage], ['Inputs', healthScenario.breakdown.inputs], ['Crop', healthScenario.breakdown.crop]].map(([lbl, b]) => (
                      <div key={lbl} style={{ flex: 1 }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted, marginBottom: '3px' }}>
                          <span>{lbl}</span><span style={{ fontWeight: 700, color: F.head }}>{b.score}</span>
                        </div>
                        <div style={{ height: '4px', background: '#EDE7DA', borderRadius: '2px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${b.score}%`, background: healthScenario.grade.color, borderRadius: '2px', transition: 'width 0.5s' }} />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Carbon price (optional, unlocks revenue projection) */}
            <div style={{ ...PANEL, borderTop: `2px solid ${Au['500']}`, marginBottom: '4px' }}>
              <Lbl>Carbon Price (USD / t CO₂e) — optional</Lbl>
              <input type="number" min="0" step="1" placeholder="e.g. 45" style={SEL} value={price} onChange={e => setPrice(e.target.value)} />
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '6px 0 0', lineHeight: 1.5 }}>
                Voluntary market avg $20–60/t. Leave blank to skip revenue projection. Use the live market panel below for reference.
              </p>
            </div>
            <CarbonPriceTracker onSelectPrice={p => setPrice(String(p))} />
          </>
        )}

        {/* ══ STEP 4 — Results ══════════════════════════════════════════ */}
        {wizStep === 4 && (
          <>
            {/* Loading */}
            {busy && (
              <div style={{ ...PANEL, padding: '52px 24px', textAlign: 'center', marginBottom: '14px' }}>
                <div style={{ display: 'inline-block', width: '40px', height: '40px', border: `3px solid ${G['100']}`, borderTopColor: G['700'], borderRadius: '50%', animation: 'spin 0.8s linear infinite', marginBottom: '18px' }} />
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', fontWeight: 700, color: F.head, margin: '0 0 6px' }}>Calculating your results…</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0 }}>Applying IPCC Tier 1 coefficients for {climate.replace(/-/g, ' ')}</p>
              </div>
            )}

            {!busy && !result && (
              <div style={{ ...PANEL, padding: '40px 24px', textAlign: 'center', marginBottom: '14px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.muted, margin: '0 0 16px' }}>Something went wrong. Please go back and try again.</p>
                <button onClick={() => { calculate(); }} className="btn-forest">Retry Calculation</button>
              </div>
            )}

            {!busy && result && (
              <>
                {!isPos && (
                  <div style={{ padding: '14px 18px', background: 'rgba(196,105,74,0.07)', border: `1px solid ${T['500']}`, borderLeft: `4px solid ${T['500']}`, borderRadius: '12px', marginBottom: '16px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: T['700'], lineHeight: 1.65 }}>
                    <strong>⚠ Net Carbon Loss:</strong> Your scenario releases more carbon than the baseline. Go back to Step 3 and adjust — try switching to No-Till or increasing organic inputs.
                  </div>
                )}

                {/* KPI row */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '16px' }}>
                  <KpiCard label="Total CO₂e sequestered" value={(result.co2eTotal >= 0 ? '+' : '') + result.co2eTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })} unit="tonnes CO₂e" accent={resultColor} />
                  <KpiCard label="Annual rate per hectare" value={(result.co2ePerHaPerYear >= 0 ? '+' : '') + result.co2ePerHaPerYear.toFixed(2)} unit="t CO₂e ha⁻¹ yr⁻¹" accent={G['500']} />
                  <KpiCard label="SOC stock uplift" value={(result.deltaSocPerHa >= 0 ? '+' : '') + result.deltaSocPerHa.toFixed(3)} unit="t C ha⁻¹" accent={Au['500']} />
                  {result.marketValue != null && (
                    <KpiCard label={`Market value @$${price}/t`} value={'$' + result.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} unit="USD estimated" accent={Au['700']} />
                  )}
                </div>

                {/* Plain-English Summary */}
                {summary && (
                  <div style={{ ...PANEL, marginBottom: '16px', borderLeft: `4px solid ${summary.isGain ? G['700'] : T['500']}`, padding: '22px 24px', background: summary.isGain ? 'linear-gradient(135deg, rgba(254,253,249,0.99), rgba(240,253,244,0.96))' : 'linear-gradient(135deg, rgba(254,253,249,0.99), rgba(255,247,243,0.96))' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                      <div style={{ width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0, background: `${summary.isGain ? G['700'] : T['500']}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '22px' }}>{summary.isGain ? '🌱' : '⚠️'}</div>
                      <div>
                        <p className="eyebrow-premium" style={{ color: summary.isGain ? G['500'] : T['500'], marginBottom: '4px' }}>{summary.isGain ? 'What This Means for Your Farm' : 'Important — Review Your Scenario'}</p>
                        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,2vw,24px)', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '-0.02em' }}>{summary.headline}</h3>
                      </div>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px,1.3vw,15px)', color: F.body, lineHeight: 1.8, margin: '0 0 18px' }}>{summary.story}</p>
                    {summary.bullets.length > 0 && (
                      <>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: F.muted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>That's equivalent to…</p>
                        <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '8px' }}>
                          {summary.bullets.map((b, i) => (
                            <li key={i} style={{ display: 'flex', gap: '10px', alignItems: 'flex-start', padding: '10px 14px', background: G['100'], border: `1px solid ${G['300']}50`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.body, lineHeight: 1.55 }}>
                              <span style={{ color: G['700'], fontWeight: 800, flexShrink: 0 }}>✓</span>{b}
                            </li>
                          ))}
                        </ul>
                      </>
                    )}
                  </div>
                )}

                {/* Charts */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '14px', marginBottom: '14px' }}>
                  <div style={{ ...PANEL, padding: '20px' }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 3px' }}>Cumulative CO₂e Trajectory</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>Linear ramp to IPCC Tier 1 equilibrium over {Math.min(parseInt(years), 20)} yr</p>
                    <ResponsiveContainer width="100%" height={180}>
                      <LineChart data={result.trajectory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DA" />
                        <XAxis dataKey="year" tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} />
                        <YAxis tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} width={50} tickFormatter={v => Math.abs(v) >= 1000 ? `${(v / 1000).toFixed(1)}k` : v.toFixed(0)} />
                        <Tooltip content={<ChartTooltip />} />
                        <ReferenceLine y={0} stroke="#DDD5C4" strokeDasharray="4 2" />
                        <Line type="monotone" dataKey="co2e" stroke={resultColor} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: resultColor, strokeWidth: 2, stroke: '#fff' }} />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                  <div style={{ ...PANEL, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                    <div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 14px' }}>SOC Stock Comparison</p>
                      {[{ label: 'Baseline', val: result.baselineSocStock, color: T['500'] }, { label: 'Scenario', val: result.scenarioSocStock, color: G['700'] }].map(row => {
                        const max = Math.max(result.baselineSocStock, result.scenarioSocStock) * 1.12 || 1;
                        return (
                          <div key={row.label} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: row.color, fontWeight: 700 }}>{row.label}</span>
                              <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '11px', color: F.muted }}>{row.val.toFixed(3)} t C ha⁻¹</span>
                            </div>
                            <div style={{ height: '8px', background: '#EDE7DA', borderRadius: '4px', overflow: 'hidden' }}>
                              <div style={{ height: '100%', width: `${(row.val / max) * 100}%`, background: row.color, borderRadius: '4px', transition: 'width 0.7s ease' }} />
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ marginTop: '10px', padding: '9px 14px', background: isPos ? G['100'] : 'rgba(196,105,74,0.08)', border: `1px solid ${isPos ? G['300'] + '60' : T['500']}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted }}>Net ΔSOC / ha</span>
                        <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '14px', fontWeight: 700, color: resultColor }}>{result.deltaSocPerHa >= 0 ? '+' : ''}{result.deltaSocPerHa.toFixed(3)} t C ha⁻¹</span>
                      </div>
                    </div>
                    <div>
                      <p className="eyebrow-premium" style={{ marginBottom: '10px' }}>IPCC Factors</p>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '8px' }}>
                        {[['Baseline', result.factors.base, T['500']], ['Scenario', result.factors.scen, G['700']]].map(([title, f, color]) => (
                          <div key={title} style={{ padding: '11px 12px', background: '#F7F2E8', borderLeft: `3px solid ${color}`, borderRadius: '8px' }}>
                            <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color, fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
                            {[['F_LU', f.fLu], ['F_MG', f.fMg], ['F_IN', f.fIn]].map(([k, v]) => (
                              <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '10px', color: F.faint }}>{k}</span>
                                <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '10px', color: F.body, fontWeight: 600 }}>{v.toFixed(3)}</span>
                              </div>
                            ))}
                          </div>
                        ))}
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '10px 0 0' }}>95% CI: ±{result.co2eUncertainty.toFixed(1)} t CO₂e total</p>
                    </div>
                  </div>
                </div>

                {/* Regional Benchmark */}
                {benchmark && (
                  <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${benchmark.color}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                      <div>
                        <p className="eyebrow-premium" style={{ marginBottom: '6px' }}>Regional Benchmark · {benchmark.zoneLabel}</p>
                        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,1.8vw,24px)', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '-0.02em' }}>
                          Your field sequesters <span style={{ color: benchmark.color }}>{benchmark.ratioRegion.toFixed(2)}×</span> the regional average
                        </h3>
                      </div>
                      <div style={{ padding: '7px 14px', background: benchmark.color + '18', border: `1px solid ${benchmark.color}35`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: benchmark.color }}>{benchmark.percentile}th percentile</div>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.body, lineHeight: 1.7, margin: '0 0 16px' }}>
                      {benchmark.verdict}. Across global agricultural land (FAO 2021 average ~{benchmark.globalAvg} t C ha⁻¹ yr⁻¹) you're at <strong style={{ color: F.head }}>{benchmark.ratioGlobal.toFixed(2)}×</strong> the world average.
                    </p>
                    <div style={{ position: 'relative', height: '28px', background: '#EDE7DA', borderRadius: '14px', overflow: 'hidden', marginBottom: '8px' }}>
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: '5%', width: '90%', background: `linear-gradient(to right, ${T['500']} 0%, ${Au['500']} 50%, ${G['700']} 100%)`, opacity: 0.28, borderRadius: '14px' }} />
                      <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${5 + ((benchmark.regionMean - benchmark.regionLow) / (benchmark.regionHigh - benchmark.regionLow)) * 90}%`, width: '2px', background: F.muted }} />
                      <div style={{ position: 'absolute', top: '-4px', bottom: '-4px', left: `${Math.max(0, Math.min(100, 5 + ((benchmark.userValue - benchmark.regionLow) / (benchmark.regionHigh - benchmark.regionLow)) * 90))}%`, width: '4px', background: benchmark.color, borderRadius: '2px', boxShadow: `0 0 0 3px ${benchmark.color}50` }} />
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '10px', color: F.faint, marginBottom: '14px' }}>
                      <span>{benchmark.regionLow.toFixed(2)} (low)</span>
                      <span>{benchmark.regionMean.toFixed(2)} regional mean</span>
                      <span>{benchmark.regionHigh.toFixed(2)} (high)</span>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '8px' }}>
                      {[['Your rate', `${benchmark.userValue}`, 't C/ha/yr', benchmark.color], ['Regional avg', `${benchmark.regionMean}`, 't C/ha/yr', F.head], ['vs. Global', `${benchmark.ratioGlobal}×`, 'avg', benchmark.ratioGlobal >= 1 ? G['700'] : T['500']]].map(([lbl, val, unit, col]) => (
                        <div key={lbl} style={{ ...CARD, textAlign: 'center', padding: '12px' }}>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{lbl}</div>
                          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: col, lineHeight: 1 }}>{val} <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 400, color: F.faint }}>{unit}</span></div>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '12px 0 0', lineHeight: 1.5 }}>Benchmark ranges synthesised from IPCC AR6 WG3 Ch.7 and FAO RECSOIL global agricultural sequestration meta-analyses.</p>
                  </div>
                )}

                {/* Revenue projection */}
                {projection ? (
                  <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${Au['500']}` }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                      <div>
                        <p className="eyebrow-premium" style={{ color: Au['700'], marginBottom: '6px' }}>Carbon Credit Revenue Projector</p>
                        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,2vw,26px)', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '-0.02em' }}>${projection.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })} gross over {projection.rows.length - 1} years</h3>
                      </div>
                      <button onClick={() => downloadRevenueCsv(projection, { climateZone: climate, area })} className="btn-outline-terra" style={{ padding: '8px 18px', fontSize: '12px' }}>↓ Download CSV</button>
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px', marginBottom: '16px' }}>
                      {[['Gross Revenue', `$${projection.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, G['700']], ['MRV + Cert. Cost', `$${projection.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, T['500']], ['Net Profit', `$${projection.totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, projection.totalNet >= 0 ? G['700'] : T['700']], ['Break-even', projection.breakEvenYear ? `Year ${projection.breakEvenYear}` : '—', Au['700']]].map(([lbl, val, col]) => (
                        <div key={lbl} style={{ ...CARD, textAlign: 'center', padding: '12px', borderTop: `2px solid ${col}` }}>
                          <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>{lbl}</div>
                          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: col }}>{val}</div>
                        </div>
                      ))}
                    </div>
                    <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #DDD5C4' }}>
                      <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                        <thead style={{ background: '#F7F2E8' }}>
                          <tr>{['Year', 'Annual t CO₂e', 'Gross USD', 'Costs USD', 'Net USD', 'Cumulative Net USD'].map(h => (<th key={h} style={{ padding: '9px 11px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: F.muted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #DDD5C4' }}>{h}</th>))}</tr>
                        </thead>
                        <tbody>
                          {projection.rows.map(r => {
                            const isBE = r.year === projection.breakEvenYear;
                            return (
                              <tr key={r.year} style={{ background: isBE ? G['100'] : (r.year % 2 === 0 ? '#FEFDF9' : 'transparent'), borderLeft: isBE ? `3px solid ${G['700']}` : 'none' }}>
                                <td style={{ padding: '7px 11px', textAlign: 'right', color: F.body, fontWeight: isBE ? 800 : 600 }}>{r.year}{isBE ? ' ← break-even' : ''}</td>
                                <td style={{ padding: '7px 11px', textAlign: 'right', color: F.muted }}>{r.co2eYearly.toFixed(2)}</td>
                                <td style={{ padding: '7px 11px', textAlign: 'right', color: G['700'] }}>${r.grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td style={{ padding: '7px 11px', textAlign: 'right', color: T['500'] }}>${r.costs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td style={{ padding: '7px 11px', textAlign: 'right', color: r.netCashflow >= 0 ? G['700'] : T['700'], fontWeight: 600 }}>{r.netCashflow >= 0 ? '+' : ''}${r.netCashflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                                <td style={{ padding: '7px 11px', textAlign: 'right', color: r.cumulativeNet >= 0 ? G['700'] : T['700'], fontWeight: 700 }}>{r.cumulativeNet >= 0 ? '+' : ''}${r.cumulativeNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '12px 0 0', lineHeight: 1.5 }}>Assumes ${projection.upfrontCost.toLocaleString()} up-front validation (Year 0) and ${projection.annualMrv.toLocaleString()}/yr MRV.</p>
                  </div>
                ) : result && !(parseFloat(price) > 0) ? (
                  <div style={{ ...PANEL, marginBottom: '14px', borderLeft: `3px solid ${Au['500']}`, padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${Au['500']}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>💰</div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0, lineHeight: 1.65 }}>
                      <strong style={{ color: Au['700'] }}>Want a revenue projection?</strong> Go back to Step 3 and enter a carbon price (USD/t CO₂e) — voluntary market averages $20–60/t — then recalculate for a full Year 1–{Math.min(parseInt(years), 20)} cashflow table.
                    </p>
                  </div>
                ) : null}

                {/* Sensitivity Tornado */}
                {tornado && tornado.rows.length > 0 && (
                  <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${G['500']}` }}>
                    <div style={{ marginBottom: '14px' }}>
                      <p className="eyebrow-premium" style={{ marginBottom: '6px' }}>Sensitivity Analysis · One-at-a-time Tornado</p>
                      <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,1.8vw,24px)', fontWeight: 700, color: F.head, margin: '0 0 6px', letterSpacing: '-0.02em' }}>Which decision moves the needle most?</h3>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0, lineHeight: 1.65 }}>Each bar shows how much your total CO₂e swings if that parameter alone is changed across its full range. Longest bar = biggest lever.</p>
                    </div>
                    {(() => {
                      const maxAbs = tornado.maxAbsDelta || 1;
                      return (
                        <div>
                          {tornado.rows.map((r, i) => {
                            const lowPct = (Math.abs(r.deltaFromCentralLow) / maxAbs) * 50;
                            const highPct = (Math.abs(r.deltaFromCentralHigh) / maxAbs) * 50;
                            return (
                              <div key={i} style={{ marginBottom: '12px' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                                  <span style={{ color: F.body, fontWeight: 700 }}>{r.name}</span>
                                  <span style={{ color: F.faint }}>swing: <b style={{ color: r.color }}>{r.range.toLocaleString(undefined, { maximumFractionDigits: 1 })} t CO₂e</b></span>
                                </div>
                                <div style={{ position: 'relative', height: '22px', background: '#F7F2E8', borderRadius: '5px', overflow: 'hidden' }}>
                                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: F.muted, opacity: 0.35 }} />
                                  <div style={{ position: 'absolute', top: 0, bottom: 0, right: '50%', width: `${lowPct}%`, background: T['500'], transition: 'width 0.7s ease' }} />
                                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: `${highPct}%`, background: r.color, transition: 'width 0.7s ease' }} />
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '3px' }}>
                                  <span><b style={{ color: T['500'] }}>{r.deltaFromCentralLow >= 0 ? '+' : ''}{r.deltaFromCentralLow.toFixed(1)} t</b> if {String(r.lowChoice).replace(/-/g, ' ')}</span>
                                  <span><b style={{ color: r.color }}>{r.deltaFromCentralHigh >= 0 ? '+' : ''}{r.deltaFromCentralHigh.toFixed(1)} t</b> if {String(r.highChoice).replace(/-/g, ' ')}</span>
                                </div>
                              </div>
                            );
                          })}
                          <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, paddingTop: '10px', borderTop: '1px solid #DDD5C4' }}>
                            <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: T['500'], borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> downward swing</span>
                            <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: G['500'], borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> upward swing</span>
                            <span style={{ marginLeft: 'auto' }}>Central estimate: <b style={{ color: F.head }}>{tornado.central.toLocaleString(undefined, { maximumFractionDigits: 1 })} t</b></span>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                )}

                {/* Co-benefits + Best upgrade + Market eligibility */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px', marginBottom: '14px' }}>
                  {cobens && (
                    <div style={{ ...PANEL, padding: '20px' }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 4px' }}>Co-Benefits</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>Estimated improvement from scenario change</p>
                      <CoBenefitBar label="Water Retention" value={cobens.waterRetention} icon="💧" />
                      <CoBenefitBar label="Erosion Protection" value={cobens.erosionProtection} icon="🛡" />
                      <CoBenefitBar label="Biodiversity" value={cobens.biodiversity} icon="🌿" />
                      <CoBenefitBar label="Yield Stability" value={cobens.yieldStability} icon="📈" />
                      <CoBenefitBar label="Overall Soil Health" value={cobens.soilHealth} icon="🌱" />
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, margin: '12px 0 0', lineHeight: 1.6 }}>Rule-based proxies. Not certified. Use for planning only.</p>
                    </div>
                  )}
                  {bestUp && (
                    <div style={{ ...PANEL, padding: '20px', borderTop: `3px solid ${Au['500']}` }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 4px' }}>Best Single Upgrade</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>From your baseline, this change gives the highest SOC gain</p>
                      <div style={{ padding: '16px', background: G['100'], border: `1px solid ${G['300']}50`, borderRadius: '10px', marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 800, color: G['700'], marginBottom: '6px' }}>{bestUp.change}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.65, marginBottom: '10px' }}>{bestUp.desc}</div>
                        <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: G['700'] }}>+{bestUp.delta.toFixed(3)} t C ha⁻¹</div>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, lineHeight: 1.6, margin: 0 }}>Go back to Step 3 and apply this change in the Scenario panel, then recalculate.</p>
                    </div>
                  )}
                  {market && (
                    <div style={{ ...PANEL, padding: '20px', borderTop: `3px solid ${market.color}` }}>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 4px' }}>Market Eligibility</p>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>Based on your projected CO₂e volume</p>
                      <div style={{ padding: '14px', background: '#F7F2E8', border: `1px solid ${market.color}25`, borderRadius: '10px', marginBottom: '12px' }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 800, color: market.color, marginBottom: '5px' }}>{market.label}</div>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.65 }}>{market.note}</div>
                      </div>
                      {[['Verra VCS', '≥ 1 000 t'], ['Gold Standard', '≥ 500 t'], ['Plan Vivo', 'Aggregation'], ['Soil & More', 'Any size']].map(([std, min]) => (
                        <div key={std} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #DDD5C4', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                          <span style={{ color: F.body, fontWeight: 600 }}>{std}</span>
                          <span style={{ color: F.faint }}>{min}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                {/* ROI link */}
                <div style={{ ...PANEL, marginBottom: '14px', borderLeft: `4px solid ${G['700']}`, padding: '18px 20px', display: 'flex', gap: '14px', alignItems: 'center', flexWrap: 'wrap', background: 'linear-gradient(135deg, rgba(254,253,249,0.99), rgba(240,253,244,0.96))' }}>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: G['500'], letterSpacing: '0.1em', textTransform: 'uppercase', margin: '0 0 4px' }}>Full Financial Model</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0, lineHeight: 1.65 }}>Go deeper with <strong style={{ color: F.body }}>NPV, IRR, payback analysis</strong>, itemized implementation costs, and USDA EQIP / CSP subsidy eligibility.</p>
                  </div>
                  <Link to={`/roi?area=${area}&rate=${result ? (result.co2ePerHaPerYear / 3.667).toFixed(3) : '0.8'}&price=${price || '20'}&years=${years}`} style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', padding: '11px 20px', background: G['700'], color: '#FEFDF9', border: 'none', borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, textDecoration: 'none', boxShadow: `0 4px 16px ${G['700']}30`, flexShrink: 0 }}>
                    Open ROI Calculator →
                  </Link>
                </div>

                {/* Export actions */}
                <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
                  <button onClick={exportPdf} className="btn-forest" style={{ flex: '1 1 220px', justifyContent: 'center' }}>↓ Download Branded PDF Report</button>
                  <button onClick={exportReport} className="btn-outline-terra" style={{ flex: '1 1 180px', justifyContent: 'center' }}>↓ Methodology Report (TXT)</button>
                  <button onClick={copyShareLink} className="btn-outline-terra" style={{ flex: '1 1 160px', justifyContent: 'center' }}>{linkCopied ? '✓ Link Copied' : '🔗 Share Scenario'}</button>
                  <button onClick={copyCitation} className="btn-outline-terra" style={{ flex: '1 1 160px', justifyContent: 'center' }}>{copied ? '✓ Copied' : 'Copy IPCC Citation'}</button>
                </div>
              </>
            )}

            {/* Scenario Library */}
            <div style={{ ...PANEL, marginBottom: '14px', borderLeft: `3px solid ${G['500']}` }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: showLibrary ? '14px' : '0' }}>
                <div>
                  <p className="eyebrow-premium" style={{ marginBottom: '4px' }}>Scenario Library {scenarios.length > 0 && <span style={{ color: F.faint, fontWeight: 400 }}>· {scenarios.length} saved</span>}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0, lineHeight: 1.5 }}>Save, compare and share named scenarios. Stored locally in your browser.</p>
                </div>
                <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                  <input type="text" placeholder="Name this scenario" value={saveName} onChange={e => setSaveName(e.target.value)} onKeyDown={e => { if (e.key === 'Enter') saveCurrentScenario(); }} style={{ ...SEL, width: '180px', padding: '8px 12px', fontSize: '12px' }} />
                  <button onClick={saveCurrentScenario} className="btn-forest" style={{ padding: '8px 16px', fontSize: '12px' }}>+ Save</button>
                  <button onClick={() => setShowLibrary(v => !v)} className="btn-outline-terra" style={{ padding: '8px 16px', fontSize: '12px' }}>{showLibrary ? 'Hide' : 'Show'} ({scenarios.length})</button>
                  <button onClick={copyShareLink} className="btn-outline-terra" style={{ padding: '8px 16px', fontSize: '12px' }}>{linkCopied ? '✓ Link Copied' : '🔗 Share'}</button>
                </div>
              </div>
              {showLibrary && (
                scenarios.length === 0 ? (
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.faint, margin: '8px 0 0', fontStyle: 'italic' }}>No saved scenarios yet. Configure your inputs and click Save to build a comparison library.</p>
                ) : (
                  <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #DDD5C4', maxHeight: '260px', overflowY: 'auto' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                      <thead style={{ background: '#F7F2E8', position: 'sticky', top: 0 }}>
                        <tr>{['Name', 'Climate', 'Area', 'Yrs', 'Scenario', 'CO₂e (t)', 'ΔSOC', 'Health', ''].map(h => (<th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontSize: '10px', fontWeight: 700, color: F.muted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #DDD5C4', whiteSpace: 'nowrap' }}>{h}</th>))}</tr>
                      </thead>
                      <tbody>
                        {scenarios.map((s, i) => (
                          <tr key={s.id} style={{ background: i % 2 === 0 ? '#FEFDF9' : 'transparent' }}>
                            <td style={{ padding: '7px 10px', fontWeight: 700, color: F.head }}>{s.name}</td>
                            <td style={{ padding: '7px 10px', color: F.muted }}>{(SOC_REF[s.climate]?.label || s.climate).replace('Temperate ', 'Temp. ')}</td>
                            <td style={{ padding: '7px 10px', color: F.muted }}>{s.area} ha</td>
                            <td style={{ padding: '7px 10px', color: F.muted }}>{s.years}</td>
                            <td style={{ padding: '7px 10px', color: F.muted, fontSize: '10px' }}>{s.scen.tillage}, {s.scen.inputs}</td>
                            <td style={{ padding: '7px 10px', color: s.co2eTotal >= 0 ? G['700'] : T['700'], fontWeight: 700 }}>{s.co2eTotal != null ? `${s.co2eTotal >= 0 ? '+' : ''}${s.co2eTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })}` : '—'}</td>
                            <td style={{ padding: '7px 10px', color: F.muted }}>{s.deltaSocPerHa != null ? `${s.deltaSocPerHa >= 0 ? '+' : ''}${s.deltaSocPerHa.toFixed(3)}` : '—'}</td>
                            <td style={{ padding: '7px 10px', color: F.muted, fontWeight: 700 }}>{s.soilHealth ?? '—'}</td>
                            <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                              <button onClick={() => loadScenario(s)} style={{ background: 'none', border: 'none', color: G['700'], cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '0 6px' }}>Load</button>
                              <button onClick={() => removeScenario(s.id)} style={{ background: 'none', border: 'none', color: T['500'], cursor: 'pointer', fontSize: '11px', fontWeight: 700, padding: '0 6px' }}>✕</button>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )
              )}
            </div>

            {/* Methodology footnote */}
            <div style={{ padding: '14px 18px', background: '#F7F2E8', border: '1px solid #DDD5C4', borderLeft: `3px solid ${Au['500']}`, borderRadius: '12px', fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.7 }}>
              <strong style={{ color: Au['700'] }}>Methodology:</strong> IPCC (2006) Vol. 4, Ch. 2 Tier 1 — global default coefficients. Screening-level estimates only. Tier 2/3 soil sampling required for carbon credit certification (Verra VCS, Gold Standard). CH₄ and N₂O excluded.
            </div>
          </>
        )}

        {/* ══ RESULTS ══════════════════════════════════════════════════ */}
        {result && (
          <>
            {/* Direction warning */}
            {!isPos && (
              <div style={{
                padding: '14px 18px',
                background: 'rgba(196,105,74,0.07)',
                border: `1px solid ${T['500']}`,
                borderLeft: `4px solid ${T['500']}`,
                borderRadius: '12px', marginBottom: '16px',
                fontFamily: 'Inter, sans-serif', fontSize: '12px', color: T['700'], lineHeight: 1.65,
              }}>
                <strong>⚠ Net Carbon Loss:</strong> Your scenario releases more carbon than the baseline. Adjust the scenario to find an additive combination.
              </div>
            )}

            {/* KPI row */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '12px', marginBottom: '16px' }}>
              <KpiCard label="Total CO₂e sequestered" value={(result.co2eTotal >= 0 ? '+' : '') + result.co2eTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })} unit="tonnes CO₂e" accent={resultColor} />
              <KpiCard label="Annual rate per hectare" value={(result.co2ePerHaPerYear >= 0 ? '+' : '') + result.co2ePerHaPerYear.toFixed(2)} unit="t CO₂e ha⁻¹ yr⁻¹" accent={G['500']} />
              <KpiCard label="SOC stock uplift" value={(result.deltaSocPerHa >= 0 ? '+' : '') + result.deltaSocPerHa.toFixed(3)} unit="t C ha⁻¹" accent={Au['500']} />
              {result.marketValue != null && (
                <KpiCard label={`Market value @$${price}/t`} value={'$' + result.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })} unit="USD estimated" accent={Au['700']} />
              )}
            </div>

            {/* Plain-English Summary */}
            {summary && (
              <div style={{
                ...PANEL, marginBottom: '16px',
                borderLeft: `4px solid ${summary.isGain ? G['700'] : T['500']}`,
                padding: '22px 24px',
                background: summary.isGain
                  ? 'linear-gradient(135deg, rgba(254,253,249,0.99), rgba(240,253,244,0.96))'
                  : 'linear-gradient(135deg, rgba(254,253,249,0.99), rgba(255,247,243,0.96))',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '14px' }}>
                  <div style={{
                    width: '44px', height: '44px', borderRadius: '14px', flexShrink: 0,
                    background: `${summary.isGain ? G['700'] : T['500']}15`,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '22px',
                  }}>{summary.isGain ? '🌱' : '⚠️'}</div>
                  <div>
                    <p className="eyebrow-premium" style={{ color: summary.isGain ? G['500'] : T['500'], marginBottom: '4px' }}>
                      {summary.isGain ? 'What This Means for Your Farm' : 'Important — Review Your Scenario'}
                    </p>
                    <h3 style={{
                      fontFamily: 'Cormorant Garamond, serif',
                      fontSize: 'clamp(16px, 2vw, 24px)', fontWeight: 700, color: F.head, margin: 0,
                      letterSpacing: '-0.02em',
                    }}>
                      {summary.headline}
                    </h3>
                  </div>
                </div>

                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px,1.3vw,15px)', color: F.body, lineHeight: 1.8, margin: '0 0 18px' }}>
                  {summary.story}
                </p>

                {summary.bullets.length > 0 && (
                  <>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: F.muted, margin: '0 0 10px', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                      That's equivalent to…
                    </p>
                    <ul style={{ margin: 0, padding: 0, listStyle: 'none', display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(220px,1fr))', gap: '8px' }}>
                      {summary.bullets.map((b, i) => (
                        <li key={i} style={{
                          display: 'flex', gap: '10px', alignItems: 'flex-start',
                          padding: '10px 14px',
                          background: G['100'],
                          border: `1px solid ${G['300']}50`,
                          borderRadius: '10px',
                          fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.body, lineHeight: 1.55,
                        }}>
                          <span style={{ color: G['700'], fontWeight: 800, flexShrink: 0 }}>✓</span>
                          {b}
                        </li>
                      ))}
                    </ul>
                  </>
                )}
              </div>
            )}

            {/* Trajectory chart + SOC comparison */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(280px,1fr))', gap: '14px', marginBottom: '14px' }}>
              <div style={{ ...PANEL, padding: '20px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 3px' }}>Cumulative CO₂e Trajectory</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>Linear ramp to IPCC Tier 1 equilibrium over {Math.min(parseInt(years), 20)} yr</p>
                <ResponsiveContainer width="100%" height={180}>
                  <LineChart data={result.trajectory} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DA" />
                    <XAxis dataKey="year" tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} />
                    <YAxis tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} width={50} tickFormatter={v => Math.abs(v) >= 1000 ? `${(v/1000).toFixed(1)}k` : v.toFixed(0)} />
                    <Tooltip content={<ChartTooltip />} />
                    <ReferenceLine y={0} stroke="#DDD5C4" strokeDasharray="4 2" />
                    <Line type="monotone" dataKey="co2e" stroke={resultColor} strokeWidth={2.5} dot={false} activeDot={{ r: 5, fill: resultColor, strokeWidth: 2, stroke: '#fff' }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <div style={{ ...PANEL, padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 14px' }}>SOC Stock Comparison</p>
                  {[{ label: 'Baseline', val: result.baselineSocStock, color: T['500'] }, { label: 'Scenario', val: result.scenarioSocStock, color: G['700'] }].map(row => {
                    const max = Math.max(result.baselineSocStock, result.scenarioSocStock) * 1.12 || 1;
                    return (
                      <div key={row.label} style={{ marginBottom: '12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: row.color, fontWeight: 700 }}>{row.label}</span>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '11px', color: F.muted }}>{row.val.toFixed(3)} t C ha⁻¹</span>
                        </div>
                        <div style={{ height: '8px', background: '#EDE7DA', borderRadius: '4px', overflow: 'hidden' }}>
                          <div style={{ height: '100%', width: `${(row.val / max) * 100}%`, background: row.color, borderRadius: '4px', transition: 'width 0.7s ease' }} />
                        </div>
                      </div>
                    );
                  })}
                  <div style={{ marginTop: '10px', padding: '9px 14px', background: isPos ? G['100'] : 'rgba(196,105,74,0.08)', border: `1px solid ${isPos ? G['300'] + '60' : T['500']}`, borderRadius: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted }}>Net ΔSOC / ha</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '14px', fontWeight: 700, color: resultColor }}>
                      {result.deltaSocPerHa >= 0 ? '+' : ''}{result.deltaSocPerHa.toFixed(3)} t C ha⁻¹
                    </span>
                  </div>
                </div>

                <div>
                  <p className="eyebrow-premium" style={{ marginBottom: '10px' }}>IPCC Factors</p>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', gap: '8px' }}>
                    {[['Baseline', result.factors.base, T['500']], ['Scenario', result.factors.scen, G['700']]].map(([title, f, color]) => (
                      <div key={title} style={{ padding: '11px 12px', background: '#F7F2E8', borderLeft: `3px solid ${color}`, borderRadius: '8px' }}>
                        <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color, fontWeight: 700, marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.06em' }}>{title}</div>
                        {[['F_LU', f.fLu], ['F_MG', f.fMg], ['F_IN', f.fIn]].map(([k, v]) => (
                          <div key={k} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '3px' }}>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '10px', color: F.faint }}>{k}</span>
                            <span style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '10px', color: F.body, fontWeight: 600 }}>{v.toFixed(3)}</span>
                          </div>
                        ))}
                      </div>
                    ))}
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '10px 0 0' }}>95% CI: ±{result.co2eUncertainty.toFixed(1)} t CO₂e total</p>
                </div>
              </div>
            </div>

            {/* Regional Benchmark */}
            {benchmark && (
              <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${benchmark.color}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px', marginBottom: '16px' }}>
                  <div>
                    <p className="eyebrow-premium" style={{ marginBottom: '6px' }}>Regional Benchmark · {benchmark.zoneLabel}</p>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,1.8vw,24px)', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '-0.02em' }}>
                      Your field sequesters{' '}
                      <span style={{ color: benchmark.color }}>{benchmark.ratioRegion.toFixed(2)}×</span>{' '}
                      the regional average
                    </h3>
                  </div>
                  <div style={{ padding: '7px 14px', background: benchmark.color + '18', border: `1px solid ${benchmark.color}35`, borderRadius: '10px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: benchmark.color }}>
                    {benchmark.percentile}th percentile
                  </div>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.body, lineHeight: 1.7, margin: '0 0 16px' }}>
                  {benchmark.verdict}. Across global agricultural land (FAO 2021 average ~{benchmark.globalAvg} t C ha⁻¹ yr⁻¹) you're at <strong style={{ color: F.head }}>{benchmark.ratioGlobal.toFixed(2)}×</strong> the world average.
                </p>
                <div style={{ position: 'relative', height: '28px', background: '#EDE7DA', borderRadius: '14px', overflow: 'hidden', marginBottom: '8px' }}>
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: '5%', width: '90%', background: `linear-gradient(to right, ${T['500']} 0%, ${Au['500']} 50%, ${G['700']} 100%)`, opacity: 0.28, borderRadius: '14px' }} />
                  <div style={{ position: 'absolute', top: 0, bottom: 0, left: `${5 + ((benchmark.regionMean - benchmark.regionLow) / (benchmark.regionHigh - benchmark.regionLow)) * 90}%`, width: '2px', background: F.muted }} />
                  <div style={{ position: 'absolute', top: '-4px', bottom: '-4px', left: `${Math.max(0, Math.min(100, 5 + ((benchmark.userValue - benchmark.regionLow) / (benchmark.regionHigh - benchmark.regionLow)) * 90))}%`, width: '4px', background: benchmark.color, borderRadius: '2px', boxShadow: `0 0 0 3px ${benchmark.color}50` }} />
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '10px', color: F.faint, marginBottom: '14px' }}>
                  <span>{benchmark.regionLow.toFixed(2)} (low)</span>
                  <span>{benchmark.regionMean.toFixed(2)} regional mean</span>
                  <span>{benchmark.regionHigh.toFixed(2)} (high)</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '8px' }}>
                  {[
                    ['Your rate', `${benchmark.userValue}`, 't C/ha/yr', benchmark.color],
                    ['Regional avg', `${benchmark.regionMean}`, 't C/ha/yr', F.head],
                    ['vs. Global', `${benchmark.ratioGlobal}×`, 'avg', benchmark.ratioGlobal >= 1 ? G['700'] : T['500']],
                  ].map(([lbl, val, unit, col]) => (
                    <div key={lbl} style={{ ...CARD, textAlign: 'center', padding: '12px' }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{lbl}</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: col, lineHeight: 1 }}>
                        {val} <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 400, color: F.faint }}>{unit}</span>
                      </div>
                    </div>
                  ))}
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '12px 0 0', lineHeight: 1.5 }}>
                  Benchmark ranges synthesised from IPCC AR6 WG3 Ch.7 and FAO RECSOIL global agricultural sequestration meta-analyses.
                </p>
              </div>
            )}

            {/* Carbon Credit Revenue Projector */}
            {projection ? (
              <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${Au['500']}` }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', flexWrap: 'wrap', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <p className="eyebrow-premium" style={{ color: Au['700'], marginBottom: '6px' }}>Carbon Credit Revenue Projector</p>
                    <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,2vw,26px)', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '-0.02em' }}>
                      ${projection.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })} gross over {projection.rows.length - 1} years
                    </h3>
                  </div>
                  <button onClick={() => downloadRevenueCsv(projection, { climateZone: climate, area })} className="btn-outline-terra" style={{ padding: '8px 18px', fontSize: '12px' }}>
                    ↓ Download CSV
                  </button>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px', marginBottom: '16px' }}>
                  {[
                    ['Gross Revenue', `$${projection.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, G['700']],
                    ['MRV + Cert. Cost', `$${projection.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, T['500']],
                    ['Net Profit', `$${projection.totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, projection.totalNet >= 0 ? G['700'] : T['700']],
                    ['Break-even', projection.breakEvenYear ? `Year ${projection.breakEvenYear}` : '—', Au['700']],
                  ].map(([lbl, val, col]) => (
                    <div key={lbl} style={{ ...CARD, textAlign: 'center', padding: '12px', borderTop: `2px solid ${col}` }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '5px' }}>{lbl}</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: col }}>{val}</div>
                    </div>
                  ))}
                </div>
                <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #DDD5C4' }}>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                    <thead style={{ background: '#F7F2E8' }}>
                      <tr>
                        {['Year', 'Annual t CO₂e', 'Gross USD', 'Costs USD', 'Net USD', 'Cumulative Net USD'].map(h => (
                          <th key={h} style={{ padding: '9px 11px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: F.muted, letterSpacing: '0.05em', textTransform: 'uppercase', borderBottom: '1px solid #DDD5C4' }}>{h}</th>
                        ))}
                      </tr>
                    </thead>
                    <tbody>
                      {projection.rows.map(r => {
                        const isBE = r.year === projection.breakEvenYear;
                        return (
                          <tr key={r.year} style={{ background: isBE ? G['100'] : (r.year % 2 === 0 ? '#FEFDF9' : 'transparent'), borderLeft: isBE ? `3px solid ${G['700']}` : 'none' }}>
                            <td style={{ padding: '7px 11px', textAlign: 'right', color: F.body, fontWeight: isBE ? 800 : 600 }}>{r.year}{isBE ? ' ← break-even' : ''}</td>
                            <td style={{ padding: '7px 11px', textAlign: 'right', color: F.muted, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{r.co2eYearly.toFixed(2)}</td>
                            <td style={{ padding: '7px 11px', textAlign: 'right', color: G['700'] }}>${r.grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td style={{ padding: '7px 11px', textAlign: 'right', color: T['500'] }}>${r.costs.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td style={{ padding: '7px 11px', textAlign: 'right', color: r.netCashflow >= 0 ? G['700'] : T['700'], fontWeight: 600 }}>{r.netCashflow >= 0 ? '+' : ''}${r.netCashflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                            <td style={{ padding: '7px 11px', textAlign: 'right', color: r.cumulativeNet >= 0 ? G['700'] : T['700'], fontWeight: 700 }}>{r.cumulativeNet >= 0 ? '+' : ''}${r.cumulativeNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '12px 0 0', lineHeight: 1.5 }}>
                  Assumes ${projection.upfrontCost.toLocaleString()} up-front validation (Year 0) and ${projection.annualMrv.toLocaleString()}/yr MRV. Adjust the carbon price field above to re-run.
                </p>
              </div>
            ) : result && !(parseFloat(price) > 0) ? (
              <div style={{ ...PANEL, marginBottom: '14px', borderLeft: `3px solid ${Au['500']}`, padding: '16px 20px', display: 'flex', gap: '14px', alignItems: 'center' }}>
                <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: `${Au['500']}15`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '18px', flexShrink: 0 }}>💰</div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0, lineHeight: 1.65 }}>
                  <strong style={{ color: Au['700'] }}>Want a revenue projection?</strong> Enter a carbon price (USD/t CO₂e) above — voluntary market averages $20–60/t — to get a Year 1–{Math.min(parseInt(years), 20)} cashflow table with break-even point.
                </p>
              </div>
            ) : null}

            {/* Sensitivity Tornado */}
            {tornado && tornado.rows.length > 0 && (
              <div style={{ ...PANEL, marginBottom: '14px', borderTop: `3px solid ${G['500']}` }}>
                <div style={{ marginBottom: '14px' }}>
                  <p className="eyebrow-premium" style={{ marginBottom: '6px' }}>Sensitivity Analysis · One-at-a-time Tornado</p>
                  <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(16px,1.8vw,24px)', fontWeight: 700, color: F.head, margin: '0 0 6px', letterSpacing: '-0.02em' }}>
                    Which decision moves the needle most?
                  </h3>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: 0, lineHeight: 1.65 }}>
                    Each bar shows how much your total CO₂e swings if that parameter alone is changed across its full range. Longest bar = biggest lever.
                  </p>
                </div>
                {(() => {
                  const maxAbs = tornado.maxAbsDelta || 1;
                  return (
                    <div>
                      {tornado.rows.map((r, i) => {
                        const lowPct  = (Math.abs(r.deltaFromCentralLow)  / maxAbs) * 50;
                        const highPct = (Math.abs(r.deltaFromCentralHigh) / maxAbs) * 50;
                        return (
                          <div key={i} style={{ marginBottom: '12px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                              <span style={{ color: F.body, fontWeight: 700 }}>{r.name}</span>
                              <span style={{ color: F.faint }}>swing: <b style={{ color: r.color }}>{r.range.toLocaleString(undefined, { maximumFractionDigits: 1 })} t CO₂e</b></span>
                            </div>
                            <div style={{ position: 'relative', height: '22px', background: '#F7F2E8', borderRadius: '5px', overflow: 'hidden' }}>
                              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: '1px', background: F.muted, opacity: 0.35 }} />
                              <div style={{ position: 'absolute', top: 0, bottom: 0, right: '50%', width: `${lowPct}%`, background: T['500'], transition: 'width 0.7s ease' }} />
                              <div style={{ position: 'absolute', top: 0, bottom: 0, left: '50%', width: `${highPct}%`, background: r.color, transition: 'width 0.7s ease' }} />
                            </div>
                            <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '3px' }}>
                              <span><b style={{ color: T['500'] }}>{r.deltaFromCentralLow >= 0 ? '+' : ''}{r.deltaFromCentralLow.toFixed(1)} t</b> if {String(r.lowChoice).replace(/-/g, ' ')}</span>
                              <span><b style={{ color: r.color }}>{r.deltaFromCentralHigh >= 0 ? '+' : ''}{r.deltaFromCentralHigh.toFixed(1)} t</b> if {String(r.highChoice).replace(/-/g, ' ')}</span>
                            </div>
                          </div>
                        );
                      })}
                      <div style={{ display: 'flex', gap: '14px', marginTop: '10px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, paddingTop: '10px', borderTop: '1px solid #DDD5C4' }}>
                        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: T['500'], borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> downward swing</span>
                        <span><span style={{ display: 'inline-block', width: '10px', height: '10px', background: G['500'], borderRadius: '2px', marginRight: '4px', verticalAlign: 'middle' }} /> upward swing</span>
                        <span style={{ marginLeft: 'auto' }}>Central estimate: <b style={{ color: F.head }}>{tornado.central.toLocaleString(undefined, { maximumFractionDigits: 1 })} t</b></span>
                      </div>
                    </div>
                  );
                })()}
              </div>
            )}

            {/* Co-benefits + Best upgrade + Market eligibility */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(260px,1fr))', gap: '14px', marginBottom: '14px' }}>
              {cobens && (
                <div style={{ ...PANEL, padding: '20px' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 4px' }}>Co-Benefits</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>Estimated improvement from scenario change</p>
                  <CoBenefitBar label="Water Retention"     value={cobens.waterRetention}    icon="💧" />
                  <CoBenefitBar label="Erosion Protection"  value={cobens.erosionProtection} icon="🛡" />
                  <CoBenefitBar label="Biodiversity"        value={cobens.biodiversity}      icon="🌿" />
                  <CoBenefitBar label="Yield Stability"     value={cobens.yieldStability}    icon="📈" />
                  <CoBenefitBar label="Overall Soil Health" value={cobens.soilHealth}        icon="🌱" />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, margin: '12px 0 0', lineHeight: 1.6 }}>Rule-based proxies. Not certified. Use for planning only.</p>
                </div>
              )}
              {bestUp && (
                <div style={{ ...PANEL, padding: '20px', borderTop: `3px solid ${Au['500']}` }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 4px' }}>Best Single Upgrade</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>From your baseline, this change gives the highest SOC gain</p>
                  <div style={{ padding: '16px', background: G['100'], border: `1px solid ${G['300']}50`, borderRadius: '10px', marginBottom: '12px' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '14px', fontWeight: 800, color: G['700'], marginBottom: '6px' }}>{bestUp.change}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.65, marginBottom: '10px' }}>{bestUp.desc}</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: G['700'] }}>+{bestUp.delta.toFixed(3)} t C ha⁻¹</div>
                  </div>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, lineHeight: 1.6, margin: 0 }}>
                    Apply this in the Scenario panel above and recalculate to see the full impact across {area} ha.
                  </p>
                </div>
              )}
              {market && (
                <div style={{ ...PANEL, padding: '20px', borderTop: `3px solid ${market.color}` }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: F.head, margin: '0 0 4px' }}>Market Eligibility</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 16px' }}>Based on your projected CO₂e volume</p>
                  <div style={{ padding: '14px', background: '#F7F2E8', border: `1px solid ${market.color}25`, borderRadius: '10px', marginBottom: '12px' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 800, color: market.color, marginBottom: '5px' }}>{market.label}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.65 }}>{market.note}</div>
                  </div>
                  {[['Verra VCS', '≥ 1 000 t'], ['Gold Standard', '≥ 500 t'], ['Plan Vivo', 'Aggregation'], ['Soil & More', 'Any size']].map(([std, min]) => (
                    <div key={std} style={{ display: 'flex', justifyContent: 'space-between', padding: '6px 0', borderBottom: '1px solid #DDD5C4', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                      <span style={{ color: F.body, fontWeight: 600 }}>{std}</span>
                      <span style={{ color: F.faint, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>{min}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Export actions */}
            <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '16px' }}>
              <button onClick={exportPdf} className="btn-forest" style={{ flex: '1 1 220px', justifyContent: 'center' }}>
                ↓ Download Branded PDF Report
              </button>
              <button onClick={exportReport} className="btn-outline-terra" style={{ flex: '1 1 180px', justifyContent: 'center' }}>
                ↓ Methodology Report (TXT)
              </button>
              <button onClick={copyShareLink} className="btn-outline-terra" style={{ flex: '1 1 160px', justifyContent: 'center' }}>
                {linkCopied ? '✓ Link Copied' : '🔗 Share Scenario'}
              </button>
              <button onClick={copyCitation} className="btn-outline-terra" style={{ flex: '1 1 160px', justifyContent: 'center' }}>
                {copied ? '✓ Copied' : 'Copy IPCC Citation'}
              </button>
            </div>
          </>
        )}

        {/* ── Step navigation ── */}
        {wizStep < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '18px 0 6px', gap: '12px' }}>
            {wizStep > 1 ? (
              <button
                onClick={() => setWizStep(s => s - 1)}
                style={{
                  display: 'inline-flex', alignItems: 'center', gap: '7px',
                  padding: '10px 20px', background: 'transparent',
                  border: '1.5px solid rgba(21,82,51,0.25)', borderRadius: '10px',
                  fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px',
                  color: '#155233', cursor: 'pointer', transition: 'all 0.18s',
                }}
              >
                ← Back
              </button>
            ) : <div />}

            {wizStep < 3 && (
              <button
                className="btn-forest"
                onClick={() => setWizStep(s => s + 1)}
              >
                Continue to Step {wizStep + 1}
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="M5 12h14M12 5l7 7-7 7"/></svg>
              </button>
            )}

            {wizStep === 3 && (
              <button
                className="btn-forest"
                disabled={busy}
                onClick={() => { calculate(); setWizStep(4); }}
                style={{ background: 'linear-gradient(135deg, #CA8A04, #D97706)', boxShadow: '0 4px 16px rgba(202,138,4,0.35)' }}
              >
                {busy ? 'Calculating…' : 'See My Results →'}
              </button>
            )}
          </div>
        )}

        {wizStep === 4 && !busy && result && (
          <div style={{ display: 'flex', justifyContent: 'flex-start', paddingTop: '14px' }}>
            <button
              onClick={() => setWizStep(3)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '7px',
                padding: '10px 20px', background: 'transparent',
                border: '1.5px solid rgba(21,82,51,0.25)', borderRadius: '10px',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '13px',
                color: '#155233', cursor: 'pointer',
              }}
            >
              ← Adjust Scenario
            </button>
          </div>
        )}

        {/* Methodology footnote */}
        <div style={{
          padding: '14px 18px',
          background: '#F7F2E8',
          border: '1px solid #DDD5C4',
          borderLeft: `3px solid ${Au['500']}`,
          borderRadius: '12px',
          fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.7,
        }}>
          <strong style={{ color: Au['700'] }}>Methodology:</strong> IPCC (2006) Vol. 4, Ch. 2 Tier 1 — global default coefficients. Screening-level estimates only. Tier 2/3 soil sampling required for carbon credit certification (Verra VCS, Gold Standard). CH₄ and N₂O excluded.
        </div>
      </div>
    </div>
  );
}
