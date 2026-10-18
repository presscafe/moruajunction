# Morua Junction

**Gaborone's shops, online.**

Morua Junction is a marketplace that connects Gaborone's physical retailers with local buyers — everything on the platform is already in town, sold by a verified local shop, paid for with Orange Money or cash, and collectable today or deliverable this afternoon.

> *A virtual mall that is a virtual representation of the city's actual shops.*

---

## Status

**Concept stage.** This repository currently contains documentation only — no application code, no backend, and no deployment. The product definition, the competitive analysis and the recommended v1 scope are being settled before implementation begins, so that the first line of code is written against a decided model rather than a discovered one.

| Document | What it is |
|---|---|
| [`docs/product-spec.md`](docs/product-spec.md) | The product specification: the original concept verbatim, the recommended position, v1 scope, and the open decisions awaiting sign-off. |
| [`docs/audit/competitive-audit.md`](docs/audit/competitive-audit.md) | The deep competitive audit — 29 findings (7 critical, 8 high, 8 medium, 6 low), a scored benchmark against 11 competitors, risk register, unit economics, 90-day validation plan, and sources. |

## Why this exists

Botswana's online market is real but small and cash-heavy: roughly 143,000 individuals bought or sold online in 2024, about 37,000 of them in Gaborone, and 18% of online orders are still settled in cash. Five Botswana e-commerce startups have shut down since 2023, with founders citing fragmented payments and last-mile economics as the leading causes.

The gap is not catalogue breadth — Takealot, Shein, Temu and the cross-border forwarders already have that. The gap is that **none of them can say the item is already in town.** That is the claim Morua Junction is built to make true, and to make profitable.

## Key documents

- **Audit:** [`docs/audit/competitive-audit.md`](docs/audit/competitive-audit.md) — 18 findings across critical, high, medium and low severity, a scored benchmark against Takealot, Kilimall, Rakuten, Jiji, the local delivery platforms and the local failures, plus a risk register and a 90-day plan.
- **Spec:** [`docs/product-spec.md`](docs/product-spec.md)
- **Roadmap:** see the 90-day validation plan in §6 of the audit.

## Scope of v1

Gaborone only · 15–25 verified physical shops · 2 categories · mobile PWA · cash on delivery, Orange Money and card · pickup points plus one contracted delivery partner · verified-retailer trust layer and escrow by default.

Deliberately **not** in v1: delivery bidding, admin price control, product pre-approval, an owned delivery fleet, native apps, multiple cities, and white-label storefronts.

---

## Hi there 👋

This repository is part of a portfolio; the original project note is preserved verbatim in [`docs/product-spec.md`](docs/product-spec.md) §1.

## License

See [LICENSE](LICENSE).
