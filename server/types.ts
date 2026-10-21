/* ------------------------------------------------------------------ *
 * Shared catalogue types for the Morua Junction national network.
 * ------------------------------------------------------------------ */

export interface NatItem {
  name: string
  blurb: string
  price: number
  zar: number
  kg: number
  icon: string
  stock: number
  unit?: string
  duty?: number
  category: string
}

export interface NatShop {
  slug: string
  name: string
  aisle: string
  tagline: string
  story: string
  accent: string
  accentSoft: string
  icon: string
  banner: string
  area: string
  address: string
  phone: string
  hours: string
  returnPolicy: string
  deliveryPromise: string
  staff: { name: string; role: string }[]
  sections: { title: string; kind: string }[]
  tags: string[]
  accuracy: number
  prepMinutes: number
  rating: number
  reviews: number
  /** Curated hero lines, listed first on the shelf. */
  items: string[]
  /** Depth preset name from catalogue.ts — how many lines per category. */
  mix?: string
  /** Extra categories layered on top of the preset. */
  mixExtra?: Record<string, number>
}

export interface NatBranch {
  town: string
  district: string
  region: string
  factor: number
  hub: {
    slug: string
    name: string
    tagline: string
    story: string
    accent: string
    accentSoft: string
    icon: string
    banner: string
    area: string
    address: string
    phone: string
    hours: string
  }
  aisles: { code: string; name: string; blurb: string }[]
  shops: NatShop[]
}

