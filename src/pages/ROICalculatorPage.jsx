import { useState, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import {
  AreaChart, Area, LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ReferenceLine, ResponsiveContainer, Legend,
} from 'recharts';
import { buildFinancialModel, INVESTMENT_BENCHMARKS } from '../utils/npvCalculator';
import { estimateSubsidies, US_STATES, PRACTICE_OPTIONS, EQIP_META, CSP_META } from '../utils/subsidyData';

// ─── Design tokens (matching main site) ──────────────────────────
const F  = { head: '#052E16', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };
const G  = { '700': '#155233', '500': '#166534', '300': '#4ADE80', '100': '#DCFCE7' };
const T  = { '700': '#A0522D', '500': '#C4694A' };
const Au = { '500': '#CA8A04', '700': '#92400E' };

const PANEL = {
  background: 'rgba(254,253,249,0.99)',
  border: '1px solid rgba(21,128,61,0.10)',
  borderRadius: '16px',
  padding: '24px',
  boxShadow: '0 4px 24px rgba(5,46,22,0.06)',
  marginBottom: '16px',
};
const CARD = {
  background: '#F7F2E8',
  border: '1px solid #DDD5C4',
  borderRadius: '12px',
  padding: '16px',
};
const INP = {
  width: '100%', padding: '10px 14px', boxSizing: 'border-box',
  background: '#FEFDF9', border: '1.5px solid #DDD5C4', borderRadius: '9px',
  color: '#1A2E22', fontFamily: 'Inter, sans-serif', fontSize: '13px',
  outline: 'none',
};
const LBL = {
  display: 'block', fontSize: '10px', fontWeight: 700, color: '#8A9F95',
  marginBottom: '6px', letterSpacing: '0.12em', textTransform: 'uppercase',
  fontFamily: 'Inter, sans-serif',
};

function Fld({ label, children }) {
  return <div style={{ marginBottom: '14px' }}><label style={LBL}>{label}</label>{children}</div>;
}

function KpiCard({ label, value, unit, accent, sub }) {
  return (
    <div style={{ ...CARD, textAlign: 'center', borderTop: `3px solid ${accent}` }}>
      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(20px,2.5vw,32px)', fontWeight: 700, color: accent, lineHeight: 1, marginBottom: '4px' }}>{value}</div>
      {unit && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', letterSpacing: '0.08em', color: F.faint, textTransform: 'uppercase', marginBottom: '3px' }}>{unit}</div>}
      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.4 }}>{label}</div>
      {sub && <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '4px' }}>{sub}</div>}
    </div>
  );
}

function SectionHeading({ eyebrow, title, desc }) {
  return (
    <div style={{ marginBottom: '18px' }}>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: G['500'], letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 6px' }}>{eyebrow}</p>
      <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(20px,2.5vw,34px)', fontWeight: 700, color: F.head, margin: '0 0 8px', letterSpacing: '-0.02em' }}>{title}</h2>
      {desc && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.muted, margin: 0, lineHeight: 1.7 }}>{desc}</p>}
    </div>
  );
}

// Custom tooltip for recharts
function ChartTip({ active, payload, label, prefix = '$' }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FEFDF9', border: '1px solid #DDD5C4', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 6px 24px rgba(5,46,22,0.12)', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
      <p style={{ color: F.faint, margin: '0 0 6px' }}>Year {label}</p>
      {payload.map(p => (
        <p key={p.dataKey} style={{ margin: '2px 0', color: p.color, fontWeight: 700 }}>
          {p.name}: {prefix}{typeof p.value === 'number' ? p.value.toLocaleString(undefined, { maximumFractionDigits: 0 }) : p.value}
        </p>
      ))}
    </div>
  );
}

// ─── Default implementation cost presets ─────────────────────────
const IMPL_DEFAULTS = {
  coverCropSeed:        22, // $/ha/yr
  coverCropTermination: 12, // $/ha/yr
  noTillDrill:           8, // $/ha/yr (custom hire or ownership amortized)
  laborAdjustment:     -10, // $/ha/yr — negative = savings (fewer tillage passes)
  soilSampling:         12, // $/ha per sampling event (every 5 yr, so /5 = $2.4/ha/yr)
  certificationUpfront: 12000, // one-time
  certificationAnnual:  2500,  // $/yr MRV
};

export default function ROICalculatorPage() {
  const [params] = useSearchParams();

  // Farm profile — seed from URL params if coming from main calculator
  const [area,         setArea]         = useState(() => parseFloat(params.get('area'))   || 10);
  const [carbonPpHpY,  setCarbonPpHpY]  = useState(() => parseFloat(params.get('rate'))   || 0.8);
  const [carbonPrice,  setCarbonPrice]  = useState(() => parseFloat(params.get('price'))  || 20);
  const [years,        setYears]        = useState(() => parseInt(params.get('years'))    || 10);
  const [discountRate, setDiscountRate] = useState(7);
  const [yieldImpact,  setYieldImpact]  = useState(3); // % of carbon revenue added for yield improvement

  // Implementation costs (per ha per year, unless noted)
  const [cc,           setCC]   = useState(IMPL_DEFAULTS.coverCropSeed);
  const [cct,          setCCT]  = useState(IMPL_DEFAULTS.coverCropTermination);
  const [ntd,          setNTD]  = useState(IMPL_DEFAULTS.noTillDrill);
  const [lab,          setLab]  = useState(IMPL_DEFAULTS.laborAdjustment);
  const [ss,           setSS]   = useState(IMPL_DEFAULTS.soilSampling);
  const [certUp,       setCertUp] = useState(IMPL_DEFAULTS.certificationUpfront);
  const [certAnn,      setCertAnn] = useState(IMPL_DEFAULTS.certificationAnnual);

  // Subsidy checker
  const [state,         setState]         = useState('IA');
  const [practices,     setPractices]     = useState(['cover-crops', 'no-till']);
  const [beginner,      setBeginner]      = useState(false);
  const [useSubsidies,  setUseSubsidies]  = useState(true);

  const togglePractice = key => setPractices(prev =>
    prev.includes(key) ? prev.filter(p => p !== key) : [...prev, key]
  );

  // Computed subsidy estimate
  const subsidy = useMemo(() =>
    estimateSubsidies({ state, areaHa: area, practices, beginnerFarmer: beginner }),
    [state, area, practices, beginner]
  );

  // Full financial model
  const model = useMemo(() => buildFinancialModel({
    area,
    co2ePerHaPerYear: carbonPpHpY,
    carbonPrice,
    years,
    implCosts: {
      coverCropSeed: cc,
      coverCropTermination: cct,
      noTillDrill: ntd,
      laborAdjustment: lab,
      soilSampling: ss,
      certification: { upfront: certUp, annual: certAnn },
    },
    annualSubsidyPerHa: useSubsidies ? subsidy.perHaAnnual : 0,
    yieldImpact: yieldImpact / 100,
    discountRate: discountRate / 100,
  }), [area, carbonPpHpY, carbonPrice, years, cc, cct, ntd, lab, ss, certUp, certAnn, useSubsidies, subsidy.perHaAnnual, yieldImpact, discountRate]);

  // Break-even chart data
  const chartData = model.rows.map(r => ({
    year: r.year,
    cumulativeNet: r.cumulativeNet,
    carbonRevenue: r.carbonRevenue,
    subsidyRevenue: r.subsidyRevenue,
    totalCost: -r.totalCost,
  }));

  // Investment comparison — $1 invested today
  const investmentComparison = INVESTMENT_BENCHMARKS.map(b => {
    if (b.type === 'project') {
      const projectIRR = model.irr != null ? model.irr / 100 : 0;
      const fv = Math.pow(1 + projectIRR, years);
      return { ...b, fv: parseFloat(fv.toFixed(2)), irrPct: model.irr };
    }
    const fv = Math.pow(1 + b.rate, years);
    return { ...b, fv: parseFloat(fv.toFixed(2)), irrPct: parseFloat((b.rate * 100).toFixed(1)) };
  });

  return (
    <div style={{ minHeight: '100vh', background: '#FEFDF9', fontFamily: 'Inter, sans-serif' }}>
      {/* Grain overlay */}
      <div style={{ position: 'fixed', inset: 0, zIndex: 9999, pointerEvents: 'none', opacity: 0.018,
        backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.78' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='300' height='300' filter='url(%23n)' opacity='1'/%3E%3C/svg%3E")`,
        backgroundSize: '300px 300px' }} />

      {/* ── Navigation ── */}
      <nav style={{
        position: 'sticky', top: 0, zIndex: 100,
        background: 'rgba(254,253,249,0.96)', backdropFilter: 'blur(20px)',
        borderBottom: '1px solid rgba(21,128,61,0.10)',
        padding: '14px clamp(16px,4vw,48px)',
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <Link to="/" style={{
            fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700,
            color: G['700'], textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px',
            padding: '7px 14px', border: `1px solid ${G['700']}30`, borderRadius: '8px',
            background: G['100'],
          }}>
            ← Back to Calculator
          </Link>
          <div style={{ display: 'none', flexDirection: 'column' }} className="nav-brand-desk">
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, color: F.head, lineHeight: 1 }}>AgriCarbon</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.1em', textTransform: 'uppercase' }}>Full ROI Financial Model</span>
          </div>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <span style={{
            fontFamily: 'Cormorant Garamond, serif', fontSize: '20px', fontWeight: 700, color: F.head,
          }}>AgriCarbon</span>
          <span style={{
            fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: G['500'],
            letterSpacing: '0.12em', textTransform: 'uppercase',
            padding: '3px 8px', background: G['100'], borderRadius: '5px',
          }}>ROI Model</span>
        </div>
      </nav>

      {/* ── Page content ── */}
      <main style={{ maxWidth: '1100px', margin: '0 auto', padding: 'clamp(20px,4vw,48px) clamp(16px,4vw,48px) 60px' }}>

        {/* Page header */}
        <div style={{
          ...PANEL,
          borderTop: `4px solid ${G['700']}`,
          background: 'linear-gradient(135deg, rgba(254,253,249,0.99) 0%, rgba(240,253,244,0.96) 100%)',
          marginBottom: '28px',
        }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: G['500'], letterSpacing: '0.14em', textTransform: 'uppercase', margin: '0 0 8px' }}>
            Bedrock Lab · Full Financial Model
          </p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(26px,4vw,52px)', fontWeight: 700, color: F.head, margin: '0 0 12px', lineHeight: 1.05, letterSpacing: '-0.03em' }}>
            Carbon Farming ROI Calculator
          </h1>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: 'clamp(13px,1.3vw,15px)', color: F.muted, margin: 0, maxWidth: '680px', lineHeight: 1.7 }}>
            Full financial model including implementation costs, government subsidies (EQIP, CSP, state programs), NPV, IRR, payback period, and comparison against alternative investments. All calculations run locally — no data is sent anywhere.
          </p>

          <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginTop: '16px' }}>
            {[['NPV', 'Net Present Value'], ['IRR', 'Internal Rate of Return'], ['EQIP', 'Federal Cost-Share'], ['CSP', 'Stewardship Program']].map(([v, l]) => (
              <div key={v} style={{
                padding: '7px 14px', background: G['100'],
                border: `1px solid ${G['300']}40`, borderRadius: '10px', textAlign: 'center',
              }}>
                <div style={{ fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', fontSize: '12px', fontWeight: 600, color: G['700'] }}>{v}</div>
                <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: G['500'], letterSpacing: '0.04em' }}>{l}</div>
              </div>
            ))}
          </div>
        </div>

        {/* ── Feature summary ── */}
        <div style={{
          background: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 60%, #F5F3FF 100%)',
          border: '1px solid rgba(124,58,237,0.15)',
          borderRadius: '16px', padding: '22px 26px', marginBottom: '24px',
          display: 'flex', gap: '20px', alignItems: 'flex-start', flexWrap: 'wrap',
        }}>
          <div style={{ fontSize: '28px', flexShrink: 0, marginTop: '2px' }}>💹</div>
          <div style={{ flex: 1, minWidth: '240px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: '#5B21B6', margin: '0 0 6px' }}>What this tool does</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: '#3B1F6B', margin: '0 0 12px', lineHeight: 1.7 }}>
              Enter your farm size, projected carbon rate, and credit price — the model builds a full <strong>10-year cashflow projection</strong> accounting for cover-crop seed, no-till drill, labour savings, soil sampling, and MRV certification costs. It then checks your eligibility for <strong>USDA EQIP and CSP cost-share</strong> across 15 states, calculates your project's <strong>NPV, IRR, and break-even year</strong>, and benchmarks your return against the S&P 500, US Treasuries, and REITs so you can see exactly where carbon farming stands as an investment.
            </p>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
              {[
                ['10-year cashflow', '#7c3aed'],
                ['NPV & IRR', '#7c3aed'],
                ['EQIP / CSP subsidies — 15 states', '#5B21B6'],
                ['vs S&P 500 · Bonds · REITs', '#5B21B6'],
              ].map(([txt, c]) => (
                <span key={txt} style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: c, background: `${c}14`, border: `1px solid ${c}30`, padding: '4px 10px', borderRadius: '20px' }}>{txt}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── Step guide strip ── */}
        <div style={{
          display: 'flex', gap: '0', marginBottom: '22px',
          borderRadius: '14px', overflow: 'hidden',
          border: '1px solid rgba(21,82,51,0.12)',
          boxShadow: '0 2px 12px rgba(3,12,6,0.06)',
        }}>
          {[
            { n: '1', label: 'Farm Profile', desc: 'Area · carbon rate · credit price · time horizon', color: G['700'] },
            { n: '2', label: 'Implementation Costs', desc: 'Seed · equipment · labour · MRV certification', color: G['600'] },
            { n: '3', label: 'Subsidies & Results', desc: 'EQIP/CSP eligibility · NPV · IRR · comparison', color: '#7c3aed' },
          ].map((s, i, arr) => (
            <div key={s.n} style={{
              flex: 1, padding: '14px 18px',
              background: i === 0 ? 'linear-gradient(135deg,#F0FDF4,#DCFCE7)' : i === 1 ? '#FEFDF9' : 'linear-gradient(135deg,#F5F3FF,#EDE9FE)',
              borderRight: i < arr.length - 1 ? '1px solid rgba(21,82,51,0.1)' : 'none',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                <div style={{ width: '22px', height: '22px', borderRadius: '50%', background: s.color, color: '#FEFDF9', fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '11px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontVariantNumeric: 'tabular-nums' }}>{s.n}</div>
                <span style={{ fontFamily: 'Inter, sans-serif', fontWeight: 700, fontSize: '12px', color: s.color, letterSpacing: '-0.01em' }}>{s.label}</span>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted, margin: 0, lineHeight: 1.5, paddingLeft: '30px' }}>{s.desc}</p>
            </div>
          ))}
        </div>

        {/* ── Two-column layout: inputs left, results right ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))', gap: '20px', alignItems: 'start' }}>

          {/* ════ LEFT COLUMN — Inputs ════ */}
          <div>

            {/* Farm Profile */}
            <div style={{ ...PANEL, borderLeft: `3px solid ${G['700']}` }}>
              <SectionHeading eyebrow="Step 1" title="Farm Profile" desc="Enter your farm's carbon sequestration results from the main calculator, or adjust manually." />
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Fld label="Farm Area (ha)">
                  <input type="number" min="0.1" step="0.1" style={INP} value={area} onChange={e => setArea(parseFloat(e.target.value) || 1)} />
                </Fld>
                <Fld label="Time Horizon (years)">
                  <input type="number" min="1" max="20" step="1" style={INP} value={years} onChange={e => setYears(parseInt(e.target.value) || 10)} />
                </Fld>
                <Fld label="CO₂e Rate (t/ha/yr)">
                  <input type="number" min="0" step="0.01" style={INP} value={carbonPpHpY} onChange={e => setCarbonPpHpY(parseFloat(e.target.value) || 0)}
                    placeholder="From main calculator" />
                </Fld>
                <Fld label="Carbon Price (USD/t)">
                  <input type="number" min="0" step="1" style={INP} value={carbonPrice} onChange={e => setCarbonPrice(parseFloat(e.target.value) || 0)} />
                </Fld>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                <Fld label="Discount Rate (%)">
                  <select style={INP} value={discountRate} onChange={e => setDiscountRate(parseFloat(e.target.value))}>
                    <option value="4">4% — Conservative / bonds</option>
                    <option value="7">7% — Typical farm investment</option>
                    <option value="10">10% — Venture / equity rate</option>
                    <option value="12">12% — High-hurdle</option>
                  </select>
                </Fld>
                <Fld label="Yield Improvement Bonus (%)">
                  <select style={INP} value={yieldImpact} onChange={e => setYieldImpact(parseFloat(e.target.value))}>
                    <option value="0">0% — No yield benefit modeled</option>
                    <option value="2">2% — Conservative soil health gain</option>
                    <option value="3">3% — Moderate no-till benefit</option>
                    <option value="5">5% — Strong dryland improvement</option>
                    <option value="-2">-2% — Short-term yield drag (transition)</option>
                  </select>
                </Fld>
              </div>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0', lineHeight: 1.6 }}>
                CO₂e rate and carbon price from the main calculator. The yield bonus is a fraction of carbon revenue added to model agronomic co-benefits (Poeplau & Don 2015, Pittelkow et al. 2015).
              </p>
            </div>

            {/* Implementation Costs */}
            <div style={{ ...PANEL, borderLeft: `3px solid ${T['500']}` }}>
              <SectionHeading eyebrow="Step 2" title="Implementation Costs" desc="Default values are US national typical ranges (USDA ERS, 2024). Edit to match your actual costs." />

              <div style={{ marginBottom: '16px', padding: '12px 14px', background: 'rgba(196,105,74,0.05)', border: `1px solid ${T['500']}25`, borderRadius: '10px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: T['700'], margin: '0 0 6px' }}>Per-hectare annual costs (USD/ha/yr)</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0, lineHeight: 1.5 }}>Enter 0 for any practice you won't adopt. Negative values = savings (e.g. fewer tillage passes reduces fuel cost).</p>
              </div>

              {[
                ['Cover Crop Seed + Inoculation', cc, setCC, '$15–35/ha/yr · Multi-species mix higher end'],
                ['Cover Crop Termination', cct, setCCT, '$8–18/ha/yr · Herbicide or roller-crimper'],
                ['No-Till Drill (custom hire / amortized)', ntd, setNTD, '$6–20/ha/yr · Own equipment lower; custom hire higher'],
                ['Labor Adjustment', lab, setLab, 'Negative = savings. No-till saves ~$10–15/ha on fuel+labor'],
                ['Soil Sampling (amortized over 5 yr)', ss, setSS, '$8–18/ha per event ÷ 5 = annual cost'],
              ].map(([label, val, setter, hint]) => (
                <Fld key={label} label={label}>
                  <input type="number" step="1" style={{ ...INP, borderColor: val < 0 ? G['500'] : '#DDD5C4' }} value={val} onChange={e => setter(parseFloat(e.target.value) || 0)} />
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '4px 0 0', lineHeight: 1.4 }}>{hint}</p>
                </Fld>
              ))}

              <div style={{ borderTop: '1px solid #EDE7DA', paddingTop: '14px', marginTop: '4px' }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: F.muted, margin: '0 0 12px' }}>Certification Costs (MRV)</p>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
                  <Fld label="Up-front Validation ($)">
                    <input type="number" min="0" step="500" style={INP} value={certUp} onChange={e => setCertUp(parseFloat(e.target.value) || 0)} />
                  </Fld>
                  <Fld label="Annual MRV Cost ($/yr)">
                    <input type="number" min="0" step="100" style={INP} value={certAnn} onChange={e => setCertAnn(parseFloat(e.target.value) || 0)} />
                  </Fld>
                </div>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0, lineHeight: 1.5 }}>
                  Typical Verra VCS Tier 1 small project: $10k–15k up-front, $2k–3k/yr MRV. Gold Standard: $20k–40k up-front. Set both to $0 if not pursuing credit certification.
                </p>
              </div>
            </div>

            {/* Government Subsidy Checker */}
            <div style={{ ...PANEL, borderLeft: `3px solid ${Au['500']}` }}>
              <SectionHeading
                eyebrow="Step 3 — Optional"
                title="Government Subsidy Checker"
                desc="Estimate USDA EQIP, Conservation Stewardship Program (CSP), and state-level annual payments based on your location and practices."
              />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.body, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={useSubsidies} onChange={e => setUseSubsidies(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: G['700'] }} />
                  Include subsidies in financial model
                </label>
                <label style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.body, display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                  <input type="checkbox" checked={beginner} onChange={e => setBeginner(e.target.checked)}
                    style={{ width: '16px', height: '16px', accentColor: G['700'] }} />
                  Beginning/Socially Disadvantaged Farmer (+50% EQIP)
                </label>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
                <Fld label="State">
                  <select style={INP} value={state} onChange={e => setState(e.target.value)}>
                    {US_STATES.map(([code, name]) => <option key={code} value={code}>{name}</option>)}
                  </select>
                </Fld>
              </div>

              <label style={{ ...LBL, marginBottom: '10px' }}>Conservation Practices (select all that apply)</label>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(175px,1fr))', gap: '6px', marginBottom: '16px' }}>
                {PRACTICE_OPTIONS.map(p => (
                  <label key={p.key} style={{
                    display: 'flex', alignItems: 'center', gap: '8px',
                    padding: '8px 12px', borderRadius: '8px', cursor: 'pointer',
                    background: practices.includes(p.key) ? G['100'] : '#F7F2E8',
                    border: `1px solid ${practices.includes(p.key) ? G['300'] : '#DDD5C4'}`,
                    fontFamily: 'Inter, sans-serif', fontSize: '11px', color: practices.includes(p.key) ? G['700'] : F.body,
                    fontWeight: practices.includes(p.key) ? 700 : 400,
                    transition: 'all 0.15s',
                  }}>
                    <input type="checkbox" checked={practices.includes(p.key)} onChange={() => togglePractice(p.key)}
                      style={{ width: '14px', height: '14px', accentColor: G['700'] }} />
                    {p.label}
                  </label>
                ))}
              </div>

              {/* Subsidy summary */}
              <div style={{ ...CARD, borderTop: `3px solid ${Au['500']}` }}>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: F.head, margin: '0 0 10px' }}>
                  Estimated Annual Subsidy — {subsidy.stateLabel}
                </p>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '8px', marginBottom: '12px' }}>
                  {[
                    ['USDA EQIP', `$${subsidy.eqip.annual.toLocaleString()}`, 'FY2025 Schedule'],
                    ['USDA CSP', `$${subsidy.csp.annual.toLocaleString()}`, '5-yr contract'],
                    [subsidy.stateLabel + ' State', `$${subsidy.state.annual.toLocaleString()}`, 'Local programs'],
                  ].map(([prog, val, note]) => (
                    <div key={prog} style={{ textAlign: 'center', padding: '10px', background: '#FEFDF9', borderRadius: '8px', border: '1px solid #EDE7DA' }}>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, color: Au['500'] }}>{val}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, marginTop: '2px' }}>{prog}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, fontStyle: 'italic' }}>{note}</div>
                    </div>
                  ))}
                </div>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: Au['500'] + '12', border: `1px solid ${Au['500']}30`, borderRadius: '8px' }}>
                  <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: Au['700'] }}>
                    Total Annual Subsidy
                  </span>
                  <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 700, color: Au['500'] }}>
                    ${subsidy.totalAnnual.toLocaleString()} <span style={{ fontSize: '13px', fontFamily: 'Inter, sans-serif', fontWeight: 400, color: Au['700'] }}>/yr</span>
                  </span>
                </div>

                <div style={{ marginTop: '10px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '6px' }}>
                  <div style={{ padding: '8px 10px', background: '#FEFDF9', borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted }}>
                    <span style={{ fontWeight: 700, color: F.head }}>${subsidy.perHaAnnual}</span> per hectare per year
                  </div>
                  <div style={{ padding: '8px 10px', background: '#FEFDF9', borderRadius: '6px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted }}>
                    <span style={{ fontWeight: 700, color: F.head }}>{subsidy.areaAc} acres</span> enrolled
                  </div>
                </div>

                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '10px 0 0', lineHeight: 1.6 }}>
                  <strong>Disclaimer:</strong> These are indicative payment estimates based on national average NRCS payment schedules and publicly reported state program rates. Actual payments vary by county, practice ranking, and available funding. Contact your{' '}
                  <a href="https://www.nrcs.usda.gov/contact/find-a-service-center" target="_blank" rel="noopener noreferrer" style={{ color: G['700'] }}>local NRCS service center</a>{' '}
                  for current rates. EQIP and CSP cannot be combined for the same practice and same acres simultaneously.
                </p>

                {/* EQIP / CSP quick-ref */}
                <div style={{ marginTop: '14px', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {[
                    { label: 'EQIP Max Payment', value: `$${(EQIP_META.maxPayment6yr / 1000).toFixed(0)}k / 6 yr`, note: EQIP_META.contractLength },
                    { label: 'CSP Contract Length', value: CSP_META.contractLength, note: `Max $${(CSP_META.maxAnnualPayment / 1000).toFixed(0)}k/yr` },
                  ].map(item => (
                    <div key={item.label} style={{ padding: '9px 11px', background: '#F7F2E8', borderRadius: '8px', borderLeft: `2px solid ${Au['500']}` }}>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '3px' }}>{item.label}</div>
                      <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 700, color: F.head }}>{item.value}</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted }}>{item.note}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* ════ RIGHT COLUMN — Results ════ */}
          <div>

            {/* ── KPI Summary ── */}
            <div style={{ ...PANEL, borderTop: `4px solid ${G['700']}`, background: 'linear-gradient(135deg,rgba(254,253,249,0.99),rgba(240,253,244,0.97))' }}>
              <SectionHeading eyebrow="Results" title={`${years}-Year Financial Summary`} />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(130px,1fr))', gap: '10px', marginBottom: '10px' }}>
                <KpiCard
                  label="Net Present Value"
                  value={`${model.npv >= 0 ? '+' : ''}$${Math.abs(model.npv).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  unit="USD"
                  accent={model.npv >= 0 ? G['700'] : T['500']}
                  sub={`@${discountRate}% discount`}
                />
                <KpiCard
                  label="Internal Rate of Return"
                  value={model.irr != null ? `${model.irr.toFixed(1)}%` : 'N/A'}
                  unit="annualized"
                  accent={model.irr != null && model.irr > 0 ? G['500'] : T['500']}
                  sub={model.irr != null && model.irr > discountRate ? '> hurdle rate ✓' : '< hurdle rate'}
                />
                <KpiCard
                  label="Break-even / Payback"
                  value={model.paybackYear != null ? `Year ${model.paybackYear}` : 'Not reached'}
                  unit="first positive cumulative"
                  accent={model.paybackYear != null ? Au['500'] : T['500']}
                />
                <KpiCard
                  label="Total Net Profit"
                  value={`${model.totalNet >= 0 ? '+' : ''}$${Math.abs(model.totalNet).toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                  unit="gross – costs"
                  accent={model.totalNet >= 0 ? G['700'] : T['700']}
                />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3,1fr)', gap: '8px' }}>
                {[
                  ['Gross Revenue', `$${model.totalGrossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, G['700']],
                  ['Total Costs', `$${model.totalCosts.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, T['500']],
                  ['Subsidy Included', useSubsidies ? `$${(subsidy.totalAnnual * years).toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '$0', Au['500']],
                ].map(([label, val, col]) => (
                  <div key={label} style={{ ...CARD, textAlign: 'center', padding: '10px' }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '4px' }}>{label}</div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '17px', fontWeight: 700, color: col }}>{val}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* ── Break-Even Chart ── */}
            <div style={{ ...PANEL, borderTop: `3px solid ${G['500']}` }}>
              <SectionHeading
                eyebrow="Break-Even Analysis"
                title="Cumulative Net Cashflow"
                desc={`The line crossing zero is your payback point. ${model.paybackYear != null ? `Your project breaks even in Year ${model.paybackYear}.` : 'Adjust inputs above to find a break-even scenario.'}`}
              />
              <ResponsiveContainer width="100%" height={220}>
                <AreaChart data={chartData} margin={{ top: 4, right: 12, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor={G['700']} stopOpacity={0.15} />
                      <stop offset="95%" stopColor={G['700']} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DA" />
                  <XAxis dataKey="year" tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} label={{ value: 'Year', position: 'insideBottomRight', offset: -4, fill: F.faint, fontSize: 10 }} />
                  <YAxis tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} width={60} tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip content={<ChartTip />} />
                  <ReferenceLine y={0} stroke={Au['500']} strokeWidth={1.5} strokeDasharray="5 3" label={{ value: 'Break-even', position: 'insideTopRight', fill: Au['700'], fontSize: 10, fontFamily: 'Inter, sans-serif' }} />
                  <Area type="monotone" dataKey="cumulativeNet" stroke={model.totalNet >= 0 ? G['700'] : T['500']} strokeWidth={2.5} fill="url(#netGrad)" dot={false} name="Cumulative Net" />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            {/* ── Annual Revenue vs Cost Waterfall ── */}
            <div style={{ ...PANEL, borderTop: `3px solid ${Au['500']}` }}>
              <SectionHeading eyebrow="Annual Breakdown" title="Revenue vs. Cost by Year" />
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={model.rows.filter(r => r.year > 0)} margin={{ top: 4, right: 12, left: 0, bottom: 0 }} barSize={12}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DA" />
                  <XAxis dataKey="year" tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} />
                  <YAxis tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} width={55} tickFormatter={v => `$${Math.abs(v) >= 1000 ? (v / 1000).toFixed(0) + 'k' : v}`} />
                  <Tooltip content={<ChartTip />} />
                  <Legend wrapperStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '10px' }} />
                  <Bar dataKey="carbonRevenue" name="Carbon Revenue" fill={G['700']} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="subsidyRevenue" name="Subsidy" fill={Au['500']} radius={[3, 3, 0, 0]} />
                  <Bar dataKey="totalCost" name="Costs (neg.)" fill={T['500']} radius={[0, 0, 3, 3]} />
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* ── Year-by-Year Table ── */}
            <div style={{ ...PANEL, borderTop: `3px solid ${G['500']}` }}>
              <SectionHeading eyebrow="Detailed Cashflow" title="Year-by-Year Financial Model" />
              <div style={{ overflowX: 'auto', borderRadius: '10px', border: '1px solid #DDD5C4', maxHeight: '340px', overflowY: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
                  <thead style={{ background: '#F7F2E8', position: 'sticky', top: 0, zIndex: 5 }}>
                    <tr>
                      {['Year', 'Carbon $', 'Subsidy $', 'Costs $', 'Net CF', 'Cumulative'].map(h => (
                        <th key={h} style={{ padding: '9px 10px', textAlign: 'right', fontSize: '10px', fontWeight: 700, color: F.muted, letterSpacing: '0.06em', textTransform: 'uppercase', borderBottom: '1px solid #DDD5C4', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {model.rows.map((r, i) => {
                      const isBE = r.year === model.paybackYear;
                      return (
                        <tr key={r.year} style={{ background: isBE ? G['100'] : (i % 2 === 0 ? '#FEFDF9' : 'transparent'), borderLeft: isBE ? `3px solid ${G['700']}` : 'none' }}>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: F.body, fontWeight: 700 }}>
                            {r.year === 0 ? 'Year 0' : `Yr ${r.year}`}{isBE ? ' ←' : ''}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: G['700'], fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                            {r.year === 0 ? '—' : `$${r.carbonRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: Au['500'], fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                            {r.year === 0 ? '—' : `$${r.subsidyRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: T['500'], fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                            ${r.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: r.netCashflow >= 0 ? G['700'] : T['700'], fontWeight: 600, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                            {r.netCashflow >= 0 ? '+' : ''}${r.netCashflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                          <td style={{ padding: '7px 10px', textAlign: 'right', color: r.cumulativeNet >= 0 ? G['700'] : T['700'], fontWeight: 700, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums' }}>
                            {r.cumulativeNet >= 0 ? '+' : ''}${r.cumulativeNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* ── Investment Comparison ── */}
            <div style={{ ...PANEL, borderTop: `3px solid #1e40af` }}>
              <SectionHeading
                eyebrow="Alternative Investment Comparison"
                title={`$1 Invested Today — Future Value at Year ${years}`}
                desc="Compares the future value of $1 invested in this carbon farming project vs. conventional investments, based on IRR vs. average historical returns."
              />
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(150px,1fr))', gap: '10px', marginBottom: '14px' }}>
                {investmentComparison.map(b => (
                  <div key={b.label} style={{
                    ...CARD,
                    textAlign: 'center',
                    borderTop: `3px solid ${b.color}`,
                    background: b.type === 'project' ? `${G['700']}08` : '#F7F2E8',
                    outline: b.type === 'project' ? `2px solid ${G['700']}25` : 'none',
                  }}>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, letterSpacing: '0.07em', textTransform: 'uppercase', marginBottom: '5px' }}>
                      {b.label}
                    </div>
                    <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(18px,2vw,24px)', fontWeight: 700, color: b.color }}>
                      ${b.fv.toFixed(2)}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '3px' }}>
                      {b.irrPct != null ? `${b.irrPct}% / yr` : 'No IRR'}
                    </div>
                    {b.type === 'project' && (
                      <div style={{ marginTop: '6px', fontFamily: 'Inter, sans-serif', fontSize: '9px', color: G['700'], fontWeight: 700, padding: '2px 6px', background: G['100'], borderRadius: '4px' }}>
                        This Project
                      </div>
                    )}
                  </div>
                ))}
              </div>

              {/* IRR bar chart */}
              <ResponsiveContainer width="100%" height={150}>
                <BarChart data={investmentComparison} layout="vertical" margin={{ top: 0, right: 30, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DA" horizontal={false} />
                  <XAxis type="number" tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} tickFormatter={v => `${v}%`} />
                  <YAxis type="category" dataKey="label" tick={{ fill: F.body, fontSize: 10, fontFamily: 'Inter, sans-serif' }} width={130} />
                  <Tooltip formatter={v => [`${typeof v === 'number' ? v.toFixed(1) : v}%`, 'Annual Return']} contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', borderRadius: '8px' }} />
                  <Bar dataKey="irrPct" name="Annual Return %" radius={[0, 4, 4, 0]}
                    fill={G['700']}
                    label={{ position: 'right', fill: F.muted, fontSize: 10, fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums', formatter: v => `${v}%` }} />
                </BarChart>
              </ResponsiveContainer>

              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '10px 0 0', lineHeight: 1.6 }}>
                S&P 500: ~10.3% avg annualized 1990–2024 (Damodaran NYU). 10-yr Treasury: 4.5% current yield. REITs: NAREIT 8.2% avg. Farm loans: USDA FSA 5.5%. Carbon farming IRR is your computed value; past performance of benchmarks does not guarantee future returns.
              </p>
            </div>

            {/* ── Methodology note ── */}
            <div style={{
              padding: '14px 18px',
              background: '#F7F2E8',
              border: '1px solid #DDD5C4',
              borderLeft: `3px solid ${Au['500']}`,
              borderRadius: '12px',
              fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, lineHeight: 1.7,
            }}>
              <strong style={{ color: Au['700'] }}>Methodology & Disclaimers:</strong>{' '}
              NPV calculated using standard discounted cashflow (DCF) analysis. IRR solved via Newton-Raphson iteration. All costs are indicative national averages (USDA ERS, NRCS FY2025 payment schedules). Subsidy payments are estimates — actual eligibility and amounts vary by county, practice ranking, and annual NRCS funding allocation. Carbon sequestration rate from IPCC Tier 1 screening (main calculator). This model is for planning purposes only; consult a certified agronomist, CPA, and your local NRCS office before making farm investment decisions.
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
