import { useState, useMemo } from 'react';
import Cite from './Cite';

/**
 * CONTRACT RED-FLAG CHECKER
 *
 * A farmer with a contract in front of them has a concrete, urgent question: is this one bad?
 * Legal-aid organisations have published excellent guidance on the clauses that hurt farmers, but
 * it lives in 40-page PDFs that nobody reads at the kitchen table with a rep waiting.
 *
 * This turns that guidance into eight questions, and gives a straight answer — including
 * "walk away", which is an answer a tool funded by carbon companies could never give.
 *
 * Every flag traces to published legal-aid guidance. This is emphatically not legal advice, and the
 * component says so twice.
 */

const QUESTIONS = [
  {
    id: 'term',
    q: 'How long does the contract lock you in?',
    help: 'Look for "term", "commitment period", or "performance period".',
    options: [
      { v: 'short',   label: '1–3 years',        flag: null },
      { v: 'medium',  label: '4–6 years',        flag: 'medium' },
      { v: 'long',    label: '7–10 years',       flag: 'high' },
      { v: 'verylong',label: 'More than 10 years', flag: 'critical' },
      { v: 'unclear', label: "It doesn't say clearly", flag: 'critical' },
    ],
    flags: {
      medium: {
        title: 'Standard term — but check the renewal',
        body: 'Five years is the market norm. The thing to check is whether it AUTO-RENEWS. Several ' +
              'programs renew automatically unless you actively opt out, which can quietly turn five ' +
              'years into fifteen.',
      },
      high: {
        title: 'Long commitment — think hard about rented ground',
        body: 'Seven to ten years is longer than most cash-rent arrangements and many equipment notes. ' +
              'If any of these acres are rented, you are promising something you may not control. Get ' +
              'your landlord committed in writing for the full term, or do not enrol those acres.',
      },
      critical: {
        title: 'Unacceptable without legal review',
        body: 'A commitment beyond ten years — or one whose length is not clearly stated — is a serious ' +
              'red flag. Do not sign until a lawyer has read it and the term is unambiguous on the page.',
      },
    },
  },
  {
    id: 'exit',
    q: 'What happens if you leave early?',
    help: 'Look for "termination", "withdrawal", "forfeiture", or "liquidated damages".',
    options: [
      { v: 'free',      label: 'Exit freely, keep what I earned', flag: null },
      { v: 'forfeit',   label: 'I forfeit unpaid/unvested money',  flag: 'high' },
      { v: 'repay',     label: 'I must PAY BACK money already received', flag: 'critical' },
      { v: 'unclear',   label: "It doesn't say clearly",           flag: 'critical' },
    ],
    flags: {
      high: {
        title: 'Forfeiture clause — understand exactly what you lose',
        body: 'Forfeiting unvested payments is common and is survivable, but you must know the number. ' +
              'Ask them, in writing: "If I exit in year 3, exactly how much do I lose?" A rep who ' +
              'will not put that in writing has told you something.',
      },
      critical: {
        title: 'CLAW-BACK — this is the clause that ruins farmers',
        body: 'A contract that can require you to REPAY money you have already received and spent is ' +
              'the single most dangerous term in this market. Reversal events — a bad year, a forced ' +
              'tillage pass, a lost lease, selling the farm — can trigger it through no fault of your ' +
              'own. Do not sign this without a lawyer. Seriously consider not signing it at all.',
      },
    },
  },
  {
    id: 'permanence',
    q: 'How long must the carbon stay in the ground?',
    help: 'Look for "permanence", "reversal", or a stated number of years.',
    options: [
      { v: 'sameasterm', label: 'Same as the contract term',      flag: null },
      { v: 'longer',     label: 'Longer than the contract term',  flag: 'high' },
      { v: 'century',    label: '100 years',                       flag: 'medium' },
      { v: 'unclear',    label: "It doesn't say clearly",          flag: 'critical' },
    ],
    flags: {
      medium: {
        title: '100-year permanence — check WHO carries it',
        body: 'A 100-year permanence requirement is standard under most registry protocols and is not ' +
              'automatically alarming. What matters enormously is whether that obligation sits on YOUR ' +
              'field or on the aggregated PROJECT. Project-level permanence (as Indigo uses) shifts the ' +
              'risk off you. Field-level permanence keeps it on you. Ask which, and get it in writing.',
      },
      high: {
        title: 'Obligation outlives your payments',
        body: 'You stop being paid, but you remain obligated. That asymmetry deserves a very clear-eyed ' +
              'look: you are accepting a constraint on how you farm for years after the income ends. ' +
              'Understand precisely what you may and may not do with that ground.',
      },
      critical: {
        title: 'Undefined permanence obligation',
        body: 'An open-ended, undefined obligation to keep carbon in the ground is not something anyone ' +
              'should sign. Demand a specific number of years, in the contract, before going further.',
      },
    },
  },
  {
    id: 'basis',
    q: 'How are you paid?',
    help: 'Per acre enrolled, or per ton of carbon verified?',
    options: [
      { v: 'peracre', label: 'Flat rate per acre',       flag: null },
      { v: 'perton',  label: 'Per ton of verified carbon', flag: 'medium' },
      { v: 'unclear', label: "It doesn't say clearly",     flag: 'critical' },
    ],
    flags: {
      medium: {
        title: 'Per-ton means YOU carry the measurement risk',
        body: 'If your soil does not test as having sequestered carbon, you are not paid — even though ' +
              'you already spent the money establishing the practice. This is the right structure only ' +
              'if your soil genuinely has headroom. Run your field through the Field Intelligence tool ' +
              'above: if it comes back near or beyond mineral capacity, a per-ton contract is a bad bet.',
      },
      critical: {
        title: 'Payment basis must be explicit',
        body: 'If you cannot tell from the contract whether you are paid per acre or per ton, the ' +
              'contract is not ready to sign.',
      },
    },
  },
  {
    id: 'price',
    q: 'Is the price you get guaranteed?',
    help: 'Look for "floor price", "guaranteed minimum", or a revenue share.',
    options: [
      { v: 'floor',    label: 'Yes — a floor price is stated',  flag: null },
      { v: 'share',    label: 'A % share of whatever it sells for', flag: 'medium' },
      { v: 'discretion', label: 'They decide the price later',  flag: 'critical' },
      { v: 'unclear',  label: "It doesn't say clearly",          flag: 'high' },
    ],
    flags: {
      medium: {
        title: 'Revenue share — your income floats with a volatile market',
        body: 'A percentage share means your income rides the voluntary carbon market, which has swung ' +
              'roughly $15–80/ton. Ask what price they have ACTUALLY realised for growers in the last ' +
              'two years, not what credits theoretically fetch. Truterra, for instance, has paid an ' +
              'implied average near $19/ton against headline prices several times that.',
      },
      high: {
        title: 'Unstated pricing',
        body: 'Get the pricing mechanism in writing. "We will treat you fairly" is not a price.',
      },
      critical: {
        title: 'Unilateral pricing discretion — do not accept this',
        body: 'A contract where the buyer sets your price at their own discretion, after you have ' +
              'already done the work, is not a contract you should sign. Walk away or negotiate a floor.',
      },
    },
  },
  {
    id: 'amend',
    q: 'Can they change the terms after you sign?',
    help: 'Look for "amendment", "modification", or "we may update these terms".',
    options: [
      { v: 'no',      label: 'No — changes need my agreement', flag: null },
      { v: 'notice',  label: 'Yes, with notice and I can opt out', flag: 'medium' },
      { v: 'yes',     label: 'Yes, at their discretion',        flag: 'critical' },
      { v: 'unclear', label: "It doesn't say clearly",           flag: 'high' },
    ],
    flags: {
      medium: {
        title: 'Amendable with an opt-out — know what opting out costs',
        body: 'This is workable, but only if opting out does not trigger the forfeiture or claw-back ' +
              'clause. Check how those two clauses interact — that interaction is where the real risk ' +
              'usually hides.',
      },
      high: {
        title: 'Amendment rights unclear',
        body: 'Ask directly whether they can change the deal after you sign, and get the answer in the document.',
      },
      critical: {
        title: 'Unilateral amendment — the deal you sign is not the deal you get',
        body: 'If they can change the terms at their sole discretion, then nothing else in the contract ' +
              'is really a promise, and none of your diligence on the other clauses means much. This ' +
              'alone is grounds to refuse.',
      },
    },
  },
  {
    id: 'data',
    q: 'Who owns your farm data, and who can they share it with?',
    help: 'Look for "data", "licence", "third parties", "aggregate".',
    options: [
      { v: 'mine',    label: 'I own it; use limited to the program', flag: null },
      { v: 'shared',  label: 'They can share it with third parties',  flag: 'high' },
      { v: 'theirs',  label: 'They own it / can sell it',             flag: 'critical' },
      { v: 'unclear', label: "It doesn't say clearly",                flag: 'high' },
    ],
    flags: {
      high: {
        title: 'Your operational data is leaving the farm',
        body: 'Yield maps, input rates, field boundaries and practice records have real commercial value ' +
              'to input suppliers, land buyers and insurers. Farmers\' data-privacy concerns are a ' +
              'documented barrier to carbon market participation, and they are not paranoia. Ask ' +
              'specifically: who else sees this, in what form, and for how long?',
      },
      critical: {
        title: 'You are handing over an asset — probably for free',
        body: 'A contract that transfers ownership of your farm data, or lets them sell it, is asking ' +
              'you to give up something valuable on top of the practice change. That should be priced ' +
              'into what they pay you, and almost never is.',
      },
    },
  },
  {
    id: 'stacking',
    q: 'Does it stop you taking USDA cost-share on those acres?',
    help: 'Look for "additionality", "double-counting", "other programs".',
    options: [
      { v: 'allowed', label: 'USDA cost-share is explicitly allowed', flag: null },
      { v: 'barred',  label: 'It bars other program payments',         flag: 'high' },
      { v: 'unclear', label: "It doesn't say clearly",                 flag: 'high' },
    ],
    flags: {
      high: {
        title: 'This could cost you far more than the contract pays',
        body: 'USDA EQIP pays roughly $34–75/ac for cover crops. A carbon program pays roughly $6–12/ac. ' +
              'If signing this contract disqualifies you from cost-share on those acres, you may be ' +
              'trading the larger payment for the smaller one — and locking yourself in for years to do ' +
              'it. Resolve this in writing before you sign anything.',
      },
    },
  },
];

const SEVERITY = {
  critical: { rank: 3, label: 'Deal-breaker', color: '#B91C1C', bg: 'rgba(185,28,28,0.08)' },
  high:     { rank: 2, label: 'Serious',      color: '#B45309', bg: 'rgba(180,83,9,0.08)' },
  medium:   { rank: 1, label: 'Negotiate',    color: '#1D4ED8', bg: 'rgba(29,78,216,0.08)' },
};


/**
 * Presented one question at a time rather than as a single long form.
 *
 * The eight questions laid out flat ran to well over two thousand pixels — eight headings, thirty
 * options, and a verdict somewhere below the horizon. Nobody finishes that. Worse, the person who
 * most needs this is standing in a farmyard with a rep waiting and a contract in their hand, and a
 * wall of radio buttons is exactly what makes someone give up and just sign.
 *
 * So: one question, one screen, visible progress, and the verdict only once there is something
 * worth saying. The answers are all still there — you can step back through them, and the summary
 * lists every flag at the end.
 */
export default function ContractChecker() {
  const [answers, setAnswers] = useState({});
  const [step, setStep] = useState(0);
  const [done, setDone] = useState(false);

  const flags = useMemo(() => {
    const out = [];
    for (const q of QUESTIONS) {
      const a = answers[q.id];
      if (!a) continue;
      const opt = q.options.find(o => o.v === a);
      if (!opt?.flag) continue;
      out.push({ qid: q.id, question: q.q, answer: opt.label, severity: opt.flag, ...q.flags[opt.flag] });
    }
    return out.sort((a, b) => SEVERITY[b.severity].rank - SEVERITY[a.severity].rank);
  }, [answers]);

  const answered = Object.keys(answers).length;
  const critical = flags.filter(f => f.severity === 'critical').length;
  const serious  = flags.filter(f => f.severity === 'high').length;

  const q = QUESTIONS[step];
  const isLast = step === QUESTIONS.length - 1;

  const pick = (v) => {
    setAnswers(a => ({ ...a, [q.id]: v }));
    // Advance automatically — the answer IS the click, and making someone press "next" as well is
    // just a second tax on the same decision.
    setTimeout(() => (isLast ? setDone(true) : setStep(s => s + 1)), 180);
  };

  const reset = () => { setAnswers({}); setStep(0); setDone(false); };

  return (
    <section id="checker" className="section">
      <div className="wrap">
        <p className="eyebrow">Contract red-flag checker</p>
        <h2 style={{ marginBottom: 14 }}>Got a contract in front of you?</h2>
        <p className="lede" style={{ marginBottom: 28 }}>
          Eight questions, answered straight from the document in your hand. We&rsquo;ll tell you which
          clauses to fight, which to walk away from, and which are normal — grounded in published farm
          legal-aid guidance.<Cite src="flagCarbonContracts" />
        </p>

        {!done ? (
          <div className="card" style={{ maxWidth: 720, padding: 0, overflow: 'hidden' }}>
            {/* Progress */}
            <div style={{ height: 3, background: 'var(--soil-200)' }}>
              <div style={{
                height: '100%', width: `${(step / QUESTIONS.length) * 100}%`,
                background: 'var(--green-700)', transition: 'width 0.25s ease',
              }} />
            </div>

            <div style={{ padding: '26px 28px 22px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: 14 }}>
                <span className="tiny" style={{ fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--green-700)' }}>
                  Question {step + 1} of {QUESTIONS.length}
                </span>
                {flags.length > 0 && (
                  <span className="tiny" style={{ fontWeight: 700, color: critical ? 'var(--red-700)' : 'var(--amber-700)' }}>
                    {flags.length} flag{flags.length > 1 ? 's' : ''} so far
                  </span>
                )}
              </div>

              <h3 style={{ fontSize: 21, marginBottom: 6, lineHeight: 1.25 }}>{q.q}</h3>
              <p className="small muted" style={{ marginTop: 0, marginBottom: 20 }}>{q.help}</p>

              <div className="grid" style={{ gap: 8 }}>
                {q.options.map(o => {
                  const on = answers[q.id] === o.v;
                  return (
                    <button
                      key={o.v}
                      onClick={() => pick(o.v)}
                      style={{
                        textAlign: 'left', padding: '13px 15px', borderRadius: 8, cursor: 'pointer',
                        border: `1px solid ${on ? 'var(--green-700)' : 'var(--soil-300)'}`,
                        background: on ? 'var(--green-50)' : 'var(--paper)',
                        color: on ? 'var(--green-900)' : 'var(--soil-800)',
                        fontWeight: on ? 650 : 500, fontSize: 14.5,
                        fontFamily: 'var(--font-sans)',
                        transition: 'border-color 0.12s, background 0.12s',
                      }}
                      onMouseEnter={e => { if (!on) e.currentTarget.style.borderColor = 'var(--soil-500)'; }}
                      onMouseLeave={e => { if (!on) e.currentTarget.style.borderColor = 'var(--soil-300)'; }}
                    >
                      {o.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Footer nav */}
            <div style={{
              display: 'flex', justifyContent: 'space-between', alignItems: 'center',
              padding: '13px 28px', borderTop: '1px solid var(--rule)', background: 'var(--soil-50)',
            }}>
              <button
                onClick={() => setStep(s => Math.max(0, s - 1))}
                disabled={step === 0}
                className="small"
                style={{
                  background: 'none', border: 'none', padding: 0,
                  cursor: step === 0 ? 'default' : 'pointer',
                  color: step === 0 ? 'var(--soil-400)' : 'var(--soil-700)',
                  fontWeight: 600, fontFamily: 'var(--font-sans)',
                }}
              >
                ← Back
              </button>

              <div style={{ display: 'flex', gap: 5 }}>
                {QUESTIONS.map((qq, i) => (
                  <span
                    key={qq.id}
                    style={{
                      width: 6, height: 6, borderRadius: '50%',
                      background: answers[qq.id]
                        ? 'var(--green-700)'
                        : i === step ? 'var(--soil-500)' : 'var(--soil-300)',
                    }}
                  />
                ))}
              </div>

              {answered > 0 ? (
                <button
                  onClick={() => setDone(true)}
                  className="small"
                  style={{
                    background: 'none', border: 'none', padding: 0, cursor: 'pointer',
                    color: 'var(--green-700)', fontWeight: 650, fontFamily: 'var(--font-sans)',
                  }}
                >
                  See verdict →
                </button>
              ) : <span style={{ width: 70 }} />}
            </div>
          </div>
        ) : (
          <Verdict
            flags={flags}
            answered={answered}
            critical={critical}
            serious={serious}
            onEdit={(i) => { setStep(i); setDone(false); }}
            onReset={reset}
          />
        )}
      </div>
    </section>
  );
}

function Verdict({ flags, answered, critical, serious, onEdit, onReset }) {
  const tone = critical ? 'var(--red-700)' : serious ? 'var(--amber-700)' : 'var(--green-700)';

  return (
    <div className="grid" style={{ gap: 16, maxWidth: 820 }}>
      <div className="card" style={{ borderLeft: `4px solid ${tone}` }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <h3 style={{ fontSize: 19, marginBottom: 7, color: tone }}>
              {critical > 0
                ? `${critical} deal-breaker${critical > 1 ? 's' : ''} found`
                : serious > 0
                  ? `${serious} serious issue${serious > 1 ? 's' : ''} to negotiate`
                  : flags.length > 0
                    ? 'Nothing alarming — some points to negotiate'
                    : 'No red flags in what you told us'}
            </h3>
            <p className="small" style={{ margin: 0, color: 'var(--soil-700)', maxWidth: '62ch' }}>
              {critical > 0
                ? 'A deal-breaker is a clause that can claw back money you have already been paid, or that ' +
                  'lets the other side rewrite the deal after you sign. Do not sign until a lawyer has read ' +
                  'it — and be genuinely willing to walk away.'
                : serious > 0
                  ? 'None of these is automatically fatal, but they are where farmers most often get hurt. ' +
                    'Every one is negotiable. Being handed a standard form does not mean you must sign a ' +
                    'standard form.'
                  : flags.length > 0
                    ? 'This looks like a reasonably normal agreement. The points below are still worth ' +
                      'raising — the worst they can say is no.'
                    : 'Based on your answers, this contract avoids the clauses that most commonly harm ' +
                      'farmers. Good sign — but not a substitute for a lawyer reading the actual document.'}
            </p>
          </div>
          <button onClick={onReset} className="btn btn--ghost" style={{ fontSize: 13, padding: '7px 13px', flexShrink: 0 }}>
            Start over
          </button>
        </div>
        {answered < QUESTIONS.length && (
          <p className="tiny muted" style={{ marginTop: 12, marginBottom: 0 }}>
            You answered {answered} of {QUESTIONS.length}. The unanswered ones may hide further problems.
          </p>
        )}
      </div>

      {flags.map(f => {
        const s = SEVERITY[f.severity];
        const idx = QUESTIONS.findIndex(q => q.id === f.qid);
        return (
          <div key={f.qid} className="card" style={{ background: s.bg, borderColor: `${s.color}33` }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8, flexWrap: 'wrap' }}>
              <span className="badge" style={{ background: s.color, color: '#fff' }}>{s.label}</span>
              <span className="tiny muted">{f.question}</span>
              <button
                onClick={() => onEdit(idx)}
                className="tiny"
                style={{
                  marginLeft: 'auto', background: 'none', border: 'none', padding: 0,
                  cursor: 'pointer', color: 'var(--soil-600)', fontWeight: 600,
                  fontFamily: 'var(--font-sans)', textDecoration: 'underline',
                }}
              >
                change answer
              </button>
            </div>
            <h3 style={{ fontSize: 15.5, marginBottom: 6, color: s.color }}>{f.title}</h3>
            <p className="small" style={{ margin: 0, color: 'var(--soil-800)' }}>{f.body}</p>
          </div>
        );
      })}

      <div className="callout callout--warn">
        <strong>This is not legal advice, and it cannot see your actual document.</strong> It is a
        structured way to read one. A carbon contract is a binding, multi-year agreement — often the
        longest commitment on a farm after the mortgage. Have a lawyer read it. Many state Farm Bureaus
        and legal-aid groups will review one at low or no cost.<Cite src="flagCarbonContracts" />
      </div>
    </div>
  );
}
