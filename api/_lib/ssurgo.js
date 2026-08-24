// Copyright (c) 2026 Chandra Prakash Choudhary. All rights reserved.
/**
 * USDA NRCS Soil Data Access (SSURGO) client.
 *
 * SSURGO is the authoritative soil survey of the United States. It exposes a genuinely unusual
 * public API: you POST raw SQL against the national soil database and it runs it. We use that to
 * ask, for one point on the earth: what soil is this, and what is it made of?
 *
 * We take the DOMINANT component of the map unit (highest comppct_r) and depth-weight its horizon
 * properties over the top 30 cm — the standard depth for soil carbon accounting, and the depth the
 * Hassink saturation relationship is applied at.
 */

const SDA_URL = 'https://sdmdataaccess.nrcs.usda.gov/Tabular/post.rest';

async function sdaQuery(sql) {
  const res = await fetch(SDA_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ format: 'JSON+COLUMNNAME', query: sql }),
  });

  const text = await res.text();

  // SDA reports SQL errors as an OGC XML fault with HTTP 200, so we cannot trust the status code.
  if (text.trimStart().startsWith('<')) {
    const m = text.match(/<ServiceException>([\s\S]*?)<\/ServiceException>/);
    throw new Error(`Soil Data Access error: ${m ? m[1].trim() : 'unexpected XML response'}`);
  }

  const json = JSON.parse(text);
  if (!json.Table || json.Table.length < 2) return [];

  const [cols, ...rows] = json.Table;
  return rows.map((r) => Object.fromEntries(cols.map((c, i) => [c, r[i]])));
}

/** Resolve a lat/lon to a SSURGO map unit key. */
export async function mukeyForPoint(lon, lat) {
  const rows = await sdaQuery(
    `SELECT mukey FROM SDA_Get_Mukey_from_intersection_with_WktWgs84('point(${lon} ${lat})')`
  );
  return rows[0]?.mukey ?? null;
}

/**
 * Fetch the dominant component's properties, depth-weighted over 0–30 cm.
 *
 * A soil map unit contains several components (e.g. "85% Nicollet, 10% Webster"). We take the
 * dominant one and are explicit in the UI that we have done so — a field can genuinely contain more
 * than one soil, and pretending otherwise would be exactly the kind of false precision this project
 * exists to avoid.
 */
export async function soilForMukey(mukey) {
  const rows = await sdaQuery(`
    SELECT
      mu.mukey, mu.muname,
      c.cokey, c.compname, c.comppct_r, c.drainagecl, c.taxorder, c.slope_r,
      ch.hzdept_r, ch.hzdepb_r,
      ch.om_r, ch.claytotal_r, ch.silttotal_r, ch.sandtotal_r,
      ch.dbthirdbar_r, ch.ph1to1h2o_r, ch.cec7_r
    FROM mapunit mu
    INNER JOIN component c ON c.mukey = mu.mukey
    INNER JOIN chorizon  ch ON ch.cokey = c.cokey
    WHERE mu.mukey = ${Number(mukey)}
      AND c.majcompflag = 'Yes'
      AND ch.hzdept_r < 30
      AND ch.om_r IS NOT NULL
      AND ch.claytotal_r IS NOT NULL
    ORDER BY c.comppct_r DESC, ch.hzdept_r ASC
  `);

  if (!rows.length) return null;

  // Dominant component = the one with the highest representative percentage.
  const topCokey = rows[0].cokey;
  const horizons = rows.filter((r) => r.cokey === topCokey);
  const head = horizons[0];

  // Depth-weight each property across the horizons intersecting 0–30 cm.
  const weighted = (key) => {
    let sum = 0;
    let depth = 0;
    for (const h of horizons) {
      const top = Number(h.hzdept_r);
      const bot = Math.min(Number(h.hzdepb_r), 30);
      const thick = bot - top;
      const v = Number(h[key]);
      if (!(thick > 0) || Number.isNaN(v)) continue;
      sum += v * thick;
      depth += thick;
    }
    return depth > 0 ? sum / depth : null;
  };

  return {
    mukey: String(head.mukey),
    mapUnitName: head.muname,
    seriesName: head.compname,
    componentPct: num(head.comppct_r),
    drainageClass: head.drainagecl,
    taxonomicOrder: head.taxorder,
    slopePct: num(head.slope_r),

    omPct: round(weighted('om_r'), 2),
    clayPct: round(weighted('claytotal_r'), 1),
    siltPct: round(weighted('silttotal_r'), 1),
    sandPct: round(weighted('sandtotal_r'), 1),
    bulkDensity: round(weighted('dbthirdbar_r'), 2),
    ph: round(weighted('ph1to1h2o_r'), 1),
    cec: round(weighted('cec7_r'), 1),

    horizonsUsed: horizons.length,
    depthCm: 30,
  };
}

export async function soilForPoint(lon, lat) {
  const mukey = await mukeyForPoint(lon, lat);
  if (!mukey) return null;
  return soilForMukey(mukey);
}

const num = (v) => (v === null || v === undefined || v === '' ? null : Number(v));
const round = (v, d) => (v === null ? null : Math.round(v * 10 ** d) / 10 ** d);
