/**
 * Dumps the seeded database into a portable JSON dataset that the Rust
 * service embeds and loads on first run. Run: npx tsx scripts/dump-seed.ts
 */
import { writeFileSync, mkdirSync } from 'node:fs'
import { db, migrate } from '../server/db.ts'
import { seed } from '../server/seed.ts'

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
