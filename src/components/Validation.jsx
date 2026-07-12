import v from '../data/validation.json';
import Cite from './Cite';

/**
 * VALIDATION.
 *
 * The section that decides whether any of this deserves to be believed.
 *
 * It reports the results of testing the saturation model against 16,014 laboratory-measured soil
 * samples — including the two results that go AGAINST the model. A validation section that only
 * contains good news is not a validation section, it is an advertisement.
 */
export default function Validation() {
  const maxSoc = Math.max(...v.bins.map(b => Math.max(b.p90Soc, b.hassinkCapacity)));

  return (
    <section id="validation" className="section">
      <div className="wrap">
        <p className="eyebrow">Validation · {v.nSamples.toLocaleString()} laboratory samples</p>
        <h2 style={{ marginBottom: 14 }}>Does the model survive contact with real soil?</h2>
        <p className="lede" style={{ marginBottom: 26 }}>
          Everything on this site rests on one claim: soil has a finite, texture-set capacity to hold
          carbon. So we tested that claim against USDA&rsquo;s Rapid Carbon Assessment<Cite src="raca" /> —
          145,127 samples with carbon measured in a laboratory, entirely independent of the soil survey
          this tool otherwise runs on. After filtering to{' '}
          <strong>{v.nSamples.toLocaleString()} mineral topsoil samples from CROPLAND</strong>, here is what
          it found — <strong style={{ color: 'var(--ink)' }}>including the result that goes against us</strong>.
        </p>

        {/* Scorecard */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: 28 }}>
          <Result
            verdict="Holds up"
            tone="good"
            title="The capacity law is real in US cropland"
            body={<>Tested the right way — as a <em>boundary</em>, not a mean — the upper envelope of measured carbon rises with clay-and-silt content at <strong className="mono">r&nbsp;=&nbsp;{v.boundary.pearson}</strong>. Median carbon climbs steadily across texture bins too (<strong className="mono">r&nbsp;=&nbsp;{v.pearsonBinMedians}</strong>). The direction saturation theory requires is clearly there in the laboratory data.</>}
          />
          <Result
            verdict="Limitation"
            tone="warn"
            title="The ceiling is lower than Hassink predicts"
            body={<>The observed boundary rises at <strong className="mono">{v.boundary.slope}</strong> g&nbsp;C/kg per % fine fraction, against Hassink&rsquo;s predicted <strong className="mono">{v.boundary.hassinkSlope}</strong> — less than half. Some of that is measurement error (we infer texture from a class, not a lab number), but it means the true capacity is probably lower than we assume. Read CSI as a coarse screen, never to two decimals.</>}
          />
          <Result
            verdict="Against us"
            tone="bad"
            title="Our model still leans optimistic"
            body={<>The lab reads saturated more often than we do: median CSI <strong className="mono">{v.csi.lab.median}</strong> measured versus <strong className="mono">{v.csi.ssurgo.median}</strong> modelled. If we are wrong, we are wrong in the direction of telling you there is <em>more</em> room for carbon than there really is — the worse direction. You should know that.</>}
          />
        </div>

        <div className="callout callout--good" style={{ marginBottom: 24 }}>
          <strong>Two of these findings explain each other, and that is the strongest thing in this
          section.</strong> If the true capacity ceiling is lower than Hassink predicts (finding 2), then
          our denominator is too big, our CSI comes out too small, and we understate saturation —
          which is exactly the bias we measured (finding 3). The model is not failing randomly. It is
          off in a direction we can point at and explain, which is the difference between a model with
          a known error bar and a model you should not trust.
        </div>

        {/* The chart: measured carbon vs Hassink capacity, by texture */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ fontSize: 16, marginBottom: 4 }}>Measured carbon against predicted capacity</h3>
          <p className="small muted" style={{ marginTop: 0, marginBottom: 20 }}>
            Each bar is a texture band. The line is the capacity Hassink&rsquo;s equation predicts for
            that texture; the bars are what the laboratory actually found.
          </p>

          <div style={{ display: 'flex', gap: 4, alignItems: 'flex-end', height: 200, marginBottom: 8 }}>
            {v.bins.map(b => {
              const medH = (b.medianSoc / maxSoc) * 100;
              const p90H = (b.p90Soc / maxSoc) * 100;
              const capH = (b.hassinkCapacity / maxSoc) * 100;
              return (
                <div key={b.fineFraction} style={{ flex: 1, position: 'relative', height: '100%' }}>
                  {/* p90 (light) */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: '10%', right: '10%',
                    height: `${p90H}%`, background: 'var(--green-100)', borderRadius: '3px 3px 0 0',
                  }} title={`90th percentile: ${b.p90Soc} g C/kg`} />
                  {/* median (solid) */}
                  <div style={{
                    position: 'absolute', bottom: 0, left: '10%', right: '10%',
                    height: `${medH}%`, background: 'var(--green-700)', borderRadius: '3px 3px 0 0',
                  }} title={`median: ${b.medianSoc} g C/kg (n=${b.n.toLocaleString()})`} />
                  {/* Hassink capacity line */}
                  <div style={{
                    position: 'absolute', bottom: `${capH}%`, left: 0, right: 0,
                    height: 2, background: 'var(--red-700)',
                  }} title={`Hassink capacity: ${b.hassinkCapacity} g C/kg`} />
                </div>
              );
            })}
          </div>

          <div style={{ display: 'flex', gap: 4 }}>
            {v.bins.map(b => (
              <div key={b.fineFraction} className="tiny muted mono" style={{ flex: 1, textAlign: 'center' }}>
                {b.fineFraction}
              </div>
            ))}
          </div>
          <div className="tiny muted" style={{ textAlign: 'center', marginTop: 4 }}>
            fine fraction (% clay + ½·silt)
          </div>

          <div style={{ display: 'flex', gap: 18, flexWrap: 'wrap', marginTop: 16, paddingTop: 14, borderTop: '1px solid var(--rule)' }}>
            <Key color="var(--green-700)" label="Median measured carbon" />
            <Key color="var(--green-100)" label="90th percentile" />
            <Key color="var(--red-700)" label="Hassink predicted capacity" line />
          </div>

          <div className="callout callout--warn" style={{ marginTop: 18, fontSize: 13 }}>
            <strong>The capacity line does not bound the data — and that is the expected result, not a
            failure.</strong> {v.pctAboveCapacity.toFixed(1)}% of samples sit above it. Hassink&rsquo;s capacity governs the{' '}
            <em>mineral-associated</em> carbon pool, whereas the laboratory measured <em>total</em> organic
            carbon, which also contains unprotected particulate matter.<Cite src="cotrufo2019" /> A sandy
            soil has almost no mineral capacity yet can still hold plenty of carbon as loose particulate
            matter — carbon that is real, but held weakly and easily lost the moment you till.
            <br /><br />
            This is precisely why a CSI above 1.0 is meaningful rather than broken: it says the soil is
            holding carbon its minerals <em>cannot protect</em>. Low room for new stable carbon, and high
            vulnerability in what is already there.
          </div>
        </div>

        {/* The honest conclusion */}
        <div className="card" style={{ background: 'var(--soil-50)' }}>
          <h3 style={{ marginBottom: 12 }}>What we concluded, including against ourselves</h3>

          <p className="small" style={{ color: 'var(--soil-700)', marginTop: 0, marginBottom: 12 }}>
            <strong>The mechanism holds; the calibration is off, and we know which way.</strong> The
            direction saturation theory predicts is clearly present in {v.nSamples.toLocaleString()} laboratory
            measurements of US cropland. But the absolute numbers our model produces still do not line up
            with the lab, and we are not going to bury that. Read the Carbon Saturation Index as a{' '}
            <strong>coarse three-way screen</strong> — room, marginal, or full — never as a precise figure.
          </p>

          <p className="small" style={{ color: 'var(--soil-700)', margin: '0 0 12px' }}>
            <strong>We ran the wrong test first, and it is worth telling you.</strong> The original version
            of this analysis correlated texture against measured carbon across all land uses, got{' '}
            <span className="mono">r = 0.095</span>, and reported the index as weak. That was a bad test,
            twice over. Hassink never claimed texture <em>predicts</em> a soil&rsquo;s carbon — only that it
            sets a <em>ceiling</em> — so a mean-fit line through the middle of the cloud is uninformative
            about the ceiling by construction. And pooling forest, range and wetland soils buried the
            texture signal under a much larger land-use signal. Restricting to cropland and testing the
            boundary properly is what produced the numbers above. The mistake is left documented in{' '}
            <code style={{ fontSize: 12.5 }}>scripts/validate-raca.mjs</code> rather than quietly deleted.
          </p>

          <p className="small" style={{ color: 'var(--soil-700)', margin: 0 }}>
            <strong>What would settle it.</strong> Access to RaCA&rsquo;s restricted coordinates would allow a
            true point-for-point comparison against SSURGO — the validation we actually wanted and could not
            run. That request is worth making, and until it is answered this section is the honest ceiling on
            what we can claim. The analysis is in{' '}
            <code style={{ fontSize: 12.5 }}>scripts/validate-raca.mjs</code>; run it yourself.
          </p>
        </div>
      </div>
    </section>
  );
}

function Result({ verdict, tone, title, body }) {
  const c = {
    good: { color: 'var(--green-700)', bg: 'var(--green-50)' },
    warn: { color: 'var(--amber-700)', bg: 'var(--amber-50)' },
    bad:  { color: 'var(--red-700)',   bg: 'var(--red-50)' },
  }[tone];

  return (
    <div className="card" style={{ borderTop: `3px solid ${c.color}` }}>
      <span className="badge" style={{ background: c.bg, color: c.color, marginBottom: 9 }}>
        {verdict}
      </span>
      <h3 style={{ fontSize: 15, marginBottom: 8 }}>{title}</h3>
      <p className="small muted" style={{ margin: 0 }}>{body}</p>
    </div>
  );
}

function Key({ color, label, line }) {
  return (
    <span style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
      <span style={{
        width: 14, height: line ? 2 : 11, borderRadius: line ? 0 : 3, background: color, flexShrink: 0,
      }} />
      <span className="tiny muted">{label}</span>
    </span>
  );
}
