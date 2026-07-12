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
          <strong> 145,127 samples with carbon measured in a laboratory</strong>, entirely independent
          of the soil survey this tool otherwise runs on.
          <strong style={{ color: 'var(--ink)' }}> It partly passed, and partly did not.</strong> Both
          halves are below.
        </p>

        {/* Scorecard */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', marginBottom: 28 }}>
          <Result
            verdict="Holds up"
            tone="good"
            title="Carbon does rise with fine fraction"
            body={<>Median measured carbon climbs steadily with clay-and-silt content — 5.5 → 6.3 → 10.4 → 15.0 → 16.4 g&nbsp;C/kg across texture bins, exactly the direction saturation theory requires. Correlation of bin medians: <strong className="mono">r&nbsp;=&nbsp;{v.pearsonBinMedians}</strong>.</>}
          />
          <Result
            verdict="Limitation"
            tone="warn"
            title="Texture barely predicts carbon at all"
            body={<>At the level of a single sample, texture explains almost nothing about how much carbon a soil actually holds: <strong className="mono">r&nbsp;=&nbsp;{v.pearsonFineFractionVsSoc}</strong>. Real carbon is governed far more by climate and land use. Hassink&rsquo;s law sets a <em>ceiling</em>, it never claimed to predict the contents — but it does mean the index is a coarse screen, not a precision instrument.</>}
          />
          <Result
            verdict="Against us"
            tone="bad"
            title="Our tool is probably too optimistic"
            body={<>The lab data reads saturated far more often than we do: median CSI <strong className="mono">{v.csi.lab.median}</strong> measured versus <strong className="mono">{v.csi.ssurgo.median}</strong> from our model. If we are wrong, we are wrong in the direction of telling you there is <em>more</em> room for carbon than there really is. You should know that.</>}
          />
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
            <strong>The mechanism holds; the calibration does not.</strong> The direction the theory
            predicts is clearly present in 16,014 laboratory measurements. But the absolute numbers our
            model produces do not line up with the lab, and we are not going to bury that. The Carbon
            Saturation Index should be read as a <strong>coarse three-way screen</strong> — plenty of room,
            marginal, or full — and never as a precise figure. Anyone reading a CSI to two decimal places
            is reading it wrong.
          </p>

          <p className="small" style={{ color: 'var(--soil-700)', margin: '0 0 12px' }}>
            <strong>On the gap between our numbers and the lab&rsquo;s.</strong> Some of it is not a defect:
            RaCA rows are individual <em>samples</em> while ours are county <em>averages</em>, and averaging
            necessarily clips the tails. Some of it probably is: RaCA samples every land use, including
            forest and pasture soils that carry more carbon, while our harvest is deliberately restricted to
            arable ground. We cannot cleanly separate those two effects, because RaCA&rsquo;s coordinates are
            restricted<Cite src="raca" /> and we cannot join its samples to our land-capability filter. So we
            report the gap rather than explain it away.
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
