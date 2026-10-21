# Morua Junction

**Botswana's virtual mall.** A working alternative to walking into a physical
shop: you enter the mall, look down the aisle, compare the shelf against what
the same item costs elsewhere in the country, and buy from a shop you can name —
delivered by a rider you can name, or collected today.

Every product on Morua Junction is already inside Botswana.

**40 towns. 138 shops. 2,919 products. Every district of the country.**

| District | Towns on the Junction |
|---|---|
| Central | Gaborone · Mmabatho · Sowa |
| Kweneng | Gabane · Letlhakeng · Mochudi · Mogoditshane · Moshupa · Oodi · Otse · Ramokgwebana · Silume · Tlokweng |
| North-East | Berea · Francistown · Matsieng · Orapa · Selebi Phikwe · Tutume |
| North-West | Durabans · Gweta · Kasane · Kazungula · Maun · Nata · Shakawe |
| South-East | Good Hope · Kanye · Tswapong |
| Southern | Mahalapye · Palapye · Pitsani |
| South-Central | Serowe · Sipholokwe |
| Kgatleng | Lobatse |
| Ghanzi | Mooka · Tsabong |
| Kgalagadi | Ghanzi · Mababe |
| Zambezi | Tsumeb |

Gaborone is the flagship: five floors, nineteen aisles, sixteen shops and the
central hub. Every other town gets a **pavilion** — its own floor, its own
aisles, its own branch hub and its own delivery zone, on the same platform,
the same ledger and the same promise.

---

## What makes it a mall and not a catalogue

| | |
|---|---|
| **Concourse** | The main hall: the day's specials, the floor directory, the towns. |
| **Mall Map™** | The God's-eye view. Every pavilion is drawn from directly above — the hub at the centre, each shop in its real unit, and your walk from the hub to it. |
| **Aisles** | Groceries, Fresh Produce, Bakery, Hardware, Fashion, Mobile, Tourism, Mining, Farm — 100 aisles across 44 floors, in thirty trading categories. |
| **Storefronts** | Every shop has its own storefront: a themed unit, the story of the business, the people who work there, hours, returns, delivery promise and its reviews. |
| **One Basket, Many Shops™** | Buy from five shops, pay one delivery fee, receive one receipt. |
| **Escrow & Return-to-Shop™** | The money is held until you confirm the goods arrived. If something is wrong it goes back to the shop that sold it, not to a courier depot. |

### The engines we own

* **Land Local™** — tells you what the item would *really* cost if you imported
  it: freight, clearing, import duty and VAT at 14%, at today's rate. If the
  local shelf is cheaper, the app says so; if importing is cheaper, it says
  that too.
* **Price Guard™** — compares your price with the same item at other shops in
  Botswana. It never rewrites a seller's price. It shows the shopper the band
  and warns the admin when a shop sits above it.
* **Pula Promise™** — published delivery pricing. 52 zones from Gaborone
  Central (P25) to Kasane (P380), quoted before you pay, never a surprise at
  checkout. Free over P350 in the metro, P600 on the corridors, P1 200 in the
  far districts.
* **Keeper's Ledger™** — double-entry bookkeeping of every order: what the
  shopper paid, what the shop earns, what the rider is paid, what the platform
  keeps, and what is still in escrow.
* **Live Shelf™** — stock freshness, shown honestly, with a sync button for the
  shop that owns it.
* **Store Card™** — stamps for repeat buyers.

---

## Three powers the admin holds

The Junction is a regulated marketplace, and the admin desk is where that
regulation lives. Every action is written to an audit trail with the person who
made it and the reason they gave.

1. **Approve the shop managers.** No shop trades until an admin has checked the
   application. Pending shops stay visible in the directory, badged *awaiting
   approval*, so nothing quietly disappears — but they cannot take an order.
2. **Set the markup on a shop's prices.** The admin can apply a levy (0–25 %)
   on top of a shop manager's own price. It is applied at quote time, shown to
   the shopper as a mall levy, paid to the shop, clamped, audited, and the
   seller is notified with the reason.
3. **Choose the delivery provider for every order.** No auction, no
   race-to-the-bottom. The admin picks one of the registered providers, names
   the rider, and the shopper sees exactly who is carrying the parcel.

---

## The stack

**The backend is Rust.** Axum + Tokio + SQLite (bundled), one binary, one file
of state.

```
rust/
  Cargo.toml
  src/
    main.rs      bootstrap, routing, liveness probe
    api.rs       every route: mall, plan, stores, products, aisles, quote,
                 orders, seller console, admin console, ledger
    db.rs        row → JSON helpers
    pricing.rs   Land Local, Price Guard, Pula Promise
    ledger.rs    balanced double-entry posting
    schema.rs    DDL and additive migrations
    seed.rs      loads the embedded dataset
    timeutil.rs  ISO timestamps, day offsets
  seed/morua.json   the dataset, embedded in the binary
```

**The storefront is a Vite + React + TypeScript PWA**, offline-first in two
layers: the service worker precaches the shell and serves catalogue reads
stale-while-revalidate, and every read is *also* written to IndexedDB — so a
shopper with no signal still finds the shop they walked into, the price they
agreed and the basket they built. The app tells you when it is serving saved
prices. Money never touches the cache: an order needs a connection.

```
src/
  pages/      Concourse, MallMap, Directory, Aisle, Storefront, ProductPage,
              Basket, Checkout, OrderPage, Seller, Admin
  components/ Shell, MallPlan, and the shared building blocks
  lib/        typed API client, formatting
```

**The dataset is authored in TypeScript** and compiled to
`rust/seed/morua.json`, which the Rust service embeds. The seed script is the
only place that writes the catalogue; the Rust service reads it.

```
server/
  catalogue.ts          420 shelf lines in 30 categories — the shared library
  national.ts           the 17 flagship pavilions, written out in full
  national-branches.ts  the other 23 branches, expanded by the same builder
  seed.ts               the seeder: Gaborone's flagship floor plan + the network
  types.ts              shared catalogue types
```

A shop keeps its curated hero lines and tops its shelf up from a **depth
preset**, rotating the pool by the shop's slug — so two shops in one town do
not carry an identical shelf, while the same line still appears in other
towns. That is what gives Price Guard something honest to compare: the price
of an onion in Tsumeb, in Gabane, in Kasane and in Pitsani, side by side.

---

## Running it

### The API (Rust)

```bash
cd rust
cargo run --release            # listens on 0.0.0.0:8787
MORUA_DB=data/morua.db PORT=8787 ./target/release/morua
./target/release/morua --health   # liveness probe
```

On first run the service creates the database, applies the schema, and loads
the embedded dataset — 22 floors, 56 aisles, 72 shops, 381 products, 5 delivery
providers, 3 shops in the approval queue.

### The storefront

```bash
npm install
npm run dev        # cargo run (API on :8787) + Vite on :5173 proxying /api
npm run typecheck
npm run build      # static bundle in dist/public
```

Rebuilding the dataset after editing the catalogue:

```bash
npm run dataset    # re-seeds and writes rust/seed/morua.json
```

### The checks

Four checks stand between a change and the people who use it. All four run
in CI on every push.

| Check | What it proves |
|---|---|
| `cargo test` | The pricing engines and the seeding hold — including that every product still lands in the shop that sells it. |
| `npm run contract` | The storefront and the API still agree. It calls every endpoint the storefront calls, checks each field and its type, and runs an order from the basket to delivery, and drives the seller console. **97 checks.** |
| `npm run check:cache` | The two cache policies — the API client's and the service worker's — agree, and neither keeps the admin console, the seller console, orders or the ledger on the device. |
| `npm run check:dataset` | The committed catalogue is what the TypeScript toolkit produces, so the binary and the toolkit cannot drift apart. |

Run them all locally:

```bash
npm run check              # typecheck, cache policy, dataset drift
npm run contract:local     # against a service running on :8787
```

The contract check approves a shop and sets a markup on it, so point it at a
service you are happy to change — CI runs it against a throwaway database.

Point the storefront at a hosted API with `VITE_API_BASE`:

```bash
VITE_API_BASE=https://morua-api.fly.dev npm run build:web
```

### Building the Rust binary where crates.io is reachable

The GitHub Actions workflow (`/.github/workflows/build.yml`) compiles, tests
and publishes the Linux binary on every push to this branch. It is also the
only place the Rust toolchain is available if your machine cannot reach
crates.io.

---

## Deploying for free

| Piece | Where | Config |
|---|---|---|
| Storefront | [Cloudflare Pages](https://pages.cloudflare.com) or [Vercel](https://vercel.com) | `wrangler.toml`, `vercel.json` — both build `npm run build:web` and serve `dist/public` with an SPA fallback |
| API | [Fly.io](https://fly.io) or [Render](https://render.com) | `fly.toml`, `render.yaml`, `Dockerfile` — the binary in a slim image, SQLite on a mounted volume |

The full walkthrough, including the environment variables and the SQLite volume
mounting, is in [`docs/deploy.md`](docs/deploy.md).

---

## Why this works in Botswana

* **Cash and Orange Money first.** 78–93 % of mobile-money value in Botswana
  runs through Orange; card penetration is around 8 %. Checkout is
  cash-on-delivery, Orange Money or card-on-delivery, and the price is quoted
  up front in Pula.
* **The last mile is the constraint,** so the delivery price is published, the
  window is published, and the rider is named.
* **Local stock beats imports** on most of the catalogue, and Land Local proves
  it item by item instead of asking the shopper to take it on trust.
* **Data Protection Act 18 of 2024** is in force: breach notification within 72
  hours, a DPIA for anything that scales, and no cross-border transfer of
  shopper data by default.

The research behind these decisions — the competitive audit, the fee stacks,
the failure modes of the 2023–2025 local closures — is in
[`docs/audit/competitive-audit.md`](docs/audit/competitive-audit.md), and the
product decisions are in [`docs/product-spec.md`](docs/product-spec.md).

---

## Status

* [x] Virtual mall: floors, aisles, units, themed storefronts, God's-eye plan
* [x] 40 towns, every district, 138 shops, 2,919 products, 100 aisles, 44 floors
* [x] Admin approves shop managers, sets the markup, chooses the delivery provider
* [x] Land Local™, Price Guard™, Pula Promise™, Keeper's Ledger™, Live Shelf™, Store Card™, One Basket Many Shops™, Escrow & Return-to-Shop™
* [x] Offline-first PWA: service worker plus an IndexedDB catalogue layer
* [x] Rust API, free-tier deployment configs

## Licence

Apache-2.0. See [LICENSE](LICENSE).
