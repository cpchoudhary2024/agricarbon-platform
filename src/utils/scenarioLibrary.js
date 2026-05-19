// Scenario Library — localStorage-backed save/load plus shareable
// URL-hash encoding so users can mail a scenario link to a colleague.

const KEY = 'agricarbon.scenarios.v1';

export function loadScenarios() {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return [];
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch { return []; }
}

export function saveScenarios(list) {
  try { localStorage.setItem(KEY, JSON.stringify(list)); } catch { /* quota */ }
}

export function addScenario(scenario) {
  const list = loadScenarios();
  const entry = {
    id: `s_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`,
    savedAt: new Date().toISOString(),
    ...scenario,
  };
  const next = [entry, ...list].slice(0, 25); // cap at 25
  saveScenarios(next);
  return entry;
}

export function deleteScenario(id) {
  const next = loadScenarios().filter(s => s.id !== id);
  saveScenarios(next);
  return next;
}

// ── URL share state ────────────────────────────────────────────────
// Encodes the form parameters as a base64-URL JSON blob in window.location.hash.

const FIELDS = ['name', 'climate', 'area', 'years', 'price', 'base', 'scen'];

export function encodeStateToHash(state) {
  try {
    const slim = {};
    FIELDS.forEach(f => { if (state[f] !== undefined) slim[f] = state[f]; });
    const json = JSON.stringify(slim);
    const b64  = btoa(unescape(encodeURIComponent(json)))
      .replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    return `#s=${b64}`;
  } catch { return ''; }
}

export function decodeStateFromHash(hash = window.location.hash) {
  if (!hash || !hash.startsWith('#s=')) return null;
  try {
    const b64 = hash.slice(3).replace(/-/g, '+').replace(/_/g, '/');
    const pad = b64.length % 4 ? '='.repeat(4 - (b64.length % 4)) : '';
    const json = decodeURIComponent(escape(atob(b64 + pad)));
    return JSON.parse(json);
  } catch { return null; }
}

export function buildShareUrl(state) {
  const hash = encodeStateToHash(state);
  return window.location.origin + window.location.pathname + hash;
}
