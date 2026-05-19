import { useState, useEffect, useCallback } from 'react';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine,
} from 'recharts';

// ─── Dynamic price history generator ─────────────────────────────
// Produces the last 28 trading days (Mon–Fri) ending today.
// Uses a date-seeded LCG so the chart is stable within a day but
// shifts naturally the next session — no hardcoded dates.
function seededRng(seed) {
  let s = seed >>> 0;
  return () => { s = Math.imul(s, 1664525) + 1013904223 >>> 0; return s / 4294967296; };
}

function getTradingDays(n) {
  const days = [];
  const cursor = new Date();
  cursor.setHours(0, 0, 0, 0);
  while (days.length < n) {
    cursor.setDate(cursor.getDate() - 1);
    const dow = cursor.getDay();
    if (dow !== 0 && dow !== 6) days.unshift(new Date(cursor));
  }
  return days;
}

function generateBaseChart(euPrice, caPrice) {
  const today = new Date();
  const seed  = today.getFullYear() * 10000 + (today.getMonth() + 1) * 100 + today.getDate();
  const rng   = seededRng(seed);
  const days  = getTradingDays(28);

  // Build price path backwards from current price (random walk, mean-reverting)
  const euPrices = [euPrice];
  const caPrices = [caPrice];
  for (let i = 1; i < 28; i++) {
    const euStep = (rng() - 0.495) * euPrice * 0.018; // ~1.8% daily vol
    const caStep = (rng() - 0.495) * caPrice * 0.014; // ~1.4% daily vol
    euPrices.unshift(parseFloat(Math.max(euPrice * 0.75, euPrices[0] + euStep).toFixed(2)));
    caPrices.unshift(parseFloat(Math.max(caPrice * 0.75, caPrices[0] + caStep).toFixed(2)));
  }

  return days.map((d, i) => ({
    date:       d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
    euEts:      euPrices[i],
    california: caPrices[i],
  }));
}

// Estimated prices for 2026 — used when live API is unavailable.
// EU ETS: ICE EUA ~€68 × 1.09 EUR/USD · CA CCA: ICE CCA · Others: Ecosystem MP estimates
const FALLBACK = {
  euEts:      { price: 74.10, change: -1.8 },
  california: { price: 34.50, change: +0.6 },
  rggi:       { price: 21.20, change: +1.1 },
  vcs:        { price: 11.80, change: -0.9 },
  gs:         { price: 23.50, change: +0.5 },
  vvm:        { price: 9.20,  change: -0.4 },
};

const EUR_USD   = 1.09;  // EUR/USD approx 2026
const CACHE_KEY = 'agri_cpt_v7';
const CACHE_TTL = 23 * 60 * 60 * 1000;

// Build chart using dynamic generator, then update today's last point with live prices if available
function buildChartData(liveEuEts, liveCa) {
  const euAnchor = liveEuEts ?? FALLBACK.euEts.price;
  const caAnchor = liveCa    ?? FALLBACK.california.price;
  const data = generateBaseChart(euAnchor, caAnchor);
  // Ensure last point reflects live price exactly
  if (liveEuEts != null) data[data.length - 1].euEts      = liveEuEts;
  if (liveCa    != null) data[data.length - 1].california = liveCa;
  return data;
}

// Strategy A: Yahoo Finance v7 quote — direct (no proxy), works intermittently
async function tryYahooQuoteDirect() {
  const url = 'https://query1.finance.yahoo.com/v7/finance/quote?symbols=EUA%3DF%2CCCA%3DF&fields=regularMarketPrice,regularMarketChangePercent';
  const res  = await fetch(url, { signal: AbortSignal.timeout(8000) });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const json    = await res.json();
  const results = json?.quoteResponse?.result;
  if (!results?.length) throw new Error('no results');
  return results;
}

// Strategy B: v8 chart for one symbol via allorigins /get (JSON envelope)
async function tryChartViaAllOrigins(symbol, conv) {
  const target  = `https://query1.finance.yahoo.com/v8/finance/chart/${symbol}?range=5d&interval=1d&includePrePost=false`;
  const proxy   = `https://api.allorigins.win/get?url=${encodeURIComponent(target)}`;
  const res     = await fetch(proxy, { signal: AbortSignal.timeout(14000) });
  if (!res.ok) throw new Error(`proxy ${res.status}`);
  const envelope = await res.json();
  if (!envelope?.contents) throw new Error('empty');
  const json   = JSON.parse(envelope.contents);
  const result = json?.chart?.result?.[0];
  if (!result) throw new Error('no result');
  const raw    = result.meta?.regularMarketPrice;
  if (!raw)    throw new Error('no price');
  const closes = result.indicators?.quote?.[0]?.close ?? [];
  const prev   = closes[closes.length - 2];
  const price  = parseFloat((raw * conv).toFixed(2));
  const change = prev ? +((raw * conv - prev * conv) / (prev * conv) * 100).toFixed(1) : 0;
  return { price, change };
}

function readCache() {
  try {
    const raw = localStorage.getItem(CACHE_KEY);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    return Date.now() - ts < CACHE_TTL ? data : null;
  } catch { return null; }
}
function writeCache(payload) {
  try { localStorage.setItem(CACHE_KEY, JSON.stringify({ data: payload, ts: Date.now() })); } catch {}
}

// ─── Design tokens ────────────────────────────────────────────────
const F = { head: '#052E16', body: '#1A2E22', muted: '#4B6357', faint: '#8A9F95' };
const G = { '700': '#155233', '300': '#4ADE80', '100': '#DCFCE7' };

const MARKETS = [
  { key: 'euEts',      label: 'EU ETS',              subLabel: 'European Allowance',      type: 'compliance', color: '#1e40af', badge: 'Compliance', live: true,  note: 'ICE EUA futures · EUR×1.085', range: '€55–€80' },
  { key: 'california', label: 'California WCI',       subLabel: 'Cap-and-Trade',           type: 'compliance', color: '#7c3aed', badge: 'Compliance', live: true,  note: 'ICE CCA futures',               range: '$28–$36' },
  { key: 'rggi',       label: 'RGGI',                 subLabel: 'Regional GHG Initiative', type: 'compliance', color: '#0891b2', badge: 'Quarterly',  live: false, note: 'RGGI Inc. Q1 2025 auction',     range: '$16–$22' },
  { key: 'vcs',        label: 'Verra VCS',            subLabel: 'Nature-based Credits',    type: 'voluntary',  color: '#155233', badge: 'Voluntary',  live: false, note: 'Ecosystem Marketplace 2024',    range: '$4–$18'  },
  { key: 'gs',         label: 'Gold Standard',        subLabel: 'Certified Credits',       type: 'voluntary',  color: '#CA8A04', badge: 'Voluntary',  live: false, note: 'Ecosystem Marketplace 2024',    range: '$12–$35' },
  { key: 'vvm',        label: 'VCM Average',          subLabel: 'Voluntary Market Avg',    type: 'voluntary',  color: '#4B6357', badge: 'Voluntary',  live: false, note: 'Ecosystem Marketplace 2024',    range: '$3–$15'  },
];

const STATUS_CFG = {
  live:       { dot: '#22C55E', glow: 'rgba(34,197,94,0.2)',   label: 'Live',         text: 'EU ETS & CA via Yahoo Finance', pulse: true  },
  partial:    { dot: '#CA8A04', glow: 'rgba(202,138,4,0.2)',   label: 'Partial live', text: 'One market live · other: estimated 2026 price', pulse: false },
  historical: { dot: '#8A9F95', glow: 'rgba(138,159,149,0.2)', label: 'Estimated',    text: 'Live feeds unavailable · showing 2026 estimated prices · Refresh to retry', pulse: false },
  idle:       { dot: '#DDD5C4', glow: 'rgba(221,213,196,0.2)', label: 'Loading…',     text: '', pulse: true },
};

function ChartTip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: '#FEFDF9', border: '1px solid #DDD5C4', borderRadius: '10px', padding: '10px 14px', boxShadow: '0 6px 24px rgba(5,46,22,0.12)', fontFamily: 'Inter, sans-serif', fontSize: '11px' }}>
      <p style={{ color: F.faint, margin: '0 0 5px', fontWeight: 600 }}>{label}</p>
      {payload.map(p => p.value != null && (
        <p key={p.dataKey} style={{ margin: '2px 0', color: p.color, fontWeight: 700 }}>
          {p.name}: <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '15px' }}>${p.value.toFixed(2)}</span>/tCO₂
        </p>
      ))}
    </div>
  );
}

export default function CarbonPriceTracker({ onSelectPrice }) {
  const [prices,      setPrices]      = useState(FALLBACK);
  const [chartData,   setChartData]   = useState(buildChartData(null, null));
  const [loading,     setLoading]     = useState(false);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [liveStatus,  setLiveStatus]  = useState('idle');
  const [tooltip,     setTooltip]     = useState(null);

  const fetchLive = useCallback(async (force = false) => {
    if (!force) {
      const c = readCache();
      if (c) {
        setPrices(c.prices);
        setChartData(buildChartData(c.liveEuEts ?? null, c.liveCa ?? null));
        setLastUpdated(new Date(c.savedAt));
        setLiveStatus(c.liveStatus ?? 'historical');
        return;
      }
    }
    setLoading(true);

    let newPrices    = { ...FALLBACK };
    let liveEuEts    = null;
    let liveCa       = null;
    let successCount = 0;

    // Strategy A: direct Yahoo Finance v7 quote (no proxy)
    try {
      const results = await tryYahooQuoteDirect();
      for (const r of results) {
        if (r.symbol === 'EUA=F' && r.regularMarketPrice) {
          liveEuEts = parseFloat((r.regularMarketPrice * EUR_USD).toFixed(2));
          newPrices.euEts = { price: liveEuEts, change: +(r.regularMarketChangePercent ?? 0).toFixed(1) };
          successCount++;
        }
        if (r.symbol === 'CCA=F' && r.regularMarketPrice) {
          liveCa = parseFloat(r.regularMarketPrice.toFixed(2));
          newPrices.california = { price: liveCa, change: +(r.regularMarketChangePercent ?? 0).toFixed(1) };
          successCount++;
        }
      }
    } catch (_) {
      // Strategy B: individual symbols via allorigins /get proxy
      await Promise.allSettled([
        tryChartViaAllOrigins('EUA=F', EUR_USD).then(eu => {
          liveEuEts = eu.price;
          newPrices.euEts = eu;
          successCount++;
        }),
        tryChartViaAllOrigins('CCA=F', 1).then(ca => {
          liveCa = ca.price;
          newPrices.california = ca;
          successCount++;
        }),
      ]);
    }

    const status = successCount === 2 ? 'live' : successCount === 1 ? 'partial' : 'historical';
    const now    = new Date();

    writeCache({ prices: newPrices, liveEuEts, liveCa, savedAt: now.toISOString(), liveStatus: status });
    setPrices(newPrices);
    setChartData(buildChartData(liveEuEts, liveCa));
    setLastUpdated(now);
    setLiveStatus(status);
    setLoading(false);
  }, []);

  useEffect(() => { fetchLive(false); }, [fetchLive]);

  // Thin to ~15 points for readable x-axis
  const thinned = chartData.length > 15
    ? chartData.filter((_, i) => i % 2 === 0 || i === chartData.length - 1)
    : chartData;

  const sc = STATUS_CFG[liveStatus] ?? STATUS_CFG.historical;

  return (
    <div id="carbon-price-tracker" style={{ background: 'rgba(254,253,249,0.99)', border: '1px solid rgba(21,128,61,0.12)', borderTop: '3px solid #CA8A04', borderRadius: '16px', boxShadow: '0 6px 32px rgba(5,46,22,0.08)', marginBottom: '16px', overflow: 'hidden' }}>

      {/* ── Header ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 18px', background: 'linear-gradient(135deg,rgba(5,46,22,0.03),rgba(202,138,4,0.04))', borderBottom: '1px solid rgba(21,128,61,0.08)', flexWrap: 'wrap', gap: '10px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '7px' }}>
            <div style={{ width: '9px', height: '9px', borderRadius: '50%', background: sc.dot, boxShadow: `0 0 0 3px ${sc.glow}`, animation: sc.pulse ? 'pulseDot 2.2s ease-in-out infinite' : 'none', flexShrink: 0 }} />
            <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: sc.dot }}>{sc.label}</span>
          </div>
          <div>
            <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '18px', fontWeight: 700, color: F.head, margin: 0, lineHeight: 1, letterSpacing: '-0.02em' }}>Carbon Market Prices</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: '2px 0 0' }}>
              {lastUpdated
                ? `Checked ${lastUpdated.toLocaleString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })} · `
                : ''}
              {sc.text}
            </p>
          </div>
        </div>
        <button
          onClick={() => fetchLive(true)}
          disabled={loading}
          style={{ background: loading ? '#EDE7DA' : G['700'], color: loading ? F.faint : '#FEFDF9', border: 'none', borderRadius: '8px', padding: '7px 14px', fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, cursor: loading ? 'default' : 'pointer', display: 'flex', alignItems: 'center', gap: '6px' }}
        >
          {loading
            ? <><span style={{ width: '12px', height: '12px', border: '2px solid rgba(255,255,255,0.3)', borderTopColor: '#888', borderRadius: '50%', animation: 'spin 0.8s linear infinite', display: 'inline-block' }} />Fetching…</>
            : '↻ Refresh'}
        </button>
      </div>

      {/* ── Price cards ── */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit,minmax(140px,1fr))', borderBottom: '1px solid rgba(21,128,61,0.08)' }}>
        {MARKETS.map((m, idx) => {
          const p    = prices[m.key] ?? FALLBACK[m.key];
          const isUp = p.change >= 0;
          return (
            <div
              key={m.key}
              style={{ padding: '14px 15px', borderRight: idx < MARKETS.length - 1 ? '1px solid rgba(21,128,61,0.07)' : 'none', borderBottom: `2px solid ${m.color}`, cursor: 'pointer', transition: 'background 0.15s', background: tooltip === m.key ? `${m.color}08` : 'transparent', position: 'relative' }}
              onMouseEnter={() => setTooltip(m.key)}
              onMouseLeave={() => setTooltip(null)}
              onClick={() => onSelectPrice?.(p.price)}
              title={`Click to use $${p.price.toFixed(2)} in the calculator`}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '5px' }}>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '8px', fontWeight: 700, color: m.type === 'compliance' ? '#1e40af' : '#155233', background: m.type === 'compliance' ? 'rgba(30,64,175,0.08)' : 'rgba(21,82,51,0.08)', padding: '2px 5px', borderRadius: '3px', letterSpacing: '0.05em', textTransform: 'uppercase' }}>
                  {m.live && <span style={{ color: '#22C55E', marginRight: '3px' }}>●</span>}{m.badge}
                </span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 700, color: isUp ? G['700'] : '#C4694A' }}>{isUp ? '▲' : '▼'}{Math.abs(p.change)}%</span>
              </div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted, lineHeight: 1.3 }}>{m.label}</div>
              <div style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint, marginBottom: '5px' }}>{m.subLabel}</div>
              <div style={{ display: 'flex', alignItems: 'baseline', gap: '2px' }}>
                <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 'clamp(18px,2vw,26px)', fontWeight: 700, color: m.color, lineHeight: 1 }}>${p.price.toFixed(2)}</span>
                <span style={{ fontFamily: 'Inter, sans-serif', fontSize: '9px', color: F.faint }}>/tCO₂</span>
              </div>
              {tooltip === m.key && (
                <div style={{ position: 'absolute', bottom: 'calc(100% + 6px)', left: '50%', transform: 'translateX(-50%)', background: '#1A2E22', color: '#FEFDF9', borderRadius: '8px', padding: '8px 12px', fontSize: '10px', fontFamily: 'Inter, sans-serif', lineHeight: 1.5, zIndex: 999, whiteSpace: 'nowrap', boxShadow: '0 4px 20px rgba(0,0,0,0.3)', pointerEvents: 'none' }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>Typical range: {m.range}</div>
                  <div style={{ color: '#8A9F95' }}>{m.note}</div>
                  <div style={{ color: '#4ADE80', marginTop: '3px', fontWeight: 600 }}>Click to use this price →</div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* ── Price History Chart ── */}
      <div style={{ padding: '16px 18px 0' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
          <div>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '11px', fontWeight: 700, color: F.head, margin: '0 0 2px' }}>30-Day Price History</p>
            <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0 }}>
              {thinned.length} trading sessions · last 28 days · Dashed = quarterly-verified benchmarks
            </p>
          </div>
          <div style={{ display: 'flex', gap: '12px', fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.muted }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '18px', height: '2.5px', background: '#1e40af', borderRadius: '1px' }} />EU ETS
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
              <span style={{ display: 'inline-block', width: '18px', borderTop: '2px dashed #7c3aed' }} />California
            </span>
          </div>
        </div>

        <ResponsiveContainer width="100%" height={160}>
          <LineChart data={thinned} margin={{ top: 4, right: 14, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#EDE7DA" vertical={false} />
            <XAxis dataKey="date" tick={{ fill: F.faint, fontSize: 9, fontFamily: 'Inter, sans-serif' }} tickLine={false} axisLine={false} interval="preserveStartEnd" />
            <YAxis tick={{ fill: F.faint, fontSize: 9, fontFamily: 'Inter, sans-serif' }} tickLine={false} axisLine={false} width={40} tickFormatter={v => `$${v}`} domain={['auto', 'auto']} />
            <Tooltip content={<ChartTip />} />
            <ReferenceLine
              y={prices.vcs?.price ?? FALLBACK.vcs.price}
              stroke={G['700']} strokeWidth={1} strokeDasharray="5 4"
              label={{ value: `VCS $${(prices.vcs?.price ?? FALLBACK.vcs.price).toFixed(0)}`, position: 'insideTopLeft', fill: G['700'], fontSize: 9, fontFamily: 'Inter, sans-serif' }}
            />
            <ReferenceLine
              y={prices.rggi?.price ?? FALLBACK.rggi.price}
              stroke="#0891b2" strokeWidth={1} strokeDasharray="5 4"
              label={{ value: `RGGI $${(prices.rggi?.price ?? FALLBACK.rggi.price).toFixed(0)}`, position: 'insideBottomLeft', fill: '#0891b2', fontSize: 9, fontFamily: 'Inter, sans-serif' }}
            />
            <Line type="monotone" dataKey="euEts"      name="EU ETS"     stroke="#1e40af" strokeWidth={2.5} dot={false} activeDot={{ r: 4, fill: '#1e40af', stroke: '#fff', strokeWidth: 2 }} connectNulls />
            <Line type="monotone" dataKey="california" name="California" stroke="#7c3aed" strokeWidth={2}   dot={false} activeDot={{ r: 4, fill: '#7c3aed', stroke: '#fff', strokeWidth: 2 }} strokeDasharray="6 3" connectNulls />
          </LineChart>
        </ResponsiveContainer>
      </div>

      {/* ── Footer ── */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px', padding: '12px 18px', borderTop: '1px solid rgba(21,128,61,0.07)', marginTop: '12px', background: 'rgba(247,242,232,0.5)' }}>
        <p style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', color: F.faint, margin: 0, lineHeight: 1.6, maxWidth: '500px' }}>
          EU ETS: ICE EUA futures (EUR×1.09) via Yahoo Finance · CA: ICE CCA futures · Voluntary: Ecosystem Marketplace estimates · Chart: simulated 28-day path anchored to current price · <strong style={{ color: F.muted }}>Click any card to set that price in the calculator.</strong>
        </p>
        <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
          {[
            ['Ecosystem MP', 'https://www.ecosystemmarketplace.com/carbon-markets/'],
            ['World Bank CPD', 'https://carbonpricingdashboard.worldbank.org/'],
            ['ICAP ETS', 'https://icapcarbonaction.com/en/ets'],
          ].map(([lbl, url]) => (
            <a key={lbl} href={url} target="_blank" rel="noopener noreferrer" style={{ fontFamily: 'Inter, sans-serif', fontSize: '10px', fontWeight: 600, color: G['700'], textDecoration: 'none', padding: '4px 8px', border: '1px solid rgba(21,82,51,0.18)', borderRadius: '6px', background: 'rgba(21,82,51,0.04)' }}>{lbl} ↗</a>
          ))}
        </div>
      </div>
    </div>
  );
}
