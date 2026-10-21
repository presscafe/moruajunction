/* ------------------------------------------------------------------ *
 * Morua Junction — the national catalogue.
 *
 * One library of real Botswana shelf lines, shared by every shop in every
 * town. A shop lists a mix of these; the same line in two towns carries
 * the same identity, which is what lets Price Guard compare prices across
 * the country and Land Local compare a local shelf against an import.
 *
 * Prices are in Pula. `zar` is the South African shelf price, so the
 * landed-cost engine has something honest to compare against.
 * ------------------------------------------------------------------ */

export interface CatalogueItem {
  name: string
  blurb: string
  price: number
  zar: number
  kg: number
  icon: string
  stock: number
  category: string
  duty: number
  unit: string
}

export const CATEGORIES = [
  'Groceries & Staples',
  'Fresh Produce & Butchery',
  'Bakery & Deli',
  'Beverages & Cellar',
  'Home & Kitchen',
  'Household & Cleaning',
  'Health & Beauty',
  'Fashion',
  'Footwear',
  'Bags & Accessories',
  'Jewellery & Gifts',
  'Mobile & Tablets',
  'Audio & TV',
  'Computing & Gaming',
  'Accessories',
  'Motor Spares',
  'Mining & Industrial',
  'Farm & Poultry',
  'Tourism & Safari',
  'Fishing & Outdoor',
  'Curios & Crafts',
  'Stationery & Office',
  'Furniture & Appliances',
  'Sports & Fitness',
  'Baby & Kids',
  'Garden & Plants',
  'Auto Care & Tyres',
  'Electrical',
  'Hardware & DIY',
  'Provisions & Fuel',
] as const

type Row = [
  string,
  string,
  string,
  number,
  number,
  number,
  string,
  number,
  string,
  number?,
  string?,
]

const rows: Row[] = [
  // ---------------------------------------------------------- groceries
  ['maize-10kg', 'Maize meal 10kg', 'Stone-ground, packed this week', 165, 118, 10, '🌽', 45, 'Groceries & Staples'],
  ['maize-50kg', 'Maize meal 50kg', 'The wholesaler sack, graded', 690, 495, 50, '🌽', 12, 'Groceries & Staples'],
  ['maize-2kg', 'Maize meal 2kg', 'Household pack', 42, 32, 2, '🌽', 60, 'Groceries & Staples'],
  ['rice-1kg', 'Rice 1kg', 'Long grain parboiled', 24, 19, 1, '🍚', 70, 'Groceries & Staples'],
  ['rice-5kg', 'Rice 5kg', 'Family size', 96, 78, 5, '🍚', 36, 'Groceries & Staples'],
  ['maizemeal-pasta', 'Pasta 1kg', 'Bronze-cut durum', 38, 32, 1, '🍝', 48, 'Groceries & Staples'],
  ['oil-5l', 'Cooking oil 5L', 'Sunflower, locally blended', 288, 235, 5.4, '🫗', 22, 'Groceries & Staples'],
  ['oil-1l', 'Cooking oil 1L', 'Everyday bottle', 68, 55, 1.05, '🫗', 60, 'Groceries & Staples'],
  ['oil-750ml', 'Cooking oil 750ml', 'Small household', 52, 44, 0.85, '🫗', 44, 'Groceries & Staples'],
  ['sugar-2kg', 'Sugar 2kg', 'Fine-grade white sugar', 78, 62, 2, '🧂', 44, 'Groceries & Staples'],
  ['sugar-1kg', 'Sugar 1kg', 'Everyday bag', 42, 35, 1, '🧂', 55, 'Groceries & Staples'],
  ['salt-1kg', 'Table salt 1kg', 'Fine sea salt', 24, 19, 1, '🧂', 70, 'Groceries & Staples'],
  ['flour-2kg', 'Flour 2kg', 'Stone-milled wheat', 58, 48, 2, '🌾', 40, 'Groceries & Staples'],
  ['beans-tin', 'Tinned beans 400g', 'Mixed beans in brine', 22, 17, 0.4, '🥫', 90, 'Groceries & Staples'],
  ['beef-tin', 'Tinned beef 400g', 'Lean, in gravy', 58, 55, 0.4, '🥫', 36, 'Groceries & Staples'],
  ['tomato-tin', 'Tinned tomatoes 400g', 'Whole, in juice', 26, 21, 0.4, '🥫', 60, 'Groceries & Staples'],
  ['soup-tin', 'Soup 400g', 'Chicken and veg', 34, 30, 0.4, '🥫', 44, 'Groceries & Staples'],
  ['milo-1kg', 'Milo 1kg', 'Malt drink, 25 servings', 185, 165, 1.1, '☕', 20, 'Groceries & Staples'],
  ['tea-500g', 'Tea 500g', 'Black leaf, 100 bags', 145, 128, 0.5, '🍵', 26, 'Groceries & Staples'],
  ['coffee-500g', 'Coffee 500g', 'Ground, medium roast', 320, 290, 0.5, '☕', 18, 'Groceries & Staples'],
  ['honey-1kg', 'Honey 1kg', 'Wild bush honey', 210, 185, 1.2, '🍯', 12, 'Groceries & Staples'],
  ['peanut-butter', 'Peanut butter 1kg', 'Crunchy, no palm', 115, 98, 1.05, '🥜', 22, 'Groceries & Staples'],
  ['canned-tomato-puree', 'Tomato puree 800g', 'Tinned, 8 servings', 48, 40, 0.82, '🥫', 34, 'Groceries & Staples'],
  ['cereal-500g', 'Cereal 500g', 'Corn flakes, family box', 96, 82, 0.5, '🥣', 26, 'Groceries & Staples'],
  ['biscuits-tin', 'Biscuits, 500g tin', 'Family assortment', 72, 62, 0.5, '🍪', 30, 'Groceries & Staples'],
  ['spread-jar', 'Margarine 1kg', 'Soft spread tub', 88, 76, 1, '🧈', 28, 'Groceries & Staples'],
  ['pasta-noodles', 'Instant noodles, 5 pack', 'Beef and chicken', 48, 42, 0.5, '🍜', 50, 'Groceries & Staples'],
  ['baby-spinach', 'Spinach portion 250g', 'Washed, ready to cook', 22, 20, 0.25, '🥬', 40, 'Groceries & Staples'],

  // ------------------------------------------------- produce & butchery
  ['tomato-1kg', 'Tomatoes 1kg', 'Vine-ripened, picked yesterday', 22, 28, 1, '🍅', 40, 'Fresh Produce & Butchery'],
  ['tomato-2kg', 'Tomatoes 2kg', 'Family pack', 42, 52, 2, '🍅', 30, 'Fresh Produce & Butchery'],
  ['onion-5kg', 'Onions 5kg', 'Medium size, cured', 58, 52, 5, '🧅', 30, 'Fresh Produce & Butchery'],
  ['onion-1kg', 'Onions 1kg', 'Salad onions', 14, 13, 1, '🧅', 45, 'Fresh Produce & Butchery'],
  ['sweets-2kg', 'Sweets 2.5kg', 'Mixed, sorted grade', 45, 38, 2.5, '🍠', 35, 'Fresh Produce & Butchery'],
  ['potato-5kg', 'Potatoes 5kg', 'Chipping variety', 62, 55, 5, '🥔', 32, 'Fresh Produce & Butchery'],
  ['carrot-1kg', 'Carrots 1kg', 'Washed, bunched', 18, 16, 1, '🥕', 40, 'Fresh Produce & Butchery'],
  ['cabbage-2kg', 'Cabbage 2kg', 'Green, tight heads', 28, 25, 2, '🥬', 25, 'Fresh Produce & Butchery'],
  ['spinach-bunch', 'Spinach bunch', 'Washed and trimmed', 12, 11, 0.2, '🥬', 50, 'Fresh Produce & Butchery'],
  ['avocado-each', 'Avocado', 'Hass, ready in two days', 18, 16, 0.25, '🥑', 55, 'Fresh Produce & Butchery'],
  ['lemon-kg', 'Lemons 1kg', 'Squeezed grade', 26, 22, 1, '🍋', 34, 'Fresh Produce & Butchery'],
  ['green-pepper', 'Green peppers, 4 pack', 'Thick walled', 24, 20, 0.6, '🫑', 30, 'Fresh Produce & Butchery'],
  ['eggs-30', 'Eggs, tray of 30', 'Free-range grade A', 98, 92, 1.8, '🥚', 28, 'Fresh Produce & Butchery'],
  ['eggs-60', 'Eggs, tray of 60', 'Wholesale grade A', 186, 172, 3.6, '🥚', 14, 'Fresh Produce & Butchery'],
  ['beef-1kg', 'Beef rump 1kg', 'Boned, aged 5 days', 148, 165, 1, '🥩', 18, 'Fresh Produce & Butchery'],
  ['beef-steak', 'Beef sirloin steak', 'Butchered to order', 195, 215, 1, '🥩', 12, 'Fresh Produce & Butchery'],
  ['chicken-2kg', 'Whole chicken 2kg', 'Free-range, dressed', 96, 88, 2, '🍗', 26, 'Fresh Produce & Butchery'],
  ['goat-1kg', 'Goat meat 1kg', 'Butchered to order', 132, 140, 1, '🍖', 14, 'Fresh Produce & Butchery'],
  ['chicken-1kg', 'Chicken pieces 1kg', 'Mixed drumstick and thigh', 62, 58, 1, '🍗', 22, 'Fresh Produce & Butchery'],
  ['wors-500g', 'Boerewors 500g', 'Coarse, 20% fat', 68, 72, 0.5, '🌭', 24, 'Fresh Produce & Butchery'],
  ['biltong-250g', 'Biltong 250g', 'Air-dried, traditional', 95, 88, 0.25, '🥩', 18, 'Fresh Produce & Butchery'],
  ['milk-2l', 'Fresh milk 2L', 'Pasteurised, full cream', 38, 36, 2.06, '🥛', 45, 'Fresh Produce & Butchery'],
  ['yoghurt-1l', 'Yoghurt 1L', 'Plain, set thick', 42, 40, 1.05, '🥣', 30, 'Fresh Produce & Butchery'],
  ['cheese-500g', 'Cheddar cheese 500g', 'Aged 12 months', 115, 105, 0.5, '🧀', 20, 'Fresh Produce & Butchery'],
  ['butter-500g', 'Butter 500g', 'Churned, salted', 72, 68, 0.5, '🧈', 26, 'Fresh Produce & Butchery'],

  // ------------------------------------------------------------- bakery
  ['bread-brown', 'Brown bread loaf', 'Baked at 05:00', 19, 17, 0.6, '🍞', 44, 'Bakery & Deli'],
  ['bread-white', 'White bread loaf', 'Soft-crumb sliced', 17, 15, 0.6, '🍞', 50, 'Bakery & Deli'],
  ['bread-wholemeal', 'Wholemeal bread', 'Stone-ground, seeded', 22, 20, 0.65, '🍞', 32, 'Bakery & Deli'],
  ['bread-rusks', 'Rusks, 500g pack', 'Twice-baked', 48, 44, 0.5, '🍘', 26, 'Bakery & Deli'],
  ['cake-8', 'Celebration cake, 8 inch', 'Two tiers, iced to order', 340, 330, 2.4, '🎂', 6, 'Bakery & Deli'],
  ['cake-slices', 'Cake slices, box of 6', 'Vanilla, cream filling', 180, 172, 1.2, '🍰', 8, 'Bakery & Deli'],
  ['pies-4', 'Beef pies, pack of 4', 'Baked in the morning', 46, 42, 0.8, '🥧', 20, 'Bakery & Deli'],
  ['sausage-rolls-4', 'Sausage rolls, pack of 4', 'Crisp pastry, beef', 42, 38, 0.7, '🥮', 18, 'Bakery & Deli'],
  ['scones-4', 'Scones, pack of 4', 'Baked on the hour', 38, 34, 0.6, '🧁', 16, 'Bakery & Deli'],
  ['kgatekga', 'Kgatekga, 4 pieces', 'Fried dough with beef', 55, 50, 0.9, '🥟', 18, 'Bakery & Deli'],
  ['kgatlhokwa', 'Kgatlhokwa, 6 pieces', 'Sesame and peanut', 38, 34, 0.6, '🍘', 22, 'Bakery & Deli'],
  ['sourdough', 'Sourdough loaf', 'Slow fermented, 36 hours', 42, 38, 0.7, '🍞', 16, 'Bakery & Deli'],
  ['pastry-meat', 'Mince pastry', 'Lean beef and onion', 78, 72, 0.5, '🥐', 14, 'Bakery & Deli'],
  ['cookies-pack', 'Cookies, pack of 8', 'Chewy centre', 56, 50, 0.4, '🍪', 24, 'Bakery & Deli'],
  ['deli-coldcuts', 'Cold cuts, 200g', 'Salami and ham mix', 88, 82, 0.2, '🥓', 16, 'Bakery & Deli'],

  // ---------------------------------------------------------- beverages
  ['water-5l', 'Still water 5L', 'Borehole-sourced', 28, 26, 5, '💧', 90, 'Beverages & Cellar'],
  ['water-750ml', 'Still water 750ml', 'Six pack', 26, 24, 4.5, '💧', 60, 'Beverages & Cellar'],
  ['juice-1l', 'Orange juice 1L', 'Not from concentrate', 46, 42, 1.1, '🧃', 38, 'Beverages & Cellar'],
  ['juice-2l', 'Fruit juice 2L', 'Guava and mango blend', 68, 60, 2.1, '🧃', 26, 'Beverages & Cellar'],
  ['cola-2l', 'Soft drink 2L', 'Chilled family size', 34, 30, 2.1, '🥤', 64, 'Beverages & Cellar'],
  ['soda-2l', 'Lemon soda 2L', 'Served ice cold', 32, 28, 2.1, '🥤', 58, 'Beverages & Cellar'],
  ['energy-500ml', 'Energy drink 500ml', 'Six pack', 118, 108, 3, '⚡', 22, 'Beverages & Cellar'],
  ['beer-crate', 'Beer, crate of 12', 'Local lager, 750ml', 175, 165, 9.6, '🍺', 14, 'Beverages & Cellar'],
  ['beer-lager-6', 'Lager, 6 pack', '330ml bottles', 88, 82, 2.4, '🍺', 30, 'Beverages & Cellar'],
  ['wine-red-750', 'Red wine 750ml', 'Cabernet blend', 145, 132, 1.3, '🍷', 18, 'Beverages & Cellar'],
  ['wine-white-750', 'White wine 750ml', 'Chenin blanc', 138, 126, 1.3, '🥂', 16, 'Beverages & Cellar'],
  ['spirits-750', 'Whisky 750ml', 'Blended, 5 years', 380, 350, 1.3, '🥃', 8, 'Beverages & Cellar'],
  ['cider-2l', 'Cider 2L', 'Apple, medium sweet', 78, 70, 2.1, '🍏', 20, 'Beverages & Cellar'],
  ['coffee-1kg-instant', 'Instant coffee 1kg', 'Freeze dried, 100 cups', 295, 270, 1, '☕', 18, 'Beverages & Cellar'],
  ['drinks-multi-6', 'Mixed drinks, 6 pack', 'Cans, assorted', 62, 58, 2.4, '🥤', 40, 'Beverages & Cellar'],
  ['ice-2kg', 'Crushed ice 2kg', 'Bagged, food grade', 28, 26, 2, '🧊', 30, 'Beverages & Cellar'],

  // ------------------------------------------------------- home & kitchen
  ['cooking-set', '3-pot cooking set', 'Aluminium, glass lids', 685, 640, 4.2, '🍳', 8, 'Home & Kitchen'],
  ['pot-5l', 'Stock pot 5L', 'Stainless, heavy base', 420, 390, 3.4, '🍲', 12, 'Home & Kitchen'],
  ['frying-pan-28', 'Frying pan 28cm', 'Non-stick coating', 285, 260, 1.2, '🍳', 14, 'Home & Kitchen'],
  ['kettle-1.7l', 'Kettle 1.7L', 'Fast boil, 2kW', 235, 210, 1.4, '🫖', 18, 'Home & Kitchen'],
  ['plate-set-12', 'Dinner plates, set of 12', 'Glazed stoneware', 340, 320, 5.5, '🍽️', 12, 'Home & Kitchen'],
  ['bowl-set-6', 'Bowls, set of 6', 'Microwave safe', 195, 178, 3.1, '🥣', 14, 'Home & Kitchen'],
  ['mug-6', 'Mugs, set of 6', 'Stackable', 120, 110, 1.6, '☕', 20, 'Home & Kitchen'],
  ['cutlery-24', 'Cutlery, 24 piece', 'Stainless, boxed', 395, 360, 2.8, '🍴', 9, 'Home & Kitchen'],
  ['glass-tumblers-6', 'Tumblers, set of 6', 'Thick pressed glass', 145, 132, 1.8, '🥃', 18, 'Home & Kitchen'],
  ['bedset-king', 'Bedding set, king', 'Cotton, 400 thread count', 540, 520, 2.4, '🛏️', 10, 'Home & Kitchen'],
  ['bedset-single', 'Bedding set, single', 'Cotton blend', 320, 300, 1.8, '🛏️', 14, 'Home & Kitchen'],
  ['towels-2', 'Bath towels, pair', 'Cotton, 650gsm', 245, 225, 1.4, '🧻', 16, 'Home & Kitchen'],
  ['blanket-throw', 'Fleece throw', 'Warm, light', 220, 200, 1.2, '🛏️', 18, 'Home & Kitchen'],
  ['curtains-2', 'Curtains, pair', 'Blackout, 2m drop', 385, 350, 3.2, '🪟', 8, 'Home & Kitchen'],
  ['cushion-cover', 'Cushion cover', 'Woven cotton', 78, 70, 0.3, '🛋️', 30, 'Home & Kitchen'],
  ['storage-box-30', 'Storage box 30L', 'Lid, stackable', 145, 132, 1.8, '📦', 22, 'Home & Kitchen'],
  ['laundry-basket', 'Laundry basket', 'Woven, ventilated', 185, 168, 1.6, '🧺', 16, 'Home & Kitchen'],
  ['mirror-oval', 'Oval mirror', 'Wooden frame', 320, 290, 1.8, '🪞', 7, 'Home & Kitchen'],

  // ------------------------------------------------- household & cleaning
  ['soap-3', 'Soap, pack of 3', 'Goat milk, hand-made', 78, 72, 0.4, '🧼', 34, 'Household & Cleaning'],
  ['tissue-10', 'Tissue, 10 rolls', 'Two-ply, quilted', 72, 66, 2, '🧻', 48, 'Household & Cleaning'],
  ['tissue-20', 'Tissue, 20 rolls', 'Value pack', 132, 120, 4, '🧻', 30, 'Household & Cleaning'],
  ['powder-2kg', 'Laundry powder 2kg', 'Low-suds formula', 88, 80, 2, '🧼', 26, 'Household & Cleaning'],
  ['powder-5kg', 'Laundry powder 5kg', 'Economy, hand and machine', 205, 185, 5, '🧼', 16, 'Household & Cleaning'],
  ['liquid-2l', 'Liquid detergent 2L', 'Low-suds, 40 washes', 135, 122, 2.1, '🧴', 22, 'Household & Cleaning'],
  ['dish-soap-750', 'Dish soap 750ml', 'Lemon, concentrate', 38, 34, 0.8, '🧽', 40, 'Household & Cleaning'],
  ['bleach-5l', 'Bleach 5L', 'Thickened', 62, 56, 5.2, '🧴', 24, 'Household & Cleaning'],
  ['broom', 'Hard broom', 'Local grass, stitched', 34, 30, 1.2, '🧹', 40, 'Household & Cleaning'],
  ['mop', 'Spin mop set', 'Bucket and wringer', 168, 152, 2.2, '🧹', 16, 'Household & Cleaning'],
  ['dustpan-brush', 'Dustpan and brush set', 'For the yard', 68, 62, 1.1, '🧹', 28, 'Household & Cleaning'],
  ['rubbish-bags-30', 'Rubbish bags, 30 pack', 'Heavy duty', 78, 70, 1.2, '🗑️', 24, 'Household & Cleaning'],
  ['sanitiser-1l', 'Surface sanitiser 1L', 'Kills 99.9%', 68, 62, 1.1, '🧴', 26, 'Household & Cleaning'],
  ['air-freshener', 'Air freshener 300g', 'Long lasting', 92, 85, 0.4, '🌸', 18, 'Household & Cleaning'],
  ['candle-home-3', 'Home fragrance candles, 3 pack', 'Wax, 220g', 165, 150, 1.2, '🕯️', 14, 'Household & Cleaning'],
  ['fly-screen', 'Fly screen roll 2m', 'Aluminium mesh', 285, 260, 1.6, '🪟', 10, 'Household & Cleaning'],
  ['insect-repellent-home', 'Household insect spray', '400ml, low odour', 62, 57, 0.45, '🪰', 30, 'Household & Cleaning'],

  // ------------------------------------------------------ health & beauty
  ['panadol-20', 'Panadol 20 tablets', 'Paracetamol 500mg', 38, 35, 0.05, '💊', 55, 'Health & Beauty'],
  ['panadol-50', 'Panadol 50 tablets', 'Family pack', 82, 76, 0.12, '💊', 30, 'Health & Beauty'],
  ['vitc-100', 'Vitamin C 100 tablets', '1000mg effervescent', 92, 88, 0.2, '🧪', 24, 'Health & Beauty'],
  ['multivit-60', 'Multivitamin 60 tablets', 'One a day', 185, 175, 0.15, '💊', 20, 'Health & Beauty'],
  ['orsachet-6', 'Rehydration salts, 6 sachets', 'WHO formula', 42, 38, 0.3, '🧂', 35, 'Health & Beauty'],
  ['paracetamol-syrup', 'Paracetamol syrup 100ml', 'Children, strawberry', 45, 42, 0.15, '🧴', 24, 'Health & Beauty'],
  ['repellent-200', 'Insect repellent 200ml', 'DEET 15%', 118, 110, 0.25, '🧴', 30, 'Health & Beauty'],
  ['sunscreen-100', 'Sunscreen SPF50 100ml', 'Matte, no white cast', 245, 225, 0.12, '🧴', 18, 'Health & Beauty'],
  ['face-cream', 'Face cream 50ml', 'Shea and aloe', 156, 148, 0.08, '🧴', 22, 'Health & Beauty'],
  ['body-lotion', 'Body lotion 400ml', 'Shea, everyday', 145, 135, 0.45, '🧴', 26, 'Health & Beauty'],
  ['hair-oil', 'Hair oil 150ml', 'Coconut and castor', 95, 88, 0.18, '💇', 28, 'Health & Beauty'],
  ['shampoo-400', 'Shampoo 400ml', 'Moisturising, 2L value', 128, 118, 0.45, '🧴', 30, 'Health & Beauty'],
  ['relaxer-kit', 'Hair relaxer kit', 'For the salon chair', 240, 225, 1.1, '💇', 18, 'Health & Beauty'],
  ['wig', 'Braided wig unit', 'Ready to install', 480, 450, 0.6, '💇‍♀️', 8, 'Health & Beauty'],
  ['nail-polish', 'Nail polish', '12ml, chip resistant', 78, 72, 0.04, '💅', 26, 'Health & Beauty'],
  ['sanitary-pads', 'Sanitary pads, pack of 20', 'Regular, breathable', 95, 88, 0.2, '🩹', 24, 'Health & Beauty'],
  ['diaper-32', 'Diapers, size 3, 32 pack', 'Ultra dry', 285, 265, 0.6, '🧷', 14, 'Health & Beauty'],
  ['first-aid-kit', 'First aid kit', 'Family, 40 pieces', 265, 245, 1.2, '🩹', 12, 'Health & Beauty'],
  ['plaster-pack', 'Plasters, 40 pack', 'Assorted sizes', 42, 38, 0.1, '🩹', 34, 'Health & Beauty'],
  ['toothpaste-150', 'Toothpaste 150ml', 'Fluoride, mint', 52, 48, 0.16, '🪥', 40, 'Health & Beauty'],

  // ------------------------------------------------------------- fashion
  ['tee-2', 'T-shirts, pack of 2', '100% cotton', 135, 120, 0.4, '👕', 34, 'Fashion'],
  ['tee-1', 'T-shirt', 'Heavy cotton, 180gsm', 78, 70, 0.2, '👕', 55, 'Fashion'],
  ['jeans', 'Denim jeans', 'Mid-wash, straight leg', 320, 300, 0.7, '👖', 20, 'Fashion'],
  ['jeans-women', "Women's jeans", 'High rise, stretch', 335, 310, 0.68, '👖', 18, 'Fashion'],
  ['dress', 'Printed dress', 'Breezy rayon, lined', 285, 265, 0.4, '👗', 14, 'Fashion'],
  ['shirt-mens', 'Shirt, men', 'Cotton poplin', 265, 245, 0.3, '👔', 16, 'Fashion'],
  ['blouse', 'Office blouse', 'Crepe, short sleeve', 285, 265, 0.25, '👚', 18, 'Fashion'],
  ['skirt', 'A-line skirt', 'Lined, knee length', 245, 225, 0.35, '👗', 14, 'Fashion'],
  ['traditional-dress', 'Traditional attire set', 'Thobe and jacket', 1250, 1180, 1.2, '🎽', 6, 'Fashion'],
  ['traditional-skirt', 'Traditional skirt and top', 'Seta cloth, lined', 890, 840, 0.9, '🎽', 8, 'Fashion'],
  ['leather-jacket', 'Leather jacket', 'Genuine, soft finish', 1850, 1750, 1.6, '🧥', 4, 'Fashion'],
  ['hoodie', 'Hoodie', 'Brushed cotton, kangaroo', 395, 365, 0.7, '🧥', 16, 'Fashion'],
  ['tracksuit', 'Tracksuit set', 'Polyester, two piece', 585, 540, 1.1, '🏃', 10, 'Fashion'],
  ['socks-6', 'Socks, pack of 6', 'Cotton blend', 115, 102, 0.3, '🧦', 34, 'Fashion'],
  ['underwear-3', 'Underwear, pack of 3', 'Cotton, breathable', 165, 150, 0.3, '🩲', 30, 'Fashion'],
  ['fabric-6m', 'Fabric 6 metres', 'Wrinkle-free poly-cotton', 145, 135, 1.1, '🧵', 24, 'Fashion'],
  ['workwear-coverall', 'Coverall', 'Blue, two piece', 485, 450, 1.4, '🧑‍🔧', 12, 'Fashion'],
  ['apron', 'Apron', 'Cotton, two pockets', 125, 115, 0.3, '🧑‍🍳', 20, 'Fashion'],
  ['sun-hat', 'Sun hat', 'Wide brim, packable', 165, 152, 0.2, '👒', 22, 'Fashion'],
  ['belt-leather', 'Leather belt', 'Buckle, 35mm', 235, 215, 0.3, '👔', 18, 'Fashion'],

  // ------------------------------------------------------------ footwear
  ['sneakers', 'Sneakers', 'Canvas, rubber sole', 390, 360, 0.9, '👟', 16, 'Footwear'],
  ['sneakers-run', 'Running shoes', 'Foam midsole, mesh', 685, 630, 0.8, '👟', 12, 'Footwear'],
  ['boots-safety', 'Safety boots', 'Steel toe, SABS rated', 690, 660, 1.6, '🥾', 12, 'Footwear'],
  ['boots-farm', 'Farm boots', 'Gumboots, green', 320, 300, 1.2, '🥾', 18, 'Footwear'],
  ['boots-walking', 'Walking boots', 'Waterproof, ankle', 780, 720, 1.3, '🥾', 10, 'Footwear'],
  ['sandals', 'Leather sandals', 'Hand-lasted', 265, 250, 0.7, '🩴', 18, 'Footwear'],
  ['flipflops', 'Flip-flops, pair', 'EVA, rubber strap', 85, 78, 0.25, '🩴', 40, 'Footwear'],
  ['school-shoes', 'School shoes', 'Black, lace-up, sizes 1–4', 385, 355, 0.7, '👞', 16, 'Footwear'],
  ['heels', 'Heels', 'Closed court, 7cm', 545, 510, 0.8, '👠', 8, 'Footwear'],
  ['slippers', 'Slippers', 'Fleece lined', 165, 150, 0.4, '🩴', 24, 'Footwear'],
  ['boots-leather', 'Leather boots', 'Goodyear welted', 1180, 1080, 1.5, '🥾', 6, 'Footwear'],
  ['shoe-cleaner', 'Shoe polish and brush set', 'Black, with cloth', 125, 115, 0.3, '👞', 22, 'Footwear'],

  // ------------------------------------------------- bags & accessories
  ['bag-hand', 'Handbag', 'Full-grain leather', 540, 520, 0.8, '👜', 10, 'Bags & Accessories'],
  ['backpack', 'Backpack 20L', 'Padded, laptop sleeve', 485, 450, 0.9, '🎒', 14, 'Bags & Accessories'],
  ['school-bag', 'School bag', 'Reflective strip, 18L', 295, 270, 0.7, '🎒', 20, 'Bags & Accessories'],
  ['tote-canvas', 'Canvas tote', 'Heavy cotton, long handles', 165, 150, 0.4, '👜', 24, 'Bags & Accessories'],
  ['wallet', 'Wallet', 'Leather, eight card slots', 245, 225, 0.2, '👛', 18, 'Bags & Accessories'],
  ['sunglasses', 'Sunglasses', 'Polarised, UV400', 285, 265, 0.1, '🕶️', 16, 'Bags & Accessories'],
  ['watch', 'Wristwatch', 'Steel strap, date window', 685, 640, 0.2, '⌚', 8, 'Bags & Accessories'],
  ['scarf', 'Scarf', 'Printed viscose', 165, 150, 0.2, '🧣', 20, 'Bags & Accessories'],
  ['gloves', 'Gloves', 'Knit, lined', 145, 132, 0.2, '🧤', 22, 'Bags & Accessories'],
  ['umbrella', 'Folding umbrella', 'Windproof, eight ribs', 185, 168, 0.4, '☂️', 18, 'Bags & Accessories'],
  ['thermos-1l', 'Vacuum flask 1L', 'Steel, 24 hours cold', 285, 265, 0.6, '🍶', 14, 'Bags & Accessories'],
  ['lunch-box', 'Lunch box', 'Insulated, leak proof', 225, 205, 0.5, '🍱', 16, 'Bags & Accessories'],

  // ------------------------------------------------- jewellery & gifts
  ['beads-strap', 'Beaded strap', 'Botswana flag colours', 145, 135, 0.3, '📿', 22, 'Jewellery & Gifts'],
  ['gold-pendant', 'Gold pendant 9ct', 'Chain and pendant set', 2450, 2300, 0.05, '📿', 3, 'Jewellery & Gifts'],
  ['silver-ring', 'Silver ring', 'Sterling, plain band', 685, 640, 0.03, '💍', 6, 'Jewellery & Gifts'],
  ['earrings-gold', 'Gold earrings', '9ct, pair', 1450, 1380, 0.02, '💎', 4, 'Jewellery & Gifts'],
  ['watch-straps', 'Watch straps, pair', 'Genuine leather', 185, 170, 0.1, '⌚', 16, 'Jewellery & Gifts'],
  ['gift-basket', 'Gift basket', 'Mixed, ribbon wrapped', 385, 350, 0.8, '🎁', 12, 'Jewellery & Gifts'],
  ['card-wrap', 'Greeting card', 'Locally illustrated', 45, 40, 0.05, '💌', 40, 'Jewellery & Gifts'],
  ['candle-gift', 'Gift candle', 'Fig and cedar, 220g', 95, 88, 0.4, '🕯️', 30, 'Jewellery & Gifts'],
  ['picture-frame', 'Picture frame', 'Wood, 30×40cm', 185, 168, 0.6, '🖼️', 14, 'Jewellery & Gifts'],
  ['keyring', 'Keyring', 'Leather loop, brass clip', 85, 78, 0.1, '🔑', 30, 'Jewellery & Gifts'],

  // ------------------------------------------------------ mobile & tablets
  ['handset-basic', 'Smartphone 128GB', '6.5 inch, dual SIM', 3650, 3400, 0.4, '📱', 12, 'Mobile & Tablets'],
  ['handset-plus', 'Smartphone 256GB', '6.7 inch, 5G', 7850, 7400, 0.45, '📱', 6, 'Mobile & Tablets'],
  ['handset-budget', 'Smartphone 64GB', '5.7 inch, 4G', 2250, 2100, 0.35, '📱', 16, 'Mobile & Tablets'],
  ['tablet-10', 'Tablet 10 inch', '64GB, with keyboard case', 6850, 6400, 0.6, '📟', 6, 'Mobile & Tablets'],
  ['feature-phone', 'Feature phone', 'Dual SIM, torch, long battery', 480, 440, 0.15, '📱', 20, 'Mobile & Tablets'],
  ['airtime-5', 'Airtime bundle 5GB', '30-day data, all networks', 120, 115, 0, '📶', 999, 'Mobile & Tablets'],
  ['airtime-20', 'Airtime bundle 20GB', '30-day data, all networks', 385, 365, 0, '📶', 999, 'Mobile & Tablets'],
  ['airtime-minutes', 'Airtime 100 minutes', 'All networks, 30 days', 95, 88, 0, '📞', 999, 'Mobile & Tablets'],
  ['data-saver', 'Data saver 10GB', 'Weekend data, 30 days', 145, 135, 0, '📶', 999, 'Mobile & Tablets'],
  ['sim-card', 'Prepaid SIM', 'Ready activated', 35, 32, 0, '📶', 80, 'Mobile & Tablets'],
  ['phone-charger-plug', 'Wall charger', 'USB-A, 10W', 145, 135, 0.15, '🔌', 40, 'Mobile & Tablets'],
  ['mobile-banking-help', 'Mobile banking setup', 'Assisted, at the counter', 0, 0, 0, '🏦', 99, 'Mobile & Tablets', 0, 'service'],
  ['earbuds', 'Wireless earbuds', 'Touch case, 24h battery', 420, 395, 0.2, '🎧', 26, 'Mobile & Tablets'],
  ['smart-watch', 'Smart watch', 'AMOLED, heart rate, 10-day battery', 1450, 1350, 0.2, '⌚', 10, 'Mobile & Tablets'],

  // --------------------------------------------------------- audio & TV
  ['tv-43', 'Television 43 inch', 'Smart Android, FHD', 7900, 7500, 8.2, '📺', 6, 'Audio & TV'],
  ['tv-55', 'Television 55 inch', '4K, smart, built-in tuner', 13800, 13100, 15.4, '📺', 4, 'Audio & TV'],
  ['tv-32', 'Television 32 inch', 'HD, HDMI and USB', 3450, 3250, 4.1, '📺', 8, 'Audio & TV'],
  ['soundbar', 'Soundbar 2.1', 'Wireless subwoofer', 3250, 3050, 4.1, '🔊', 8, 'Audio & TV'],
  ['radio-mic', 'Radio and mic set', 'UHF, 16 channels', 1850, 1750, 1.8, '📻', 6, 'Audio & TV'],
  ['speaker-bt', 'Bluetooth speaker', 'Waterproof, 12-hour battery', 895, 840, 0.8, '🔈', 14, 'Audio & TV'],
  ['turntable', 'Record player', 'Belt drive, built-in speakers', 2850, 2650, 3.2, '🎵', 4, 'Audio & TV'],
  ['car-radio', 'Car radio and speakers', 'Bluetooth, USB, 4 speakers', 2350, 2200, 2.4, '🚗', 7, 'Audio & TV'],
  ['projector', 'Home projector', '1080p, HDMI, built-in speaker', 5250, 4900, 2.8, '📽️', 4, 'Audio & TV'],
  ['headphones-over', 'Over-ear headphones', 'Noise cancelling', 1450, 1350, 0.4, '🎧', 12, 'Audio & TV'],

  // -------------------------------------------------- computing & gaming
  ['laptop-14', 'Laptop 14 inch', '16GB RAM, 512GB SSD', 21500, 19900, 1.8, '💻', 4, 'Computing & Gaming'],
  ['laptop-15-gaming', 'Gaming laptop 15 inch', 'RTX graphics, 16GB RAM', 48500, 44900, 2.6, '🎮', 2, 'Computing & Gaming'],
  ['desktop-pc', 'Desktop computer', 'Assembled and tested', 18500, 17200, 9.5, '🖥️', 3, 'Computing & Gaming'],
  ['monitor-24', 'Monitor 24 inch', 'IPS, full HD, HDMI', 3450, 3200, 4.2, '🖥️', 8, 'Computing & Gaming'],
  ['printer-ink', 'Ink tank printer', 'Print, scan, copy, Wi-Fi', 4850, 4550, 5.4, '🖨️', 5, 'Computing & Gaming'],
  ['console', 'Game console', '1TB drive, two controllers', 8900, 8500, 3.2, '🎮', 3, 'Computing & Gaming'],
  ['controller', 'Game controller', 'Wireless, rechargeable', 1250, 1180, 0.3, '🕹️', 12, 'Computing & Gaming'],
  ['games-4', 'Video games, 4 pack', 'New releases', 1450, 1350, 0.6, '💿', 10, 'Computing & Gaming'],
  ['ssd-1tb', 'Solid state drive 1TB', 'SATA, 550MB/s', 1450, 1350, 0.1, '💾', 14, 'Computing & Gaming'],
  ['ram-16gb', 'Memory 16GB DDR4', 'Two 8GB sticks', 1150, 1080, 0.1, '🧮', 12, 'Computing & Gaming'],
  ['keyboard-mech', 'Mechanical keyboard', 'Brown switches, backlit', 1150, 1080, 0.9, '⌨️', 10, 'Computing & Gaming'],
  ['mouse-wireless', 'Wireless mouse', 'Rechargeable, 8000dpi', 385, 360, 0.1, '🖱️', 24, 'Computing & Gaming'],
  ['webcam-1080', 'Webcam 1080p', 'Auto light correction', 685, 640, 0.3, '📷', 12, 'Computing & Gaming'],
  ['cables-hdmi', 'HDMI cable 2m', 'Braided, 4K rated', 165, 152, 0.3, '🔗', 30, 'Computing & Gaming'],

  // --------------------------------------------------------- accessories
  ['charger-typec', 'USB-C charger 30W', 'Fast charge', 165, 155, 0.2, '🔌', 45, 'Accessories'],
  ['case-phone', 'Phone case', 'Shockproof, clear', 95, 88, 0.08, '🧱', 50, 'Accessories'],
  ['screen-protector', 'Screen protector', 'Tempered glass, 2 pack', 125, 115, 0.05, '🛡️', 40, 'Accessories'],
  ['powerbank', 'Power bank 20 000mAh', 'Dual USB, fast charge', 540, 520, 0.45, '🔋', 16, 'Accessories'],
  ['cable-lightning', 'Lightning cable 1m', 'Braided, MFi', 145, 135, 0.1, '🔗', 35, 'Accessories'],
  ['car-charger', 'Car charger', 'Dual USB, 36W', 185, 170, 0.15, '🚗', 26, 'Accessories'],
  ['usb-hub-4', 'USB hub, 4 port', 'Powered, 3.0', 385, 360, 0.2, '🔌', 18, 'Accessories'],
  ['sd-card-128', 'Memory card 128GB', 'A1, 100MB/s', 285, 265, 0.02, '💳', 24, 'Accessories'],
  ['lens-kit', 'Camera lens kit', 'Wide angle and macro', 1250, 1180, 0.3, '📷', 7, 'Accessories'],
  ['tripod', 'Tripod', 'Aluminium, 160cm', 465, 430, 1.1, '📷', 12, 'Accessories'],
  ['stylus-pen', 'Stylus pen', 'Pressure sensitive', 285, 265, 0.1, '🖊️', 20, 'Accessories'],
  ['phone-holder', 'Phone holder', 'Dashboard clip', 145, 135, 0.2, '📱', 28, 'Accessories'],
  ['gaming-mousepad', 'Gaming mouse pad', 'XXL, stitched edge', 185, 170, 0.5, '🖱️', 22, 'Accessories'],
  ['cable-ties', 'Cable ties, 100 pack', 'Assorted sizes', 65, 58, 0.3, '🔗', 40, 'Accessories'],
  ['adapter-multi', 'Travel plug adapter', 'Universal, USB-C', 245, 228, 0.2, '🔌', 18, 'Accessories'],
  ['cleaning-kit-tech', 'Electronics cleaning kit', 'Brush, cloth and swab', 125, 115, 0.2, '🧹', 24, 'Accessories'],


  // -------------------------------------------------------- hardware & DIY
  ['cement-50kg', 'Cement 50kg', 'Factory bag, fresh date', 96, 88, 50, '🧱', 60, 'Hardware & DIY'],
  ['cement-20kg', 'Cement 20kg', 'For patching and foundations', 46, 42, 20, '🧱', 40, 'Hardware & DIY'],
  ['paint-5l', 'Paint 5L', 'Interior emulsion, tintable', 285, 260, 6, '🪣', 16, 'Hardware & DIY'],
  ['paint-1l', 'Paint 1L', 'Trim and touch-up', 78, 72, 1.2, '🪣', 28, 'Hardware & DIY'],
  ['nails-1kg', 'Nails 1kg', 'Common wire nails', 68, 60, 1.1, '🔨', 32, 'Hardware & DIY'],
  ['screws-assortment', 'Screws assortment 500', 'Assorted sizes, zinc', 165, 152, 1.4, '🔩', 18, 'Hardware & DIY'],
  ['shovel', 'Spade with handle', 'Pressed steel blade', 78, 72, 2.4, '🪓', 24, 'Hardware & DIY'],
  ['pvc-6m', 'PVC pipe 6m', '110mm pressure pipe', 145, 132, 6, '🔧', 18, 'Hardware & DIY'],
  ['pvc-tee-4', 'PVC fittings, pack of 4', 'Elbows and tees', 95, 88, 1.2, '🔧', 26, 'Hardware & DIY'],
  ['drill', 'Cordless drill', 'Two batteries and charger', 1450, 1380, 2.4, '🛠️', 8, 'Hardware & DIY'],
  ['hammer', 'Claw hammer', 'Fibreglass handle', 165, 152, 0.9, '🔨', 20, 'Hardware & DIY'],
  ['spanner-set-12', 'Spanner set, 12 piece', 'Combination, metric', 585, 545, 3.4, '🔧', 10, 'Hardware & DIY'],
  ['tape-measure-8', 'Tape measure 8m', 'Magnetic hook', 125, 115, 0.3, '📏', 24, 'Hardware & DIY'],
  ['level-600', 'Spirit level 600mm', 'Aluminium, 3 vials', 225, 208, 0.7, '📐', 14, 'Hardware & DIY'],
  ['wheelbarrow', 'Wheelbarrow', 'Steel tray, pneumatic tyre', 1450, 1380, 11, '🛞', 4, 'Hardware & DIY'],
  ['ladder-2m', 'Step ladder 2m', 'Aluminium, 150kg rated', 1250, 1180, 6.8, '🪜', 6, 'Hardware & DIY'],
  ['roofing-sheet', 'Roofing sheet 1.2m', 'Pre-painted, 0.5mm', 285, 265, 8.4, '🏠', 10, 'Hardware & DIY'],
  ['timber-plank', 'Timber plank 2.4m', 'Meranti, dressed', 245, 228, 5.6, '🪵', 14, 'Hardware & DIY'],
  ['sand-25kg', 'Building sand 25kg', 'Washed, sharp', 55, 50, 25, '🏖️', 40, 'Hardware & DIY'],
  ['tile-adhesive-20', 'Tile adhesive 20kg', 'Flexible, grey', 165, 152, 20, '🧴', 16, 'Hardware & DIY'],
  ['safety-goggles-hardware', 'Safety goggles', 'Clear, anti-fog', 145, 135, 0.2, '🥽', 26, 'Hardware & DIY'],
  ['toolbelt', 'Tool belt', 'Leather, 12 pockets', 285, 265, 0.6, '🧰', 12, 'Hardware & DIY'],
  ['extension-ladder-6', 'Extension ladder 6m', 'Aluminium, fibreglass', 2850, 2680, 14, '🪜', 3, 'Hardware & DIY'],
  ['cement-mixer', 'Cement mixer 90L', 'Wheeled, petrol', 6850, 6400, 58, '🧱', 3, 'Hardware & DIY'],

  // ------------------------------------------------------ provisions & fuel
  ['fuel-20l', 'Diesel, 20 litres', 'Depot-filled jerry can', 420, 390, 20, '⛽', 24, 'Provisions & Fuel'],
  ['jerry-can', 'Jerry can 20L', 'Food-grade, sealed', 145, 135, 1.4, '🛢️', 18, 'Provisions & Fuel'],
  ['gas-cylinder-9kg', 'Gas cylinder 9kg', 'Refill, with deposit', 385, 358, 12, '🔥', 8, 'Provisions & Fuel'],
  ['gas-refill', 'Gas refill 5kg', 'Exchange, hot water', 165, 155, 5.2, '🔥', 16, 'Provisions & Fuel'],
  ['charcoal-10kg', 'Braai charcoal 10kg', 'Hardwood lump', 145, 135, 10, '🔥', 30, 'Provisions & Fuel'],
  ['firewood-bundle', 'Firewood bundle', 'Mixed hardwood, 15kg', 95, 88, 15, '🪵', 24, 'Provisions & Fuel'],
  ['food-bundle', 'Family food bundle', 'Maize, oil, sugar, beans', 430, 390, 18, '🧺', 14, 'Provisions & Fuel'],
  ['bottled-beer-24', 'Bottled beer, crate of 24', 'Returnable crates', 330, 310, 16, '🍺', 10, 'Provisions & Fuel'],
  ['ice-5kg', 'Crushed ice 5kg', 'Bagged, food grade', 62, 56, 5, '🧊', 20, 'Provisions & Fuel'],
  ['camping-gas', 'Camping gas canister', '230g, threaded', 92, 86, 0.3, '🔥', 22, 'Provisions & Fuel'],
  ['freezer-cooler-45', 'Cooler 45L', 'Rotomoulded, 3 day ice', 1250, 1180, 5.4, '🧊', 8, 'Provisions & Fuel'],
  ['ration-pack-7', 'Field ration, 7 day', 'Ready meals and water', 385, 358, 4.2, '🎒', 10, 'Provisions & Fuel'],

  // ----------------------------------------------------------- motor spares
  ['oil-filter', 'Oil filter', 'Fits common 1.6–2.0 petrol', 145, 138, 0.5, '🛢️', 30, 'Motor Spares'],
  ['air-filter', 'Air filter', 'Panel type, 1.6 petrol', 185, 172, 0.4, '🌀', 24, 'Motor Spares'],
  ['brake-pads', 'Brake pad set', 'Front axle, ceramic', 620, 590, 1.8, '🛑', 14, 'Motor Spares'],
  ['brake-disc', 'Brake disc', 'Front, 280mm, vented', 1250, 1180, 4.2, '🛑', 8, 'Motor Spares'],
  ['wipers', 'Wiper blades, pair', 'Universal fit', 210, 198, 0.3, '🧽', 26, 'Motor Spares'],
  ['battery-12v', 'Car battery 12V', '70Ah, 3-year warranty', 2350, 2250, 17, '🔋', 6, 'Motor Spares'],
  ['spark-plugs', 'Spark plugs, pack of 4', 'Iridium, long life', 385, 365, 0.2, '⚡', 22, 'Motor Spares'],
  ['belt-drive', 'Drive belt', 'Timing belt, 1.6 petrol', 685, 650, 0.3, '🔁', 10, 'Motor Spares'],
  ['coolant-5l', 'Coolant 5L', 'Long life, ready to use', 225, 210, 5.2, '💧', 20, 'Motor Spares'],
  ['brake-fluid', 'Brake fluid 1L', 'DOT 4', 125, 118, 1.1, '🧴', 24, 'Motor Spares'],
  ['shock-absorber', 'Shock absorber', 'Gas charged, rear', 1450, 1380, 2.6, '🌀', 6, 'Motor Spares'],
  ['clutch-kit', 'Clutch kit', 'Three-piece, with flywheel', 4850, 4600, 6.4, '⚙️', 3, 'Motor Spares'],

  // ------------------------------------------------- mining & industrial
  ['hardhat', 'Hard hat', 'Adjustable harness', 165, 158, 0.4, '⛑️', 34, 'Mining & Industrial'],
  ['hi-vis', 'Reflective vest', 'Class 2, yellow', 145, 138, 0.3, '🦺', 40, 'Mining & Industrial'],
  ['gloves-pair', 'Work gloves, pair', 'Split leather', 135, 128, 0.3, '🧤', 44, 'Mining & Industrial'],
  ['welding-rod', 'Welding rods 5kg', 'E6013, 2.5mm', 480, 450, 5, '⚡', 12, 'Mining & Industrial'],
  ['safety-goggles', 'Safety goggles', 'Anti-fog, clear', 145, 135, 0.2, '🥽', 28, 'Mining & Industrial'],
  ['ear-plugs', 'Ear plugs', 'Foam, corded, 50 pairs', 185, 170, 0.3, '🦻', 22, 'Mining & Industrial'],
  ['respirator', 'Respirator mask', 'P2 particulate', 385, 360, 0.3, '😷', 18, 'Mining & Industrial'],
  ['work-light', 'Work light', 'Rechargeable LED flood', 685, 650, 0.8, '🔦', 14, 'Mining & Industrial'],
  ['grease-cartridge', 'Grease cartridge', 'Lithium, 14oz', 145, 135, 0.45, '🛢️', 20, 'Mining & Industrial'],
  ['hydraulic-hose', 'Hydraulic hose', '1m, 1/2 inch', 385, 360, 1.2, '🔧', 12, 'Mining & Industrial'],
  ['bolts-assortment', 'Bolts and nuts assortment', '500 piece, galvanised', 845, 790, 2.8, '🔩', 6, 'Mining & Industrial'],
  ['tool-box-steel', 'Steel tool box', 'Five drawer, lockable', 1450, 1350, 6.5, '🧰', 5, 'Mining & Industrial'],

  // ------------------------------------------------------ farm & poultry
  ['chicken-feed', 'Chicken feed 50kg', 'Layer mash', 640, 580, 50, '🐔', 20, 'Farm & Poultry'],
  ['chicks-dayold', 'Day-old chicks', 'Broiler, 100 birds', 850, 780, 18, '🐣', 10, 'Farm & Poultry'],
  ['fence-wire', 'Fencing wire, 25kg roll', 'Galvanised 400m', 980, 900, 25, '🧵', 10, 'Farm & Poultry'],
  ['fence-posts', 'Fence droppers', '50, treated timber', 485, 450, 22, '🪵', 12, 'Farm & Poultry'],
  ['stock-feed-50', 'Stock feed 50kg', 'Mixed maize and bran', 560, 510, 50, '🌽', 14, 'Farm & Poultry'],
  ['salt-lick', 'Cattle salt lick', '10kg block', 95, 88, 10, '🧂', 24, 'Farm & Poultry'],
  ['vaccines-vet', 'Livestock vaccines', 'Cattle and poultry', 385, 360, 0.4, '💉', 8, 'Farm & Poultry'],
  ['cattle-ear-tags', 'Ear tags', 'Livestock, 20 pack', 185, 172, 0.3, '🏷️', 18, 'Farm & Poultry'],
  ['milking-cups', 'Milking machine cups', 'Stainless, 4 unit', 2250, 2100, 2.4, '🐄', 4, 'Farm & Poultry'],
  ['garden-seeds', 'Vegetable seed pack', 'Assorted, 20g', 65, 58, 0.02, '🌱', 40, 'Farm & Poultry'],
  ['watering-can', 'Watering can 10L', 'Galvanised, brass rose', 225, 208, 1.6, '🪣', 16, 'Farm & Poultry'],
  ['brooder-lamp', 'Brooder lamp', 'Infrared, 250W', 385, 358, 0.4, '💡', 12, 'Farm & Poultry'],

  // ------------------------------------------------------ tourism & safari
  ['binoculars', 'Binoculars 10x42', 'Roofed, rubber armoured', 1350, 1280, 0.7, '🔭', 7, 'Tourism & Safari'],
  ['spotting-scope', 'Spotting scope 20x60', 'Tripod ready, HD glass', 4250, 3950, 1.9, '🔭', 3, 'Tourism & Safari'],
  ['tent-3p', 'Dome tent, 3 person', 'All-season, fly included', 2450, 2300, 6.5, '⛺', 6, 'Tourism & Safari'],
  ['tent-4p', 'Family tent, 4 person', 'Two room, sewn floor', 3850, 3600, 9.4, '⛺', 4, 'Tourism & Safari'],
  ['cooler-35', 'Cool box 35L', 'Rotomoulded, ice for 2 days', 890, 840, 4.2, '🧊', 9, 'Tourism & Safari'],
  ['camp-chair', 'Folding camp chair', 'Steel frame, canvas', 520, 490, 3.4, '🪑', 11, 'Tourism & Safari'],
  ['camp-table', 'Folding camp table', 'Aluminium top', 785, 740, 4.2, '🪑', 7, 'Tourism & Safari'],
  ['compass', 'Magnetic compass', 'Lifeline, luminous dial', 165, 155, 0.2, '🧭', 20, 'Tourism & Safari'],
  ['ranger-tee', 'Ranger T-shirt', 'Washed cotton, pocket', 190, 175, 0.2, '👕', 28, 'Tourism & Safari'],
  ['field-guide', 'Botswana field guide', 'Mammals, birds and plants', 285, 260, 0.6, '📖', 16, 'Tourism & Safari'],
  ['waterproof-bag', 'Dry bag 20L', 'Roll-top, welded seams', 285, 265, 0.4, '🎒', 18, 'Tourism & Safari'],
  ['head-torch', 'Head torch', 'Rechargeable, 500 lumens', 385, 358, 0.2, '🔦', 20, 'Tourism & Safari'],
  ['sleeping-bag', 'Sleeping bag', 'Three season, 5°C', 1250, 1180, 1.8, '🛏️', 7, 'Tourism & Safari'],
  ['camera-binocular-harness', 'Binocular harness', 'Chest mount, padded', 285, 265, 0.4, '📷', 12, 'Tourism & Safari'],

  // --------------------------------------------------- fishing & outdoor
  ['rod-6ft', 'Fishing rod 6ft', 'Graphite blank, 2 guides', 1150, 1080, 0.9, '🎣', 8, 'Fishing & Outdoor'],
  ['rod-spinner-9ft', 'Spinning rod 9ft', 'Fast action, 4 bearings', 1850, 1720, 1.1, '🎣', 5, 'Fishing & Outdoor'],
  ['reel-spool', 'Spinning reel', '1000 size, 12+1 bearings', 2250, 2100, 0.4, '🎣', 6, 'Fishing & Outdoor'],
  ['bait-pack', 'Bait pack', 'Soft plastic, 20 pieces', 145, 138, 0.4, '🐟', 24, 'Fishing & Outdoor'],
  ['lifejacket', 'Life jacket', 'Buckles, adjustable', 680, 650, 1.1, '🦺', 9, 'Fishing & Outdoor'],
  ['fishing-net', 'Cast net 3m', 'Lead-weighted edge', 685, 650, 2.4, '🕸️', 8, 'Fishing & Outdoor'],
  ['tackle-box', 'Tackle box', 'Multi-tray, 28cm', 385, 358, 1.2, '🧰', 14, 'Fishing & Outdoor'],
  ['swivel-set', 'Swivels and snaps', 'Assorted, 50 piece', 125, 115, 0.2, '🪝', 26, 'Fishing & Outdoor'],
  ['line-300m', 'Fishing line 300m', 'Braided, 30lb', 425, 395, 0.6, '🧵', 12, 'Fishing & Outdoor'],
  ['wetsuit', 'Wetsuit 3mm', 'Full suit, chest zip', 1450, 1380, 1.4, '🩱', 5, 'Fishing & Outdoor'],
  ['kayak-paddle', 'Double paddle', 'Adjustable, fibreglass', 885, 840, 0.9, '🛶', 6, 'Fishing & Outdoor'],
  ['hiking-poles', 'Trekking poles', 'Cork grip, aluminium', 685, 650, 0.6, '🥾', 10, 'Fishing & Outdoor'],

  // ------------------------------------------------------ curios & crafts
  ['carving', 'Wood carving', 'Mopane, hand-carved', 240, 230, 1.1, '🪵', 14, 'Curios & Crafts'],
  ['carving-animal', 'Animal carving', 'Mopane, 25cm', 385, 360, 1.4, '🪵', 9, 'Curios & Crafts'],
  ['beads-necklace', 'Beaded necklace', 'Glass and thread', 185, 172, 0.2, '📿', 16, 'Curios & Crafts'],
  ['skincare-3', 'Shea butter trio', 'Soap, butter and balm', 165, 155, 0.6, '🧼', 26, 'Curios & Crafts'],
  ['candle', 'Scented candle', 'Wax, 220g', 95, 88, 0.4, '🕯️', 30, 'Curios & Crafts'],
  ['woven-basket', 'Sedge basket', 'Hand-woven, small', 285, 265, 0.8, '🧺', 12, 'Curios & Crafts'],
  ['woven-mat', 'Sedge floor mat', 'Hand-woven, 1.5m', 685, 640, 2.4, '🧺', 7, 'Curios & Crafts'],
  ['potsetter', 'Clay pot, set of 3', 'Botswana stoneware', 425, 395, 3.2, '🏺', 8, 'Curios & Crafts'],
  ['leather-strap', 'Leather strap', 'Vegetable tanned', 145, 135, 0.2, '🟫', 18, 'Curios & Crafts'],
  ['wild-honey-jar', 'Wild honey, 500g', 'Sourced from the delta', 165, 150, 0.6, '🍯', 14, 'Curios & Crafts'],
  ['indigo-cloth', 'Indigo cloth, metre', 'Hand-dyed cotton', 185, 172, 0.3, '🧵', 14, 'Curios & Crafts'],
  ['story-book', 'Tswana story book', 'Illustrated, children', 145, 135, 0.3, '📖', 12, 'Curios & Crafts'],

  // ---------------------------------------------------- stationery & office
  ['exercise-book', 'Exercise book, 120 pages', '80gsm, hard cover', 38, 34, 0.3, '📓', 60, 'Stationery & Office'],
  ['biro-pack', 'Biro pack, 10', '0.5mm blue', 42, 38, 0.1, '🖊️', 50, 'Stationery & Office'],
  ['a4-ream', 'A4 paper, ream', '80gsm white', 128, 118, 2.5, '📄', 30, 'Stationery & Office'],
  ['pencil-case', 'Pencil case', 'Zip, printed', 68, 62, 0.15, '✏️', 34, 'Stationery & Office'],
  ['ruler-30', 'Ruler 30cm', 'Acrylic', 25, 22, 0.1, '📏', 44, 'Stationery & Office'],
  ['calculator', 'Scientific calculator', 'Exam approved', 285, 265, 0.25, '🧮', 14, 'Stationery & Office'],
  ['printer-paper-a4', 'Colour paper, 100 sheets', 'Assorted', 145, 135, 0.6, '📄', 18, 'Stationery & Office'],
  ['notebook-a5', 'Hardback notebook A5', 'Dotted pages', 125, 115, 0.4, '📔', 20, 'Stationery & Office'],
  ['stapler', 'Desktop stapler', 'Heavy duty, 50 sheets', 115, 105, 0.3, '📎', 20, 'Stationery & Office'],
  ['archive-box', 'Archive box A4', 'Cardboard, with lid', 85, 78, 0.9, '📦', 24, 'Stationery & Office'],

  // ----------------------------------------------- furniture & appliances
  ['sofa-2seat', 'Two-seater sofa', 'Fabric, wooden legs', 6850, 6400, 32, '🛋️', 3, 'Furniture & Appliances'],
  ['armchair', 'Armchair', 'Reclining, fabric', 4250, 3950, 21, '🪑', 4, 'Furniture & Appliances'],
  ['dining-table', 'Dining table, 6 seater', 'Solid wood, 180cm', 4850, 4500, 38, '🍽️', 3, 'Furniture & Appliances'],
  ['dining-chair', 'Dining chair', 'Solid wood', 685, 640, 5.4, '🪑', 12, 'Furniture & Appliances'],
  ['mattress-4x6', 'Mattress 4×6', 'Pocket spring, medium', 3850, 3600, 32, '🛏️', 4, 'Furniture & Appliances'],
  ['bed-frame-queen', 'Bed frame, queen', 'Solid wood, slatted', 5450, 5050, 48, '🛏️', 3, 'Furniture & Appliances'],
  ['fridge-250l', 'Fridge freezer 250L', 'Single door, 200W', 6850, 6450, 52, '🧊', 4, 'Furniture & Appliances'],
  ['washing-machine', 'Washing machine 8kg', 'Front load, digital', 7250, 6800, 62, '🧺', 3, 'Furniture & Appliances'],
  ['microwave-20l', 'Microwave 20L', 'Digital, 800W', 2450, 2280, 13, '📡', 6, 'Furniture & Appliances'],
  ['electric-kettle-steel', 'Kettle, steel 1.7L', 'Cordless base', 385, 358, 1.2, '🫖', 12, 'Furniture & Appliances'],
  ['iron-steam', 'Steam iron', 'Ceramic plate', 685, 645, 1.5, '👔', 8, 'Furniture & Appliances'],
  ['fan-stand', 'Stand fan 16 inch', 'Three speeds', 1250, 1180, 4.8, '🌀', 7, 'Furniture & Appliances'],

  // ----------------------------------------------------- sports & fitness
  ['football-size5', 'Football, size 5', 'Match grade', 385, 358, 0.45, '⚽', 14, 'Sports & Fitness'],
  ['netball', 'Netball', 'Size 5, indoor/outdoor', 345, 320, 0.4, '🏀', 12, 'Sports & Fitness'],
  ['dumbbell-set', 'Dumbbell set 20kg', 'Adjustable, pair', 2850, 2650, 21, '🏋️', 4, 'Sports & Fitness'],
  ['yoga-mat', 'Yoga mat 6mm', 'Non-slip, carry strap', 425, 395, 1.2, '🧘', 16, 'Sports & Fitness'],
['resistance-bands', 'Resistance bands, set of 4', 'Fabric, four tensions', 285, 265, 0.7, '💪', 18, 'Sports & Fitness'],
  ['bicycle-helmet', 'Bicycle helmet', 'Adjustable, vented', 445, 415, 0.4, '🚴', 14, 'Sports & Fitness'],
  ['water-bottle-1l', 'Sports water bottle 1L', 'Squeeze, insulated', 185, 170, 0.2, '🍶', 24, 'Sports & Fitness'],
  ['goggles-swim', 'Swim goggles', 'Anti-fog, silicone strap', 225, 210, 0.2, '🏊', 20, 'Sports & Fitness'],
  ['skipping-rope', 'Skipping rope', 'Ball-bearing, adjustable', 145, 135, 0.3, '🪢', 22, 'Sports & Fitness'],
  ['gym-mat', 'Gym mat 10mm', 'Foldable, non-slip', 685, 640, 2.4, '🧘', 9, 'Sports & Fitness'],

  // -------------------------------------------------------- baby & kids
  ['nappies-64', 'Nappies, size 4, 64 pack', 'Ultra absorb', 495, 460, 2.4, '🧷', 12, 'Baby & Kids'],
  ['baby-formula', 'Infant formula 900g', 'Stage 1', 485, 455, 0.95, '🍼', 16, 'Baby & Kids'],
  ['baby-powder', 'Baby powder 200g', 'Talc free', 92, 86, 0.2, '🧴', 18, 'Baby & Kids'],
  ['baby-bottle', 'Baby bottle 250ml', 'Anti-colic, 2 pack', 145, 135, 0.2, '🍼', 20, 'Baby & Kids'],
  ['wet-wipes', 'Baby wipes, 80 pack', 'Sensitive skin', 118, 108, 0.6, '🧻', 24, 'Baby & Kids'],
  ['child-chair', 'High chair', 'Tray, adjustable', 1850, 1720, 11, '🪑', 5, 'Baby & Kids'],
  ['toy-blocks', 'Building blocks, 100 piece', 'Wooden, natural', 485, 450, 2.2, '🧸', 10, 'Baby & Kids'],
  ['soft-toy', 'Soft toy', 'Washable, no small parts', 165, 150, 0.3, '🧸', 18, 'Baby & Kids'],

  // ------------------------------------------------------- garden & plants
  ['pot-plant-1', 'Potted plant 1m', 'Indoor, with pot', 385, 358, 6, '🪴', 12, 'Garden & Plants'],
  ['succulent-1', 'Succulent', 'Potted, low care', 95, 88, 1.2, '🌵', 22, 'Garden & Plants'],
  ['garden-hose-20', 'Garden hose 20m', 'Reinforced, brass nozzle', 685, 640, 4.5, '🪡', 8, 'Garden & Plants'],
  ['lawn-mower', 'Push lawn mower', 'Steel blade, 46cm', 3250, 3050, 14, '🌱', 4, 'Garden & Plants'],
  ['garden-shears', 'Garden shears', 'Stainless blades', 185, 170, 0.4, '✂️', 18, 'Garden & Plants'],
  ['watering-can-2', 'Watering can 2L', 'Galvanised', 125, 115, 0.6, '🪣', 20, 'Garden & Plants'],
  ['compost', 'Compost, 20L', 'Peat free', 85, 78, 8, '🌿', 16, 'Garden & Plants'],
  ['weedkiller-5l', 'Weedkiller 5L', 'Ready to use', 285, 265, 5.2, '🧪', 10, 'Garden & Plants'],

  // ------------------------------------------------------ auto care & tyres
  ['tyre', 'Tyre 205/55R16', 'Passenger, 3mm tread', 1850, 1750, 9, '🛞', 6, 'Auto Care & Tyres'],
  ['tyre-4x4', '4x4 tyre 265/65R17', 'All terrain, 3 piece', 3250, 3050, 42, '🛞', 4, 'Auto Care & Tyres'],
  ['car-wash', 'Car wash 5L', 'Shampoo and wax', 145, 135, 5.2, '🧴', 18, 'Auto Care & Tyres'],
  ['microfibre-4', 'Microfibre cloths, 4 pack', '400gsm', 125, 115, 0.3, '🧽', 22, 'Auto Care & Tyres'],
  ['tyre-pressure-gauge', 'Tyre pressure gauge', 'Digital, pencil type', 185, 170, 0.2, '📈', 16, 'Auto Care & Tyres'],
  ['jump-starter', 'Jump starter', '12V, with power bank', 1450, 1380, 1.6, '🔋', 8, 'Auto Care & Tyres'],
  ['car-vacuum', 'Car vacuum', '12V, 120W', 685, 650, 1.4, '🌀', 10, 'Auto Care & Tyres'],
  ['number-plate', 'Number plates, pair', 'Acrylic, bolt on', 385, 358, 0.6, '🔢', 14, 'Auto Care & Tyres'],

  // ----------------------------------------------------------- electrical
  ['bulb-led-4', 'LED bulb 4W', 'Warm white, E27', 78, 72, 0.1, '💡', 40, 'Electrical'],
  ['bulb-pack-4', 'LED bulbs, pack of 4', 'E27, 9W', 245, 228, 0.4, '💡', 20, 'Electrical'],
  ['extension-lead-5', 'Extension lead 5m', '3 sockets, 13A', 185, 170, 0.9, '🔌', 22, 'Electrical'],
  ['power-strip-6', 'Power strip 6 way', 'Surge protected', 385, 358, 0.6, '🔌', 16, 'Electrical'],
  ['switch-plate', 'Switch plate, single', 'Brushed chrome', 95, 88, 0.15, '🔲', 24, 'Electrical'],
  ['plug-16a', 'Industrial plug 16A', 'Three pin, weatherproof', 165, 152, 0.3, '🔌', 18, 'Electrical'],
  ['floodlight-led', 'LED floodlight 50W', 'Motion sensor', 785, 740, 1.1, '💡', 10, 'Electrical'],
  ['doorbell', 'Wireless doorbell', 'Chime unit and camera button', 685, 650, 0.4, '🔔', 12, 'Electrical'],
]

export const CATALOGUE: Record<string, CatalogueItem> = Object.fromEntries(
  rows.map(
    ([
      key,
      name,
      blurb,
      price,
      zar,
      kg,
      icon,
      stock,
      category,
      duty = 0,
      unit = 'each',
    ]): [string, CatalogueItem] => [
      key,
      { name, blurb, price, zar, kg, icon, stock, category, duty, unit },
    ],
  ),
)

export const CATALOGUE_KEYS = Object.keys(CATALOGUE)

/** Every item in one category, in catalogue order. */
export function itemsIn(category: string): string[] {
  return rows
    .filter((r) => r[8] === category)
    .map((r) => r[0])
}

/** The category a library key belongs to. */
export function categoryOf(key: string): string {
  return CATALOGUE[key]?.category ?? 'Groceries & Staples'
}

/* ------------------------------------------------------------------ *
 * Depth presets.
 *
 * A real shop does not stock six lines. Each preset says how many lines
 * a shop of that kind carries in each category; the seeder then picks
 * from the catalogue, rotating the pool by the shop's slug so that two
 * shops in the same town do not carry an identical shelf, and so the
 * same line really does appear in more than one town — which is what
 * gives Price Guard something to compare.
 * ------------------------------------------------------------------ */

export type Mix = Record<string, number>

export const MIXES: Record<string, Mix> = {
  grocery: {
    'Groceries & Staples': 12,
    'Fresh Produce & Butchery': 5,
    'Beverages & Cellar': 5,
    'Household & Cleaning': 4,
    'Bakery & Deli': 2,
    'Health & Beauty': 2,
  },
  foodHall: {
    'Groceries & Staples': 16,
    'Beverages & Cellar': 6,
    'Household & Cleaning': 5,
    'Fresh Produce & Butchery': 4,
    'Bakery & Deli': 3,
    'Stationery & Office': 2,
  },
  market: {
    'Fresh Produce & Butchery': 16,
    'Groceries & Staples': 4,
    'Bakery & Deli': 2,
    'Beverages & Cellar': 2,
  },
  butcher: {
    'Fresh Produce & Butchery': 14,
    'Bakery & Deli': 3,
    'Groceries & Staples': 2,
    'Beverages & Cellar': 2,
  },
  bakery: {
    'Bakery & Deli': 14,
    'Beverages & Cellar': 4,
    'Groceries & Staples': 3,
    'Curios & Crafts': 2,
  },
  hardware: {
    'Hardware & DIY': 14,
    'Electrical': 8,
    'Garden & Plants': 5,
    'Auto Care & Tyres': 5,
    'Home & Kitchen': 3,
  },
  hardwareWide: {
    'Hardware & DIY': 16,
    'Electrical': 8,
    'Garden & Plants': 6,
    'Auto Care & Tyres': 6,
    'Mining & Industrial': 4,
    'Home & Kitchen': 4,
  },
  building: {
    'Hardware & DIY': 12,
    'Garden & Plants': 6,
    'Electrical': 6,
    'Home & Kitchen': 5,
    'Auto Care & Tyres': 4,
  },
  homeware: {
    'Home & Kitchen': 16,
    'Furniture & Appliances': 8,
    'Household & Cleaning': 6,
    'Curios & Crafts': 3,
  },
  furniture: {
    'Furniture & Appliances': 14,
    'Home & Kitchen': 8,
    'Electrical': 5,
    'Household & Cleaning': 4,
  },
  beauty: {
    'Health & Beauty': 18,
    'Bags & Accessories': 3,
    'Curios & Crafts': 3,
  },
  fashion: {
    'Fashion': 18,
    'Footwear': 6,
    'Bags & Accessories': 6,
    'Jewellery & Gifts': 3,
  },
  boutique: {
    'Fashion': 10,
    'Jewellery & Gifts': 6,
    'Bags & Accessories': 5,
    'Curios & Crafts': 4,
  },
  textiles: {
    'Fashion': 12,
    'Curios & Crafts': 5,
    'Home & Kitchen': 4,
    'Bags & Accessories': 3,
  },
  mobile: {
    'Mobile & Tablets': 12,
    'Accessories': 14,
    'Computing & Gaming': 5,
    'Audio & TV': 3,
  },
  computing: {
    'Computing & Gaming': 12,
    'Accessories': 10,
    'Audio & TV': 4,
    'Stationery & Office': 4,
  },
  electronics: {
    'Audio & TV': 10,
    'Computing & Gaming': 6,
    'Accessories': 8,
    'Mobile & Tablets': 3,
  },
  motor: {
    'Motor Spares': 14,
    'Auto Care & Tyres': 10,
    'Electrical': 5,
  },
  mining: {
    'Mining & Industrial': 16,
    'Hardware & DIY': 8,
    'Electrical': 6,
    'Auto Care & Tyres': 4,
    'Garden & Plants': 2,
  },
  farm: {
    'Farm & Poultry': 14,
    'Garden & Plants': 6,
    'Groceries & Staples': 4,
    'Hardware & DIY': 3,
  },
  outdoor: {
    'Tourism & Safari': 12,
    'Fishing & Outdoor': 8,
    'Curios & Crafts': 4,
    'Sports & Fitness': 4,
  },
  fishing: {
    'Fishing & Outdoor': 14,
    'Tourism & Safari': 6,
    'Curios & Crafts': 3,
  },
  crafts: {
    'Curios & Crafts': 14,
    'Jewellery & Gifts': 5,
    'Fashion': 4,
    'Home & Kitchen': 3,
  },
  lodge: {
    'Tourism & Safari': 10,
    'Beverages & Cellar': 5,
    'Curios & Crafts': 4,
    'Sports & Fitness': 3,
  },
  provisions: {
    'Provisions & Fuel': 10,
    'Groceries & Staples': 8,
    'Beverages & Cellar': 6,
    'Auto Care & Tyres': 5,
    'Hardware & DIY': 4,
  },
  stationery: {
    'Stationery & Office': 12,
    'Home & Kitchen': 4,
    'Curios & Crafts': 3,
    'Accessories': 3,
  },
  sport: {
    'Sports & Fitness': 12,
    'Baby & Kids': 4,
    'Curios & Crafts': 2,
  },
  kids: {
    'Baby & Kids': 12,
    'Curios & Crafts': 4,
    'Fashion': 3,
  },
  fuel: {
    'Provisions & Fuel': 8,
    'Auto Care & Tyres': 8,
    'Motor Spares': 6,
    'Groceries & Staples': 4,
  },
  general: {
    'Groceries & Staples': 8,
    'Household & Cleaning': 5,
    'Beverages & Cellar': 4,
    'Health & Beauty': 4,
    'Stationery & Office': 3,
    'Accessories': 3,
  },
  generalWide: {
    'Groceries & Staples': 10,
    'Household & Cleaning': 6,
    'Beverages & Cellar': 5,
    'Health & Beauty': 5,
    'Stationery & Office': 4,
    'Accessories': 4,
    'Fresh Produce & Butchery': 3,
  },
  autoTyres: {
    'Auto Care & Tyres': 12,
    'Motor Spares': 10,
    'Electrical': 4,
  },
}

/** Alias kept for the seed module, which imports LIBRARY by name. */
export const LIBRARY = CATALOGUE

/** Depth presets for the Gaborone flagship aisles. */
export const FLAGSHIP_MIXES: Record<string, Mix> = {
  market: { 'Fresh Produce & Butchery': 14, 'Groceries & Staples': 4, 'Bakery & Deli': 3 },
  grocery: {
    'Groceries & Staples': 12,
    'Fresh Produce & Butchery': 5,
    'Beverages & Cellar': 5,
    'Household & Cleaning': 4,
    'Bakery & Deli': 3,
  },
  bakery: { 'Bakery & Deli': 12, 'Beverages & Cellar': 4, 'Groceries & Staples': 3 },
  beverages: {
    'Beverages & Cellar': 16,
    'Groceries & Staples': 5,
    'Fresh Produce & Butchery': 3,
    'Provisions & Fuel': 3,
  },
  homeware: {
    'Home & Kitchen': 14,
    'Furniture & Appliances': 6,
    'Household & Cleaning': 5,
    'Curios & Crafts': 3,
  },
  household: {
    'Household & Cleaning': 14,
    'Home & Kitchen': 6,
    'Groceries & Staples': 4,
    'Health & Beauty': 3,
  },
  beauty: { 'Health & Beauty': 16, 'Bags & Accessories': 3, 'Curios & Crafts': 3 },
  hardware: {
    'Hardware & DIY': 14,
    'Electrical': 7,
    'Garden & Plants': 5,
    'Auto Care & Tyres': 5,
    'Home & Kitchen': 3,
  },
  fashion: { 'Fashion': 16, 'Footwear': 6, 'Bags & Accessories': 5, 'Jewellery & Gifts': 3 },
  footwear: { 'Footwear': 12, 'Fashion': 8, 'Bags & Accessories': 4 },
  bags: { 'Bags & Accessories': 12, 'Fashion': 8, 'Jewellery & Gifts': 4 },
  jewellery: { 'Jewellery & Gifts': 10, 'Curios & Crafts': 6, 'Fashion': 4 },
  mobile: { 'Mobile & Tablets': 12, 'Accessories': 14, 'Computing & Gaming': 4 },
  electronics: { 'Audio & TV': 10, 'Computing & Gaming': 6, 'Accessories': 8, 'Mobile & Tablets': 3 },
  computing: { 'Computing & Gaming': 12, 'Accessories': 10, 'Audio & TV': 4, 'Stationery & Office': 4 },
  accessories: { 'Accessories': 14, 'Mobile & Tablets': 6, 'Computing & Gaming': 4 },
}
