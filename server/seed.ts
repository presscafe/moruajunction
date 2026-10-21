import { db, ensureColumns, isSeeded, migrate } from './db.ts'
import { dutyForCategory, round2 } from './pricing.ts'

/* ------------------------------------------------------------------ *
 * Morua Junction seed — a virtual mall of Gaborone shops.
 * ------------------------------------------------------------------ */

const FLOORS = [
  { code: 'ground', name: 'Ground Floor', tagline: 'Daily needs, fresh today', sort: 0 },
  { code: 'l1', name: 'Level 1', tagline: 'Home, health and the household', sort: 1 },
  { code: 'l2', name: 'Level 2', tagline: 'Fashion, footwear and adornment', sort: 2 },
  { code: 'l3', name: 'Level 3', tagline: 'Technology and electronics', sort: 3 },
  { code: 'courtyard', name: 'The Courtyard', tagline: 'Pickup, delivery and services', sort: 4 },
]

const AISLES: Record<
  string,
  { code: string; name: string; blurb: string; floor: string; sort: number }[]
> = {
  ground: [
    { code: 'A1', name: 'Groceries & Staples', blurb: 'Maize, rice, oil, tinned and dry goods', floor: 'ground', sort: 1 },
    { code: 'A2', name: 'Fresh Produce', blurb: 'Fruit, vegetables, butchery and dairy', floor: 'ground', sort: 2 },
    { code: 'A3', name: 'Bakery & Deli', blurb: 'Bread, cakes, pies and cold cuts', floor: 'ground', sort: 3 },
    { code: 'A4', name: 'Beverages & Cellar', blurb: 'Soft drinks, water, wine and beer', floor: 'ground', sort: 4 },
  ],
  l1: [
    { code: 'B1', name: 'Home & Kitchen', blurb: 'Cookware, small appliances, glassware', floor: 'l1', sort: 1 },
    { code: 'B2', name: 'Household & Cleaning', blurb: 'Cleaning, tissue, storage and laundry', floor: 'l1', sort: 2 },
    { code: 'B3', name: 'Health & Beauty', blurb: 'Skincare, hair, pharmacy and personal care', floor: 'l1', sort: 3 },
    { code: 'B4', name: 'Hardware & DIY', blurb: 'Tools, paint, plumbing and garden', floor: 'l1', sort: 4 },
  ],
  l2: [
    { code: 'C1', name: 'Fashion', blurb: 'Everyday, occasion and workwear', floor: 'l2', sort: 1 },
    { code: 'C2', name: 'Footwear', blurb: 'Shoes, boots and sandals for every foot', floor: 'l2', sort: 2 },
    { code: 'C3', name: 'Bags & Accessories', blurb: 'Bags, belts, hats and wallets', floor: 'l2', sort: 3 },
    { code: 'C4', name: 'Jewellery & Gifts', blurb: 'Gold, beads, gifts and cards', floor: 'l2', sort: 4 },
  ],
  l3: [
    { code: 'D1', name: 'Mobile & Tablets', blurb: 'Handsets, data and prepaid bundles', floor: 'l3', sort: 1 },
    { code: 'D2', name: 'Audio & TV', blurb: 'Sound, screens and home cinema', floor: 'l3', sort: 2 },
    { code: 'D3', name: 'Computing & Gaming', blurb: 'Laptops, components and consoles', floor: 'l3', sort: 3 },
    { code: 'D4', name: 'Accessories', blurb: 'Chargers, cases, cables and spares', floor: 'l3', sort: 4 },
  ],
  courtyard: [
    { code: 'E1', name: 'Click & Collect Points', blurb: 'Collect today, no delivery fee', floor: 'courtyard', sort: 1 },
    { code: 'E2', name: 'Delivery Hub', blurb: 'Riders, routes and the dispatch desk', floor: 'courtyard', sort: 2 },
    { code: 'E3', name: 'Services', blurb: 'Tailoring, repairs, hair and beauty bookings', floor: 'courtyard', sort: 3 },
  ],
}

interface SeedProduct {
  name: string
  blurb: string
  price: number
  saZar: number
  kg: number
  icon: string
  key?: string
  stock?: number
  was?: number
  special?: number
  tags?: string[]
  unit?: string
}

interface SeedStore {
  slug: string
  name: string
  aisle: string
  kind?: string
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
  cardTarget?: number
  openedOn: string
  products: SeedProduct[]
}

const STORES: SeedStore[] = [
  {
    slug: 'bonwadi-fresh-market',
    name: 'Bonwadi Fresh Market',
    aisle: 'A2',
    tagline: 'Picked in the morning, on the shelf by seven',
    story:
      'Bonwadi has served Kgale since 1998. The produce arrives from the Jamestown farms before dawn and the butchery counter opens the same morning. Naledi runs the floor and will always tell you which veg is going off tonight for half price.',
    accent: '#2f7a4f',
    accentSoft: '#e3f2e8',
    icon: '🥬',
    banner: '🥬🍅🥑',
    area: 'Kgale',
    address: 'Plot 2414, Kgale Main Road, Gaborone',
    phone: '+267 71 442 118',
    hours: 'Mon–Sat 07:00–19:00 · Sun 08:00–13:00',
    returnPolicy: 'Unopened fresh produce refunded or replaced within 24 hours, no questions.',
    deliveryPromise: 'Delivered within 90 minutes across Kgale and Gaborone West.',
    staff: [
      { name: 'Naledi M.', role: 'Shop Manager' },
      { name: 'Thato K.', role: 'Produce Buyer' },
      { name: 'Basiame', role: 'Butchery' },
    ],
    sections: [
      { title: 'Today on the counter', kind: 'special' },
      { title: 'Naledi recommends', kind: 'staff' },
      { title: 'Pantry staples', kind: 'staples' },
    ],
    tags: ['fresh', 'butchery', 'daily-delivery', 'halal'],
    accuracy: 98,
    prepMinutes: 40,
    rating: 4.8,
    reviews: 312,
    openedOn: '1998-04-12',
    products: [
      { name: 'Tomatoes, 1kg', blurb: 'Vine-ripened, picked yesterday', price: 22, saZar: 28, kg: 1, icon: '🍅', stock: 40 },
      { name: 'Onions, 2kg', blurb: 'Store your onions somewhere dry and dark', price: 18, saZar: 24, kg: 2, icon: '🧅', stock: 35 },
      { name: 'Potatoes, 5kg', blurb: 'Agra or Monte Cristo, your choice', price: 65, saZar: 85, kg: 5, icon: '🥔', stock: 22 },
      { name: 'Butternut Pumpkin', blurb: 'Sweet, heavy for its size', price: 16, saZar: 22, kg: 1.4, icon: '🎃', stock: 18 },
      { name: 'Spinach, 200g', blurb: 'Washed and ready to cook', price: 14, saZar: 19, kg: 0.2, icon: '🥬', stock: 26 },
      { name: 'Full Cream Milk 1L', blurb: 'Dairy Junction pasteurised', price: 15, saZar: 19, kg: 1, icon: '🥛', stock: 48 },
      { name: 'Free Range Eggs, Dozen', blurb: 'From the Tlokweng layer farm', price: 58, saZar: 79, kg: 0.7, icon: '🥚', stock: 20 },
      { name: 'Chicken Pieces 2kg', blurb: 'Frozen, ready to braise', price: 96, saZar: 135, kg: 2, icon: '🍗', stock: 12 },
      { name: 'Beef Stew Chunks 1kg', blurb: 'Lean Botswana beef, cubed', price: 165, saZar: 245, kg: 1, icon: '🥩', stock: 8 },
      { name: 'Avocado Each', blurb: 'Ripe and ready today', price: 12, saZar: 18, kg: 0.2, icon: '🥑', stock: 30, special: 9 },
      { name: 'Cabbage 1kg', blurb: 'Good for oxtail or bogobe', price: 11, saZar: 15, kg: 1, icon: '🥬', stock: 24 },
      { name: 'Sour Cream 500ml', blurb: 'Good for pap and chakalaka', price: 28, saZar: 36, kg: 0.5, icon: '🥣', stock: 15 },
    ],
  },
  {
    slug: 'gaborone-sun-mart',
    name: 'Gaborone Sun Mart',
    aisle: 'A1',
    tagline: 'Every staple, every week, at a fair price',
    story:
      'A family-run supermarket on the Gaborone West side of the mall. Mole and kgotlwana shoppers have bought their maize meal and cooking oil here for two decades. The store keeps deep stock on the staples so nobody is told "come back tomorrow".',
    accent: '#c2571b',
    accentSoft: '#fbeade',
    icon: '🛒',
    banner: '🛒🌽🥫',
    area: 'Gaborone West',
    address: 'Stand 118, Gaborone West Commercial Centre',
    phone: '+267 72 905 640',
    hours: 'Mon–Sat 07:30–20:00 · Sun 08:00–14:00',
    returnPolicy: 'Unopened pantry goods returned within 7 days with receipt.',
    deliveryPromise: 'Same-day delivery in Gaborone West, Kgale and Extension 10.',
    staff: [
      { name: 'Mpho S.', role: 'Shop Manager' },
      { name: 'Rudo N.', role: 'Stock Controller' },
      { name: 'Kabelo', role: 'Checkout' },
    ],
    sections: [
      { title: 'Pantry staples', kind: 'staples' },
      { title: 'This week’s specials', kind: 'special' },
      { title: 'Tinned and dry goods', kind: 'tins' },
    ],
    tags: ['staples', 'family', 'weekly-deals', 'delivery'],
    accuracy: 97,
    prepMinutes: 60,
    rating: 4.6,
    reviews: 541,
    openedOn: '2003-09-02',
    products: [
      { name: 'Sunflower Cooking Oil 2L', blurb: 'Pressed blend for frying and everyday cooking', price: 89, saZar: 118, kg: 2, icon: '🫗', stock: 40, key: 'cooking-oil-2l' },
      { name: 'Maize Meal 10kg', blurb: 'Fine grind, the everyday 50kg bag halved', price: 128, saZar: 165, kg: 10, icon: '🌽', stock: 30, key: 'maize-meal-10kg' },
      { name: 'Long Grain Rice 5kg', blurb: 'Grade A, doesn’t break up when you cook it', price: 142, saZar: 189, kg: 5, icon: '🍚', stock: 26, key: 'rice-5kg' },
      { name: 'Brown Sugar 1kg', blurb: 'Dark, moist, for the proper seswaa', price: 42, saZar: 55, kg: 1, icon: '🧂', stock: 34 },
      { name: 'Table Salt 1kg', blurb: 'Fine grains, iodised', price: 12, saZar: 16, kg: 1, icon: '🧂', stock: 55 },
      { name: 'Tomato Sauce 2L', blurb: 'The bottle every kitchen in Gaborone owns', price: 46, saZar: 62, kg: 2, icon: '🥫', stock: 44, key: 'tomato-sauce-2l' },
      { name: 'Baked Beans 410g', blurb: 'Tinned in the UK, 6-pack', price: 52, saZar: 68, kg: 2.5, icon: '🫘', stock: 28 },
      { name: 'Chakalaka 400g', blurb: 'With fresh tomato and onion', price: 26, saZar: 34, kg: 0.4, icon: '🥫', stock: 32 },
      { name: 'Spaghetti 1kg', blurb: 'Bronze cut, holds its shape', price: 28, saZar: 37, kg: 1, icon: '🍝', stock: 38 },
      { name: 'Washing Powder 2kg', blurb: 'Low-scent, hand-wash safe', price: 96, saZar: 132, kg: 2, icon: '🧴', stock: 16 },
      { name: 'Peanut Butter 1kg', blurb: 'Roasted, no palm oil', price: 78, saZar: 98, kg: 1, icon: '🥜', stock: 14 },
      { name: 'Sardines in Tomato 400g', blurb: 'Canned in Durban, 4-pack', price: 62, saZar: 80, kg: 1.6, icon: '🐟', stock: 20 },
    ],
  },
  {
    slug: 'krugers-bakery-deli',
    name: "Kruger's Bakery & Deli",
    aisle: 'A3',
    tagline: 'Out of the oven at five, on the counter at seven',
    story:
      'Pieter and Boitumelo Kruger have baked in Block B since 2011. The koeksisters go out first, then the loaves, then the pies. Everything is made in the back room you can see through the glass.',
    accent: '#a35a1f',
    accentSoft: '#f7ebdc',
    icon: '🥐',
    banner: '🥐🥖🥧',
    area: 'Block B',
    address: 'Unit 7, Block B Shopping Centre, Gaborone',
    phone: '+267 71 300 774',
    hours: 'Mon–Sat 06:30–17:00 · Sun 07:00–12:00',
    returnPolicy: 'Baked goods cannot be returned, but we will always replace anything that arrives broken.',
    deliveryPromise: 'Morning delivery — order before 10:00 for same-day loaves.',
    staff: [
      { name: 'Pieter Kruger', role: 'Owner & Baker' },
      { name: 'Boitumelo K.', role: 'Counter' },
    ],
    sections: [
      { title: 'Baked this morning', kind: 'special' },
      { title: 'From the deli', kind: 'deli' },
    ],
    tags: ['bakery', 'fresh-daily', 'breakfast'],
    accuracy: 99,
    prepMinutes: 35,
    rating: 4.9,
    reviews: 208,
    openedOn: '2011-02-18',
    products: [
      { name: 'White Loaf', blurb: 'Baked at five in the morning, soft by seven', price: 26, saZar: 34, kg: 0.8, icon: '🍞', stock: 30, key: 'white-loaf' },
      { name: 'Brown Wholemeal Loaf', blurb: 'Stone-ground, no sugar', price: 28, saZar: 37, kg: 0.8, icon: '🍞', stock: 22 },
      { name: 'Chicken Pie', blurb: 'Free-range chicken, pepper stew', price: 32, saZar: 42, kg: 0.25, icon: '🥧', stock: 24, special: 27 },
      { name: 'Beef Curry Pie', blurb: 'The one that sells out first', price: 35, saZar: 46, kg: 0.25, icon: '🥧', stock: 12 },
      { name: 'Koeksister, Cinnamon', blurb: 'Caramelised and rolled by hand', price: 8, saZar: 11, kg: 0.15, icon: '🍥', stock: 60 },
      { name: 'Cape Malay Koeksister', blurb: 'Coconut, deeper spice', price: 9, saZar: 12, kg: 0.15, icon: '🍥', stock: 45 },
      { name: 'Dalmation Cake Slice', blurb: 'With cream and a layer of jam', price: 30, saZar: 39, kg: 0.2, icon: '🍰', stock: 10 },
      { name: 'Boiled Eggs (6)', blurb: 'Boiled in the pot this morning', price: 21, saZar: 27, kg: 0.35, icon: '🥚', stock: 20 },
      { name: 'Chicken Cold Cuts 500g', blurb: 'Thin-sliced, ready for the bread', price: 48, saZar: 65, kg: 0.5, icon: '🥓', stock: 14 },
    ],
  },
  {
    slug: 'setswana-cellar-pantry',
    name: 'Setswana Cellar & Pantry',
    aisle: 'A4',
    tagline: 'Local labels, cold fridges, and no import markup',
    story:
      'A drinks specialist in Gaborone Central with a deep cellar of Mosi-oa-Tunya, Thlou and Castle. Because the beer is bottled in Gaborone, it costs a fraction of what the same bottle costs in Sandton — and it is already cold.',
    accent: '#6b3fa0',
    accentSoft: '#efe7f7',
    icon: '🍾',
    banner: '🍾🧊🍺',
    area: 'Gaborone Central',
    address: 'Plot 543, Queens Road, Gaborone Central',
    phone: '+267 72 664 019',
    hours: 'Mon–Sat 09:00–20:00 · Sun 10:00–15:00',
    returnPolicy: 'Unopened bottles refundable within 7 days. No returns on opened product.',
    deliveryPromise: 'Cold-chain delivery in Gaborone Central and Block B, within 60 minutes.',
    staff: [
      { name: 'Lefiso M.', role: 'Shop Manager' },
      { name: 'Amos', role: 'Cellar Keeper' },
    ],
    sections: [
      { title: 'Cold from the cellar', kind: 'special' },
      { title: 'Local brews', kind: 'local' },
      { title: 'Soft drinks and water', kind: 'soft' },
    ],
    tags: ['beverages', 'local-brew', 'cold-chain'],
    accuracy: 96,
    prepMinutes: 45,
    rating: 4.7,
    reviews: 164,
    openedOn: '2016-06-30',
    products: [
      { name: 'Mosi-oa-Tunya Lager 6x355ml', blurb: 'Bottled in Gaborone, on ice', price: 96, saZar: 128, kg: 2.4, icon: '🍺', stock: 24, key: 'mosi-lager-6' },
      { name: 'Thlou 5L', blurb: 'House spirit, 48%', price: 185, saZar: 240, kg: 5, icon: '🥃', stock: 10 },
      { name: 'Castle Lager 6x355ml', blurb: 'Cans, straight from the fridge', price: 92, saZar: 122, kg: 2.3, icon: '🍺', stock: 26 },
      { name: 'Coca-Cola 2L', blurb: 'Chilled, never flat', price: 32, saZar: 42, kg: 2, icon: '🥤', stock: 48, key: 'coke-2l' },
      { name: 'Still Water 5L', blurb: 'For the cooler in the taxi', price: 22, saZar: 28, kg: 5, icon: '💧', stock: 40 },
      { name: 'Orange Juice 1L', blurb: 'Not from concentrate', price: 34, saZar: 45, kg: 1, icon: '🧃', stock: 22 },
      { name: 'Red Wine Shiraz 750ml', blurb: 'South African cellar selection', price: 168, saZar: 220, kg: 1.4, icon: '🍷', stock: 8 },
      { name: 'Craft Lager 6x330ml', blurb: 'Small-batch, Botswana brewed', price: 118, saZar: 155, kg: 2.2, icon: '🍺', stock: 12 },
      { name: 'Energy Drink 500ml', blurb: 'Six-pack for the road', price: 68, saZar: 92, kg: 3, icon: '🥤', stock: 18 },
    ],
  },
  {
    slug: 'metsi-home-store',
    name: 'Metsi Home Store',
    aisle: 'B1',
    tagline: 'The whole kitchen, from a pot to a plate',
    story:
      'Extension 10 is where Gaborone families furnish their first homes, and Metsi has been there since 2014. The store carries everything for a working kitchen — and the team will talk you through a pressure cooker the way a family member would.',
    accent: '#0f6f7d',
    accentSoft: '#e0f2f4',
    icon: '🍳',
    banner: '🍳🏠🍽️',
    area: 'Extension 10',
    address: 'Shop 14, Extension 10 Mall, Gaborone',
    phone: '+267 71 889 205',
    hours: 'Mon–Sat 08:30–18:00 · Sun 09:00–13:00',
    returnPolicy: '30-day returns on unused homeware with original packaging.',
    deliveryPromise: 'Heavy items delivered and unpacked to the door, free over P500.',
    staff: [
      { name: 'Dineo T.', role: 'Shop Manager' },
      { name: 'Joseph', role: 'Homeware Advisor' },
    ],
    sections: [
      { title: 'Cooking essentials', kind: 'staples' },
      { title: 'Dineo recommends', kind: 'staff' },
      { title: 'Table & glassware', kind: 'home' },
    ],
    tags: ['homeware', 'kitchen', 'family'],
    accuracy: 97,
    prepMinutes: 75,
    rating: 4.6,
    reviews: 189,
    openedOn: '2014-03-08',
    products: [
      { name: 'Cast Iron Pot 5L', blurb: 'Heavy, pre-seasoned, built to be inherited', price: 385, saZar: 540, kg: 6.5, icon: '🍲', stock: 6, key: 'cast-iron-pot-5l' },
      { name: 'Non-stick Frying Pan 26cm', blurb: 'PFOA-free, induction ready', price: 289, saZar: 395, kg: 1.2, icon: '🍳', stock: 9 },
      { name: 'Chef Knife 20cm', blurb: 'German steel, full tang', price: 245, saZar: 340, kg: 0.6, icon: '🔪', stock: 7 },
      { name: 'Glass Dinner Set 16-piece', blurb: 'Tempered, chip-resistant', price: 520, saZar: 780, kg: 7, icon: '🍽️', stock: 4 },
      { name: 'Electric Kettle 1.7L', blurb: 'Fast boil, auto shut-off', price: 219, saZar: 310, kg: 1.4, icon: '🫖', stock: 11 },
      { name: 'Stainless Steel Cooker 5L', blurb: 'Tri-ply base, induction ready', price: 690, saZar: 1050, kg: 5, icon: '🍳', stock: 3 },
      { name: 'Serving Bowl 30cm', blurb: 'Ceramic, glazed inside', price: 165, saZar: 235, kg: 2.2, icon: '🥣', stock: 10 },
      { name: 'Six-Piece Knife Block Set', blurb: 'Stainless, acacia base', price: 340, saZar: 470, kg: 2.4, icon: '🔪', stock: 5 },
      { name: 'Storage Container Set 5-piece', blurb: 'Airtight, stackable', price: 175, saZar: 240, kg: 1.4, icon: '🥡', stock: 13 },
    ],
  },
  {
    slug: 'kopana-household-depot',
    name: 'Kopana Household Depot',
    aisle: 'B2',
    tagline: 'Cleaning, tissue and the monthly refill',
    story:
      'Kopana sells in bulk because that is how Gaborone households shop — a two-kilo powder, a six-pack of tissue, a refill of dishwashing liquid. Refill pricing is automatic once you have an account with the shop.',
    accent: '#1b7f5e',
    accentSoft: '#e2f1ec',
    icon: '🧴',
    banner: '🧴🧻🧼',
    area: 'Gaborone North',
    address: 'Stand 9, Gaborone North Industrial, Gaborone',
    phone: '+267 73 118 440',
    hours: 'Mon–Fri 08:00–17:30 · Sat 08:00–13:00',
    returnPolicy: 'Opened cleaning product cannot be returned. Sealed items, 14 days.',
    deliveryPromise: 'Refill routes run every morning to Gaborone North and Ramokgwebana.',
    staff: [
      { name: 'Segametsi', role: 'Shop Manager' },
      { name: 'Patrick', role: 'Refill Desk' },
    ],
    sections: [
      { title: 'Refill and save', kind: 'special' },
      { title: 'Paper and tissue', kind: 'tissue' },
      { title: 'Cleaning and laundry', kind: 'cleaning' },
    ],
    tags: ['bulk', 'refill', 'household'],
    accuracy: 95,
    prepMinutes: 70,
    rating: 4.4,
    reviews: 143,
    openedOn: '2018-01-15',
    products: [
      { name: 'Washing Powder 5kg', blurb: 'Refill bag, save 22% against the box', price: 210, saZar: 285, kg: 5, icon: '🧺', stock: 18, key: 'washing-powder-5kg' },
      { name: 'Dishwashing Liquid 1L', blurb: 'Lemon, refill pouch available', price: 42, saZar: 55, kg: 1, icon: '🧴', stock: 30 },
      { name: 'Toilet Tissue 12 Rolls', blurb: '2-ply, quilted', price: 88, saZar: 115, kg: 2.4, icon: '🧻', stock: 26 },
      { name: 'Kitchen Towel Roll, 2', blurb: 'Heavy duty, tear-resistant', price: 34, saZar: 45, kg: 0.6, icon: '🧻', stock: 40 },
      { name: 'Bin Bags 30L, 30-pack', blurb: 'Heavy duty, 50 micron', price: 68, saZar: 88, kg: 1.2, icon: '🗑️', stock: 22 },
      { name: 'Hand Soap 500ml', blurb: 'Antibacterial, 2-pack', price: 48, saZar: 64, kg: 1, icon: '🧼', stock: 24 },
      { name: 'Surface Spray 1L', blurb: 'Kills 99.9% of germs', price: 55, saZar: 72, kg: 1, icon: '🧽', stock: 20 },
      { name: 'Laundry Liquid 2L', blurb: 'Low foam, easy rinse', price: 128, saZar: 168, kg: 2, icon: '🧴', stock: 14 },
      { name: 'Mattress Protector 2m', blurb: 'Fitted, waterproof, breathable', price: 285, saZar: 380, kg: 1.8, icon: '🛏️', stock: 7 },
    ],
  },
  {
    slug: 'dazzle-beauty-health',
    name: 'Dazzle Beauty & Health',
    aisle: 'B3',
    tagline: 'Skincare, hair and pharmacy, by people who use it',
    story:
      'Dazzle began as a single make-up counter in the Village and now stocks skin, hair and everyday pharmacy lines. The team is trained to read your skin, not just to sell you something.',
    accent: '#b0356b',
    accentSoft: '#fae6f0',
    icon: '💄',
    banner: '💄🧴✨',
    area: 'Village',
    address: 'Unit 22, Village Shopping Centre, Gaborone',
    phone: '+267 72 220 861',
    hours: 'Mon–Sat 09:00–19:00 · Sun 10:00–14:00',
    returnPolicy: 'Unopened beauty and pharmacy items refundable within 14 days with receipt.',
    deliveryPromise: 'Discreet delivery, in a sealed bag, within two hours in Gaborone Central.',
    staff: [
      { name: 'Kealeboga', role: 'Owner' },
      { name: 'Ramehlo', role: 'Skin Specialist' },
      { name: 'Tshepo', role: 'Hair Bar' },
    ],
    sections: [
      { title: 'Ramehlo’s skin picks', kind: 'staff' },
      { title: 'Hair and braiding', kind: 'special' },
      { title: 'Everyday pharmacy', kind: 'pharmacy' },
    ],
    tags: ['beauty', 'pharmacy', 'salon', 'women-led'],
    accuracy: 96,
    prepMinutes: 50,
    rating: 4.8,
    reviews: 276,
    openedOn: '2017-11-03',
    products: [
      { name: 'Vitamin C Brightening Serum 30ml', blurb: 'Morning and night, under sunscreen', price: 245, saZar: 340, kg: 0.1, icon: '✨', stock: 12, key: 'vitamin-c-serum-30' },
      { name: 'SPF 50 Sunscreen 100ml', blurb: 'No white cast, matte finish', price: 185, saZar: 260, kg: 0.15, icon: '🧴', stock: 18 },
      { name: 'Shea Butter Body Lotion 400ml', blurb: 'Unperfumed, for sensitive skin', price: 165, saZar: 225, kg: 0.45, icon: '🧴', stock: 15 },
      { name: 'Hair Growth Oil 100ml', blurb: 'Castor and rosemary, no build-up', price: 125, saZar: 175, kg: 0.2, icon: '💧', stock: 22 },
      { name: 'Box Braids Per Head', blurb: 'Includes wash, treatment and style', price: 350, saZar: 450, kg: 0, icon: '💇', stock: 8, unit: 'service' },
      { name: 'Manicure & Polish', blurb: 'Gel or traditional, 90 minutes', price: 180, saZar: 230, kg: 0, icon: '💅', stock: 6, unit: 'service' },
      { name: 'Paracetamol 500mg, 20 Tablets', blurb: 'Pharmacy grade, for headaches and fever', price: 18, saZar: 24, kg: 0.05, icon: '💊', stock: 40 },
      { name: 'Multivitamin 60 Tablets', blurb: 'One a day, iron and B12', price: 145, saZar: 195, kg: 0.15, icon: '💊', stock: 16 },
      { name: 'Lip Balm SPF 30, 2-pack', blurb: 'For the Botswana sun', price: 48, saZar: 62, kg: 0.08, icon: '💋', stock: 25 },
    ],
  },
  {
    slug: 'buildright-hardware',
    name: 'BuildRight Hardware',
    aisle: 'B4',
    tagline: 'If it bolts, we have it — and we will help you fit it',
    story:
      'BuildRight has served Tlokweng builders for fifteen years. The team will identify a fitting from a photo, and the store stocks pipe, paint and power tool consumables so a job does not stop on a Tuesday.',
    accent: '#5a5f6b',
    accentSoft: '#eceef1',
    icon: '🔧',
    banner: '🔧🔨🪚',
    area: 'Tlokweng',
    address: 'Plot 2210, Tlokweng Road, Gaborone',
    phone: '+267 71 550 992',
    hours: 'Mon–Fri 07:30–17:30 · Sat 08:00–13:00',
    returnPolicy: 'Unused hardware returned within 14 days. Power tools 6 months, boxed.',
    deliveryPromise: 'Trade delivery to site within 24 hours anywhere in Gaborone.',
    staff: [
      { name: 'Kagiso T.', role: 'Owner' },
      { name: 'Molefe', role: 'Trade Counter' },
    ],
    sections: [
      { title: 'Molefe’s trade picks', kind: 'staff' },
      { title: 'Paint & sundries', kind: 'paint' },
      { title: 'Tools and power', kind: 'tools' },
    ],
    tags: ['hardware', 'trade', 'builders'],
    accuracy: 94,
    prepMinutes: 80,
    rating: 4.5,
    reviews: 121,
    openedOn: '2009-08-20',
    products: [
      { name: 'Cordless Drill 18V with 2 Batteries', blurb: 'Brushless, 13mm chuck, two batteries', price: 1450, saZar: 2190, kg: 2.4, icon: '🔩', stock: 4, key: 'cordless-drill-18v' },
      { name: 'Interior Paint 5L, Matt White', blurb: 'Two coats, low odour', price: 385, saZar: 540, kg: 5.6, icon: '🪣', stock: 11 },
      { name: 'Adjustable Wrench 250mm', blurb: 'Chrome vanadium, smooth action', price: 95, saZar: 130, kg: 0.4, icon: '🔧', stock: 18 },
      { name: 'Screwdriver Set 6-piece', blurb: 'Slotted, Phillips and flat heads', price: 130, saZar: 175, kg: 0.7, icon: '🪛', stock: 15 },
      { name: 'PVC Pipe 110mm x 3m', blurb: 'For drains and irrigation', price: 145, saZar: 195, kg: 3.2, icon: '🔧', stock: 12 },
      { name: 'Garden Hose 20m', blurb: 'Reinforced, 13mm', price: 275, saZar: 360, kg: 3.4, icon: '💧', stock: 7 },
      { name: 'Cement 50kg', blurb: 'For slabs and foundations', price: 105, saZar: 135, kg: 50, icon: '🏗️', stock: 25, key: 'cement-50kg' },
      { name: 'Work Gloves Pair', blurb: 'Leather palm, safety rated', price: 85, saZar: 115, kg: 0.3, icon: '🧤', stock: 20 },
      { name: 'LED Downlight 10W, Pack of 4', blurb: 'Warm white, 220V', price: 320, saZar: 420, kg: 1.2, icon: '💡', stock: 9 },
    ],
  },
  {
    slug: 'tshepo-fashion-house',
    name: 'Tshepo Fashion House',
    aisle: 'C1',
    tagline: 'Local tailoring under local labels',
    story:
      'Tshepo was founded by a tailor who wanted Gaborone to wear clothes made in Gaborone. The house runs its own atelier in Kgale, so a hem can be turned in a day and a size altered before the weekend.',
    accent: '#8e3b6b',
    accentSoft: '#f5e4ef',
    icon: '👗',
    banner: '👗🧵✨',
    area: 'Kgale',
    address: 'Plot 1880, Kgale, Gaborone',
    phone: '+267 71 445 003',
    hours: 'Mon–Sat 09:00–18:00 · Sun 10:00–14:00',
    returnPolicy: 'Unworn with tags, 14 days. Free alteration within 7 days.',
    deliveryPromise: 'Alterations collected and returned by the same rider.',
    staff: [
      { name: 'Nthangeng', role: 'Founder & Head Tailor' },
      { name: 'Lerato', role: 'Pattern Cutter' },
      { name: 'Pakiso', role: 'Fitting Room' },
    ],
    sections: [
      { title: 'The atelier’s edit', kind: 'staff' },
      { title: 'This week’s specials', kind: 'special' },
      { title: 'Traditional wear', kind: 'heritage' },
    ],
    tags: ['fashion', 'local-atelier', 'alterations', 'women-led'],
    accuracy: 96,
    prepMinutes: 65,
    rating: 4.7,
    reviews: 198,
    openedOn: '2015-05-22',
    products: [
      { name: 'Maxi Dress — Seswaa Print', blurb: 'Six panels, made in the Kgale atelier', price: 385, saZar: 620, kg: 0.6, icon: '👗', stock: 9, key: 'maxi-dress-seswaa' },
      { name: 'Linen Shirt', blurb: 'Stonewashed, relaxed fit', price: 295, saZar: 480, kg: 0.4, icon: '👔', stock: 12, key: 'linen-shirt' },
      { name: 'Chinos 34', blurb: 'Twill, with a little stretch', price: 340, saZar: 545, kg: 0.6, icon: '👖', stock: 11, key: 'chinos-34' },
      { name: 'Traditional Attire Outfit', blurb: 'Made to measure, two fittings included', price: 980, saZar: 1650, kg: 1.2, icon: '🥻', stock: 4, unit: 'outfit' },
      { name: 'Leather Handbag', blurb: 'Full-grain, made by Tau next door', price: 620, saZar: 980, kg: 0.9, icon: '👜', stock: 5 },
      { name: 'Pure Cotton Jersey T-shirt', blurb: 'Heavyweight, pre-shrunk', price: 145, saZar: 235, kg: 0.2, icon: '👕', stock: 24, key: 'cotton-tee' },
      { name: 'Pleated Skirt, Midi', blurb: 'Knife pleats that hold', price: 325, saZar: 520, kg: 0.5, icon: '👗', stock: 8 },
      { name: 'Formal Blazer', blurb: 'Half-lined, tailored in-house', price: 890, saZar: 1450, kg: 1.1, icon: '🧥', stock: 3 },
      { name: 'Socks, 3-pack', blurb: 'Cotton blend, ankle length', price: 65, saZar: 105, kg: 0.15, icon: '🧦', stock: 30 },
      { name: 'Trousers Alteration', blurb: 'Hem or take in, 2-day turnaround', price: 90, saZar: 130, kg: 0, icon: '🧵', stock: 10, unit: 'service' },
    ],
  },
  {
    slug: 'tau-shoes-leather',
    name: 'Tau Shoes & Leather',
    aisle: 'C2',
    tagline: 'Good leather, resoled not replaced',
    story:
      'Tau repairs and re-soles rather than pushes replacements. A good pair of boots from Tau is expected to last a decade, and the shop will resole them when they finally give up.',
    accent: '#6b4423',
    accentSoft: '#efe4da',
    icon: '👞',
    banner: '👞🥾👟',
    area: 'Gaborone West',
    address: 'Stand 24, Gaborone West, Gaborone',
    phone: '+267 72 981 550',
    hours: 'Mon–Sat 08:30–17:30 · Sun 09:00–13:00',
    returnPolicy: 'Unworn, 14 days. Free first resole within six months.',
    deliveryPromise: 'Delivered with a shoe bag, free with any order over P400.',
    staff: [
      { name: 'Tau M.', role: 'Owner & Cobbler' },
      { name: 'Palesa', role: 'Sales Floor' },
    ],
    sections: [
      { title: 'Tau’s own make', kind: 'staff' },
      { title: 'Boots season', kind: 'special' },
      { title: 'Repairs & resoles', kind: 'service' },
    ],
    tags: ['footwear', 'leather', 'repairs'],
    accuracy: 97,
    prepMinutes: 55,
    rating: 4.6,
    reviews: 134,
    openedOn: '2012-10-05',
    products: [
      { name: 'Leather Chelsea Boots', blurb: 'Hand lasted, resoleable', price: 1290, saZar: 2050, kg: 1.8, icon: '🥾', stock: 5, key: 'chelsea-boots' },
      { name: 'Suede Loafers', blurb: 'Soft leather, rubber sole', price: 980, saZar: 1560, kg: 1.2, icon: '👞', stock: 6 },
      { name: 'Running Shoes, Men’s', blurb: 'Lightweight mesh, sizes 39–46', price: 780, saZar: 1240, kg: 0.9, icon: '👟', stock: 14, key: 'running-shoes-men' },
      { name: 'Running Shoes, Women’s', blurb: 'Same last, narrower fit', price: 780, saZar: 1240, kg: 0.85, icon: '👟', stock: 12 },
      { name: 'Sandals, Pair', blurb: 'Full grain, adjustable strap', price: 520, saZar: 830, kg: 0.7, icon: '🩴', stock: 10 },
      { name: 'Resole Service', blurb: 'Full resole, any good pair', price: 320, saZar: 480, kg: 0, icon: '🪡', stock: 12, unit: 'service' },
      { name: 'Boot Repair / Stitching', blurb: 'Split seam or blown sole', price: 180, saZar: 260, kg: 0, icon: '🧵', stock: 8, unit: 'service' },
      { name: 'Leather Belt 35mm', blurb: 'Solid brass buckle', price: 260, saZar: 410, kg: 0.3, icon: '👔', stock: 16 },
    ],
  },
  {
    slug: 'kabelo-bags-accessories',
    name: 'Kabelo Bags & Accessories',
    aisle: 'C3',
    tagline: 'Bags, belts, hats and the small things that finish it',
    story:
      'Kabelo packs for the office, the market and the airport. Everything is sourced from Botswana and South African makers, and the team will adjust a strap on the spot.',
    accent: '#1b6ca8',
    accentSoft: '#e2eef7',
    icon: '🎒',
    banner: '🎒👜🎩',
    area: 'Phakalane',
    address: 'Unit 31, Phakalane Point, Gaborone',
    phone: '+267 71 690 774',
    hours: 'Mon–Sat 09:00–18:30 · Sun 10:00–14:00',
    returnPolicy: 'Unused and in the original bag, 21 days.',
    deliveryPromise: 'Same-day delivery in Gaborone North, Phakalane and Village.',
    staff: [
      { name: 'Kabelo S.', role: 'Founder' },
      { name: 'Lesego', role: 'Floor' },
    ],
    sections: [
      { title: 'Kabelo’s carry picks', kind: 'staff' },
      { title: 'Travel and commute', kind: 'travel' },
      { title: 'Small leather goods', kind: 'goods' },
    ],
    tags: ['bags', 'accessories', 'commute'],
    accuracy: 95,
    prepMinutes: 50,
    rating: 4.5,
    reviews: 96,
    openedOn: '2019-07-12',
    products: [
      { name: 'Canvas Laptop Backpack 15"', blurb: 'Fits a 15-inch laptop, water resistant', price: 640, saZar: 980, kg: 1.1, icon: '🎒', stock: 9, key: 'canvas-backpack-15' },
      { name: 'Leather Tote Bag', blurb: 'Structured, with an inner zip pocket', price: 720, saZar: 1120, kg: 1.3, icon: '👜', stock: 6 },
      { name: 'Weekend Holdall 40L', blurb: 'Cabin-size, separate shoe compartment', price: 980, saZar: 1490, kg: 1.8, icon: '🧳', stock: 5 },
      { name: 'Snapback Cap', blurb: 'Cotton twill, adjustable strap', price: 185, saZar: 290, kg: 0.2, icon: '🧢', stock: 20 },
      { name: 'Leather Wallet, Bifold', blurb: 'RFID lining, six card slots', price: 240, saZar: 380, kg: 0.15, icon: '👛', stock: 22 },
      { name: 'Sunglasses, Polarised', blurb: 'UV400, hard case included', price: 380, saZar: 590, kg: 0.2, icon: '🕶️', stock: 14 },
      { name: 'Travel Neck Pillow', blurb: 'Memory foam, memory-foam comfort', price: 165, saZar: 255, kg: 0.4, icon: '🛫', stock: 18 },
      { name: 'Umbrella, Folding', blurb: 'Windproof, 130cm canopy', price: 145, saZar: 225, kg: 0.4, icon: '☂️', stock: 24 },
    ],
  },
  {
    slug: 'karabo-gems-gifts',
    name: 'Karabo Gems & Gifts',
    aisle: 'C4',
    tagline: 'Gold, beads and gifts worth giving',
    story:
      'Karabo is a family jeweller in Gaborone Central with its own workshop behind the counter. Gold is bought and sold on the day, and the workshop will size a ring while you wait.',
    accent: '#a8842c',
    accentSoft: '#f6efd9',
    icon: '💍',
    banner: '💍✨🎁',
    area: 'Gaborone Central',
    address: 'Plot 1102, Kgale Close, Gaborone',
    phone: '+267 72 355 019',
    hours: 'Mon–Fri 08:30–17:00 · Sat 09:00–13:00',
    returnPolicy: '14 days on unworn items with the certificate. Gold bought back at the day’s rate.',
    deliveryPromise: 'Free insured delivery in Gaborone Central on the same day.',
    staff: [
      { name: 'Karabo M.', role: 'Owner & Goldsmith' },
      { name: 'Lydia', role: 'Sales' },
    ],
    sections: [
      { title: 'Karabo’s gold shelf', kind: 'special' },
      { title: 'Beads and traditional', kind: 'beads' },
      { title: 'Gifts under P300', kind: 'gifts' },
    ],
    tags: ['jewellery', 'gold', 'gifts', 'certified'],
    accuracy: 99,
    prepMinutes: 30,
    rating: 4.9,
    reviews: 117,
    openedOn: '2001-04-18',
    products: [
      { name: 'Gold Chain 14kt, 45cm', blurb: 'South African mint, with certificate', price: 3450, saZar: 5600, kg: 0.03, icon: '📿', stock: 4, key: 'gold-chain-14kt' },
      { name: 'Basotho Bead Necklace', blurb: 'Hand-strung glass bead, heritage design', price: 420, saZar: 690, kg: 0.1, icon: '📿', stock: 9 },
      { name: 'Diamond Engagement Ring 0.5ct', blurb: 'GIA certificate, solitaire setting', price: 28500, saZar: 46000, kg: 0.05, icon: '💍', stock: 1 },
      { name: 'Sterling Silver Pendant', blurb: 'Setswana motif, 92.5 sterling', price: 340, saZar: 540, kg: 0.08, icon: '🪬', stock: 11 },
      { name: 'Gift Box, Mixed', blurb: 'Chocolates, tea and a candle', price: 285, saZar: 420, kg: 0.9, icon: '🎁', stock: 15, special: 240 },
      { name: 'Watch, Leather Strap', blurb: 'Japanese movement, 3ATM', price: 1450, saZar: 2200, kg: 0.3, icon: '⌚', stock: 5 },
      { name: 'Sunglasses, UV400', blurb: 'Acetate frame, hard case', price: 520, saZar: 790, kg: 0.2, icon: '🕶️', stock: 8 },
      { name: 'Photo Frame, 6x4', blurb: 'Carved mopane wood', price: 190, saZar: 290, kg: 0.5, icon: '🖼️', stock: 16 },
    ],
  },
  {
    slug: 'techno-village',
    name: 'Techno Village Gaborone',
    aisle: 'D1',
    tagline: 'Handsets, data and a human who answers',
    story:
      'Techno Village is the Gaborone place people bring their phones when something breaks. The team does activations, data bundles, transfers and screen repairs from one counter, and the phone you order is the phone that is on the shelf.',
    accent: '#2764b5',
    accentSoft: '#e3ecf8',
    icon: '📱',
    banner: '📱📶🔧',
    area: 'Gaborone Central',
    address: 'Plot 999, President Hotel Mall, Gaborone',
    phone: '+267 71 240 118',
    hours: 'Mon–Sat 08:00–19:00 · Sun 09:00–14:00',
    returnPolicy: '7 days on handsets with the box and the receipt. Screen repair, 30 days.',
    deliveryPromise: 'Handsets delivered, set up and data transferred, within 2 hours in Central.',
    staff: [
      { name: 'Oabile', role: 'Store Manager' },
      { name: 'Thabang', role: 'Repairs' },
      { name: 'Nandi', role: 'Activations' },
    ],
    sections: [
      { title: 'Thabang’s repairs bench', kind: 'service' },
      { title: 'On offer this week', kind: 'special' },
      { title: 'Data and bundles', kind: 'data' },
    ],
    tags: ['mobile', 'repairs', 'data', 'activations'],
    accuracy: 98,
    prepMinutes: 45,
    rating: 4.5,
    reviews: 402,
    openedOn: '2013-07-01',
    products: [
      { name: 'Smartphone 128GB, Dual SIM', blurb: '6.5" display, on the shelf today', price: 2350, saZar: 4150, kg: 0.4, icon: '📱', stock: 7, key: 'smartphone-128gb' },
      { name: 'Smartphone 256GB, 5G', blurb: 'Flagship camera, 90Hz screen', price: 4850, saZar: 8600, kg: 0.45, icon: '📱', stock: 4 },
      { name: 'Budget Smartphone 64GB', blurb: 'The workhorse handset', price: 1150, saZar: 2050, kg: 0.35, icon: '📱', stock: 11, key: 'budget-smartphone-64' },
      { name: '10GB Data Bundle, 30 days', blurb: 'All networks, no expiry games', price: 180, saZar: 240, kg: 0, icon: '📶', stock: 99, unit: 'bundle' },
      { name: 'Unlimited Data, 30 days', blurb: 'All networks, 5G where available', price: 520, saZar: 700, kg: 0, icon: '📶', stock: 99, unit: 'bundle' },
      { name: 'Screen Repair — Front Glass', blurb: 'Same-day, 2-hour turnaround', price: 380, saZar: 560, kg: 0, icon: '🔧', stock: 12, unit: 'service' },
      { name: 'Phone Case, Clear', blurb: 'Shockproof, all handsets', price: 85, saZar: 135, kg: 0.05, icon: '🧱', stock: 40 },
      { name: 'Tablet 10" 64GB', blurb: 'With a stylus in the box', price: 1850, saZar: 3300, kg: 0.55, icon: '📟', stock: 5 },
      { name: 'eSIM Setup Service', blurb: 'Profile installed, number ported', price: 120, saZar: 180, kg: 0, icon: '📲', stock: 15, unit: 'service' },
    ],
  },
  {
    slug: 'soundwave-audio-tv',
    name: 'Soundwave Audio & TV',
    aisle: 'D2',
    tagline: 'Sound you can hear from the car park',
    story:
      'Soundwave is the specialist in Block B for speakers, soundbars and screens. The listening room at the back is open to anyone — bring a track, play it, decide in the room.',
    accent: '#d1462f',
    accentSoft: '#fbe5e1',
    icon: '🔊',
    banner: '🔊🎧📺',
    area: 'Block B',
    address: 'Unit 12, Block B Shopping Centre, Gaborone',
    phone: '+267 71 807 442',
    hours: 'Mon–Sat 09:00–18:00 · Sun 10:00–13:00',
    returnPolicy: '14 days on audio gear. Screens are collected for a free 7-day dead-pixel check.',
    deliveryPromise: 'Free setup with any home delivery in Gaborone.',
    staff: [
      { name: 'Neo M.', role: 'Owner' },
      { name: 'Lameck', role: 'Listening Room' },
    ],
    sections: [
      { title: 'Lameck’s listening room', kind: 'staff' },
      { title: 'Soundbar bundles', kind: 'special' },
      { title: 'Screens and brackets', kind: 'tv' },
    ],
    tags: ['audio', 'tv', 'listening-room', 'installation'],
    accuracy: 96,
    prepMinutes: 60,
    rating: 4.7,
    reviews: 154,
    openedOn: '2016-02-26',
    products: [
      { name: 'Wireless Earbuds, ANC', blurb: 'Noise cancelling, 30-hour case', price: 780, saZar: 1250, kg: 0.15, icon: '🎧', stock: 13, key: 'wireless-earbuds-anc' },
      { name: 'Over-Ear Headphones', blurb: 'Studio tuning, wired or wireless', price: 1450, saZar: 2350, kg: 0.4, icon: '🎧', stock: 7 },
      { name: 'Soundbar 2.1ch, 120W', blurb: 'Wireless subwoofer, HDMI ARC', price: 3200, saZar: 5100, kg: 7.5, icon: '🔊', stock: 5, key: 'soundbar-2-1-120w' },
      { name: '43" Smart TV, 4K', blurb: 'Built-in apps, 3 HDMI', price: 4650, saZar: 7900, kg: 8.6, icon: '📺', stock: 4 },
      { name: '55" Smart TV, 4K', blurb: 'For the lounge wall', price: 6200, saZar: 10400, kg: 14, icon: '📺', stock: 2 },
      { name: 'Bluetooth Speaker, Portable', blurb: 'Waterproof, 20-hour battery', price: 640, saZar: 980, kg: 1.1, icon: '🔊', stock: 9 },
      { name: 'TV Wall Bracket, 60"', blurb: 'Full motion, with the fixings', price: 480, saZar: 640, kg: 4.2, icon: '🔧', stock: 8 },
      { name: 'HDMI Cable 2.1, 3m', blurb: '8K certified', price: 120, saZar: 175, kg: 0.2, icon: '🔌', stock: 30 },
    ],
  },
  {
    slug: 'bitwise-computing-gaming',
    name: 'Bitwise Computing & Gaming',
    aisle: 'D3',
    tagline: 'Builds, fixes and game rooms',
    story:
      'Bitwise builds custom gaming rigs and office machines, and runs a bench where customers can bring their own tower in to be diagnosed in front of them. The Gaborone esports team trains in the arcade room at the back.',
    accent: '#5b3bd6',
    accentSoft: '#ebe6fb',
    icon: '🖥️',
    banner: '🖥️🎮⌨️',
    area: 'Gaborone West',
    address: 'Stand 5, Gaborone West Mall, Gaborone',
    phone: '+267 72 777 019',
    hours: 'Mon–Sat 09:00–18:00 · Sun 10:00–13:00',
    returnPolicy: '14 days on complete systems. Build-to-order parts are non-returnable.',
    deliveryPromise: 'Full PC setup and game install, delivered and working.',
    staff: [
      { name: 'Setho L.', role: 'Owner & Builder' },
      { name: 'Rudo', role: 'Bench Technician' },
    ],
    sections: [
      { title: 'Setho’s build bench', kind: 'staff' },
      { title: 'Esports corner', kind: 'gaming' },
      { title: 'Laptops and tablets', kind: 'laptops' },
    ],
    tags: ['computing', 'gaming', 'custom-builds', 'repairs'],
    accuracy: 97,
    prepMinutes: 70,
    rating: 4.8,
    reviews: 168,
    openedOn: '2014-11-19',
    products: [
      { name: 'Gaming Laptop 16GB, RTX Graphics', blurb: '144Hz, 1TB SSD, thermal paste done', price: 14500, saZar: 24500, kg: 2.6, icon: '💻', stock: 2, key: 'gaming-laptop-16' },
      { name: 'Office Laptop 8GB, 512GB', blurb: 'Light, quiet, for the road', price: 5200, saZar: 8900, kg: 1.6, icon: '💻', stock: 6, key: 'office-laptop-8' },
      { name: 'Gaming Console + 1 Controller', blurb: 'New generation, 1TB', price: 6800, saZar: 11800, kg: 5.2, icon: '🎮', stock: 3, key: 'gaming-console' },
      { name: 'Mechanical Keyboard, 87-key', blurb: 'Hot-swappable, brown switches', price: 720, saZar: 1150, kg: 0.9, icon: '⌨️', stock: 10 },
      { name: 'Gaming Mouse 8000 DPI', blurb: 'Lightweight, wireless', price: 380, saZar: 580, kg: 0.15, icon: '🖱️', stock: 16 },
      { name: '27" Gaming Monitor 165Hz', blurb: 'IPS, 1ms response', price: 2350, saZar: 3700, kg: 4.8, icon: '🖥️', stock: 5 },
      { name: 'Custom PC Build, Entry', blurb: 'Ryzen 5, 16GB, 512GB, RTX 4060', price: 9800, saZar: 16800, kg: 9, icon: '🖥️', stock: 1, unit: 'build' },
      { name: 'PC Diagnostic & Tune-up', blurb: 'Full bench test, thermal clean', price: 220, saZar: 320, kg: 0, icon: '🔧', stock: 12, unit: 'service' },
      { name: 'Game Credit 1-Month', blurb: 'Platform of your choice, prepaid', price: 95, saZar: 130, kg: 0, icon: '🎮', stock: 40, unit: 'credit' },
    ],
  },
  {
    slug: 'charged-accessories',
    name: 'Charged Accessories',
    aisle: 'D4',
    tagline: 'The cable you lost, without the trip to the mall',
    story:
      'Charged keeps deep stock of the small things — cables, chargers, cases, power banks — because waiting for a small part is a waste of an afternoon. If it is in the catalogue, it is on the shelf in Motswedi today.',
    accent: '#0e8f7e',
    accentSoft: '#e0f3f0',
    icon: '🔌',
    banner: '🔌🔋🎧',
    area: 'Motswedi',
    address: 'Plot 308, Motswedi Commercial Centre, Gaborone',
    phone: '+267 73 330 226',
    hours: 'Mon–Sat 08:30–18:00 · Sun 10:00–13:30',
    returnPolicy: '14 days on unopened accessories, 30 days on power banks.',
    deliveryPromise: 'Rider dispatch within 45 minutes across Gaborone.',
    staff: [
      { name: 'Itumeleng', role: 'Founder' },
      { name: 'Kabelo T.', role: 'Floor' },
    ],
    sections: [
      { title: 'Itumeleng’s shelf', kind: 'staff' },
      { title: 'Power and charging', kind: 'power' },
      { title: 'Cases and protection', kind: 'cases' },
    ],
    tags: ['accessories', 'charging', 'power-banks', 'everyday'],
    accuracy: 98,
    prepMinutes: 40,
    rating: 4.5,
    reviews: 287,
    openedOn: '2020-02-14',
    products: [
      { name: 'USB-C Cable 2m, 100W', blurb: 'E-marked, charges a laptop', price: 95, saZar: 140, kg: 0.1, icon: '🔌', stock: 60, key: 'usb-c-cable-2m' },
      { name: 'Power Bank 20,000mAh', blurb: 'Two outputs, phone charged five times', price: 420, saZar: 620, kg: 0.45, icon: '🔋', stock: 22, key: 'power-bank-20k' },
      { name: 'Wall Charger 30W', blurb: 'USB-C PD, works in Botswana sockets', price: 145, saZar: 210, kg: 0.15, icon: '🔌', stock: 34 },
      { name: 'Phone Case, Clear', blurb: 'Shockproof, all handsets', price: 85, saZar: 135, kg: 0.05, icon: '🧱', stock: 45, key: 'phone-case-clear' },
      { name: 'Screen Protector, Tempered', blurb: '9H hardness, 2-pack', price: 55, saZar: 85, kg: 0.03, icon: '🛡️', stock: 70 },
      { name: 'Car Charger, 36W', blurb: 'Dual port, USB-C PD', price: 175, saZar: 250, kg: 0.12, icon: '🚗', stock: 18 },
      { name: 'Wireless Charging Pad 15W', blurb: 'Anti-slip, LED indicator', price: 210, saZar: 310, kg: 0.2, icon: '🔲', stock: 20 },
      { name: 'Car Phone Holder, Magnetic', blurb: 'One-hand mount, 360°', price: 165, saZar: 240, kg: 0.15, icon: '🚘', stock: 24 },
      { name: 'HDMI to HDMI Cable 2m', blurb: '8K, braided', price: 110, saZar: 160, kg: 0.18, icon: '🔗', stock: 28 },
    ],
  },
  {
    slug: 'morua-junction-hub',
    name: 'Morua Junction Hub — Gaborone West',
    aisle: 'E2',
    kind: 'hub',
    tagline: 'The courtyard: collect here, or we come to you',
    story:
      'The Hub is not a shop. It is Morua Junction’s own counter in Gaborone West, where you can collect an order from any shop in the mall, drop a return, or talk to a human about a delivery that went sideways.',
    accent: '#0d1b2a',
    accentSoft: '#e3e8ee',
    icon: '🏛️',
    banner: '🏛️🤝📦',
    area: 'Gaborone West',
    address: 'Morua Junction Hub, Stand 1, Gaborone West Mall, Gaborone',
    phone: '+267 310 0000',
    hours: 'Mon–Sat 08:00–19:00 · Sun 10:00–14:00',
    returnPolicy: 'Returns accepted for any shop in the mall, even when you collected elsewhere.',
    deliveryPromise: 'Collect at the Hub in under 20 minutes, or have it delivered the same afternoon.',
    staff: [
      { name: 'Itumeleng M.', role: 'Hub Manager' },
      { name: 'Rutang', role: 'Rider Dispatch' },
      { name: 'Amos B.', role: 'Customer Care' },
    ],
    sections: [
      { title: 'Click & collect', kind: 'collect' },
      { title: 'Delivery routes', kind: 'delivery' },
    ],
    tags: ['pickup-point', 'returns', 'support', 'platform'],
    accuracy: 99,
    prepMinutes: 20,
    rating: 4.7,
    reviews: 198,
    openedOn: '2026-02-01',
    products: [],
  },
]

const REVIEWS: { store: string; author: string; rating: number; body: string; daysAgo: number }[] = [
  { store: 'bonwadi-fresh-market', author: 'Mpho K.', rating: 5, body: 'The veg was actually on the shelf when they said it was. That is more than I can say for most places.', daysAgo: 6 },
  { store: 'bonwadi-fresh-market', author: 'Tshepo A.', rating: 5, body: 'Naledi marked the avocados down because they were going off. Honest shop.', daysAgo: 11 },
  { store: 'gaborone-sun-mart', author: 'Kagiso', rating: 4, body: 'Deep stock on the staples. I never leave empty handed anymore.', daysAgo: 4 },
  { store: 'gaborone-sun-mart', author: 'Lerato M.', rating: 5, body: 'They held my maize meal aside when I was delayed by traffic. No argument.', daysAgo: 19 },
  { store: 'krugers-bakery-deli', author: 'Katlego', rating: 5, body: 'Koeksisters still warm when the rider arrived. That never happens.', daysAgo: 2 },
  { store: 'krugers-bakery-deli', author: 'Dineo S.', rating: 5, body: 'The koeksisters are worth the early alarm. And the pies are properly filled.', daysAgo: 23 },
  { store: 'setswana-cellar-pantry', author: 'Bongani', rating: 5, body: 'Mosi at half the price of Sandton and it was cold. Come here.', daysAgo: 8 },
  { store: 'setswana-cellar-pantry', author: 'Refilwe', rating: 4, body: 'Great range. Wish they had more of the craft stuff.', daysAgo: 14 },
  { store: 'metsi-home-store', author: 'Mpho K.', rating: 5, body: 'Joseph spent twenty minutes helping me choose a pot for induction. I would have bought the wrong one.', daysAgo: 9 },
  { store: 'kopana-household-depot', author: 'Nomvula', rating: 4, body: 'Refill is cheaper than the box and they bring it to the door.', daysAgo: 5 },
  { store: 'dazzle-beauty-health', author: 'Ramehlo', rating: 5, body: 'Ramehlo read my skin properly and did not try to sell me the expensive thing.', daysAgo: 3 },
  { store: 'dazzle-beauty-health', author: 'Kealeboga P.', rating: 5, body: 'The braiding is worth every minute. She uses her own products on me.', daysAgo: 16 },
  { store: 'buildright-hardware', author: 'Molefe T.', rating: 4, body: 'Sent a photo of the fitting at 8pm, replied at 8:05 with the right part. Rare.', daysAgo: 12 },
  { store: 'tshepo-fashion-house', author: 'Mamabolo', rating: 5, body: 'They turned my hem while I waited. The print is beautiful.', daysAgo: 7 },
  { store: 'tshepo-fashion-house', author: 'Amogelang', rating: 5, body: 'Made to measure, and the price was better than the shop in the mall.', daysAgo: 21 },
  { store: 'tau-shoes-leather', author: 'Mpho K.', rating: 5, body: 'Resoled my old boots instead of selling me new ones. Respect.', daysAgo: 10 },
  { store: 'kabelo-bags-accessories', author: 'Itumeleng', rating: 4, body: 'Good backpack for the price and they adjusted the strap at the counter.', daysAgo: 18 },
  { store: 'karabo-gems-gifts', author: 'Segolebe', rating: 5, body: 'Karabo sized my ring while I waited and the gold rate was fair.', daysAgo: 13 },
  { store: 'techno-village', author: 'Boitumelo', rating: 4, body: 'Thabang fixed my screen in two hours and it is still perfect.', daysAgo: 5 },
  { store: 'techno-village', author: 'Tshepo', rating: 5, body: 'They transferred all my data onto the new phone in front of me.', daysAgo: 17 },
  { store: 'soundwave-audio-tv', author: 'Katlego', rating: 5, body: 'They let me play my own music in the listening room. I bought the soundbar there.', daysAgo: 6 },
  { store: 'bitwise-computing-gaming', author: 'Lameck', rating: 5, body: 'Setho built my machine and it still runs cool after a year of gaming.', daysAgo: 8 },
  { store: 'bitwise-computing-gaming', author: 'Tumelo', rating: 4, body: 'Diagnosed my laptop in front of me instead of just taking it away.', daysAgo: 20 },
  { store: 'charged-accessories', author: 'Lesego', rating: 5, body: 'Ordered a cable at 7pm, it was on my desk by 8. Saved me a trip.', daysAgo: 1 },
  { store: 'charged-accessories', author: 'Kagiso', rating: 4, body: 'Always has the exact adapter I need. That is the whole business.', daysAgo: 15 },
  { store: 'morua-junction-hub', author: 'Refilwe', rating: 5, body: 'Collected from three different shops in one basket, one trip. That is the point.', daysAgo: 3 },
  { store: 'morua-junction-hub', author: 'Mpho K.', rating: 4, body: 'Amos sorted out a return that the shop had forgotten about. Good man.', daysAgo: 12 },
]

const PROMOTION_SEEDS = [
  {
    name: 'Courtyard Week',
    scope_type: 'store',
    scope_id: 'morua-junction-hub',
    pct: 0,
    amount_pula: 0,
    funded_by: 'Morua Junction',
    budget_pula: 0,
    starts_at: '2026-01-01',
    ends_at: '2026-12-31',
  },
  {
    name: 'Fresh Week — 10% off produce',
    scope_type: 'aisle',
    scope_id: 'A2',
    pct: 10,
    amount_pula: 0,
    funded_by: 'Morua Junction',
    budget_pula: 800,
    starts_at: '2026-10-01',
    ends_at: '2026-11-30',
  },
  {
    name: 'Tech Month — 5% off accessories',
    scope_type: 'aisle',
    scope_id: 'D4',
    pct: 5,
    amount_pula: 0,
    funded_by: 'Morua Junction',
    budget_pula: 400,
    starts_at: '2026-10-01',
    ends_at: '2026-12-15',
  },
]

function daysAgoIso(days: number, hour = 9, minute = 0): string {
  const d = new Date()
  d.setDate(d.getDate() - days)
  d.setHours(hour, minute, 0, 0)
  return d.toISOString()
}

export function seed(force = false): { stores: number; products: number } {
  migrate()
  ensureColumns('stores', {
    unit_label: "TEXT NOT NULL DEFAULT ''",
    unit_x: 'REAL NOT NULL DEFAULT 0.5',
    unit_y: 'REAL NOT NULL DEFAULT 0.5',
  })
  if (isSeeded() && !force) {
    const stores = (db.prepare(`SELECT COUNT(*) c FROM stores`).get() as { c: number }).c
    const products = (db.prepare(`SELECT COUNT(*) c FROM products`).get() as { c: number }).c
    return { stores, products }
  }
  if (force) {
    for (const t of [
      'ledger_entries',
      'order_items',
      'orders',
      'reviews',
      'disputes',
      'payouts',
      'promotions',
      'products',
      'stores',
      'aisles',
      'floors',
    ]) {
      db.exec(`DELETE FROM ${t}`)
    }
  }

  const insFloor = db.prepare(
    `INSERT INTO floors (code, name, tagline, sort) VALUES (?, ?, ?, ?)`,
  )
  for (const f of FLOORS) insFloor.run(f.code, f.name, f.tagline, f.sort)

  const insAisle = db.prepare(
    `INSERT INTO aisles (floor_id, code, name, blurb, sort) VALUES (?, ?, ?, ?, ?)`,
  )
  const aisleId = new Map<string, number>()
  for (const [floorCode, list] of Object.entries(AISLES)) {
    const floor = db.prepare(`SELECT id FROM floors WHERE code = ?`).get(floorCode) as { id: number }
    for (const a of list) {
      const info = insAisle.run(floor.id, a.code, a.name, a.blurb, a.sort)
      aisleId.set(a.code, Number(info.lastInsertRowid))
    }
  }

  const insStore = db.prepare(
    `INSERT INTO stores (slug, name, aisle_id, kind, tagline, story, accent, accent_soft, icon, banner,
      area, address, phone, hours, return_policy, delivery_promise, verified_status, verified_at, verified_by,
      rating, review_count, fulfilment_accuracy, median_prep_minutes, tags, staff, sections, card_stamps, card_target, unit_label, unit_x, unit_y, opened_on)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  const insProduct = db.prepare(
    `INSERT INTO products (sku, store_id, name, blurb, match_key, category, unit, icon, price_pula, was_price_pula,
      sa_price_zar, weight_kg, duty_rate, origin, stock, stock_synced_at, rating, review_count, sold_count,
      is_special, special_pula, tags)
     VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)`,
  )
  const insReview = db.prepare(
    `INSERT INTO reviews (store_id, product_id, author, rating, body, created_at) VALUES (?,?,?,?,?,?)`,
  )

  const storeIds = new Map<string, number>()
  let productCount = 0
  let seq = 1000

  // Lay each shop out as a unit on its floor plan, four units to a row.
  const aisleFloor = new Map<string, string>()
  for (const [floorCode, list] of Object.entries(AISLES)) {
    for (const a of list) aisleFloor.set(a.code, floorCode)
  }
  const floorCounts = new Map<string, number>()

  for (const s of STORES) {
    const aisle = aisleId.get(s.aisle) ?? null
    const isHub = s.kind === 'hub'
    const floorCode = aisleFloor.get(s.aisle) ?? 'courtyard'
    const idx = floorCounts.get(floorCode) ?? 0
    floorCounts.set(floorCode, idx + 1)
    const col = idx % 4
    const row = Math.floor(idx / 4)
    const unitLabel = `${s.aisle}-${String(idx + 1).padStart(2, '0')}`
    const unitX = 0.09 + col * 0.225
    const unitY = 0.2 + row * 0.28
    const info = insStore.run(
      s.slug,
      s.name,
      aisle,
      s.kind ?? 'retailer',
      s.tagline,
      s.story,
      s.accent,
      s.accentSoft,
      s.icon,
      s.banner,
      s.area,
      s.address,
      s.phone,
      s.hours,
      s.returnPolicy,
      s.deliveryPromise,
      isHub ? 'verified' : 'verified',
      daysAgoIso(200 + (seq % 90)),
      'Botswana Verification Desk',
      s.rating,
      s.reviews,
      s.accuracy,
      s.prepMinutes,
      JSON.stringify(s.tags),
      JSON.stringify(s.staff),
      JSON.stringify(s.sections),
      Math.floor(s.reviews / 90) % (s.cardTarget ?? 8),
      s.cardTarget ?? 8,
      unitLabel,
      unitX,
      unitY,
      s.openedOn,
    )
    const storeId = Number(info.lastInsertRowid)
    storeIds.set(s.slug, storeId)

    for (const p of s.products) {
      const category = aisleNameToCategory(s.aisle)
      const key = p.key ?? p.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')
      const isSpecial = p.special ? 1 : 0
      const price = p.special ?? p.price
      insProduct.run(
        `MJ-${String(seq++).padStart(5, '0')}`,
        storeId,
        p.name,
        p.blurb,
        key,
        category,
        p.unit ?? 'each',
        p.icon,
        price,
        p.was ?? null,
        p.saZar,
        p.kg,
        dutyForCategory(category),
        p.unit === 'service' || p.unit === 'bundle' || p.unit === 'credit' ? 'Gaborone' : 'Imported',
        p.stock ?? 10,
        daysAgoIso(Math.floor(Math.random() * 180), 7, 15),
        round2(4.2 + ((seq * 7) % 8) / 10),
        Math.floor(4 + ((seq * 3) % 120)),
        Math.floor(20 + ((seq * 11) % 400)),
        isSpecial,
        p.special ?? null,
        JSON.stringify(p.tags ?? []),
      )
      productCount++
    }
  }

  for (const r of REVIEWS) {
    const sid = storeIds.get(r.store)
    if (!sid) continue
    insReview.run(sid, null, r.author, r.rating, r.body, daysAgoIso(r.daysAgo, 12, 0))
  }

  const insPromo = db.prepare(
    `INSERT INTO promotions (name, scope_type, scope_id, pct, amount_pula, funded_by, budget_pula, spent_pula, state, starts_at, ends_at)
     VALUES (?,?,?,?,?,?,?,?,?,?,?)`,
  )
  for (const pr of PROMOTION_SEEDS) {
    insPromo.run(
      pr.name,
      pr.scope_type,
      pr.scope_id,
      pr.pct,
      pr.amount_pula,
      pr.funded_by,
      pr.budget_pula,
      0,
      'live',
      pr.starts_at,
      pr.ends_at,
    )
  }

  return { stores: storeIds.size, products: productCount }
}

function aisleNameToCategory(code: string): string {
  const map: Record<string, string> = {
    A1: 'Groceries & Staples',
    A2: 'Fresh Produce',
    A3: 'Bakery & Deli',
    A4: 'Beverages & Cellar',
    B1: 'Home & Kitchen',
    B2: 'Household & Cleaning',
    B3: 'Health & Beauty',
    B4: 'Hardware & DIY',
    C1: 'Fashion',
    C2: 'Footwear',
    C3: 'Bags & Accessories',
    C4: 'Jewellery & Gifts',
    D1: 'Mobile & Tablets',
    D2: 'Audio & TV',
    D3: 'Computing & Gaming',
    D4: 'Accessories',
  }
  return map[code] ?? 'Services'
}
