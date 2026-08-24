/**
 * Reference tests for the EPSG:4326 -> EPSG:5070 (NAD83 / CONUS Albers) forward projection.
 *
 * This project implements the Albers equal-area conic by hand rather than pulling in a
 * multi-megabyte geospatial dependency. That is a defensible engineering choice ONLY if the
 * implementation is pinned to an authoritative reference, because a projection bug does not
 * crash — it silently relocates every field query to the wrong soil polygon and the tool keeps
 * returning confident, wrong answers.
 *
 * Expected coordinates below were generated independently with PROJ (via pyproj 3.7.2), the
 * reference implementation used by GDAL/QGIS/PostGIS:
 *
 *     Transformer.from_crs("EPSG:4326", "EPSG:5070", always_xy=True)
 *
 * They are NOT taken from this module's own output.
 *
 * Units: input degrees (lon, lat) on WGS84/NAD83; output metres (x, y) in EPSG:5070.
 * Tolerance: 0.5 m — far tighter than the ~30 m SSURGO/CDL raster cell the result indexes into.
 */

import test from 'node:test';
import assert from 'node:assert/strict';
import { toAlbers } from './albers.js';

/** Absolute tolerance in metres for projected coordinate comparisons. */
const TOL_M = 0.5;

/**
 * Assert a projected point matches the PROJ reference within TOL_M.
 *
 * @param {number} lon Longitude in decimal degrees (negative west).
 * @param {number} lat Latitude in decimal degrees.
 * @param {number} ex  Expected EPSG:5070 easting, metres.
 * @param {number} ey  Expected EPSG:5070 northing, metres.
 * @param {string} label Human-readable control-point name.
 */
function assertProjects(lon, lat, ex, ey, label) {
  const { x, y } = toAlbers(lon, lat);
  assert.ok(
    Math.abs(x - ex) < TOL_M,
    `${label}: easting ${x.toFixed(4)} m differs from PROJ ${ex.toFixed(4)} m by ` +
      `${Math.abs(x - ex).toFixed(4)} m`,
  );
  assert.ok(
    Math.abs(y - ey) < TOL_M,
    `${label}: northing ${y.toFixed(4)} m differs from PROJ ${ey.toFixed(4)} m by ` +
      `${Math.abs(y - ey).toFixed(4)} m`,
  );
}

test('projection origin (-96, 23) maps to (0, 0)', () => {
  // The EPSG:5070 latitude/longitude of origin. Any offset here is a false-easting bug.
  assertProjects(-96.0, 23.0, 0.0, 0.0, 'origin');
});

test('central meridian at the northern standard parallel', () => {
  // On the central meridian x must be exactly 0 at every latitude.
  assertProjects(-96.0, 45.5, 0.0, 2501326.0942, 'central meridian, 45.5N');
});

test('Permian Basin control point (-102, 31.9)', () => {
  assertProjects(-102.0, 31.9, -564582.8562, 998469.3708, 'Permian Basin');
});

test('Corn Belt control point (-88, 40)', () => {
  assertProjects(-88.0, 40.0, 676181.7659, 1915455.2489, 'Illinois');
});

test('Iowa control point (-93.6, 41.6)', () => {
  assertProjects(-93.6, 41.6, 198548.1430, 2068664.5538, 'Des Moines, IA');
});

test('west-coast control point (-120, 38)', () => {
  assertProjects(-120.0, 38.0, -2065432.0742, 1925025.3379, 'California');
});

test('east-coast control point (-75, 40)', () => {
  assertProjects(-75.0, 40.0, 1762648.0535, 2082524.8647, 'New Jersey');
});

test('sign convention: west of the central meridian is negative easting', () => {
  // A flipped sign would mirror every western field onto the eastern US and still
  // return a plausible-looking soil record.
  assert.ok(toAlbers(-110.0, 40.0).x < 0, 'lon -110 must give negative x');
  assert.ok(toAlbers(-80.0, 40.0).x > 0, 'lon -80 must give positive x');
});

test('northing increases monotonically with latitude on the central meridian', () => {
  const ys = [25, 30, 35, 40, 45, 49].map((lat) => toAlbers(-96.0, lat).y);
  for (let i = 1; i < ys.length; i += 1) {
    assert.ok(ys[i] > ys[i - 1], `northing must increase from lat step ${i - 1} to ${i}`);
  }
});

test('projection is symmetric about the central meridian', () => {
  // Equal-area conic is symmetric in longitude about the central meridian: points
  // equidistant east and west must share a northing and mirror their easting.
  const west = toAlbers(-106.0, 39.0);
  const east = toAlbers(-86.0, 39.0);
  assert.ok(Math.abs(west.x + east.x) < 1e-6, 'eastings must mirror');
  assert.ok(Math.abs(west.y - east.y) < 1e-6, 'northings must match');
});

test('returns finite coordinates across the CONUS bounding box', () => {
  // Guards against NaN leaking into a CropScape query, which would fail opaquely.
  for (let lat = 25; lat <= 49; lat += 3) {
    for (let lon = -124; lon <= -67; lon += 5) {
      const { x, y } = toAlbers(lon, lat);
      assert.ok(Number.isFinite(x) && Number.isFinite(y), `non-finite at ${lon},${lat}`);
    }
  }
});
