# Ground Truth — Agricultural Carbon Contract Decision Tool

Field-scale screening of agricultural soil carbon contracts. Queries the USDA soil survey and
satellite crop records for a single point, evaluates whether that soil can physically stabilise
additional carbon, and prices the contract net of the costs vendors omit.

**Live:** https://agricarbon-estimator-bvq8x807o-chandra-prakash-s-projects1.vercel.app

---

## 1. Executive Summary & Problem Statement

### The engineering challenge

Agricultural carbon programs pay landowners per tonne of CO₂e sequestered in soil. The offer is
priced on a national or regional average accrual rate. Soil does not accrue carbon at a national
average rate.

Soil holds organic carbon largely by binding it to fine mineral surfaces — clay and silt. Those
surfaces are finite. Once occupied, additional carbon has nowhere stable to go: it accumulates in
unprotected particulate form and is readily lost again on tillage or disturbance. Hassink (1997)
quantified the capacity relationship; Six et al. (2002) generalised it into carbon saturation
theory.

The engineering consequence is direct and unpriced by the market: **a soil near its protective
capacity gains little carbon regardless of practice.** The same cover-crop program that delivers
0.9 t C/ha/yr on a depleted Coastal Plain soil may deliver 0.2 on prime Corn Belt ground. A per-tonne
contract written against a national average transfers measurement risk onto the landowner whose soil
is least able to deliver the tonnes.

Three further asymmetries determine whether a contract is sound:

**Additionality is determined by rotation history**, which the landowner may not have documented but
which is visible in the public satellite record since 2008.

**Yield impact is drainage-dependent.** No-till on poorly drained ground carries a materially
negative yield effect; on well-drained rainfed ground it is approximately neutral.

**The competing federal program often pays more.** USDA EQIP pays $34–75/ac for cover crops. A
carbon program pays $6–12/ac for the same practice, with a longer commitment and a permanence
obligation attached.

### Technical objective

Answer three questions for one specific field, from free federal data, with every coefficient cited:
how much carbon the soil can still physically hold, whether the practice will cost yield on that
soil, and whether the rotation history makes the practice additional. Then price the contract net of
implementation cost, yield impact, and forgone cost-share.

### The finding that motivates the tool

Two real fields, the same practices, opposite advice:

| | Story Co., Iowa<br>*Webster clay loam* | Sumter Co., Georgia<br>*Kinston, Coastal Plain* |
|---|---|---|
| Organic matter | 6.7% | 1.7% |
| **Carbon Saturation Index** | **1.61** — beyond mineral capacity | **0.66** — moderate headroom |
| Cover-crop sequestration | **0.09–0.40** t CO₂e/ac/yr | near the national range |
| *(national range)* | *0.30–1.34* | *0.30–1.34* |
| Drainage | Poorly drained → yield-drag risk | — |
| **Verdict** | **Do not sign a per-tonne contract** | Genuine candidate |

The Iowa field — prime Corn Belt ground, the land carbon programs market to hardest — is physically
close to its limit for stabilising new carbon and would deliver roughly a quarter of what the
national average implies.

---

## 2. Regulatory & Industry Standards Alignment

### Federal data programs

| Program | Role |
|---|---|
| **USDA NRCS SSURGO** (Soil Data Access) | Soil series, organic matter, clay/silt fractions, bulk density, drainage class, land capability classification |
| **USDA NASS CropScape / Cropland Data Layer** | 30 m crop classification since 2008, establishing rotation history and practice additionality |
| **USDA NRCS Rapid Carbon Assessment (RaCA)** | Independent laboratory carbon measurements used for model validation |
| **USDA EQIP / CSP** | Federal cost-share schedules used as the counterfactual payment |

### Carbon market context

Contract terms are compiled for major US carbon programs: contract length, permanence obligation,
early-exit forfeiture, buffer holdback, data rights, minimum acreage, and who pays for sampling.
Where a term is not disclosed, the matrix states **"Not published"** rather than inventing a
plausible value.

As of July 2026, exactly **one** major US carbon program (Indigo) has had its contract terms
verified by an independent third party.

### Scientific references governing the model

| Reference | Application |
|---|---|
| **Hassink (1997)**, *Plant and Soil* | Capacity relationship: C_sat = 4.09 + 0.37 × fine fraction |
| **Six et al. (2002)**, *Plant and Soil* | Carbon saturation theory |
| **Stewart et al. (2007)**, *Biogeochemistry* | Mineral pool saturates; particulate pool is linear and non-saturating |
| **Georgiou et al. (2022)**, *Nature Communications* | Mineral-associated carbon at 66% of surface soil carbon |
| **Cotrufo et al. (2019)**, *Nature Geoscience* | Distinction between protected and particulate pools |
| **Powlson et al. (2014)**, *Nature Climate Change* | No-till gains largely reflect altered depth distribution |
| **Pittelkow et al. (2015)**, *Field Crops Research* | No-till yield response meta-analysis |
| **Al-Kaisi (2015)**; DeFelice (2006) | Tillage yield effects by drainage class |
| **van Bemmelen factor (1.724)** | Organic matter to organic carbon conversion |
| **Snyder, USGS Professional Paper 1395** | Albers equal-area conic projection |

### Standards not implemented

This tool does not quantify offsets under a registry protocol. It does not implement Verra VM0042,
Climate Action Reserve Soil Enrichment, or the GHG Protocol Land Sector and Removals Guidance, and
it does not produce a creditable quantification. It is a **screening tool for evaluating a contract
offer**, not a quantification methodology.

---

## 3. Technical Methodology & Mathematical Framework

### Pipeline

```
Map pin (lat / lon, EPSG:4326)
        ↓
Albers forward projection → EPSG:5070          [api/_lib/albers.js]
        ↓
SSURGO SQL query (Soil Data Access)   ·   CropScape CDL query
        ↓          raw measurements only, server-side
        ↓
CLIENT-SIDE ENGINE  (src/engine/, in the open)
        ↓
Carbon saturation  ·  field risk  ·  net return
        ↓
Decision output + evidence panel + citation trail
```

The API layer returns **raw measurements only**. All interpretation — the saturation model, the risk
scoring, the economics — runs client-side in `src/engine/`, so any conclusion can be read directly.
Hiding the model on the server would defeat the purpose.

### Coordinate transformation

CropScape accepts only EPSG:5070 (NAD83 / CONUS Albers). The forward projection is implemented
directly from Snyder's formulation rather than by adding a multi-megabyte geospatial dependency for
one piece of trigonometry:

```
q(φ)  = (1−e²) · [ sinφ/(1−e² sin²φ) − (1/2e) · ln((1−e sinφ)/(1+e sinφ)) ]
n     = (m₁² − m₂²) / (q₂ − q₁)
C     = m₁² + n·q₁
ρ     = a·√(C − n·q) / n
x     = ρ · sin(n·Δλ)
y     = ρ₀ − ρ · cos(n·Δλ)
```

GRS80 ellipsoid; standard parallels 29.5°N and 45.5°N; origin 23°N, 96°W.

### Carbon saturation model

```
SOC_current  (g C/kg) = OM% × 10 / 1.724                    [van Bemmelen]
fine_fraction (<20µm) ≈ clay% + 0.5 × silt%                 [approximation]
C_sat        (g C/kg) = 4.09 + 0.37 × fine_fraction         [Hassink 1997]
CSI                   = SOC_current / C_sat
stock (t C/ha)        = SOC(g/kg) × BD(g/cm³) × depth(cm) / 10
```

### Sequestration adjustment

The rate multiplier is computed from the continuous CSI, not from a lookup table:

```
deficitRatio = max(0, 1 − CSI) / (1 − REFERENCE_CSI)
multiplier   = min(MAX_UPLIFT, POM_FRACTION + (1 − POM_FRACTION) × deficitRatio)
```

| Constant | Value | Basis |
|---|---|---|
| `POM_FRACTION` | **0.34** | Particulate share of surface soil carbon. Georgiou et al. (2022) put mineral-associated carbon at 66%, leaving 34%. This is why the curve has a **floor rather than falling to zero**: a saturated soil does not stop gaining carbon, it stops gaining the *durable* kind. |
| `REFERENCE_CSI` | **0.56** | Median CSI of the **3,332 RaCA cropland** laboratory samples — the saturation state the published accrual rates were actually measured on. A field at this value receives the published rate unchanged. |
| `MAX_UPLIFT` | **1.5** | A stated cap on upward adjustment. This is the one remaining judgement call, and both the code and the interface say so. |

`REFERENCE_CSI` was **0.69** in an earlier version, taken from the RaCA dataset pooled across all
land uses. That was wrong: forest, rangeland, and wetland soils carry far more carbon than cropland,
so the pooled median described a population this tool never advises. Restricting to cropland — the
population the cover-crop and no-till literature was measured on — gives 0.56.

Interpretation bands (0.6 / 0.9 / 1.1) are for **communication only**. The sequestration adjustment
is computed from the continuous CSI, never from which band a field falls into, and the underlying
CSI is always displayed.

### Yield impact by drainage class

Derived from meta-analysis, not judgement. An earlier version carried five invented yield-drag
percentages; the published evidence proved **four times more severe** at the poorly-drained end:

| Drainage class | Was (invented) | Now (published) |
|---|---|---|
| Poorly drained | −5% | **−20% to −5%** (Al-Kaisi 2015; DeFelice 2006) |
| Somewhat poorly drained | −3% | **−10% to 0%**, central −5.1% (Pittelkow 2015) |
| Well drained | 0% | **−2% to +2%** — no-till matches conventional on rainfed well-drained ground |

### No-till sequestration floor

Powlson et al. (2014) found most apparent soil carbon gains under no-till reflect an **altered depth
distribution** rather than additional carbon: sample to 30 cm and no-till looks excellent; sample
deeper and the gain often disappears. **The no-till sequestration range in this tool therefore starts
at zero.**

### Net return model

```
net = carbon payment + USDA cost-share − implementation cost − yield impact
effective_ton_price = headline × farmer_share × (1 − buffer_holdback)
```

The subtractions are the point. Vendor calculators compute `tonnes × price` and stop. Cover crops
may earn $6–12/ac from a carbon program while costing roughly $37/ac to establish, against EQIP
paying $34–75/ac for the same practice.

Default assumptions (all user-adjustable): 500 acres, $25/tonne headline, 75% farmer share, 20%
buffer holdback, $800/ac gross revenue.

### Validation against independent laboratory data

The model rests on one claim: soil has a finite, texture-set capacity to hold carbon. That claim was
tested against USDA's **Rapid Carbon Assessment** — 145,127 samples with carbon measured in a
laboratory, entirely independent of the soil survey the tool otherwise uses. Filtering to mineral
topsoil from cropland leaves **3,332 samples**.

| | Result |
|---|---|
| **Holds up** | Tested as a **boundary** — the correct test for a capacity law — the upper envelope of measured carbon rises with fine fraction at **r = 0.599**; bin-median correlation **r = 0.722**. The direction saturation theory requires is clearly present in US cropland. |
| **Limitation** | The observed ceiling rises at **0.164** g C/kg per % fine fraction against Hassink's predicted **0.370** — less than half. Partly measurement error (texture is inferred from a class, not a lab number), but the true capacity is probably lower than assumed. |
| **Against the model** | The laboratory reads saturated more often than the model does: median CSI **0.56 measured vs 0.44 modelled**. Where the model is wrong, it errs toward telling a landowner there is *more* room for carbon than there is. |

**The two limitations explain each other.** If the true capacity ceiling is lower than Hassink
predicts, the denominator is too large, CSI comes out too small, and saturation is understated —
precisely the bias measured. The model is not failing randomly; it is off in a direction that can be
pointed at.

### A wrong test, documented rather than deleted

The original validation correlated texture against measured carbon across **all land uses**, obtained
**r = 0.095**, and reported the index as weak. That was a bad test twice over:

1. **Hassink is a capacity law, not a predictor.** It claims texture sets a *ceiling*, not that
   texture determines actual carbon. Fitting a mean line through the middle of the cloud is
   uninformative about the ceiling by construction. The correct tool is boundary-line analysis.
2. **Pooling land uses buried the signal.** Restricting to cropland doubled the sample-level
   correlation (0.095 → 0.203) and halved the apparent model bias.

The same class of error occurred in the national map. The first harvester averaged over *all* soils
per county and reported Maine as the most carbon-saturated state in America (mean CSI 3.02), New
Jersey at 5.26. Those values are not believable: a county-wide soil average is dominated by forest,
wetland, and peat soils carrying 20–27% organic matter that no one will ever crop. The fix was to
filter to farmable ground using SSURGO's **land capability classification (classes 1–3)**, excluding
Histosols.

Both mistakes are documented in the scripts rather than quietly removed.

### Model limitations and physical assumptions

- **CSI is a coarse three-way screen, not a laboratory measurement.**
- **The <20 µm fraction is approximated** as `clay + ½·silt`. Hassink's equation is defined on the
  <20 µm cut; SSURGO reports clay (<2 µm) and silt (2–50 µm).
- **Total SOC ≠ mineral-associated SOC.** SSURGO reports total organic matter including unprotected
  particulate carbon, so **a CSI above 1.0 is possible and is not a bug** — it indicates carbon held
  beyond what minerals can protect: low headroom, and existing carbon vulnerable to loss on tillage.
- **Georgiou et al. (2022) is the rigorous modern treatment.** The simpler Hassink form is used
  deliberately because it can be computed from the inputs a field actually has in SSURGO and shown
  transparently.
- **RaCA site coordinates are restricted** ("available only by request and approval"), so the
  point-for-point join to SSURGO — the preferred validation — could not be run.
- **SSURGO map units are polygons, not point measurements.** Within-polygon variation is real, and
  within-county variation dwarfs the between-county pattern.
- **This is not a registry-grade quantification** and produces no creditable offset.

### Verification

`api/_lib/albers.test.mjs` — **11 tests** validating the projection against **7 control points
generated independently from PROJ (pyproj 3.7.2)**, the reference implementation used by
GDAL/QGIS/PostGIS. Expected coordinates are not taken from this module's own output.

| Control point | Tolerance |
|---|---|
| Projection origin (−96, 23) → (0, 0) | 0.5 m |
| Central meridian at 45.5°N | 0.5 m |
| Permian Basin (−102, 31.9) | 0.5 m |
| Illinois (−88, 40) · Iowa (−93.6, 41.6) | 0.5 m |
| California (−120, 38) · New Jersey (−75, 40) | 0.5 m |

Plus sign convention, monotonic northing, symmetry about the central meridian, and finiteness across
the CONUS bounding box. A projection bug does not crash — it silently relocates every field query to
the wrong soil polygon and returns confident, wrong answers. The 0.5 m tolerance is far tighter than
the ~30 m SSURGO/CDL raster cell the result indexes into.

`src/engine/saturation.test.mjs` asserts the removed magic numbers cannot return.

Total: **28 tests passing**.

---

## 4. Data Schema & Engineering Units

### Inputs

| Variable | Definition | Units | Source |
|---|---|---|---|
| `lat` / `lon` | Field location | decimal degrees, EPSG:4326 | User (map pin) |
| `x` / `y` | Projected coordinates | metres, EPSG:5070 | Computed |
| `omPct` | Soil organic matter | % by mass | SSURGO |
| `clayPct` | Clay fraction (<2 µm) | % by mass | SSURGO |
| `siltPct` | Silt fraction (2–50 µm) | % by mass | SSURGO |
| `bulkDensity` | Soil bulk density | g/cm³ | SSURGO |
| `depthCm` | Assessment depth | cm (default 30) | Model |
| `drainageClass` | NRCS drainage class | categorical | SSURGO |
| `capabilityClass` | Land capability classification | 1–8 | SSURGO |
| `rotationHistory` | Crop by year since 2008 | categorical | USDA CDL |

### Model outputs

| Variable | Definition | Units |
|---|---|---|
| `fineFractionPct` | Estimated <20 µm fraction | % |
| `socGkg` | Current soil organic carbon | g C/kg |
| `cSatGkg` | Hassink capacity | g C/kg |
| `csi` | Carbon Saturation Index | dimensionless (>1.0 possible) |
| `deficitGkg` | Remaining protective headroom | g C/kg |
| `socStockTonsPerHa` | Current carbon stock to depth | t C/ha |
| `capacityStockTonsPerHa` | Capacity stock to depth | t C/ha |
| `deficitStockTonsPerHa` | Headroom | t C/ha |
| `fieldMultiplier` | Rate adjustment for this field | dimensionless, capped 1.5 |
| `sequestrationRate` | Adjusted accrual | t CO₂e/ac/yr |
| `yieldChangePct` | Modelled yield impact | % |
| `effectiveTonPrice` | Price after share and buffer holdback | USD/tonne CO₂e |
| `carbonPayment` | Gross program payment | USD/ac/yr |
| `costShare` | USDA EQIP/CSP payment | USD/ac/yr |
| `implementationCost` | Practice establishment cost | USD/ac/yr |
| `netReturn` | Net of all four terms | USD/ac/yr |

Carbon quantities are reported as **t CO₂e** in economic contexts and **t C** in soil-science
contexts; the conversion factor is 44/12.

---

## 5. Verification & Reproduction Instructions

### Requirements

Node.js 20 or later.

### Setup

```bash
npm install
```

### Run the test suite

```bash
npm test
```

Expected: **28 passing**.

Projection tests only:

```bash
node --test api/_lib/albers.test.mjs
```

Regenerate the PROJ reference coordinates independently (requires Python with pyproj):

```python
import pyproj
t = pyproj.Transformer.from_crs("EPSG:4326", "EPSG:5070", always_xy=True)
print(t.transform(-93.6, 41.6))     # → (198548.1430, 2068664.5538)
```

### Reproduce the validation

```bash
npm run validate      # scripts/validate-raca.mjs — RaCA boundary-line analysis
npm run harvest       # scripts/build-map.mjs + harvest-counties.mjs — national county map
```

`npm run validate` reproduces the boundary-line correlations, the ceiling-slope comparison against
Hassink, and the measured-versus-modelled CSI medians.

`npm run harvest` recomputes carbon saturation for arable soil in every county in the continental US
from the USDA soil survey, filtered to land capability classes 1–3 excluding Histosols.

### Development

```bash
npm run dev           # Vite dev server
npm run build         # production build
npm run lint          # ESLint
npm run preview       # preview the production build
```

---

## Principles

**Every number is cited, or it does not ship.** All quantitative values live in `src/data/` with a
source attached, surfaced in the interface through the evidence and citation components rather than
buried in a footnote. Where a contract term is undisclosed, the interface says so instead of
substituting a plausible value.

The derivation of the sequestration multiplier is shown to the user in the application, not hidden.
A regression test asserts the removed invented coefficients cannot reappear.

## Disclaimer

Screening tool for evaluating agricultural carbon contract offers. It is not a registry-grade
quantification, does not produce creditable offsets, and is not legal, financial, or agronomic
advice. Soil properties are drawn from SSURGO map-unit polygons and are not a substitute for
field sampling. Consult an agronomist and an attorney before signing a carbon contract.
