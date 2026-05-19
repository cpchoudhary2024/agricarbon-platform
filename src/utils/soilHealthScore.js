// Soil Health Score — composite 0–100 rating from management decisions.
// Maps the user's scenario practices to a single headline number that
// reflects regenerative quality alongside the IPCC ΔSOC estimate.
//
// Methodology: weighted combination of three IPCC management drivers
// (tillage, organic inputs, crop/land-use) using the same rank-orderings
// the IPCC F_MG/F_IN/F_LU factors imply, but rescaled to 0–100.

const TILLAGE_SCORE = {
  'full-tillage':    10,
  'reduced-tillage': 55,
  'no-till':         95,
};

const INPUT_SCORE = {
  'low':         15,
  'medium':      45,
  'high':        75,
  'high-manure': 95,
};

const CROP_SCORE = {
  'annual-crops':         35,
  'long-term-cultivated': 25,
  'paddy-rice':           30,
  'perennial-crops':      90,
  'perennial-grass':      88,
  'set-aside':            82,
};

const WEIGHTS = { tillage: 0.35, inputs: 0.35, crop: 0.30 };

const clamp = (v) => Math.max(0, Math.min(100, Math.round(v)));

const grade = (s) => {
  if (s >= 85) return { letter: 'A',  label: 'Regenerative',  color: '#2D5A3D' };
  if (s >= 70) return { letter: 'B',  label: 'Strong',         color: '#4A7C59' };
  if (s >= 55) return { letter: 'C',  label: 'Moderate',       color: '#B8900D' };
  if (s >= 40) return { letter: 'D',  label: 'Conventional',   color: '#C4694A' };
  return         { letter: 'F',  label: 'Soil-Depleting',  color: '#A0522D' };
};

export function calculateSoilHealthScore({ tillage, inputs, cropType }) {
  const tScore = TILLAGE_SCORE[tillage] ?? 50;
  const iScore = INPUT_SCORE[inputs]    ?? 50;
  const cScore = CROP_SCORE[cropType]   ?? 50;

  const composite = clamp(
    tScore * WEIGHTS.tillage +
    iScore * WEIGHTS.inputs  +
    cScore * WEIGHTS.crop
  );

  return {
    score: composite,
    grade: grade(composite),
    breakdown: {
      tillage: { score: tScore, weight: WEIGHTS.tillage },
      inputs:  { score: iScore, weight: WEIGHTS.inputs  },
      crop:    { score: cScore, weight: WEIGHTS.crop    },
    },
  };
}
