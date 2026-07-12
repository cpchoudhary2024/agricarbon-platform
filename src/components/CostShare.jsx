import { useState } from 'react';
import { COST_SHARE_PROGRAMS, STACKING_RULES } from '../data/costShare';
import { STATE_SCHEDULES, scheduleFor } from '../data/stateSchedules';
import Cite from './Cite';
import Disclosure from './Disclosure';

/**
 * The section that will save readers the most money.
 *
 * USDA pays $34–75/ac for cover crops. A carbon program pays $6–12/ac for the same
 * cover crops. Most farmers evaluate the carbon offer — because someone called them
 * about it — and never evaluate the one that pays five times more, because nobody's
 * commission depends on them hearing about it.
 */
export default function CostShare() {
  const { eqip, csp } = COST_SHARE_PROGRAMS;
  const [state, setState] = useState('');
  const picked = state ? scheduleFor(state) : null;

  return (
    <section id="costshare" className="section">
      <div className="wrap">
        <p className="eyebrow">Check this first</p>
        <h2 style={{ marginBottom: 14 }}>USDA probably pays you more</h2>
        <p className="lede" style={{ marginBottom: 32 }}>
          A carbon program pays roughly <strong className="mono">$6&ndash;12/ac</strong> for cover crops.
          USDA EQIP pays <strong className="mono">$34&ndash;75/ac</strong><Cite src="nrcsPaymentSchedules" /> for
          the same cover crops — with a shorter commitment and no 100-year permanence obligation.
          Nobody earns a commission telling you this, which is roughly why you haven&rsquo;t been told.
        </p>

        {/* The comparison that makes the point */}
        <div className="card" style={{ marginBottom: 28, padding: 0, overflow: 'hidden' }}>
          <div className="split-2">
            <div style={{ padding: '26px 28px', borderRight: '1px solid var(--rule)' }}>
              <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--amber-700)', marginBottom: 8 }}>
                Carbon program
              </div>
              <div className="mono" style={{ fontSize: 34, fontWeight: 700, color: 'var(--soil-700)', letterSpacing: '-0.02em' }}>
                $6–12<span style={{ fontSize: 16, fontWeight: 500 }}>/ac</span>
              </div>
              <p className="small muted" style={{ margin: '10px 0 0' }}>
                Bayer ForGround, flat rate.<Cite src="bayerForGround" /> Commitment: 5 years, renewable up
                to three times. Permanence obligations apply.
              </p>
            </div>

            <div style={{ padding: '26px 28px', background: 'var(--green-50)' }}>
              <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-700)', marginBottom: 8 }}>
                USDA EQIP — same practice
              </div>
              <div className="mono" style={{ fontSize: 34, fontWeight: 700, color: 'var(--green-900)', letterSpacing: '-0.02em' }}>
                $34–75<span style={{ fontSize: 16, fontWeight: 500 }}>/ac</span>
              </div>
              <p className="small" style={{ margin: '10px 0 0', color: '#166534' }}>
                Cover crop practice 340.<Cite src="nrcsPaymentSchedules" /> Rate is set by your state.
                No carbon permanence obligation, no buffer holdback, no aggregator taking a cut.
              </p>
            </div>
          </div>
        </div>

        {/* State picker — the one-click path to the authoritative number. */}
        <div className="card" style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', gap: 14, flexWrap: 'wrap', alignItems: 'flex-end' }}>
            <div style={{ flex: '1 1 240px', maxWidth: 300 }}>
              <label className="label" htmlFor="state-pick">
                Get your state&rsquo;s actual published rate
              </label>
              <select
                id="state-pick"
                className="input"
                value={state}
                onChange={(e) => setState(e.target.value)}
              >
                <option value="">Choose your state…</option>
                {STATE_SCHEDULES.map((s) => (
                  <option key={s.code} value={s.code}>{s.name}</option>
                ))}
              </select>
            </div>

            {picked && (
              <a
                href={picked.url}
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn--primary"
              >
                {picked.direct
                  ? `${picked.name} payment schedule ↗`
                  : `${picked.name} NRCS office ↗`}
              </a>
            )}
          </div>

          <p className="tiny muted" style={{ marginTop: 12, marginBottom: 0 }}>
            {picked && !picked.direct
              ? `${picked.name} does not publish a payment schedule at the standard NRCS path, so this ` +
                'goes to the state office instead — call them and ask for the current EQIP cost list.'
              : 'This is the authoritative source. The $34–75/ac figure above is the observed national ' +
                'spread and is an estimate; your state’s published schedule is the real number.'}
          </p>

          <Disclosure summary="Why don’t you just show me my state’s rate?" tone="warn">
            <p style={{ margin: '0 0 8px' }}>
              Because we would have to guess, and we will not put a number in front of you that we
              cannot stand behind.
            </p>
            <p style={{ margin: 0 }}>
              EQIP rates are set by each state office, revised every year, and published as hundreds of
              practice codes across PDFs and spreadsheets in a different format in every state.
              Scraping all 48 into a table would give you a number that looks precise, that we could not
              verify, and that would quietly go stale next year — which a farmer might then budget
              against. Refusing to do that is the same rule that governs every other figure on this
              site.<Cite src="nrcsPaymentSchedules" />
            </p>
          </Disclosure>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', marginBottom: 28 }}>
          <ProgramCard p={eqip} />
          <ProgramCard p={csp} />
        </div>

        {/* Stacking — the trap. The headline and the advice are always visible; the two lists are
            the reference material you consult once, so they fold away. */}
        <div className="card" style={{ padding: 26 }}>
          <h3 style={{ marginBottom: 6 }}>Can you take both?</h3>
          <p style={{ fontSize: 15, fontWeight: 600, color: 'var(--ink)', marginTop: 0, marginBottom: 16 }}>
            {STACKING_RULES.headline}<Cite src={STACKING_RULES.src} />
          </p>

          <div className="callout callout--good" style={{ marginBottom: 4 }}>
            <strong>The order of operations matters.</strong> {STACKING_RULES.advice}
          </div>

          <Disclosure summary={`What you can and can’t stack (${STACKING_RULES.allowed.length + STACKING_RULES.danger.length} rules)`}>
            <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: 18 }}>
              <div>
                <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-700)', marginBottom: 8 }}>
                  ✓ Generally allowed
                </div>
                <ul style={{ margin: 0, paddingLeft: 17 }}>
                  {STACKING_RULES.allowed.map((a, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{a}</li>
                  ))}
                </ul>
              </div>
              <div>
                <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--red-700)', marginBottom: 8 }}>
                  ✕ Where farmers get caught
                </div>
                <ul style={{ margin: 0, paddingLeft: 17 }}>
                  {STACKING_RULES.danger.map((d, i) => (
                    <li key={i} style={{ marginBottom: 6 }}>{d}</li>
                  ))}
                </ul>
              </div>
            </div>
          </Disclosure>
        </div>

        <div className="callout callout--info" style={{ marginTop: 20 }}>
          <strong>Deadline: 15 January.</strong> USDA now runs one national batching deadline for the
          first funding round of EQIP, CSP, ACEP and AMA.<Cite src="nrcsBatching2026" /> Only ~44% of
          applications get funded, so apply early.{' '}
          <a href="https://www.nrcs.usda.gov/contact/find-a-service-center" target="_blank" rel="noopener noreferrer">
            Find your NRCS service center ↗
          </a>
        </div>
      </div>
    </section>
  );
}

function ProgramCard({ p }) {
  return (
    <div className="card">
      <div style={{ display: 'flex', alignItems: 'baseline', gap: 8, marginBottom: 3, flexWrap: 'wrap' }}>
        <h3 style={{ fontSize: 17 }}>{p.name}</h3>
        <span className="tiny muted">{p.operator}</span>
      </div>
      <p className="small muted" style={{ marginTop: 0, marginBottom: 12 }}>{p.fullName}</p>

      {/* Lead with the one fact that changes a decision; the rest is reference. */}
      <p className="small" style={{ margin: '0 0 4px', color: 'var(--soil-800)', fontWeight: 550 }}>
        {p.keyFacts[0]}
      </p>

      <Disclosure summary={`${p.keyFacts.length - 1} more things to know`}>
        <ul style={{ margin: 0, paddingLeft: 17 }}>
          {p.keyFacts.slice(1).map((f, i) => (
            <li key={i} style={{ marginBottom: 6 }}>{f}</li>
          ))}
        </ul>
        <p className="tiny muted" style={{ marginTop: 10, marginBottom: 0 }}>
          {p.caveat}<Cite src={p.src} />
        </p>
      </Disclosure>
    </div>
  );
}
