/* ------------------------------------------------------------------ *
 * Morua Junction — the rest of the country.
 *
 * The flagship branches in `national.ts` are written out in full because
 * they carry the narrative of the platform. The remaining districts and
 * the big villages are described compactly here and expanded by the same
 * builder, so every shop in Botswana is listed, stocked and priced the
 * same way — with its own unit on its own pavilion floor.
 * ------------------------------------------------------------------ */

import type { NatBranch, NatShop } from './types.ts'

interface CompactShop {
  slug: string
  name: string
  icon: string
  accent: string
  tagline: string
  story: string
  mix: string
  aisle: string
  items?: string[]
  area: string
  address: string
  phone: string
  hours?: string
  staff: { name: string; role: string }[]
  tags: string[]
  accuracy?: number
  prepMinutes?: number
  rating?: number
  reviews?: number
  returns?: string
  promise?: string
}

interface CompactBranch {
  town: string
  district: string
  region: string
  factor: number
  hubIcon: string
  hubAccent: string
  hubTagline: string
  hubStory: string
  hubAddress: string
  hubPhone: string
  aisles: { code: string; name: string; blurb: string }[]
  shops: CompactShop[]
}

const RETURNS = '14 days on goods in original condition unless marked final sale.'

function build(branch: CompactBranch): NatBranch {
  const shopList: NatShop[] = branch.shops.map((s) => ({
    slug: s.slug,
    name: s.name,
    aisle: s.aisle,
    tagline: s.tagline,
    story: s.story,
    accent: s.accent,
    accentSoft: s.accent + '22',
    icon: s.icon,
    banner: s.icon,
    area: s.area,
    address: s.address,
    phone: s.phone,
    hours: s.hours ?? 'Mon–Sat 07:30–18:00 · Sun 09:00–13:00',
    returnPolicy: s.returns ?? RETURNS,
    deliveryPromise:
      s.promise ??
      `Ordered before 12:00, on site in ${branch.town} the same working day.`,
    staff: s.staff,
    sections: [
      { title: 'On the shelf', kind: 'category' },
      { title: 'Also in stock', kind: 'category' },
    ],
    tags: s.tags,
    accuracy: s.accuracy ?? 94,
    prepMinutes: s.prepMinutes ?? 60,
    rating: s.rating ?? 4.5,
    reviews: s.reviews ?? 24,
    items: s.items ?? [],
    mix: s.mix,
  }))

  return {
    town: branch.town,
    district: branch.district,
    region: branch.region,
    factor: branch.factor,
    hub: {
      slug: `${branch.town.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-junction-hub`,
      name: `${branch.town} Junction Hub`,
      tagline: branch.hubTagline,
      story: branch.hubStory,
      accent: branch.hubAccent,
      accentSoft: branch.hubAccent + '22',
      icon: branch.hubIcon,
      banner: branch.hubIcon,
      area: branch.town,
      address: branch.hubAddress,
      phone: branch.hubPhone,
      hours: 'Mon–Sat 07:00–18:00 · Sun 09:00–13:00',
    },
    aisles: branch.aisles,
    shops: shopList,
  }
}

export const MORE_BRANCHES: NatBranch[] = [
  build({
    town: 'Ramokgwebana',
    district: 'Kweneng',
    region: 'North-East',
    factor: 1.02,
    hubIcon: '🏘️',
    hubAccent: '#3f6fd0',
    hubTagline: 'A village that grew into a suburb',
    hubStory:
      'Ramokgwebana sits on the edge of the Gaborone boundary, and the hub serves a young, fast-growing village market that had nowhere to trade online before now.',
    hubAddress: 'Ramokgwebana Main Road, Kweneng',
    hubPhone: '+267 71 610 448',
    aisles: [
      { code: 'RW1', name: 'Household & Food', blurb: 'Everyday grocery and cleaning' },
      { code: 'RW2', name: 'Fashion & Beauty', blurb: 'Clothing, hair and accessories' },
    ],
    shops: [
      {
        slug: 'ramokgwebana-general-store',
        name: 'Ramokgwebana General Store',
        icon: '🛒',
        accent: '#c2793a',
        tagline: 'The corner shop, now with a national shelf',
        story:
          'A family store that keeps the essentials in stock and now lists the whole Junction catalogue beside them.',
        mix: 'general',
        aisle: 'RW1',
        area: 'Ramokgwebana',
        address: 'Stand 5, Ramokgwebana Centre',
        phone: '+267 72 330 908',
        staff: [
          { name: 'Kabelo M.', role: 'Owner' },
          { name: 'Nthabiseng P.', role: 'Assistant' },
        ],
        tags: ['general', 'household'],
        rating: 4.4,
        reviews: 31,
      },
      {
        slug: 'ramokgwebana-style-house',
        name: 'Ramokgwebana Style House',
        icon: '👗',
        accent: '#b04a6a',
        tagline: 'Clothes that fit the week',
        story:
          'A small fashion house with a fitting room and an alterations bench that turns a Tuesday dress into a Saturday outfit.',
        mix: 'fashion',
        aisle: 'RW2',
        area: 'Ramokgwebana',
        address: 'Shop 3, Ramokgwebana Plaza',
        phone: '+267 73 118 220',
        staff: [
          { name: 'Lesedi K.', role: 'Owner' },
          { name: 'Palesa M.', role: 'Fitting room' },
        ],
        tags: ['fashion', 'alterations'],
        rating: 4.6,
        reviews: 22,
      },
    ],
  }),

  build({
    town: 'Gabane',
    district: 'Kweneng',
    region: 'Central',
    factor: 1.02,
    hubIcon: '🌾',
    hubAccent: '#5c8a32',
    hubTagline: 'Maize country on the north bank',
    hubStory:
      'Gabane grows a good share of the country’s maize. The hub moves that crop and the hardware the farms need, in the same vans.',
    hubAddress: 'Gabane Trading Centre, Kgatleng Road',
    hubPhone: '+267 71 220 655',
    aisles: [
      { code: 'GB1', name: 'Groceries & Farm Supplies', blurb: 'Maize, oil, feed and fencing' },
      { code: 'GB2', name: 'Hardware & Garden', blurb: 'Tools, paint and irrigation' },
    ],
    shops: [
      {
        slug: 'gabane-farm-supply',
        name: 'Gabane Farm Supply',
        icon: '🚜',
        accent: '#7a9a2f',
        tagline: 'Feed, fence and tillage',
        story:
          'A farm supply counter that knows which borehole the crops need and keeps feed milled to order.',
        mix: 'farm',
        aisle: 'GB1',
        area: 'Gabane',
        address: 'Stand 9, Gabane Trading Centre',
        phone: '+267 72 440 217',
        staff: [
          { name: 'Ratlhokwa M.', role: 'Owner' },
          { name: 'Oatile J.', role: 'Feed mill' },
        ],
        tags: ['agro', 'feed', 'fencing'],
        rating: 4.5,
        reviews: 28,
      },
      {
        slug: 'gabane-hardware',
        name: 'Gabane Hardware',
        icon: '🔨',
        accent: '#4a6274',
        tagline: 'Cement, paint and the right drill bit',
        story:
          'A hardware counter for the farms around the village, with the irrigation fittings and the fence posts in stock.',
        mix: 'building',
        aisle: 'GB2',
        area: 'Gabane',
        address: 'Plot 214, Gabane Village Road',
        phone: '+267 73 660 118',
        staff: [
          { name: 'Mpho K.', role: 'Manager' },
          { name: 'Basietswe R.', role: 'Trade counter' },
        ],
        tags: ['hardware', 'build', 'tools'],
        rating: 4.4,
        reviews: 19,
      },
    ],
  }),

  build({
    town: 'Moshupa',
    district: 'Kweneng',
    region: 'Southern',
    factor: 1.03,
    hubIcon: '🏡',
    hubAccent: '#8a5aa8',
    hubTagline: 'A village with a settled high street',
    hubStory:
      'Moshupa is the bigger of the southern Kweneng villages. The hub gives its households the same catalogue the capital has.',
    hubAddress: 'Moshupa Main Road, Kweneng',
    hubPhone: '+267 72 880 340',
    aisles: [
      { code: 'MS1', name: 'Groceries & Household', blurb: 'Food, cleaning and everyday' },
      { code: 'MS2', name: 'Home & Furniture', blurb: 'Cookware, beds and appliances' },
    ],
    shops: [
      {
        slug: 'moshupa-market',
        name: 'Moshupa Market',
        icon: '🛒',
        accent: '#c08a3e',
        tagline: 'A full shop for a growing village',
        story:
          'The market stocks deep because the road is long and the nearest full supermarket is over an hour away.',
        mix: 'grocery',
        aisle: 'MS1',
        area: 'Moshupa',
        address: 'Stand 4, Moshupa Centre',
        phone: '+267 71 500 662',
        staff: [
          { name: 'Tshepo M.', role: 'Owner' },
          { name: 'Kealeboga S.', role: 'Assistant' },
        ],
        tags: ['grocery', 'village'],
        rating: 4.5,
        reviews: 34,
      },
      {
        slug: 'moshupa-home-store',
        name: 'Moshupa Home Store',
        icon: '🛋️',
        accent: '#7c6a4f',
        tagline: 'Furniture, gas and cookware',
        story:
          'A homeware shop that also keeps the gas cylinders, because that is what a household in a village runs out of first.',
        mix: 'homeware',
        aisle: 'MS2',
        area: 'Moshupa',
        address: 'Shop 7, Moshupa Plaza',
        phone: '+267 73 440 118',
        staff: [
          { name: 'Nthabiseng M.', role: 'Owner' },
          { name: 'Mpho L.', role: 'Sales' },
        ],
        tags: ['homeware', 'furniture', 'gas'],
        rating: 4.4,
        reviews: 21,
      },
    ],
  }),

  build({
    town: 'Otse',
    district: 'Kweneng',
    region: 'Southern',
    factor: 1.03,
    hubIcon: '🧺',
    hubAccent: '#b5822f',
    hubTagline: 'Between Moshupa and the capital',
    hubStory:
      'Otse sits on the route between the southern villages and Gaborone, and the hub serves both the village and the passing trade.',
    hubAddress: 'Otse Village Road, Kweneng',
    hubPhone: '+267 72 990 774',
    aisles: [
      { code: 'OT1', name: 'General Trading', blurb: 'Everyday food and household' },
      { code: 'OT2', name: 'Clothing & Fabrics', blurb: 'Ready-made, fabric and alterations' },
    ],
    shops: [
      {
        slug: 'otse-general-trading',
        name: 'Otse General Trading',
        icon: '🏪',
        accent: '#c08a3e',
        tagline: 'General trading, honestly stocked',
        story:
          'A general dealer that has been serving the road since before the tar was laid, and now lists the whole country.',
        mix: 'general',
        aisle: 'OT1',
        area: 'Otse',
        address: 'Stand 2, Otse Centre',
        phone: '+267 71 330 288',
        staff: [
          { name: 'Motsamai O.', role: 'Owner' },
          { name: 'Rudo K.', role: 'Assistant' },
        ],
        tags: ['general', 'household'],
        rating: 4.3,
        reviews: 18,
      },
      {
        slug: 'otse-fabric-house',
        name: 'Otse Fabric House',
        icon: '🧵',
        accent: '#a35a8a',
        tagline: 'Fabric, cut and sewn',
        story:
          'Fabric, sewing machines and a tailor who will copy anything you bring in.',
        mix: 'textiles',
        aisle: 'OT2',
        area: 'Otse',
        address: 'Shop 6, Otse Plaza',
        phone: '+267 73 110 447',
        staff: [
          { name: 'Mmapula F.', role: 'Owner' },
          { name: 'Nangolo T.', role: 'Tailor' },
        ],
        tags: ['textiles', 'tailoring'],
        rating: 4.5,
        reviews: 14,
      },
    ],
  }),

  build({
    town: 'Silume',
    district: 'Kweneng',
    region: 'Southern',
    factor: 1.03,
    hubIcon: '🐔',
    hubAccent: '#8a6a2f',
    hubTagline: 'Cattle and poultry country',
    hubStory:
      'Silume is a cattle and poultry area, and the hub trades in both: stock feed, veterinary supplies and the everyday groceries of the village.',
    hubAddress: 'Silume Main Road, Kweneng',
    hubPhone: '+267 72 440 905',
    aisles: [
      { code: 'SL1', name: 'Groceries', blurb: 'Household food and drinks' },
      { code: 'SL2', name: 'Farm & Poultry', blurb: 'Feed, chicks and garden' },
    ],
    shops: [
      {
        slug: 'silume-food-mart',
        name: 'Silume Food Mart',
        icon: '🛒',
        accent: '#c2793a',
        tagline: 'Groceries for the cattle posts',
        story:
          'A mart that buys in bulk when the road is open and prices for a household that shops once a month.',
        mix: 'grocery',
        aisle: 'SL1',
        area: 'Silume',
        address: 'Stand 6, Silume Centre',
        phone: '+267 71 660 442',
        staff: [
          { name: 'Bosilwane M.', role: 'Owner' },
          { name: 'Palesa T.', role: 'Assistant' },
        ],
        tags: ['grocery', 'village'],
        rating: 4.4,
        reviews: 16,
      },
      {
        slug: 'silume-poultry',
        name: 'Silume Poultry & Feed',
        icon: '🐔',
        accent: '#7a9a2f',
        tagline: 'Chicks, feed and advice',
        story:
          'Chicks arrive on the Tuesday run and the feed is milled in the village, which keeps the price honest.',
        mix: 'farm',
        aisle: 'SL2',
        area: 'Silume',
        address: 'Plot 88, Silume Farms',
        phone: '+267 73 220 771',
        staff: [
          { name: 'Kabelo P.', role: 'Owner' },
          { name: 'Mma L.', role: 'Hatchery' },
        ],
        tags: ['poultry', 'feed', 'agriculture'],
        rating: 4.6,
        reviews: 12,
      },
    ],
  }),

  build({
    town: 'Oodi',
    district: 'Kweneng',
    region: 'Central',
    factor: 1.02,
    hubIcon: '💇',
    hubAccent: '#b04a6a',
    hubTagline: 'Salons, spaza and Saturday trade',
    hubStory:
      'Oodi is a village of small traders — salons, spaza shops and a taxi rank — and the hub gives them a shared front on the platform.',
    hubAddress: 'Oodi Village Road, Kweneng',
    hubPhone: '+267 73 550 118',
    aisles: [
      { code: 'OD1', name: 'Grocery & Spaza', blurb: 'Counter goods, food and drinks' },
      { code: 'OD2', name: 'Hair & Beauty', blurb: 'Salon stock, braiding and nails' },
    ],
    shops: [
      {
        slug: 'oodi-spaza',
        name: 'Oodi Spaza',
        icon: '🏪',
        accent: '#c2793a',
        tagline: 'Counter goods, open late',
        story:
          'A spaza shop that stays open until nine and prices to the week.',
        mix: 'grocery',
        aisle: 'OD1',
        area: 'Oodi',
        address: 'Shop 2, Oodi Trading Centre',
        phone: '+267 72 110 663',
        staff: [
          { name: 'Tebogo O.', role: 'Owner' },
          { name: 'Lesedi N.', role: 'Assistant' },
        ],
        tags: ['spaza', 'household'],
        rating: 4.4,
        reviews: 24,
      },
      {
        slug: 'oodi-hair-beauty',
        name: 'Oodi Hair & Beauty',
        icon: '💇',
        accent: '#a35a8a',
        tagline: 'Salon stock and a fitting room',
        story:
          'A salon supply counter and braiding studio: relaxers, wigs, oils and a chair for the weekend rush.',
        mix: 'beauty',
        aisle: 'OD2',
        area: 'Oodi',
        address: 'Shop 8, Oodi Plaza',
        phone: '+267 73 880 225',
        staff: [
          { name: 'Amahle H.', role: 'Owner' },
          { name: 'Nandi S.', role: 'Stylist' },
        ],
        tags: ['beauty', 'hair', 'salon'],
        rating: 4.5,
        reviews: 17,
      },
    ],
  }),

  build({
    town: 'Mooka',
    district: 'Ghanzi',
    region: 'Western',
    factor: 1.1,
    hubIcon: '🐂',
    hubAccent: '#8a3b2f',
    hubTagline: 'The road west, stocked deep',
    hubStory:
      'Mooka is a cattle town on the western road. The hub holds the deep stocks a place two hundred kilometres from the next shop needs.',
    hubAddress: 'Mooka Main Road, Ghanzi',
    hubPhone: '+267 62 440 118',
    aisles: [
      { code: 'MK1', name: 'Provisions & Groceries', blurb: 'Food, water and household' },
      { code: 'MK2', name: 'Outdoor & Camp', blurb: 'Camp kit, cold chain and fuel' },
    ],
    shops: [
      {
        slug: 'mooka-trading-store',
        name: 'Mooka Trading Store',
        icon: '🏪',
        accent: '#b06a30',
        tagline: 'Deep stock for deep distances',
        story:
          'General and outdoor supply, holding cold-chain spares and enough water to fill a convoy.',
        mix: 'provisions',
        aisle: 'MK1',
        area: 'Mooka',
        address: 'Plot 120, Mooka Village Road',
        phone: '+267 62 110 902',
        staff: [
          { name: 'Anna M.', role: 'Owner' },
          { name: 'Kagiso L.', role: 'Counter' },
        ],
        tags: ['general', 'provisions'],
        rating: 4.3,
        reviews: 13,
      },
      {
        slug: 'mooka-outdoor-hire',
        name: 'Mooka Outdoor Hire',
        icon: '🏕️',
        accent: '#3f7a52',
        tagline: 'Camp gear for the pans',
        story:
          'Tents, cool boxes and camp chairs for the self-drives through the Makgadikgadi.',
        mix: 'outdoor',
        aisle: 'MK2',
        area: 'Mooka',
        address: 'Stand 3, Mooka Riverside',
        phone: '+267 63 220 447',
        staff: [
          { name: 'Dineo T.', role: 'Owner' },
          { name: 'Neo K.', role: 'Hire desk' },
        ],
        tags: ['camping', 'hire', 'outdoor'],
        rating: 4.5,
        reviews: 9,
      },
    ],
  }),

  build({
    town: 'Pitsani',
    district: 'Southern',
    region: 'Central',
    factor: 1.05,
    hubIcon: '🛒',
    hubAccent: '#c07a30',
    hubTagline: 'The market that serves the cattle posts',
    hubStory:
      'Pitsani sits on the road between Mahalapye and Palapye, and its market has always been the place the outlying posts buy their month.',
    hubAddress: 'Pitsani Main Road, Southern',
    hubPhone: '+267 71 880 336',
    aisles: [
      { code: 'PS1', name: 'Groceries & Staples', blurb: 'Monthly shopping for the posts' },
      { code: 'PS2', name: 'Butchery & Produce', blurb: 'Beef, goat and vegetables' },
    ],
    shops: [
      {
        slug: 'pitsani-market',
        name: 'Pitsani Market',
        icon: '🧺',
        accent: '#c08a3e',
        tagline: 'Built for the monthly shop',
        story:
          'A market stocked in bulk and priced in bulk, with maize milled at the back every week.',
        mix: 'grocery',
        aisle: 'PS1',
        area: 'Pitsani',
        address: 'Stand 11, Pitsani Market',
        phone: '+267 72 330 774',
        staff: [
          { name: 'Oabile P.', role: 'Owner' },
          { name: 'Ntshangasego M.', role: 'Staples' },
        ],
        tags: ['staples', 'bulk'],
        rating: 4.5,
        reviews: 26,
      },
      {
        slug: 'pitsani-butchery',
        name: 'Pitsani Butchery',
        icon: '🥩',
        accent: '#a33f3f',
        tagline: 'Beef from the ranches either side',
        story:
          'The chiller runs from four and the beef is aged before it is cut.',
        mix: 'butcher',
        aisle: 'PS2',
        area: 'Pitsani',
        address: 'Shop 4, Pitsani Meat Market',
        phone: '+267 73 550 220',
        staff: [
          { name: 'Kabelo P.', role: 'Butcher' },
          { name: 'Dineo M.', role: 'Counter' },
        ],
        tags: ['butchery', 'beef'],
        rating: 4.6,
        reviews: 15,
      },
    ],
  }),

  build({
    town: 'Sipholokwe',
    district: 'South-Central',
    region: 'Central',
    factor: 1.05,
    hubIcon: '🏪',
    hubAccent: '#2f6f8a',
    hubTagline: 'A trading centre on the Serowe road',
    hubStory:
      'Sipholokwe is the trading centre for the farms around Serowe, and the hub stocks what those farms and households need.',
    hubAddress: 'Sipholokwe Trading Centre, Serowe Road',
    hubPhone: '+267 72 110 992',
    aisles: [
      { code: 'SP1', name: 'General & Groceries', blurb: 'Food, household and school kit' },
      { code: 'SP2', name: 'Hardware & Farm', blurb: 'Tools, feed and fencing' },
    ],
    shops: [
      {
        slug: 'sipholokwe-trading-centre',
        name: 'Sipholokwe Trading Centre',
        icon: '🏪',
        accent: '#c08a3e',
        tagline: 'A general store with a farm side',
        story:
          'Groceries on one side, farm and hardware on the other, under one roof and one account.',
        mix: 'generalWide',
        aisle: 'SP1',
        area: 'Sipholokwe',
        address: 'Stand 2, Sipholokwe Trading Centre',
        phone: '+267 71 440 558',
        staff: [
          { name: 'Masego S.', role: 'Manager' },
          { name: 'Goatile T.', role: 'Buying' },
        ],
        tags: ['general', 'groceries', 'hardware'],
        rating: 4.4,
        reviews: 19,
      },
      {
        slug: 'sipholokwe-agro',
        name: 'Sipholokwe Agro',
        icon: '🌾',
        accent: '#7a9a2f',
        tagline: 'Feed, seed and fence for the farms',
        story:
          'Feed, seed and fence posts for the farms on the road, delivered to the gate.',
        mix: 'farm',
        aisle: 'SP2',
        area: 'Sipholokwe',
        address: 'Plot 441, Sipholokwe Farms',
        phone: '+267 73 220 663',
        staff: [
          { name: 'Bakale S.', role: 'Owner' },
          { name: 'Kagiso L.', role: 'Feed mill' },
        ],
        tags: ['agro', 'feed', 'fencing'],
        rating: 4.5,
        reviews: 11,
      },
    ],
  }),

  build({
    town: 'Orapa',
    district: 'North-East',
    region: 'Central',
    factor: 1.06,
    hubIcon: '💎',
    hubAccent: '#3a4f66',
    hubTagline: 'A mining town that shops in bulk',
    hubStory:
      'Orapa runs on the mine, and so does its retail. The hub carries the consumables, the hardware and the household lines the town needs.',
    hubAddress: 'Orapa Mall, Centre Road',
    hubPhone: '+267 72 550 441',
    aisles: [
      { code: 'OR1', name: 'Mining & Hardware', blurb: 'PPE, consumables and workshop stock' },
      { code: 'OR2', name: 'Groceries & General', blurb: 'Food, household and family' },
    ],
    shops: [
      {
        slug: 'orapa-mine-supply',
        name: 'Orapa Mine Supply',
        icon: '⛏️',
        accent: '#b06a30',
        tagline: 'PPE and consumables for the contractors',
        story:
          'A supplier that stocks what the mine and its contractors actually order, and knows the turnaround times.',
        mix: 'mining',
        aisle: 'OR1',
        area: 'Orapa',
        address: 'Unit 7, Orapa Industrial Park',
        phone: '+267 71 990 118',
        staff: [
          { name: 'Kabelo M.', role: 'Owner' },
          { name: 'Given T.', role: 'Counter' },
        ],
        tags: ['mining', 'ppe', 'consumables'],
        rating: 4.4,
        reviews: 15,
      },
      {
        slug: 'orapa-general-store',
        name: 'Orapa General Store',
        icon: '🛒',
        accent: '#c08a3e',
        tagline: 'Family shopping in a mining town',
        story:
          'Groceries, household and school kit for the families who work the shift roster.',
        mix: 'foodHall',
        aisle: 'OR2',
        area: 'Orapa',
        address: 'Shop 3, Orapa Mall',
        phone: '+267 73 330 774',
        staff: [
          { name: 'Rudo O.', role: 'Manager' },
          { name: 'Goatile N.', role: 'Assistant' },
        ],
        tags: ['groceries', 'household'],
        rating: 4.5,
        reviews: 28,
      },
    ],
  }),

  build({
    town: 'Tutume',
    district: 'North-East',
    region: 'Eastern',
    factor: 1.05,
    hubIcon: '🌾',
    hubAccent: '#7a9a2f',
    hubTagline: 'Cattle and crops, north of Tsumeb',
    hubStory:
      'Tutume is a mixed farming area, and the hub trades in both: stock feed, seed and a full household shop.',
    hubAddress: 'Tutume Village Road, North-East',
    hubPhone: '+267 72 440 883',
    aisles: [
      { code: 'TT1', name: 'Groceries & Household', blurb: 'Food, cleaning and everyday' },
      { code: 'TT2', name: 'Farm & Garden', blurb: 'Feed, seed and garden' },
    ],
    shops: [
      {
        slug: 'tutume-general-store',
        name: 'Tutume General Store',
        icon: '🏪',
        accent: '#c08a3e',
        tagline: 'The shop the whole district uses',
        story:
          'A general store that keeps the shelf full between the road deliveries.',
        mix: 'general',
        aisle: 'TT1',
        area: 'Tutume',
        address: 'Stand 5, Tutume Centre',
        phone: '+267 71 220 447',
        staff: [
          { name: 'Themba T.', role: 'Owner' },
          { name: 'Mpho S.', role: 'Assistant' },
        ],
        tags: ['general', 'household'],
        rating: 4.4,
        reviews: 20,
      },
      {
        slug: 'tutume-agro',
        name: 'Tutume Agro',
        icon: '🚜',
        accent: '#7a9a2f',
        tagline: 'Feed, seed and fence posts',
        story:
          'Feed milled in the village and fence posts for the cattle posts on the floodplain.',
        mix: 'farm',
        aisle: 'TT2',
        area: 'Tutume',
        address: 'Plot 220, Tutume Farms',
        phone: '+267 73 660 118',
        staff: [
          { name: 'Mogale T.', role: 'Owner' },
          { name: 'Rona M.', role: 'Feed mill' },
        ],
        tags: ['agro', 'feed'],
        rating: 4.5,
        reviews: 10,
      },
    ],
  }),

  build({
    town: 'Berea',
    district: 'North-East',
    region: 'Central',
    factor: 1.06,
    hubIcon: '🏪',
    hubAccent: '#4a6274',
    hubTagline: 'The crossroads on the north road',
    hubStory:
      'Berea is where the north road meets the Zambezi road, and the hub serves the passing trade as much as the village.',
    hubAddress: 'Berea Junction, North Road',
    hubPhone: '+267 72 880 552',
    aisles: [
      { code: 'BE1', name: 'General & Provisions', blurb: 'Food, household and road supplies' },
      { code: 'BE2', name: 'Hardware & Auto', blurb: 'Tools, spares and tyres' },
    ],
    shops: [
      {
        slug: 'berea-trading-store',
        name: 'Berea Trading Store',
        icon: '🏪',
        accent: '#b06a30',
        tagline: 'Stocked for the road and the village',
        story:
          'A trading store that keeps fuel, food and the parts a vehicle needs between towns.',
        mix: 'provisions',
        aisle: 'BE1',
        area: 'Berea',
        address: 'Plot 88, Berea Junction',
        phone: '+267 71 330 991',
        staff: [
          { name: 'Oarabile B.', role: 'Owner' },
          { name: 'Mma K.', role: 'Counter' },
        ],
        tags: ['general', 'provisions', 'roadside'],
        rating: 4.3,
        reviews: 14,
      },
      {
        slug: 'berea-auto-spares',
        name: 'Berea Auto Spares',
        icon: '🔧',
        accent: '#3a4f66',
        tagline: 'Spares, tyres and a fitting bay',
        story:
          'Tyres, filters and a fitting bay for the trucks that run the Zambezi road.',
        mix: 'autoTyres',
        aisle: 'BE2',
        area: 'Berea',
        address: 'Shop 6, Berea Auto Centre',
        phone: '+267 73 440 220',
        staff: [
          { name: 'Tshepo B.', role: 'Owner' },
          { name: 'Gift S.', role: 'Fitter' },
        ],
        tags: ['spares', 'tyres'],
        rating: 4.4,
        reviews: 11,
      },
    ],
  }),

  build({
    town: 'Kazungula',
    district: 'North-West',
    region: 'Chobe',
    factor: 1.17,
    hubIcon: '🦆',
    hubAccent: '#2b7d9a',
    hubTagline: 'Where the road meets the river',
    hubStory:
      'Kazungula is the border crossing, and the most expensive freight in the country to serve. The hub is small, focused and honest about what it can hold.',
    hubAddress: 'Kazungula Border Village, Kasane Road',
    hubPhone: '+267 62 330 774',
    aisles: [
      { code: 'KZ1', name: 'Provisions & Fuel', blurb: 'Food, fuel and cold chain' },
      { code: 'KZ2', name: 'Crafts & Curios', blurb: 'Beadwork, wood and river trade' },
    ],
    shops: [
      {
        slug: 'kazungula-provisions',
        name: 'Kazungula Provisions',
        icon: '🛒',
        accent: '#b06a30',
        tagline: 'What the road needs, and no more',
        story:
          'A provisions stop for the crossing, with fuel, cold chain and the food a traveller needs in one place.',
        mix: 'provisions',
        aisle: 'KZ1',
        area: 'Kazungula',
        address: 'Plot 14, Kazungula Village',
        phone: '+267 62 110 442',
        staff: [
          { name: 'Clement K.', role: 'Owner' },
          { name: 'Anna T.', role: 'Counter' },
        ],
        tags: ['provisions', 'fuel', 'roadside'],
        rating: 4.3,
        reviews: 12,
      },
      {
        slug: 'kazungula-river-craft',
        name: 'Kazungula River Craft',
        icon: '📿',
        accent: '#a35a8a',
        tagline: 'Beads and wood from the river communities',
        story:
          'Every piece names the maker, and the price is set by the co-operative, not the shop.',
        mix: 'crafts',
        aisle: 'KZ2',
        area: 'Kazungula',
        address: 'Stand 2, Kazungula Craft Market',
        phone: '+267 63 550 118',
        staff: [
          { name: 'Masiwa R.', role: 'Co-operative lead' },
          { name: 'Sarah N.', role: 'Maker liaison' },
        ],
        tags: ['craft', 'curios', 'riverside'],
        rating: 4.7,
        reviews: 15,
      },
    ],
  }),

  build({
    town: 'Gweta',
    district: 'North-West',
    region: 'Central',
    factor: 1.14,
    hubIcon: '🏕️',
    hubAccent: '#2f7f6a',
    hubTagline: 'Halfway to the delta',
    hubStory:
      'Gweta is a stop on the road to the Makgadikgadi, and the hub serves the camp operators and the families in between.',
    hubAddress: 'Gweta Village Road, North-West',
    hubPhone: '+267 62 770 336',
    aisles: [
      { code: 'GW1', name: 'General Trading', blurb: 'Food, household and road supplies' },
      { code: 'GW2', name: 'Camp & Outdoor', blurb: 'Tents, cool boxes and navigation' },
    ],
    shops: [
      {
        slug: 'gweta-trading-store',
        name: 'Gweta Trading Store',
        icon: '🏪',
        accent: '#b06a30',
        tagline: 'The last full shop before the pans',
        story:
          'General trading and cold chain for the camps that start their runs from here.',
        mix: 'provisions',
        aisle: 'GW1',
        area: 'Gweta',
        address: 'Stand 7, Gweta Village Road',
        phone: '+267 62 220 991',
        staff: [
          { name: 'Benedict G.', role: 'Owner' },
          { name: 'Naledi M.', role: 'Counter' },
        ],
        tags: ['general', 'provisions'],
        rating: 4.3,
        reviews: 9,
      },
      {
        slug: 'gweta-camp-supply',
        name: 'Gweta Camp Supply',
        icon: '🏕️',
        accent: '#3f7a52',
        tagline: 'Camp kit for the pans',
        story:
          'Tents, cool boxes and camp chairs, checked and serviced after every hire.',
        mix: 'outdoor',
        aisle: 'GW2',
        area: 'Gweta',
        address: 'Stand 3, Gweta Riverside',
        phone: '+267 63 110 447',
        staff: [
          { name: 'Neo G.', role: 'Owner' },
          { name: 'Dineo L.', role: 'Hire desk' },
        ],
        tags: ['camping', 'hire', 'outdoor'],
        rating: 4.5,
        reviews: 8,
      },
    ],
  }),

  build({
    town: 'Shakawe',
    district: 'North-West',
    region: 'Western',
    factor: 1.15,
    hubIcon: '🐟',
    hubAccent: '#2b6a8a',
    hubTagline: 'Deep water, deep stock',
    hubStory:
      'Shakawe is a fishing town on the western edge of the delta, and the hub trades in tackle, cold chain and the daily shop.',
    hubAddress: 'Shakawe Village Road, North-West',
    hubPhone: '+267 62 990 552',
    aisles: [
      { code: 'SH1', name: 'Fishing & Tackle', blurb: 'Rods, reels, bait and safety' },
      { code: 'SH2', name: 'General Store', blurb: 'Food, household and cold chain' },
    ],
    shops: [
      {
        slug: 'shakawe-tackle-shop',
        name: 'Shakawe Tackle Shop',
        icon: '🎣',
        accent: '#2b6a8a',
        tagline: 'Tackle that has been in the water',
        story:
          'Rigs and lures tested on the lake, plus the safety gear every boat needs.',
        mix: 'fishing',
        aisle: 'SH1',
        area: 'Shakawe',
        address: 'Stand 4, Shakawe Lakeside',
        phone: '+267 63 880 221',
        staff: [
          { name: 'Big Dan', role: 'Owner' },
          { name: 'Amogelang S.', role: 'Tackle' },
        ],
        tags: ['fishing', 'tackle'],
        rating: 4.7,
        reviews: 13,
      },
      {
        slug: 'shakawe-general-store',
        name: 'Shakawe General Store',
        icon: '🏪',
        accent: '#c08a3e',
        tagline: 'Everyday goods and cold chain',
        story:
          'A general store with the cold chain that the fishing camps and the families both rely on.',
        mix: 'general',
        aisle: 'SH2',
        area: 'Shakawe',
        address: 'Stand 1, Shakawe Village Road',
        phone: '+267 62 440 118',
        staff: [
          { name: 'Kagiso S.', role: 'Owner' },
          { name: 'Mma L.', role: 'Assistant' },
        ],
        tags: ['general', 'cold-chain'],
        rating: 4.4,
        reviews: 11,
      },
    ],
  }),

  build({
    town: 'Durabans',
    district: 'North-West',
    region: 'Western',
    factor: 1.16,
    hubIcon: '🪵',
    hubAccent: '#a35a8a',
    hubTagline: 'A craft village on the pan road',
    hubStory:
      'Durabans makes its living from carving and weaving, and the hub is where the pieces are finished, priced and sold.',
    hubAddress: 'Durabans Village Road, North-West',
    hubPhone: '+267 62 330 663',
    aisles: [
      { code: 'DU1', name: 'Craft & Carving', blurb: 'Wood, beadwork and cloth' },
      { code: 'DU2', name: 'Lodge Supply', blurb: 'Camp goods for the lodges' },
    ],
    shops: [
      {
        slug: 'durabans-carving-works',
        name: 'Durabans Carving Works',
        icon: '🪵',
        accent: '#a35a8a',
        tagline: 'Mopane, carved and finished here',
        story:
          'The carvers work in the back and the shop sells what leaves the bench that morning.',
        mix: 'crafts',
        aisle: 'DU1',
        area: 'Durabans',
        address: 'Stand 2, Durabans Craft Yard',
        phone: '+267 63 440 775',
        staff: [
          { name: 'Kato D.', role: 'Owner' },
          { name: 'Masego P.', role: 'Carver' },
        ],
        tags: ['craft', 'carving', 'wood'],
        rating: 4.8,
        reviews: 16,
      },
      {
        slug: 'durabans-lodge-supply',
        name: 'Durabans Lodge Supply',
        icon: '🏕️',
        accent: '#3f7a52',
        tagline: 'Camp goods for the lodges',
        story:
          'Cool boxes, camp chairs and field kit for the lodges around the pan.',
        mix: 'lodge',
        aisle: 'DU2',
        area: 'Durabans',
        address: 'Plot 4, Durabans Road',
        phone: '+267 62 110 330',
        staff: [
          { name: 'Solomon D.', role: 'Owner' },
          { name: 'Kelebone M.', role: 'Counter' },
        ],
        tags: ['lodge', 'camp', 'outdoor'],
        rating: 4.5,
        reviews: 7,
      },
    ],
  }),

  build({
    town: 'Mababe',
    district: 'Kgalagadi',
    region: 'Western',
    factor: 1.13,
    hubIcon: '🏪',
    hubAccent: '#8a6a2f',
    hubTagline: 'A cattle town on the western line',
    hubStory:
      'Mababe trades in cattle and serves the ranches out towards the border, with a shop and a yard for both.',
    hubAddress: 'Mababe Village Road, Kgalagadi',
    hubPhone: '+267 62 550 441',
    aisles: [
      { code: 'MB1', name: 'General & Hardware', blurb: 'Food, household and tools' },
      { code: 'MB2', name: 'Farm Supplies', blurb: 'Feed, salt and fencing' },
    ],
    shops: [
      {
        slug: 'mababe-trading-store',
        name: 'Mababe Trading Store',
        icon: '🏪',
        accent: '#c08a3e',
        tagline: 'The shop the ranches buy from',
        story:
          'General trading with the feed and fencing the cattle posts need, delivered to the yard.',
        mix: 'generalWide',
        aisle: 'MB1',
        area: 'Mababe',
        address: 'Stand 6, Mababe Centre',
        phone: '+267 71 880 221',
        staff: [
          { name: 'Mogae M.', role: 'Owner' },
          { name: 'Kealeboga T.', role: 'Assistant' },
        ],
        tags: ['general', 'hardware'],
        rating: 4.4,
        reviews: 10,
      },
      {
        slug: 'mababe-agro',
        name: 'Mababe Agro',
        icon: '🐄',
        accent: '#7a9a2f',
        tagline: 'Stock feed and salt for the ranches',
        story:
          'Feed, salt lick and fencing delivered on the cattle run.',
        mix: 'farm',
        aisle: 'MB2',
        area: 'Mababe',
        address: 'Plot 300, Mababe Farms',
        phone: '+267 73 110 774',
        staff: [
          { name: 'Pakiso M.', role: 'Owner' },
          { name: 'Modesto L.', role: 'Feed' },
        ],
        tags: ['agro', 'feed', 'cattle'],
        rating: 4.5,
        reviews: 8,
      },
    ],
  }),

  build({
    town: 'Good Hope',
    district: 'South-East',
    region: 'Southern',
    factor: 1.06,
    hubIcon: '👗',
    hubAccent: '#8a5aa8',
    hubTagline: 'The southern corridor, properly stocked',
    hubStory:
      'Good Hope is the trading centre between Gaborone and Kanye, and the hub serves both villages and the farms between them.',
    hubAddress: 'Good Hope Trading Centre, Kanye Road',
    hubPhone: '+267 72 330 552',
    aisles: [
      { code: 'GH1', name: 'Groceries & Household', blurb: 'Food, cleaning and everyday' },
      { code: 'GH2', name: 'Clothing & Fabrics', blurb: 'Ready-made, fabric and shoes' },
    ],
    shops: [
      {
        slug: 'good-hope-market',
        name: 'Good Hope Market',
        icon: '🛒',
        accent: '#c08a3e',
        tagline: 'Monthly shopping for the corridor',
        story:
          'A market that buys deep when the road is open and prices for households that shop once a month.',
        mix: 'grocery',
        aisle: 'GH1',
        area: 'Good Hope',
        address: 'Stand 9, Good Hope Trading Centre',
        phone: '+267 71 550 118',
        staff: [
          { name: 'Oatile G.', role: 'Owner' },
          { name: 'Ntshingila M.', role: 'Assistant' },
        ],
        tags: ['groceries', 'corridor'],
        rating: 4.5,
        reviews: 21,
      },
      {
        slug: 'good-hope-clothing',
        name: 'Good Hope Clothing',
        icon: '👗',
        accent: '#b04a6a',
        tagline: 'Ready-made, shoes and fabric',
        story:
          'Clothing for the farms and the villages, with an alterations bench and fabric for the rest.',
        mix: 'fashion',
        aisle: 'GH2',
        area: 'Good Hope',
        address: 'Shop 5, Good Hope Plaza',
        phone: '+267 73 660 441',
        staff: [
          { name: 'Mpho G.', role: 'Owner' },
          { name: 'Nthabiseng K.', role: 'Tailor' },
        ],
        tags: ['fashion', 'footwear'],
        rating: 4.4,
        reviews: 13,
      },
    ],
  }),

  build({
    town: 'Tswapong',
    district: 'South-East',
    region: 'Southern',
    factor: 1.05,
    hubIcon: '🐔',
    hubAccent: '#7a9a2f',
    hubTagline: 'Poultry, maize and the road home',
    hubStory:
      'Tswapong is a farming area an hour from the capital, and the hub trades in feed, seed and the household shop.',
    hubAddress: 'Tswapong Village Road, South-East',
    hubPhone: '+267 72 880 663',
    aisles: [
      { code: 'TS1', name: 'General Trading', blurb: 'Food, household and school kit' },
      { code: 'TS2', name: 'Farm & Poultry', blurb: 'Feed, chicks and garden' },
    ],
    shops: [
      {
        slug: 'tswapong-trading',
        name: 'Tswapong Trading',
        icon: '🏪',
        accent: '#c08a3e',
        tagline: 'The village shop, properly stocked',
        story:
          'A general store with the national catalogue and a delivery van that runs the corridor daily.',
        mix: 'general',
        aisle: 'TS1',
        area: 'Tswapong',
        address: 'Stand 3, Tswapong Centre',
        phone: '+267 71 990 118',
        staff: [
          { name: 'Goatile T.', role: 'Owner' },
          { name: 'Mma T.', role: 'Assistant' },
        ],
        tags: ['general', 'village'],
        rating: 4.4,
        reviews: 17,
      },
      {
        slug: 'tswapong-poultry',
        name: 'Tswapong Poultry',
        icon: '🐔',
        accent: '#7a9a2f',
        tagline: 'Chicks and feed on the Tuesday run',
        story: 'Poultry and garden supply, with the feed milled on site.',
        mix: 'farm',
        aisle: 'TS2',
        area: 'Tswapong',
        address: 'Plot 118, Tswapong Farms',
        phone: '+267 73 220 336',
        staff: [
          { name: 'Kagiso T.', role: 'Owner' },
          { name: 'Kealeboga M.', role: 'Hatchery' },
        ],
        tags: ['poultry', 'feed'],
        rating: 4.5,
        reviews: 9,
      },
    ],
  }),

  build({
    town: 'Sowa',
    district: 'Central',
    region: 'Central',
    factor: 1.03,
    hubIcon: '🏪',
    hubAccent: '#c07a30',
    hubTagline: 'One hour from the capital, a world away from its prices',
    hubStory:
      'Sowa is a fast-growing village on the Kanye road, and the hub gives its households the same catalogue the capital has.',
    hubAddress: 'Sowa Village Road, Central',
    hubPhone: '+267 72 110 992',
    aisles: [
      { code: 'SO1', name: 'Groceries & Household', blurb: 'Food, cleaning and everyday' },
      { code: 'SO2', name: 'Mobile & Accessories', blurb: 'Handsets, data and spares' },
    ],
    shops: [
      {
        slug: 'sowa-market',
        name: 'Sowa Market',
        icon: '🛒',
        accent: '#c08a3e',
        tagline: 'A village market with a national shelf',
        story:
          'A market that stocks the essentials and now the whole Junction catalogue alongside them.',
        mix: 'grocery',
        aisle: 'SO1',
        area: 'Sowa',
        address: 'Stand 4, Sowa Centre',
        phone: '+267 71 660 774',
        staff: [
          { name: 'Lesedi S.', role: 'Owner' },
          { name: 'Tshepo M.', role: 'Assistant' },
        ],
        tags: ['groceries', 'village'],
        rating: 4.4,
        reviews: 23,
      },
      {
        slug: 'sowa-mobile-world',
        name: 'Sowa Mobile World',
        icon: '📱',
        accent: '#3f6fd0',
        tagline: 'Handsets, data and repairs',
        story:
          'A counter that sells the phones, does the repairs and knows which data bundle is worth the money.',
        mix: 'mobile',
        aisle: 'SO2',
        area: 'Sowa',
        address: 'Shop 2, Sowa Plaza',
        phone: '+267 73 440 552',
        staff: [
          { name: 'Boitumelo S.', role: 'Owner' },
          { name: 'Amos M.', role: 'Repairs' },
        ],
        tags: ['mobile', 'data', 'repairs'],
        rating: 4.5,
        reviews: 15,
      },
    ],
  }),

  build({
    town: 'Mmabatho',
    district: 'Central',
    region: 'North-West',
    factor: 1.02,
    hubIcon: '🛍️',
    hubAccent: '#b04a6a',
    hubTagline: 'The metro edge gets its own pavilion',
    hubStory:
      'Mmabatho sits on the north-west edge of the Gaborone boundary, and the hub serves a dense, young market that shops on the phone.',
    hubAddress: 'Mmabatho Complex, Kgatleng Road',
    hubPhone: '+267 72 550 774',
    aisles: [
      { code: 'MM1', name: 'Groceries & Spaza', blurb: 'Food, drinks and household' },
      { code: 'MM2', name: 'Fashion & Beauty', blurb: 'Clothing, hair and accessories' },
    ],
    shops: [
      {
        slug: 'mmabatho-fresh-mart',
        name: 'Mmabatho Fresh Mart',
        icon: '🛒',
        accent: '#c2793a',
        tagline: 'Fast, cheap and open late',
        story: 'A neighbourhood mart that stays open until nine and prices to the week.',
        mix: 'grocery',
        aisle: 'MM1',
        area: 'Mmabatho',
        address: 'Shop 11, Mmabatho Complex',
        phone: '+267 71 880 336',
        staff: [
          { name: 'Tebogo M.', role: 'Owner' },
          { name: 'Boitumelo K.', role: 'Assistant' },
        ],
        tags: ['groceries', 'township'],
        rating: 4.4,
        reviews: 29,
      },
      {
        slug: 'mmabatho-style-hub',
        name: 'Mmabatho Style Hub',
        icon: '👗',
        accent: '#b04a6a',
        tagline: 'Fitting, styling and alterations',
        story: 'A fashion house with a full tailoring bench behind it.',
        mix: 'fashion',
        aisle: 'MM2',
        area: 'Mmabatho',
        address: 'Shop 6, Mmabatho Complex',
        phone: '+267 73 330 221',
        staff: [
          { name: 'Amahle M.', role: 'Owner' },
          { name: 'Naledi P.', role: 'Tailor' },
        ],
        tags: ['fashion', 'tailoring'],
        rating: 4.5,
        reviews: 19,
      },
    ],
  }),

  build({
    town: 'Matsieng',
    district: 'North-East',
    region: 'Eastern',
    factor: 1.05,
    hubIcon: '📱',
    hubAccent: '#3f6fd0',
    hubTagline: 'A village with a mobile counter',
    hubStory:
      'Matsieng is a village north-east of Gaborone with a young, mobile-first market, and the hub trades on that basis.',
    hubAddress: 'Matsieng Village Road, North-East',
    hubPhone: '+267 72 440 995',
    aisles: [
      { code: 'MT1', name: 'General & Groceries', blurb: 'Everyday food and household' },
      { code: 'MT2', name: 'Mobile & Data', blurb: 'Handsets, airtime and repairs' },
    ],
    shops: [
      {
        slug: 'matsieng-general-store',
        name: 'Matsieng General Store',
        icon: '🏪',
        accent: '#c08a3e',
        tagline: 'The village store, fully stocked',
        story: 'A general store with deep stock and a delivery van on the village road.',
        mix: 'general',
        aisle: 'MT1',
        area: 'Matsieng',
        address: 'Stand 3, Matsieng Centre',
        phone: '+267 71 220 663',
        staff: [
          { name: 'Molefi M.', role: 'Owner' },
          { name: 'Nthabiseng T.', role: 'Assistant' },
        ],
        tags: ['general', 'village'],
        rating: 4.4,
        reviews: 18,
      },
      {
        slug: 'matsieng-mobile-world',
        name: 'Matsieng Mobile World',
        icon: '📱',
        accent: '#3f6fd0',
        tagline: 'Handsets, airtime and repairs',
        story: 'A counter that sells, repairs and tops up.',
        mix: 'mobile',
        aisle: 'MT2',
        area: 'Matsieng',
        address: 'Shop 4, Matsieng Plaza',
        phone: '+267 73 550 336',
        staff: [
          { name: 'Kabelo M.', role: 'Owner' },
          { name: 'Patience S.', role: 'Repairs' },
        ],
        tags: ['mobile', 'data'],
        rating: 4.5,
        reviews: 12,
      },
    ],
  }),
]
