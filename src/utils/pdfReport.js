// Branded PDF Carbon Audit Report
// Renders a professional, multi-page report directly with jsPDF's
// vector primitives — no html2canvas, so output is crisp at any zoom.

// jsPDF is dynamically imported inside generatePdfReport() to keep it
// out of the initial JS bundle — saves ~400 KB on first load.

// Palette (matches site)
const C = {
  forest900: '#1C3D2E',
  forest700: '#2D5A3D',
  forest500: '#4A7C59',
  forest100: '#D1E6D9',
  terra500:  '#C4694A',
  terra700:  '#A0522D',
  gold500:   '#B8900D',
  gold700:   '#7A5C0F',
  cream50:   '#FEFCF8',
  cream100:  '#F5EFE4',
  cream200:  '#E8DFCC',
  brown500:  '#6B4C35',
  brown700:  '#3D2B1F',
  faint:     '#A08070',
};

const PAGE_W = 210; // A4 portrait mm
const PAGE_H = 297;
const M = 22;       // margin — wider gives better line lengths and readability

function hex(c) {
  const v = c.replace('#', '');
  return [parseInt(v.slice(0, 2), 16), parseInt(v.slice(2, 4), 16), parseInt(v.slice(4, 6), 16)];
}
const fillHex = (doc, c) => doc.setFillColor(...hex(c));
const drawHex = (doc, c) => doc.setDrawColor(...hex(c));
const textHex = (doc, c) => doc.setTextColor(...hex(c));

function header(doc, pageNum, total) {
  // Top brand bar
  fillHex(doc, C.forest900); doc.rect(0, 0, PAGE_W, 8, 'F');
  fillHex(doc, C.gold500);   doc.rect(0, 8, PAGE_W, 1, 'F');

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(8); textHex(doc, C.cream50);
  doc.text('AGRICARBON ESTIMATOR', M, 5.5);
  doc.setFont('helvetica', 'normal');
  doc.text('IPCC 2006 · Vol. 4 · Tier 1', PAGE_W - M, 5.5, { align: 'right' });

  // Footer
  doc.setFont('helvetica', 'normal'); doc.setFontSize(7);
  textHex(doc, C.faint);
  doc.text(`Page ${pageNum} of ${total} · Generated ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`,
    PAGE_W / 2, PAGE_H - 8, { align: 'center' });
  drawHex(doc, C.cream200);
  doc.setLineWidth(0.2);
  doc.line(M, PAGE_H - 12, PAGE_W - M, PAGE_H - 12);
}

function sectionTitle(doc, y, eyebrow, title) {
  textHex(doc, C.forest500);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text(eyebrow.toUpperCase(), M, y);

  textHex(doc, C.forest900);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(15);
  doc.text(title, M, y + 7);

  drawHex(doc, C.gold500); doc.setLineWidth(0.6);
  doc.line(M, y + 10, M + 22, y + 10);
  return y + 16;
}

function paragraph(doc, x, y, text, opts = {}) {
  const { size = 9.5, color = C.brown700, maxW = PAGE_W - 2 * M - 8, lineH = 4.5, bold = false } = opts;
  doc.setFont('helvetica', bold ? 'bold' : 'normal'); doc.setFontSize(size);
  textHex(doc, color);
  const lines = doc.splitTextToSize(text, maxW);
  lines.forEach((ln, i) => doc.text(ln, x, y + i * lineH));
  return y + lines.length * lineH;
}

function kvRow(doc, y, label, value, opts = {}) {
  doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
  textHex(doc, C.faint);
  doc.text(label, M + 2, y);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
  textHex(doc, opts.valueColor || C.forest900);
  doc.text(String(value), PAGE_W - M - 2, y, { align: 'right' });
  drawHex(doc, C.cream200); doc.setLineWidth(0.15);
  doc.line(M, y + 1.6, PAGE_W - M, y + 1.6);
  return y + 5.5;
}

function kpiCard(doc, x, y, w, h, label, value, unit, accent) {
  // Background
  fillHex(doc, C.cream100); doc.roundedRect(x, y, w, h, 1.5, 1.5, 'F');
  // Accent stripe
  fillHex(doc, accent); doc.rect(x, y, w, 0.8, 'F');

  textHex(doc, C.faint);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(6);
  doc.text(label.toUpperCase(), x + w / 2, y + 5, { align: 'center' });

  textHex(doc, accent);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(14);
  doc.text(String(value), x + w / 2, y + 13, { align: 'center' });

  textHex(doc, C.brown500);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(6.5);
  doc.text(unit, x + w / 2, y + 17, { align: 'center' });
}

function need(doc, y, needed) {
  if (y + needed > PAGE_H - 22) {
    doc.addPage();
    return 24;
  }
  return y;
}

export async function generatePdfReport({ result, inputs, soilHealth, benchmark, projection, tornado }) {
  const { jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });

  // ── COVER ────────────────────────────────────────────────────────
  fillHex(doc, C.cream50); doc.rect(0, 0, PAGE_W, PAGE_H, 'F');
  fillHex(doc, C.forest900); doc.rect(0, 0, PAGE_W, 90, 'F');
  fillHex(doc, C.gold500);   doc.rect(0, 88, PAGE_W, 1.5, 'F');

  textHex(doc, C.cream50);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(8);
  doc.text('AGRICARBON ESTIMATOR', M, 18);
  doc.setFont('helvetica', 'normal');
  doc.text('IPCC 2006 · Vol. 4 · Chapter 2 · Tier 1', M, 23);

  doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
  doc.text('Carbon Audit Report', M, 52);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(13);
  doc.text('Soil Organic Carbon Sequestration Analysis', M, 62);

  textHex(doc, '#D1E6D9');
  doc.setFontSize(9);
  doc.text(`Prepared ${new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })}`, M, 72);
  doc.text(`Climate Zone: ${inputs.climateZoneLabel || inputs.climateZone}`, M, 77);
  doc.text(`Project Area: ${inputs.area} ha · Horizon: ${Math.min(inputs.years, 20)} years`, M, 82);

  // Headline metric card
  let y = 104;
  fillHex(doc, C.cream100); doc.roundedRect(M, y, PAGE_W - 2 * M, 38, 3, 3, 'F');
  fillHex(doc, result.deltaSocPerHa >= 0 ? C.forest700 : C.terra500);
  doc.rect(M, y, 3, 38, 'F');

  textHex(doc, C.faint);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
  doc.text('TOTAL CO₂E SEQUESTERED', M + 8, y + 8);

  textHex(doc, result.deltaSocPerHa >= 0 ? C.forest700 : C.terra500);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(32);
  doc.text(
    `${result.co2eTotal >= 0 ? '+' : ''}${result.co2eTotal.toLocaleString(undefined, { maximumFractionDigits: 1 })}`,
    M + 8, y + 22
  );
  textHex(doc, C.brown500);
  doc.setFont('helvetica', 'normal'); doc.setFontSize(10);
  doc.text('tonnes CO₂e', M + 8, y + 30);

  textHex(doc, C.faint);
  doc.setFontSize(8);
  doc.text(`± ${result.co2eUncertainty.toFixed(1)} t (95% CI)`, M + 8, y + 35);

  // Quick KPI strip
  y = 152;
  const cardW = (PAGE_W - 2 * M - 6) / 3;
  kpiCard(doc, M,                       y, cardW, 22, 'Annual rate /ha',  `${result.co2ePerHaPerYear >= 0 ? '+' : ''}${result.co2ePerHaPerYear.toFixed(2)}`, 't CO₂e ha⁻¹ yr⁻¹', C.forest500);
  kpiCard(doc, M + cardW + 3,            y, cardW, 22, 'SOC stock uplift', `${result.deltaSocPerHa >= 0 ? '+' : ''}${result.deltaSocPerHa.toFixed(3)}`,       't C ha⁻¹',          C.gold500);
  kpiCard(doc, M + (cardW + 3) * 2,      y, cardW, 22, 'Market value',     result.marketValue != null ? `$${result.marketValue.toLocaleString(undefined, { maximumFractionDigits: 0 })}` : '—', 'USD est.', C.gold700);

  // Soil Health Score
  if (soilHealth) {
    y = 184;
    fillHex(doc, C.cream100); doc.roundedRect(M, y, PAGE_W - 2 * M, 32, 3, 3, 'F');
    textHex(doc, C.faint);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7);
    doc.text('SOIL HEALTH SCORE CARD', M + 6, y + 8);

    textHex(doc, soilHealth.grade.color);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(28);
    doc.text(`${soilHealth.score}`, M + 6, y + 22);

    textHex(doc, C.brown500);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(9);
    doc.text(`/ 100  ·  Grade ${soilHealth.grade.letter}  ·  ${soilHealth.grade.label}`, M + 28, y + 22);

    // mini bars
    const bx = PAGE_W - M - 80, bw = 70;
    Object.entries(soilHealth.breakdown).forEach(([k, b], i) => {
      const by = y + 7 + i * 7;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(7); textHex(doc, C.brown500);
      doc.text(k, bx, by);
      doc.text(`${b.score}`, bx + bw, by, { align: 'right' });
      fillHex(doc, C.cream200); doc.roundedRect(bx, by + 1, bw, 1.4, 0.7, 0.7, 'F');
      fillHex(doc, soilHealth.grade.color); doc.roundedRect(bx, by + 1, bw * (b.score / 100), 1.4, 0.7, 0.7, 'F');
    });
  }

  // Executive summary
  y = 226;
  doc.setFont('helvetica', 'italic'); doc.setFontSize(9); textHex(doc, C.brown500);
  const summary = result.deltaSocPerHa >= 0
    ? `The proposed management scenario sequesters ${Math.abs(result.co2eTotal).toLocaleString(undefined, { maximumFractionDigits: 1 })} tonnes of CO₂-equivalent over ${Math.min(inputs.years, 20)} years across ${inputs.area} hectares. This corresponds to an annual soil organic carbon accrual rate of ${Math.abs(result.co2ePerHaPerYear).toFixed(2)} t CO₂e per hectare per year — calculated using IPCC 2006 Vol. 4 Ch. 2 Tier 1 global default coefficients with full uncertainty propagation.`
    : `The proposed scenario is a NET CARBON LOSS of ${Math.abs(result.co2eTotal).toLocaleString(undefined, { maximumFractionDigits: 1 })} tonnes CO₂e relative to baseline. Re-design the scenario before proceeding to certification.`;
  y = paragraph(doc, M, y, summary, { size: 9, lineH: 4.6, maxW: PAGE_W - 2 * M });

  header(doc, 1, 4);

  // ── PAGE 2 — METHODOLOGY + FACTORS ────────────────────────────
  doc.addPage();
  y = 24;
  y = sectionTitle(doc, y, 'Section 1', 'Methodology & Input Parameters');

  y = paragraph(doc, M, y,
    'Calculation follows IPCC 2006 Guidelines for National Greenhouse Gas Inventories Vol. 4, Ch. 2, equation 2.25. Reference SOC stocks (SOC_ref) are read from Table 2.3 by climate zone; the land-use (F_LU), management (F_MG), and input (F_IN) factors are applied multiplicatively to derive equilibrium SOC stocks for both baseline and scenario states. ΔSOC × C-to-CO₂ ratio (3.667) × area × time-scaling yields total CO₂e.',
    { size: 9, lineH: 4.6 }
  );
  y += 6;

  // Parameter table
  textHex(doc, C.forest900);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Project Inputs', M, y); y += 5;

  y = kvRow(doc, y, 'Climate Zone',          inputs.climateZoneLabel || inputs.climateZone);
  y = kvRow(doc, y, 'Farm Area',             `${inputs.area} ha`);
  y = kvRow(doc, y, 'Time Horizon',          `${inputs.years} years`);
  y = kvRow(doc, y, 'Baseline Crop',         inputs.baseline.cropType);
  y = kvRow(doc, y, 'Baseline Tillage',      inputs.baseline.tillage);
  y = kvRow(doc, y, 'Baseline Inputs',       inputs.baseline.inputs);
  y = kvRow(doc, y, 'Scenario Crop',         inputs.scenario.cropType);
  y = kvRow(doc, y, 'Scenario Tillage',      inputs.scenario.tillage);
  y = kvRow(doc, y, 'Scenario Inputs',       inputs.scenario.inputs);
  if (inputs.carbonPrice > 0) y = kvRow(doc, y, 'Carbon Price', `$${inputs.carbonPrice} / t CO₂e`);

  y += 6;
  textHex(doc, C.forest900);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('IPCC Factors (dimensionless)', M, y); y += 5;

  if (result.factors) {
    const f = result.factors;
    y = kvRow(doc, y, 'F_LU baseline', f.base.fLu?.toFixed(3));
    y = kvRow(doc, y, 'F_MG baseline', f.base.fMg?.toFixed(3));
    y = kvRow(doc, y, 'F_IN baseline', f.base.fIn?.toFixed(3));
    y = kvRow(doc, y, 'F_LU scenario', f.scen.fLu?.toFixed(3));
    y = kvRow(doc, y, 'F_MG scenario', f.scen.fMg?.toFixed(3));
    y = kvRow(doc, y, 'F_IN scenario', f.scen.fIn?.toFixed(3));
    y = kvRow(doc, y, 'SOC_ref',       `${f.base.socRef?.toFixed(1)} t C ha⁻¹`);
  }
  header(doc, 2, 4);

  // ── PAGE 3 — BENCHMARK + TORNADO + REVENUE ────────────────────
  doc.addPage();
  y = 24;
  y = sectionTitle(doc, y, 'Section 2', 'Regional Benchmark & Sensitivity');

  if (benchmark) {
    y = paragraph(doc, M, y,
      `Your field's annual ΔSOC of ${benchmark.userValue} t C ha⁻¹ yr⁻¹ falls at the ${benchmark.percentile}th percentile of the ${benchmark.zoneLabel} climate-zone published range (${benchmark.regionLow}–${benchmark.regionHigh}). Relative to the global agricultural average (~${benchmark.globalAvg} t C ha⁻¹ yr⁻¹, FAO 2021), your scenario sequesters ${benchmark.ratioGlobal}× the world mean. Verdict: ${benchmark.verdict}.`,
      { size: 9, lineH: 4.6 }
    );
    y += 4;
  }

  if (tornado && tornado.rows.length) {
    y = need(doc, y, 90);
    textHex(doc, C.forest900);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(11);
    doc.text('Sensitivity Tornado — which decision matters most', M, y); y += 5;

    textHex(doc, C.brown500);
    doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
    doc.text('One-at-a-time sweep. Width = swing in total CO₂e if that parameter alone changes across its full range.', M, y); y += 6;

    const barAreaX = M + 50;
    const barAreaW = PAGE_W - M - barAreaX - 2;
    const rowH = 9;
    const centerX = barAreaX + barAreaW / 2;
    const maxAbs = tornado.maxAbsDelta;

    // Center line
    drawHex(doc, C.cream200); doc.setLineWidth(0.2);
    doc.line(centerX, y - 1, centerX, y + tornado.rows.length * rowH + 1);

    tornado.rows.forEach((r, i) => {
      const ry = y + i * rowH;
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8); textHex(doc, C.brown700);
      doc.text(r.name, M, ry + 3.5);

      const lowW  = Math.abs(r.deltaFromCentralLow)  / maxAbs * (barAreaW / 2);
      const highW = Math.abs(r.deltaFromCentralHigh) / maxAbs * (barAreaW / 2);
      fillHex(doc, C.terra500);
      doc.rect(centerX - lowW, ry, lowW, 4, 'F');
      fillHex(doc, r.color);
      doc.rect(centerX, ry, highW, 4, 'F');

      doc.setFontSize(7); textHex(doc, C.faint);
      doc.text(`${r.deltaFromCentralLow >= 0 ? '+' : ''}${r.deltaFromCentralLow.toFixed(1)}`, centerX - lowW - 1,  ry + 3.5, { align: 'right' });
      doc.text(`${r.deltaFromCentralHigh >= 0 ? '+' : ''}${r.deltaFromCentralHigh.toFixed(1)}`, centerX + highW + 1, ry + 3.5);
    });
    y += tornado.rows.length * rowH + 6;
  }

  if (projection) {
    y = need(doc, y, 60);
    y = sectionTitle(doc, y, 'Section 3', 'Carbon Credit Revenue Projection');

    y = paragraph(doc, M, y,
      `At a carbon price of $${projection.carbonPrice}/t CO₂e, gross revenue over the horizon is $${projection.totalGross.toLocaleString(undefined, { maximumFractionDigits: 0 })}. Net of estimated MRV & certification costs ($${projection.totalCost.toLocaleString(undefined, { maximumFractionDigits: 0 })}), the project clears $${projection.totalNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}. Break-even is reached in ${projection.breakEvenYear ? `Year ${projection.breakEvenYear}` : 'beyond the chosen horizon'}.`,
      { size: 9, lineH: 4.6 }
    );
    y += 4;

    // Compact cashflow table (every other year)
    const rows = projection.rows.filter((_, i) => i % 2 === 0 || i === projection.rows.length - 1);
    const colX = [M, M + 16, M + 44, M + 72, M + 100, M + 130];
    const headers = ['Year', 'Annual t CO₂e', 'Gross USD', 'Costs USD', 'Net USD', 'Cum Net USD'];
    doc.setFont('helvetica', 'bold'); doc.setFontSize(7.5); textHex(doc, C.forest700);
    headers.forEach((h, i) => doc.text(h, colX[i], y));
    drawHex(doc, C.forest500); doc.setLineWidth(0.25);
    doc.line(M, y + 1.4, PAGE_W - M, y + 1.4);
    y += 5;

    doc.setFont('helvetica', 'normal'); doc.setFontSize(7.5);
    rows.forEach(r => {
      y = need(doc, y, 5);
      textHex(doc, C.brown700);
      doc.text(String(r.year), colX[0], y);
      doc.text(r.co2eYearly.toFixed(2), colX[1], y);
      doc.text(`$${r.grossRevenue.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, colX[2], y);
      doc.text(`$${r.costs.toLocaleString(undefined, { maximumFractionDigits: 0 })}`,        colX[3], y);
      textHex(doc, r.netCashflow  >= 0 ? C.forest700 : C.terra700);
      doc.text(`${r.netCashflow >= 0 ? '+' : ''}$${r.netCashflow.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, colX[4], y);
      textHex(doc, r.cumulativeNet >= 0 ? C.forest700 : C.terra700);
      doc.text(`${r.cumulativeNet >= 0 ? '+' : ''}$${r.cumulativeNet.toLocaleString(undefined, { maximumFractionDigits: 0 })}`, colX[5], y);
      y += 4.5;
    });
  }
  header(doc, 3, 4);

  // ── PAGE 4 — CITATION ─────────────────────────────────────────
  doc.addPage();
  y = 24;
  y = sectionTitle(doc, y, 'Appendix', 'Citation, Disclaimer & Sources');

  textHex(doc, C.forest900);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Primary citation', M, y); y += 5;
  y = paragraph(doc, M, y,
    'IPCC (2006). 2006 IPCC Guidelines for National Greenhouse Gas Inventories, Volume 4: Agriculture, Forestry and Other Land Use. Editors: Eggleston H.S., Buendia L., Miwa K., Ngara T. & Tanabe K. Published by IGES, Japan.',
    { size: 9 });
  y += 4;

  textHex(doc, C.forest900);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Suggested in-text citation', M, y); y += 5;
  fillHex(doc, C.cream100); doc.roundedRect(M, y, PAGE_W - 2 * M, 16, 2, 2, 'F');
  y = paragraph(doc, M + 4, y + 4,
    `AgriCarbon Estimator. (${new Date().getFullYear()}). Carbon Audit Report for ${inputs.area}-ha ${inputs.climateZoneLabel || inputs.climateZone} site. Tier 1 estimate per IPCC (2006).`,
    { size: 9, color: C.brown700, lineH: 4.4, maxW: PAGE_W - 2 * M - 8 }
  );
  y += 10;

  textHex(doc, C.forest900);
  doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
  doc.text('Important methodological notes', M, y); y += 5;
  y = paragraph(doc, M, y,
    '• Results are screening-level Tier 1 estimates using IPCC global default coefficients. For project-level carbon credit certification (Verra VCS, Gold Standard, Plan Vivo), Tier 2 or Tier 3 methodology requires field-level soil sampling and validation by an accredited body.',
    { size: 8.5, color: C.brown500, lineH: 4.2 });
  y = paragraph(doc, M, y + 1,
    '• The 20-year IPCC equilibrium time-horizon assumes continued maintenance of the chosen management practice. Practice reversal (e.g., return to tillage) releases stored carbon, reducing or eliminating the gain.',
    { size: 8.5, color: C.brown500, lineH: 4.2 });
  y = paragraph(doc, M, y + 1,
    '• CH₄ and N₂O fluxes are NOT included in this assessment — only the soil-organic-carbon component of the GHG budget.',
    { size: 8.5, color: C.brown500, lineH: 4.2 });
  y = paragraph(doc, M, y + 1,
    '• Regional benchmark ranges are synthesised from IPCC AR6 WG3 Ch.7 and FAO RECSOIL meta-analyses; treat as indicative.',
    { size: 8.5, color: C.brown500, lineH: 4.2 });
  y = paragraph(doc, M, y + 1,
    '• Revenue projections assume voluntary-market pricing and indicative MRV cost ranges; actual project economics will depend on registry, aggregator, and buyer terms.',
    { size: 8.5, color: C.brown500, lineH: 4.2 });

  header(doc, 4, 4);

  doc.save(`agricarbon-audit-${Date.now()}.pdf`);
}
