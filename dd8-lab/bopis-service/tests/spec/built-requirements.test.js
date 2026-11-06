import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBopisEligible } from '../../src/bopis/eligibility.js';

const item = (extra = {}) => ({ sku: 'X1', name: 'Thing', category: 'household', weightKg: 1, price: 10, ...extra });
const ok = (i, ctx) => assert.equal(isBopisEligible(i, ctx), true);
const no = (i, ctx) => assert.equal(isBopisEligible(i, ctx), false);

// REQ-001: store stock with a buffer of 2
test('REQ-001: quantity 2 and store stock 4 is eligible (4 >= 2 + 2)', () => ok(item(), { quantity: 2, storeStock: 4 }));
test('REQ-001: quantity 2 and store stock 3 is not eligible (3 < 4)', () => no(item(), { quantity: 2, storeStock: 3 }));
test('REQ-001: quantity 1 and store stock 3 is eligible, stock 2 is not', () => {
  ok(item(), { quantity: 1, storeStock: 3 });
  no(item(), { quantity: 1, storeStock: 2 });
});
test('REQ-001: quantity 6 and store stock 8 is eligible, stock 7 is not', () => {
  ok(item(), { quantity: 6, storeStock: 8 });
  no(item(), { quantity: 6, storeStock: 7 });
});
test('REQ-001: store stock 0 is not eligible', () => no(item(), { storeStock: 0 }));

// REQ-002: at most 6 units
test('REQ-002: quantity 6 with ample stock is eligible', () => ok(item(), { quantity: 6, storeStock: 100 }));
test('REQ-002: quantity 7 with ample stock is not eligible', () => no(item(), { quantity: 7, storeStock: 100 }));
test('REQ-002: quantity 1 with ample stock is eligible', () => ok(item(), { quantity: 1, storeStock: 100 }));
test('REQ-002: quantity 100 with ample stock is not eligible', () => no(item(), { quantity: 100, storeStock: 1000 }));

// REQ-004: hazmat excluded
test('REQ-004: an item with hazmat true is not eligible', () => no(item({ hazmat: true })));
test('REQ-004: an item with hazmat false is not excluded by hazmat', () => ok(item({ hazmat: false })));
test('REQ-004: an item with no hazmat flag is not excluded by hazmat', () => ok(item()));

// REQ-005: age-restricted needs verification
test('REQ-005: an age-restricted item with ageVerified false is not eligible', () => no(item({ ageRestricted: true }), { ageVerified: false }));
test('REQ-005: an age-restricted item with ageVerified true is eligible', () => ok(item({ ageRestricted: true }), { ageVerified: true }));
test('REQ-005: an age-restricted item with no age check recorded is not eligible', () => no(item({ ageRestricted: true })));
test('REQ-005: an item that is not age-restricted is eligible without verification', () => ok(item({ ageRestricted: false }), { ageVerified: false }));
test('REQ-005: ageVerified true does not make a hazmat item eligible', () => no(item({ ageRestricted: true, hazmat: true }), { ageVerified: true }));

// REQ-006: gift cards excluded
test('REQ-006: a gift-card item is not eligible, whatever the quantity or stock', () => {
  no(item({ category: 'gift-card' }));
  no(item({ category: 'gift-card' }), { quantity: 1, storeStock: 1000 });
});
test('REQ-006: a non gift-card category such as electronics is eligible', () => ok(item({ category: 'electronics' })));

// REQ-007: store must be open
test('REQ-007: storeOpen false is not eligible', () => no(item(), { storeOpen: false }));
test('REQ-007: storeOpen true is not excluded by the store', () => ok(item(), { storeOpen: true }));
test('REQ-007: a store that is closed excludes even a plain item with ample stock', () => no(item(), { storeOpen: false, storeStock: 1000, quantity: 1 }));

// REQ-009: price above 2000 excluded
test('REQ-009: an item priced 2000.00 is eligible', () => ok(item({ price: 2000 })));
test('REQ-009: an item priced 2000.01 is not eligible', () => no(item({ price: 2000.01 })));
test('REQ-009: an item priced 2001 is not eligible', () => no(item({ price: 2001 })));
test('REQ-009: an item priced 1999.99 is eligible', () => ok(item({ price: 1999.99 })));
