import { seed } from './seed.ts'

const force = process.argv.includes('--force')
const result = seed(force)
console.log(
  `Morua Junction seeded: ${result.stores} stores, ${result.products} products${force ? ' (rebuilt)' : ''}.`,
)
