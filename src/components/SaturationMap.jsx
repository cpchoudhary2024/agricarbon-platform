import { useState, useMemo, useEffect, useDeferredValue } from 'react';
import { saturationBand } from '../engine/saturation';
import Cite from './Cite';
import Disclosure from './Disclosure';

/**
 * THE NATIONAL CARBON SATURATION MAP
 *
 * Where in America can soil actually still hold carbon — and where is a carbon pitch
 * running into physics?
 *
 * Computed from USDA SSURGO for every county in the continental United States, restricted to
 * arable (land capability class 1–3) soils. To our knowledge this has not been published
 * before, which is less a boast than an indictment: the data was free and public the whole time.
 */

const BANDS = [
  { key: 'high-headroom',     label: 'Large headroom',     color: '#15803D', desc: 'CSI < 0.6 — soil well below its mineral protective capacity' },
  { key: 'moderate-headroom', label: 'Moderate headroom',  color: '#65A30D', desc: 'CSI 0.6–0.9' },
  { key: 'near-capacity',     label: 'Approaching capacity', color: '#D97706', desc: 'CSI 0.9–1.1 — expect underperformance' },
  { key: 'saturated',         label: 'At/beyond capacity', color: '#B91C1C', desc: 'CSI > 1.1 — little room for new stable carbon' },
];

const COLOR = Object.fromEntries(BANDS.map(b => [b.key, b.color]));

export default function SaturationMap() {
  const [hover, setHover] = useState(null);
  const [pinned, setPinned] = useState(null);
  const [data, setData] = useState(null);
  const deferredHover = useDeferredValue(hover);

  /**
   * The county geometry and saturation data together are ~600 KB — worth it for the map, dead
   * weight for a visitor who never scrolls this far. Code-split them out of the main bundle so
   * the page paints immediately and the map streams in behind it.
   */
  useEffect(() => {
    let alive = true;
    Promise.all([
      import('../data/countyPaths.json'),
      import('../data/countySaturation.json'),
    ]).then(([paths, sat]) => {
      if (alive) setData({ paths: paths.default, sat: sat.default });
    });
    return () => { alive = false; };
  }, []);

  const active = pinned ?? deferredHover;
  const activeData = active && data ? data.sat[active] : null;

  const stats = useMemo(() => {
    if (!data) return null;
    const all = Object.values(data.sat);
    const counts = {};
    for (const c of all) counts[c.band] = (counts[c.band] ?? 0) + 1;
    const tight = (counts['near-capacity'] ?? 0) + (counts['saturated'] ?? 0);

    // Rank states by mean CSI, for the "where is the physics against you" callout.
    const byState = {};
    for (const c of all) {
      (byState[c.st] ??= []).push(c.csi);
    }
    const ranked = Object.entries(byState)
      .filter(([, v]) => v.length >= 20)
      .map(([st, v]) => ({ st, mean: v.reduce((a, b) => a + b, 0) / v.length, n: v.length }))
      .sort((a, b) => b.mean - a.mean);

    return {
      n: all.length,
      counts,
      pctTight: (tight / all.length) * 100,
      worst: ranked.slice(0, 5),
      best: ranked.slice(-5).reverse(),
    };
  }, [data]);

  return (
    <section id="map" className="section" style={{ background: 'var(--paper)' }}>
      <div className="wrap">
        <p className="eyebrow">
          The national picture{stats ? ` · ${stats.n.toLocaleString()} counties` : ''}
        </p>
        <h2 style={{ marginBottom: 14 }}>Where can soil still hold carbon?</h2>
        <p className="lede" style={{ marginBottom: 20 }}>
          Soil has a <strong>finite capacity</strong> to protect carbon, set by its clay and silt
          content.<Cite src="hassink1997" /> So we computed that capacity for the arable soil of every
          county in the continental US, from the USDA soil survey.<Cite src="ssurgo" /> Red counties are
          running out of room — carbon farming there is fighting physics, and a per-ton contract is a
          bad bet.
        </p>

        <div className="callout callout--info" style={{ marginBottom: 22 }}>
          <strong>We could not find this map anywhere else.</strong> Every input is free, public,
          federal data that has been sitting there for years. Take it, check it, argue with it — the
          harvesting script is in{' '}
          <code style={{ fontSize: 12.5 }}>scripts/harvest-counties.mjs</code> and the model is in{' '}
          <code style={{ fontSize: 12.5 }}>src/engine/saturation.js</code>.
        </div>

        {/* Map */}
        <div className="card" style={{ padding: 0, overflow: 'hidden', position: 'relative' }}>
          <div style={{ position: 'relative', background: '#FAFAF9', minHeight: 200 }}>
            {!data ? (
              <div style={{
                aspectRatio: '960 / 605', display: 'grid', placeItems: 'center',
              }}>
                <span className="small muted">Loading 3,100 counties…</span>
              </div>
            ) : (
            <svg
              viewBox={`0 0 ${data.paths.width} ${data.paths.height}`}
              style={{ width: '100%', height: 'auto', display: 'block' }}
              role="img"
              aria-label="Choropleth map of carbon saturation index for arable soils in every county of the continental United States"
              onMouseLeave={() => setHover(null)}
            >
              {Object.entries(data.paths.paths).map(([fips, d]) => {
                const c = data.sat[fips];
                const isActive = active === fips;
                return (
                  <path
                    key={fips}
                    d={d}
                    fill={c ? COLOR[c.band] : '#E7E5E4'}
                    stroke={isActive ? '#1C1917' : '#FFFFFF'}
                    strokeWidth={isActive ? 1.4 : 0.18}
                    onMouseEnter={() => setHover(fips)}
                    onClick={() => setPinned(p => (p === fips ? null : fips))}
                    /* Keyboard access: a map that only answers to a mouse is a map that excludes
                       people, and 3,000 tab stops would be worse than none. So the shapes stay
                       inert for the keyboard and the searchable county list below carries the
                       same data — see the note under the map. */
                    aria-hidden="true"
                    style={{ cursor: c ? 'pointer' : 'default', outline: 'none' }}
                  />
                );
              })}
            </svg>
            )}

            {/* Readout. Sits top-RIGHT: the top-left of a CONUS Albers frame is the Pacific
                Northwest, and a panel there would cover Washington and Oregon — which happen to
                be two of the most saturated states on the map. Above New England is open ocean. */}
            <div
              style={{
                position: 'absolute', top: 12, right: 12,
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid var(--soil-300)',
                borderRadius: 8,
                padding: '12px 14px',
                minWidth: 218,
                pointerEvents: 'none',
                boxShadow: '0 4px 14px rgba(28,25,23,0.09)',
              }}
            >
              {activeData ? (
                <>
                  <div style={{ fontWeight: 750, fontSize: 14 }}>
                    {activeData.name}
                  </div>
                  <div className="tiny muted" style={{ marginBottom: 8 }}>{activeData.st}</div>

                  <div style={{ display: 'flex', alignItems: 'baseline', gap: 7, marginBottom: 8 }}>
                    <span className="mono" style={{ fontSize: 22, fontWeight: 700, color: COLOR[activeData.band] }}>
                      {activeData.csi}
                    </span>
                    <span className="tiny" style={{ fontWeight: 700, color: COLOR[activeData.band] }}>
                      {saturationBand(activeData.csi).label}
                    </span>
                  </div>

                  <div className="tiny muted mono" style={{ lineHeight: 1.7 }}>
                    organic matter {activeData.om}%<br />
                    clay {activeData.clay}% · silt {activeData.silt}%<br />
                    {activeData.headroom > 0
                      ? `headroom ${activeData.headroom} t CO₂e/ac`
                      : 'no mineral headroom'}
                  </div>
                </>
              ) : (
                <div className="tiny muted">
                  Hover a county.<br />Click to pin it.
                </div>
              )}
            </div>

            {/* Legend */}
            <div
              style={{
                position: 'absolute', bottom: 12, left: 12,
                background: 'rgba(255,255,255,0.96)',
                border: '1px solid var(--soil-300)',
                borderRadius: 8, padding: '10px 12px',
              }}
            >
              <div className="tiny" style={{ fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--soil-500)', marginBottom: 7 }}>
                Carbon saturation index
              </div>
              {BANDS.map(b => (
                <div key={b.key} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 3 }}>
                  <span style={{ width: 12, height: 12, borderRadius: 3, background: b.color, flexShrink: 0 }} />
                  <span className="tiny" style={{ color: 'var(--soil-700)' }}>
                    {b.label}
                    {stats && <span className="muted"> · {(stats.counts[b.key] ?? 0).toLocaleString()}</span>}
                  </span>
                </div>
              ))}
              <div style={{ display: 'flex', alignItems: 'flex-start', gap: 7, marginTop: 5, paddingTop: 5, borderTop: '1px solid var(--rule)' }}>
                <span style={{ width: 12, height: 12, borderRadius: 3, background: '#E7E5E4', flexShrink: 0, marginTop: 2 }} />
                <span className="tiny muted" style={{ maxWidth: 150, lineHeight: 1.45 }}>
                  <strong style={{ color: 'var(--soil-600)' }}>No cropland</strong><br />
                  mountain, desert or urban — nothing farmable to assess
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Pre-empt the first question everyone asks about this map. The grey is not missing data —
            it is the answer — and saying so turns a perceived gap into evidence the filter works. */}
        <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
          <strong style={{ color: 'var(--soil-700)' }}>The grey counties are not missing data.</strong>{' '}
          They have no class 1–3 arable soil at all, so there is no cropland there to assess. Colorado
          looks patchy because 23 of its counties <em>are</em> the Rocky Mountains — Summit, Eagle,
          Pitkin (Breckenridge, Vail, Aspen). The rest of the grey is Sierra Nevada, Appalachian coal
          country, Nevada desert — and San Francisco. If a city and a ski resort come back grey, the
          filter is doing its job.<Cite src="ssurgo" />
        </p>

        {/* Accessible, searchable equivalent of the map. Also just faster than hunting for your
            county with a mouse. */}
        <CountySearch data={data} onPick={setPinned} />

        {/* Findings */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(290px, 1fr))', marginTop: 22 }}>
          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>
              The South has the most headroom — because it was farmed the hardest
            </h3>
            <p className="small muted" style={{ margin: 0 }}>
              The counties with the greatest capacity to store new carbon are concentrated in the
              Southeast, where soils carry roughly <strong>1% organic matter</strong>. That is not good
              news, it is a scar: a century of intensive cultivation in a warm, wet climate stripped
              the carbon out. The upside is that the room they lost is room a farmer can now be paid to
              refill — and the physics is genuinely on their side.
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>
              Cool, wet, high-organic-matter soils are close to full
            </h3>
            <p className="small muted" style={{ margin: 0 }}>
              The Northeast and Pacific Northwest hold the most saturated arable soils in the country.
              Their soils are rich, which sounds like an advantage and is the opposite of one here:
              rich means <em>full</em>. Additional carbon has fewer mineral surfaces left to bind to, so
              it accumulates in unprotected form and is easily lost again.<Cite src="cotrufo2019" />
            </p>
          </div>

          <div className="card">
            <h3 style={{ fontSize: 15, marginBottom: 8 }}>
              Your county is not your field
            </h3>
            <p className="small muted" style={{ margin: 0 }}>
              This is the most important caveat on the page. Within-county variation is large: the Iowa
              field in the lookup above scores <strong>CSI 1.61</strong> — saturated — while its county
              averages well below that, because that field sits on a high-organic-matter Mollisol and
              its county does not. Use the map to see which way the physics leans in your region. Use{' '}
              <a href="#field">the field lookup</a> for your actual ground.
            </p>
          </div>
        </div>

        {/* Method + honesty — collapsed. It matters, and it should not be the first thing a farmer
            has to wade through to find their county. */}
        <div className="card" style={{ marginTop: 20, background: 'var(--soil-50)' }}>
          <Disclosure summary="How this map was made, and what it can’t tell you" tone="warn">
            <ul style={{ margin: 0, paddingLeft: 18 }}>
              <li style={{ marginBottom: 7 }}>
                We sampled points inside each county, asked SSURGO<Cite src="ssurgo" /> which soils lie
                under them, and took the <strong>acre-weighted mean</strong> of organic matter, clay,
                silt and bulk density across the top 30 cm.
              </li>
              <li style={{ marginBottom: 7 }}>
                <strong>Arable soils only</strong> (land capability class 1–3, excluding peat). Not
                cosmetic: without this filter, county averages are swamped by forest and wetland soils
                at 20&ndash;27% organic matter. Our first attempt ranked <em>Maine</em> the most
                carbon-saturated state in America — a fact about its forests, not its fields.
              </li>
              <li style={{ marginBottom: 7 }}>
                A <strong>regional screen, not a field-level answer</strong>. We know which soils
                <em> could</em> be farmed, not which ones actually are.
              </li>
              <li style={{ margin: 0 }}>
                CSI is an index, not a lab measurement.<Cite src="cotrufo2019" />{' '}
                <a href="#/methodology">See the validation →</a>
              </li>
            </ul>
          </Disclosure>
        </div>
      </div>
    </section>
  );
}

/**
 * Searchable county table.
 *
 * The SVG map is unusable with a keyboard or a screen reader, and putting 3,000 counties into the
 * tab order would be worse than leaving them out. So the map is marked aria-hidden and this is the
 * real interface underneath it: same data, keyboard-navigable, readable aloud. It is also simply
 * the faster way to answer "what about MY county", which is the only question most people bring to
 * a national map.
 */
function CountySearch({ data, onPick }) {
  const [q, setQ] = useState('');

  const results = useMemo(() => {
    if (!data || q.trim().length < 2) return [];
    const needle = q.trim().toLowerCase();
    return Object.entries(data.sat)
      .filter(([, c]) =>
        c.name.toLowerCase().includes(needle) ||
        c.st.toLowerCase() === needle ||
        `${c.name}, ${c.st}`.toLowerCase().includes(needle)
      )
      .sort((a, b) => a[1].name.localeCompare(b[1].name))
      .slice(0, 40);
  }, [data, q]);

  return (
    <div className="card" style={{ marginTop: 20 }}>
      <label className="label" htmlFor="county-search">Look up a county</label>
      <input
        id="county-search"
        className="input"
        type="search"
        placeholder="County or state — e.g. “Story” or “IA”"
        value={q}
        onChange={(e) => setQ(e.target.value)}
        disabled={!data}
        style={{ maxWidth: 420 }}
      />
      <p className="tiny muted" style={{ marginTop: 7, marginBottom: 0 }}>
        The map above is hidden from assistive technology — this table carries the same data and
        works with a keyboard and a screen reader.
      </p>

      {results.length > 0 && (
        <div className="table-scroll" style={{ marginTop: 16 }}>
          <table className="matrix" style={{ minWidth: 560, fontSize: 13 }}>
            <thead>
              <tr>
                <th>County</th>
                <th>Saturation</th>
                <th>CSI</th>
                <th>Organic matter</th>
                <th>Headroom</th>
              </tr>
            </thead>
            <tbody>
              {results.map(([fips, c]) => {
                const band = BANDS.find((b) => b.key === c.band);
                return (
                  <tr
                    key={fips}
                    tabIndex={0}
                    onFocus={() => onPick(fips)}
                    onClick={() => onPick(fips)}
                    style={{ cursor: 'pointer' }}
                  >
                    <td style={{ fontWeight: 600 }}>{c.name}, {c.st}</td>
                    <td>
                      <span className="badge" style={{ background: `${band.color}18`, color: band.color }}>
                        {band.label}
                      </span>
                    </td>
                    <td className="mono">{c.csi}</td>
                    <td className="mono">{c.om}%</td>
                    <td className="mono">{c.headroom > 0 ? `${c.headroom} t CO₂e/ac` : 'none'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {q.trim().length >= 2 && results.length === 0 && (
        <p className="small muted" style={{ marginTop: 14, marginBottom: 0 }}>
          No match. Counties with no surveyed arable soil are not listed.
        </p>
      )}
    </div>
  );
}
