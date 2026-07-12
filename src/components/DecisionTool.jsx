import { useState, useMemo } from 'react';
import { PRACTICES, PRACTICE_LIST, CONFIDENCE_META } from '../data/practices';
import { computeNetReturn, ENGINE_PROGRAMS } from '../engine/netReturn';
import { COST_SHARE_PROGRAMS } from '../data/costShare';
import Cite from './Cite';
import Disclosure from './Disclosure';

const money = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toLocaleString('en-US', { maximumFractionDigits: 0 });
const money2 = (n) => (n < 0 ? '-' : '') + '$' + Math.abs(n).toFixed(2);

const TONE = {
  positive: { cls: 'callout--good',   icon: '✓' },
  caution:  { cls: 'callout--warn',   icon: '!' },
  negative: { cls: 'callout--danger', icon: '✕' },
  neutral:  { cls: 'callout--info',   icon: 'i' },
};

export default function DecisionTool() {
  const [practiceIds, setPracticeIds] = useState(['cover-crops']);
  const [programId, setProgramId]     = useState('bayer');
  const [acres, setAcres]             = useState(500);
  const [tonPrice, setTonPrice]       = useState(25);
  const [costShareEnrolled, setCostShare] = useState(true);
  const [underserved, setUnderserved] = useState(false);
  const [yieldChangePct, setYieldChange] = useState(0);
  const [grossRevenuePerAcre, setGross]  = useState(800);

  const program = ENGINE_PROGRAMS[programId];

  const result = useMemo(() => computeNetReturn({
    program,
    practiceIds,
    acres,
    tonPrice,
    farmerSharePct:    program.farmerSharePct ?? 1,
    bufferHoldbackPct: program.bufferHoldbackPct ?? 0,
    costShareEnrolled,
    underserved,
    yieldChangePct,
    grossRevenuePerAcre,
  }), [program, practiceIds, acres, tonPrice, costShareEnrolled, underserved, yieldChangePct, grossRevenuePerAcre]);

  const toggle = (id) =>
    setPracticeIds(p => p.includes(id) ? p.filter(x => x !== id) : [...p, id]);

  const tone = TONE[result.verdict.tone];
  const isPerTon = program.basis === 'per-ton';

  return (
    <section id="decide" className="section">
      <div className="wrap">
        <p className="eyebrow">The decision tool</p>
        <h2 style={{ marginBottom: 14 }}>What this actually pays on your ground</h2>
        <p className="lede" style={{ marginBottom: 40 }}>
          Every vendor calculator shows you <span className="mono">tons × price</span> and stops. This one
          subtracts what it costs you to get there — seed, planting, termination, and the yield hit during
          transition. Those subtractions are the whole point.
        </p>

        <div className="split-tool">

          {/* ── INPUTS ─────────────────────────────────────── */}
          <div className="card">
            <h3 style={{ marginBottom: 20, fontSize: 16 }}>Your operation</h3>

            <div className="field">
              <label className="label">Practices you&rsquo;re considering</label>
              <div className="grid" style={{ gap: 8 }}>
                {PRACTICE_LIST.map(id => {
                  const p = PRACTICES[id];
                  const on = practiceIds.includes(id);
                  const conf = CONFIDENCE_META[p.sequestration.confidence];
                  return (
                    <button key={id} className="chip" aria-pressed={on} onClick={() => toggle(id)}>
                      <span className="chip__box">
                        {on && (
                          <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
                            <polyline points="20 6 9 17 4 12" />
                          </svg>
                        )}
                      </span>
                      <span style={{ flex: 1 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 650, fontSize: 14 }}>{p.name}</span>
                          <span className="badge" style={{ background: `${conf.color}18`, color: conf.color }}>
                            {conf.label}
                          </span>
                        </span>
                        <span className="tiny muted" style={{ display: 'block', marginTop: 3 }}>
                          {p.blurb}
                        </span>
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="field">
              <label className="label" htmlFor="prog">Carbon program</label>
              <select id="prog" className="input" value={programId} onChange={e => setProgramId(e.target.value)}>
                {Object.values(ENGINE_PROGRAMS).map(p => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              <p className="tiny muted" style={{ marginTop: 6 }}>{program.note}</p>
            </div>

            <div className="field">
              <label className="label" htmlFor="acres">Acres enrolled</label>
              <input
                id="acres" type="number" className="input" min="1" max="50000" value={acres}
                onChange={e => setAcres(Math.max(1, Number(e.target.value) || 0))}
              />
            </div>

            {isPerTon && (
              <div className="field">
                <label className="label" htmlFor="price">
                  Carbon price — ${tonPrice}/ton headline
                </label>
                <input
                  id="price" type="range" min="10" max="100" step="1"
                  value={tonPrice} onChange={e => setTonPrice(Number(e.target.value))}
                />
                <p className="tiny muted" style={{ marginTop: 6 }}>
                  After {program.name}&rsquo;s{' '}
                  {program.farmerSharePct < 1 && <>{Math.round((1 - program.farmerSharePct) * 100)}% cut and </>}
                  {Math.round((program.bufferHoldbackPct ?? 0) * 100)}% buffer holdback, you actually receive{' '}
                  <strong className="mono">
                    ${(tonPrice * (program.farmerSharePct ?? 1) * (1 - (program.bufferHoldbackPct ?? 0))).toFixed(2)}/ton
                  </strong>.
                </p>
              </div>
            )}

            <div className="field">
              <label className="label" htmlFor="yield">
                Yield impact during transition — {yieldChangePct > 0 ? '+' : ''}{yieldChangePct}%
              </label>
              <input
                id="yield" type="range" min="-10" max="10" step="0.5"
                value={yieldChangePct} onChange={e => setYieldChange(Number(e.target.value))}
              />
              <p className="tiny muted" style={{ marginTop: 6 }}>
                The term no vendor calculator includes. Evidence is genuinely mixed — set it from
                your own ground.<Cite src="sareCoverCropEconomics" />
              </p>
            </div>

            <div className="field">
              <label className="label" htmlFor="gross">Gross crop revenue ($/ac)</label>
              <input
                id="gross" type="number" className="input" min="0" step="50" value={grossRevenuePerAcre}
                onChange={e => setGross(Math.max(0, Number(e.target.value) || 0))}
              />
              <p className="tiny muted" style={{ marginTop: 6 }}>
                Used only to price the yield impact above.
              </p>
            </div>

            <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 16 }}>
              <Check checked={costShareEnrolled} onChange={setCostShare} label="Include USDA cost-share (EQIP)" />
              <Check checked={underserved} onChange={setUnderserved} label="Beginning or underserved producer" hint="Raises the EQIP cost-share ceiling from 75% to 90%." />
            </div>
          </div>

          {/* ── RESULTS ────────────────────────────────────── */}
          <div className="grid" style={{ gap: 20 }}>

            {/* Verdict */}
            <div className={`callout ${tone.cls}`} style={{ padding: '18px 20px' }}>
              <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
                <span style={{
                  flexShrink: 0, width: 22, height: 22, borderRadius: 5,
                  display: 'grid', placeItems: 'center', fontWeight: 800, fontSize: 13,
                  background: 'currentColor', marginTop: 1,
                }}>
                  <span style={{ color: 'var(--paper)' }}>{tone.icon}</span>
                </span>
                <div>
                  <div style={{ fontWeight: 750, fontSize: 15.5, marginBottom: 4 }}>
                    {result.verdict.headline}
                  </div>
                  <div style={{ fontSize: 13.5 }}>{result.verdict.body}</div>
                </div>
              </div>
            </div>

            {/* Headline numbers */}
            <div className="card">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 4, flexWrap: 'wrap', gap: 8 }}>
                <h3 style={{ fontSize: 16 }}>Net return</h3>
                <span className="tiny muted">per acre per year · {acres.toLocaleString()} ac</span>
              </div>

              <div className="scenarios" style={{ marginTop: 16 }}>
                <Scenario
                  label="Pessimistic" sub="low sequestration, high cost"
                  perAcre={result.low.net} total={result.totals.lowAnnual}
                />
                <Scenario
                  label="Central" sub="median assumptions" emphasis
                  perAcre={result.central.net} total={result.totals.centralAnnual}
                />
                <Scenario
                  label="Optimistic" sub="high sequestration, low cost"
                  perAcre={result.high.net} total={result.totals.highAnnual}
                />
              </div>

              {result.low.net < 0 && result.high.net > 0 && (
                <p className="tiny" style={{
                  marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--rule)', color: 'var(--amber-700)',
                }}>
                  <strong>Note the sign change across this range.</strong> Depending on how your soil actually
                  responds, this decision either makes money or loses it. That spread is not a flaw in the model
                  — it is the honest state of the science, and it is the single most important thing to
                  understand before signing a multi-year contract.
                </p>
              )}
            </div>

            {/* The line-by-line — where the honesty lives */}
            <div className="card card--flush">
              <div style={{ padding: '18px 24px 14px', borderBottom: '1px solid var(--rule)' }}>
                <h3 style={{ fontSize: 16 }}>Where the money actually goes</h3>
                <p className="tiny muted" style={{ marginTop: 3 }}>
                  Central case, per acre per year. The negative lines are the ones you won&rsquo;t find on a
                  carbon company&rsquo;s website.
                </p>
              </div>

              <div style={{ padding: '6px 24px 18px' }}>
                <Line
                  label={isPerTon
                    ? `Carbon payment (${result.central.tonsPerAcre} t CO₂e/ac × effective price)`
                    : 'Carbon payment (flat per acre)'}
                  value={result.central.carbon}
                  src={program.id === 'bayer' ? 'bayerForGround' : program.id === 'indigo' ? 'indigoCarbon' : program.id === 'agoro' ? 'agoroCarbon' : null}
                />
                {costShareEnrolled && (
                  <Line label="USDA cost-share (EQIP)" value={result.central.costShare} src="nrcsPaymentSchedules" />
                )}
                <Line
                  label="Implementation cost (seed, planting, termination)"
                  value={-result.central.cost}
                  src="sareCoverCropEconomics"
                />
                {yieldChangePct !== 0 && (
                  <Line label={`Yield impact (${yieldChangePct > 0 ? '+' : ''}${yieldChangePct}% of $${grossRevenuePerAcre}/ac)`} value={result.central.yieldImpact} />
                )}

                <div style={{
                  display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                  paddingTop: 14, marginTop: 8, borderTop: '2px solid var(--soil-300)',
                }}>
                  <span style={{ fontWeight: 750, fontSize: 15 }}>Net</span>
                  <span className="mono" style={{
                    fontWeight: 700, fontSize: 19,
                    color: result.central.net >= 0 ? 'var(--green-700)' : 'var(--red-700)',
                  }}>
                    {money2(result.central.net)}/ac
                  </span>
                </div>
              </div>
            </div>

            {/* Warnings — the reason to trust this thing */}
            {result.warnings.length > 0 && (
              <div className="grid" style={{ gap: 10 }}>
                {result.warnings.map((w, i) => {
                  const [head, ...rest] = w.split('. ');
                  return (
                    <div key={i} className="callout callout--warn" style={{ fontSize: 13 }}>
                      <strong>{head}.</strong> {rest.join('. ')}
                    </div>
                  );
                })}
              </div>
            )}

            {/* Per-practice caveats. Folded into one card rather than one card each — with three
                practices selected these stacked into a screen and a half of prose that repeats what
                the methodology tab already says properly. */}
            {practiceIds.length > 0 && (
              <div className="card" style={{ padding: 18 }}>
                <Disclosure summary={`The evidence behind ${practiceIds.length === 1 ? 'this practice' : 'these practices'}`}>
                  {practiceIds.map((id, i) => {
                    const p = PRACTICES[id];
                    const conf = CONFIDENCE_META[p.sequestration.confidence];
                    return (
                      <div key={id} style={{
                        marginBottom: i < practiceIds.length - 1 ? 14 : 0,
                        paddingBottom: i < practiceIds.length - 1 ? 14 : 0,
                        borderBottom: i < practiceIds.length - 1 ? '1px solid var(--rule)' : 'none',
                      }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, flexWrap: 'wrap' }}>
                          <strong style={{ fontSize: 14, color: 'var(--ink)' }}>{p.name}</strong>
                          <span className="badge" style={{ background: `${conf.color}18`, color: conf.color }}>
                            {conf.label}
                          </span>
                          <span className="tiny muted mono" style={{ marginLeft: 'auto' }}>
                            {p.sequestration.low.toFixed(2)}–{p.sequestration.high.toFixed(2)} t CO₂e/ac/yr
                            <Cite src={p.sequestration.src} />
                          </span>
                        </div>
                        <p style={{ margin: 0 }}>{p.sequestration.caveat}</p>
                      </div>
                    );
                  })}
                </Disclosure>
              </div>
            )}
          </div>
        </div>

        {/* Cost-share footnote */}
        {costShareEnrolled && (
          <div className="callout callout--info" style={{ marginTop: 24, fontSize: 13 }}>
            <strong>EQIP rates are set by your state, not nationally.</strong>{' '}
            {COST_SHARE_PROGRAMS.eqip.caveat}{' '}
            <a href={COST_SHARE_PROGRAMS.eqip.findLocalUrl} target="_blank" rel="noopener noreferrer">
              Look up your state&rsquo;s published schedule ↗
            </a>
          </div>
        )}
      </div>
    </section>
  );
}

/* ── sub-components ─────────────────────────────────────── */

function Scenario({ label, sub, perAcre, total, emphasis }) {
  const pos = perAcre >= 0;
  return (
    <div style={{
      padding: emphasis ? '16px 18px' : '16px 18px',
      background: emphasis ? 'var(--soil-50)' : 'transparent',
      border: emphasis ? '1px solid var(--soil-300)' : '1px solid transparent',
      borderRadius: 8,
      textAlign: 'center',
    }}>
      <div className="tiny" style={{ fontWeight: 700, color: 'var(--soil-700)', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
        {label}
      </div>
      <div className="mono" style={{
        fontSize: emphasis ? 30 : 24,
        fontWeight: 700,
        margin: '8px 0 2px',
        letterSpacing: '-0.02em',
        color: pos ? 'var(--green-700)' : 'var(--red-700)',
      }}>
        {money2(perAcre)}
      </div>
      <div className="tiny muted mono" style={{ marginBottom: 6 }}>
        {money(total)}/yr total
      </div>
      <div className="tiny muted" style={{ fontSize: 10.5 }}>{sub}</div>
    </div>
  );
}

function Line({ label, value, src }) {
  const pos = value >= 0;
  return (
    <div style={{
      display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12,
      padding: '11px 0', borderBottom: '1px solid var(--soil-100)',
    }}>
      <span className="small" style={{ color: 'var(--soil-700)' }}>
        {label}{src && <Cite src={src} />}
      </span>
      <span className="mono" style={{
        fontWeight: 600, fontSize: 14.5, flexShrink: 0,
        color: pos ? 'var(--green-700)' : 'var(--red-700)',
      }}>
        {pos ? '+' : '−'}${Math.abs(value).toFixed(2)}
      </span>
    </div>
  );
}

function Check({ checked, onChange, label, hint }) {
  return (
    <label style={{ display: 'flex', gap: 10, alignItems: 'flex-start', cursor: 'pointer', marginBottom: 12 }}>
      <input
        type="checkbox"
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        style={{ marginTop: 3, accentColor: 'var(--green-700)', width: 15, height: 15, cursor: 'pointer' }}
      />
      <span>
        <span style={{ fontSize: 13.5, fontWeight: 600, color: 'var(--soil-800)' }}>{label}</span>
        {hint && <span className="tiny muted" style={{ display: 'block', marginTop: 2 }}>{hint}</span>}
      </span>
    </label>
  );
}
