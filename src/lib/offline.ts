/**
 * Morua Junction — the offline layer.
 *
 * The service worker keeps the shell and the last catalogue reads available
 * without a network. This module adds a second, deeper guarantee: every
 * catalogue read the app makes is written to IndexedDB, so a shopper who
 * opens the mall on a train with no signal still finds the shop they walked
 * into, the price they agreed and the basket they built.
 *
 * Money is never cached. Only GET reads of public catalogue data are.
 */

const DB_NAME = 'morua-junction'
const DB_VERSION = 1
const STORE = 'catalogue'

export interface Cached<T> {
  data: T
  at: number
}

let dbPromise: Promise<IDBDatabase | null> | null = null

function openDb(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise
  dbPromise = new Promise((resolve) => {
    if (typeof indexedDB === 'undefined') {
      resolve(null)
      return
    }
    let request: IDBOpenDBRequest
    try {
      request = indexedDB.open(DB_NAME, DB_VERSION)
    } catch {
      resolve(null)
      return
    }
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(STORE)) {
        db.createObjectStore(STORE, { keyPath: 'key' })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => resolve(null)
    request.onblocked = () => resolve(null)
  })
  return dbPromise
}

export async function readCache<T>(key: string): Promise<Cached<T> | null> {
  const db = await openDb()
  if (!db) return null
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).get(key)
      request.onsuccess = () => {
        const value = request.result as { key: string; data: T; at: number } | undefined
        resolve(value ? { data: value.data, at: value.at } : null)
      }
      request.onerror = () => resolve(null)
    } catch {
      resolve(null)
    }
  })
}

export async function writeCache(key: string, data: unknown): Promise<void> {
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).put({ key, data, at: Date.now() })
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
      tx.onabort = () => resolve()
    } catch {
      resolve()
    }
  })
}

export async function clearCache(): Promise<void> {
  const db = await openDb()
  if (!db) return
  await new Promise<void>((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readwrite')
      tx.objectStore(STORE).clear()
      tx.oncomplete = () => resolve()
      tx.onerror = () => resolve()
    } catch {
      resolve()
    }
  })
}

/** How many catalogue reads are held on this device. */
export async function cacheCount(): Promise<number> {
  const db = await openDb()
  if (!db) return 0
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE, 'readonly')
      const request = tx.objectStore(STORE).count()
      request.onsuccess = () => resolve(request.result ?? 0)
      request.onerror = () => resolve(0)
    } catch {
      resolve(0)
    }
  })
}

/* ------------------------------------------------------------------ *
 * Connection state, shared by the whole app.
 * ------------------------------------------------------------------ */

export type LinkState = 'live' | 'cached' | 'offline'

type Listener = (state: LinkState) => void

let state: LinkState = typeof navigator !== 'undefined' && !navigator.onLine ? 'offline' : 'live'
const listeners = new Set<Listener>()

function emit(next: LinkState) {
  if (next === state) return
  state = next
  listeners.forEach((l) => l(state))
}

export function getLinkState(): LinkState {
  return state
}

export function subscribeLinkState(listener: Listener): () => void {
  listeners.add(listener)
  listener(state)
  return () => listeners.delete(listener)
}

/** Mark the app as serving saved data rather than a live read. */
export function markCached() {
  emit(state === 'offline' ? 'offline' : 'cached')
}

/** Called when a live read succeeds again. */
export function markLive() {
  emit('live')
}

if (typeof window !== 'undefined') {
  window.addEventListener('online', () => emit('live'))
  window.addEventListener('offline', () => emit('offline'))
}
