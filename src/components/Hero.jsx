import Cite from './Cite';
import { Mark } from './Chrome';

/**
 * The hero has one job: state the question this site answers, in the words a
 * farmer would actually use, above the fold, with no marketing throat-clearing.
 */
export default function Hero({ onMethodology }) {
  return (
    <header style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="wrap" style={{ padding: '72px 24px 64px' }}>

        {/* Masthead. The name is established once, properly, before the question is asked —
            a publication's front page, not a startup's landing page. */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 13, flexWrap: 'wrap',
          paddingBottom: 20, marginBottom: 26,
          borderBottom: '2px solid var(--ink)',
        }}>
          <Mark size={40} />
          <div>
            <div style={{
              fontSize: 'clamp(24px, 3vw, 30px)', fontWeight: 800,
              letterSpacing: '-0.035em', color: 'var(--ink)', lineHeight: 1,
            }}>
              Ground Truth
            </div>
            <div className="small" style={{ color: 'var(--soil-600)', marginTop: 4, fontWeight: 550 }}>
              An independent check on agricultural carbon contracts
            </div>
          </div>

          <div style={{ marginLeft: 'auto', textAlign: 'right' }}>
            <div className="tiny" style={{
              fontWeight: 700, letterSpacing: '0.09em', textTransform: 'uppercase',
              color: 'var(--green-700)',
            }}>
              Non-commercial
            </div>
            <div className="tiny muted" style={{ marginTop: 2 }}>
              We sell nothing · take no commission
            </div>
          </div>
        </div>

        <h1 style={{ maxWidth: '16ch', marginBottom: 22 }}>
          Should you sign that carbon contract?
        </h1>

        <p className="lede" style={{ marginBottom: 30 }}>
          Carbon companies will tell you what they&rsquo;ll <em>pay</em> you. None will tell you what
          you&rsquo;re <em>agreeing to</em>, that USDA often pays more for the same practice — or whether
          your soil can even <em>physically hold</em> the carbon they&rsquo;re paying you for.
          <strong style={{ color: 'var(--ink)' }}> This tool does all three, for your actual field.</strong>
        </p>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 44 }}>
          <a href="#field" className="btn btn--primary">
            Analyse my field
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
              <path d="M5 12h14M12 5l7 7-7 7" />
            </svg>
          </a>
          <a href="#matrix" className="btn btn--ghost">Compare the contracts</a>
          {onMethodology && (
            <button onClick={onMethodology} className="btn btn--ghost">
              Methodology
            </button>
          )}
        </div>

        {/* The three facts that justify the site's existence. Each one cited. */}
        <div
          className="grid facts"
          style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: 0, borderTop: '1px solid var(--rule)' }}
        >
          <Fact
            stat="Your field"
            label="not a national average"
            body={<>We query the <strong>USDA soil survey</strong> and <strong>USDA satellite crop records</strong> for your exact coordinates &mdash; and tell you how much carbon your soil can physically still hold. Most soils have far less room than you&rsquo;d think.</>}
            src="ssurgo"
          />
          <Fact
            stat="$34–75"
            label="per acre from USDA for cover crops"
            body={<>Against roughly $6&ndash;12/ac from a carbon program for the same practice. Most farmers check the carbon offer first, and never check this one.</>}
            src="nrcsPaymentSchedules"
            border
          />
          <Fact
            stat="1 of 4"
            label="programs independently verified"
            body={<>Exactly one major US carbon program has ever had its contract terms checked by an independent third party. The rest ask you to take their word for it.</>}
            src="agDataTransparentIndigo"
            border
          />
        </div>
      </div>
    </header>
  );
}

function Fact({ stat, label, body, src, border }) {
  return (
    <div style={{
      padding: '24px 26px 4px',
      borderLeft: border ? '1px solid var(--rule)' : 'none',
    }}>
      <div className="mono" style={{
        fontSize: 26, fontWeight: 700, color: 'var(--green-900)', letterSpacing: '-0.02em',
      }}>
        {stat}
      </div>
      <div style={{
        fontSize: 12, fontWeight: 650, color: 'var(--soil-700)',
        marginTop: 2, marginBottom: 9,
      }}>
        {label}<Cite src={src} />
      </div>
      <p className="small muted" style={{ margin: 0 }}>{body}</p>
    </div>
  );
}
