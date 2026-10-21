import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import Shell from './components/Shell'
import Concourse from './pages/Concourse'
import Directory from './pages/Directory'
import MallMap from './pages/MallMap'
import Aisle from './pages/Aisle'
import Storefront from './pages/Storefront'
import ProductPage from './pages/ProductPage'
import Basket from './pages/Basket'
import Checkout from './pages/Checkout'
import OrderPage from './pages/OrderPage'
import Seller from './pages/Seller'
import Admin from './pages/Admin'
import { api } from './lib/api'
import type { Quote } from './lib/api'

export interface CartLine {
  productId: number
  qty: number
}

interface CartState {
  lines: CartLine[]
  add: (productId: number, qty?: number) => void
  setQty: (productId: number, qty: number) => void
  remove: (productId: number) => void
  clear: () => void
  count: number
  quote: Quote | null
  quoting: boolean
  refreshQuote: (area?: string) => void
  area: string
  setArea: (area: string) => void
  fulfilment: 'delivery' | 'pickup'
  setFulfilment: (f: 'delivery' | 'pickup') => void
}

const CartContext = createContext<CartState | null>(null)

const STORAGE_KEY = 'morua.basket.v1'
const AREA_KEY = 'morua.area.v1'
const FULFILMENT_KEY = 'morua.fulfilment.v1'

export function useCart(): CartState {
  const ctx = useContext(CartContext)
  if (!ctx) throw new Error('useCart must be used inside the cart provider')
  return ctx
}

export default function App() {
  const [lines, setLines] = useState<CartLine[]>(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY)
      return raw ? (JSON.parse(raw) as CartLine[]) : []
    } catch {
      return []
    }
  })
  const [area, setAreaState] = useState<string>(
    () => localStorage.getItem(AREA_KEY) ?? 'Gaborone West',
  )
  const [fulfilment, setFulfilmentState] = useState<'delivery' | 'pickup'>(
    () => (localStorage.getItem(FULFILMENT_KEY) as 'delivery' | 'pickup') ?? 'delivery',
  )
  const [quote, setQuote] = useState<Quote | null>(null)
  const [quoting, setQuoting] = useState(false)
  const location = useLocation()

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(lines))
    } catch {
      /* storage may be unavailable in private mode */
    }
  }, [lines])

  useEffect(() => {
    localStorage.setItem(AREA_KEY, area)
  }, [area])

  useEffect(() => {
    localStorage.setItem(FULFILMENT_KEY, fulfilment)
  }, [fulfilment])

  const add = useCallback((productId: number, qty = 1) => {
    setLines((prev) => {
      const found = prev.find((l) => l.productId === productId)
      if (found) {
        return prev.map((l) => (l.productId === productId ? { ...l, qty: l.qty + qty } : l))
      }
      return [...prev, { productId, qty }]
    })
  }, [])

  const setQty = useCallback((productId: number, qty: number) => {
    setLines((prev) =>
      qty <= 0
        ? prev.filter((l) => l.productId !== productId)
        : prev.map((l) => (l.productId === productId ? { ...l, qty } : l)),
    )
  }, [])

  const remove = useCallback((productId: number) => {
    setLines((prev) => prev.filter((l) => l.productId !== productId))
  }, [])

  const clear = useCallback(() => setLines([]), [])

  const refreshQuote = useCallback(
    (nextArea?: string) => {
      const target = nextArea ?? area
      if (!lines.length) {
        setQuote(null)
        return
      }
      setQuoting(true)
      api
        .post<Quote>('/cart/quote', {
          items: lines.map((l) => ({ product_id: l.productId, qty: l.qty })),
          area: target,
          fulfilment,
        })
        .then(setQuote)
        .catch(() => setQuote(null))
        .finally(() => setQuoting(false))
    },
    [lines, area, fulfilment],
  )

  useEffect(() => {
    refreshQuote()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [lines, fulfilment, area])

  const setArea = useCallback(
    (a: string) => {
      setAreaState(a)
      refreshQuote(a)
    },
    [refreshQuote],
  )

  const count = useMemo(() => lines.reduce((n, l) => n + l.qty, 0), [lines])

  const value = useMemo<CartState>(
    () => ({
      lines,
      add,
      setQty,
      remove,
      clear,
      count,
      quote,
      quoting,
      refreshQuote,
      area,
      setArea,
      fulfilment,
      setFulfilment: setFulfilmentState,
    }),
    [
      lines,
      add,
      setQty,
      remove,
      clear,
      count,
      quote,
      quoting,
      refreshQuote,
      area,
      setArea,
      fulfilment,
    ],
  )

  return (
    <CartContext.Provider value={value}>
      <Shell key={location.pathname}>
        <Routes>
          <Route path="/" element={<Concourse />} />
          <Route path="/map" element={<MallMap />} />
          <Route path="/shop" element={<Directory />} />
          <Route path="/aisle/:code" element={<Aisle />} />
          <Route path="/store/:slug" element={<Storefront />} />
          <Route path="/product/:id" element={<ProductPage />} />
          <Route path="/basket" element={<Basket />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/order/:code" element={<OrderPage />} />
          <Route path="/seller/:slug" element={<Seller />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Concourse />} />
        </Routes>
      </Shell>
    </CartContext.Provider>
  )
}
