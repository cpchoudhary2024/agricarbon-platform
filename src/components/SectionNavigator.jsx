import { useEffect, useRef, useState } from 'react';

const SECTIONS = [
  { id: 'hero',        label: 'Overview',     icon: '🌾', pct: 0.02 },
  { id: 'stats',       label: 'Impact',       icon: '📊', pct: 0.22 },
  { id: 'methodology', label: 'Methodology',  icon: '⚗️',  pct: 0.42 },
  { id: 'calculator',  label: 'Calculator',   icon: '🧮', pct: 0.62 },
  { id: 'testreport',  label: 'Lab Report',   icon: '🔬', pct: 0.85 },
];

export default function SectionNavigator() {
  const [progress, setProgress] = useState(0);
  const [active,   setActive]   = useState(0);
  const [expanded, setExpanded] = useState(false);
  const rafRef = useRef();

  useEffect(() => {
    const update = () => {
      const root = document.getElementById('scroll-root');
      if (!root) return;
      const max = root.offsetHeight - window.innerHeight;
      const p   = Math.max(0, Math.min(1, window.scrollY / max));
      setProgress(p);

      let nearest = 0, best = Infinity;
      SECTIONS.forEach((s, i) => {
        const d = Math.abs(p - s.pct);
        if (d < best) { best = d; nearest = i; }
      });
      setActive(nearest);
    };
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(update);
    };
    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    window.addEventListener('resize', update);
    return () => {
      window.removeEventListener('scroll', onScroll);
      window.removeEventListener('resize', update);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  const jumpTo = (pct) => {
    const root = document.getElementById('scroll-root');
    if (!root) return;
    const max = root.offsetHeight - window.innerHeight;
    window.scrollTo({ top: max * pct, behavior: 'smooth' });
  };

  return (
    <>
      {/* ── Top progress bar ── */}
      <div style={{
        position: 'fixed', top: 0, left: 0, right: 0,
        height: '3px', zIndex: 1000, pointerEvents: 'none',
        background: 'rgba(21,82,51,0.15)',
      }}>
        <div style={{
          height: '100%',
          width: `${progress * 100}%`,
          background: 'linear-gradient(90deg, #155233, #22C55E, #CA8A04)',
          transition: 'width 0.1s linear',
          boxShadow: '0 0 10px rgba(34,197,94,0.5)',
        }} />
      </div>

      {/* ── Right-side section nav ── */}
      <nav
        aria-label="Section navigation"
        onMouseEnter={() => setExpanded(true)}
        onMouseLeave={() => setExpanded(false)}
        style={{
          position: 'fixed', top: '50%', right: 'clamp(12px, 2vw, 28px)',
          transform: 'translateY(-50%)', zIndex: 1000,
          display: 'flex', flexDirection: 'column', gap: '4px',
          pointerEvents: 'auto',
        }}
      >
        {SECTIONS.map((s, i) => {
          const isActive = i === active;
          return (
            <button
              key={s.id}
              onClick={() => jumpTo(s.pct)}
              aria-label={`Jump to ${s.label}`}
              title={s.label}
              style={{
                display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
                gap: '8px', background: 'none', border: 'none', cursor: 'pointer',
                padding: '4px 0', paddingRight: '0',
              }}
            >
              {/* Label — visible on hover or when expanded */}
              <span style={{
                fontFamily: 'Inter, sans-serif',
                fontSize: '10px', fontWeight: 700,
                letterSpacing: '0.08em', textTransform: 'uppercase',
                color: isActive ? '#FEFDF9' : 'rgba(254,253,249,0.8)',
                whiteSpace: 'nowrap',
                background: isActive
                  ? 'rgba(21,82,51,0.95)'
                  : 'rgba(5,46,22,0.78)',
                padding: '4px 10px', borderRadius: '6px',
                backdropFilter: 'blur(12px)',
                transition: 'all 0.25s cubic-bezier(0.16,1,0.3,1)',
                opacity: expanded || isActive ? 1 : 0,
                transform: expanded || isActive ? 'translateX(0)' : 'translateX(6px)',
                pointerEvents: 'none',
                boxShadow: isActive ? '0 2px 12px rgba(21,82,51,0.4)' : '0 1px 6px rgba(0,0,0,0.2)',
              }}>
                {s.icon} {s.label}
              </span>

              {/* Dot indicator */}
              <div style={{
                width:  isActive ? '32px' : '8px',
                height: '8px',
                borderRadius: '4px',
                background: isActive
                  ? 'linear-gradient(90deg, #22C55E, #15803D)'
                  : 'rgba(255,255,255,0.65)',
                transition: 'all 0.3s cubic-bezier(0.16,1,0.3,1)',
                boxShadow: isActive
                  ? '0 2px 12px rgba(34,197,94,0.5)'
                  : '0 1px 4px rgba(0,0,0,0.25)',
                flexShrink: 0,
              }} />
            </button>
          );
        })}

        {/* Progress percent */}
        <div style={{
          marginTop: '12px',
          textAlign: 'right',
          fontFamily: 'Inter, sans-serif', fontVariantNumeric: 'tabular-nums',
          fontSize: '9px', fontWeight: 600,
          color: 'rgba(240,253,244,0.35)',
          letterSpacing: '0.04em',
          transition: 'opacity 0.2s',
          opacity: expanded ? 1 : 0.6,
        }}>
          {Math.round(progress * 100)}%
        </div>
      </nav>
    </>
  );
}
