// Copyright (c) 2026 Chandra Prakash Choudhary. All rights reserved.
/**
 * USDA NASS CropScape / Cropland Data Layer (CDL) client.
 *
 * CDL is a satellite-derived crop classification of every 30 m pixel in the United States, for
 * every year since 2008. It is how we read a field's actual rotation history — which is what a
 * carbon program's additionality determination will be assessed against.
 *
 * The service only speaks EPSG:5070 (CONUS Albers), so callers must project first.
 */

import { toAlbers } from './albers.js';

const CDL_URL = 'https://nassgeodata.gmu.edu/axis2/services/CDLService/GetCDLValue';

async function cdlValue(x, y, year) {
  const url = `${CDL_URL}?year=${year}&x=${x.toFixed(0)}&y=${y.toFixed(0)}`;
  const res = await fetch(url);
  const text = await res.text();

  if (text.includes('faultstring')) return null;

  // The service returns a JSON-ish blob inside XML. Parse the fields we need.
  const category = text.match(/category:\s*"([^"]*)"/)?.[1] ?? null;
  const value = text.match(/value:\s*(\d+)/)?.[1] ?? null;
  const color = text.match(/color:\s*"([^"]*)"/)?.[1] ?? null;

  if (!category) return null;
  return { year, crop: category, code: value ? Number(value) : null, color };
}

/**
 * Read the crop grown at a point for each of the last `years` complete seasons.
 *
 * CDL for a given season publishes early the following year, so we do not ask for the current
 * calendar year — requesting a year that does not exist yet returns a fault and wastes a round trip.
 */
export async function rotationForPoint(lon, lat, years = 6) {
  const { x, y } = toAlbers(lon, lat);
  const latest = new Date().getFullYear() - 1;

  const wanted = Array.from({ length: years }, (_, i) => latest - (years - 1 - i));

  // Fire all years concurrently — this is the slow part of the request otherwise.
  const results = await Promise.all(wanted.map((yr) => cdlValue(x, y, yr).catch(() => null)));

  return results.filter(Boolean);
}
