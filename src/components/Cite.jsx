import { useState, useId } from 'react';
import { cite, TIER_LABELS } from '../data/sources';

/**
 * Inline citation marker.
 *
 * This little component is the backbone of the site's credibility. Every number
 * rendered anywhere carries one. Clicking it reveals the source, the evidential
 * tier, and — crucially — the caveat, because a citation without its caveat is
 * still a half-truth.
 *
 * `cite()` throws on an unknown key, so an uncited number cannot silently ship:
 * it breaks the page in development instead.
 */
export default function Cite({ src }) {
  const [open, setOpen] = useState(false);
  const id = useId();
  const s = cite(src);
  const tier = TIER_LABELS[s.tier];

  return (
    <span style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={id}
        title={`Source: ${s.org}`}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 15, height: 15,
          marginLeft: 3,
          verticalAlign: 'super',
          borderRadius: 3,
          border: 'none',
          cursor: 'pointer',
          background: open ? tier.color : 'var(--soil-200)',
          color: open ? '#fff' : 'var(--soil-600)',
          fontSize: 9,
          fontWeight: 800,
          lineHeight: 1,
          padding: 0,
          transition: 'all 0.15s',
        }}
      >
        i
      </button>

      {open && (
        <>
          {/* Click-away layer */}
          <span
            onClick={() => setOpen(false)}
            style={{ position: 'fixed', inset: 0, zIndex: 40 }}
          />
          <span
            id={id}
            role="tooltip"
            style={{
              position: 'absolute',
              bottom: 'calc(100% + 8px)',
              left: '50%',
              transform: 'translateX(-50%)',
              zIndex: 50,
              display: 'block',
              width: 'min(360px, 78vw)',
              background: 'var(--paper)',
              border: '1px solid var(--soil-300)',
              borderRadius: 8,
              boxShadow: '0 12px 32px rgba(28,25,23,0.16)',
              padding: 14,
              textAlign: 'left',
              fontSize: 12.5,
              lineHeight: 1.55,
              color: 'var(--soil-800)',
              fontWeight: 400,
              letterSpacing: 0,
            }}
          >
            <span
              className="badge"
              style={{ background: `${tier.color}18`, color: tier.color, marginBottom: 8 }}
            >
              {tier.label}
            </span>

            <span style={{ display: 'block', fontWeight: 700, marginBottom: 3, color: 'var(--ink)' }}>
              {s.title}
            </span>

            <span style={{ display: 'block', color: 'var(--muted)', fontSize: 11.5, marginBottom: 8 }}>
              {s.authors ? `${s.authors} — ` : ''}{s.org}{s.year ? `, ${s.year}` : ''}
            </span>

            {s.note && (
              <span style={{ display: 'block', marginBottom: 10, color: 'var(--soil-700)' }}>
                {s.note}
              </span>
            )}

            <span style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 8 }}>
              <a
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                style={{ fontSize: 12, fontWeight: 650 }}
              >
                View source ↗
              </a>
              <span className="tiny muted mono">checked {s.retrieved}</span>
            </span>
          </span>
        </>
      )}
    </span>
  );
}
