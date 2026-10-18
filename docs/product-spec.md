# Morua Junction — Product Specification

> **Status:** Draft for sign-off. Section 1 preserves the original concept verbatim as the historical baseline. Section 2 records the position recommended by the [competitive audit](audit/competitive-audit.md) and is **not yet ratified**. Section 3 lists the decisions that must be made before implementation begins.

---

## 1. Original concept (verbatim, as written 2026-08-12)

> **moruajunction/moruajunction** is a ✨ _special_ ✨ repository because its `README.md` (this file) appears on your GitHub profile.
>
> morua junction is a virtual mall that is a virtual representation of actual physical shops, malls etc. it will be piloted in gaborone and thus will be open to register gaborone based retailers wholesalers shop[s malls etc. thus the virtual shops within morua junction will have shop managers who will have control over their inventory including prices specials discounts etc.
>
> this platform morua junctio nwill also have its own delivery services which will register delivery services providers
>
> there wil lalso be an admin who will have control over the platform including being able to adjust prices for the products as listed by shop manager. they will be able to icnrease the prices and alo, the admin will also be able to approve shop manager adding shops and products and wil lalso be able to approve delivery serives providers to register and alo which delivery service provide get the jjobs of dleivering that they bid for

*(Reproduced without correction from the original `README.md`, which — because its opening HTML comment was never closed — rendered as a blank page on GitHub. See audit finding L-1.)*

### 1.1 As-specified feature set

| # | Feature (as written) | Audit finding |
|---|---|---|
| F1 | A virtual mall that is a virtual representation of actual physical shops and malls | C-6 — reproduces the Artify Botswana offline-leakage failure mode |
| F2 | Piloted in Gaborone; open to Gaborone-based retailers, wholesalers, shops, malls | C-7 — correct, but the delivery and admin scope must match the city |
| F3 | Virtual shops have shop managers who control their inventory, prices, specials and discounts | H-2 — correct, and the promise the platform must not break |
| F4 | The platform "will also have its own delivery services" which registers delivery service providers | C-4 / H-3 — capital-intensive and the wrong strategic bet |
| F5 | Admin can adjust (increase) prices for products as listed by the shop manager | **C-2 — disqualifying as specified; remove** |
| F6 | Admin approves shop managers adding shops and products | C-3 — liquidity tax; replace with risk-based approval |
| F7 | Admin approves delivery service providers to register | H-8 — keep, but add SLA, liability matrix and insurance evidence |
| F8 | Delivery providers bid for delivery jobs | C-4 — auction latency and race to the bottom; remove from v1 |

---

## 2. Recommended position (post-audit, pending sign-off)

### 2.1 Positioning

> **Morua Junction is Gaborone's shops, online.**
> Everything on it is already in town. Buy from a verified local shop, pay with Orange Money or cash, collect today or get it this afternoon, and return it to the shop if it's wrong.

**The defensible claim:** *every product on Morua Junction is already in Gaborone.* Takealot, Shein, Temu, Amazon and the cross-border forwarders physically cannot make it. A Facebook group cannot make it credibly, because it cannot guarantee availability, fulfilment or returns.

**Not** "a virtual mall." That is Rakuten's and Kilimall's position; they have twelve years, hundreds of people and warehouses, and the phrase means nothing to a Gaborone shop owner.

### 2.2 Roles

| Role | Owns | Does **not** own |
|---|---|---|
| **Shop manager** (merchant) | Their catalogue, stock, prices, specials, discounts, packing, returns, the customer relationship | — |
| **Morua platform** | Discovery, checkout, payment collection, order record, delivery assignment, tracking, proof of delivery, receipt, refunds, trust layer, dispute resolution | **The seller's price** (see 2.4) |
| **Delivery partner** | Vehicle, rider, pickup from shop, delivery, POD, cash collection and reconciliation | Pricing, customer relationship, refunds |
| **Admin** | Merchant verification, listing flag/suspend, dispute resolution, promotion funding, compliance | **Repricing. Any money movement without a signed seller consent or a maker-checker** |

### 2.3 Commercial model

| Line | Position |
|---|---|
| Seller commission | **8–12% of the seller's own price**, category-banded. No monthly fee in v1. |
| Payment processing | Passed through at cost (PSP + ~0.5%) |
| Delivery | Published distance bands, at or above true cost |
| Returns | Free for 30 days, seller-bearable (the shop is the return node) |
| Payouts | Weekly, minimum threshold, BWP |
| Promotions | Platform-funded or seller-funded, via the promotion engine — **never** a silent price edit |
| Ads / promoted placement | v2+, sold, never assumed |
| Premium seller tier (branded storefront, priority dispatch, analytics) | v2+, opt-in, never a base rent |

**Rakuten's lesson (M-8):** a flat monthly fee priced out the long tail in the 1990s and was abandoned in 2002 for usage-based + commission. "Virtual mall" may stay in the brand and the visuals; it must not stay in the pricing.

### 2.4 The price-control decision (C-2)

**Remove F5 entirely.** The platform does not set, adjust, raise or lower a merchant's price.

Replacements:

| Removed power | Replacement mechanism |
|---|---|
| Admin raises a price | Automated **anomaly guardrail** flags prices materially outside category norms → listing suspended for review, seller notified. Price is never rewritten. |
| Admin lowers a price | **Platform-funded promotion** — the platform sets a promo price and funds the discount itself, booked as marketing spend. The seller's own price is untouched. |
| Admin needs margin | Commission + delivery fee + ads + Pro tier |
| Admin needs control | Verify, suspend, flag, resolve disputes |

If a supervisory-price concept is ever required for a regulated category, it needs a published policy, seller notice, appeal path and multi-party sign-off — not a discretionary admin toggle.

### 2.5 Onboarding (C-3)

Replace F6 with two tiers:

- **Tier 1 — automated (instant to 4h):** KYB, physical address + shop photo + geo-verification, bank account in the merchant's own name, banned-category screening, catalogue rules, duplicate detection.
- **Tier 2 — human review (<24h, flagged only):** electronics, liquor, tobacco, health/cosmetics, baby, high value, or anomaly-triggered merchants.
- **Post-hoc:** sampling, automated authenticity/price/duplicate checks, strike ladder (warn → delist → suspend), seller appeal.

**Target: time to first listing < 1 hour.**

### 2.6 Delivery (C-4, H-3)

- **v1: no bidding. No owned fleet.** One contracted partner (Gabs Eats or Zebras are the obvious candidates — both already operate at scale in Gaborone, both already accept mobile money, and Zebras already ships a business-partner app). Second partner contracted as redundancy.
- **Platform owns the customer-facing surface regardless of who moves the box:** ETA, live status, proof of delivery (photo / signature / OTP), failed-delivery taxonomy, returns.
- **Pickup-first** at 2–3 points, with delivery priced in distance bands (e.g. 0–5 km / 5–10 km / 10–20 km) at or above cost.
- **Rider marketplace (algorithmic dispatch, guaranteed payout floor) is a v3 project.** Bid-based assignment may be retained for overflow capacity only.
- **Liability matrix and SLA** agreed in writing before a provider is enabled: contracting carrier, bailee of goods in transit, loss/damage, insurance evidence, claims clock, rider licensing.

### 2.7 Payments (C-5)

Priority order, all in **BWP** with local settlement:

1. **Cash on delivery** — first-class, with a codified status machine, a named failure ledger, and a frictionless cash refund path.
2. **Orange Money** (≈78% of mobile-money subscribers) — pay-by-bill / checkout / USSD push. Then **MyZaka**, **BTC Smega**, **Botswana Post Poso**.
3. **Cards** via DPO or PayGate.
4. **Escrow by default** on first orders, released on POD.
5. **Gateway abstraction** (`PaymentProvider`) so rails can be added or swapped — the national payments switch and 2026 VAT changes make this mandatory.
6. **BURS-ready invoice pipeline** designed before e-invoicing becomes mandatory (~1 April 2027).

### 2.8 Trust (H-4)

- **"Verified Botswana Retail" badge** — earned and revocable: business registration verified, physical shop verified (address + geo + photo), bank account in the shop's own name, returns address published.
- Every listing shows the shop's real address, phone and photos.
- Reviews attach to the **shop**, not just the SKU.
- Dispute path with a published resolution SLA; escrow released against POD.
- Returns accepted at the shop that sold the item.
- **Data Protection Act 18 of 2024:** register as a data controller of significant importance with MACRA, appoint a DPO, complete a DPIA, maintain a RoPA, 72-hour breach notification path, no raw card data, cross-border transfer controls.

### 2.9 Marketplace model (C-6)

**Morua owns the transaction.** The physical shop is the fulfilment node; Morua is the system of record.

Enforced by: platform-issued receipts; platform-managed returns; shop-as-fulfilment-node; verification that a cross-border seller cannot match; and commercial enforcement of the seller agreement (selling off-platform is a breach).

**Guard metrics from week 1:** catalogue monetisation (% of SKUs with ≥1 sale in 30 days), on-platform capture rate, % of active shops with a sale in 30 days, and a periodic price-check survey.

### 2.10 v1 scope

**In:** Gaborone only (one area, 5–10 km) · 15–25 verified physical shops, concierge onboarding · 2 categories · mobile PWA, English + Setswana · COD + Orange Money + card · pickup at 2–3 points + one contracted delivery partner · verified badge + escrow + shop reviews + dispute SLA · double-entry ledger with daily PSP reconciliation · admin console limited to verification, flagging, disputes and promotion funding.

**Out:** delivery bidding · admin repricing · product pre-approval · owned fleet · native apps · multiple cities · liquor/tobacco/medicines · white-label storefronts · B2B/bulk · AI recommendation or chat surfaces that could state a price or availability they inferred.

### 2.11 Technical direction (H-7)

TypeScript monolith (NestJS or Next.js) · PostgreSQL + Prisma · Redis for queue/cache · buyer PWA + separate rider PWA · admin as a tool with full audit · `PaymentProvider` and `DeliveryProvider` interfaces · **server-authoritative pricing with an immutable order snapshot** · double-entry ledger from day one · daily PSP reconciliation.

**Process rule:** write the ADRs, then stop. One stack, one set of decisions.

---

## 3. Open decisions requiring sign-off

| # | Decision | Options | Recommendation | Owner | Needed by |
|---|---|---|---|---|---|
| D1 | Price control | Admin override / seller-only / seller-only + platform-funded promos | **Seller-only + promos** (C-2) | Founder + legal | Before build |
| D2 | Agent vs principal model | Agent (facilitating) / principal (merchant of record) | **Agent**, pending written BURS position (H-5) | Founder + tax adviser | Before first transaction |
| D3 | Delivery model | Bidding pool / contracted partner / owned fleet | **Contracted partner, pickup-first** (C-4) | Founder | Before build |
| D4 | v1 geography and categories | Gaborone-wide / one area; 2 categories / many | **One area, 2 categories** (C-7) | Founder | Before build |
| D5 | Fee card | Commission band, fees, delivery tariff | **8–12%, no monthly fee, banded delivery** (H-2) | Founder + finance | Before seller outreach |
| D6 | Stack | TS monolith / Flutter + native / other | **TS monolith + PWA** (H-7) | Founder | Before build |
| D7 | Open (payment rails) | Orange Money first / card first / COD only | **COD + card, then Orange Money** (C-5) | Founder + PSP | Before build |
| D8 | Pickup partner sites | Malls / office blocks / independent | 2–3, mixed | Ops | Before pilot |
| D9 | Trademark clearance | — | BURA + Competition Authority search (L-5) | Founder | Before public launch |

---

## 4. Related documents

- **[competitive-audit.md](audit/competitive-audit.md)** — the full deep audit: findings register, scored benchmark against 11 competitors, risk register, 90-day plan, unit economics, and sources.
