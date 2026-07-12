# Ground Truth

**An independent, fully-cited decision tool for US farmers weighing agricultural carbon contracts.**

**Live:** https://agricarbon-estimator-bvq8x807o-chandra-prakash-s-projects1.vercel.app

> Carbon companies will tell you what they'll *pay* you. None will tell you what you're *agreeing to*,
> that USDA often pays more for the same practice — or whether your soil can even **physically hold**
> the carbon they're paying you for.

Drop a pin on a field. Ground Truth queries the **USDA soil survey** and **USDA satellite crop
records** for that exact point and answers three questions no carbon program will:

1. **How much carbon can your soil physically still hold?** (Carbon Saturation Index)
2. **Will no-till cost you yield on this field?** (from SSURGO drainage class)
3. **Will they even count your practice as new?** (from your satellite-recorded rotation history)

Then it prices the contract honestly — subtracting the costs vendors omit — and shows you what
you're signing.

---

## Every coefficient is derived or cited — including the ones I got wrong

An earlier version of this engine carried numbers I had simply judged to be about right: four
sequestration multipliers (1.25 / 1.0 / 0.55 / 0.3) and five yield-drag percentages (−6 / −5 / −3 /
−1 / 0). They appeared nowhere in the literature. They were exactly the flaw this project was built
to refuse — an unsourced coefficient that quietly moves the answer — and they are gone.

**Yield drag** now comes from the meta-analyses, and the real evidence was **four times more severe**
than my guess at the bad end:

| | Was (invented) | Now (published) |
|---|---|---|
| Poorly drained | −5% | **−20% to −5%** — [Al-Kaisi 2015](https://crops.extension.iastate.edu/cropnews/2015/03/tillage-effects-corn-yield), DeFelice 2006 |
| Somewhat poorly drained | −3% | **−10% to 0%**, central −5.1% — [Pittelkow 2015](https://www.sciencedirect.com/science/article/pii/S0378429015300228) |
| Well drained | 0% | **−2% to +2%** — no-till *matches* conventional on rainfed well-drained ground |

**The sequestration multiplier** is no longer a lookup table. It is computed from the continuous CSI
using three published quantities:

```
deficitRatio = max(0, 1 − CSI) / (1 − REFERENCE_CSI)
multiplier   = min(1.5, POM_FRACTION + (1 − POM_FRACTION) × deficitRatio)
```

- **`POM_FRACTION = 0.34`** — the particulate share of surface soil carbon. [Stewart et al.
  (2007)](https://link.springer.com/article/10.1007/s10533-007-9140-0) show the mineral pool
  *saturates* while the particulate pool is *linear and non-saturating*; [Georgiou et al.
  (2022)](https://www.nature.com/articles/s41467-022-31540-9) put mineral-associated carbon at 66% of
  surface soil carbon, leaving 34%. **This is why the curve has a floor instead of falling to zero:**
  a full soil doesn't stop gaining carbon, it stops gaining the *durable* kind.
- **`REFERENCE_CSI = 0.69`** — the median saturation of the 16,014 RaCA lab samples, i.e. the state of
  the soils the published rates were *actually measured on*. A field there gets the published rate
  unchanged.
- **`1.5`** — a stated cap on upward adjustment. This is the one judgement call left, and the code and
  the UI both say so.

The derivation is shown to the user in the app, not buried. A regression test asserts the magic
numbers cannot come back.

## Validation — including where the model fails

Everything here rests on one claim: soil has a finite, texture-set capacity to hold carbon. So we
tested that claim against **USDA's Rapid Carbon Assessment** — 145,127 samples with carbon measured
in a *laboratory*, entirely independent of the soil survey the tool otherwise runs on. After
excluding subsoil, forest O horizons and peat, **16,014 mineral topsoil samples** remain.

`npm run validate` (`scripts/validate-raca.mjs`) reproduces all of this.

| | Result |
|---|---|
| ✅ **Holds up** | Median measured carbon rises steadily with fine fraction — 5.5 → 6.3 → 10.4 → 15.0 → 16.4 g C/kg — exactly the direction saturation theory requires. Bin-median correlation **r = 0.575**. |
| ⚠️ **Limitation** | At the level of a single sample, texture explains almost nothing about actual carbon (**r = 0.095**). Real SOC is governed far more by climate and land use. Hassink's law sets a *ceiling*; it never claimed to predict the contents. But it means CSI is a **coarse screen, not a precision instrument**. |
| ❌ **Against us** | The lab data reads saturated **more often than our model does** — median CSI **0.69 measured vs 0.45 modelled**. If we are wrong, we are wrong in the direction of telling a farmer there is *more* room for carbon than there really is. |

**35% of measured samples sit above the Hassink capacity line.** That is the expected result, not a
refutation: Hassink's capacity governs the *mineral-associated* pool, while the lab measured *total*
organic carbon, which also contains unprotected particulate matter. A sandy soil has almost no
mineral capacity yet can still hold carbon as loose particulate matter — real carbon, but weakly
held and easily lost on tillage. This is exactly why a CSI above 1.0 is meaningful rather than broken.

**Honest conclusion: the mechanism holds; the calibration does not.** CSI should be read as a
three-way screen (room / marginal / full), never as a precise number. RaCA's site coordinates are
**restricted** ("available only by request and approval"), so the point-for-point join to SSURGO —
the validation we actually wanted — could not be run. We report the gap rather than explain it away.

## The national map

We computed the carbon saturation of **arable soil in every county in the continental US** from
the USDA soil survey, and could not find that this had been published anywhere before. Every input
is free, public, federal data that has been sitting there for years.

The pattern is not the one the industry markets:

- **The South has the most headroom** — and that is a scar, not a gift. Soils across the Southeast
  carry ~1% organic matter because a century of intensive cultivation in a warm, wet climate
  stripped the carbon out. The room they lost is room a farmer can now be paid to refill, and the
  physics is genuinely on their side.
- **The Northeast and Pacific Northwest are closest to full.** Their soils are rich, which sounds
  like an advantage and is the opposite of one here: rich means *full*. New carbon has fewer mineral
  surfaces left to bind to, so it accumulates in unprotected form and is easily lost again.
- **There is no Corn Belt story at the county level** — it sits close to the national average. But
  see below: within-county variation dwarfs the between-county pattern, and *that* is the point.

Reproduce it: `npm run harvest` (`scripts/harvest-counties.mjs`).

### Getting this wrong first, and what it taught me

The first version of the harvester averaged over *all* soils in each county. It confidently
reported **Maine as the most carbon-saturated state in America** (mean CSI 3.02), with New Jersey
at 5.26. Those numbers are not believable, and the reason is instructive: a county-wide soil average
is dominated by **forest, wetland and peat soils** carrying 20–27% organic matter, which no farmer
will ever crop. I was measuring Maine's forests, not its fields.

The fix was to filter to genuinely farmable ground using SSURGO's own **land capability
classification** (class 1–3), excluding Histosols. That filter is not cosmetic — without it the map
is not about farming at all. The failure is documented in the script rather than quietly deleted,
because it is the kind of mistake this whole project exists to catch.

## The finding that justifies the whole project

Two real fields, the same practices, **opposite advice**:

| | Story Co., Iowa<br>*Webster clay loam* | Sumter Co., Georgia<br>*Kinston, Coastal Plain* |
|---|---|---|
| Organic matter | 6.7% | 1.7% |
| **Carbon Saturation Index** | **1.61** — beyond mineral capacity | **0.66** — moderate headroom |
| Cover-crop sequestration | **0.09–0.40** t CO₂e/ac/yr | near the national range |
| *(national average)* | *0.30–1.34* | *0.30–1.34* |
| Drainage | Poorly drained → **yield-drag risk** | — |
| **Verdict** | **"Do not sign a per-ton contract"** | Genuine candidate |

The Iowa field — prime Corn Belt ground, exactly the land carbon programs market to hardest — is
**physically close to its limit for stabilising new carbon**, and would deliver roughly a quarter of
what the national average implies. A per-ton contract there transfers measurement risk onto a farmer
whose soil is unlikely to deliver the tons.

**No public tool tells farmers this.** That's the gap.

---

## The science: carbon saturation

Every carbon calculator on the market implicitly treats soil as an infinite sponge — adopt the
practice, accrue X tons/acre/year, forever. Soil does not work that way.

Soil has a **finite capacity** to protect organic carbon. Carbon persists largely by binding to fine
mineral surfaces (clay and silt); once those surfaces are occupied, additional carbon has nowhere
stable to go. [Hassink (1997)](https://link.springer.com/article/10.1023/A:1004213929699) quantified
this; [Six et al. (2002)](https://link.springer.com/article/10.1023/A:1016125726789) generalised it
into the theory of carbon saturation.

```
SOC_current (g C/kg) = OM% × 10 / 1.724              [van Bemmelen]
fine_fraction (<20µm) ≈ clay% + 0.5 × silt%          [approximation — see below]
C_sat (g C/kg)        = 4.09 + 0.37 × fine_fraction  [Hassink 1997]
CSI                   = SOC_current / C_sat
```

**The consequence, which nobody tells farmers:** a soil near its protective capacity gains little
carbon *no matter what you do*. This is why the same practice yields 0.2 t C/ha/yr on one farm and
0.9 on another — and why a national average rate is close to meaningless for an individual field.

### We are honest about where this model is soft

- **It's an approximation.** Hassink's equation is defined on the <20 µm fraction. SSURGO reports
  clay (<2 µm) and silt (2–50 µm), not that exact cut. We estimate <20 µm as `clay + ½·silt` and say
  so on the page.
- **Total SOC ≠ mineral-associated SOC.** Hassink's capacity describes the *protected* pool; SSURGO
  reports *total* organic matter, which also includes unprotected particulate carbon
  ([Cotrufo et al. 2019](https://www.nature.com/articles/s41561-019-0484-6)). So CSI is an **index,
  not a lab measurement** — which is why a CSI above 1.0 is possible and is *not* a bug. It means
  carbon is held beyond what the minerals can protect: low headroom for new carbon, *and* existing
  carbon vulnerable to loss on tillage.
- [Georgiou et al. (2022)](https://www.nature.com/articles/s41467-022-31540-9) is the rigorous
  modern treatment. We use the simpler Hassink form deliberately, because it can be computed from
  the inputs a farmer's own field actually has in SSURGO, and shown transparently on a web page.

### And about no-till

[Powlson et al. (2014), *Nature Climate Change*](https://www.nature.com/articles/nclimate2292) found
that most apparent soil carbon gains under no-till reflect an **altered depth distribution** of
carbon rather than genuinely additional carbon — sample to 30 cm and no-till looks excellent, sample
deeper and the gain often disappears.

**This is why the no-till sequestration range in this tool starts at zero.** No commercial calculator
does that, because none has an incentive to.

---

## The data join nobody had done

Everything needed to answer these questions is already public, free, and federal. It was simply never
put together, because the two datasets don't speak to each other:

| Source | Gives us | Why it was hard |
|---|---|---|
| **[USDA SSURGO](https://sdmdataaccess.nrcs.usda.gov/)** (Soil Data Access) | Soil series, organic matter, clay/silt, bulk density, **drainage class** | No CORS; you POST raw **SQL** against the national soil database |
| **[USDA CropScape / CDL](https://nassgeodata.gmu.edu/CropScape/)** | 30 m crop classification, every acre, every year since 2008 → **rotation history** | No CORS; only accepts **EPSG:5070 Albers** coordinates, not lat/lon |

So `api/_lib/albers.js` implements the Albers equal-area conic forward projection (Snyder, USGS
PP 1395) rather than pulling in a multi-megabyte geospatial dependency for one piece of trigonometry.

The API layer returns **raw measurements only**. All interpretation — the saturation model, the risk
scoring — happens client-side in `src/engine/`, in the open, so anyone can read exactly how a
conclusion was reached. Hiding the model on the server would defeat the point of the project.

---

## The other things nobody publishes

**The Contract Risk Matrix.** Contract length, permanence obligation, early-exit forfeiture, buffer
holdback, data rights, minimum acreage, who pays for sampling — for the major US carbon programs,
side by side. Every company publishes its rate card; not one publishes its termination clause next to
a competitor's. Where a term isn't disclosed, the matrix says **"Not published"** in plain italic grey
rather than inventing a plausible-looking value.

> As of July 2026, exactly **one** major US carbon program (Indigo) has ever had its contract terms
> verified by an independent third party. That it stands alone tells you most of what you need to know
> about this market.

**A net-return model that subtracts.** Vendor calculators compute `tons × price` and stop. This one:

```
net = carbon payment + USDA cost-share − implementation cost − yield impact
```

The subtractions are the point. Plant cover crops and you might earn $6–12/ac from a carbon program
while spending ~$37/ac establishing them.

**USDA pays more, and nobody tells you.** EQIP pays **$34–75/ac** for cover crops. A carbon program
pays **$6–12/ac** for the same cover crops — with a longer commitment and a permanence obligation.
Nobody earns a commission telling farmers this.

**A contract red-flag checker.** Eight questions, answered from the document in your hand → which
clauses to fight, which to walk away from, which are normal. Farm legal-aid guidance is excellent and
nobody reads it, because it's a 40-page PDF and there's a rep at the kitchen table.

---

## Principles

**Every number is cited, or it doesn't ship.** All quantitative values live in
[`src/data/sources.js`](src/data/sources.js) with a source, URL, retrieval date and evidential tier
(*peer-reviewed / government / independent / self-reported*). The `cite()` helper **throws** on an
unregistered key, so an uncited number breaks the build rather than silently shipping. Citations
render inline — click any `i`.

**Ranges, never point estimates.** Field-to-field variance in soil carbon accrual is larger than the
mean effect. A single confident number would be a lie.

**The tool is willing to say "don't do this."** A calculator that always finds a reason to enrol is a
marketing funnel, not a decision aid. This one will tell you to walk away, and does.

**"Not published" beats a plausible guess.** The blanks in the matrix are the questions to put to a
sales rep in writing.

---

## Architecture

```
scripts/                    # Offline data pipeline (run once, results committed)
├── build-map.mjs           #   TopoJSON → Albers-projected SVG paths + county WKT
└── harvest-counties.mjs    #   SSURGO → carbon saturation for 3,100 counties

api/                        # Vercel serverless — federal data, CORS-proxied
├── field.js                #   ?lat&lon → SSURGO soil + CDL rotation history
├── geocode.js              #   address → coords (US Census; no commercial broker)
└── _lib/
    ├── albers.js           #   EPSG:4326 → EPSG:5070 (CropScape speaks only Albers)
    ├── ssurgo.js           #   SQL over the national soil database; 0–30cm depth-weighted
    └── cdl.js              #   satellite crop history

src/
├── engine/                 # All science, client-side and in the open
│   ├── saturation.js       #   Hassink carbon-saturation model → CSI
│   ├── saturation.test.mjs #   12 tests against hand-computed values
│   ├── fieldRisk.js        #   drainage → yield drag; rotation → additionality
│   └── netReturn.js        #   payment + cost-share − cost − yield drag
├── data/
│   ├── sources.js          #   Citation registry. cite() throws on unknown keys.
│   ├── practices.js        #   Sequestration ranges, costs, yield evidence
│   ├── programs.js         #   THE CONTRACT RISK MATRIX
│   ├── costShare.js        #   EQIP / CSP + stacking rules
│   └── county*.json        #   Harvested saturation + map geometry
└── components/
    ├── SaturationMap.jsx      # ← the national map
    ├── FieldIntelligence.jsx  # ← your actual field
    ├── ContractChecker.jsx    # ← eight questions
    ├── ContractMatrix.jsx
    ├── DecisionTool.jsx
    ├── CostShare.jsx
    ├── Evidence.jsx           # methodology, limitations, full source list
    └── Cite.jsx               # inline citation popover
```

The map ships as **pre-projected SVG paths**, not GeoJSON: `build-map.mjs` runs the same Albers
equal-area projection used for the CropScape lookup and quantizes to whole pixels, so the browser
needs no `d3-geo`, no `topojson-client`, and no runtime projection of 3,000 polygons. Equal-area
matters for a choropleth — a projection that inflated northern states would visually overweight
them, which for a map about soil is exactly the sort of quiet distortion this project exists to
avoid.

`vite.config.js` mounts the **same** `/api` handlers on the dev server that run as serverless
functions in production — one implementation, exercised identically in both environments, no mock
server to drift out of sync.

**Stack:** React 18 + Vite. No UI framework, no charting library, no animation library — **82 KB
gzipped**. (The previous build shipped `three.js`, `gsap`, `animejs`, `recharts` and `jspdf` for a
page that needed none of them.)

---

## Run locally

```bash
npm install
npm run dev      # http://localhost:5173
npm test         # 12 tests on the saturation model
npm run validate # re-run the RaCA validation (needs the RaCA dataset in /tmp/raca)
```

Try the **Story Co., Iowa** example on the field tool — it hits live USDA services and takes a few
seconds. Federal services, federal speed.

To rebuild the national map from scratch (~15 min against SSURGO):

```bash
curl -so /tmp/counties.json https://cdn.jsdelivr.net/npm/us-atlas@3/counties-10m.json
npm run harvest
```

```bash
npm run build && npm run preview
```

---

## Limitations

This is a **planning-grade** tool, not a credit-grade measurement, and it says so on the page.

- CSI is an **index**, not a lab measurement — see the caveats above. It uses the *dominant* soil
  component of a map unit; a real field can contain several soils.
- Ranges come from meta-analyses of *other people's fields*. Yours can fall outside them.
- Nothing here substitutes for soil sampling on your own ground; no registry would accept it.
- **EQIP rates are state-set and revised annually.** The tool shows the observed national spread,
  flags it explicitly as an estimate, and links to the authoritative state schedule.
- Cost figures come from SARE's 2019 survey **as published** — treat them as relative magnitudes,
  not current quotes.
- Program terms marked *self-reported* are from company materials and are **not** independently
  audited. They change.
- SSURGO and CDL are **US-only**. The contract analysis and the soil science apply anywhere; the
  field lookup does not.
- Nitrous oxide, methane, and embedded fertiliser/fuel emissions are **not** modelled. A full farm
  carbon footprint is a different and harder question.

**Not financial, legal, or agronomic advice.** Carbon contracts are binding multi-year legal
agreements — often the longest commitment on a farm after the mortgage. Have a lawyer read one before
signing.

---

## Author

**Chandra Prakash Choudhary**
Graduate Student, Dept. of Environmental Health & Engineering, Johns Hopkins University
[cpchoudhary2024@gmail.com](mailto:cpchoudhary2024@gmail.com)

Independent and non-commercial. Sells nothing, brokers nothing, takes no commission from any program
listed here.

*Program terms last verified 11 July 2026. Terms change — verify before relying on anything here.*
