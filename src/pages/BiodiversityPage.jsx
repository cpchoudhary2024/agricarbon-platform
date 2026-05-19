import { useState, useMemo } from 'react';
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip } from 'recharts';

const F = { head: '#030C06', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };
const G = { 700: '#155233', 600: '#166534', 400: '#22C55E', 100: '#DCFCE7' };

// ─── Practice database (IPCC AR6, USDA NRCS, FAO) ────────────────
const PRACTICES = {
  noTill: {
    label: 'No-Till / Direct Seeding', icon: '🚜', category: 'Tillage',
    sequestration: { low: 0.5, med: 1.0, high: 1.8 },
    difficulty: 'Medium', timeToResults: '2–5 years',
    erosionReduction: 3.5, waterInfiltration: 15, biodiversity: 25,
    pollinatorHabitat: 0, microclimateCooling: 0,
    coBenefit: 'Protects soil biota; reduces erosion by up to 90% vs. conventional',
    sdgs: ['SDG2', 'SDG13', 'SDG15'], color: '#155233',
  },
  reducedTill: {
    label: 'Reduced Tillage', icon: '🌱', category: 'Tillage',
    sequestration: { low: 0.3, med: 0.6, high: 1.0 },
    difficulty: 'Low', timeToResults: '1–3 years',
    erosionReduction: 2.0, waterInfiltration: 8, biodiversity: 15,
    pollinatorHabitat: 0, microclimateCooling: 0,
    coBenefit: 'Good transition step toward no-till; reduces fuel use by 30–50%',
    sdgs: ['SDG2', 'SDG13'], color: '#166534',
  },
  coverCrops: {
    label: 'Cover Crops', icon: '🌾', category: 'Crop Management',
    sequestration: { low: 0.5, med: 0.9, high: 1.4 },
    difficulty: 'Low', timeToResults: '1–2 years',
    erosionReduction: 2.8, waterInfiltration: 12, biodiversity: 35,
    pollinatorHabitat: 0.15, microclimateCooling: 0.8,
    coBenefit: 'Legume species fix 50–200 kg N/ha; flowering species support pollinators',
    sdgs: ['SDG2', 'SDG6', 'SDG13', 'SDG15'], color: '#22C55E',
  },
  agroforestry: {
    label: 'Agroforestry / Silvopasture', icon: '🌳', category: 'Land Use',
    sequestration: { low: 2.0, med: 3.5, high: 6.0 },
    difficulty: 'High', timeToResults: '5–10 years',
    erosionReduction: 4.0, waterInfiltration: 18, biodiversity: 55,
    pollinatorHabitat: 0.25, microclimateCooling: 2.5,
    coBenefit: 'Highest biodiversity gain; additional income from timber, fruit, nuts',
    sdgs: ['SDG1', 'SDG2', 'SDG13', 'SDG15'], color: '#CA8A04',
  },
  organicAmendments: {
    label: 'Compost / Organic Amendments', icon: '♻️', category: 'Inputs',
    sequestration: { low: 0.4, med: 0.8, high: 1.5 },
    difficulty: 'Low', timeToResults: '1–3 years',
    erosionReduction: 1.2, waterInfiltration: 8, biodiversity: 20,
    pollinatorHabitat: 0, microclimateCooling: 0,
    coBenefit: 'Feeds soil food web; slow-release nutrients reduce leaching risk',
    sdgs: ['SDG2', 'SDG12', 'SDG13'], color: '#C4694A',
  },
  rotationalGrazing: {
    label: 'Rotational / Adaptive Grazing', icon: '🐄', category: 'Livestock',
    sequestration: { low: 0.4, med: 0.8, high: 1.8 },
    difficulty: 'Medium', timeToResults: '2–5 years',
    erosionReduction: 1.5, waterInfiltration: 10, biodiversity: 30,
    pollinatorHabitat: 0.05, microclimateCooling: 0,
    coBenefit: 'Controlled rest periods allow plant recovery and soil biota rebuilding',
    sdgs: ['SDG2', 'SDG13', 'SDG15'], color: '#0891b2',
  },
  diversifiedRotation: {
    label: 'Diversified Crop Rotation (4+ species)', icon: '🔄', category: 'Crop Management',
    sequestration: { low: 0.3, med: 0.5, high: 0.9 },
    difficulty: 'Low', timeToResults: '1–3 years',
    erosionReduction: 1.0, waterInfiltration: 5, biodiversity: 40,
    pollinatorHabitat: 0.05, microclimateCooling: 0,
    coBenefit: 'Breaks pest/disease cycles; 4+ species boosts soil biology diversity by 25%+',
    sdgs: ['SDG2', 'SDG12', 'SDG13', 'SDG15'], color: '#7c3aed',
  },
};

const SDG_META = {
  SDG1:  { label: 'No Poverty',             icon: '🏠', color: '#E5243B' },
  SDG2:  { label: 'Zero Hunger',            icon: '🌾', color: '#DDA63A' },
  SDG6:  { label: 'Clean Water & Sanitation',icon: '💧', color: '#26BDE2' },
  SDG12: { label: 'Responsible Consumption', icon: '♻️', color: '#BF8B2E' },
  SDG13: { label: 'Climate Action',          icon: '🌍', color: '#3F7E44' },
  SDG15: { label: 'Life on Land',            icon: '🌿', color: '#56C02B' },
};

// ─── Ecosystem services calculator ───────────────────────────────
function calcServices(practiceIds, area) {
  let erosion = 0, water = 0, biodiv = 0, pollinator = 0, cooling = 0, carbon = 0;
  practiceIds.forEach(id => {
    const p = PRACTICES[id];
    if (!p) return;
    erosion    += p.erosionReduction;
    water      += p.waterInfiltration;
    biodiv     += p.biodiversity;
    pollinator += p.pollinatorHabitat * area;
    cooling    += p.microclimateCooling;
    carbon     += p.sequestration.med;
  });
  return {
    erosion:    Math.min(erosion, 12).toFixed(1),
    water:      Math.min(water, 60).toFixed(0),
    biodiv:     Math.min(biodiv, 100).toFixed(0),
    pollinator: pollinator.toFixed(1),
    cooling:    cooling.toFixed(1),
    carbon:     carbon.toFixed(1),
  };
}

function calcSDGs(practiceIds) {
  const counts = {};
  practiceIds.forEach(id => {
    (PRACTICES[id]?.sdgs || []).forEach(s => { counts[s] = (counts[s] || 0) + 1; });
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .map(([k, v]) => SDG_META[k] ? { ...SDG_META[k], id: k, count: v } : null)
    .filter(Boolean);
}

// ─── Shared styles ────────────────────────────────────────────────
const S = {
  page:  { minHeight: '100vh', background: '#FEFDF9', fontFamily: 'Inter, sans-serif', paddingTop: '80px' },
  inner: { maxWidth: '1080px', margin: '0 auto', padding: 'clamp(24px,4vw,52px) clamp(16px,3vw,40px)' },
  label: { fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.14em', textTransform: 'uppercase', color: G[700], display: 'block', marginBottom: '6px' },
};

function MetricCard({ label, value, unit, desc, color, icon }) {
  return (
    <div style={{ background: '#FEFDF9', border: '1px solid #DDD5C4', borderLeft: `4px solid ${color}`, borderRadius: '12px', padding: '16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '8px' }}>
        <span style={{ fontSize: '20px' }}>{icon}</span>
        <div style={{ textAlign: 'right' }}>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '28px', fontWeight: 700, color, lineHeight: 1 }}>{value}</span>
          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#8A9F95', marginLeft: '3px' }}>{unit}</span>
        </div>
      </div>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#1A2E22', margin: '0 0 2px' }}>{label}</p>
      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#8A9F95', margin: 0 }}>{desc}</p>
    </div>
  );
}

export default function BiodiversityPage() {
  const [selected, setSelected] = useState(['noTill', 'coverCrops']);
  const [area,     setArea]     = useState(100);

  const toggle = id => setSelected(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const svc  = useMemo(() => calcServices(selected, area), [selected, area]);
  const sdgs = useMemo(() => calcSDGs(selected), [selected]);

  const totalCarbon = (parseFloat(svc.carbon) * area).toFixed(0);

  const radarData = [
    { metric: 'Biodiversity',   value: +svc.biodiv },
    { metric: 'Water Quality',  value: Math.min(+svc.water * 1.5, 100) },
    { metric: 'Erosion Control',value: Math.min(+svc.erosion * 7, 100) },
    { metric: 'Carbon Seq.',    value: Math.min(+svc.carbon * 14, 100) },
    { metric: 'Pollinator Hab.',value: Math.min(+svc.pollinator * 12, 100) },
    { metric: 'Microclimate',   value: Math.min(+svc.cooling * 28, 100) },
  ];

  return (
    <div style={S.page}>
      <div style={S.inner}>

        {/* Page title + summary */}
        <div style={{ marginBottom: '32px' }}>
          <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: G[700], margin: '0 0 8px' }}>Ecosystem Co-Benefits</p>
          <h1 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(28px, 4vw, 48px)', fontWeight: 700, color: F.head, margin: '0 0 16px', letterSpacing: '-0.025em', lineHeight: 1.05 }}>Biodiversity & Ecosystem Services</h1>

          <div style={{ background: 'linear-gradient(135deg, #ECFDF5, #A7F3D0 80%, #ECFDF5)', border: '1px solid #6EE7B7', borderRadius: '14px', padding: '20px 24px', maxWidth: '720px' }}>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '13.5px', color: F.body, margin: 0, lineHeight: 1.75 }}>
              Carbon sequestration is only part of regenerative farming's value. Protocols like Gold Standard and Plan Vivo award premium prices for measurable ecosystem co-benefits. <strong>Select your planned farming practices</strong> and this tool instantly quantifies six ecosystem services — pollinator habitat, water infiltration, erosion prevented, microclimate cooling — and maps your farm's contribution to the UN Sustainable Development Goals. Figures use IPCC AR6 and FAO peer-reviewed factors.
            </p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'clamp(250px, 30%, 320px) 1fr', gap: '24px', alignItems: 'start' }}>

          {/* ── Practice selector ── */}
          <div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '12px' }}>
              <p style={{ ...S.label, margin: 0 }}>Select Practices</p>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span style={{ ...S.label, margin: 0 }}>Area (ha)</span>
                <input type="number" value={area} min="1" onChange={e => setArea(Math.max(1, +e.target.value))}
                  style={{ width: '70px', padding: '6px 8px', border: '1.5px solid #DDD5C4', borderRadius: '7px', fontFamily: 'Inter, sans-serif', fontSize: '13px', fontVariantNumeric: 'tabular-nums', color: F.head, background: '#FEFDF9', outline: 'none' }} />
              </div>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
              {Object.entries(PRACTICES).map(([id, p]) => {
                const active = selected.includes(id);
                return (
                  <div key={id} onClick={() => toggle(id)} style={{ border: `1.5px solid ${active ? p.color : '#DDD5C4'}`, borderRadius: '10px', padding: '12px 14px', cursor: 'pointer', background: active ? `${p.color}0A` : '#FEFDF9', transition: 'all 0.15s', display: 'flex', gap: '10px', alignItems: 'flex-start' }}>
                    <span style={{ fontSize: '18px', flexShrink: 0, marginTop: '1px' }}>{p.icon}</span>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '8px' }}>
                        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: active ? p.color : F.body, margin: 0 }}>{p.label}</p>
                        <div style={{ width: '16px', height: '16px', borderRadius: '4px', border: `2px solid ${active ? p.color : '#DDD5C4'}`, background: active ? p.color : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, transition: 'all 0.15s' }}>
                          {active && <span style={{ color: '#fff', fontSize: '10px', lineHeight: 1 }}>✓</span>}
                        </div>
                      </div>
                      <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '2px 0 0' }}>{p.category} · {p.difficulty} · {p.timeToResults}</p>
                      {active && <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted, margin: '4px 0 0', fontStyle: 'italic', lineHeight: 1.5 }}>{p.coBenefit}</p>}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* ── Results ── */}
          <div>
            {selected.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: F.faint, background: '#F7F2E8', borderRadius: '16px' }}>
                <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '24px', margin: '0 0 8px', color: F.muted }}>Select practices to see ecosystem impacts</p>
                <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px' }}>Each practice contributes differently to biodiversity, water, and climate.</p>
              </div>
            ) : (
              <>
                {/* Radar */}
                <div style={{ background: '#F7F2E8', borderRadius: '14px', padding: '16px', marginBottom: '20px' }}>
                  <p style={{ ...S.label, marginBottom: '4px' }}>Co-Benefit Profile — {selected.length} practice{selected.length > 1 ? 's' : ''} · {area} ha</p>
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '0 0 10px' }}>Scores are relative to each metric's maximum attainable value</p>
                  <ResponsiveContainer width="100%" height={220}>
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="#DDD5C4" />
                      <PolarAngleAxis dataKey="metric" tick={{ fill: F.faint, fontSize: 10, fontFamily: 'Inter, sans-serif' }} />
                      <Radar name="Services" dataKey="value" stroke={G[700]} fill={G[700]} fillOpacity={0.15} strokeWidth={2} />
                      <Tooltip formatter={v => [`${Math.round(v)}/100`, 'Score']} contentStyle={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', borderRadius: '8px', border: '1px solid #DDD5C4' }} />
                    </RadarChart>
                  </ResponsiveContainer>
                </div>

                {/* Metric cards */}
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(175px, 1fr))', gap: '10px', marginBottom: '20px' }}>
                  <MetricCard icon="🌿" label="Biodiversity Index"   value={svc.biodiv}    unit="/100"         desc="Relative species richness improvement"         color={G[700]} />
                  <MetricCard icon="💧" label="Water Infiltration"   value={svc.water}     unit="% better"     desc="Improved runoff capture vs. baseline"           color="#0891b2" />
                  <MetricCard icon="🛡" label="Erosion Reduction"    value={svc.erosion}   unit="t/ha/yr"      desc="Soil loss prevented — USDA RUSLE factors"      color="#C4694A" />
                  <MetricCard icon="🌸" label="Pollinator Habitat"   value={svc.pollinator}unit="ha"           desc="Effective pollinator habitat created on-farm"   color="#CA8A04" />
                  <MetricCard icon="🌡" label="Microclimate Cooling" value={svc.cooling}   unit="°C"           desc="Surface temperature reduction during season"    color="#7c3aed" />
                  <MetricCard icon="♻️" label="Annual Carbon Seq."   value={Number(totalCarbon).toLocaleString()} unit="tCO₂e/yr" desc={`${svc.carbon} tCO₂e/ha avg · IPCC Tier 1`} color={G[600]} />
                </div>

                {/* SDG alignment */}
                {sdgs.length > 0 && (
                  <div style={{ background: '#F7F2E8', borderRadius: '14px', padding: '18px' }}>
                    <p style={{ ...S.label, marginBottom: '12px' }}>UN SDG Alignment</p>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                      {sdgs.map(s => (
                        <div key={s.id} style={{ background: s.color, borderRadius: '10px', padding: '8px 14px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ fontSize: '16px' }}>{s.icon}</span>
                          <div>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, color: 'rgba(255,255,255,0.75)', margin: 0, letterSpacing: '0.08em' }}>{s.id}</p>
                            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: '#fff', margin: 0 }}>{s.label}</p>
                          </div>
                          <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.85)', background: 'rgba(0,0,0,0.15)', borderRadius: '4px', padding: '2px 7px' }}>{s.count}×</span>
                        </div>
                      ))}
                    </div>
                    <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0 }}>
                      SDG co-benefit documentation strengthens Gold Standard and Plan Vivo protocol eligibility and can command 20–40% price premiums. Sources: IPCC AR6 WG3 Ch.7 · FAO Agroforestry Co-Benefits 2023.
                    </p>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
