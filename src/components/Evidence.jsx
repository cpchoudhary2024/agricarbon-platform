import { PRACTICES, PRACTICE_LIST, CONFIDENCE_META } from '../data/practices';
import { SOURCES, TIER_LABELS } from '../data/sources';
import Cite from './Cite';

/**
 * Methodology and evidence.
 *
 * The section that earns the right to be believed. It leads with what the tool
 * CANNOT do, because a methodology page that only lists strengths is marketing.
 */
export default function Evidence() {
  return (
    <section id="evidence" className="section" style={{ background: 'var(--paper)' }}>
      <div className="wrap">
        <p className="eyebrow">Methodology &amp; evidence</p>
        <h2 style={{ marginBottom: 14 }}>What this tool can&rsquo;t tell you</h2>
        <p className="lede" style={{ marginBottom: 34 }}>
          Starting with the limitations, because a methodology page that only lists strengths is a
          brochure. If you only read one section of this site, read this one.
        </p>

        {/* The big one */}
        <div className="callout callout--danger" style={{ marginBottom: 24, padding: '20px 22px' }}>
          <div style={{ fontWeight: 750, fontSize: 15.5, marginBottom: 8 }}>
            The no-till carbon benefit is contested — and this is the industry&rsquo;s open secret
          </div>
          <p style={{ margin: '0 0 10px', fontSize: 14 }}>
            No-till is the single most promoted practice in agricultural carbon markets. It is also the one
            whose climate benefit the peer-reviewed literature is least sure of.
            Powlson et al. (2014, <em>Nature Climate Change</em>)<Cite src="powlson2014" /> found that most
            apparent soil carbon gains under no-till reflect an <strong>altered depth distribution</strong> of
            carbon — carbon concentrated near the surface — rather than genuinely additional carbon in the
            profile. Sample to 30 cm and no-till looks excellent. Sample deeper and the gain frequently
            disappears.
          </p>
          <p style={{ margin: 0, fontSize: 14 }}>
            <strong>What to do with this:</strong> if a program quotes you a confident no-till sequestration
            figure, ask them at what depth they sampled, and whether they corrected for bulk density. If they
            can&rsquo;t answer, that tells you what the number is worth. It is also why the no-till range in
            this tool <strong>starts at zero</strong>.
          </p>
        </div>

        {/* Carbon saturation — the model behind Field Intelligence */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 10 }}>Soil is not an infinite sponge</h3>
          <p className="small" style={{ color: 'var(--soil-700)', marginTop: 0, marginBottom: 10 }}>
            Every carbon calculator on the market implicitly assumes that if you adopt a practice, carbon
            accrues at some rate, forever. Soil does not work like that. Soil has a <strong>finite
            capacity</strong> to protect organic carbon: carbon persists largely by binding to fine mineral
            surfaces (clay and silt), and once those surfaces are occupied, additional carbon has nowhere
            stable to go. Hassink (1997)<Cite src="hassink1997" /> quantified that capacity; Six et al.
            (2002)<Cite src="six2002" /> generalised it into the theory of carbon saturation.
          </p>
          <p className="small" style={{ color: 'var(--soil-700)', margin: '0 0 10px' }}>
            The consequence is the most actionable fact in agricultural carbon, and essentially nobody
            tells farmers about it: <strong>a soil near its protective capacity will gain little carbon no
            matter what you do.</strong> This is why the same practice yields 0.2 t C/ha/yr on one farm and
            0.9 on another — and why a national average is close to meaningless for one field. It is also
            why the <a href="#field">Field Intelligence tool</a> above exists: it computes your
            field&rsquo;s saturation state from the USDA soil survey and scales the published ranges
            accordingly.
          </p>
          <p className="small" style={{ color: 'var(--soil-700)', margin: 0 }}>
            <strong>Where this model is soft, stated plainly:</strong> our Carbon Saturation Index is an{' '}
            <em>index</em>, not a lab measurement. Hassink&rsquo;s capacity describes the
            mineral-associated carbon pool, whereas SSURGO reports <em>total</em> organic matter — which
            also contains unprotected particulate carbon.<Cite src="cotrufo2019" /> That is why a CSI
            above 1.0 is possible and is not a bug: it means carbon is held beyond what the minerals can
            protect, implying both low headroom and elevated vulnerability to loss. We also approximate the
            &lt;20 µm fraction as clay + ½·silt, because SSURGO does not publish that exact cut. Georgiou
            et al. (2022)<Cite src="georgiou2022" /> is the rigorous modern treatment; we use the simpler
            form because it can be computed from the data a farmer&rsquo;s own field actually has.
          </p>
        </div>

        {/* Why not IPCC Tier 1 */}
        <div className="card" style={{ marginBottom: 24 }}>
          <h3 style={{ marginBottom: 10 }}>Why this tool does not use IPCC Tier 1 coefficients</h3>
          <p className="small" style={{ color: 'var(--soil-700)', marginTop: 0, marginBottom: 10 }}>
            Many soil carbon calculators — including an earlier version of this one — are built on the IPCC
            2006 Tier 1 stock-change factors.<Cite src="ipcc2006" /> Those coefficients are excellent at
            the job they were designed for: helping a <strong>country</strong> estimate national soil carbon
            change for its greenhouse gas inventory.
          </p>
          <p className="small" style={{ color: 'var(--soil-700)', margin: 0 }}>
            They were never designed to predict what will happen in <strong>your field</strong>. They are
            global defaults averaged across enormous climate zones; applying them to a single farm produces a
            number with false precision and no meaningful error bar. This tool therefore uses measured accrual
            rates from field meta-analyses instead, expressed as honest ranges — and it declines to give you a
            single confident number, because no honest method can.
          </p>
        </div>

        {/* Practice evidence table */}
        <h3 style={{ marginBottom: 6 }}>The evidence, practice by practice</h3>
        <p className="small muted" style={{ marginTop: 0, marginBottom: 18 }}>
          Sequestration ranges are converted from published Mg C ha⁻¹ yr⁻¹ (0&ndash;30 cm) to metric tons
          CO₂e per acre per year, using the 44/12 molecular mass ratio and 2.471 acres per hectare.
        </p>

        <div className="grid" style={{ gap: 16, marginBottom: 34 }}>
          {PRACTICE_LIST.map(id => {
            const p = PRACTICES[id];
            const conf = CONFIDENCE_META[p.sequestration.confidence];
            return (
              <div key={id} className="card">
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12, flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: 16 }}>{p.name}</h3>
                  <span className="badge" style={{ background: `${conf.color}18`, color: conf.color }}>
                    {conf.label}
                  </span>
                </div>

                <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: 14, marginBottom: 14 }}>
                  <Metric
                    label="Sequestration"
                    value={`${p.sequestration.low.toFixed(2)}–${p.sequestration.high.toFixed(2)}`}
                    unit="t CO₂e/ac/yr"
                    src={p.sequestration.src}
                  />
                  <Metric
                    label="Implementation cost"
                    value={`$${p.cost.totalLow}–${p.cost.totalHigh}`}
                    unit="per acre"
                    src={p.cost.src}
                  />
                  <Metric
                    label="Confidence"
                    value={conf.label}
                    unit={conf.desc}
                    plain
                  />
                </div>

                <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 12 }}>
                  <Caveat label="On the carbon" body={p.sequestration.caveat} />
                  <Caveat label="On the cost" body={p.cost.caveat} />
                  <Caveat label="On yield" body={p.yieldEffect.note} last />
                </div>
              </div>
            );
          })}
        </div>

        {/* Honest limitations */}
        <div className="card" style={{ background: 'var(--soil-50)' }}>
          <h3 style={{ marginBottom: 12 }}>Limitations you should hold against this tool</h3>
          <ul style={{ margin: 0, paddingLeft: 18 }}>
            {[
              <>This is a <strong>planning-grade</strong> estimate, not a credit-grade measurement. Nothing here substitutes for soil sampling on your own ground, and no carbon registry would accept it.</>,
              <>The field lookup uses the <strong>dominant soil component</strong> of your SSURGO map unit.<Cite src="ssurgo" /> A real field can contain several soils, and yours may be more variable than one number suggests.</>,
              <>SSURGO and the Cropland Data Layer cover the <strong>United States only</strong>. The contract analysis and the soil science on this page apply anywhere; the field-specific lookup does not.</>,
              <>Ranges come from meta-analyses of <em>other people&rsquo;s fields</em>. Your soil texture, drainage, rainfall and management history can put you outside these ranges in either direction.</>,
              <>Cost figures derive from SARE&rsquo;s 2019 survey<Cite src="sareCoverCropEconomics" /> and are presented as published. Input costs have moved since; treat them as relative magnitudes, not current quotes.</>,
              <>EQIP rates are state-set and revised annually. The range shown is the observed national spread and is explicitly an estimate — your state&rsquo;s published schedule is the only authority.</>,
              <>Program terms marked <em>self-reported</em> come from company materials and are not independently audited. They can change, and companies generally reserve the right to amend them.</>,
              <>Nitrous oxide, methane, and the emissions embedded in fertiliser and fuel are <strong>not</strong> modelled. A full farm carbon footprint is a different and harder question than the one this tool answers.</>,
            ].map((l, i) => (
              <li key={i} className="small" style={{ marginBottom: 9, color: 'var(--soil-700)' }}>{l}</li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}

function Metric({ label, value, unit, src, plain }) {
  return (
    <div>
      <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--soil-500)', marginBottom: 4 }}>
        {label}{src && <Cite src={src} />}
      </div>
      <div className={plain ? '' : 'mono'} style={{
        fontSize: plain ? 13.5 : 17, fontWeight: 700,
        color: 'var(--ink)', letterSpacing: plain ? 0 : '-0.01em',
      }}>
        {value}
      </div>
      <div className="tiny muted">{unit}</div>
    </div>
  );
}

function Caveat({ label, body, last }) {
  return (
    <div style={{ marginBottom: last ? 0 : 10 }}>
      <span className="tiny" style={{ fontWeight: 700, color: 'var(--green-700)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        {label}
      </span>
      <p className="small muted" style={{ margin: '3px 0 0' }}>{body}</p>
    </div>
  );
}

/** The full source list — every citation used anywhere in the app. */
export function Sources() {
  const entries = Object.entries(SOURCES);

  return (
    <section id="sources" className="section">
      <div className="wrap">
        <p className="eyebrow">References</p>
        <h2 style={{ marginBottom: 14 }}>Every number, traced</h2>
        <p className="lede" style={{ marginBottom: 30 }}>
          {entries.length} sources. Every quantitative claim on this site resolves to one of them — the code
          literally throws an error if a number is rendered without a registered citation, so an unsourced
          figure cannot ship.
        </p>

        <div className="grid" style={{ gap: 0 }}>
          {entries.map(([key, s], i) => {
            const tier = TIER_LABELS[s.tier];
            return (
              <div key={key} style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(110px, 130px) 1fr',
                gap: 18,
                padding: '18px 0',
                borderTop: i === 0 ? '1px solid var(--rule)' : 'none',
                borderBottom: '1px solid var(--rule)',
              }}>
                <div>
                  <span className="badge" style={{ background: `${tier.color}15`, color: tier.color }}>
                    {tier.label}
                  </span>
                  <div className="tiny muted mono" style={{ marginTop: 6 }}>{s.retrieved}</div>
                </div>

                <div>
                  <a href={s.url} target="_blank" rel="noopener noreferrer" style={{ fontWeight: 650, fontSize: 14.5 }}>
                    {s.title} ↗
                  </a>
                  <div className="small muted" style={{ marginTop: 2 }}>
                    {s.authors ? `${s.authors} — ` : ''}{s.org}{s.year ? `, ${s.year}` : ''}
                  </div>
                  {s.note && (
                    <p className="small" style={{ margin: '8px 0 0', color: 'var(--soil-700)' }}>{s.note}</p>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
