# Pharma Manager

A single-player tabletop-style web game about taking a new medicine from the lab, through clinical trials and financing, to launch and generic competition. Every rule is calibrated to published industry data, and a Monte Carlo balance test checks the game against those benchmarks.

**Play:** https://yarvalcher.github.io/pharma-manager/

It is an educational prototype. Molecules and companies are fictional, and nothing here is investment or medical advice.

## How a game runs

1. **Lab.** Choose target biology (genetic evidence or novel biology), modality (small molecule, antibody, or ADC for oncology) and disease area (oncology, immunology, cardiometabolic, rare disease). A screen reveals the candidate's efficacy, safety and indication size. You can optimise, re-screen, or in-license a Phase II asset instead.
2. **Pipeline.** Preclinical, Phase I, II, III and filing. Each stage costs money and years, then a d100 roll against odds built from the area, modality, target, molecule quality and optional cards (biomarker patient selection, priority review). Random events change odds, costs or timelines.
3. **Finance desk.** Available at every step, so running low on cash never freezes the game. See the table below.
4. **Launch and 13 market years.** Split a commercial budget across field reps, medical (MSL), omnichannel digital, payer rebates and patient support. A live preview shows sales, profit, NBRx, coverage and persistence. The KPI sheet tracks NBRx, switch-in, switch-out, TRx, persistence, access and gross-to-net.
5. **Generics.** Exclusivity ends after 13 years, then the game scores your final stake against 12,000 simulated companies.

## Finance desk: real deal structures

| Option | In the game | Real example |
|---|---|---|
| Bank or venture loan | 10–14% a year, limit 30% of the asset's risk-adjusted value; called if the program fails | Venture debt runs 10–13% plus warrants; Revolution Medicines' term loan from Royalty Pharma (2025) is SOFR + 5.75% |
| Equity round | Sell 10–50% of the company at cash minus debt plus 80% of rNPV, 7% fees, one round per stage | Standard venture, IPO and follow-on financing |
| Co-development partner | Upfront payment; partner pays half of all costs and takes half of all profits | AstraZeneca–Daiichi Sankyo, Enhertu (2019): $1.35B upfront, up to $6.9B, 50/50 |
| Out-license or sell rights | Upfront, stage-based royalty (7 / 10 / 14%), milestones; the licensee runs the program | Sanofi sold Libtayo rights to Regeneron (2022) for $900M plus an 11% royalty |
| Royalty financing | Cash now for 3% or 6% of future net sales, from Phase III | Royalty Pharma paid Revolution Medicines $250M for 2.55% of daraxonrasib sales (2025) |
| R&D funding | A funder pays Phase III; you repay on approval plus a 4% royalty, nothing if it fails | Blackstone Life Sciences committed up to $750M to Moderna's flu program (2024) |
| Priority review voucher | Rare pediatric approvals earn a voucher worth $150–200M | Vouchers sold for $150–160M in 2025 and $200M in 2026; program extended to Sept 2029 |
| Abandon or wind down | Stop a value-destroying program, or return the remaining cash | |

## Calibration against real data

Simulated with the game's own rules (20,000 programs per row).

| Metric | Game | Real benchmark |
|---|---|---|
| Phase I → approval, oncology / immunology / rare | 5.0% / 10.0% / 16.0% | 5.3% / 10.7% / 17.0% (BIO 2011–2020) |
| Phase I → approval, cardiometabolic | 8.8% | 4.8% cardiovascular, 15.5% metabolic (game blends both) |
| Antibody vs small-molecule odds | 1.66× | 1.61× (BIO) |
| Genetic-evidence effect | 2.55× | 2.6× (Minikel et al., Nature 2024) |
| Biomarker selection effect | 2.0× | 2.1× (BIO) |
| Phase I → approval time | 10.4–10.7 years | 10.5 years (BIO) |
| Out-of-pocket R&D per approval | $1.1–3.0B, average $2.0B | ≈ $1.9B in 2026 dollars (DiMasi 2016: $1.4B in 2013 dollars) |
| Capitalised R&D per approval | $2.7–7.7B | $2.6B in 2013 dollars (DiMasi); $2.67B (Deloitte 2025); $1.0–1.6B in 2018 dollars, oncology $2.8B (Wouters 2020) |
| Mean peak sales of launched drugs | $604M | $598M (Deloitte 2025) |
| Launches reaching $1B+ | 16% | 23% by expected peak (ZS, 2017–22 launches) |
| Program IRR | 2.1–4.6% | 7.0% top-20 cohort, 2.9% excluding GLP-1 drugs (Deloitte 2025) |
| Exclusivity after launch | 13 years | 13.0–14.1 years (Grabowski et al. 2021) |
| Brand volume kept a year after generics | 20% | 18–23% (Grabowski et al. 2021) |

Capitalised cost runs high because the game uses 2011–2020 success rates (7.9% from Phase I), lower than the 11.8% in the sample behind DiMasi's estimate.

## Balance test

3,000 full games per strategy, played by bots through the same engine. MOIC is the final stake divided by the $800M starting cash.

| Strategy | Drug approved | Insolvent | Median MOIC | Mean MOIC | Ends above start |
|---|---|---|---|---|---|
| Take any molecule, raise equity | 68% | 0.3% | 0.17 | 2.58 | 33% |
| Selective (indication ≥ 0.8×), equity | 37% | 0.0% | 0.65 | 3.65 | 34% |
| Selective + biomarker | 59% | 0.0% | 0.75 | 3.12 | 43% |
| Selective, borrow first | 36% | 2.7% | 0.65 | 3.37 | 33% |
| Selective, 50/50 partner at Phase II | 36% | 0.0% | 0.67 | 2.56 | 37% |
| Selective, out-license at Phase II | 37% | 0.0% | 0.71 | 1.56 | 39% |
| Selective, R&D funding for Phase III | 36% | 0.0% | 0.66 | 3.60 | 34% |
| Novel biology | 15% | 0.1% | 0.52 | 2.19 | 15% |
| Oncology antibody + biomarker | 50% | 0.2% | 0.75 | 3.35 | 45% |
| Cardiometabolic small molecule | 31% | 0.2% | 0.57 | 3.60 | 27% |
| Rare-disease antibody | 71% | 0.0% | 2.50 | 4.04 | 69% |

- True cash dead ends occur in under 0.3% of games.
- Outcomes are skewed like the real industry: the median company loses money and rare blockbusters lift the mean.
- Debt keeps ownership but adds insolvency risk; partnering and out-licensing raise the chance of ending above start but cap the upside.
- Rare disease is the strongest path, consistent with its higher success rates and cheaper trials. It is the main knob for more even areas.

## Run the balance test

Requires Node.js. The game page and the simulator share the same engine, `core.js`.

```
node sim/sim.js realism 20000   # trial odds, costs, IRR vs benchmarks
node sim/sim.js peaks           # peak-sales distribution of launched drugs
node sim/sim.js levers          # NPV-optimal commercial plan per area
node sim/bots.js                # 11 strategies x 3,000 games + score quantiles
```

## Known limitations

- Area, modality, target and biomarker effects are multiplied, which assumes they are independent.
- Market sizes, list prices and the response to each commercial lever are teaching assumptions tuned to match the peak-sales benchmarks, not measured values.
- One company develops one product line at a time, and the market model is US-style (rebates for coverage).

## Sources

- BIO, Informa, QLS Advisors. [Clinical Development Success Rates 2011–2020](https://go.bio.org/rs/490-EHZ-999/images/ClinicalDevelopmentSuccessRates2011_2020.pdf) (2021)
- Minikel et al. [Refining the impact of genetic evidence on clinical success](https://ideas.repec.org/a/nat/nature/v629y2024i8012d10.1038_s41586-024-07316-0.html). Nature (2024)
- DiMasi, Grabowski, Hansen. Innovation in the pharmaceutical industry: new estimates of R&D costs. J Health Econ (2016); [summary](https://www.keionline.org/23054)
- Wouters, McKee, Luyten. [Estimated R&D investment needed to bring a new medicine to market, 2009–2018](https://jamanetwork.com/journals/jama/fullarticle/2762311). JAMA (2020)
- Paul et al. How to improve R&D productivity. Nat Rev Drug Discov (2010)
- Deloitte. [Measuring the return from pharmaceutical innovation](https://www.deloitte.com/content/dam/assets-shared/docs/industries/life-sciences-health-care/2026/measuring-the-return-from-pharmaceutical-innovation.pdf) (2025 data)
- ZS. [Launch sizes and blockbuster potential](https://www.zs.com/insights/launch-sizes-and-blockbuster-potential)
- Grabowski et al. [Continuing trends in U.S. brand-name and generic drug competition](https://www.analysisgroup.com/Insights/publishing/continuing-trends-in-u-s-brand-name-and-generic-drug-competition/). J Med Econ (2021)
- IQVIA. [The rules of loss of exclusivity are being rewritten](https://www.iqvia.com/locations/united-states/blogs/2025/07/the-rules-of-loss-of-exclusivity-are-being-rewritten) (2025)
- LifeSciVC. [Venture debt terms](https://lifescivc.com/?p=280); Royalty Pharma. [Revolution Medicines funding agreements](https://www.royaltypharma.com/news/royalty-pharma-and-revolution-medicines-enter-into-funding-agreements-for-up-to-2-billion/) (2025)
- LES. [Effective royalty rates in biopharma alliances](https://lesi.org/wp-content/uploads/2024/04/effective-royalty-rates-in-biopharma-alliances-what-they-are-why-use-them-in-negotiations.pdf); Goodwin. [2025 licensing and collaboration review](https://www.goodwinlaw.com/en/insights/publications/2026/03/insights-lifesciences-2025-yir-life-sciences-licensing-collaboration-deals)
- [Daiichi Sankyo–AstraZeneca](https://www.daiichisankyo.com/media/press_release/detail/index_3199.html) (2019); [Regeneron–Sanofi Libtayo](https://newsroom.regeneron.com/news-releases/news-release-details/regeneron-strengthens-commitment-oncology-through-purchase) (2022); [Blackstone–Moderna](https://www.blackstone.com/news/press/blackstone-life-sciences-announces-collaboration-to-support-modernas-influenza-program/) (2024)
- [Pediatric priority review voucher reauthorisation](https://www.lowenstein.com/news-insights/publications/client-alerts/congress-reauthorizes-pediatric-priority-review-voucher-program-in-fy2026-budget-renewed-incentives-for-rare-pediatric-drug-development-fdalife-sciences) (2026); [recent voucher prices](https://www.pharmaceutical-technology.com/news/jpm26-jazz-sells-prv-for-200m-targets-deals-in-2026/)

## License

MIT, see [LICENSE](LICENSE).
