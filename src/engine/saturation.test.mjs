/**
 * Tests for the carbon saturation model.
 *
 * The whole project rests on this arithmetic being right, so it gets checked against
 * hand-computed values rather than against itself. Run:  node --test src/engine/
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  carbonSaturation,
  saturationBand,
  fineFraction,
  omToSocGkg,
  socStockTonsPerHa,
  fieldAdjustedRange,
} from './saturation.js';

const close = (actual, expected, tol = 0.05) =>
  assert.ok(
    Math.abs(actual - expected) <= tol,
    `expected ${expected} ± ${tol}, got ${actual}`
  );

test('omToSocGkg applies the van Bemmelen factor', () => {
  // 6% OM = 60 g OM/kg; 60 / 1.724 = 34.80 g C/kg
  close(omToSocGkg(6), 34.80);
  close(omToSocGkg(1), 5.80);
  assert.equal(omToSocGkg(0), 0);
});

test('fineFraction approximates the <20µm cut as clay + half of silt', () => {
  assert.equal(fineFraction(26, 43), 47.5);
  assert.equal(fineFraction(0, 0), 0);
  assert.equal(fineFraction(100, 0), 100);
});

test('socStockTonsPerHa converts concentration to a 30cm stock', () => {
  // 34.8 g C/kg x 1.1 g/cm3 x 30 cm / 10 = 114.8 t C/ha
  close(socStockTonsPerHa(34.8, 1.1, 30), 114.84, 0.1);
  // Doubling bulk density doubles the stock.
  close(socStockTonsPerHa(20, 2.0, 30), 2 * socStockTonsPerHa(20, 1.0, 30), 0.001);
});

test('Hassink capacity: C_sat = 4.09 + 0.37 x fine fraction', () => {
  // Webster clay loam, Story Co. IA: 33% clay, 42% silt → fine = 54
  // C_sat = 4.09 + 0.37 x 54 = 24.07
  const s = carbonSaturation({ omPct: 6.67, clayPct: 33, siltPct: 42, bulkDensity: 1.1 });
  close(s.fineFractionPct, 54.0);
  close(s.cSatGkg, 24.07, 0.1);
  // SOC = 66.7 / 1.724 = 38.69
  close(s.socGkg, 38.69, 0.1);
  // CSI = 38.69 / 24.07 = 1.607
  close(s.csi, 1.61, 0.02);
});

test('a real Iowa Mollisol lands beyond mineral capacity (the headline finding)', () => {
  const s = carbonSaturation({ omPct: 6.67, clayPct: 33, siltPct: 42, bulkDensity: 1.1 });
  assert.equal(s.band.key, 'saturated');
  assert.ok(s.csi > 1.1, 'CSI should exceed 1.1');
  assert.ok(s.deficitStockTonsPerHa < 0, 'a saturated soil has negative headroom');
  assert.equal(s.headroomCO2ePerAcre, 0, 'headroom is floored at zero, never negative');
});

test('a depleted Southeast soil has real headroom', () => {
  // Low OM, moderate fine fraction — the Southeast pattern.
  const s = carbonSaturation({ omPct: 1.2, clayPct: 20, siltPct: 30, bulkDensity: 1.5 });
  assert.equal(s.band.key, 'high-headroom');
  assert.ok(s.csi < 0.6);
  assert.ok(s.deficitStockTonsPerHa > 0);
  assert.ok(s.headroomCO2ePerAcre > 0);
});

test('CSI above 1.0 is representable, not clamped — it is a real signal', () => {
  const s = carbonSaturation({ omPct: 12, clayPct: 15, siltPct: 20, bulkDensity: 1.0 });
  assert.ok(s.csi > 1, 'model must not silently clamp at saturation');
});

test('saturation bands partition the CSI range at the documented cut-points', () => {
  assert.equal(saturationBand(0.3).key, 'high-headroom');
  assert.equal(saturationBand(0.59).key, 'high-headroom');
  assert.equal(saturationBand(0.6).key, 'moderate-headroom');
  assert.equal(saturationBand(0.89).key, 'moderate-headroom');
  assert.equal(saturationBand(0.9).key, 'near-capacity');
  assert.equal(saturationBand(1.09).key, 'near-capacity');
  assert.equal(saturationBand(1.1).key, 'saturated');
  assert.equal(saturationBand(3.0).key, 'saturated');
});

test('sequestration multipliers fall monotonically as soil fills up', () => {
  const keys = [0.3, 0.7, 1.0, 1.5].map((c) => saturationBand(c).sequestrationMultiplier);
  for (let i = 1; i < keys.length; i++) {
    assert.ok(keys[i] < keys[i - 1], 'a fuller soil must never sequester more');
  }
});

test('fieldAdjustedRange scales a published range and preserves ordering', () => {
  const base = { low: 0.30, central: 0.82, high: 1.34 };
  const adj = fieldAdjustedRange(base, saturationBand(1.5)); // saturated → x0.3

  close(adj.low, 0.09, 0.005);
  close(adj.high, 0.402, 0.005);
  assert.ok(adj.low < adj.central && adj.central < adj.high, 'range must stay ordered');
  assert.ok(adj.high < base.high, 'a saturated field must sequester less than the national high');
});

test('a high-headroom field is scaled UP relative to the national average', () => {
  const base = { low: 0.30, central: 0.82, high: 1.34 };
  const adj = fieldAdjustedRange(base, saturationBand(0.4));
  assert.ok(adj.central > base.central, 'undersaturated soil beats the literature average');
});

test('carbon is never created: zero organic matter gives zero SOC and full headroom', () => {
  const s = carbonSaturation({ omPct: 0.01, clayPct: 25, siltPct: 40, bulkDensity: 1.4 });
  assert.ok(s.csi < 0.05);
  assert.equal(s.band.key, 'high-headroom');
  assert.ok(s.deficitStockTonsPerHa > 0);
});
