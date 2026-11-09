#!/usr/bin/env node
/**
 * Morua Junction — dataset drift check.
 *
 * The catalogue is authored in TypeScript and compiled into
 * `rust/seed/morua.json`, which the Rust service embeds. If the two drift
 * apart, the service ships a catalogue nobody can reproduce, and a change to
 * the toolkit never reaches the binary.
 *
 * This regenerates the dataset from the toolkit and compares it with what
 * is committed. The one field that is allowed to differ is
 * `stock_synced_at`: the seeder stamps it relative to the day it runs, so
 * it is the freshness of the shelf rather than the catalogue itself.
 *
 *   node scripts/dataset-check.mjs
 *
 * Exits 0 when the committed dataset matches the toolkit, 1 when it does not.
 */

import { execFileSync } from 'node:child_process'
import { readFileSync, writeFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')
const DATASET = join(ROOT, 'rust/seed/morua.json')

/**
 * Fields that are stamped relative to the day the dataset is built. They
 * are freshness, not catalogue, so they are allowed to differ — otherwise
 * the check would start failing the day after the dataset was committed.
 */
const VOLATILE = new Set([
  'stock_synced_at',
  'verified_at',
  'opened_on',
  'created_at',
  'starts_at',
  'ends_at',
  'registered_on',
])

function normalise(value) {
  if (Array.isArray(value)) return value.map(normalise)
  if (value && typeof value === 'object') {
    return Object.fromEntries(
      Object.entries(value)
        .filter(([key]) => !VOLATILE.has(key))
        .map(([key, item]) => [key, normalise(item)]),
    )
  }
  return value
}

function summarise(dataset) {
  return {
    floors: dataset.floors?.length ?? 0,
    aisles: dataset.aisles?.length ?? 0,
    stores: dataset.stores?.length ?? 0,
    products: dataset.products?.length ?? 0,
    reviews: dataset.reviews?.length ?? 0,
    towns: new Set((dataset.stores ?? []).map((s) => s.town)).size,
  }
}

console.log('')
console.log('Morua Junction — dataset drift check')
console.log('='.repeat(64))

const committedBytes = readFileSync(DATASET, 'utf8')
const committed = JSON.parse(committedBytes)

let rebuilt
try {
  execFileSync('npm', ['run', '--silent', 'dataset'], { cwd: ROOT, stdio: 'pipe' })
  rebuilt = JSON.parse(readFileSync(DATASET, 'utf8'))
} catch (error) {
  console.log('  FAIL  the toolkit could not regenerate the dataset')
  console.log(String(error.stderr ?? error.message).split('\n').slice(-6).join('\n'))
  process.exit(1)
} finally {
  // The toolkit rewrites the file in place. Put back exactly what was
  // committed, so a check never leaves the working tree dirty.
  writeFileSync(DATASET, committedBytes)
}

const problems = []
if (JSON.stringify(normalise(committed)) !== JSON.stringify(normalise(rebuilt))) {
  // Narrow it down to what actually moved.
  const before = summarise(committed)
  const after = summarise(rebuilt)
  for (const key of Object.keys(before)) {
    if (before[key] !== after[key]) {
      problems.push(`${key}: committed ${before[key]}, toolkit ${after[key]}`)
    }
  }
  if (!problems.length) {
    problems.push('the catalogue differs from what the toolkit produces')
  }
}

/**
 * The catalogue's own rules. These are the things that made the specials
 * look like specials when they were not: a special priced the same as the
 * shelf price is not a special, and a free item with no import price is a
 * service the shop provides itself.
 */
function catalogueRules(dataset) {
  const problems = []
  const products = dataset.products ?? []
  for (const product of products) {
    const name = product.name
    if (product.is_special) {
      const special = Number(product.special_pula ?? 0)
      const shelf = Number(product.price_pula ?? 0)
      if (!(special > 0)) {
        problems.push(`${name} is on special but carries no special price`)
      } else if (!(special < shelf)) {
        problems.push(`${name} is on special at P${special}, not below its shelf price P${shelf}`)
      }
      if (Number(product.was_price_pula ?? 0) !== shelf) {
        problems.push(`${name} does not show the shelf price it was reduced from`)
      }
    } else if (product.special_pula !== null && product.special_pula !== undefined) {
      problems.push(`${name} carries a special price but is not flagged as one`)
    }
    if (Number(product.price_pula ?? 0) === 0 && Number(product.sa_price_zar ?? 0) > 0) {
      problems.push(`${name} is free yet has a South African price to compare against`)
    }
  }
  return problems
}

const counts = summarise(rebuilt)
console.log(
  `  catalogue: ${counts.stores} shops · ${counts.products} products · ${counts.towns} towns · ${counts.aisles} aisles · ${counts.floors} floors`,
)
console.log('='.repeat(64))
const ruleProblems = catalogueRules(rebuilt)
if (problems.length || ruleProblems.length) {
  for (const problem of [...problems, ...ruleProblems]) console.log(`  FAIL  ${problem}`)
  console.log(
    '\n1/1 check failed — run `npm run dataset` and commit the result',
  )
  process.exit(1)
}
console.log('  PASS  the committed dataset is what the toolkit produces')
console.log('  PASS  every special is cheaper than its shelf price, and every free item is a local service')
console.log('\n1/1 check passed')
process.exit(0)
