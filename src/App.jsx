import { useState, useEffect } from 'react';
import { Nav, Footer } from './components/Chrome';
import ErrorBoundary from './components/ErrorBoundary';
import Hero from './components/Hero';
import SaturationMap from './components/SaturationMap';
import FieldIntelligence from './components/FieldIntelligence';
import DecisionTool from './components/DecisionTool';
import CostShare from './components/CostShare';
import ContractMatrix from './components/ContractMatrix';
import ContractChecker from './components/ContractChecker';
import Validation from './components/Validation';
import Evidence, { Sources } from './components/Evidence';

/**
 * Ground Truth — an independent decision tool for US farmers weighing carbon contracts.
 *
 * TWO AUDIENCES, TWO VIEWS
 * ------------------------
 * This project has a tension in it. The rigour is the product — the citations, the validation, the
 * places the model fails — and that is what earns an expert's trust. But a farmer standing in a
 * yard with a contract in their hand does not want a literature review, and burying the answer
 * under three paragraphs of caveats is its own kind of dishonesty: nobody reads it, so it might as
 * well not be there.
 *
 * So the site splits in two:
 *
 *   DECIDE      the answer. Clean, scannable, farmer-first. Long reasoning is collapsed behind
 *               disclosures — always one click away, never in the way.
 *   METHODOLOGY the workings. Validation against 16,000 lab samples, limitations, every source.
 *
 * Nothing is hidden or removed; it is only staged. Both views are always reachable, and the
 * methodology tab is linked from every claim that depends on it.
 */

const VIEWS = { decide: 'decide', method: 'method' };

export default function App() {
  const [view, setView] = useState(
    () => (window.location.hash.startsWith('#/method') ? VIEWS.method : VIEWS.decide)
  );

  // Keep the URL honest, so a methodology link can be shared and lands where it says it will.
  useEffect(() => {
    const onHash = () => {
      setView(window.location.hash.startsWith('#/method') ? VIEWS.method : VIEWS.decide);
    };
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, []);

  const go = (next) => {
    setView(next);
    window.location.hash = next === VIEWS.method ? '#/methodology' : '#/';
    window.scrollTo({ top: 0, behavior: 'instant' });
  };

  return (
    <div id="top">
      <Nav view={view} onNavigate={go} />

      <main>
        {view === VIEWS.decide ? (
          <>
            <Hero onMethodology={() => go(VIEWS.method)} />

            <ErrorBoundary
              name="national map"
              hint="It needs a large data file; a slow connection can time it out."
            >
              <SaturationMap />
            </ErrorBoundary>

            <ErrorBoundary
              name="field lookup"
              hint="It queries USDA SSURGO and CropScape live, and those services do go down."
            >
              <FieldIntelligence />
            </ErrorBoundary>

            <ErrorBoundary name="net return tool"><DecisionTool /></ErrorBoundary>
            <ErrorBoundary name="cost-share section"><CostShare /></ErrorBoundary>
            <ErrorBoundary name="contract matrix"><ContractMatrix /></ErrorBoundary>
            <ErrorBoundary name="red-flag checker"><ContractChecker /></ErrorBoundary>

            <MethodologyInvite onClick={() => go(VIEWS.method)} />
          </>
        ) : (
          <>
            <MethodologyHeader onBack={() => go(VIEWS.decide)} />
            <ErrorBoundary name="validation section"><Validation /></ErrorBoundary>
            <ErrorBoundary name="evidence section"><Evidence /></ErrorBoundary>
            <ErrorBoundary name="source list"><Sources /></ErrorBoundary>
          </>
        )}
      </main>

      <Footer onMethodology={() => go(VIEWS.method)} />
    </div>
  );
}

/** Closes the DECIDE view by pointing anyone who wants the workings at where they live. */
function MethodologyInvite({ onClick }) {
  return (
    <section className="section" style={{ background: 'var(--soil-900)', color: 'var(--soil-300)' }}>
      <div className="wrap" style={{ textAlign: 'center' }}>
        <p className="eyebrow" style={{ color: 'var(--green-600)' }}>Don&rsquo;t take our word for it</p>
        <h2 style={{ color: '#fff', marginBottom: 14 }}>We tested this against 16,014 lab samples</h2>
        <p className="lede" style={{ color: 'var(--soil-400)', margin: '0 auto 26px', maxWidth: '62ch' }}>
          And we published where it failed — including the finding that our own model may be too
          optimistic about how much carbon your soil can hold. Every number on this site traces to a
          primary source.
        </p>
        <button className="btn btn--primary" onClick={onClick}>
          See the methodology &amp; validation
          <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round">
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </section>
  );
}

function MethodologyHeader({ onBack }) {
  return (
    <header style={{ background: 'var(--paper)', borderBottom: '1px solid var(--rule)' }}>
      <div className="wrap" style={{ padding: '56px 24px 48px' }}>
        <button
          onClick={onBack}
          className="tiny"
          style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginBottom: 18,
            background: 'none', border: 'none', padding: 0, cursor: 'pointer',
            fontWeight: 700, letterSpacing: '0.04em', textTransform: 'uppercase',
            color: 'var(--green-700)', fontFamily: 'var(--font-sans)',
          }}
        >
          ← Back to the tool
        </button>

        <h1 style={{ maxWidth: '18ch', marginBottom: 18 }}>
          Methodology &amp; validation
        </h1>
        <p className="lede">
          The workings, the limitations, and the places this model is wrong. If you only read one part
          of this site as a scientist, read this. If you are a farmer, you do not need any of it — the
          answer is on <button
            onClick={onBack}
            style={{
              background: 'none', border: 'none', padding: 0, font: 'inherit',
              color: 'var(--green-700)', cursor: 'pointer', textDecoration: 'underline',
            }}
          >the previous page</button>.
        </p>
      </div>
    </header>
  );
}
