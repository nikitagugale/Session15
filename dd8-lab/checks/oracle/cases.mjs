// The sample situations the checks compare behaviour on: an item and a context (quantity, store stock, store open, age verified).
// Deterministic: the same list every time, on every machine. Every rule is reached on both of its sides, including every boundary.
const CATEGORIES = ['produce', 'dairy', 'meat', 'frozen', 'bakery', 'pantry', 'household', 'electronics', 'apparel', 'alcohol', 'gift-card'];
const WEIGHTS = [undefined, 0.5, 19.9, 20, 20.1, 35];
const PRICES = [10, 1999.99, 2000, 2000.01];
const SHELF = [null, 2, 7, 8, 14, 180, 365];
const QUANTITIES = [1, 2, 4, 6, 7];
const STOCKS = [undefined, 0, 2, 3, 4, 5, 6, 8, 9];

let seed = 20261104;
const next = () => { seed = (seed * 1103515245 + 12345) & 0x7fffffff; return seed / 0x7fffffff; };
const pick = list => list[Math.floor(next() * list.length)];

function makeItem(i, category, weightKg, price, shelfLifeDays) {
  const item = { sku: `S-${i}`, name: `Item ${i}`, category, price, shelfLifeDays };
  if (weightKg !== undefined) item.weightKg = weightKg;
  if (i & 1) item.hazmat = true;
  if (i & 2) item.ageRestricted = true;
  if (i & 4) item.supplier_recall = true;
  return item;
}

export function generateCases() {
  seed = 20261104;
  const cases = [];
  let i = 0;
  // 1. every combination of category, weight, price and shelf life, each with a few contexts
  for (const category of CATEGORIES) for (const w of WEIGHTS) for (const p of PRICES) for (const s of SHELF) {
    i += 1;
    const item = makeItem(i, category, w, p, s);
    for (let k = 0; k < 3; k++) {
      const ctx = {};
      const quantity = pick(QUANTITIES); if (next() < 0.7) ctx.quantity = quantity;
      const stock = pick(STOCKS); if (stock !== undefined) ctx.storeStock = stock;
      if (next() < 0.25) ctx.storeOpen = false;
      if (next() < 0.5) ctx.ageVerified = true;
      cases.push({ item, ctx });
    }
  }
  // 2. one plain item against EVERY combination of context: the stock, quantity, store and age rules on both sides
  const plain = { sku: 'P-1', name: 'Plain item', category: 'apparel', weightKg: 1, price: 24, shelfLifeDays: null };
  for (const quantity of QUANTITIES) for (const storeStock of STOCKS) for (const storeOpen of [true, false]) for (const ageVerified of [true, false]) {
    for (const flags of [{}, { ageRestricted: true }, { hazmat: true }, { supplier_recall: true }]) {
      const ctx = { quantity, storeOpen, ageVerified };
      if (storeStock !== undefined) ctx.storeStock = storeStock;
      cases.push({ item: { ...plain, ...flags }, ctx });
    }
  }
  // 3. the item with only a sku and a category, the way the PRD's own examples write it
  for (const category of CATEGORIES) cases.push({ item: { sku: 'X-1', category }, ctx: {} });
  return cases;
}

/** Compare two implementations on every case. Returns how many differ and the first few that do. */
export function compare(expected, actual, cases = generateCases()) {
  let different = 0;
  const first = [];
  for (const c of cases) {
    let got;
    try { got = actual(c.item, c.ctx); } catch (e) { got = `throws ${e.message}`; }
    const want = expected(c.item, c.ctx);
    if (got !== want) { different += 1; if (first.length < 4) first.push({ input: c, expected: want, actual: got }); }
  }
  return { different, total: cases.length, first };
}

export const describeCase = c => {
  const item = Object.entries(c.item).filter(([k]) => !['sku', 'name'].includes(k)).map(([k, v]) => `${k}: ${v}`).join(', ');
  const ctx = Object.entries(c.ctx).map(([k, v]) => `${k}: ${v}`).join(', ');
  return `item { ${item} } with { ${ctx || 'nothing else'} }`;
};
