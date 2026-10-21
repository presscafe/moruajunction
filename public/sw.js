/*
 * Morua Junction — offline-first service worker.
 *
 * The shell is precached so the mall opens with no network at all. Catalogue
 * reads are cached stale-while-revalidate: a shopper in a weak-signal
 * village still sees the shop floor they walked into, refreshed the moment
 * the network comes back. Orders are never cached — money must not be.
 */

const VERSION = 'morua-v3'
const SHELL = `${VERSION}-shell`
const DATA = `${VERSION}-data`

const SHELL_FILES = [
  '/',
  '/offline.html',
  '/manifest.webmanifest',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(SHELL)
      .then((cache) => cache.addAll(SHELL_FILES).catch(() => undefined))
      .then(() => self.skipWaiting()),
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) =>
        Promise.all(keys.filter((k) => !k.startsWith(VERSION)).map((k) => caches.delete(k))),
      )
      .then(() => self.clients.claim()),
  )
})

/**
 * The reads that are safe to keep on the device: the catalogue, the plan
 * and the published price lists. The admin console, the seller console,
 * orders and the ledger are never cached — they carry money, other people's
 * details and a shop's commercial position, and a shared phone must not
 * keep them.
 */
const PUBLIC_READS = [
  '/api/mall',
  '/api/mall/plan',
  '/api/stores',
  '/api/aisles',
  '/api/aisle/',
  '/api/products',
  '/api/areas',
  '/api/providers',
  '/api/walk',
]

function isPublicRead(pathname) {
  return PUBLIC_READS.some(
    (prefix) => pathname === prefix || pathname.startsWith(`${prefix}/`) || pathname.startsWith(`${prefix}?`),
  )
}

/** GET requests to the API are safe to serve from cache while offline. */
function isCacheable(url) {
  if (url.pathname.startsWith('/api/')) {
    return url.method === 'GET' && isPublicRead(url.pathname)
  }
  return url.pathname.startsWith('/assets/') || SHELL_FILES.includes(url.pathname)
}

self.addEventListener('fetch', (event) => {
  const { request } = event
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.origin !== self.location.origin) return

  if (url.pathname.startsWith('/api/')) {
    // Stale-while-revalidate for catalogue reads. Anything that is not a
    // public catalogue read goes straight to the network: never from cache.
    if (!isPublicRead(url.pathname)) return
    event.respondWith(
      caches.open(DATA).then(async (cache) => {
        const cached = await cache.match(request)
        const network = fetch(request)
          .then((response) => {
            if (response && response.ok) cache.put(request, response.clone())
            return response
          })
          .catch(() => cached)
        return cached || network
      }),
    )
    return
  }

  if (!isCacheable(url)) return

  event.respondWith(
    caches.match(request).then((cached) => {
      const network = fetch(request)
        .then((response) => {
          if (response && response.ok) {
            const copy = response.clone()
            caches.open(SHELL).then((cache) => cache.put(request, copy))
          }
          return response
        })
        .catch(() => cached || caches.match('/offline.html'))
      return cached || network
    }),
  )
})

self.addEventListener('message', (event) => {
  if (event.data === 'skip-waiting') self.skipWaiting()
})
