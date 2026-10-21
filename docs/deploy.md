# Deploying Morua Junction for free

Two pieces, two providers, both on free tiers.

| Piece | What it is | Where it goes |
|---|---|---|
| **Storefront** | The Vite + React PWA — a static bundle | Cloudflare Pages *or* Vercel |
| **API** | The Rust binary (axum + SQLite) | Fly.io *or* Render, from the `Dockerfile` |

The API is the only part that needs a server. The storefront is static files
and a service worker, so it costs nothing to host and keeps working when the
shopper's connection does not.

---

## 1. The API (Rust)

### Build the image

```bash
docker build -t morua-junction .
```

The build stage uses the official Rust image (crates.io is reachable there).
The runtime image is `debian:bookworm-slim` with the binary at
`/usr/local/bin/morua` and nothing else. The image is roughly 60 MB.

### Environment

| Variable | Default | Meaning |
|---|---|---|
| `MORUA_DB` | `data/morua.db` | Path to the SQLite file. Put it on a volume. |
| `PORT` | `8787` | The port the service listens on. |
| `RUST_LOG` | — | Not used; the service is quiet by design. |

### Fly.io

```bash
fly launch --no-deploy --copy-config      # uses fly.toml
fly volumes create morua_data --size 1      # one 1 GB volume
fly deploy
fly secrets list
curl https://morua-junction.fly.dev/health
```

`fly.toml` already declares the volume mount at `/data`, the liveness check at
`/health`, `auto_stop_machines = "stop"` so the service sleeps when nobody is
shopping, and the Johannesburg region — the closest to Gaborone.

### Render

```bash
render blueprint launch      # reads render.yaml
```

`render.yaml` provisions a free web service with a 1 GB disk mounted at
`/data`. Render's free services sleep after inactivity and wake on the next
request; the SQLite file on the disk survives the sleep, so the ledger and the
approval history are intact when it wakes.

> **One instance, one disk.** SQLite wants a single writer. Run one replica
> with a persistent volume, or move to Turso/Postgres before you scale.

### Anything else with a free tier

The service only needs a container and a port. A `Dockerfile`, a `PORT` and a
volume will do.

---

## 2. The storefront (static PWA)

### Cloudflare Pages

```bash
npm run build:web        # → dist/public
npx wrangler pages deploy dist/public --project-name morua-junction
```

Or connect the Git repository and set:

* **Build command:** `npm run build:web`
* **Build output directory:** `dist/public`
* **Node version:** 20
* **Environment variable:** `VITE_API_BASE=https://morua-junction.fly.dev`

`public/_redirects` sends every unknown path to `index.html`, so a hard
refresh on `/store/bonwadi-fresh-market` still opens the shop.

### Vercel

```bash
npx vercel --prod
```

`vercel.json` sets the build command, the output directory, the SPA rewrite
and long-lived caching for hashed assets. Set `VITE_API_BASE` in the project's
environment variables.

### Serving the API from the same origin

If you would rather avoid CORS entirely, put the API behind the same host as
the storefront and rewrite `/api/*` to the Rust service. `vercel.json` already
shows the shape of that rewrite, and Cloudflare Pages can do it with a Worker
or a Pages Function.

---

## 3. The service worker

The storefront registers `/sw.js` in production only. It:

* precaches the shell (`/`, `/offline.html`, the manifest, the icons);
* serves `/api/*` GETs stale-while-revalidate, so a shopper in a weak-signal
  village still sees the shop floor they walked into, refreshed as soon as the
  network returns;
* serves `/offline.html` when a navigation has no network and no cache.

Underneath the service worker there is a second layer: `src/lib/offline.ts`
writes every catalogue read to **IndexedDB**, and the API client falls back to
it when the network is gone. A shopper who opens the mall on a train with no
signal still finds the shop, the price and the basket they built. The header
bar says so plainly — *you are offline* or *showing saved prices*.

**Money is never cached.** Only GET reads of public catalogue data are
written to IndexedDB. Order creation, checkout and the admin console are
POSTs and are always live.

To clear the device cache from the app, call `clearCache()` from
`src/lib/offline.ts`.

Bump `VERSION` in `public/sw.js` when you change the shell, or users will keep
the old one.

---

## 4. The dataset

The service embeds `rust/seed/morua.json` — 22 floors, 56 aisles, 72 shops,
381 products, 27 reviews, 3 promotions — and loads it on first run into an
empty database. On an existing database it leaves the data alone, so orders
and approvals survive a redeploy.

To change the catalogue, edit the TypeScript seed and regenerate:

```bash
npm run seed -- --force     # rebuild data/morua.db
npx tsx scripts/dump-seed.ts # → rust/seed/morua.json
```

Then rebuild the image. The Rust service reads the embedded copy; it never
fetches it at runtime.

---

## 5. Getting the binary without a Rust toolchain

The GitHub Actions workflow compiles, tests and publishes the Linux binary on
every push to the working branch. Two ways to get it:

* **GitHub Actions artifact** — `morua-linux` on the run, downloadable from the
  Actions tab.
* **The `ci/diagnostics` branch** — the workflow also commits the binary, the
  build log and `Cargo.lock` there, which is useful on networks that cannot
  reach the artifact store:

  ```bash
  git fetch origin ci/diagnostics
  git show origin/ci/diagnostics:diagnostics/morua-linux > morua && chmod +x morua
  ```

  It is a scratch branch: it is force-pushed on every build and is not part of
  the product.

---

## 6. What CI does for you

Every push to an `arena/**` branch runs two jobs.

**Rust service** — compiles the toolchain, runs the unit tests, builds the
release binary, then boots it against a throwaway database and runs the API
contract check against it: every endpoint the storefront calls, every field
and its type, and an order from the basket through to delivery with the
ledger balancing to zero. The binary, the logs and `Cargo.lock` are then
published to the `ci/diagnostics` branch.

**Storefront** — installs the dependencies, typechecks, builds the bundle,
checks the cache policy, checks that the committed catalogue still matches the
TypeScript toolkit, and checks that every PWA asset made it into the bundle.

A green run on both means the service and the storefront agree.

---

## 7. Checklist before you go live

- [ ] `MORUA_DB` points at a persistent volume, not a container-local path.
- [ ] `/health` returns `{"status":"ok"}` from the public URL.
- [ ] `VITE_API_BASE` is set on the storefront build.
- [ ] The storefront's origin is allowed by the API's CORS (the service echoes
      the request origin and allows the methods the app uses).
- [ ] A test order completes end to end: place it, dispatch it from the admin
      desk, advance it, and check the ledger balances to zero.
- [ ] The admin console shows the three approval-queue shops from the seed, so
      the approval flow is demonstrable immediately.
