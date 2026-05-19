import { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';

const SCROLL_VH = 780;
function scrollTo(pct) {
  const totalPx = (SCROLL_VH / 100) * window.innerHeight;
  window.scrollTo({ top: pct * totalPx, behavior: 'smooth' });
}

const FEATURES = [
  {
    id: 'calculator',
    icon: '⚗',
    title: 'IPCC Carbon Calculator',
    badge: 'On-page',
    badgeColor: '#155233',
    accent: '#155233',
    bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    description: 'Enter your farm details — soil type, climate zone, tillage practice — and get a scientifically rigorous CO₂e sequestration estimate using IPCC Tier 1 methodology, the same framework used by national greenhouse gas inventories worldwide.',
    action: { type: 'scroll', pct: 0.57 },
  },
  {
    id: 'prices',
    icon: '📈',
    title: 'Live Carbon Prices',
    badge: 'Market data',
    badgeColor: '#92400E',
    accent: '#CA8A04',
    bg: 'linear-gradient(135deg, #FFFBEB 0%, #FEF3C7 100%)',
    live: true,
    description: 'Track real-time EU ETS and California carbon credit prices with a 30-day price history chart. Six markets covered: EU ETS, California WCI, RGGI, Verra VCS, Gold Standard, and voluntary market average. Click any price card to auto-populate the calculator.',
    action: { type: 'scroll', pct: 0.60 },
  },
  {
    id: 'lab',
    icon: '🔬',
    title: 'Lab Report Interpreter',
    badge: 'On-page',
    badgeColor: '#0369A1',
    accent: '#0891b2',
    bg: 'linear-gradient(135deg, #F0F9FF 0%, #BAE6FD 40%, #E0F2FE 100%)',
    description: 'Upload or enter values from any US soil lab report (USDA NRCS, Cornell CASH, Penn State, Iowa State, UC Davis). Each nutrient is instantly interpreted against IPCC/FAO thresholds, colour-coded for deficiency, adequacy, or excess.',
    action: { type: 'scroll', pct: 0.78 },
  },
  {
    id: 'roi',
    icon: '💹',
    title: 'ROI Financial Model',
    badge: 'Full page',
    badgeColor: '#5B21B6',
    accent: '#7c3aed',
    bg: 'linear-gradient(135deg, #F5F3FF 0%, #EDE9FE 100%)',
    description: 'A complete 10-year financial projection for your carbon farming operation. Models implementation costs, USDA EQIP/CSP subsidy eligibility across 15 states, NPV at your chosen discount rate, IRR, and break-even year — compared against S&P 500, Treasuries, and REITs.',
    action: { type: 'link', to: '/roi' },
  },
  {
    id: 'verification',
    icon: '✓',
    title: 'Verification Readiness',
    badge: 'Full page',
    badgeColor: '#155233',
    accent: '#22C55E',
    bg: 'linear-gradient(135deg, #F0FDF4 0%, #DCFCE7 100%)',
    description: 'Find out which regulated carbon protocols — Verra VM0042, Gold Standard, Climate Action Reserve, Nori, or Australia ERF — your farm qualifies for. An interactive 12-item MRV checklist tracks documentation readiness, and the timeline maps the full 12–24 month journey to first credit issuance.',
    action: { type: 'link', to: '/verification' },
  },
  {
    id: 'biodiversity',
    icon: '🌿',
    title: 'Ecosystem Co-Benefits',
    badge: 'Full page',
    badgeColor: '#065F46',
    accent: '#059669',
    bg: 'linear-gradient(135deg, #ECFDF5 0%, #A7F3D0 100%)',
    description: 'Carbon sequestration is only one part of regenerative farming\'s value. Select your planned practices — no-till, cover crops, agroforestry, rotational grazing — to instantly quantify pollinator habitat gained, erosion prevented, water infiltration improved, and which UN Sustainable Development Goals your farm advances.',
    action: { type: 'link', to: '/biodiversity' },
  },
  {
    id: 'prescription',
    icon: '🧪',
    title: 'Soil Prescription',
    badge: 'Full page',
    badgeColor: '#0369A1',
    accent: '#0284C7',
    bg: 'linear-gradient(135deg, #F0F9FF 0%, #E0F2FE 100%)',
    description: 'Enter values from your soil lab report and receive NRCS-calibrated amendment prescriptions with exact dosage rates for your field area — liming, phosphorus, potassium, sulfur, and zinc. A separate water quality tab interprets irrigation or well-water samples against EPA NPDWR drinking water and ecological thresholds.',
    action: { type: 'link', to: '/prescription' },
  },
];

const F = { head: '#030C06', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };

export default function SiteMenu() {
  const [open, setOpen]   = useState(false);
  const location          = useLocation();
  const navigate          = useNavigate();
  const isMain            = location.pathname === '/';

  // Close on route change
  useEffect(() => { setOpen(false); }, [location.pathname]);

  // Lock body scroll when menu open
  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  // Close on Escape
  useEffect(() => {
    const onKey = e => { if (e.key === 'Escape') setOpen(false); };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  function handleFeature(action) {
    if (action.type === 'scroll') {
      if (!isMain) {
        navigate('/');
        // Wait for navigation + mount before scrolling
        setTimeout(() => scrollTo(action.pct), 200);
      } else {
        scrollTo(action.pct);
      }
    } else {
      navigate(action.to);
    }
    setOpen(false);
  }

  return (
    <>
      {/* ── Floating menu button ── */}
      <div style={{
        position: 'fixed', top: '16px', left: '20px', zIndex: 500,
        display: 'flex', alignItems: 'center', gap: '10px',
      }}>
        {/* Brand mark */}
        <Link to="/" style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '8px' }} onClick={() => setOpen(false)}>
          <div style={{
            width: '34px', height: '34px', borderRadius: '9px',
            background: 'linear-gradient(135deg, #155233, #22C55E)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '17px', boxShadow: '0 2px 12px rgba(21,82,51,0.35)',
            flexShrink: 0,
          }}>🌱</div>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 700, color: '#030C06', letterSpacing: '-0.02em', lineHeight: 1 }}>AgriCarbon</span>
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', color: F.faint, letterSpacing: '0.08em', textTransform: 'uppercase', lineHeight: 1.2 }}>IPCC Carbon Platform</span>
          </div>
        </Link>

        {/* Separator */}
        <div style={{ width: '1px', height: '24px', background: 'rgba(21,82,51,0.15)' }} />

        {/* Menu button */}
        <button
          onClick={() => setOpen(v => !v)}
          aria-label="Open navigation menu"
          style={{
            height: '36px', padding: '0 14px 0 10px',
            borderRadius: '9px',
            border: '1.5px solid rgba(21,82,51,0.18)',
            background: open ? '#155233' : 'rgba(254,253,249,0.92)',
            backdropFilter: 'blur(12px)',
            cursor: 'pointer', display: 'flex', flexDirection: 'row',
            alignItems: 'center', gap: '8px',
            transition: 'all 0.2s', boxShadow: '0 2px 8px rgba(21,82,51,0.12)',
          }}
        >
          {open ? (
            <>
              <span style={{ fontSize: '14px', color: '#FEFDF9', lineHeight: 1, fontWeight: 400 }}>✕</span>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#FEFDF9', letterSpacing: '0.04em' }}>Close</span>
            </>
          ) : (
            <>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px', alignItems: 'flex-start', flexShrink: 0 }}>
                <span style={{ width: '14px', height: '1.5px', background: '#155233', borderRadius: '2px', display: 'block' }} />
                <span style={{ width: '14px', height: '1.5px', background: '#155233', borderRadius: '2px', display: 'block' }} />
                <span style={{ width: '10px', height: '1.5px', background: '#155233', borderRadius: '2px', display: 'block' }} />
              </div>
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 600, color: '#155233', letterSpacing: '0.04em' }}>Menu</span>
            </>
          )}
        </button>
      </div>

      {/* ── Full-screen overlay ── */}
      {open && (
        <div
          style={{
            position: 'fixed', inset: 0, zIndex: 490,
            background: 'rgba(3, 12, 6, 0.72)',
            backdropFilter: 'blur(8px)',
            display: 'flex', alignItems: 'flex-start', justifyContent: 'flex-start',
            paddingTop: '72px',
            overflowY: 'auto',
            animation: 'fadeIn 0.18s ease',
          }}
          onClick={e => { if (e.target === e.currentTarget) setOpen(false); }}
        >
          <div style={{
            width: 'min(860px, 94vw)',
            margin: '0 auto 40px',
            animation: 'slideUp 0.22s cubic-bezier(0.16,1,0.3,1)',
          }}>
            {/* Menu header */}
            <div style={{ marginBottom: '20px', paddingLeft: '4px' }}>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#4ADE80', margin: '0 0 4px' }}>Platform Overview</p>
              <h2 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(26px, 4vw, 42px)', fontWeight: 700, color: '#FEFDF9', margin: 0, letterSpacing: '-0.025em', lineHeight: 1 }}>What would you like to explore?</h2>
            </div>

            {/* Feature grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(260px, 1fr))', gap: '12px' }}>
              {FEATURES.map((feat, i) => (
                <button
                  key={feat.id}
                  onClick={() => handleFeature(feat.action)}
                  style={{
                    textAlign: 'left', border: 'none', cursor: 'pointer',
                    background: feat.bg, borderRadius: '16px', padding: '20px',
                    boxShadow: '0 2px 16px rgba(3,12,6,0.18)',
                    transition: 'transform 0.18s cubic-bezier(0.16,1,0.3,1), box-shadow 0.18s',
                    animation: `slideUp ${0.18 + i * 0.04}s cubic-bezier(0.16,1,0.3,1)`,
                    position: 'relative', overflow: 'hidden',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(3,12,6,0.22)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = ''; e.currentTarget.style.boxShadow = '0 2px 16px rgba(3,12,6,0.18)'; }}
                >
                  {/* Top row */}
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ fontSize: '24px', lineHeight: 1 }}>{feat.icon}</span>
                      <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.10em', textTransform: 'uppercase', color: feat.badgeColor, background: `${feat.badgeColor}18`, padding: '3px 8px', borderRadius: '20px' }}>
                        {feat.badge}
                        {feat.live && <span style={{ marginLeft: '4px', color: '#22C55E' }}>● Live</span>}
                      </span>
                    </div>
                    <span style={{ fontSize: '14px', color: feat.accent, opacity: 0.6 }}>↗</span>
                  </div>

                  {/* Title */}
                  <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '19px', fontWeight: 700, color: F.head, margin: '0 0 8px', letterSpacing: '-0.02em', lineHeight: 1.1 }}>{feat.title}</p>

                  {/* Description */}
                  <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11.5px', color: F.muted, margin: 0, lineHeight: 1.65 }}>{feat.description}</p>

                  {/* Bottom accent line */}
                  <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '3px', background: feat.accent, opacity: 0.5, borderRadius: '0 0 16px 16px' }} />
                </button>
              ))}
            </div>

            {/* Footer note */}
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(254,253,249,0.35)', textAlign: 'center', marginTop: '20px' }}>
              All calculations use IPCC AR6 · Verra VCS · Gold Standard · USDA NRCS · EPA methodology · No backend — fully client-side
            </p>
          </div>
        </div>
      )}

      {/* ── Keyframe styles ── */}
      <style>{`
        @keyframes fadeIn { from { opacity: 0; } to { opacity: 1; } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(16px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </>
  );
}
