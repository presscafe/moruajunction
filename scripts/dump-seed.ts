/**
 * Dumps the seeded database into a portable JSON dataset that the Rust
 * service embeds and loads on first run. Run: npx tsx scripts/dump-seed.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs'

/**
 * The toolkit stores the catalogue in SQLite through `node:sqlite`, which
 * only exists from Node 22.13 without a flag. Say so plainly rather than
 * letting the import fail with a stack trace.
 */
const [major, minor] = process.versions.node.split('.').map(Number)
if (major < 22 || (major === 22 && minor < 13)) {
  console.error(
    `Morua Junction needs Node 22.13 or newer to build the dataset — this is ${process.versions.node}.\n` +
      'The catalogue is stored with node:sqlite, which is what the Rust service reads back.',
  )
  process.exit(1)
}

const { db, migrate } = await import('../server/db.ts')
const { seed } = await import('../server/seed.ts')

migrate()
seed()

const all = (sql: string) => db.prepare(sql).all()

const data = {
  version: 2,
  floors: all('SELECT * FROM floors ORDER BY sort'),
  aisles: all('SELECT * FROM aisles ORDER BY sort'),
  stores: all('SELECT * FROM stores ORDER BY name'),
  products: all('SELECT * FROM products ORDER BY id'),
  reviews: all('SELECT * FROM reviews ORDER BY id'),
  promotions: all('SELECT * FROM promotions ORDER BY id'),
}

mkdirSync('rust/seed', { recursive: true })
writeFileSync('rust/seed/morua.json', JSON.stringify(data, null, 1))
console.log(
  `Wrote rust/seed/morua.json — ${data.stores.length} stores, ${data.products.length} products, ${data.reviews.length} reviews.`,
)
