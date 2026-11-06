// Tests for REQ-003 (perishable items are not eligible), written from its acceptance criteria. Each name starts with the requirement ID.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isBopisEligible } from '../../src/bopis/eligibility.js';

const item = (category, extra = {}) => ({ sku: 'T-1', category, price: 10, weightKg: 1, ...extra });

test('REQ-003: produce, dairy, meat, frozen and bakery items are not eligible', () => {
  for (const category of ['produce', 'dairy', 'meat', 'frozen', 'bakery']) {
    assert.equal(isBopisEligible(item(category)), false, `${category} should not be eligible`);
  }
});

test('REQ-003: a frozen item is not eligible, even though its shelf life is 180 days', () => {
  assert.equal(isBopisEligible(item('frozen', { shelfLifeDays: 180 })), false);
});

test('REQ-003: a pantry item is eligible, even when its date is 3 days away', () => {
  assert.equal(isBopisEligible(item('pantry', { shelfLifeDays: 3 })), true);
});

test('REQ-003: an item in a category that is not on the perishable list is eligible', () => {
  assert.equal(isBopisEligible(item('apparel')), true);
});
