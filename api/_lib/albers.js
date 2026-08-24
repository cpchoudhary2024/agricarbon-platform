// Copyright (c) 2026 Chandra Prakash Choudhary. All rights reserved.
/**
 * EPSG:4326 (lat/lon) → EPSG:5070 (NAD83 / CONUS Albers Equal Area).
 *
 * USDA's CropScape service will only accept coordinates in its own Albers projection, so we
 * implement the forward projection rather than pulling in a multi-megabyte geospatial dependency
 * to do one well-defined piece of trigonometry.
 *
 * Standard Albers equal-area conic formulation (Snyder, Map Projections — A Working Manual, USGS
 * Professional Paper 1395). Verified against known CONUS control points.
 */

const A = 6378137.0;                 // GRS80 semi-major axis (m)
const F = 1 / 298.257222101;         // GRS80 flattening
const E2 = 2 * F - F * F;
const E = Math.sqrt(E2);

// EPSG:5070 parameters
const LAT_ORIGIN = 23.0;
const LON_ORIGIN = -96.0;
const STD_PARALLEL_1 = 29.5;
const STD_PARALLEL_2 = 45.5;

const rad = (d) => (d * Math.PI) / 180;

/** Authalic-area helper q(φ) from Snyder eq. 3-12. */
function q(phi) {
  const s = Math.sin(phi);
  return (
    (1 - E2) *
    (s / (1 - E2 * s * s) - (1 / (2 * E)) * Math.log((1 - E * s) / (1 + E * s)))
  );
}

export function toAlbers(lon, lat) {
  const p1 = rad(STD_PARALLEL_1);
  const p2 = rad(STD_PARALLEL_2);
  const p0 = rad(LAT_ORIGIN);
  const p = rad(lat);

  const m1 = Math.cos(p1) / Math.sqrt(1 - E2 * Math.sin(p1) ** 2);
  const m2 = Math.cos(p2) / Math.sqrt(1 - E2 * Math.sin(p2) ** 2);

  const q1 = q(p1);
  const q2 = q(p2);
  const q0 = q(p0);
  const qp = q(p);

  const n = (m1 * m1 - m2 * m2) / (q2 - q1);
  const C = m1 * m1 + n * q1;

  const rho = (A * Math.sqrt(C - n * qp)) / n;
  const rho0 = (A * Math.sqrt(C - n * q0)) / n;
  const theta = n * rad(lon - LON_ORIGIN);

  return {
    x: rho * Math.sin(theta),
    y: rho0 - rho * Math.cos(theta),
  };
}

/** Rough CONUS bounding box — used to fail fast with a useful message rather than a silent miss. */
export function inConus(lon, lat) {
  return lon >= -125 && lon <= -66.5 && lat >= 24 && lat <= 49.5;
}
