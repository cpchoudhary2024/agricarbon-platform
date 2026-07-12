import { useState, useId } from 'react';

/**
 * Collapsible detail.
 *
 * This project has a tension baked into it: the honesty is the product, but honesty is wordy, and
 * a wall of caveats is its own kind of dishonesty — nobody reads it, so it might as well not be
 * there. The compromise is that the ANSWER is always visible and the REASONING is always one click
 * away, never deleted and never in the way.
 *
 * Everything here stays in the DOM, so it is searchable, printable and readable by a screen reader
 * whether or not it is expanded.
 */
export default function Disclosure({ summary, children, tone = 'default', defaultOpen = false }) {
  const [open, setOpen] = useState(defaultOpen);
  const id = useId();

  const color = {
    default: 'var(--soil-600)',
    warn: 'var(--amber-700)',
    danger: 'var(--red-700)',
    good: 'var(--green-700)',
  }[tone];

  return (
    <div style={{ marginTop: 12 }}>
      <button
        onClick={() => setOpen(o => !o)}
        aria-expanded={open}
        aria-controls={id}
        className="tiny"
        style={{
          display: 'inline-flex', alignItems: 'center', gap: 6,
          background: 'none', border: 'none', padding: 0, cursor: 'pointer',
          fontWeight: 700, letterSpacing: '0.03em', color,
          fontFamily: 'var(--font-sans)',
        }}
      >
        <span style={{
          display: 'inline-block', fontSize: 9,
          transform: open ? 'rotate(90deg)' : 'none',
          transition: 'transform 0.15s',
        }}>▶</span>
        {summary}
      </button>

      {open && (
        <div id={id} className="small" style={{
          marginTop: 9, paddingLeft: 15,
          borderLeft: `2px solid ${color}33`,
          color: 'var(--soil-700)',
        }}>
          {children}
        </div>
      )}
    </div>
  );
}
