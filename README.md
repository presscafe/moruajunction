# Morua Junction

**Botswana's virtual mall.** A working alternative to walking into a physical
shop: you enter the mall, look down the aisle, compare the shelf against what
the same item costs elsewhere in the country, and buy from a shop you can name —
delivered by a rider you can name, or collected today.

Every product on Morua Junction is already inside Botswana.

```
Gaborone · Francistown · Lobatse · Kanye · Serowe · Mahalapye · Mochudi
Palapye · Letlhakeng · Tsabong · Ghanzi · Selebi Phikwe · Maun · Kasane
Tsumeb · Nata · Mogoditshane · Tlokweng
```

72 shops · 381 products · 18 towns · every district of the country.

---

## What makes it a mall and not a catalogue

| | |
|---|---|
| **Concourse** | The main hall: the day's specials, the floor directory, the towns. |
| **Mall Map™** | The God's-eye view. Every pavilion is drawn from directly above — the hub at the centre, each shop in its real unit, and your walk from the hub to it. |
| **Aisles** | Groceries, Fresh Produce, Bakery, Hardware, Fashion, Mobile, Tourism, Mining, Farm — 56 aisles across 22 floors. |
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

**The storefront is a Vite + React + TypeScript PWA**, offline-first: the shell
is precached, catalogue reads are served stale-while-revalidate, and money
never touches the cache.

```
src/
  pages/      Concourse, MallMap, Directory, Aisle, Storefront, ProductPage,
              Basket, Checkout, OrderPage, Seller, Admin
  components/ Shell, MallPlan, and the shared building blocks
  lib/        typed API client, formatting
```

**The dataset is authored in TypeScript** (`server/seed.ts`, `server/national.ts`)
and compiled to `rust/seed/morua.json`, which the Rust service embeds. The
seed script is the only place that writes the catalogue; the Rust service
reads it.

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
npm run dev        # Vite on :5173, proxying /api to :8787
npm run typecheck
npm run build      # static bundle in dist/public
```

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
* [x] 18 towns, every district, 72 shops, 381 products
* [x] Admin approves shop managers, sets the markup, chooses the delivery provider
* [x] Land Local™, Price Guard™, Pula Promise™, Keeper's Ledger™, Live Shelf™, Store Card™, One Basket Many Shops™, Escrow & Return-to-Shop™
* [x] Offline-first PWA storefront
* [x] Rust API, free-tier deployment configs

## Licence

Apache-2.0. See [LICENSE](LICENSE).
