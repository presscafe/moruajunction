import express from 'express'
import { existsSync } from 'node:fs'
import { resolve } from 'node:path'
import { api } from './routes.ts'
import { seed } from './seed.ts'

seed()

const app = express()
app.use(express.json({ limit: '1mb' }))
app.use('/api', api)

const PORT = Number(process.env.PORT ?? 8787)
const DIST = resolve(process.cwd(), 'dist', 'public')

if (existsSync(DIST)) {
  app.use(express.static(DIST))
  app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) return next()
    res.sendFile(resolve(DIST, 'index.html'))
  })
}

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Morua Junction API listening on http://0.0.0.0:${PORT}`)
})
