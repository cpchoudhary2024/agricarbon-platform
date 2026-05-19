import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

const STATS = [
  {
    value: 1.66, suffix: ' Bn ha', dec: 2,
    label: 'Degraded Agricultural Land',
    detail: '34% of the world\'s 4.9 billion hectares of agricultural land is moderately to highly degraded — and the crisis is accelerating.',
    rate: '+12 M ha/yr',
    rateLabel: 'lost to degradation annually',
    rateSrc: 'UNCCD, 2022',
    src: 'FAO SOLAW, 2021',
    icon: '🌍',
    accent: '#C4694A',
    border: '#E8926A',
    bg: 'rgba(255,248,244,0.95)',
  },
  {
    value: 33, suffix: '%', dec: 0,
    label: 'Global GHG from Food Systems',
    detail: 'Agriculture and food systems account for one-third of all human-caused greenhouse gas warming.',
    src: 'IPCC AR6, 2022',
    icon: '💨',
    accent: '#0F766E',
    border: '#14B8A6',
    bg: 'rgba(240,253,250,0.95)',
  },
  {
    value: 1.85, suffix: ' Gt C/yr', dec: 2,
    label: 'Soil Sequestration Potential',
    detail: 'Estimated annual carbon capture possible through improved agricultural management worldwide.',
    src: 'Minasny et al., 2017',
    icon: '🌱',
    accent: '#15803D',
    border: '#22C55E',
    bg: 'rgba(240,253,244,0.95)',
  },
];


const BASE = {
  position: 'fixed', inset: 0, width: '100vw', height: '100vh',
  zIndex: 10, pointerEvents: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 4vw',
  opacity: 0, visibility: 'hidden',
};

export default function StatsOverlay() {
  const ref      = useRef();
  const cardRefs = useRef([]);
  const counted  = useRef(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const triggers = [];

    gsap.set(el, { y: 40 });
    const inTween = gsap.to(el, { opacity: 1, visibility: 'visible', y: 0, ease: 'power3.out', paused: true });
    triggers.push(ScrollTrigger.create({
      trigger: '#scroll-root', start: '17% top', end: '26% top', scrub: 1,
      onUpdate: s => inTween.progress(s.progress),
    }));

    triggers.push(ScrollTrigger.create({
      trigger: '#scroll-root', start: '22% top', once: true,
      onEnter: () => {
        if (counted.current) return;
        counted.current = true;
        STATS.forEach((stat, i) => {
          const numEl = cardRefs.current[i]?.querySelector('.snum');
          if (!numEl) return;
          const dec = stat.dec ?? 0;
          const obj = { val: 0 };
          gsap.to(obj, {
            val: stat.value, duration: 2.4, ease: 'power2.out', delay: i * 0.2,
            onUpdate() {
              numEl.textContent = dec
                ? obj.val.toFixed(dec) + stat.suffix
                : Math.round(obj.val).toLocaleString() + stat.suffix;
            },
          });
        });
      },
    }));

    const outTween = gsap.to(el, { opacity: 0, visibility: 'hidden', y: -30, ease: 'power2.in', paused: true });
    triggers.push(ScrollTrigger.create({
      trigger: '#scroll-root', start: '38% top', end: '44% top', scrub: 1,
      onUpdate: s => outTween.progress(s.progress),
    }));

    return () => triggers.forEach(t => t.kill());
  }, []);

  return (
    <div ref={ref} style={BASE}>
      {/* Light backdrop */}
      <div className="light-page-overlay" />

      <div style={{ width: '100%', maxWidth: '1100px', position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>

        {/* ── Section header ── */}
        <div style={{ textAlign: 'center', marginBottom: 'clamp(28px, 4vh, 44px)' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '16px' }}>
            <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, transparent, rgba(21,128,61,0.4))' }} />
            <span style={{
              fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700,
              letterSpacing: '0.2em', textTransform: 'uppercase', color: '#15803D',
            }}>The Agricultural Carbon Crisis</span>
            <div style={{ height: '1px', width: '40px', background: 'linear-gradient(90deg, rgba(21,128,61,0.4), transparent)' }} />
          </div>

          <h2 style={{
            fontFamily: 'Cormorant Garamond, serif',
            fontSize: 'clamp(32px, 4.5vw, 56px)',
            fontWeight: 700, lineHeight: 1.06, letterSpacing: '-0.03em',
            color: '#052E16', margin: '0 0 14px',
          }}>
            Why Soil Carbon<br />
            <em style={{
              background: 'linear-gradient(135deg, #166534, #22C55E)',
              WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>Matters</em>
          </h2>

          <p style={{
            fontFamily: 'Inter, sans-serif', color: '#4B6357',
            fontSize: 'clamp(13px, 1.3vw, 15px)',
            maxWidth: '480px', margin: '0 auto', lineHeight: 1.72,
          }}>
            The numbers behind why regenerative agriculture is the most scalable, cost-effective climate solution available today.
          </p>
        </div>

        {/* ── Stat cards ── */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))',
          gap: '16px', marginBottom: '20px',
        }}>
          {STATS.map((stat, i) => (
            <div
              key={i}
              ref={el => { cardRefs.current[i] = el; }}
              style={{
                padding: 'clamp(22px, 3vw, 34px)',
                background: stat.bg,
                border: `1px solid ${stat.border}30`,
                borderTop: `3px solid ${stat.border}`,
                borderRadius: '20px',
                boxShadow: '0 4px 24px rgba(5,46,22,0.08), 0 1px 4px rgba(5,46,22,0.05)',
              }}
            >
              {/* Icon */}
              <div style={{
                width: '44px', height: '44px', borderRadius: '12px',
                background: `${stat.accent}12`,
                border: `1px solid ${stat.accent}25`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '20px', marginBottom: '18px',
              }}>{stat.icon}</div>

              {/* Number */}
              <div className="snum" style={{
                fontFamily: 'Cormorant Garamond, serif',
                fontSize: 'clamp(34px, 4vw, 52px)',
                fontWeight: 700, color: stat.accent,
                lineHeight: 1, marginBottom: '10px',
                letterSpacing: '-0.03em',
              }}>
                {stat.dec ? `0.00${stat.suffix}` : `0${stat.suffix}`}
              </div>

              {/* Label */}
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '13px', fontWeight: 700,
                color: '#1A2E22', marginBottom: '8px', letterSpacing: '-0.01em',
              }}>{stat.label}</div>

              {/* Detail */}
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '12px', color: '#4B6357',
                lineHeight: 1.65, marginBottom: stat.rate ? '14px' : '18px',
              }}>{stat.detail}</div>

              {/* Rate-of-change badge (only on stats that have a rate) */}
              {stat.rate && (
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '10px 14px',
                  background: `${stat.accent}09`,
                  border: `1px solid ${stat.accent}22`,
                  borderRadius: '10px',
                  marginBottom: '14px',
                }}>
                  <div style={{
                    fontFamily: 'Cormorant Garamond, serif',
                    fontSize: '22px', fontWeight: 700,
                    color: stat.accent, lineHeight: 1, flexShrink: 0,
                  }}>{stat.rate}</div>
                  <div>
                    <div style={{
                      fontFamily: 'Inter, sans-serif', fontSize: '11px',
                      fontWeight: 600, color: '#1A2E22', lineHeight: 1.4,
                    }}>{stat.rateLabel}</div>
                    <div style={{
                      fontFamily: 'Inter, sans-serif', fontSize: '9px',
                      color: '#8A9F95', letterSpacing: '0.04em', marginTop: '2px',
                    }}>{stat.rateSrc}</div>
                  </div>
                </div>
              )}

              {/* Source badge */}
              <div style={{
                display: 'inline-flex', alignItems: 'center', gap: '6px',
                padding: '4px 12px',
                background: `${stat.accent}10`,
                border: `1px solid ${stat.accent}22`,
                borderRadius: '100px',
                fontSize: '9px', fontWeight: 700, color: stat.accent,
                fontFamily: 'Inter, sans-serif',
                letterSpacing: '0.06em', textTransform: 'uppercase',
              }}>
                <svg width="8" height="8" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z"/>
                </svg>
                {stat.src}
              </div>
            </div>
          ))}
        </div>

        {/* ── Opportunity callout ── */}
        <div style={{
          padding: 'clamp(18px, 2.5vw, 26px)',
          background: 'rgba(255,249,235,0.97)',
          border: '1px solid rgba(202,138,4,0.2)',
          borderLeft: '4px solid #CA8A04',
          borderRadius: '16px',
          display: 'flex', gap: '16px', alignItems: 'flex-start',
        }}>
          <div style={{
            width: '38px', height: '38px', borderRadius: '11px', flexShrink: 0,
            background: 'rgba(202,138,4,0.12)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '18px',
          }}>💡</div>
          <div>
            <div style={{
              fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700,
              color: '#92400E', marginBottom: '6px', letterSpacing: '0.02em',
            }}>The Opportunity</div>
            <p style={{
              fontFamily: 'Inter, sans-serif', fontSize: '13px',
              color: '#78350F', lineHeight: 1.7, margin: 0,
            }}>
              Restoring soil carbon in 2.5 billion degraded hectares could sequester the equivalent of decades of atmospheric CO₂ accumulation — economically viable and immediately beneficial for farm productivity.{' '}
              <strong style={{ color: '#92400E' }}>AgriCarbon helps you quantify exactly how much your land can contribute.</strong>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
