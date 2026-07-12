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
            display: 'flex', alignItems: 'center', gap: 9,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            textDecoration: 'none', flexShrink: 0,
          }}
        >
          <span style={{
            width: 26, height: 26, borderRadius: 6, flexShrink: 0,
            background: 'var(--green-900)', display: 'grid', placeItems: 'center',
          }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
              <path d="M12 22V8M12 8c0-3 2-6 6-6 0 4-2 6-6 6zM12 12c0-3-2-6-6-6 0 4 2 6 6 6z" />
            </svg>
          </span>
          <span style={{ fontWeight: 750, fontSize: 15, color: 'var(--ink)', letterSpacing: '-0.02em' }}>
            Ground Truth
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
            <div style={{ fontWeight: 750, fontSize: 16, color: '#fff', marginBottom: 8 }}>
              Ground Truth
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
