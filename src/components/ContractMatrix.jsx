import { useState, Fragment } from 'react';
import { PROGRAMS, MATRIX_ROWS, RISK_META } from '../data/programs';
import Cite from './Cite';
import Disclosure from './Disclosure';

/**
 * The Contract Risk Matrix.
 *
 * This is the artifact that does not exist anywhere else in public, and the reason
 * the project is worth building. Every carbon company publishes its rate card. None
 * of them will show you their termination clause next to a competitor's.
 */
export default function ContractMatrix() {
  const [openRow, setOpenRow] = useState(null);

  return (
    <section id="matrix" className="section" style={{ background: 'var(--paper)' }}>
      <div className="wrap">
        <p className="eyebrow">The contract risk matrix</p>
        <h2 style={{ marginBottom: 14 }}>What you&rsquo;re actually signing</h2>
        <p className="lede" style={{ marginBottom: 26 }}>
          Every one of these companies publishes what it will pay you. Not one of them publishes its
          termination clause next to a competitor&rsquo;s. So here they are, side by side.
          <strong style={{ color: 'var(--ink)' }}> Click any row</strong> to see why it matters.
        </p>

        <div className="callout callout--warn" style={{ marginBottom: 26 }}>
          <strong>Terms marked{' '}
            <span className="badge" style={{ background: RISK_META.unknown.bg, color: RISK_META.unknown.color }}>
              Not published
            </span>{' '}
            are not our oversight.</strong> They are genuinely absent from the company&rsquo;s public
          materials, and we refuse to guess. A term that is not written down is not a promise — the
          blanks below are the questions to put to a rep <em>in writing</em>.<Cite src="flagCarbonContracts" />
        </div>

        <div className="table-scroll card card--flush">
          <table className="matrix">
            <thead>
              <tr>
                <th>Term</th>
                {PROGRAMS.map(p => (
                  <th key={p.id} style={{ minWidth: 190 }}>
                    <div style={{ fontWeight: 750, fontSize: 13.5, color: 'var(--ink)' }}>{p.name}</div>
                    <div className="tiny muted" style={{ fontWeight: 400, marginTop: 1 }}>{p.operator}</div>
                    <div style={{ marginTop: 6 }}>
                      {p.independentlyVerified ? (
                        <span className="badge" style={{ background: 'rgba(124,58,237,0.12)', color: 'var(--purple-700)' }}>
                          ✓ Independently verified
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(180,83,9,0.12)', color: 'var(--amber-700)' }}>
                          Self-reported only
                        </span>
                      )}
                    </div>
                  </th>
                ))}
              </tr>
            </thead>

            <tbody>
              {MATRIX_ROWS.map(row => {
                const open = openRow === row.key;
                return (
                  <Fragment key={row.key}>
                    <tr
                      onClick={() => setOpenRow(open ? null : row.key)}
                      style={{ cursor: 'pointer' }}
                    >
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
                          <span style={{
                            fontSize: 10, color: 'var(--soil-400)',
                            transform: open ? 'rotate(90deg)' : 'none',
                            transition: 'transform 0.15s', display: 'inline-block',
                          }}>▶</span>
                          <span style={{ fontWeight: 650, color: 'var(--ink)' }}>{row.label}</span>
                        </div>
                      </td>

                      {PROGRAMS.map(p => {
                        const cell = p[row.key];
                        const risk = RISK_META[cell.risk] ?? RISK_META.unknown;
                        return (
                          <td key={p.id}>
                            <span className="badge" style={{ background: risk.bg, color: risk.color, marginBottom: 5 }}>
                              {risk.label}
                            </span>
                            <div style={{
                              fontWeight: 600, fontSize: 13,
                              color: cell.risk === 'unknown' ? 'var(--soil-500)' : 'var(--ink)',
                              fontStyle: cell.risk === 'unknown' ? 'italic' : 'normal',
                            }}>
                              {cell.value}
                            </div>
                          </td>
                        );
                      })}
                    </tr>

                    {open && (
                      <tr>
                        <td style={{ background: 'var(--soil-50)' }}>
                          <div className="tiny" style={{ fontWeight: 700, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.06em', marginBottom: 5 }}>
                            Why this matters
                          </div>
                          <div className="small" style={{ color: 'var(--soil-700)' }}>{row.why}</div>
                        </td>
                        {PROGRAMS.map(p => (
                          <td key={p.id} style={{ background: 'var(--soil-50)' }}>
                            <div className="small" style={{ color: 'var(--soil-700)' }}>
                              {p[row.key].detail}
                            </div>
                          </td>
                        ))}
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>

        {/* Source strip */}
        <div style={{
          display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 18,
          paddingTop: 16, borderTop: '1px solid var(--rule)',
        }}>
          {PROGRAMS.map(p => (
            <div key={p.id} className="tiny muted">
              <strong style={{ color: 'var(--soil-700)' }}>{p.name}</strong>{' '}
              <Cite src={p.src} />
              {p.verifiedBy && <> · verification <Cite src={p.verifiedBy} /></>}
            </div>
          ))}
        </div>

        {/* The three things that actually decide this. Kept, but folded — the table above already
            says all of it row by row, and repeating it at full volume just adds scrolling. */}
        <div className="card" style={{ marginTop: 22 }}>
          <Disclosure summary="The three things that actually decide this" defaultOpen={false}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: 18 }}>
              <div>
                <strong style={{ display: 'block', marginBottom: 5, color: 'var(--ink)' }}>
                  Per-acre vs per-ton is the real fork
                </strong>
                A flat per-acre program (Bayer, ~$12/ac) pays less but pays you <em>regardless of what
                the soil does</em>. A per-ton program pays more on paper — but if your soil does not test
                as sequestering you get nothing, having already spent the money. You are choosing who
                carries the measurement risk.
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: 5, color: 'var(--ink)' }}>
                  The headline price is never the price
                </strong>
                A &ldquo;$40/ton&rdquo; offer is not $40/ton. Take off the aggregator&rsquo;s cut (Indigo
                keeps 25%) and the buffer holdback (~20% of credits withheld unpaid). $40 becomes about
                $24. Compare <em>that</em> against a per-acre offer.
              </div>
              <div>
                <strong style={{ display: 'block', marginBottom: 5, color: 'var(--ink)' }}>
                  Ten years is a very long time
                </strong>
                Agoro&rsquo;s commitment outlasts most cash-rent agreements and many equipment notes. On
                rented ground you are promising something you may not control. Get the landlord in
                writing first.
              </div>
            </div>
          </Disclosure>
        </div>
      </div>
    </section>
  );
}
