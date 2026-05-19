import { useEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

function Sym({ s }) {
  const [base, sub] = s.split('_');
  return sub
    ? <span>{base}<sub style={{ fontSize: '0.72em' }}>{sub}</sub></span>
    : <span>{s}</span>;
}

const FACTORS = [
  {
    sym: 'SOC_ref',
    name: 'Reference SOC',
    desc: 'Native soil organic carbon stock for the climate zone (t C ha⁻¹, 0–30 cm depth). From IPCC Table 2.3.',
    accent: '#15803D',
    border: '#22C55E',
    bg: 'rgba(240,253,244,0.97)',
    icon: '🌿',
  },
  {
    sym: 'F_LU',
    name: 'Land-Use Factor',
    desc: 'Adjusts for crop type vs. native vegetation. Annual crops = 1.00 (reference baseline).',
    accent: '#166534',
    border: '#4ADE80',
    bg: 'rgba(247,254,231,0.97)',
    icon: '🌾',
  },
  {
    sym: 'F_MG',
    name: 'Management Factor',
    desc: 'Reflects tillage intensity. No-till reaches 1.23 in cool temperate moist zones.',
    accent: '#92400E',
    border: '#D97706',
    bg: 'rgba(255,251,235,0.97)',
    icon: '⚙️',
  },
  {
    sym: 'F_IN',
    name: 'Input Factor',
    desc: 'Organic amendment level. High + manure = 1.17; low residue removal = 0.92.',
    accent: '#9A3412',
    border: '#F97316',
    bg: 'rgba(255,247,237,0.97)',
    icon: '🌱',
  },
];

const STEPS = [
  { n: '01', label: 'Select climate zone', detail: 'Choose from 8 IPCC global climate classifications' },
  { n: '02', label: 'Define baseline practice', detail: 'Your current tillage, crop type, and organic input level' },
  { n: '03', label: 'Set intervention scenario', detail: 'The practice change you plan to implement' },
  { n: '04', label: 'Calculate carbon delta', detail: 'ΔSOC × 3.667 × area × years = CO₂e sequestered' },
];

const BASE = {
  position: 'fixed', inset: 0, width: '100vw', height: '100vh',
  zIndex: 10, pointerEvents: 'none',
  display: 'flex', alignItems: 'center', justifyContent: 'center',
  padding: '0 4vw',
  opacity: 0, visibility: 'hidden',
};

export default function MethodologyOverlay() {
  const ref = useRef();

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const triggers = [];

    gsap.set(el, { y: 40 });
    const inTween = gsap.to(el, { opacity: 1, visibility: 'visible', y: 0, ease: 'power3.out', paused: true });
    triggers.push(ScrollTrigger.create({
      trigger: '#scroll-root', start: '37% top', end: '46% top', scrub: 1,
      onUpdate: s => inTween.progress(s.progress),
    }));

    const outTween = gsap.to(el, { opacity: 0, visibility: 'hidden', y: -30, ease: 'power2.in', paused: true });
    triggers.push(ScrollTrigger.create({
      trigger: '#scroll-root', start: '57% top', end: '63% top', scrub: 1,
      onUpdate: s => outTween.progress(s.progress),
    }));

    return () => triggers.forEach(t => t.kill());
  }, []);

  return (
    <div ref={ref} style={BASE}>
      {/* Light backdrop */}
      <div className="light-page-overlay" />

      <div style={{ width: '100%', maxWidth: '1060px', position: 'relative', zIndex: 1, pointerEvents: 'auto' }}>

        {/* ── Two-column layout ── */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '20px', marginBottom: '20px' }}>

          {/* Left: header + formula */}
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '20px' }}>
              <div style={{ height: '1px', width: '32px', background: 'linear-gradient(90deg, transparent, rgba(21,128,61,0.5))' }} />
              <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.2em', textTransform: 'uppercase', color: '#15803D' }}>
                The Science — IPCC 2006 Vol. 4, Ch. 2
              </span>
            </div>

            <h2 style={{
              fontFamily: 'Cormorant Garamond, serif',
              fontSize: 'clamp(30px, 4vw, 52px)',
              fontWeight: 700, lineHeight: 1.05, letterSpacing: '-0.03em',
              color: '#052E16', margin: '0 0 16px',
            }}>
              Tier 1<br />
              <em style={{
                background: 'linear-gradient(135deg, #166534, #22C55E)',
                WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
              }}>Methodology</em>
            </h2>

            <p style={{
              fontFamily: 'Inter, sans-serif',
              fontSize: 'clamp(12px, 1.2vw, 14px)', color: '#4B6357',
              lineHeight: 1.75, margin: '0 0 24px', maxWidth: '400px',
            }}>
              Every estimate is anchored to published IPCC global default coefficients — the gold standard for national greenhouse gas inventories since 2006.
            </p>

            {/* Formula box */}
            <div style={{
              background: 'rgba(240,253,244,0.97)',
              border: '1px solid rgba(21,128,61,0.15)',
              borderLeft: '3px solid #15803D',
              borderRadius: '14px', padding: '22px 24px',
              marginBottom: '20px',
              boxShadow: '0 2px 12px rgba(5,46,22,0.06)',
            }}>
              <div style={{
                fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700,
                letterSpacing: '0.2em', textTransform: 'uppercase',
                color: '#15803D', marginBottom: '14px',
              }}>Core Formula — IPCC Tier 1</div>

              <div style={{
                fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
                fontSize: 'clamp(12px, 1.4vw, 15px)',
                color: '#052E16', lineHeight: 2.2, fontWeight: 500,
              }}>
                <span style={{ color: '#15803D', fontWeight: 600 }}>ΔSOC</span>
                <span style={{ color: 'rgba(5,46,22,0.4)' }}> = (</span>
                <span style={{ color: '#92400E' }}>SOC<sub>ref</sub> × F<sub>LU</sub> × F<sub>MG</sub> × F<sub>IN</sub></span>
                <span style={{ color: 'rgba(5,46,22,0.4)' }}>) − SOC<sub style={{ color: 'rgba(5,46,22,0.4)' }}>ref</sub></span>
              </div>

              <div style={{
                fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
                fontSize: 'clamp(11px, 1.1vw, 13px)',
                color: 'rgba(5,46,22,0.45)', lineHeight: 2.0, marginTop: '6px',
              }}>
                {'CO₂e = (ΔSOC'}
                <sub>scenario</sub>
                {' − ΔSOC'}
                <sub>baseline</sub>
                {') × '}
                <span style={{ color: '#92400E', fontWeight: 600 }}>3.667</span>
                {'  ·  max '}
                <span style={{ color: '#15803D', fontWeight: 600 }}>20 years</span>
              </div>
            </div>

            {/* How it works — 4 steps */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {STEPS.map((s, i) => (
                <div key={i} style={{
                  display: 'flex', alignItems: 'center', gap: '14px',
                  padding: '12px 16px',
                  background: 'rgba(255,255,255,0.8)',
                  border: '1px solid rgba(21,128,61,0.1)',
                  borderRadius: '10px',
                }}>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
                    fontSize: '12px', fontWeight: 600, color: '#15803D',
                    opacity: 0.7, flexShrink: 0, minWidth: '24px',
                  }}>{s.n}</div>
                  <div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#1A2E22', marginBottom: '2px' }}>{s.label}</div>
                    <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4B6357', lineHeight: 1.5 }}>{s.detail}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Right: factor cards */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <div style={{ marginBottom: '4px' }}>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.18em', textTransform: 'uppercase', color: '#8A9F95' }}>
                IPCC Factor Reference
              </div>
            </div>

            {FACTORS.map((f) => (
              <div key={f.sym} style={{
                padding: '16px 18px',
                background: f.bg,
                border: `1px solid ${f.border}30`,
                borderLeft: `3px solid ${f.border}`,
                borderRadius: '14px',
                display: 'flex', gap: '14px', alignItems: 'flex-start',
                boxShadow: '0 2px 10px rgba(5,46,22,0.06)',
              }}>
                <div style={{
                  width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
                  background: `${f.accent}12`,
                  border: `1px solid ${f.accent}20`,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '16px',
                }}>{f.icon}</div>
                <div>
                  <div style={{
                    fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
                    fontSize: '13px', fontWeight: 600, color: f.accent,
                    marginBottom: '3px', letterSpacing: '-0.02em',
                  }}><Sym s={f.sym} /></div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '12px', fontWeight: 700, color: '#1A2E22', marginBottom: '4px' }}>{f.name}</div>
                  <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#4B6357', lineHeight: 1.6 }}>{f.desc}</div>
                </div>
              </div>
            ))}

            {/* Limitations notice */}
            <div style={{
              padding: '14px 18px',
              background: 'rgba(255,251,235,0.97)',
              border: '1px solid rgba(202,138,4,0.2)',
              borderLeft: '3px solid #CA8A04',
              borderRadius: '12px',
              display: 'flex', gap: '10px', alignItems: 'flex-start',
            }}>
              <span style={{ color: '#D97706', fontSize: '14px', flexShrink: 0 }}>⚠</span>
              <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', color: '#78350F', lineHeight: 1.65, margin: 0 }}>
                Tier 1 uses global default coefficients for national-scale screening. Tier 2 or 3 with local soil sampling is required for project-level carbon credit certification (Verra VCS, Gold Standard).
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
