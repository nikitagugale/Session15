// Tests written from the acceptance criteria of the spec, one test for each given/when/then. Each name starts with the requirement ID,
// so that `npm test -- --grep REQ-001` runs the tests of one requirement and the traceability check can find them.
// (REQ-003 is in its own file. REQ-008, the weight limit, is not built yet.)
import test from 'node:test';
import assert from 'node:assert/strict';
import { isBopisEligible } from '../../src/bopis/eligibility.js';

const shirt = { sku: 'A-1', category: 'apparel', price: 24, weightKg: 0.3 };

// REQ-001: stock buffer of 2
test('REQ-001: a store with 3 units is enough for a customer who wants 1', () => {
  assert.equal(isBopisEligible(shirt, { quantity: 1, storeStock: 3 }), true);
});
test('REQ-001: a store with 2 units is not enough for a customer who wants 1', () => {
  assert.equal(isBopisEligible(shirt, { quantity: 1, storeStock: 2 }), false);
});
test('REQ-001: a store with 6 units is enough for a customer who wants 4', () => {
  assert.equal(isBopisEligible(shirt, { quantity: 4, storeStock: 6 }), true);
});

// REQ-002: at most 6 units
test('REQ-002: a customer who wants 6 units is eligible', () => {
  assert.equal(isBopisEligible(shirt, { quantity: 6 }), true);
});
test('REQ-002: a customer who wants 7 units is not eligible', () => {
  assert.equal(isBopisEligible(shirt, { quantity: 7 }), false);
});

// REQ-004: hazmat
test('REQ-004: an item flagged as hazmat is not eligible', () => {
  assert.equal(isBopisEligible({ ...shirt, hazmat: true }), false);
});
test('REQ-004: an item that is not flagged as hazmat is eligible', () => {
  assert.equal(isBopisEligible({ ...shirt, hazmat: false }), true);
});

// REQ-005: age verification
test('REQ-005: an age-restricted item with no age check is not eligible', () => {
  assert.equal(isBopisEligible({ ...shirt, ageRestricted: true }), false);
});
test('REQ-005: an age-restricted item with a verified age is eligible', () => {
  assert.equal(isBopisEligible({ ...shirt, ageRestricted: true }, { ageVerified: true }), true);
});
test('REQ-005: an item that is not age-restricted needs no age check', () => {
  assert.equal(isBopisEligible(shirt, { ageVerified: false }), true);
});

// REQ-006: gift cards
test('REQ-006: a gift card is not eligible', () => {
  assert.equal(isBopisEligible({ sku: 'G-1', category: 'gift-card', price: 50 }), false);
});

// REQ-007: the store must be open
test('REQ-007: nothing is eligible while the store is closed', () => {
  assert.equal(isBopisEligible(shirt, { storeOpen: false }), false);
});
test('REQ-007: an ordinary item is eligible while the store is open', () => {
  assert.equal(isBopisEligible(shirt, { storeOpen: true }), true);
});

// REQ-009: high-value items
test('REQ-009: an item priced at $2,000.01 is not eligible', () => {
  assert.equal(isBopisEligible({ ...shirt, price: 2000.01 }), false);
});
test('REQ-009: an item priced at exactly $2,000 is eligible', () => {
  assert.equal(isBopisEligible({ ...shirt, price: 2000 }), true);
});
test('REQ-009: an item priced at $1,999.99 is eligible', () => {
  assert.equal(isBopisEligible({ ...shirt, price: 1999.99 }), true);
});
