import { useState, useCallback } from 'react';
import { carbonSaturation, fieldAdjustedRange } from '../engine/saturation';
import { yieldDragRisk, additionalityRisk, rotationSummary } from '../engine/fieldRisk';
import { PRACTICES } from '../data/practices';
import Cite from './Cite';
import Disclosure from './Disclosure';

/**
 * FIELD INTELLIGENCE — the centrepiece.
 *
 * Drop a pin, get an answer about YOUR field rather than about the national average: what your soil
 * is made of, how much carbon it can physically still hold, whether no-till will cost you yield, and
 * whether a carbon program will even count your practice as new.
 *
 * All of it from free federal data that has been sitting there the whole time.
 */

const EXAMPLES = [
  { label: 'Story Co., Iowa',      lat: 42.15,  lon: -93.85,  note: 'Corn Belt Mollisol' },
  { label: 'Champaign Co., Ill.',  lat: 40.05,  lon: -88.35,  note: 'Prairie silt loam' },
  { label: 'Sumter Co., Georgia',  lat: 32.05,  lon: -84.20,  note: 'Coastal Plain sand' },
  { label: 'Whitman Co., Wash.',   lat: 46.85,  lon: -117.35, note: 'Palouse wheat' },
];

export default function FieldIntelligence({ onField }) {
  const [mode, setMode]       = useState('address');
  const [address, setAddress] = useState('');
  const [lat, setLat]         = useState('');
  const [lon, setLon]         = useState('');
  const [status, setStatus]   = useState('idle'); // idle | loading | done | error
  const [error, setError]     = useState(null);
  const [data, setData]       = useState(null);
  const [place, setPlace]     = useState(null);

  const lookup = useCallback(async (la, lo, label) => {
    setStatus('loading');
    setError(null);
    setData(null);
    try {
      const r = await fetch(`/api/field?lat=${la}&lon=${lo}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.detail || j.error || 'Lookup failed');

      setData(j);
      setPlace(label || `${Number(la).toFixed(4)}, ${Number(lo).toFixed(4)}`);
      setStatus('done');
      onField?.(j);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  }, [onField]);

  const submitAddress = async (e) => {
    e.preventDefault();
    if (!address.trim()) return;
    setStatus('loading');
    setError(null);
    try {
      const r = await fetch(`/api/geocode?q=${encodeURIComponent(address)}`);
      const j = await r.json();
      if (!r.ok) throw new Error(j.hint || j.error || 'Could not find that address');
      const m = j.results[0];
      await lookup(m.lat, m.lon, m.label);
    } catch (e) {
      setError(e.message);
      setStatus('error');
    }
  };

  const submitCoords = (e) => {
    e.preventDefault();
    const la = Number(lat), lo = Number(lon);
    if (!Number.isFinite(la) || !Number.isFinite(lo)) {
      setError('Enter valid numeric coordinates.');
      setStatus('error');
      return;
    }
    lookup(la, lo);
  };

  return (
    <section id="field" className="section" style={{ background: 'var(--paper)' }}>
      <div className="wrap">
        <p className="eyebrow">Field intelligence · live USDA data</p>
        <h2 style={{ marginBottom: 14 }}>Now do it for your actual field</h2>
        <p className="lede" style={{ marginBottom: 26 }}>
          Everything above is a national average. Your field is not a national average. Give us a
          location and we&rsquo;ll query the <strong>USDA soil survey</strong><Cite src="ssurgo" /> and{' '}
          <strong>USDA satellite crop records</strong><Cite src="cropscape" /> for that exact point, and
          tell you three things no carbon program will:
          how much carbon your soil can <em>physically</em> still hold, whether no-till will cost you
          yield, and whether they&rsquo;ll even count your practice as new.
        </p>

        {/* Input */}
        <div className="card" style={{ marginBottom: 24 }}>
          <div style={{ display: 'flex', gap: 6, marginBottom: 16 }}>
            {['address', 'coords'].map(m => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(null); }}
                className="small"
                style={{
                  padding: '6px 13px', borderRadius: 6, cursor: 'pointer',
                  fontWeight: 600,
                  border: `1px solid ${mode === m ? 'var(--green-700)' : 'var(--soil-300)'}`,
                  background: mode === m ? 'var(--green-50)' : 'transparent',
                  color: mode === m ? 'var(--green-900)' : 'var(--soil-600)',
                }}
              >
                {m === 'address' ? 'By address' : 'By coordinates'}
              </button>
            ))}
          </div>

          {mode === 'address' ? (
            <form onSubmit={submitAddress} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input
                className="input"
                style={{ flex: '1 1 320px' }}
                placeholder="Farm address, e.g. 1234 County Rd, Ames, IA"
                value={address}
                onChange={e => setAddress(e.target.value)}
              />
              <button type="submit" className="btn btn--primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Querying USDA…' : 'Analyse this field'}
              </button>
            </form>
          ) : (
            <form onSubmit={submitCoords} style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              <input className="input" style={{ flex: '1 1 150px' }} placeholder="Latitude, e.g. 42.15"
                value={lat} onChange={e => setLat(e.target.value)} />
              <input className="input" style={{ flex: '1 1 150px' }} placeholder="Longitude, e.g. -93.85"
                value={lon} onChange={e => setLon(e.target.value)} />
              <button type="submit" className="btn btn--primary" disabled={status === 'loading'}>
                {status === 'loading' ? 'Querying USDA…' : 'Analyse this field'}
              </button>
            </form>
          )}

          <p className="tiny muted" style={{ marginTop: 10, marginBottom: 14 }}>
            {mode === 'address'
              ? 'No address for the field itself? Switch to coordinates — long-press the field in any phone map app to read its lat/lon.'
              : 'Drop the pin in the middle of the field, not on a road or field edge — the soil survey and the satellite record are both spatially precise.'}
          </p>

          <div style={{ borderTop: '1px solid var(--rule)', paddingTop: 13 }}>
            <span className="tiny muted" style={{ marginRight: 8 }}>Or try a real field:</span>
            {EXAMPLES.map(ex => (
              <button
                key={ex.label}
                onClick={() => lookup(ex.lat, ex.lon, `${ex.label} — ${ex.note}`)}
                className="tiny"
                style={{
                  margin: '4px 6px 0 0', padding: '5px 10px', borderRadius: 100,
                  border: '1px solid var(--soil-300)', background: 'var(--soil-50)',
                  cursor: 'pointer', color: 'var(--soil-700)', fontWeight: 600,
                }}
              >
                {ex.label}
              </button>
            ))}
          </div>
        </div>

        {status === 'loading' && (
          <div className="callout callout--info">
            Querying USDA Soil Data Access and the Cropland Data Layer for that point. Federal
            services, federal speed — this can take a few seconds.
          </div>
        )}

        {status === 'error' && (
          <div className="callout callout--danger">
            <strong>Couldn&rsquo;t analyse that location.</strong> {error}
          </div>
        )}

        {status === 'done' && data && <FieldReport data={data} place={place} />}
      </div>
    </section>
  );
}

/* ────────────────────────────────────────────────────────────────────── */

function FieldReport({ data, place }) {
  const { soil, rotation, missing } = data;

  const canModel = !missing?.length;
  const sat = canModel ? carbonSaturation({
    omPct: soil.omPct, clayPct: soil.clayPct, siltPct: soil.siltPct,
    bulkDensity: soil.bulkDensity, depthCm: soil.depthCm,
  }) : null;

  const drag = yieldDragRisk(soil.drainageClass);
  const add  = additionalityRisk(rotation);

  return (
    <div className="grid" style={{ gap: 20 }} id="field-report">
      {/* Identity */}
      <div className="card">
        <div style={{ display: 'flex', justifyContent: 'space-between', gap: 14, flexWrap: 'wrap', alignItems: 'flex-start' }}>
          <div>
            <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-700)', marginBottom: 5 }}>
              Your soil — from the USDA national survey
            </div>
            <h3 style={{ fontSize: 21, marginBottom: 4 }}>{soil.mapUnitName}</h3>
            <p className="small muted" style={{ margin: 0 }}>
              {place} · {soil.seriesName} series ({soil.componentPct}% of this map unit)
              {soil.taxonomicOrder ? ` · ${soil.taxonomicOrder}` : ''} · SSURGO map unit {soil.mukey}
            </p>
          </div>
          <button onClick={() => window.print()} className="btn btn--ghost" style={{ fontSize: 13, padding: '8px 14px' }}>
            Print this report
          </button>
        </div>

        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(112px, 1fr))', gap: 14, marginTop: 18, paddingTop: 16, borderTop: '1px solid var(--rule)' }}>
          <Prop label="Organic matter" value={`${soil.omPct}%`} />
          <Prop label="Clay" value={`${soil.clayPct}%`} />
          <Prop label="Silt" value={`${soil.siltPct}%`} />
          <Prop label="Sand" value={`${soil.sandPct}%`} />
          <Prop label="Bulk density" value={soil.bulkDensity} />
          <Prop label="pH" value={soil.ph} />
          <Prop label="Drainage" value={soil.drainageClass} small />
        </div>
        <p className="tiny muted" style={{ marginTop: 12, marginBottom: 0 }}>
          Depth-weighted across the top {soil.depthCm} cm — the standard depth for soil carbon
          accounting — for the dominant soil component. A field can contain more than one soil; this
          is the one that covers most of it.<Cite src="ssurgo" />
        </p>
      </div>

      {/* THE headline: carbon saturation */}
      {sat ? <SaturationCard sat={sat} soil={soil} /> : (
        <div className="callout callout--warn">
          <strong>Can&rsquo;t run the saturation model on this soil.</strong> SSURGO is missing{' '}
          {missing.join(', ')} for this map unit, and we will not substitute a default to paper over a
          gap in the data. The rest of the report below still holds.
        </div>
      )}

      {/* The two risk screens */}
      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
        <RiskCard
          eyebrow="Will no-till cost you yield?"
          title={drag.label}
          color={drag.color}
          body={drag.body}
          foot={<>Predicted from your soil&rsquo;s SSURGO drainage class: <strong>{drag.drainageClass}</strong>.
            Drainage is the dominant control on no-till transition drag, and it is free public data
            that no carbon program will look up for you.<Cite src="ssurgo" /></>}
          metric={drag.known ? `${drag.expectedYieldPct > 0 ? '+' : ''}${drag.expectedYieldPct}%` : '—'}
          metricLabel="expected early-year yield effect"
        />

        <RiskCard
          eyebrow="Will they count your practice as new?"
          title={add.label}
          color={add.color}
          body={add.body}
          foot={rotation.length > 0 ? (
            <>Read from USDA satellite crop records for this exact point:{' '}
              <strong className="mono">{rotationSummary(rotation)}</strong>
              <Cite src="cropscape" /></>
          ) : <>No crop history available for this point.<Cite src="cropscape" /></>}
        />
      </div>

      {/* What this means for the contract */}
      {sat && <Recommendation sat={sat} drag={drag} add={add} />}
    </div>
  );
}

function SaturationCard({ sat, soil }) {
  const b = sat.band;
  const pct = Math.min(100, sat.csi * 100);

  return (
    <div className="card" style={{ borderLeft: `4px solid ${b.color}` }}>
      <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: b.color, marginBottom: 6 }}>
        Carbon saturation — how much carbon can this soil physically still hold?
      </div>

      <div style={{ display: 'flex', gap: 20, flexWrap: 'wrap', alignItems: 'baseline', marginBottom: 6 }}>
        <h3 style={{ fontSize: 23, color: b.color }}>{b.label}</h3>
        <span className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--soil-600)' }}>
          CSI {sat.csi}
        </span>
      </div>
      <p style={{ fontSize: 15, fontWeight: 600, margin: '0 0 12px', color: 'var(--ink)' }}>
        {b.verdict}
      </p>

      {/* Saturation bar */}
      <div style={{ marginBottom: 16 }}>
        <div style={{
          position: 'relative', height: 12, borderRadius: 100,
          background: 'var(--soil-200)', overflow: 'hidden',
        }}>
          <div style={{
            position: 'absolute', inset: 0, width: `${pct}%`,
            background: b.color, borderRadius: 100, transition: 'width 0.5s ease',
          }} />
          {/* capacity marker at CSI = 1.0 */}
          <div style={{
            position: 'absolute', left: `${Math.min(100, 100 / Math.max(sat.csi, 1) * 1)}%`,
            top: -3, bottom: -3, width: 2, background: 'var(--soil-900)',
            display: sat.csi > 1 ? 'block' : 'none',
          }} />
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 5 }}>
          <span className="tiny muted">Empty</span>
          <span className="tiny muted">
            Mineral protective capacity {sat.csi > 1 ? '(exceeded)' : ''}
          </span>
        </div>
      </div>

      <p className="small" style={{ color: 'var(--soil-700)', marginTop: 0, marginBottom: 16 }}>
        {b.body}
      </p>

      {/* The arithmetic — collapsed, because most farmers want the answer and every reviewer wants
          the working, and neither should have to scroll past the other. */}
      <Disclosure summary="Show your work">
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(135px, 1fr))', gap: 12, marginBottom: 4 }}>
          <Calc label="Your soil carbon" value={`${sat.socGkg} g C/kg`} sub={`from ${soil.omPct}% OM ÷ 1.724`} />
          <Calc label="Fine fraction (<20µm)" value={`${sat.fineFractionPct}%`} sub={`${soil.clayPct}% clay + ½×${soil.siltPct}% silt`} />
          <Calc label="Protective capacity" value={`${sat.cSatGkg} g C/kg`} sub="4.09 + 0.37 × fine fraction" cite="hassink1997" />
          <Calc label="Saturation index" value={sat.csi} sub="carbon ÷ capacity" />
        </div>
      </Disclosure>

      {sat.deficitStockTonsPerHa > 0 ? (
        <div className="callout callout--good" style={{ fontSize: 13 }}>
          <strong>Estimated headroom: {sat.headroomCO2ePerAcre} t CO₂e/ac.</strong> That is the total
          additional carbon your soil&rsquo;s mineral fraction could still protect — not an annual rate,
          but a ceiling on the whole opportunity. Accrual slows as you approach it.
        </div>
      ) : (
        <div className="callout callout--danger" style={{ fontSize: 13 }}>
          <strong>No mineral headroom left.</strong> Your soil already holds more organic carbon than
          its fine fraction can physically protect. Carbon added here accumulates in unprotected
          particulate form and is vulnerable to loss on tillage.<Cite src="cotrufo2019" /> Be very
          sceptical of any per-ton projection for this field.
        </div>
      )}

      <Disclosure summary="How much should you trust this number?" tone="warn">
        <p style={{ margin: '0 0 8px' }}>
          Read CSI as a <strong>coarse three-way screen</strong> — plenty of room, marginal, or full —
          never as a precise figure.
        </p>
        <p style={{ margin: '0 0 8px' }}>
          We tested it against 16,014 laboratory-measured soil samples<Cite src="raca" /> and published
          the results, <strong>including where it fails</strong>. The mechanism holds up, but our model
          reads <em>less saturated</em> than the lab data does — meaning we may be overstating how much
          room your soil has. If we are wrong, we are probably wrong in the optimistic direction.
        </p>
        <p style={{ margin: 0 }}>
          <a href="#/methodology">See the full validation →</a>
        </p>
      </Disclosure>
    </div>
  );
}

/** The synthesis: given saturation + drainage + additionality, what should this farmer actually do? */
function Recommendation({ sat, drag, add }) {
  const saturated = sat.band.key === 'saturated' || sat.band.key === 'near-capacity';
  const dragRisky = drag.level === 'high';

  const cc = fieldAdjustedRange(PRACTICES['cover-crops'].sequestration, sat.band);
  const nt = fieldAdjustedRange(PRACTICES['no-till'].sequestration, sat.band);

  let headline, tone, body;

  if (add.level === 'blocker') {
    tone = 'callout--danger';
    headline = 'Check your coordinates before going further';
    body = 'Satellite records do not classify this point as cropland, so the analysis above may not ' +
           'describe the ground you meant. Try a point squarely inside the field.';
  } else if (saturated && dragRisky) {
    tone = 'callout--danger';
    headline = 'Do not sign a per-ton carbon contract on this field';
    body = 'This field has two independent strikes against it. Its soil is at or beyond its mineral ' +
           'protective capacity, so it is physically unlikely to deliver the tons a per-ton contract ' +
           'pays for — and you would be the one carrying that measurement risk. On top of that, its ' +
           'drainage class predicts a real no-till yield penalty. If you want to farm these practices ' +
           'for agronomic reasons, do it — but take USDA cost-share, which pays you for the PRACTICE ' +
           'regardless of what the soil does, and steer well clear of per-ton carbon deals here.';
  } else if (saturated) {
    tone = 'callout--warn';
    headline = 'Prefer a flat per-acre program — your soil is near capacity';
    body = 'Your soil has limited physical room left to stabilise new carbon, so a per-ton contract ' +
           'is a bad bet: you would be paid only if tons materialise, and the mineralogy says they ' +
           'probably will not. A flat per-acre program (or USDA cost-share) pays you for adopting the ' +
           'practice regardless — which is exactly the right structure for a soil like this.';
  } else if (dragRisky) {
    tone = 'callout--warn';
    headline = 'Good carbon soil — but budget for the yield drag';
    body = 'Your soil has genuine headroom to store carbon, which is the hard part. The catch is ' +
           'drainage: expect a real yield penalty during the no-till transition. Consider strip-till ' +
           'as a middle path, and make sure any contract you sign does not assume yields hold flat ' +
           'from year one.';
  } else {
    tone = 'callout--good';
    headline = 'This field is a genuinely good candidate';
    body = 'Your soil has real headroom to stabilise new carbon, drainage does not predict a ' +
           'meaningful yield penalty, and your cropping history supports an additionality claim. ' +
           'That combination is not common. It does not make any particular contract a good deal — ' +
           'read the terms below — but the ground itself is on your side.';
  }

  return (
    <div className="card">
      <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--green-700)', marginBottom: 10 }}>
        What this means for you
      </div>

      <div className={`callout ${tone}`} style={{ marginBottom: 18 }}>
        <div style={{ fontWeight: 750, fontSize: 15.5, marginBottom: 5 }}>{headline}</div>
        <div style={{ fontSize: 13.5 }}>{body}</div>
      </div>

      <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--soil-500)', marginBottom: 10 }}>
        Sequestration, adjusted for your soil
      </div>
      <p className="small muted" style={{ marginTop: 0, marginBottom: 14 }}>
        The published national ranges, scaled by your field&rsquo;s saturation state
        (×{sat.band.sequestrationMultiplier}). A saturated soil earns less than the literature average
        because the literature average includes soils with headroom.
      </p>

      <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))' }}>
        <AdjRange name="Cover crops" r={cc} base={PRACTICES['cover-crops'].sequestration} src="joshi2023" />
        <AdjRange name="No-till" r={nt} base={PRACTICES['no-till'].sequestration} src="powlson2014" />
      </div>
    </div>
  );
}

/* ── small pieces ───────────────────────────────────────────────────── */

function Prop({ label, value, small }) {
  return (
    <div>
      <div className="tiny muted" style={{ marginBottom: 2 }}>{label}</div>
      <div className={small ? '' : 'mono'} style={{ fontSize: small ? 12.5 : 16, fontWeight: 700, color: 'var(--ink)' }}>
        {value ?? '—'}
      </div>
    </div>
  );
}

function Calc({ label, value, sub, cite }) {
  return (
    <div>
      <div className="tiny muted">{label}{cite && <Cite src={cite} />}</div>
      <div className="mono" style={{ fontSize: 15, fontWeight: 700, color: 'var(--ink)', margin: '2px 0' }}>
        {value}
      </div>
      <div className="tiny muted mono" style={{ fontSize: 10 }}>{sub}</div>
    </div>
  );
}

function RiskCard({ eyebrow, title, color, body, foot, metric, metricLabel }) {
  return (
    <div className="card" style={{ borderTop: `3px solid ${color}` }}>
      <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--soil-500)', marginBottom: 7 }}>
        {eyebrow}
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', marginBottom: 10 }}>
        <h3 style={{ fontSize: 16, color }}>{title}</h3>
        {metric && (
          <div style={{ textAlign: 'right', flexShrink: 0 }}>
            <div className="mono" style={{ fontSize: 20, fontWeight: 700, color }}>{metric}</div>
            <div className="tiny muted" style={{ maxWidth: 110 }}>{metricLabel}</div>
          </div>
        )}
      </div>

      <p className="small" style={{ color: 'var(--soil-700)', marginTop: 0, marginBottom: 12 }}>{body}</p>
      <p className="tiny muted" style={{ margin: 0, paddingTop: 10, borderTop: '1px solid var(--rule)' }}>
        {foot}
      </p>
    </div>
  );
}

function AdjRange({ name, r, base, src }) {
  return (
    <div style={{ background: 'var(--soil-50)', borderRadius: 8, padding: 14 }}>
      <div style={{ fontWeight: 650, fontSize: 14, marginBottom: 6 }}>{name}<Cite src={src} /></div>
      <div className="mono" style={{ fontSize: 18, fontWeight: 700, color: 'var(--green-900)' }}>
        {r.low.toFixed(2)}–{r.high.toFixed(2)}
      </div>
      <div className="tiny muted">t CO₂e/ac/yr, adjusted for your soil</div>
      <div className="tiny muted mono" style={{ marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--soil-200)' }}>
        national: {base.low.toFixed(2)}–{base.high.toFixed(2)}
      </div>
    </div>
  );
}
