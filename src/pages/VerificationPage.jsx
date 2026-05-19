import { useState } from 'react';

// ─── Design tokens ────────────────────────────────────────────────
const F = { head: '#030C06', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };
const G = { 700: '#155233', 600: '#166534', 400: '#22C55E', 100: '#DCFCE7' };

// ─── Carbon Protocols (Verra/Gold Standard/CAR/Nori/ERF/Plan Vivo) ─
const PROTOCOLS = [
  {
    id: 'verra_vm0042', name: 'Verra VM0042', org: 'Verra (VCS)',
    geo: 'Global', minArea: 10, baselinePeriod: 3, creditingPeriod: 20,
    projectTypes: ['Cropland', 'Grassland', 'Agroforestry'],
    bufferPct: 20, avgPrice: 12.40, priceRange: '$8–$25',
    costs: '$3–8/tCO₂e', registrationCost: '$0.10/tCO₂e',
    demandLevel: 'High', color: '#155233',
    highlights: ['ISO 17025 accredited lab required', 'Georeferenced sampling points', '20% buffer pool permanence deduction'],
  },
  {
    id: 'gold_standard', name: 'Gold Standard', org: 'Gold Standard Foundation',
    geo: 'Global', minArea: 5, baselinePeriod: 5, creditingPeriod: 25,
    projectTypes: ['Cropland', 'Grassland', 'Integrated systems'],
    bufferPct: 15, avgPrice: 18.20, priceRange: '$12–$35',
    costs: '$5–12/tCO₂e', registrationCost: '$1,000 + $0.15/tCO₂e',
    demandLevel: 'Very High', color: '#CA8A04',
    highlights: ['SDG co-benefit documentation required', 'Gender & stakeholder assessment', 'Commands premium prices from corporate buyers'],
  },
  {
    id: 'car_soil', name: 'Climate Action Reserve', org: 'CAR (USA only)',
    geo: 'United States', minArea: 16, baselinePeriod: 3, creditingPeriod: 10,
    projectTypes: ['Cropland with cover crops', 'Reduced tillage'],
    bufferPct: 10, avgPrice: 15.50, priceRange: '$10–$22',
    costs: '$2–5/tCO₂e', registrationCost: '$500 flat fee',
    demandLevel: 'Medium', color: '#0891b2',
    highlights: ['USDA farm records sufficient', 'NRCS soil sampling standards', 'Simplified leakage assessment'],
  },
  {
    id: 'nori', name: 'Nori Croplands', org: 'Nori',
    geo: 'United States', minArea: 0, baselinePeriod: 0, creditingPeriod: 10,
    projectTypes: ['Row crops', 'Cover crops', 'Reduced tillage'],
    bufferPct: 0, avgPrice: 15.00, priceRange: '$15 fixed price',
    costs: '$15/tCO₂e (all-in)', registrationCost: 'Free',
    demandLevel: 'High', color: '#7c3aed',
    highlights: ['Model-based — no soil sampling required', 'Practice adoption must be after 2019', 'Automated verification (no audit fees)'],
  },
  {
    id: 'australia_erf', name: 'Australia ERF', org: 'Clean Energy Regulator',
    geo: 'Australia', minArea: 100, baselinePeriod: 0, creditingPeriod: 25,
    projectTypes: ['Grazing land', 'Cropland', 'Mixed farming'],
    bufferPct: 5, avgPrice: 35.00, priceRange: 'AUD $30–$40',
    costs: 'AUD $8–15/tCO₂e', registrationCost: 'AUD $1,000',
    demandLevel: 'High (govt buyer)', color: '#C4694A',
    highlights: ['Government-backed buyer — stable long-term demand', 'Min. 9 soil samples per carbon estimation area', 'NATA-accredited laboratory required'],
  },
  {
    id: 'plan_vivo', name: 'Plan Vivo', org: 'Plan Vivo Foundation',
    geo: 'Global (developing countries)', minArea: 0, baselinePeriod: 1, creditingPeriod: 20,
    projectTypes: ['Agroforestry', 'Smallholder agriculture', 'Community forestry'],
    bufferPct: 20, avgPrice: 14.50, priceRange: '$10–$22',
    costs: '$4–10/tCO₂e', registrationCost: '$2,000',
    demandLevel: 'Medium-High', color: '#4B6357',
    highlights: ['Designed for smallholders and community projects', 'Participatory monitoring acceptable', 'Strong SDG/biodiversity co-benefit recognition'],
  },
];

// ─── MRV Checklist items ──────────────────────────────────────────
const MRV_ITEMS = [
  { id: 'baseline_protocol',  cat: 'Baseline',     label: 'Baseline soil sampling protocol defined',         imp: 'critical', time: '2–4 hrs',      tip: 'Follow ISO 10381 or NRCS guidelines. Include site pre-assessment and depth increments (0–30 cm minimum for all protocols).' },
  { id: 'gps_coords',         cat: 'Spatial',      label: 'GPS coordinates (±3 m) for all sampling points',  imp: 'critical', time: '1–2 hrs field', tip: 'Use WAAS-corrected GPS or a high-accuracy smartphone app. Record in decimal degrees format. Re-visit exact points each monitoring cycle.' },
  { id: 'sampling_depth',     cat: 'Methodology',  label: 'Sampling depth standardized — 0–30 cm minimum',   imp: 'critical', time: '30 min/point',  tip: 'Use a depth-marked soil probe. Consider splitting 0–30 cm and 30–100 cm for a comprehensive assessment acceptable to all major protocols.' },
  { id: 'lab_method',         cat: 'Laboratory',   label: 'ISO 17025 accredited laboratory identified',       imp: 'critical', time: '2–3 wk lead',  tip: 'Dry combustion (Dumas method) is the gold standard, required by Verra and Gold Standard. LOI is acceptable only for initial screening.' },
  { id: 'chain_custody',      cat: 'QA',           label: 'Chain-of-custody documentation ready',            imp: 'high',     time: '1 hr/event',   tip: 'Document sample collection date, collector name, storage conditions, transport method, and laboratory receipt confirmation.' },
  { id: 'historical_records', cat: 'Baseline',     label: 'Historical land-use records available (5+ years)',imp: 'critical', time: '4–8 hrs',      tip: 'Include crop rotation history, tillage records, fertilizer and pesticide applications, cover crop use, and any grazing records.' },
  { id: 'additionality',      cat: 'Eligibility',  label: 'Additionality demonstrated',                      imp: 'critical', time: '8–16 hrs',     tip: "Choose between investment analysis, barrier analysis, or common-practice assessment depending on your chosen protocol's requirements." },
  { id: 'permanence',         cat: 'Commitment',   label: 'Permanence commitment secured (20+ years)',        imp: 'critical', time: 'Legal review',  tip: 'Confirm land tenure, succession planning, and contractual obligations covering the full crediting period. Most require 20–25 years.' },
  { id: 'leakage',            cat: 'Boundary',     label: 'Leakage assessment completed',                    imp: 'high',     time: '2–4 hrs',      tip: 'Assess activity shifting (moving emissions to another location) and market effects from any yield changes caused by practice change.' },
  { id: 'stakeholder',        cat: 'Social',       label: 'Stakeholder consultation conducted',              imp: 'medium',   time: '1–2 days',     tip: 'Required for Gold Standard and Plan Vivo. Document meetings, concerns raised, and how each was addressed.' },
  { id: 'monitoring_plan',    cat: 'Monitoring',   label: 'Monitoring plan established',                     imp: 'critical', time: '4–8 hrs',      tip: 'Define monitoring frequency, parameters tracked, responsible parties, and data management procedures for the full crediting period.' },
  { id: 'data_management',    cat: 'Documentation',label: 'Secure long-term data management system in place',imp: 'high',     time: '2–4 hrs setup',tip: 'Use cloud storage with automated backup and version control. Plan for 25+ year record retention — longer than most verification periods.' },
];

const IMP_COLOR = { critical: '#C4694A', high: '#CA8A04', medium: '#0891b2' };

// ─── Timeline phases ──────────────────────────────────────────────
const PHASES = [
  { label: 'Preparation',              dur: '2–4 months',  tasks: ['Complete MRV checklist', 'Gather historical records', 'Define project boundary', 'Select carbon protocol'] },
  { label: 'Baseline Assessment',      dur: '1–2 months',  tasks: ['Conduct baseline soil sampling', 'ISO 17025 laboratory analysis', 'Calculate baseline carbon stocks', 'Document current practices'] },
  { label: 'Project Design',           dur: '1–3 months',  tasks: ['Draft Project Design Document (PDD)', 'Demonstrate additionality', 'Create monitoring plan', 'Stakeholder consultation'] },
  { label: 'Validation',               dur: '2–4 months',  tasks: ['Select Validation/Verification Body (VVB)', 'Submit documentation for review', 'Address corrective action requests', 'Receive validation statement'] },
  { label: 'Implementation & Monitoring', dur: 'Ongoing', tasks: ['Implement improved practices', 'Monitor per protocol schedule', 'Annual reporting to registry', 'Periodic re-verification (3–5 yrs)'] },
  { label: 'Credit Issuance',          dur: '1–2 months',  tasks: ['Third-party verification of results', 'Credit calculation and issuance request', 'Registry account setup', 'Credits issued and tradeable'] },
];

// ─── Protocol eligibility logic ───────────────────────────────────
function checkEligibility(p, farm) {
  const geoOk = p.geo === 'Global' || p.geo === 'Global (developing countries)'
    || (p.geo === 'United States' && farm.country === 'US')
    || (p.geo === 'Australia'     && farm.country === 'AU');
  if (!geoOk) return 'ineligible';
  if (farm.area < p.minArea || farm.records < p.baselinePeriod) return 'partial';
  return 'eligible';
}

function estimateCredits(p, farm) {
  const rate   = Number(farm.rate) || 2.0;
  const annual = rate * Number(farm.area) * (1 - p.bufferPct / 100);
  const total  = annual * p.creditingPeriod;
  const net    = total * (p.avgPrice - 5);
  return { annual: annual.toFixed(1), total: Math.round(total).toLocaleString(), netRevenue: Math.max(0, Math.round(net)).toLocaleString() };
}

// ─── Shared styles ────────────────────────────────────────────────
const S = {
  page:  { minHeight: '100vh', background: '#FEFDF9', fontFamily: 'Inter, sans-serif', paddingTop: '80px' },
  inner: { maxWidth: '1080px', margin: '0 auto', padding: 'clamp(24px,4vw,52px) clamp(16px,3vw,40px)' },
  label: { fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: G[700], display: 'block', marginBottom: '6px' },
  input: { width: '100%', padding: '9px 12px', border: '1.5px solid #DDD5C4', borderRadius: '8px', fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.head, background: '#FEFDF9', outline: 'none', boxSizing: 'border-box' },
  card:  { background: '#FEFDF9', border: '1px solid #DDD5C4', borderRadius: '14px', padding: '20px' },
};

function TabBtn({ active, onClick, children }) {
  return (
    <button onClick={onClick} style={{ padding: '10px 22px', border: 'none', borderBottom: active ? `3px solid ${G[700]}` : '3px solid transparent', background: 'transparent', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: active ? F.head : F.faint, cursor: 'pointer', whiteSpace: 'nowrap', transition: 'color 0.15s' }}>
      {children}
    </button>
  );
}

function StatusPill({ status }) {
  const cfg = { eligible: ['#DCFCE7', '#155233', 'Eligible ✓'], partial: ['#FEF3C7', '#92400E', 'Partial ⚠'], ineligible: ['#FEE2E2', '#991B1B', 'Ineligible ✕'] };
  const [bg, color, label] = cfg[status];
  return <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, background: bg, color, padding: '3px 10px', borderRadius: '20px', whiteSpace: 'nowrap' }}>{label}</span>;
}

// ─── Sub-components ───────────────────────────────────────────────
function ProtocolChecker() {
  const [farm, setFarm] = useState({ area: 50, country: 'US', type: 'Cropland', records: 3, rate: 2.0 });
  const set = (k, num = true) => e => setFarm(p => ({ ...p, [k]: num && !isNaN(+e.target.value) ? +e.target.value : e.target.value }));

  return (
    <div>
      {/* Inputs */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(170px, 1fr))', gap: '14px', background: '#F7F2E8', borderRadius: '14px', padding: '20px', marginBottom: '24px' }}>
        {[
          { label: 'Farm Area (ha)', key: 'area', type: 'number', min: 0 },
          { label: 'Sequestration Rate (tCO₂e/ha/yr)', key: 'rate', type: 'number', step: '0.1' },
          { label: 'Years of Records', key: 'records', type: 'number', min: 0 },
        ].map(({ label, key, ...rest }) => (
          <div key={key}>
            <label style={S.label}>{label}</label>
            <input value={farm[key]} onChange={set(key)} {...rest} style={S.input} />
          </div>
        ))}
        <div>
          <label style={S.label}>Country</label>
          <select value={farm.country} onChange={set('country', false)} style={S.input}>
            <option value="US">United States</option>
            <option value="AU">Australia</option>
            <option value="OTHER">Other / Global</option>
          </select>
        </div>
        <div>
          <label style={S.label}>Project Type</label>
          <select value={farm.type} onChange={set('type', false)} style={S.input}>
            <option>Cropland</option>
            <option>Grassland</option>
            <option>Agroforestry</option>
          </select>
        </div>
      </div>

      {/* Protocol cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(310px, 1fr))', gap: '14px' }}>
        {PROTOCOLS.map(p => {
          const status = checkEligibility(p, farm);
          const est    = estimateCredits(p, farm);
          return (
            <div key={p.id} style={{ ...S.card, borderTop: `3px solid ${p.color}`, padding: '18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px', gap: '8px' }}>
                <div>
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '19px', fontWeight: 700, color: F.head, margin: '0 0 2px', letterSpacing: '-0.02em' }}>{p.name}</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0 }}>{p.org} · {p.geo}</p>
                </div>
                <StatusPill status={status} />
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px', marginBottom: '14px' }}>
                {[
                  ['Market Demand', p.demandLevel],
                  ['Price Range', p.priceRange],
                  ['Registration Cost', p.registrationCost],
                  ['Total Project Cost', p.costs],
                  ['Est. Annual Credits', `${est.annual} tCO₂e`],
                  ['Est. Net Revenue', `$${est.netRevenue}`],
                ].map(([k, v]) => (
                  <div key={k}>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, margin: '0 0 1px', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{k}</p>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: F.body, margin: 0, fontVariantNumeric: 'tabular-nums' }}>{v}</p>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: '1px solid #EDE7DA', paddingTop: '10px' }}>
                {p.highlights.map(h => (
                  <p key={h} style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, margin: '3px 0', display: 'flex', gap: '6px', alignItems: 'flex-start' }}>
                    <span style={{ color: p.color, flexShrink: 0, marginTop: '1px' }}>›</span>{h}
                  </p>
                ))}
              </div>
            </div>
          );
        })}
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, marginTop: '16px', textAlign: 'center' }}>
        Sources: Verra VM0042 v1.0 · Gold Standard SOC v2.0 · CAR Soil Enrichment Protocol v1.1 · Nori Croplands v1.3 · Australia ERF v2.1 · Plan Vivo Standard v5.0
      </p>
    </div>
  );
}

function MRVChecklist() {
  const [checked,  setChecked]  = useState({});
  const [expanded, setExpanded] = useState(null);

  const done = Object.values(checked).filter(Boolean).length;
  const pct  = Math.round((done / MRV_ITEMS.length) * 100);
  const ringColor = pct >= 80 ? '#22C55E' : pct >= 50 ? '#CA8A04' : '#C4694A';
  const r = 42, circ = 2 * Math.PI * r;

  return (
    <div>
      {/* Progress ring */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '24px', background: '#F7F2E8', borderRadius: '14px', padding: '20px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <svg width="100" height="100" viewBox="0 0 100 100" style={{ flexShrink: 0 }}>
          <circle cx="50" cy="50" r={r} fill="none" stroke="#DDD5C4" strokeWidth="8" />
          <circle cx="50" cy="50" r={r} fill="none" stroke={ringColor} strokeWidth="8"
            strokeDasharray={`${(pct / 100) * circ} ${circ}`} strokeLinecap="round"
            transform="rotate(-90 50 50)" style={{ transition: 'stroke-dasharray 0.5s ease' }} />
          <text x="50" y="46" textAnchor="middle" fontFamily="Cormorant Garamond, serif" fontSize="20" fontWeight="700" fill={F.head}>{pct}%</text>
          <text x="50" y="60" textAnchor="middle" fontFamily="Inter, sans-serif" fontSize="9" fill={F.faint}>Ready</text>
        </svg>
        <div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '22px', fontWeight: 700, color: F.head, margin: '0 0 4px', letterSpacing: '-0.02em' }}>MRV Readiness Score</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.muted, margin: '0 0 8px' }}>{done} of {MRV_ITEMS.length} documentation items completed</p>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: ringColor, margin: 0 }}>
            {pct >= 80 ? '✅ Verification Ready' : pct >= 50 ? '⚠ Partially Ready — continue completing items' : '○ More documentation needed before applying'}
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
        {MRV_ITEMS.map(item => {
          const isDone = !!checked[item.id];
          const isOpen = expanded === item.id;
          return (
            <div key={item.id} style={{ border: `1.5px solid ${isDone ? '#4ADE80' : '#DDD5C4'}`, borderRadius: '10px', background: isDone ? '#F0FDF4' : '#FEFDF9', overflow: 'hidden', transition: 'border-color 0.2s' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '14px 16px', cursor: 'pointer' }}
                onClick={() => setExpanded(isOpen ? null : item.id)}>
                <input type="checkbox" checked={isDone}
                  onChange={e => { e.stopPropagation(); setChecked(p => ({ ...p, [item.id]: !p[item.id] })); }}
                  style={{ width: '18px', height: '18px', accentColor: G[600], cursor: 'pointer', flexShrink: 0 }} />
                <div style={{ flex: 1 }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 600, color: isDone ? G[700] : F.head, margin: '0 0 3px', textDecoration: isDone ? 'line-through' : 'none', opacity: isDone ? 0.65 : 1 }}>{item.label}</p>
                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: IMP_COLOR[item.imp], background: `${IMP_COLOR[item.imp]}18`, padding: '2px 7px', borderRadius: '4px', textTransform: 'uppercase' }}>{item.imp}</span>
                    <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint }}>{item.cat} · {item.time}</span>
                  </div>
                </div>
                <span style={{ color: F.faint, fontSize: '11px', flexShrink: 0 }}>{isOpen ? '▲' : '▼'}</span>
              </div>
              {isOpen && (
                <div style={{ padding: '0 16px 14px 46px', borderTop: '1px solid #EDE7DA' }}>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', color: F.muted, margin: '10px 0 0', lineHeight: 1.65 }}>{item.tip}</p>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

function Timeline() {
  return (
    <div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', color: F.muted, marginBottom: '28px', lineHeight: 1.6 }}>
        Most farms reach first credit issuance within <strong style={{ color: G[700] }}>12–24 months</strong> of starting the process. The phases below apply to all major protocols — specific documentation requirements vary by registry.
      </p>
      <div style={{ position: 'relative', paddingLeft: '44px' }}>
        <div style={{ position: 'absolute', left: '15px', top: '20px', bottom: '20px', width: '2px', background: 'linear-gradient(to bottom, #155233, #DDD5C4)' }} />
        {PHASES.map((ph, i) => (
          <div key={i} style={{ position: 'relative', marginBottom: '24px' }}>
            <div style={{ position: 'absolute', left: '-35px', top: '6px', width: '28px', height: '28px', borderRadius: '50%', background: i === 0 ? G[700] : '#F7F2E8', border: `2px solid ${i === 0 ? G[700] : '#DDD5C4'}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: i === 0 ? '#FEFDF9' : F.faint }}>
              {i + 1}
            </div>
            <div style={{ ...S.card, padding: '16px 18px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', gap: '10px', flexWrap: 'wrap' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, color: F.head, margin: 0, letterSpacing: '-0.02em' }}>Phase {i + 1}: {ph.label}</p>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.faint, background: '#F7F2E8', padding: '3px 10px', borderRadius: '6px', whiteSpace: 'nowrap' }}>{ph.dur}</span>
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                {ph.tasks.map(t => (
                  <span key={t} style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: F.muted, background: '#F0FDF4', border: '1px solid #DCFCE7', padding: '3px 10px', borderRadius: '20px' }}>{t}</span>
                ))}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────
export default function VerificationPage() {
  const [tab, setTab] = useState('protocols');

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Page title */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: G[700], margin: '0 0 8px' }}>Verification Readiness</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: F.head, margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.05 }}>Carbon Credit Verification</h1>

          {/* Feature summary */}
          <div style={{ background: 'linear-gradient(135deg, #F0FDF4, #DCFCE7)', border: '1px solid #86EFAC', borderRadius: '14px', padding: '20px 24px', maxWidth: '720px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13.5px', color: F.body, margin: 0, lineHeight: 1.75 }}>
              Before you can sell carbon credits, your project must be independently verified against a recognised protocol — a process that takes 12–24 months and involves soil sampling, lab analysis, and third-party auditing. <strong>This tool tells you which of the six major protocols your farm currently qualifies for</strong>, what documentation gaps you need to fill (the MRV checklist), and what the end-to-end timeline looks like. Most US farms qualify for at least Nori or CAR with minimal additional work.
            </p>
          </div>
        </div>

        {/* Tab bar */}
        <div style={{ display: 'flex', borderBottom: '1px solid #DDD5C4', marginBottom: '28px', overflowX: 'auto', gap: '0' }}>
          <TabBtn active={tab === 'protocols'} onClick={() => setTab('protocols')}>🎯 Protocol Eligibility</TabBtn>
          <TabBtn active={tab === 'mrv'}       onClick={() => setTab('mrv')}>✓ MRV Checklist</TabBtn>
          <TabBtn active={tab === 'timeline'}  onClick={() => setTab('timeline')}>📅 Verification Timeline</TabBtn>
        </div>

        {tab === 'protocols' && <ProtocolChecker />}
        {tab === 'mrv'       && <MRVChecklist />}
        {tab === 'timeline'  && <Timeline />}
      </div>
    </div>
  );
}
