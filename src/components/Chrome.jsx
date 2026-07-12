import { useEffect, useState } from 'react';

const DECIDE_LINKS = [
  { href: '#map',       label: 'The map' },
  { href: '#field',     label: 'My field' },
  { href: '#decide',    label: 'Net return' },
  { href: '#costshare', label: 'USDA money' },
  { href: '#matrix',    label: 'Contracts' },
  { href: '#checker',   label: 'Red flags' },
];

const METHOD_LINKS = [
  { href: '#validation', label: 'Validation' },
  { href: '#evidence',   label: 'Limitations' },
  { href: '#sources',    label: 'Sources' },
];

/**
 * The mark: a soil profile in section, filled about two-thirds.
 *
 * It is the argument of the whole site in one glyph. Soil is a container with a finite capacity,
 * and the only question that matters is how much room is left in yours. The line at the top is the
 * ground surface; the pale band beneath it is headroom — the space a carbon contract is really
 * selling you; the solid bands are carbon already held.
 *
 * Deliberately not a leaf, a globe, or a pair of hands cupping soil. Every carbon company uses
 * those, and looking like one of them is the fastest way to lose a farmer's trust.
 */
export function Mark({ size = 28 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 32 32" aria-hidden="true" style={{ flexShrink: 0, display: 'block' }}>
      <rect width="32" height="32" rx="7" fill="var(--green-900)" />
      <rect x="6" y="7.5" width="20" height="1.6" rx="0.8" fill="#FAFAF9" />
      <rect x="6" y="12" width="20" height="4.2" rx="1.2" fill="#FAFAF9" opacity="0.26" />
      <rect x="6" y="17.6" width="20" height="3.6" rx="1.2" fill="#4ADE80" />
      <rect x="6" y="22.6" width="20" height="3.6" rx="1.2" fill="#22C55E" />
    </svg>
  );
}

export function Nav({ view = 'decide', onNavigate }) {
  const [scrolled, setScrolled] = useState(false);
  const links = view === 'method' ? METHOD_LINKS : DECIDE_LINKS;

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  return (
    <nav
      style={{
        position: 'sticky', top: 0, zIndex: 30,
        background: 'rgba(255,255,255,0.92)',
        backdropFilter: 'saturate(180%) blur(12px)',
        WebkitBackdropFilter: 'saturate(180%) blur(12px)',
        borderBottom: `1px solid ${scrolled ? 'var(--rule)' : 'transparent'}`,
        transition: 'border-color 0.2s',
      }}
    >
      <div
        className="wrap"
        style={{ display: 'flex', alignItems: 'center', gap: 16, height: 58 }}
      >
        <button
          onClick={() => onNavigate?.('decide')}
          style={{
            display: 'flex', alignItems: 'center', gap: 10,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <Mark size={28} />
          <span style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', lineHeight: 1 }}>
            <span style={{
              fontWeight: 800, fontSize: 15.5, color: 'var(--ink)',
              letterSpacing: '-0.025em',
            }}>
              Ground Truth
            </span>
            <span className="tiny" style={{
              color: 'var(--soil-500)', fontWeight: 600, letterSpacing: '0.03em',
              marginTop: 2, whiteSpace: 'nowrap',
            }}>
              Carbon contracts, checked
            </span>
          </span>
        </button>

        {/* minWidth:0 lets this flex item shrink; without it the link row pushes the page sideways. */}
        <div style={{
          display: 'flex', gap: 4, marginLeft: 'auto', alignItems: 'center',
          overflowX: 'auto', minWidth: 0,
          scrollbarWidth: 'none', msOverflowStyle: 'none',
        }}>
          {links.map(l => (
            <a
              key={l.href}
              href={l.href}
              className="small"
              style={{
                padding: '6px 11px', borderRadius: 6, whiteSpace: 'nowrap',
                color: 'var(--soil-600)', textDecoration: 'none', fontWeight: 550,
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'var(--soil-100)'; e.currentTarget.style.color = 'var(--ink)'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'transparent'; e.currentTarget.style.color = 'var(--soil-600)'; }}
            >
              {l.label}
            </a>
          ))}

          {/* The tab switch. Kept visually distinct from the in-page anchors, because it changes
              what you are looking at rather than where you are within it. */}
          <button
            onClick={() => onNavigate?.(view === 'method' ? 'decide' : 'method')}
            className="small"
            style={{
              marginLeft: 6, padding: '6px 12px', borderRadius: 6, whiteSpace: 'nowrap',
              cursor: 'pointer', fontWeight: 650,
              border: `1px solid ${view === 'method' ? 'var(--green-700)' : 'var(--soil-300)'}`,
              background: view === 'method' ? 'var(--green-50)' : 'transparent',
              color: view === 'method' ? 'var(--green-900)' : 'var(--soil-700)',
              fontFamily: 'var(--font-sans)',
            }}
          >
            {view === 'method' ? '← The tool' : 'Methodology'}
          </button>
        </div>
      </div>
    </nav>
  );
}

export function Footer({ onMethodology }) {
  return (
    <footer style={{ background: 'var(--soil-900)', color: 'var(--soil-300)', padding: '52px 0 34px' }}>
      <div className="wrap">
        <div
          className="grid"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 32, marginBottom: 32 }}
        >
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 10 }}>
              <Mark size={26} />
              <span style={{ fontWeight: 800, fontSize: 16.5, color: '#fff', letterSpacing: '-0.025em' }}>
                Ground Truth
              </span>
            </div>
            <p className="small" style={{ margin: '0 0 10px', color: 'var(--soil-400)', maxWidth: '38ch' }}>
              An independent, non-commercial decision tool for US farmers weighing agricultural carbon
              contracts. We sell nothing, broker nothing, and take no commission from any program listed here.
            </p>
            {onMethodology && (
              <button
                onClick={onMethodology}
                className="small"
                style={{
                  background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                  color: 'var(--green-600)', fontFamily: 'var(--font-sans)', fontWeight: 600,
                  textDecoration: 'underline', textUnderlineOffset: 2,
                }}
              >
                Methodology &amp; validation →
              </button>
            )}
          </div>

          <div>
            <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--soil-500)', marginBottom: 10 }}>
              Built by
            </div>
            <div style={{ fontWeight: 650, color: '#fff', fontSize: 14.5 }}>
              Chandra Prakash Choudhary
            </div>
            <p className="small" style={{ margin: '3px 0 8px', color: 'var(--soil-400)' }}>
              Graduate Student, Dept. of Environmental Health &amp; Engineering<br />
              Johns Hopkins University
            </p>
            <a href="mailto:cpchoudhary2024@gmail.com" className="small" style={{ color: 'var(--green-600)' }}>
              cpchoudhary2024@gmail.com
            </a>
          </div>

          <div>
            <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--soil-500)', marginBottom: 10 }}>
              Go to the primary sources
            </div>
            <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
              {[
                ['USDA NRCS payment schedules', 'https://www.nrcs.usda.gov/getting-assistance/payment-schedules'],
                ['Find your NRCS service center', 'https://www.nrcs.usda.gov/contact/find-a-service-center'],
                ['Ag Data Transparent', 'https://www.agdatatransparent.com/ag-carbon-verified'],
                ['SARE Cover Crop Economics', 'https://www.sare.org/publications/cover-crop-economics/'],
              ].map(([label, href]) => (
                <li key={href} style={{ marginBottom: 6 }}>
                  <a href={href} target="_blank" rel="noopener noreferrer" className="small" style={{ color: 'var(--soil-300)' }}>
                    {label} ↗
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </div>

        <div style={{ borderTop: '1px solid var(--soil-800)', paddingTop: 22 }}>
          <p className="tiny" style={{ margin: '0 0 10px', color: 'var(--soil-500)', maxWidth: '95ch' }}>
            <strong style={{ color: 'var(--soil-400)' }}>Not financial, legal, or agronomic advice.</strong>{' '}
            This is a planning tool built on published ranges, and it will not tell you what your specific
            field will do. Carbon contracts are binding legal agreements with multi-year obligations — have a
            lawyer read one before you sign it. Confirm all USDA payment rates with your own state NRCS office,
            because they are set per-state and revised annually.
          </p>
          <p className="tiny" style={{ margin: 0, color: 'var(--soil-600)' }}>
            Program terms last checked 11 July 2026. Terms change; verify before relying on anything here.
          </p>
        </div>
      </div>
    </footer>
  );
}
