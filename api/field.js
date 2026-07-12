/**
 * /api/field?lat=&lon=
 *
 * The join that does not exist anywhere else in public:
 *
 *   USDA SSURGO (what your soil is made of)
 *     +
 *   USDA CropScape CDL (what you have actually been growing)
 *     =
 *   a field-specific answer to "will carbon farming work on MY ground, and will they even credit me?"
 *
 * Both datasets are free, federal, and authoritative. Neither is CORS-accessible from a browser,
 * and CropScape additionally demands coordinates in its own map projection — which is a large part
 * of why nobody has bothered to put them together for farmers.
 *
 * This endpoint returns RAW measurements only. All interpretation (the saturation model, the risk
 * scoring) happens in `src/engine/`, client-side and in the open, so that anybody can read exactly
 * how a conclusion was reached. Hiding the model inside the server would defeat the purpose of the
 * project.
 */

import { soilForPoint } from './_lib/ssurgo.js';
import { rotationForPoint } from './_lib/cdl.js';
import { inConus } from './_lib/albers.js';

export default async function handler(req, res) {
  const lat = Number(req.query?.lat);
  const lon = Number(req.query?.lon);

  if (!Number.isFinite(lat) || !Number.isFinite(lon)) {
    return json(res, 400, { error: 'Provide numeric ?lat= and ?lon=' });
  }

  if (!inConus(lon, lat)) {
    return json(res, 422, {
      error: 'Those coordinates are outside the continental United States.',
      detail:
        'This tool runs on USDA SSURGO and the USDA Cropland Data Layer, which cover the US only. ' +
        'The contract analysis and the soil-carbon science on this site still apply anywhere — but ' +
        'the field-specific soil lookup does not.',
      outOfCoverage: true,
    });
  }

  try {
    // Independent lookups — run them concurrently rather than serially.
    const [soil, rotation] = await Promise.all([
      soilForPoint(lon, lat),
      rotationForPoint(lon, lat, 6).catch(() => []),
    ]);

    if (!soil) {
      return json(res, 404, {
        error: 'No soil survey data at those coordinates.',
        detail:
          'SSURGO has gaps — open water, some federal land, and a few unmapped areas. Try a point ' +
          'squarely inside the field rather than on its edge.',
      });
    }

    // Data completeness matters here: the saturation model needs OM, clay, silt and bulk density.
    // If any are missing we say so rather than quietly substituting a default.
    const missing = ['omPct', 'clayPct', 'siltPct', 'bulkDensity'].filter(
      (k) => soil[k] === null || soil[k] === undefined
    );

    return json(res, 200, {
      query: { lat, lon },
      soil,
      rotation,
      missing,
      sources: {
        soil: 'USDA NRCS SSURGO via Soil Data Access',
        rotation: 'USDA NASS Cropland Data Layer (CropScape)',
      },
      retrieved: new Date().toISOString(),
    });
  } catch (err) {
    return json(res, 502, {
      error: 'A federal data service did not respond.',
      detail: err.message,
    });
  }
}

function json(res, status, body) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json');
  // Soil and multi-year rotation history do not change day to day. Cache hard — it keeps us a
  // polite consumer of a free public service.
  res.setHeader('Cache-Control', 'public, max-age=604800, s-maxage=604800');
  res.end(JSON.stringify(body));
}
