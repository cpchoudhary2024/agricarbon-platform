import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STAT_ITEMS = [
  { value: '8',      label: 'Climate Zones' },
  { value: '2006',   label: 'IPCC Edition'  },
  { value: 'Tier 1', label: 'Methodology'   },
];

const TOOLS = [
  { icon: '⚗',  label: 'Carbon Calculator', pct: 0.62 },
  { icon: '📈', label: 'Live Prices',        pct: 0.60 },
  { icon: '🔬', label: 'Lab Interpreter',    pct: 0.78 },
  { icon: '💹', label: 'ROI Model',          href: '/roi' },
  { icon: '✓',  label: 'Verification',       href: '/verification' },
  { icon: '🌿', label: 'Biodiversity',        href: '/biodiversity' },
  { icon: '🧪', label: 'Soil Prescription',  href: '/prescription' },
];

export default function HeroOverlay() {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    gsap.set(el, { opacity: 0, visibility: 'visible', y: 28 });
    gsap.to(el, { opacity: 1, y: 0, ease: 'power3.out', duration: 1.1, delay: 0.3 });

    const outTween = gsap.to(el, { opacity: 0, visibility: 'hidden', y: -20, ease: 'power2.in', paused: true });
    const trigger = ScrollTrigger.create({
      trigger: '#scroll-root', start: '14% top', end: '23% top', scrub: 1,
      onUpdate: s => outTween.progress(s.progress),
    });

    return () => { trigger.kill(); outTween.kill(); };
  }, []);

  const scrollTo = pct => {
    const h = document.getElementById('scroll-root')?.offsetHeight ?? 0;
    window.scrollTo({ top: h * pct, behavior: 'smooth' });
  };

  return (
    <div ref={ref} className="hero-content" style={{
      position: 'fixed', inset: 0, width: '100vw', height: '100vh',
      zIndex: 10, pointerEvents: 'none',
      display: 'flex', alignItems: 'flex-start', justifyContent: 'center',
      padding: 'clamp(64px, 8vh, 80px) clamp(16px, 4vw, 48px) 16px',
      overflowY: 'auto',
      opacity: 0, visibility: 'hidden',
    }}>
      <div style={{
        width: '100%', maxWidth: '820px',
        pointerEvents: 'auto',
        display: 'flex', flexDirection: 'column', alignItems: 'center',
        textAlign: 'center',
      }}>
        {/* Glass card */}
        <div style={{
          background: 'rgba(254,253,249,0.93)',
          backdropFilter: 'blur(36px)', WebkitBackdropFilter: 'blur(36px)',
          border: '1px solid rgba(255,255,255,0.88)',
          borderRadius: '28px',
          padding: 'clamp(36px, 5vw, 68px) clamp(28px, 6vw, 80px)',
          boxShadow: '0 24px 80px rgba(5,46,22,0.18), 0 8px 24px rgba(5,46,22,0.10), inset 0 1px 0 rgba(255,255,255,0.9)',
          width: '100%',
        }}>
          {/* Logo row */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '12px', marginBottom: '28px' }}>
            <div style={{
              width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
              background: 'linear-gradient(135deg, #052E16 0%, #166534 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '19px',
            }}>🌿</div>
            <span style={{
              fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700,
              color: '#052E16', letterSpacing: '-0.01em',
            }}>AgriCarbon</span>
            <div style={{ height: '18px', width: '1px', background: 'rgba(5,46,22,0.15)' }} />
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700,
              letterSpacing: '0.16em', textTransform: 'uppercase', color: '#166534',
              background: 'rgba(22,101,52,0.10)', padding: '4px 10px',
              borderRadius: '100px', border: '1px solid rgba(22,101,52,0.2)',
            }}>IPCC Tier 1 Certified</span>
          </div>

          {/* Headline */}
          <h1 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(36px, 6vw, 74px)',
            fontWeight: 700, lineHeight: 1.02, letterSpacing: '-0.035em',
            color: '#052E16', margin: '0 0 18px',
          }}>
            Measure Your Soil's
            <br />
            <em style={{
              background: 'linear-gradient(135deg, #166534 0%, #22C55E 100%)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text', fontStyle: 'italic',
            }}>Carbon Potential</em>
          </h1>

          {/* Subtitle */}
          <p style={{
            fontFamily: 'Inter, sans-serif',
            fontSize: 'clamp(14px, 1.4vw, 16px)',
            color: '#4B6357', lineHeight: 1.75,
            margin: '0 auto 34px', maxWidth: '520px',
          }}>
            Science-backed carbon sequestration estimates for farmers and agronomists. Enter your land details, get IPCC-grounded projections and a professional PDF report — instantly.
          </p>

          {/* CTAs */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '12px', justifyContent: 'center', marginBottom: '40px' }}>
            <button className="btn-forest" onClick={() => scrollTo(0.62)}>
              Calculate Now
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M5 12h14M12 5l7 7-7 7"/>
              </svg>
            </button>
            <button
              onClick={() => scrollTo(0.42)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '8px',
                padding: '11px 24px', background: 'transparent', color: '#155233',
                fontFamily: 'Inter, sans-serif', fontWeight: 600, fontSize: '14px',
                border: '1.5px solid rgba(21,82,51,0.3)', borderRadius: '10px',
                cursor: 'pointer', transition: 'all 0.2s',
              }}
            >
              How It Works
            </button>
          </div>

          {/* Stats row */}
          <div style={{
            display: 'flex', flexWrap: 'wrap', justifyContent: 'center',
            borderTop: '1px solid rgba(5,46,22,0.09)', paddingTop: '22px',
            marginBottom: '22px',
          }}>
            {STAT_ITEMS.map((s, i) => (
              <div key={i} style={{
                flex: '1 1 100px',
                padding: '0 clamp(14px, 2.5vw, 28px)',
                borderRight: i < STAT_ITEMS.length - 1 ? '1px solid rgba(5,46,22,0.09)' : 'none',
                textAlign: 'center',
              }}>
                <div style={{
                  fontFamily: 'Cormorant Garamond, serif',
                  fontSize: 'clamp(20px, 2.4vw, 28px)',
                  fontWeight: 700, color: '#155233',
                  letterSpacing: '-0.03em', lineHeight: 1, marginBottom: '5px',
                }}>{s.value}</div>
                <div style={{
                  fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 600,
                  letterSpacing: '0.07em', textTransform: 'uppercase', color: '#8A9F95',
                }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Creator credit — inside the card, always visible */}
          <div style={{
            borderTop: '1px solid rgba(5,46,22,0.08)',
            paddingTop: '18px',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            gap: '12px', flexWrap: 'wrap',
          }}>
            <div style={{
              width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
              background: 'linear-gradient(135deg, #052E16 0%, #22C55E 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '16px', boxShadow: '0 2px 8px rgba(5,46,22,0.2)',
            }}>👨‍🎓</div>
            <div style={{ textAlign: 'left' }}>
              <div style={{
                fontFamily: 'Cormorant Garamond, serif', fontSize: '16px', fontWeight: 700,
                color: '#052E16', lineHeight: 1.2, letterSpacing: '-0.01em',
              }}>Chandra Prakash Choudhary</div>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '10px', color: '#8A9F95',
                letterSpacing: '0.03em', lineHeight: 1.5, marginTop: '2px',
              }}>
                Graduate Student · Dept. of Environmental Health &amp; Engineering · Johns Hopkins University
              </div>
            </div>
            <a href="mailto:cpchoudhary2024@gmail.com" style={{
              fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600,
              color: '#155233', letterSpacing: '0.04em', textDecoration: 'none',
              padding: '5px 12px', border: '1px solid rgba(21,82,51,0.25)',
              borderRadius: '100px', background: 'rgba(21,82,51,0.06)',
              flexShrink: 0, whiteSpace: 'nowrap',
            }}>✉ Contact</a>
          </div>
        </div>

        {/* 7-tool strip */}
        <div style={{
          marginTop: '18px', width: '100%',
          display: 'flex', flexWrap: 'wrap', gap: '8px', justifyContent: 'center',
        }}>
          {TOOLS.map((t, i) => (
            <button key={i}
              onClick={() => t.pct != null ? scrollTo(t.pct) : (window.location.href = t.href)}
              style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '7px 13px',
                background: 'rgba(254,253,249,0.88)', backdropFilter: 'blur(12px)',
                border: '1px solid rgba(255,255,255,0.75)',
                borderRadius: '100px',
                cursor: 'pointer',
                fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 600,
                color: '#155233', letterSpacing: '0.01em',
                boxShadow: '0 2px 10px rgba(5,46,22,0.12)',
                transition: 'all 0.18s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = '#155233'; e.currentTarget.style.color = '#FEFDF9'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(254,253,249,0.88)'; e.currentTarget.style.color = '#155233'; }}
            >
              <span style={{ fontSize: '13px' }}>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>

        {/* Scroll hint */}
        <div style={{
          marginTop: '20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '6px',
          opacity: 0.6, pointerEvents: 'auto', cursor: 'pointer',
        }} onClick={() => scrollTo(0.22)}>
          <div style={{
            fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700,
            letterSpacing: '0.15em', textTransform: 'uppercase',
            color: '#FEFDF9', textShadow: '0 1px 6px rgba(5,46,22,0.5)',
          }}>Scroll to explore</div>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ filter: 'drop-shadow(0 1px 4px rgba(5,46,22,0.4))' }}>
            <polyline points="6 9 12 15 18 9"/>
          </svg>
        </div>

      </div>
    </div>
  );
}
