import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';

// 780vh scroll root — section start percentages from GSAP triggers
const SCROLL_VH    = 780;
const SECTION_PCTS = {
  hero:        0.00,
  methodology: 0.37,
  calculator:  0.57,
  prices:      0.60, // calculator section — carbon price tracker is mid-way through
  labtest:     0.78,
};

function scrollToSection(pct) {
  const totalPx = (SCROLL_VH / 100) * window.innerHeight;
  window.scrollTo({ top: pct * totalPx, behavior: 'smooth' });
}

const TABS = [
  {
    id: 'calculator',
    label: 'Calculator',
    sub: 'IPCC SOC · CO₂e · Sequestration',
    icon: '⚗',
    pct: SECTION_PCTS.calculator,
    activeRange: [0.55, 0.77],
    type: 'scroll',
    accent: '#155233',
  },
  {
    id: 'prices',
    label: 'Carbon Prices',
    sub: 'EU ETS · Verra · Gold Standard',
    icon: '📈',
    pct: SECTION_PCTS.prices,
    activeRange: [0.55, 0.77],
    type: 'scroll',
    accent: '#CA8A04',
    live: true,
  },
  {
    id: 'labtest',
    label: 'Lab Report',
    sub: 'Soil Test → USDA/FAO Thresholds',
    icon: '🔬',
    pct: SECTION_PCTS.labtest,
    activeRange: [0.77, 1.01],
    type: 'scroll',
    accent: '#0891b2',
  },
  {
    id: 'roi',
    label: 'ROI',
    sub: 'NPV · Subsidies · Break-even',
    icon: '💹',
    type: 'link',
    to: '/roi',
    accent: '#7c3aed',
  },
  {
    id: 'verification',
    label: 'Verification',
    sub: 'MRV Checklist · Protocol Eligibility',
    icon: '✓',
    type: 'link',
    to: '/verification',
    accent: '#22C55E',
  },
  {
    id: 'biodiversity',
    label: 'Biodiversity',
    sub: 'Ecosystem Services · SDG Impact',
    icon: '🌿',
    type: 'link',
    to: '/biodiversity',
    accent: '#CA8A04',
  },
  {
    id: 'prescription',
    label: 'Soil Rx',
    sub: 'Amendment Rates · Water Quality',
    icon: '🧪',
    type: 'link',
    to: '/prescription',
    accent: '#0891b2',
  },
];

export default function TopNavBar() {
  const location = useLocation();
  const isMainSite = location.pathname === '/';
  // Pages with their own header/nav — hide the top nav
  const hiddenRoutes = ['/roi', '/verification', '/biodiversity', '/prescription'];
  if (hiddenRoutes.includes(location.pathname)) return null;

  const [scrollPct, setScrollPct] = useState(0);
  const [visible,   setVisible]   = useState(true);
  const [lastY,     setLastY]     = useState(0);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    if (!isMainSite) return;
    const onScroll = () => {
      const y    = window.scrollY;
      const root = document.getElementById('scroll-root');
      const total = root ? root.offsetHeight : window.innerHeight * SCROLL_VH / 100;
      setScrollPct(y / total);
      // Hide on fast scroll down, show on scroll up
      setVisible(y < 80 || y < lastY || y < total * 0.05);
      setLastY(y);
    };
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isMainSite, lastY]);

  const activeTab = isMainSite
    ? TABS.find(t => t.type === 'scroll' && scrollPct >= t.activeRange?.[0] && scrollPct < t.activeRange?.[1])?.id
    : TABS.find(t => t.type === 'link' && t.to === location.pathname)?.id;

  return (
    <nav
      id="top-nav-bar"
      style={{
        position: 'fixed',
        top: 0, left: 0, right: 0,
        zIndex: 200,
        transform: visible ? 'translateY(0)' : 'translateY(-100%)',
        transition: 'transform 0.3s cubic-bezier(0.4,0,0.2,1)',
      }}
    >
      {/* Glass background */}
      <div style={{
        background: 'rgba(5, 46, 22, 0.86)',
        backdropFilter: 'blur(24px)',
        WebkitBackdropFilter: 'blur(24px)',
        borderBottom: '1px solid rgba(74, 222, 128, 0.10)',
        boxShadow: '0 4px 32px rgba(3,12,6,0.30)',
      }}>
        <div style={{
          maxWidth: '1280px',
          margin: '0 auto',
          padding: '0 clamp(16px, 3vw, 40px)',
          display: 'flex',
          alignItems: 'stretch',
          height: '58px',
          gap: '0',
        }}>

          {/* ── Brand ── */}
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: '10px',
              paddingRight: '24px',
              borderRight: '1px solid rgba(74,222,128,0.10)',
              cursor: 'pointer', flexShrink: 0,
            }}
            onClick={() => isMainSite ? scrollToSection(0) : null}
          >
            <div style={{
              width: '30px', height: '30px',
              background: 'linear-gradient(135deg, #166534, #4ADE80)',
              borderRadius: '8px',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px',
            }}>🌱</div>
            <div>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: '17px', fontWeight: 700,
                color: '#FEFDF9', lineHeight: 1, letterSpacing: '-0.02em',
              }}>AgriCarbon</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '8px',
                color: 'rgba(254,253,249,0.45)', letterSpacing: '0.10em',
                textTransform: 'uppercase', lineHeight: 1,
              }}>IPCC Tier 1 · Carbon Platform</div>
            </div>
          </div>

          {/* ── Desktop tabs ── */}
          <div style={{
            display: 'flex', flex: 1, alignItems: 'stretch',
            gap: '0', overflow: 'hidden',
          }} className="nav-tabs-desktop">
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              const content = (
                <div style={{
                  display: 'flex', flexDirection: 'column',
                  justifyContent: 'center', gap: '1px',
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ fontSize: '12px', opacity: 0.9 }}>{tab.icon}</span>
                    <span style={{
                      fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700,
                      color: isActive ? '#FEFDF9' : 'rgba(254,253,249,0.70)',
                      letterSpacing: '-0.01em',
                      transition: 'color 0.2s',
                    }}>
                      {tab.label}
                    </span>
                    {tab.live && (
                      <span style={{
                        display: 'inline-flex', alignItems: 'center', gap: '3px',
                        fontFamily: 'Inter, sans-serif', fontSize: '8px', fontWeight: 700,
                        color: '#4ADE80', letterSpacing: '0.08em', textTransform: 'uppercase',
                        padding: '1px 5px',
                        background: 'rgba(74,222,128,0.12)',
                        border: '1px solid rgba(74,222,128,0.25)',
                        borderRadius: '4px',
                      }}>
                        <span style={{
                          width: '5px', height: '5px', borderRadius: '50%',
                          background: '#4ADE80',
                          animation: 'pulseDot 2.2s ease-in-out infinite',
                          flexShrink: 0,
                        }} />
                        LIVE
                      </span>
                    )}
                  </div>
                  <span style={{
                    fontFamily: 'Inter, sans-serif', fontSize: '9px',
                    color: 'rgba(254,253,249,0.38)',
                    letterSpacing: '0.01em',
                    transition: 'color 0.2s',
                    ...(isActive ? { color: 'rgba(254,253,249,0.55)' } : {}),
                  }}>
                    {tab.sub}
                  </span>
                </div>
              );

              const sharedStyle = {
                display: 'flex', alignItems: 'center',
                padding: '0 14px',
                borderBottom: isActive ? `3px solid ${tab.accent}` : '3px solid transparent',
                borderRight: '1px solid rgba(74,222,128,0.06)',
                cursor: 'pointer',
                background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                transition: 'background 0.2s, border-color 0.2s',
                textDecoration: 'none',
                position: 'relative',
              };

              if (tab.type === 'link') {
                return (
                  <Link
                    key={tab.id}
                    to={tab.to}
                    style={{ ...sharedStyle, marginLeft: 'auto', borderLeft: '1px solid rgba(74,222,128,0.10)' }}
                    onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                    onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.04)' : 'transparent'; }}
                  >
                    {content}
                    <span style={{
                      marginLeft: '8px', fontSize: '11px',
                      color: 'rgba(254,253,249,0.40)',
                    }}>↗</span>
                  </Link>
                );
              }

              return (
                <button
                  key={tab.id}
                  onClick={() => { scrollToSection(tab.pct); setMobileOpen(false); }}
                  style={{ ...sharedStyle, border: 'none', borderBottom: isActive ? `3px solid ${tab.accent}` : '3px solid transparent', outline: 'none' }}
                  onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.06)'; }}
                  onMouseLeave={e => { e.currentTarget.style.background = isActive ? 'rgba(255,255,255,0.04)' : 'transparent'; }}
                >
                  {content}
                </button>
              );
            })}
          </div>

          {/* ── Progress bar (scroll indicator) ── */}
          {isMainSite && (
            <div style={{
              position: 'absolute', bottom: 0, left: 0, right: 0, height: '2px',
              background: 'rgba(74,222,128,0.10)',
            }}>
              <div style={{
                height: '100%',
                width: `${Math.min(scrollPct * 100, 100)}%`,
                background: 'linear-gradient(to right, rgba(74,222,128,0.5), rgba(74,222,128,0.8))',
                transition: 'width 0.1s linear',
              }} />
            </div>
          )}

          {/* ── Mobile hamburger ── */}
          <button
            className="nav-mobile-toggle"
            onClick={() => setMobileOpen(v => !v)}
            style={{
              display: 'none',
              background: 'none', border: 'none', cursor: 'pointer',
              color: '#FEFDF9', fontSize: '20px',
              padding: '0 4px', marginLeft: 'auto',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {mobileOpen ? '✕' : '☰'}
          </button>
        </div>

        {/* ── Mobile dropdown ── */}
        {mobileOpen && (
          <div style={{
            background: 'rgba(5,46,22,0.97)',
            borderTop: '1px solid rgba(74,222,128,0.08)',
            padding: '8px 0',
          }}>
            {TABS.map(tab => {
              const isActive = activeTab === tab.id;
              if (tab.type === 'link') {
                return (
                  <Link key={tab.id} to={tab.to}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '12px',
                      padding: '12px clamp(16px,3vw,40px)',
                      textDecoration: 'none',
                      borderLeft: isActive ? `3px solid ${tab.accent}` : '3px solid transparent',
                      background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                    }}
                    onClick={() => setMobileOpen(false)}
                  >
                    <span>{tab.icon}</span>
                    <div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FEFDF9' }}>{tab.label} ↗</div>
                      <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(254,253,249,0.4)' }}>{tab.sub}</div>
                    </div>
                  </Link>
                );
              }
              return (
                <button key={tab.id}
                  onClick={() => { scrollToSection(tab.pct); setMobileOpen(false); }}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px', width: '100%',
                    padding: '12px clamp(16px,3vw,40px)',
                    background: isActive ? 'rgba(255,255,255,0.04)' : 'transparent',
                    border: 'none', borderLeft: isActive ? `3px solid ${tab.accent}` : '3px solid transparent',
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <span>{tab.icon}</span>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700, color: '#FEFDF9' }}>
                      {tab.label}
                      {tab.live && <span style={{ marginLeft: '8px', color: '#4ADE80', fontSize: '10px' }}>● LIVE</span>}
                    </div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: 'rgba(254,253,249,0.4)' }}>{tab.sub}</div>
                  </div>
                </button>
              );
            })}
          </div>
        )}
      </div>
    </nav>
  );
}
