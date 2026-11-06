import { test } from 'node:test';
import assert from 'node:assert/strict';
import { isBopisEligible } from '../../src/bopis/eligibility.js';

const item = (category, extra = {}) => ({ sku: 'X1', name: 'Thing', category, weightKg: 1, price: 10, ...extra });

for (const category of ['produce', 'dairy', 'meat', 'frozen', 'bakery']) {
  test(`REQ-003: a ${category} item is not eligible`, () => {
    assert.equal(isBopisEligible(item(category)), false);
  });
}

test('REQ-003: a frozen item with a long shelf life is still not eligible', () => {
  assert.equal(isBopisEligible(item('frozen', { shelfLifeDays: 365 })), false);
});

test('REQ-003: a pantry item with a short date (2 days) is eligible', () => {
  assert.equal(isBopisEligible(item('pantry', { shelfLifeDays: 2 })), true);
});

test('REQ-003: a non-perishable category with a short date (1 day) is eligible', () => {
  assert.equal(isBopisEligible(item('household', { shelfLifeDays: 1 })), true);
});

test('REQ-003: a household item is eligible', () => {
  assert.equal(isBopisEligible(item('household')), true);
});

test('REQ-003: a perishable item is not eligible even with a long date (30 days)', () => {
  assert.equal(isBopisEligible(item('dairy', { shelfLifeDays: 30 })), false);
});
