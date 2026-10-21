# Morua Junction — Deep Competitive Audit

> **This is the audit as it was written on 18 October 2026 — a record of the
> analysis, not the specification.** Three of its recommendations were later
> overturned by the founder, and the scope widened from Gaborone to the whole
> country. Where this document and the product disagree, the product wins:
>
> | This audit said | The product does |
> |---|---|
> | The admin must never reprice (C-2) | The admin sets a declared 0–25 % markup on a shop's own price — clamped, audited, and the seller is told |
> | One contracted delivery partner, no auction (C-4) | The admin chooses the provider for each order from five registered providers |
> | Risk-based approval, not a liquidity tax (C-3) | Every shop manager is approved by an admin before it can trade |
> | Pilot in one area, two categories (C-7) | 40 towns, every district, 138 shops, 2,919 products |
> | A TypeScript monolith (H-7) | One Rust service is the only backend; TypeScript is the dataset toolkit and the storefront |
>
> See [the product specification](../product-spec.md) §4 for the decisions as
> ratified, and the [README](../../README.md) for what actually ships.

**Subject:** Morua Junction (virtual mall for Gaborone retailers, with registered delivery providers)
**Repository:** `presscafe/moruajunction` @ `6bc30ab`
**Audit date:** 18 October 2026
**Auditor:** Arena Agent (Arena.ai Agent Mode)
**Scope:** Product model, business model, marketplace mechanics, delivery & payments, regulatory exposure, technology direction, and a full benchmark against the top competitors in Botswana, Southern Africa, and the global "virtual mall" archetype.

---

## 0. Headline verdict

**The concept is a legitimate archetype, aimed at a real market, specified in a way that reproduces the exact failure mode that has already killed five of its direct predecessors in Botswana — and adds two new failure modes of its own.**

Three things must be said plainly before anything else:

1. **There is no app.** The repository contains `README.md`, `LICENSE`, and a Dart-template `.gitignore`. There is no backend, no schema, no auth, no payments code, no UI, no CI, and no deployment. The only other artefact anywhere is a `UI-DIRECTION-VISUAL-THINKING-STORYTELLING.md` in a fork. This is therefore a **concept audit**, and the first and most consequential finding is that the concept has never been reduced to code, a data model, or a single end-to-end flow.
2. **The competitive set is not a set of aspirational giants — it is a set of local corpses.** At least five Botswana e-commerce startups have shut down since 2023, with founders citing fractured payments as the leading cause. `BW Reka` (the government/UNCTAD national marketplace) is defunct. `BuyBDub` is defunct. `Artify Botswana` closed in early 2024 because buyers browsed on-platform and transacted offline. `Vaisa` is stuck on last-mile cost. Morua Junction's concept is not the first attempt at this in Gaborone — it is the sixth.
3. **The single most valuable line in the README is also the most dangerous.** *"The admin … [can] adjust prices for the products as listed by shop manager"* is the feature that most distinguishes Morua from every benchmarked competitor, and it is the feature most likely to kill it (see **C-2**). It is simultaneously a trust destroyer, a legal exposure, a fraud channel, and a business-model error — and it is redundant, because the platform can monetise without it.

**Recommended strategic reframe (one line):**
> *Not "a marketplace with its own delivery arm" — but **Gaborone's trade and fulfilment network**: the system of record between the city's physical shops and their customers, monetised on fulfilment, paid for in pula via local rails, and delivering same-day from stock that is already in town.*

The defensible differentiator is not the "virtual mall" metaphor (Rakuten and Kilimall already own that, and it is worth nothing to a Gaborone shop owner). It is this single, checkable claim:

> **"Every product on Morua Junction is already in Gaborone."**

Takealot, Shein, Temu, Amazon, and the forwarder cottage industry physically cannot make that claim. A Facebook group cannot make it credibly, because it cannot guarantee availability, fulfilment, or returns. That claim, backed by a visible verification badge and a physical shop address, is the entire product.

---

## 1. Method and evidence base

| Step | What was done |
|---|---|
| Repository forensics | Full working tree, `git log --all`, reflog, all refs, stash, GitHub API for contents/PRs/issues/branches/forks |
| Upstream/orphan check | `moruajunction/moruajunction` (referenced in README) — no longer resolvable; upstream deleted or renamed |
| Org scan | All 50+ `presscafe/*` repos, including `presscafe/reka-botswana` (a prior attempt) and a `strapi` fork |
| Fork scan | `faroukpandor/moruajunction` — contains only the UI direction document |
| Market research | Botswana e-commerce market size, penetration, payments rails, mobile money, consumer behaviour, retail channels |
| Competitor research | Takealot, Kilimall, Rakuten, Jumia, Jiji, Gabs Eats, Zebras, inDrive, Bolt, CTM, cross-border forwarders, local dead startups |
| Regulatory research | BURS VAT framework, 2026 electronic-marketplace deemed-supplier rules, e-invoicing, Data Protection Act 18 of 2024, payment rails |
| Benchmarking | Scored comparison of the Morua concept against 11 competitors across 11 dimensions |

**Evidence confidence.** Market-size figures for Botswana conflict by roughly 5× across sources ($119M–$630M for 2024). This audit treats **all market-size estimates as low-confidence** and anchors instead on the hard behavioural data (Stats Botswana ICT Survey, BURS, UNCTAD, BOCRA) which is consistent across sources. Where a claim rests on a single source, it is marked.

---

## 2. The competitive landscape

### 2.1 The market, honestly sized

| Metric | Value | Source / confidence |
|---|---|---|
| Population | ~2.4M | High |
| **Individuals using e-commerce (2024)** | **142,721 (7.9% of individuals)** | Stats Botswana 2024 ICT Survey — high |
| Of which urban | 86.9% | Stats Botswana — high |
| Of which in Gaborone | 36,619 | Stats Botswana — high |
| E-commerce penetration (UNCTAD) | 5% (South Africa: 49%) | UNCTAD — high |
| E-commerce revenue 2024 | $119M–$382M (sources conflict ~3×) | ECDB / Statista — **low confidence** |
| Share of online orders in Gaborone | ~45%+ | Multiple — medium |
| Cash in circulation 2011→2023 | +110% to P4.2bn | Bank of Botswana — high |
| Mobile money subscribers | 1.1M–1.7M (fell 7% in one quarter, 2023) | Stats Botswana / Arkwright — high |
| Mobile money share — Orange Money | ~78% of subscribers (~93% by transaction value) | africa-press / ACER paper — medium-high |
| Other wallets | MyZaka/Mascom 11%, BTC Smega 7%, Botswana Post Poso 4% | africa-press — medium |
| Card ownership (adults) | 30–50%, on domestic VisaNet | Arkwright — medium |
| Payment mix (2026 est.) | Cards 35%, mobile banking 25%, **COD 18%**, mobile money 12%, bank transfer 10% | easyappsecom — low-medium |
| Payment gateways present | DPO, PayGate, Peach Payments, Paystack, Flutterwave | Multiple — high |
| Online stores in Botswana | ~706; **WooCommerce = 410 (58%)** | Aftership — medium |
| Share of digital market held by Asian sellers (2024) | 34%, and rising | Stats Botswana — high |

**The two numbers that decide everything:** *142,721 e-commerce users in an entire country* and *36,619 in Gaborone*. Every strategic question — category breadth, delivery geography, catalogue depth, team size — must be answered against that denominator, not against "a $250M market" headline.

### 2.2 The benchmark set

#### Tier 1 — Direct local competitors (the ones that actually take Morua's money)

| Competitor | Model | Economics | Where it wins | Where it's weak | Status |
|---|---|---|---|---|---|
| **Takealot** (Naspers/Shoprite) | Marketplace + 1P retail, 4 SA DCs, Mr D logistics arm | R400/mo (ex-VAT) + **4–18% success fee** (VAT-inclusive) + FBT R22–R390 + storage after 35 days | 22M+ products, 10k+ sellers, 8M MAU, ~$2.5B GMV, AOV R650, 4,500+ drivers, 1.6M monthly deliveries, pickup points, same/next-day, `TakealotMORE` R39/R99 | **No local stock.** Botswana served by international shipping (7–14 days) or by forwarders. Only 48% on-time per reviews.io; Trustpilot full of 2–3 week complaints. 98% on-time is the company's own claim | Alive, dominant |
| **Cross-border forwarders** (Lots.co.bw, Stratix Logistix, SwiftPath, ParcelPath) | Personal-shopper + consolidation + customs | Consumer-paid per parcel; no seller commission | 2–5 business days SA→Gaborone; trusted, human, personal; handles customs clearance and a SA payment address | No local inventory, no returns, expensive per item, not searchable, no guarantee | Alive, thriving, **under-priced** |
| **CTM Botswana** | Retailer own-channel click & collect | Free collection; 5 stores nationwide | Order by phone/WhatsApp, ready in ~3 hours, pay online | Single retailer, narrow catalogue | Alive, proving the pattern |
| **Facebook / WhatsApp / TikTok groups** | Social commerce | Zero platform cost | Zero onboarding; instant trust via the seller's existing reputation; people browse on FB/TikTok and buy on WhatsApp | No availability guarantee, no fulfilment, no returns, no payment rail, no discovery | **The real competitor** |
| **Gabs Eats** | Local delivery platform, 100% electric fleet built in Gaborone | — | Food→groceries→courier; cash/card/mobile money at checkout; live tracking; already at scale | No marketplace; Gaborone-only | Alive, at scale |
| **Zebras** | Gaborone delivery app, electric scooters | — | Food, groceries, pharmacy, flowers; **separate rider app AND business-partner app** (the B2B2C layer Morua would build) | Early-stage | Alive, early |
| **inDrive / Bolt / Yango** | Ride-hail (Bolt also courier/food) | inDrive 10% driver fee (introduced 2024, 0% before); Bolt 15–20%, waived 6 months | Existing rider supply; inDrive since 2019; Bolt since Feb 2024 with 100 drivers | Uber absent; no marketplace goods | Alive |
| **Shoprite / Pick n Pay / Woolworths / Super Spar / Choppies** | Bricks with online + click & collect | — | Stock is local, pickups are free, trust is established, they are already everywhere | Siloed catalogues, no multi-vendor basket, no third-party seller access | Alive |

#### Tier 2 — Failed local predecessors (the most important comparators in this audit)

| Predecessor | What it was | Why it died | Lesson for Morua |
|---|---|---|---|
| **BW Reka** | National e-commerce marketplace, launched under the 2021 Botswana National E-Commerce Strategy (with UNCTAD) | Defunct. National strategy itself "failed to bear fruit" after 3 years | Government backing + a national mandate did not save a marketplace that couldn't solve payments and logistics |
| **BuyBDub** | Botswana e-commerce startup | Defunct. Founder's own diagnosis: Botswana needs "warehousing, distribution, and last-mile delivery systems to reduce operational costs" | The founder of a dead local marketplace is telling you the build order |
| **Artify Botswana** | Marketplace for visual art, with verified sellers, secure payments | Closed early 2024. **"Buyers would visit the site but complete the transaction offline"** → commission model captured nothing. COD undermined scalability | *This is the direct causal chain for Morua's model.* Do not build a referral catalogue |
| **Vaisa** | Botswana e-commerce with delivery | Stuck. "The best way to handle logistics is to have an in-house fleet because courier companies would be too expensive" — but a nationwide fleet is its own challenge | Last-mile is a capital business, not a marketplace feature |
| **5+ startups (unnamed)** | Various | "Founders citing fractured payments as the leading cause of the shutdowns" | Payments is the product, not the plumbing |

#### Tier 3 — The "virtual mall" archetype (global)

| Competitor | Model | Economics | Lesson |
|---|---|---|---|
| **Rakuten Ichiba** (Japan) | The original merchant-first virtual mall: **~57,000 merchants, each with its own branded storefront, own shipping policy, own CS**. Flat ¥50,000/mo rent in 1997 → moved to usage-based + commission in 2002. Merchants assigned an **ECC (e-commerce consultant)** who reviews their analytics with their accountant weekly | 2–10% commission; ads >¥210bn/yr; own points economy; **owns no inventory**; ~27% JP share | Rent killed the long tail → moved to commission. Merchants keep their branding and their customer. **Rakuten never repriced a merchant's goods** |
| **Kilimall** (KE/UG/NG) | "Africa's No.1 online shopping mall" — 2,000+ pickup points, 82% next-day delivery, 98% reliability, own payment channels, rewards | 5–15% commission (category-based); KiliShops agent network; <$5–6M revenue, 201–500 staff | The full-stack version of the Morua model — and it took 12 years, 425 people and a 10,000 sqm warehouse. Revenue is *small* relative to the effort |
| **Jumia** | Pan-African marketplace | — | Country-by-country scale; failed to hold many African markets |
| **Jiji** | Free-to-list classifieds, direct seller contact, no escrow | Free to list | Free listing + no escrow = fast liquidity *and* a fraud problem ("you can fall into the hands of fraudsters") |
| **Shopify / WooCommerce** | Bring-your-own-storefront (58% of Botswana's online stores) | Subscription + own PSP | Most Gaborone shops will never join a marketplace — they will open a WooCommerce store. Morua must beat "my own store + a Facebook group" |
| **Mirakl / VTEX / commercetools** | Marketplace-as-a-service | Licensing | A 2-person team can rent the marketplace mechanics; the moat is never the code |

### 2.3 Scored benchmark — Morua concept vs. the field

*(1 = worst, 5 = best. "MJ" = Morua Junction as currently specified.)*

| Dimension | MJ | Takealot | Kilimall | FB/WhatsApp | Forwarders | Gabs Eats / Zebras | Jiji | Rakuten |
|---|---|---|---|---|---|---|---|---|
| Local stock in Gaborone | 5 | 1 | 1 | 3 | 1 | 4 | 3 | 2 |
| Same-day delivery | 2 | 1 | 3 | 1 | 1 | 5 | 1 | 4 |
| Local payment rails (Orange Money/MyZaka) | 1 | 2 | 5 | 2 | 2 | 4 | 1 | 4 |
| Cash-on-delivery fit | 3 | 1 | 1 | 5 | 4 | 5 | 5 | 1 |
| Trust / verification | 2 | 4 | 4 | 3 | 2 | 3 | 1 | 4 |
| Catalogue breadth | 1 | 5 | 4 | 3 | 1 | 2 | 4 | 5 |
| Seller tooling | 1 | 5 | 4 | 1 | 1 | 2 | 3 | 5 |
| Delivery unit economics | 1 | 4 | 3 | 5 | 3 | 4 | 5 | 4 |
| Brand recognition | 1 | 5 | 3 | 5 | 3 | 3 | 4 | 5 |
| Scale / liquidity | 1 | 5 | 4 | 4 | 3 | 3 | 4 | 5 |
| **Total / 55** | **19** | **36** | **32** | **32** | **25** | **35** | **32** | **41** |

**Reading of the scorecard.** As specified, Morua scores lowest of the field on almost every dimension except one: **local stock (5)**. That single 5 is the business. Every other low score is a consequence of being a subscale entrant — which is fine, *if* the strategy is to win the dimension you can win and ignore the ones you cannot. The current specification instead tries to win all of them at once (own delivery services, own price control, own approval workflow) and loses on all of them.

**One-line competitive conclusion:**
> Morua Junction is **not** competing with Takealot. Takealot does not serve Gaborone well and will not fix that for us. Morua is competing with **the WhatsApp group and the forwarder**, and as currently specified it loses to both: it adds friction (approval queues, bidding, admin overrides) to a transaction that a Batswana consumer today completes in ninety seconds of chat, and it adds nothing that a forwarder doesn't already provide (local stock, guaranteed availability, returns).

---

## 3. Findings register

Severity: **C** = Critical (blocks launch or is a structural business-model error) · **H** = High · **M** = Medium · **L** = Low.

---

### C-1 · There is no product · `severity: CRITICAL` · `confidence: certain`

**Evidence.** The working tree contains exactly three files. `git log --all --diff-filter=A` returns only `.gitignore`, `LICENSE`, `README.md`. The sole commit is `6bc30ab` ("Merge pull request #1 from faroukpandor/main" — a README edit). GitHub issues are **disabled**. The single PR is a README edit. The upstream `moruajunction/moruajunction` organisation referenced in the README no longer resolves. The one fork adds a design-direction document and no code. The sibling `presscafe/reka-botswana` — evidently the prior attempt — is an **unmodified Netlify Gatsby e-commerce theme**: no backend, no database, no marketplace logic, no auth.

**Why it matters.** A concept that has never been implemented has never been stress-tested against any of the hard questions the implementation forces: who is the merchant of record, who holds the money, who is liable in transit, who invoices whom, what happens when the buyer is not home, what happens when the seller doesn't have the item, what happens when a delivery provider's bid expires at 18:55. Every one of these questions is currently unanswered, and each one has a documented answer in the failure record of the local predecessors.

**Recommendation.** Before any feature work: write **one** end-to-end narrative transaction — *"Mpho in Gaborone buys a 2L bottle of cooking oil from a shop in Kgale, pays by Orange Money, and it arrives at 16:40"* — and make every product, data, legal and financial decision a consequence of it. Then write the **data model** (10 entities) and the **ledger** (the money-movement state machine). Neither exists. Everything else is downstream.

---

### C-2 · Admin price override is disqualifying as specified · `severity: CRITICAL` · `confidence: certain`

**The spec.** *"there will also be an admin who will have control over the platform including being able to adjust prices for the products as listed by shop manager. they will be able to increase the prices"*.

**This is the most consequential sentence in the README, and it is wrong in four independent ways.**

**(a) It breaks the core promise.** The pitch to a shop manager is that *they* control their inventory, prices, specials and discounts. If the platform can raise a price without consent, the promise is void on arrival. No serious seller will place meaningful volume on a platform that can reprice their stock. Benchmark: Rakuten gives every merchant its own branded page, shipping policy and customer service and never touches the price. Takealot takes 4–18% and never touches the price. Kilimall takes 5–15% and never touches the price. **Every one of the successful comparators monetises without repricing.** This is not a stylistic difference; it is the difference between a platform and an adversary.

**(b) It is a legal and regulatory exposure, arriving exactly now.** Botswana's new VAT framework (in force 1 June 2026, charging from 1 October 2026) introduces **deemed-supplier rules for electronic marketplaces**: BURS defines an online marketplace broadly — *"a digital platform connecting or facilitating electronic transactions and interactions, whether directly or indirectly, between sellers and buyers for the supply of goods and services"*, expressly including websites, portals, gateways and app stores, and **expressly excluding platforms that solely process payments** — and provides that a marketplace facilitating a supply by an unregistered underlying supplier, **where it controls payment, delivery or contract terms, may itself become liable for 14% VAT on the B2C supply**. A platform that sets the seller's price, collects the money and dispatches the delivery is the archetype most exposed to that rule. Separately, unilateral price increases by a platform are a consumer-protection problem (misleading price display, unfair trading practice) and a competition-law concern if Morua becomes a de-facto standard. **This needs a BURS ruling and a consumer-protection opinion, not a product decision.**

**(c) It is a fraud and money-laundering channel.** If an administrator can unilaterally increase a price, then an administrator (or anyone who compromises an admin session, or any admin who is simply dishonest) can inflate a price, capture the inflated margin as commission, or extract a kickback from a seller who wants the increase reversed. Without immutable, reconciled price history, a maker-checker workflow on any money-affecting action, and an append-only audit log, this is an unmonitored channel from the platform's own order flow into a private pocket. A marketplace is the *last* place you want unaudited discretion over the number that money is computed from.

**(d) It is the wrong revenue lever anyway.** If the platform needs margin beyond a percentage of GMV, the correct levers exist and are all better: a monthly seller fee (Takealot's R400 — but too high for Gaborone SMEs in v1), delivery fees, payment margin, sponsored placement/ads, premium seller tiers, and platform-funded promotions. Takealot extracts 4–18% *plus* R400/month *plus* fulfilment *plus* storage *plus* ads from 10,000+ sellers without ever touching a price. There is no margin problem that price control uniquely solves.

**Recommendation — remove the power entirely, and replace it with four legitimate mechanisms:**

| Instead of | Build |
|---|---|
| Admin raises a price | **Anomaly guardrail**: automated flagging of prices materially outside category norms, which *suspends the listing for review* and notifies the seller. Never rewrites the price. |
| Admin lowers a price | **Platform-funded promotions**: the platform sets a promo price, funds the discount itself, and books it as marketing spend. The seller's own price is untouched. This requires a promotion engine with funding attribution (see M-2). |
| Admin needs margin | **Commission + delivery fee + ads + optional Pro tier** (see H-6). |
| Admin needs control | **Verification, suspension, dispute resolution, and flagging** — none of which move money. |

If a supervisory-price concept is ever wanted (e.g. for staples), it belongs to a *regulated category* with published rules, a written policy, seller notice, appeal, and multi-party sign-off — not to a discretionary admin toggle. **The admin's product surface should have exactly one button that can affect a price, and it should be labelled "Apply promotion funded by Morua Junction".**

---

### C-3 · Pre-approval of shops and products is a liquidity tax · `severity: CRITICAL` · `confidence: high`

**The spec.** *"the admin will also be able to approve shop manager adding shops and products"*.

Every product and every shop waits on a human. Catalogue growth is therefore bounded by the ops team's throughput, and every listing sits in a queue with an unbounded SLA. For a business whose realistic v1 catalogue is a few hundred SKUs from a few dozen shops, this is a self-inflicted wound; for a business hoping to scale, it is fatal.

**Benchmark.** Kilimall verifies **merchants** (business legitimacy) once, then lets merchants self-list with platform-side quality controls. Takealot verifies sellers, then governs listing quality with automated checks plus post-hoc enforcement and strikes. Rakuten delegates merchant support to a field force of ECCs who advise rather than gate. Nobody in the benchmark set pre-approves individual products. Pre-approval is a *quality* mechanism being misapplied as an *onboarding* mechanism.

**Recommendation — two-tier approval:**

| Tier | Trigger | Mechanism | SLA |
|---|---|---|---|
| **Tier 1 — automated/risk-based** | All new merchants | KYB (registration cert, tax ID, bank account in the merchant's own name), physical address + shop photo + geo-verification, banned-category screening, catalogue rules (title length, image quality, price sanity, duplicate detection) | **Instant to 4 hours** |
| **Tier 2 — human review** | Flagged merchants only: electronics, liquor, tobacco, health/cosmetics, baby, high-value, or a first-time merchant with anomalies | Trained reviewer, checklist, decision + reason code | **< 24 hours** |
| **Post-hoc enforcement** | Any live listing | Sampling, automated duplicate/price/authenticity checks, strike system (warn → delist → suspend), seller appeal | Ongoing |

Publish the SLA. Sellers in this market are price-sensitive and time-poor; an unpublished approval queue reads as "unresponsive platform" within one week.

---

### C-4 · The delivery model is the largest financial risk and it is specified backwards · `severity: CRITICAL` · `confidence: high`

**The spec.** The platform *"will also have its own delivery services which will register delivery services providers"*, and *"which delivery service provider get the jobs of delivering that they bid for"*.

**Five compounding problems:**

**(a) Auction latency at the worst possible moment.** A bid-based award requires a collection window before an order can move. Even a 5-minute window before a rider is assigned is severe in a market where the incumbent's on-time rate is already 48% (reviews.io) and Trustpilot is full of two-to-three-week complaints. A customer will simply stop using a service that cannot tell them who is coming.

**(b) Race to the bottom with no floor.** Providers bid down; the platform's margin and the rider's income both collapse; the least viable operator wins, under-delivers, and takes the platform's reputation with them. This is a well-known failure mode of reverse-auction logistics.

**(c) Fraud surface.** Bid spam, phantom bids to manipulate the platform's rate card, collusion, driver no-shows, and "ghost" providers to inflate apparent supply.

**(d) The local benchmark is dispatch, not auction.** Gabs Eats dispatches from an owned electric fleet. Zebras dispatches from its own rider app. inDrive and Bolt dispatch algorithmically at 10% and 15–20% driver commission. **None of them auction.** And note the entry economics: Bolt *waived* commission for six months to launch in Gaborone (100 drivers at launch), and inDrive ran at 0% in Botswana for five years before introducing 10% in 2024. A subscale entrant cannot win a supply-side subsidy war against a funded international — it must not enter one.

**(e) The unit economics are brutal in Gaborone specifically.** The local evidence is unambiguous: *"courier companies would be too expensive"*, so the answer is an in-house fleet — *"but having your fleet that can deliver nationwide is another challenge on its own"* (Vaisa). For scale: an inDrive driver nets ~P6,000/month for ~12-hour days, i.e. ~P21/hour before fuel and wear, or ~P500/day. A Gaborone order with an average basket of P150–P300 cannot absorb a P50+ delivery cost *and* a 10% commission *and* payment-processing fees *and* support cost while remaining cheaper than a WhatsApp purchase.

**Recommendation:**

1. **Do not build a delivery marketplace in v1.** You would be building a two-sided marketplace inside a two-sided marketplace, in a market of 36,619 e-commerce users. This is how the local peers died.
2. **Model delivery as a cost centre with a published tariff, not an auction.** Platform-set, distance-banded prices in pula (e.g. 3 bands: 0–5 km / 5–10 km / 10–20 km), always at or above true cost.
3. **Contract, don't crowd.** Start with **one** delivery partner under a written services agreement (an existing at-scale local fleet — Gabs Eats or Zebras — is the obvious candidate, and Zebras already ships a *business-partner app*, which is precisely the B2B2C layer you would otherwise build). Add your own small rider pool only when volume justifies it.
4. **Start with pickup.** Click-and-collect at 3–5 points (malls, office blocks, a hub) is free of the last-mile problem entirely, matches the fastest-growing Botswana pattern (CTM: order by WhatsApp, ready in ~3 hours; "click & collect" is the trend cited across Botswana retail coverage), and generates a second footfall reason for shops to join.
5. **Build dispatch properly if/when you build a rider marketplace.** Uber Eats/Bolt-style algorithmic dispatch with a guaranteed payout floor, rider ratings, and app-based POD. If you want to keep the bid mechanism, restrict it to *overflow capacity* only, never to primary assignment.
6. **Own the customer-facing surface regardless of who moves the box.** ETA, live status, proof of delivery (photo/signature/OTP), and a failed-delivery taxonomy are yours even if the fleet is a partner's. That is the trust layer, and it is where the product actually lives.

---

### C-5 · There is no payments design, and fractured payments is the documented number-one cause of death in this market · `severity: CRITICAL` · `confidence: certain`

**The evidence.** At least five Botswana e-commerce startups closed since 2023; *"founders citing fractured payments as the leading cause of the shutdowns"*. This is the single most-cited cause of failure in the local ecosystem, and Morua Junction's specification contains no payment design at all.

**The rails available.** Orange Money (≈78% of mobile-money subscribers; ~93% of transaction value), MyZaka/Mascom (11%), BTC Smega (7%), Botswana Post Poso (4%); domestic VisaNet card processing; gateways DPO, PayGate, Peach Payments, Paystack, Flutterwave. The government is building a **national payments switch**, and BURS is expanding the VAT base to digital services (registration from 1 June 2026, charging from 1 October 2026). Against this: **cash is getting stronger, not weaker** — cash in circulation grew 110% between 2011 and 2023 to P4.2bn, and 18% of online orders are COD.

**The design that a Gaborone marketplace needs, in priority order:**

1. **Cash on delivery, treated as a first-class product feature, not a fallback.** It is 18% of the market *and* the most common way a first-time Batswana buyer will pay. That means: a codified COD status machine, a named COD-failure ledger (customer absent / refused / address unknown / wrong item / no stock), a "COD fee" calibrated to the failure rate, a cash-collection and reconciliation process for riders, and a **refund-in-cash path** that is as frictionless as the payment. Artify Botswana's co-founder named COD as one of the two things that "hindered the scalability of e-commerce in Botswana".
2. **Orange Money first** (then MyZaka), via a pay-by-bill/checkout/USSD push integration. With ~78% subscriber share, a checkout without Orange Money excludes the majority of mobile-money users and adds a fatal step for the unbanked, uncarded.
3. **Cards** through DPO or PayGate, priced in **BWP with local settlement** — not USD, and not a cross-border settlement.
4. **Escrow and refunds designed before launch.** A held-until-delivery model is the single strongest trust lever available in a market where buyers "complete the transaction offline" when they don't trust the platform.
5. **A gateway abstraction layer.** Given the national payments switch and a 14% VAT regime arriving on digital services, put every PSP behind an interface (`PaymentProvider`) so swapping or adding a rail never touches checkout.
6. **BURS-compliant invoicing designed now.** BURS's e-invoicing system (Electronic Billing System, commencement expected ~1 April 2027) requires VAT-registered sellers to issue e-invoices and transmit sales data, with a **minimum penalty of BWP 10,000/month, a maximum of BWP 100,000 or two years' imprisonment**, premises-closure powers, and 7-year record retention. If Morua is merchant of record for any flow — and a marketplace that collects money often is — then Morua is the invoicing system of record for that flow.

**Recommended gate:** no seller is onboarded, and no order is accepted, until a payment path in each of COD / Orange Money / card has been executed end-to-end in production and reconciled.

---

### C-6 · "A virtual representation of physical shops" is the Artify Botswana failure mode, restated · `severity: CRITICAL` · `confidence: high`

**The evidence.** Artify Botswana closed in early 2024. Its co-founder: *"buyers would visit the site but complete the transaction offline. Because the platform had a commission model, it missed significant revenue due to the offline transactions."* They had done the trust work — *"we implemented secure payment systems and verified seller features on the artist profiles to enhance trust"* — and it did not save them. The failure was structural: **a directory-plus-commission model in a market where the buyer can just as easily continue the conversation on WhatsApp.**

**Why this is Morua's single most likely death.** The README's phrase *"a virtual mall that is a virtual representation of actual physical shops"* describes, functionally, a shop directory with a cart that may or may not be used. The customer is one WhatsApp message away from completing the same purchase with the same shop, with a personal relationship, at the same price, and no platform commission. If any material share of transactions completes offline, the commission model captures nothing while the platform still carries the fixed cost of the approval queue, the delivery marketplace, the dispute handling, and the trust infrastructure.

**This is the central strategic fork, and it must be decided explicitly:**

> **Does Morua Junction own the transaction (and therefore the fulfilment, the returns, the invoice and the payment), or does it refer the transaction (and therefore monetise per lead, not per GMV)?**

**Recommendation — own it, and make ownership structural rather than aspirational.** The specific mechanism that prevents leakage is to make **the physical shop the fulfilment node and Morua the system of record**:

- Every listing shows the shop's real address, real photos, and a verification badge — so "off-platform" means "no availability, no return, no receipt", which the customer can feel.
- Orders route to the shop, the shop prepares from its own shelf, Morua assigns the delivery, and **Morua issues the receipt and owns the returns**.
- The customer can pick up at the shop or at a Morua point — the physical relationship is an asset, not a liability.
- **Enforce it commercially:** a seller who takes payment directly off-platform is breaching the agreement, and the shop's inventory, listings and promotion are contingent on selling through Morua.

If the platform is *not* willing to own fulfilment, returns and the receipt, then it must be a **referral/booking product** monetised per completed job — which is a different, much smaller, much lower-risk business, and should be scoped that way honestly rather than run as a marketplace that captures no GMV.

**Add the countervailing metrics to the dashboard from day one:** % of listed shops with ≥1 sale in 30 days, % of orders where the customer contacted the seller outside the platform, repeat-purchase rate, and **GMV captured as a % of the platform's own tracked demand** (including a "price check" survey of what customers would have paid elsewhere). Artify's failure is invisible until it is terminal; these are the early-warning instruments.

---

### C-7 · The addressable market is a city, not a country — and the delivery scope must match · `severity: CRITICAL` · `confidence: certain`

**The arithmetic.** 142,721 e-commerce users country-wide; 36,619 in Gaborone; 86.9% of e-commerce users urban; ~45%+ of online orders in Gaborone; UNCTAD penetration 5% versus South Africa's 49%. Botswana is small in population but large in area, and economic activity is concentrated in the capital — exactly why Vaisa got stuck.

**Implications, stated plainly:**

- **Morua Junction is a Gaborone business for at least two years.** Not a national platform with a Gaborone pilot. "Piloted in Gaborone" and "open to register Gaborone-based retailers" is right; the risk is that the *delivery* and *admin* scope imply national ambition.
- **Do not build national delivery.** The documented finding is that national last-mile in Botswana requires an owned fleet. That is a capital-intensive logistics company, not a marketplace feature, and it is where Vaisa is stuck today.
- **A Gaborone-density model is the only model that works.** Design for orders-per-rider-hour and orders-per-shop-per-week, and make the launch gate a positive contribution margin per order *in Gaborone*, not an aggregate.
- **Beware the 5× market-size spread.** Published estimates for Botswana's 2024 e-commerce revenue range from $119M to $382M; another source claims $630M and a 25.6% CAGR. These cannot all be right. Anchor planning on the Stats Botswana behavioural data (142,721 users; 36,619 in Gaborone) and treat any market-size-driven projection as unverified. **Do not let a $250M headline drive a funding or hiring plan.**

---

### H-1 · The differentiator is not stated, and the default framing is "a local Takealot" · `severity: HIGH` · `confidence: high`

**The competitive reality for a Batswana buyer in 2026:** the dominant way to buy from South African catalogues is **not** Takealot's international shipping (7–14 days) but the **forwarder/personal-shopper cottage industry** — Lots.co.bw, Stratix Logistix, SwiftPath, ParcelPath — which consolidates SA orders, clears customs, and delivers in 2–5 business days, with a human being and a WhatsApp number. It is trusted, it is fast, and it is operated by people the buyer already knows.

**The trap.** Takealot is a 5/5 competitor on catalogue breadth and a 1/5 on local stock. A naive response is to compete on breadth — which is unwinnable — or to compete on delivery speed, which unwinnable too (Takealot has 4,500+ drivers and 1.6M monthly deliveries; Bolt can outspend you at will). The response that wins is to compete on the **one dimension where you are 5/5 and they are 1/5: stock that is already in Gaborone, sold by a shop whose name and address the customer can walk to.**

**The wedge, stated as a single claim with proof obligations:**

> **"Every product on Morua Junction is already in Gaborone."**
> *Proof: verified shop badge, physical address, current stock count, same-day pickup or delivery, returns to that shop, and a BWP price.*

Add the second claim, which only a local platform can make and which is the market's real currency: **"Pay with Orange Money or cash."** And the third, which exploits the incumbent's structural weakness: **"Return it to the shop you bought it from."**

---

### H-2 · There is no fee model, and the competitor's fee model sets the seller's ceiling · `severity: HIGH` · `confidence: high`

A Gaborone shop owner will compare Morua to Takealot on **total take** and **when they get paid**. Takealot's published stack: **R400/month** (ex-VAT) + **4–18% success fee** on the VAT-inclusive price (by category) + **fulfilment R22–R390** (FBT) + **storage** after 35 days of cover + return handling. Takealot settles weekly. A seller on a R5,000/month category earns roughly R750–R1,500 in commissions, R400 in fixed fees, and R400–R2,000 in fulfilment — a 20–30% take before COGS.

**Morua has published nothing.** Without a fee model you cannot run a seller conversation, a settlement, a ledger, a payout schedule, a refund policy, or a pro-forma. Note also that **Takealot's monthly fee is itself a warning**: a flat monthly fee kills long-tail sellers in a market where a shop may do 20 orders a month.

**Recommendation — publish a one-page fee card, and price below the incumbent's total take:**

| Line | v1 recommendation | Rationale |
|---|---|---|
| Seller commission | **8–12% of the seller's own price**, category-banded | Below Takealot's 4–18% at the midpoint of the band, and no monthly fee |
| Monthly seller fee | **P0 in v1** | Long tail cannot carry it (cf. Rakuten's move from rent to commission) |
| Payment processing | **Passed through at cost** (PSP + ~0.5%) | No margin on the rails; buyers compare the delivered price |
| Delivery | **Published distance bands, at or above cost** | CTM gives collection away; Takealot charges R75 below a R650 threshold — the buyer accepts a fee, they don't accept a hidden one |
| Returns | **Free for the first 30 days, seller-bearable** (shop is the return node) | A physical return node is a competitive advantage over SA sellers |
| Payout | **Weekly, minimum threshold, BWP** | Matches Takealot; sellers need working capital |
| Ads / promoted placement | From v2, **sold, never assumed** | A paid-placement layer is how a marketplace monetises without touching price |

---

### H-3 · Competing head-on with Takealot's logistics arm is suicide; partnering with local delivery is available · `severity: HIGH` · `confidence: high`

Takealot's logistics are a genuine moat: 4,500+ contracted drivers, 1.6M monthly deliveries, the **Mr D** arm, pickup points, same/next-day, an on-demand "Get It Now" pilot, and a **R39/R99 monthly subscription** (TakealotMORE) bundling unlimited free delivery. A subscale Gaborone entrant cannot outspend that.

**But the local market already has at-scale delivery operators, and they are partnership candidates, not just competitors:** Gabs Eats (100% electric, Gaborone-owned fleet, already moving food → groceries → courier, already accepting cash/card/mobile money, already running live tracking) and Zebras (Gaborone, electric scooters, food/grocery/pharmacy/flowers, **a rider app and a business-partner app** — the B2B2C layer you would otherwise build from scratch). inDrive and Bolt have a rider base but are ride-hail, not goods.

**Recommendation:** partner rather than build. Run a managed contract with one operator (Gabs Eats or Zebras) from day one; own the customer-facing ETA, status and POD; treat a rider-side marketplace as a v3 project if the volumes justify it. **Never enter a commission-subsidy war with Bolt** — they are funded and you are not.

---

### H-4 · Trust architecture is absent, and in this market trust *is* the product · `severity: HIGH` · `confidence: high`

**Why this is the opportunity, not just the risk.** Stats Botswana found **Asian sellers now hold 34% of Botswana's digital market and are gaining share**. The market is being flooded with cross-border sellers of unknown quality, unknown returns policy and unknown authenticity. A **verified local retailer** is therefore a genuine and defensible premium — the single most valuable thing Morua can offer that Takealot, Temu, Shein and the forwarder cannot.

**What's missing from the spec:** seller verification (KYB, physical address, shop photo, bank-account-name match), product authenticity, a rated-and-reviewed reputation model with a review-moderation policy, escrow/held payment, a returns policy, a dispute-resolution process with published timelines, and a consumer-protection policy.

**Recommended v1 trust stack:**
- **"Verified Botswana Retail" badge** — a visible, earned, revocable mark: business registration verified, physical shop verified (address + geo + photo), bank account in the shop's own name, and a stated returns address.
- **Escrow by default** on first orders, released on POD (or on customer confirmation), with COD offered as a deliberate, opt-in alternative for buyers who prefer it.
- **Every listing shows the shop's address and phone** — a deliberate transparency choice, and the exact thing a fraudulent cross-border seller cannot match.
- **A dispute path with a clock** — report → rider photo evidence → resolution within a stated window, refund or credit. An SLA is the trust artefact; a policy without a clock is decoration.
- **Reviews on the shop, not just the product** — a Gaborone buyer trusts a shop, not an SKU.

**Data-protection consequence (non-negotiable, see H-5):** delivering this stack means processing IDs, addresses, bank details, payment data and location for buyers, sellers and riders. That makes Morua a data controller of significant importance under the Data Protection Act 18 of 2024.

---

### H-5 · The regulatory picture is arriving in 2026–2027 and the spec does not mention it · `severity: HIGH` · `confidence: high`

| Instrument | Status | What it requires of Morua |
|---|---|---|
| **VAT (Amendment) Act 2025 + BURS remote-services & electronic-marketplace regulations** | Registration of non-remote suppliers from **1 June 2026**; charging and remitting from **1 October 2026** | BURS defines an *online marketplace* broadly — "a digital platform connecting or facilitating electronic transactions and interactions, whether directly or indirectly, between sellers and buyers for the supply of goods and services", including websites, portals, gateways, app stores and digital distribution platforms, and **excluding platforms that solely process payments**. Where the underlying supplier is not VAT-registered and the marketplace **controls payment, delivery or contract terms**, the marketplace may be **liable for 14% VAT on the B2C supply**. This decides: agent model vs principal model, who invoices whom, whether Morua must register (mandatory above P1M turnover; voluntary from P500k), and whether a local VAT representative is needed. **Get a written BURS position before the first transaction.** |
| **E-invoicing (Electronic Billing System)** | Commencement expected **~1 April 2027**; framework live in the 2026 Tax Administration Act | VAT-registered sellers must issue e-invoices from a BURS-approved system and transmit sales data. Penalties: premises closure up to 14 days; minimum **BWP 10,000/month**, maximum **BWP 100,000** or two years' imprisonment; **7-year** record retention. If Morua is merchant of record for any flow, Morua is the invoicing system of record for it. Design the invoice pipeline now; retrofitting it is expensive. |
| **Data Protection Act 18 of 2024** | Assented 24 Oct 2024; in force **14 January 2025** | GDPR-aligned and **extraterritorial** (applies to offering goods/services to people in Botswana). Requires: a lawful basis, a **Record of Processing Activities**, **DPIA for high-risk processing**, **72-hour breach notification** to the Information and Data Protection Commission, data minimisation and privacy-by-default, encryption/pseudonymisation, **registration of "data controllers of significant importance" with MACRA**, a **DPO** where the controller is a public authority, engages in large-scale monitoring, or processes sensitive/criminal data at scale, **cross-border transfer restrictions** (a copy of transferred data must remain in Botswana), and a **72-hour breach clock**. Penalties: administrative fines up to **BWP 50,000,000 or 4% of global annual turnover**, plus criminal liability. **Register as a significant controller, appoint a DPO, complete a DPIA before launch, and never log raw card data.** |
| **Competition / consumer protection / transport licensing** | To be confirmed | Confirm with the **Botswana Competition Authority** whether a platform that aggregates demand *and* sets delivery prices triggers any review; confirm the licensing/permit position for delivery riders and for restricted categories (liquor, tobacco, medicines) before enabling them; confirm consumer-protection obligations around price display, refunds and warranty. |

**Note the interaction:** the price-override power (C-2) directly increases the "controls contract terms" exposure under the deemed-supplier rules. Removing it is not only good business — it is materially better tax posture.

---

### H-6 · The revenue model is undefined, and a delivery marketplace inside it has negative contribution margin at launch · `severity: HIGH` · `confidence: certain`

Nothing in the spec states how Morua Junction makes money. Commission? Subscription? Delivery take? Ads? Payment margin? And critically: **who bears the cost of a failed delivery, a COD return, a damaged parcel, or a seller who does not have the stock?**

**Concretely, at launch, per order (illustrative, Pula):**

| Line | Amount | Note |
|---|---|---|
| Average basket (AOV) | ~P200 | Modest by SA standards; Gaborone basket for local retail |
| Commission at 10% | P20 | Against Takealot's 4–18% band |
| Payment cost (Orange Money / card) | −P4 to −P7 | PSP + network |
| Delivery (contracted rider, 0–5 km band) | −P30 to −P45 | Cash must be netted out of the rider's daily takings |
| Failed delivery / COD failure provision (8%) | −P16 | At a plausible 8% COD failure rate |
| Support & dispute cost (amortised) | −P5 | |
| **Contribution per order** | **≈ P0 to −P25** | **Negative at launch** |

This table is the reason every Botswana peer died: the take rate is too small to cover a locally-priced last mile. **It must be fixed by design, not by hope.** Three levers, in order of preference: (1) **raise the minimum basket / use distance bands** so delivery is viable per order; (2) **shift volume to pickup**, which removes the largest cost line; (3) **raise the commission in high-margin, low-weight categories** where delivery is cheap relative to basket value.

**Recommendation:** publish a one-page unit-economics model (AOV, take rate, delivery cost/order, contribution/order, CAC, repeat rate, monthly fixed cost) and make **positive contribution margin per order in the launch category** a hard launch gate. If a category cannot reach positive contribution in Gaborone, do not launch it.

---

### H-7 · No technology decision is recorded, and the repository signals the wrong one · `severity: HIGH` · `confidence: high`

**Evidence.** The `.gitignore` is the Dart/Flutter template, implying a native Flutter app. The sibling `presscafe/reka-botswana` is an unmodified Netlify **Gatsby** storefront theme — front-end only, no backend, no marketplace logic, no auth, no database, with an in-flight "next steps" list including the tooling for cart, transactions and products. The org also maintains a `strapi` fork and a `VueDN`. The pattern across the org is template-and-tweak.

**Why it matters.** A marketplace is not a storefront. The hard parts are: a **double-entry money ledger** with a split between merchant, platform, delivery partner and PSP; a **multi-party order state machine**; a **dispatch and POD pipeline**; a **refund/COD-return path**; a **role-based permission model**; and an **audit trail** on every money-affecting action. A template gives you none of this and makes it look like you have a product.

**Recommended stack (a 1-page ADR, not a committee):**

| Layer | Recommendation | Rationale |
|---|---|---|
| Shape | **Monolith first** | Two-sided marketplace + dispatch + ledger is a consistency problem, not a scaling problem. Microservices here is a tax paid for vanity |
| Stack | **TypeScript** — NestJS (API) or Next.js (web + API routes); **PostgreSQL** + Prisma; Redis for queues/cache | Matches the org's existing JS competence; Prisma makes the ledger schema explicit; Postgres handles the money invariants (serialisable transactions) properly |
| Buyer surface | **PWA, not a native app** | The 2026 payment mix is 18% COD, 12% mobile money; a Gaborone buyer on a mid-range Android and a slow connection needs a fast, installable, low-data surface. App-store friction and install size are not your problem to solve in v1 |
| Rider surface | **Separate PWA** (or the partner's app) | Different persona, different device, different network conditions |
| Admin | **A tool, not a product** | Minimal surface, high privilege, full audit. Resist building a dashboard because it is satisfying |
| Payments | **Gateway abstraction** (`PaymentProvider`) | National payments switch + 2026 VAT + PSP churn all demand swappability |
| Delivery | **`DeliveryProvider` interface** — bid / contracted / in-house | C-4 requires being able to change dispatch models without a rewrite. Get this right early or you will be locked into whichever model you build first |
| Money | **Server-authoritative pricing and totals** | Never compute a price or fee in the client. An immutable order snapshot records price, commission, delivery fee, VAT and discount at the moment of purchase |
| Ledger | **Double-entry from day one**, reconciled against the PSP daily | This is the artefact an auditor, BURS and a future investor will ask for. Retrofitting a ledger is a rewrite |

**And one process rule:** write the ADR, then stop. The audit's single largest engineering risk is not choosing the wrong stack — it is choosing six stacks.

---

### H-8 · "Own delivery services" + "registered providers bidding" leaves the liability chain undefined · `severity: HIGH` · `confidence: high`

Who is the contracting carrier? Who is the bailee of the goods in transit? Who pays if the parcel is lost, damaged, or delivered to the wrong address? Who carries the insurance? Under what warranty does the buyer claim — the platform, the shop, or the courier? Is the rider an employee of the platform (employment liability) or a contractor (but with platform control that may look like employment)? Which regulator licenses the activity?

**Recommendation:** in v1, a written services agreement with one or two vetted delivery partners, with: a defined SLA (pickup window, transit time, POD), a clear liability matrix (loss/damage/force-majeure/acts-of-theft), insurance evidence required before a provider is enabled, a claims process with a stated clock, and rider ID/licence checks as part of provider approval. **Do not operate an open provider-bidding pool until the v1 liability matrix has survived one real dispute.**

---

### M-1 · Multi-vendor catalogue conflicts, and no SKU standardisation · `severity: MEDIUM` · `confidence: high`

The same product will appear from multiple shops at different prices, with different titles, images and units; search will return near-duplicates; and the buyer cannot compare. Botswana's own national e-commerce strategy explicitly calls for **standardised SKUs** and inventory management as prerequisites, and UNCTAD's Botswana review says the same.

**Recommendation (v1-appropriate, not a catalogue-engineering project):**
- A **manual category tree** (start with two categories) and a **product attribute template per category** (not a universal schema).
- Optional **GTIN/EAN** capture for anything with a barcode, with a "look-alike" warning.
- **Seller-scoped product pages; catalogue-scoped search results** — the buyer sees the offer, the price and the seller together.
- A **"same product, other shops"** comparison row, but only once you have duplicate detection. A naive comparison that is wrong is worse than no comparison.
- **Do not** build a canonical product database in v1. Two categories do not need one.

---

### M-2 · "Specials and discounts" without a promotion engine becomes a manual pricing tax · `severity: MEDIUM` · `confidence: high`

If promos are set by hand, every campaign becomes a pricing task, discounts become unexplained price variance, and the platform-funded discount mechanism that replaces the admin override (C-2) has nothing to sit on.

**Recommendation:** a minimal **promotion entity** with: scope (SKU / category / shop / basket), window, funding source (platform / seller / co-funded), a **margin guardrail** (promo may not push a seller's contribution below zero), a budget, and **funding attribution** so the platform can account for promo spend separately from commission. This is a small object and it is the foundation of both the trust story and the margin model. Build it in v1.

---

### M-3 · Delivery is the trust surface, and the spec has no SLA, tracking, POD or failure handling · `severity: MEDIUM` · `confidence: high`

A shopper's trust in a marketplace is settled almost entirely by the last two kilometres. The spec has none of it.

**Minimum viable delivery product (P0, not P1):**
- **Order state machine** — created → confirmed by shop → picking → picked up → in transit → out for delivery → delivered / failed / returned / cancelled, with every transition timestamped and attributable.
- **ETA** — generated at assignment, and revised honestly. A wrong ETA is worse than a slow one.
- **Live status** for the customer, even if it is coarse ("on the way", "arriving").
- **Proof of delivery** — photo, signature, or OTP. Non-negotiable for escrow release, for COD reconciliation, and for disputes.
- **Failed-delivery taxonomy** — customer absent, address unknown/unreachable, refused, wrong item, out of stock, damaged, wrong address, rider no-show. Each has a defined next action and an owner.
- **Returns to the shop**, with the shop as the return node. This is the thing a forwarder and a cross-border seller cannot do, and it should be a headline feature.
- **A complaint and dispute flow** with a published resolution SLA.

---

### M-4 · No measurement plan, and therefore no kill criteria · `severity: MEDIUM` · `confidence: certain`

A marketplace without a liquidity dashboard dies of ambiguity, not of competition. Nothing in the spec defines a metric, and no threshold exists against which to decide to continue, pivot, or stop.

**Recommended north-star and operating metrics (instrument these from day one, review weekly):**

| Metric | Definition | v1 target | Kill / pivot threshold |
|---|---|---|---|
| GMV | Gross merchandise value, Pula | — | — |
| Orders / day | Paid, non-cancelled | — | < 10/day at week 12 → stop and re-plan |
| Active buyers (30d) | ≥1 paid order | — | — |
| Active shops | ≥1 order in 30 days | ≥60% of onboarded | **< 40% → the catalogue is a vanity catalogue** |
| **Catalogue monetisation** | % of listed SKUs with ≥1 sale in 30 days | ≥30% | **< 20% → mirror Artify's failure mode; pivot to referral monetisation** |
| **On-platform capture rate** | % of tracked demand completed on-platform | ≥80% | **< 60% → leakage; restructure around shop-as-fulfilment-node** |
| Same-day fulfilment | Orders delivered same day | ≥60% | <40% → the local-stock promise is broken |
| On-time delivery | Delivered within promised window | ≥90% | <80% → pause paid acquisition |
| COD failure rate | Failed / returned COD orders ÷ COD orders | ≤8% | >15% → reprice COD or restrict categories |
| Take rate | Platform revenue ÷ GMV | 8–12% | — |
| **Contribution margin / order** | After payment, delivery, promo, support | **> P0** | **< P0 for 3 consecutive weeks → stop adding categories** |
| Repeat rate | Buyers with ≥2 orders in 90 days | ≥30% | <20% at month 6 → the proposition is not working |
| CAC payback | — | < 3 months | — |
| Time to first listing | Signup → live | **< 1 hour** (automated) | > 24h → the approval queue is the bottleneck (C-3) |
| Seller payout reliability | Paid on time, undisputed | 100% | <98% → stop onboarding sellers |

**The three most dangerous metrics on this table are `Catalogue monetisation`, `On-platform capture rate` and `Contribution margin per order`.** Together they detect, in week 6 rather than month 18, the three ways this business dies.

---

### M-5 · The fork's UI direction document is misaligned with a marketplace · `severity: MEDIUM` · `confidence: high`

The fork's `UI-DIRECTION-VISUAL-THINKING-STORYTELLING.md` asks for: editorial composition over dashboard clutter; "Goal → Source → Structure → Evidence → Visualise → Decide → Act → Share"; a shared vocabulary of **Workspace/Canvas, StoryCard, VisualNode, EvidenceChip, SourceBadge, WorkflowStep, InsightPanel, DecisionCard, Dossier/Presentation Renderer**; and outputs such as "briefs, dossiers, plans, presentations, exports".

**This is a knowledge-work aesthetic — right for a research or analysis product, wrong for a shop-and-buy marketplace.** A Gaborone buyer on a mid-range Android, paying partly in cash, does not need a "decision card" or a "dossier renderer"; they need a fast catalogue, a big "Buy" button, a visible verification badge, a clear delivery fee, and a checkout that works on a slow connection.

**Recommendation — split the document's principles from its vocabulary, explicitly:**

| Keep (principles) | Drop (vocabulary) |
|---|---|
| One clear next action per view | Workspace / Canvas / StoryCard / VisualNode |
| Progressive disclosure | Dossier / Presentation Renderer |
| Mobile-first, accessible, performance-bounded | "Visual thinking / storytelling" as a layout mandate |
| Distinguish evidence from inference | InsightPanel as a shopper-facing object |
| Avoid fake metrics and unsubstantiated claims | EvidenceChip / SourceBadge as chrome |
| Visualisation where it aids comprehension | Diagram-first composition on buyer screens |

**Two of its rules are, in fact, directly load-bearing for this product and should be promoted into the product spec:**
1. *"Avoid decorative AI noise, fake metrics, fabricated evidence, or claims of authority that the product cannot substantiate."* → **Never display invented popularity signals** ("1,200 sold this week" unless it is true), never display a trust badge that is not earned and revocable, and never let an AI surface state a price or availability it inferred. A marketplace that fabricates demand destroys the only asset it has.
2. *"The product still feels like its own product."* → Morua's identity is *Gaborone retail*: Setswana language support, local payment rails, physical addresses, WhatsApp as a first-class channel, and warm local imagery. A generic international template would be indistinguishable from the forwarder.

---

### M-6 · Accessibility, performance and offline are named but unowned · `severity: MEDIUM` · `confidence: medium`

The direction doc asks for accessibility, performance, portability and offline-first "where appropriate". For this market, appropriate is unambiguous, because the buyer is on a mobile connection and may be paying cash:

- **Performance budget:** catalogue page ≤ 150 KB, LCP < 2.5s on a 3G-class connection, INP < 200ms, images AVIF/WebP with responsive `srcset`.
- **Offline-tolerant browsing:** the catalogue and the shop's detail page should render from cache; the basket and checkout should not silently fail on a dropped connection (queue-and-retry with an explicit state).
- **Accessibility:** WCAG 2.2 AA for the buyer journey — visible focus, sufficient contrast, real semantic HTML, screen-reader-labelled quantity and price controls, and a non-gesture path for every swipe action. A shop owner who cannot use the seller console is a shop owner who cannot sell.
- **Setwana (Setswana) localisation** is a genuine differentiator against SA-anchored incumbents and is cheap at the string layer if done before it isn't.

---

### M-7 · The real constraint is governance and support capacity, and it is unstated · `severity: MEDIUM` · `confidence: high`

A two-sided marketplace with shop managers, delivery providers, an admin with price power, an approval queue, disputes, refunds and payouts requires a **support function on day one**. The market is too small to fund a large ops team, and the spec adds *more* human-in-the-loop steps than any benchmarked competitor (product approval, shop approval, provider approval, delivery bidding, dispute handling).

**Recommendation:** design for **self-service and automation as the default**, with human-in-the-loop as the exception, and **cap the number of human gates in the critical path at exactly one** (merchant approval). Publish the support SLA, and instrument it — first-response time, resolution time, and the share of tickets that are actually about price, delivery, or money. If the ticket rate per 100 orders exceeds a threshold, the product is not ready to scale.

---

### M-8 · The "virtual mall" metaphor implies a revenue model that will kill the long tail · `severity: MEDIUM` · `confidence: high`

"Virtual mall" and "shop managers" evoke a **landlord/tenant** model: fixed rent per shop. That is the model Rakuten launched with in 1997 (¥50,000/month, ~$413, versus ¥1M for department-store-backed virtual malls) and **abandoned in 2002** for usage-based + commission pricing, because *"revenue could grow only with the number of shops"* and flat fees priced out the long tail. Rakuten is today a ~57,000-merchant marketplace at 2–10% commission.

**Recommendation:** if the "mall" metaphor stays in the brand, it must stay in the *visual and merchandising* layer only. The *commercial* layer must be **success-fee-first**, with a subscription only for genuine premium services (branded storefront, promoted placement, advanced analytics, priority dispatch) — never a base rent that a 20-orders-a-month shop cannot carry. This is the same lesson, learned at great cost by a much larger company.

---

### L-1 · Repository and documentation hygiene · `severity: LOW` · `confidence: certain`

- The entire product definition sits **inside an HTML comment** in the README; the rest is the default GitHub-profile text. The product specification is invisible to anyone who renders the README.
- The repo is named `Morua Junction` in its description but `morua junction` in the body; the upstream organisation `moruajunction/moruajunction` referenced in the README **no longer resolves**.
- No `LICENSE` attribution is a concern for a platform that will hold money and identity (the Apache-2.0 file itself is fine, but there is no third-party/asset attribution policy).
- **Recommendation:** move the spec out of the comment into `docs/product-spec.md`; add `docs/architecture.md`, `docs/fee-card.md`, `docs/adr/`; keep the README as a genuine index; and fix the upstream reference.

### L-2 · The `.gitignore` is a Dart template with no matching project · `severity: LOW` · `confidence: certain`

It ignores `.dart_tool/`, `.packages`, `build/`, `doc/api/`, `.flutter-plugins` — for a repository containing no Dart and no Flutter project. It signals an intent that was never executed, and will confuse contributors and CI. **Fix:** replace it with the `.gitignore` for the stack actually chosen (H-7) in the same commit as the first code.

### L-3 · No project infrastructure: issues disabled, no CI, no templates, no changelog · `severity: LOW` · `confidence: certain`

GitHub issues are **disabled** on `presscafe/moruajunction`; the repository has no CI, no templates, no `CODEOWNERS`, no `CONTRIBUTING`, no changelog, and its one merged PR edited a README. For a project that will handle money, identity and disputes, the process scaffolding is a control, not a nicety. **Fix:** enable issues, add a PR template and a security policy, add CI on the first day of code, and open a public roadmap.

### L-4 · No security posture · `severity: LOW` (will become CRITICAL at launch) · `confidence: certain`

A marketplace holds money, identity documents, addresses and location. It needs: secrets management with rotation, **RBAC with least privilege and separation of duties on money-affecting actions** (maker-checker), **MFA for every admin**, append-only audit logs on price/commission/refund/payout changes, rate limiting and bot defence on registration and login, payout fraud controls (account-name match, velocity limits, cooling-off on first payout), and a PCI-DSS-scoped boundary so raw card data never touches your servers. **Build the audit log before you build the admin features that need it** — you cannot retro-fit it onto a price-override feature that has already been used.

### L-5 · Brand and trademark diligence is not done · `severity: LOW` · `confidence: medium`

"Morua Junction" is a strong, ownable, locally resonant name. Before any public launch: check availability with **BURA** (Botswana Unified Revenue Service) and the **Botswana Competition Authority**; secure the domain and social handles; confirm the name is not in use in a conflicting class; and check that "Morua" is not a registered collective or community mark. This is cheap to do now and expensive to do after a launch event.

### L-6 · The spec contains an unresolved contradiction about who controls price · `severity: LOW` (as a document issue) · `confidence: certain`

*"shop managers who will have control over their inventory including prices specials discounts"* and *"the admin … [can] adjust prices"* are stated in the same paragraph. A reader cannot determine who actually controls price. This contradiction is a symptom of an unresolved commercial model (C-2, H-6) and should be closed by decision, not by editing prose.

---

## 4. Risk register

| # | Risk | Likelihood | Impact | Leading indicator | Mitigation |
|---|---|---|---|---|---|
| R1 | **Payments fragmentation** — rails (Orange Money integration) or PSP economics break the model | **High** | **Critical** | Payment success rate, settlement lag, PSP fee drift, chargeback/refund rate | Multi-rail from day one (COD + Orange Money + card); gateway abstraction; contract early with DPO/PayGate; daily reconciliation |
| R2 | **Last-mile cost exceeds the take rate** — contribution margin per order is negative | **High** | **Critical** | Contribution/order, delivery cost/order, COD failure rate | Publish the fee card *before* launch; distance bands; minimum basket; pickup-first; contract one fleet; no subsidies |
| R3 | **Offline transaction leakage** (Artify Botswana's death) | **High** | **Critical** | On-platform capture rate; % of shops with zero sales; price-check survey | Shop-as-fulfilment-node; verified badge + physical address; platform-issued receipts and returns; enforce seller agreement; measure weekly |
| R4 | **Admin trust breach** — price override or admin compromise extracts value | **Medium** | **Critical** | Price-change audit volume; unusual margin spikes; refund anomalies | Remove the power (C-2); immutable price snapshots; maker-checker; append-only audit; MFA; quarterly access review |
| R5 | **Cold start / liquidity failure** — buyers see an empty catalogue | **High** | **High** | Orders/day, active shops, catalogue monetisation | 15-shop, 2-category pilot; manual concierge onboarding (100% human, then automate); anchor demand before supply; one flagship category, not ten |
| R6 | **VAT reclassification** — BURS treats Morua as a deemed supplier with 14% VAT liability | **Medium** | **High** | BURS correspondence; VAT position status | Written BURS position before the first transaction; agent model by default; keep records ≥7 years; VAT-ready invoice pipeline |
| R7 | **Subsidy war with a funded incumbent** (Bolt/TakealotMORE) on delivery | **Medium** | **Medium** | Partner pricing changes; driver churn | Do not compete on delivery; differentiate on local stock; negotiate, don't match |
| R8 | **Rider/partner supply failure** — partner withdraws or underperforms | **Medium** | **High** | On-time rate; POD failure rate; partner concentration | Two partners, not one; `DeliveryProvider` interface; SLA + penalty/termination rights; overflow bid pool held in reserve |
| R9 | **Fraud** — fake accounts, COD collusion (rider + buyer), refund abuse, stock/"sold but not shipped" | **Medium** | **High** | COD failure rate by rider; refund rate; review-bombing detection; seller fulfilment SLA breaches | COD limit per buyer/rider; velocity and device fingerprinting; escrow by default; ratings with anti-gaming; reconcile inventory |
| R10 | **Approval bottleneck** — catalogue growth capped by ops throughput | **High** | **Medium** | Time to first listing; queue length; approval SLA breach rate | Two-tier risk-based approval (C-3); instant automated path; cap human gates at one |
| R11 | **Founder/team bandwidth** — scope (marketplace + delivery marketplace + admin + payments) far exceeds a small team | **High** | **High** | Unshipped-scope count; context-switch load | Cut the v1 scope (see §6) to one city, two categories, one delivery partner, one payment integration, no auctions, no repricing; write ADRs and stop adding |
| R12 | **Data-protection breach** — a breach of buyer/seller/rider personal data | **Low** | **Critical** | 72-hour notification readiness; DPIA status; RoPA currency; access reviews | Register as a significant controller; DPO; DPIA pre-launch; encryption; no raw card data; breach runbook with a rehearsed 72-hour path |

---

## 5. Strategic recommendation

### 5.1 The positioning that survives contact with the market

**Rejected:** *"Morua Junction is a virtual mall for Gaborone."* — This is Rakuten's and Kilimall's position, they have 12 years and 425 people, and it says nothing a Gaborone shop owner cares about.

**Recommended:**

> **Morua Junction is Gaborone's shops, online.**
> *Everything on it is already in town. Buy from a verified local shop, pay with Orange Money or cash, collect today or get it this afternoon, and return it to the shop if it's wrong.*

This is a claim every competitor in the benchmark set structurally cannot make, and it is directly supported by four facts about this market: 45%+ of orders are in Gaborone; 86.9% of e-commerce users are urban; 78% of mobile money is Orange Money; and 18% of online orders are still COD.

### 5.2 The business that this implies

```
Not: marketplace + own delivery arm + admin price control + approval queue
But:  fulfilment network for a city's physical retail
```

- **Take rate:** 8–12% of the seller's own price. No monthly fee. No repricing. Ever.
- **Revenue stack:** commission → delivery fee (published bands) → payment margin (later) → promoted placement (later) → premium seller tier (later). Nothing that requires touching a price.
- **Delivery:** one contracted partner + pickup points. Platform owns ETA, status, POD, disputes. No auctions in v1.
- **Payments:** COD + Orange Money + card, all in BWP, with escrow-by-default and a BURS-ready invoice pipeline.
- **Trust:** "Verified Botswana Retail" badge, physical addresses, reviews on the shop, dispute SLA, returns to the shop.
- **Admin:** verify, suspend, resolve, flag, and fund promotions. **Exactly one money-affecting button, and it is labelled with who funds the discount.**

### 5.3 Why this beats the field

| You are competing with | Their advantage | Your advantage | Why you win |
|---|---|---|---|
| **Takealot** | Catalogue (22M+ SKUs), scale, logistics | Stock in town, BWP pricing, Orange Money, local returns, same-day | Their weakness is exactly your product: they don't have the item, they don't have the local returns, and their delivery is 7–14 days or a forwarder |
| **Forwarders** | Speed on SA catalogues, personal trust, customs | Local stock, instant availability, local payment, guaranteed returns | They cannot show you a Gaborone shop's shelf. Their model dies the day the item is local |
| **Facebook / WhatsApp** | Zero friction, existing trust, free | Availability guarantee, fulfilment, returns, receipt, delivery, payments, reputation | They are the reason shoppers *want* a platform, not a reason a platform can't exist. Replace the group chat, don't try to beat it |
| **Kilimall / Rakuten** | The same "virtual mall" idea, executed for 12 years with 425 people and warehouses | Local density in one city, local rails, local trust | They are the model to learn from, not to race. Kilimall's revenue is <$6M after 12 years — the model is expensive |
| **CTM / Shoprite (click & collect)** | Local stock, free collection, existing stores | Multi-vendor, third-party sellers, neutral discovery | They only sell their own. You aggregate the whole street |

### 5.4 The wedge, stated as a sequence

1. **Prove the claim on one street.** 15–25 shops, one Gaborone area (e.g. Kgale / Gaborone West / CBD), two categories (household & grocery + one higher-ticket category), one delivery partner, pickup points at 2–3 partner locations.
2. **Own the transaction end to end** — checkout, payment, receipt, delivery, POD, returns, refunds — so there is nothing to do offline.
3. **Win the delivery economics** with pickup-first + distance-banded delivery at or above cost, and publish the numbers internally every week.
4. **Then** add the second area, the third category, the second delivery partner, promoted placement, and the Pro tier.
5. **Only then** consider Francistown, a rider marketplace, native apps, and a cross-border "buy from SA" feature (where a forwarder partnership beats you building it).

---

## 6. Recommended v1 scope, and the 90-day validation plan

### 6.1 In scope for v1

| Area | v1 decision |
|---|---|
| Geography | **Gaborone only**, 5–10 km core, 1 area |
| Sellers | 15–25 verified physical shops, onboarded **manually and concierge-style** (not self-serve) |
| Categories | 2 (e.g. household/grocery + one higher-ticket category) |
| Buyer surface | Mobile **PWA**, Setswana + English, low-data catalogue |
| Payments | COD (first-class) + Orange Money + card via one gateway abstraction; BWP throughout |
| Fulfilment | Pickup at 2–3 points + one contracted delivery partner, distance-banded published prices |
| Trust | Verified badge, physical address, reviews on shops, escrow by default, returns to shop, dispute SLA |
| Admin | Merchant verification, listing flag/suspend, dispute resolution, promotion funding. **No price override, no product pre-approval** |
| Ledger | Double-entry, daily PSP reconciliation, immutable order snapshot, append-only audit log |
| Compliance | DPA 2024 registration + DPO + DPIA + RoPA; written BURS VAT position; BURS-ready invoice pipeline |

### 6.2 Explicitly out of scope for v1 (and why)

| Excluded | Why |
|---|---|
| Delivery bidding / open provider pool | C-4: auction latency, race to the bottom, no SLA. Revisit at v3 |
| Admin price override | C-2: trust, legal, fraud, wrong lever |
| Pre-approval of individual products | C-3: liquidity tax |
| Own delivery fleet | H-3: capital-heavy; partner instead |
| Native mobile apps | H-7: install friction and size are not the bottleneck; PWA is faster to market |
| Multiple cities | C-7: Gaborone density first |
| Liquor, tobacco, medicines, fresh-produce fulfilment | Regulatory perimeter and returns complexity; add later with local rules |
| White-label mall themes / custom storefronts | M-8: the "mall" is a visual metaphor, not a product; save as a paid Pro tier later |
| B2B / bulk purchasing | Different buyer, different economics; distracts from liquidity |
| AI recommendations, chat shopping, "visual thinking" surfaces | M-5: the aesthetic is borrowed from a different product category; AI surface must never state prices or availability it inferred |

### 6.3 The 90-day plan

| Days | Focus | Exit criteria |
|---|---|---|
| **0–15** | Decisions & foundations: write the product spec, the fee card, the unit-economics model, the ADRs (stack, ledger, payment gateway, delivery provider, agent-vs-principal). BURS VAT position requested. DPA registration + DPO + DPIA started. Recruit 5 pilot shops. Select the delivery partner and the PSP. | 5 signed pilot shops; written fee card; BURS acknowledgement received |
| **16–35** | Build the vertical slice: seller console (catalogue + stock + price) → buyer catalogue → cart → checkout (COD + one card path) → order state machine → manual dispatch → POD → ledger → payout. Ship to **one** shop with **one** real order, reconciled to the cent. | First real order completed and reconciled; audit log working |
| **36–60** | 15 shops, 2 categories, pickup points live, Orange Money live, returns path live, dispute flow live, buyer PWA shipped. Concierge onboarding only — no self-serve. Instrument every metric in M-4. | 300 orders; catalogue monetisation and capture rate measured |
| **61–90** | Tune delivery bands and COD fee to positive contribution. Publish the fee card publicly. Run the price-check survey for leakage. Decide the v2 scope against the M-4 thresholds. | **Gate: positive contribution margin per order; ≥60% same-day fulfilment; COD failure ≤8%; ≥60% of shops with a sale in 30 days; ≥80% on-platform capture** |

### 6.4 The decision gate (end of day 90)

**Continue / scale** if all of: positive contribution margin per order · ≥60% same-day fulfilment · COD failure ≤8% · ≥60% active-shop rate · ≥80% on-platform capture · ≥30% repeat rate among early buyers.
**Pivot** if contribution is negative but capture is high → the problem is delivery economics, not demand: switch volume to pickup, re-band prices, renegotiate the fleet.
**Pivot** if capture is low but fulfilment is excellent → the problem is the proposition: the catalogue is a directory; re-test whether a *referral/booking* product (monetised per completed job) is the honest business.
**Stop** if capture is low **and** contribution is negative: that is Artify Botswana's position, and the local precedent says it does not end well.

---

## 7. Scorecard summary for the leadership team

| Area | Current | Target after this audit | Effort |
|---|---|---|---|
| Product definition | Implicit, in an HTML comment | One-page spec + ADRs + fee card | Low |
| Differentiation | "Virtual mall" (non-differentiating) | "Already in Gaborone" (undefeatable locally) | Low |
| Pricing control | Admin overrides (critical defect) | Seller-owned; platform-funded promos only | Low |
| Onboarding | Manual pre-approval of shops + products | Risk-based, <1h to first listing | Medium |
| Payments | Unspecified | COD + Orange Money + card, BWP, escrow, BURS-ready | High |
| Delivery | Own fleet + provider bidding (unworkable) | One contracted partner, banded tariff, pickup-first | Medium |
| Trust | Unspecified | Verified badge, escrow, shop reviews, dispute SLA, DPA 2024 compliance | Medium |
| Tech | Dart `.gitignore`, no code, template prior art | TS monolith + Postgres + ledger + PWA + provider interfaces | High |
| Measurement | None | 15 metrics with thresholds and kill criteria | Low |
| Compliance awareness | None | BURS VAT position, e-invoicing plan, DPA registration + DPO + DPIA | Medium |

---

## 8. Sources

**Primary — repository**
`presscafe/moruajunction` (git tree, log, refs, API) · `faroukpandor/moruajunction` fork · `presscafe/reka-botswana` (Gatsby theme, package.json) · `presscafe/*` org scan · `gh` API for contents, PRs, issues, branches, forks.

**Market & consumer**
- Mmegi Online, *"E-commerce uptake lags in Botswana despite mobile surge"* (Stats Botswana 2024 ICT Survey: 142,721 users / 7.9%; 86.9% urban; 36,619 in Gaborone; Asian sellers at 34%) — https://www.mmegi.bw/business/e-commerce-uptake-lags-in-botswana-despite-mobile-surge/news
- Trade.gov, *"Botswana eCommerce — Digital Economy"* (mobile coverage, BOCRA mobile transaction value) — https://www.trade.gov/country-commercial-guides/botswana-digital-economy
- Statista, *eCommerce — Botswana* — https://www.statista.com/outlook/emo/ecommerce/botswana
- ECDB, *E-Commerce Industry in Botswana 2017-2029* — https://ecdb.com/resources/sample-data/market/bw/all
- Nikulipe, *Botswana* — https://nikulipe.com/countries/botswana/
- PayAtlas, *"Accepting Payments in Botswana"* (mobile-money providers, cash) — https://payatlas.com/countries/botswana-bw
- africa-press, *"Mobile Money Madness! Botswana"* (Orange 78%, MyZaka 11%, Smega 7%, Poso 4%) — https://www.africa-press.net/botswana/all-news/mobile-money-madness
- ACER Working Paper 2024, *Competition and Regulation of Mobile Money Services in Botswana* (Orange ~93% by transaction value) — https://static1.squarespace.com/static/52246331e4b0a46e5f1b8ce5/t/67377ae7735f675234531991/1731689192045/Goitseone+Modungwa+ACER+Paper.pdf
- Mmegi Online, *"Botswana leads SADC mobile money boom"* (Arkwright: 1.1M subscribers; card ownership 30–50%; VisaNet) — https://www.mmegi.bw/business/botswana-leads-sadc-mobile-money-boom/news
- Business Weekly, *"Mobile money to constitute 70% of online transactions by 2025"* (Smega, Orange Money, MyZaka, Poso; subscribers 1,811,036 → 1,685,072, −7%) — https://businessweekly.co.bw/news/mobile-money-to-constitute-70-of-online-transactions-by-2025-research
- Aftership, *eCommerce Statistics in Botswana* (706 stores; WooCommerce 410 / 58.07%) — https://www.aftership.com/ecommerce/statistics/regions/bw
- easyappsecom, *"Selling on Shopify in Botswana"* (payment mix: cards 35%, mobile banking 25%, COD 18%, mobile money 12%, bank transfer 10%; Gaborone 45%+) — https://easyappsecom.com/guides/selling-on-shopify-botswana
- lephutshi, *"Best e-commerce Platforms in Botswana for Small Businesses"* (DPO, Peach Payments, PayGate) — https://lephutshi.com/best-ecommerce-platforms-botswana/
- devs.lephutshi, *"7 Essential E-commerce Trends in Botswana for 2026"* (click & collect, Facebook/TikTok→WhatsApp) — https://devs.lephutshi.com/e-commerce-trends-for-future/
- Afrikan Insights, *"E-Commerce Growth in Botswana: Ready, Not Ready?"* (last mile) — https://www.afrikaninsights.com/why-e-commerce-in-botswana-is-ready-but-not-yet/
- UNCTAD, *National ICT Policy Review and E-commerce Strategy for Botswana* — https://unctad.org/system/files/official-document/dtlstict2021d4_en.pdf

**Competitors**
- Takealot, *"Sell your products online"* (R400/month) — https://www.takealot.com/sell
- tseller.co.za, *Takealot Fees & Profitability Calculator* (success fee 4–18%; fulfilment R22–R390; storage) — https://tseller.co.za/blog/takealot-profitability-calculator/
- codecash.co.za, *Takealot Seller Portal* (fees, categories, FBT tiers) — https://codecash.co.za/takealot-seller-portal/
- Ecosire, *Selling on Takealot: Odoo Integration Guide* (8M MAU, 22M products, 10k sellers, ~$2.5B GMV, AOV R650) — https://ecosire.com/blog/takealot-odoo-integration-south-africa
- Wikipedia, *Takealot.com* (4,500+ drivers, 1.6M monthly deliveries, Mr D, "Get it Now" pilot) — https://en.wikipedia.org/wiki/Takealot.com
- Trustpilot / Reviews.io (Takealot on-time ~48%, delivery complaints) — https://www.trustpilot.com/review/www.takealot.com
- Techpoint / ITWeb, *TakealotMORE* (R39/R99 subscription) — https://www.itweb.co.za/article/takealotmore-debuts-with-unlimited-delivery/5yONPvErRpN7XWrb
- Kilimall (Kenya/UG/NG) — https://www.kilimall.co.ke/ · seller fees: https://urbankenyans.com/how-to-open-a-shop-on-kilimall-kenya/ (5–15% commission) · App Store listing (2,000+ pickup points, 82% next-day, 98% reliability) · Zenfolio/ZoomInfo (revenue <$5–6M, 201–500 staff)
- The Shashi, *Rakuten Group Company History* (13 shops 1997; ¥50,000/mo; usage-based pivot 2002) — https://the-shashi.com/en/tse/4755/
- Japan Today, *"Stop-start: Open and shut case of a global e-biz firm"* (Rakuten virtual mall, per-vendor storefront/shipping/CS, ECC merchant advisors) — https://japantoday.com/category/business/stop-start-open-and-shut-case-of-a-global-e-biz-firm
- Business Model Canvastemplate, *How Does Rakuten Company Work?* (~57,000 merchants, 2–10% commission, ads >¥210bn, ~27% JP share) — https://businessmodelcanvastemplate.com/blogs/how-it-works/rakuten-how-it-works
- Fast Company, *"E-commerce Lessons From The Early Days Of 'Virtual Shopping Malls'"* — https://www.fastcompany.com/3007084
- Gabs Eats — https://www.gabseats.com/ · Zebras — https://liners.com/zebras · nomada.tools Botswana food delivery directory (no Yango/Bolt/Glovo at scale) — https://nomada.tools/directory/food-delivery/botswana
- Techpoint / TechCabal, *Bolt launches in Botswana* (15–20% commission waived 6 months, 100 drivers) — https://techcabal.com/2024/02/28/bolt-botswana-launch/ · inDrive 10% from 2024: https://dailynews.gov.bw/news-detail/82246 · driver earnings: https://techcabal.com/2023/09/13/indrive-in-gaborone/
- CTM Botswana, *Click & Collect* (5 stores, WhatsApp ordering, ~3 hours) — https://www.ctm.co.bw/click-and-collect-botswana
- Lots.co.bw — https://www.lots.co.bw/ · Stratix Logistix — https://www.stratixlogistix.com/ (SA→Gaborone 2–3 days, customs, pickup or door)
- Forwarder economics & Takealot international shipping (7–14 days): https://www.liahealthalliance.com/takealot-ship-to-botswana/

**Local failures**
- TechCabal, *"Logistics and payments hiccups throttling Botswana's e-commerce ambitions"* (5+ closures; Artify Botswana offline transactions; Vaisa fleet economics; BW Reka defunct; BuyBDub defunct; national payments switch) — https://techcabal.com/2024/09/26/botswana-ecommerce/
- Mmegi Online / BOCRA mobile transaction values — https://www.mmegi.bw/business/botswana-leads-sadc-mobile-money-boom/news

**Regulation**
- Sovos, *Botswana Implements VAT on Digital Services* (registration 1 Jun 2026; charging 1 Oct 2026; 14%) — https://sovos.com/regulatory-updates/vat/botswana-implements-vat-on-digital-services/
- ENS, *Africa Tax in Brief* (BURS online-marketplace definition and deemed-supplier rules; exclusion of payment-only platforms; electronic billing system) — https://www.ensafrica.com/news/detail/10764/africa-tax-in-brief
- VAT Update, *"Botswana Issues VAT Rules for Remote Services and Electronic Marketplaces"* (June 2026) — https://www.vatupdate.com/2026/06/30/botswana-issues-vat-rules-for-remote-services-and-electronic-marketplaces/
- 1StopVAT, *Botswana VAT on Digital Services / Marketplace rules* — https://1stopvat.com/botswana-vat-digital-services-non-resident-providers-2026/
- PwC Tax Summaries, *Botswana — Corporate/Other taxes* (14% rate, P1M threshold) — https://taxsummaries.pwc.com/botswana/corporate/other-taxes
- e-invoice.app, *Botswana e-Invoicing Guide* (1 Apr 2027 commencement; BWP10k/month min, BWP100k max, 2-year imprisonment; 7-year retention) — https://e-invoice.app/guides/botswana-e-invoicing
- DLA Piper, *Data protection laws in Botswana* (DPA 2024) — https://www.dlapiperdataprotection.com/index.html?t=law&c=BW
- PACMap, *Botswana DPA 2024* (72-hour breach, DPIA, DPO, MACRA registration, BWP50M / 4% turnover penalties) — https://pacmap.dev/regulation/bw-dpa-2024
- Werksmans / Michalsons (DPA commencement 14 Jan 2025) — https://www.werksmans.com/legal-updates-and-opinions/further-into-africabotswana-enacts-a-new-data-protection-act-does-this-spell-a-new-dawn/

---

*Audit produced 18 October 2026 against `presscafe/moruajunction@6bc30ab`. The repository contains no application code; all findings relating to implementation are recommendations for work not yet begun, and all market, competitor and regulatory findings are sourced as cited.*
