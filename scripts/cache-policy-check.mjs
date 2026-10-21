#!/usr/bin/env node
/**
 * Morua Junction — cache policy check.
 *
 * The storefront keeps two copies of the same policy: one in the API client
 * (`src/lib/api.ts`, which writes reads to IndexedDB) and one in the service
 * worker (`public/sw.js`, which serves reads from the Cache API). If they
 * drift, a shopper's phone starts keeping the admin console or another
 * person's order — so the two lists have to agree, and neither may name a
 * read that carries money or someone else's details.
 *
 *   node scripts/cache-policy-check.mjs
 *
 * Exits 0 when the policy is sound, 1 when it is not.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

const ROOT = join(dirname(fileURLToPath(import.meta.url)), '..')

/** Reads that must never be kept on the device. */
const FORBIDDEN = [
  '/admin',
  '/seller',
  '/orders',
  '/ledger',
  '/cart',
  '/notifications',
]

/** Reads that are safe to keep: the catalogue and the published price lists. */
const REQUIRED = [
  '/mall',
  '/mall/plan',
  '/stores',
  '/aisles',
  '/aisle/',
  '/products',
  '/areas',
  '/providers',
  '/walk',
]

/** Pull the PUBLIC_READS array literal out of a source file. */
function readList(file, label) {
  const source = readFileSync(join(ROOT, file), 'utf8')
  const match = source.match(/const PUBLIC_READS\s*=\s*\[([\s\S]*?)\]/)
  if (!match) throw new Error(`${label}: no PUBLIC_READS list found in ${file}`)
  const entries = [...match[1].matchAll(/'([^']+)'|"([^"]+)"/g)].map((m) => m[1] ?? m[2])
  return entries
}

const client = readList('src/lib/api.ts', 'api client')
// The service worker matches on the whole URL path, the API client on the
// path after `/api`, so the worker's list is normalised before comparing.
const worker = readList('public/sw.js', 'service worker').map((entry) =>
  entry.startsWith('/api/') ? entry.slice(4) : entry,
)

const problems = []

if (client.join('|') !== worker.join('|')) {
  problems.push(
    `the two cache policies differ\n      api client: ${client.join(', ')}\n      service worker: ${worker.join(', ')}`,
  )
}

for (const path of FORBIDDEN) {
  for (const [label, list] of [
    ['api client', client],
    ['service worker', worker],
  ]) {
    if (list.some((entry) => entry.includes(path))) {
      problems.push(`${label} caches ${path}, which must never be kept on the device`)
    }
  }
}

for (const path of REQUIRED) {
  for (const [label, list] of [
    ['api client', client],
    ['service worker', worker],
  ]) {
    if (!list.some((entry) => entry === path || entry.startsWith(path))) {
      problems.push(`${label} does not cache ${path}, so the mall cannot open offline`)
    }
  }
}

// The service worker must never intercept a write.
const sw = readFileSync(join(ROOT, 'public/sw.js'), 'utf8')
if (!/request\.method !== 'GET'/.test(sw)) {
  problems.push('the service worker does not refuse non-GET requests')
}

console.log('')
console.log('Morua Junction — cache policy check')
console.log('='.repeat(64))
console.log(`  cached reads: ${client.join(', ')}`)
console.log(`  never cached:  ${FORBIDDEN.join(', ')}`)
console.log('='.repeat(64))
if (problems.length) {
  for (const problem of problems) console.log(`  FAIL  ${problem}`)
  console.log(`\n${problems.length} problem(s) found`)
  process.exit(1)
}
console.log('  PASS  the two policies agree, and neither keeps money or other people\'s details')
console.log('\n1/1 check passed')
process.exit(0)
