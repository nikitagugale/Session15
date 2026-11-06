// Tests for REQ-010 (items flagged for a supplier recall are not eligible), written from its acceptance criteria.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isBopisEligible } from '../../src/bopis/eligibility.js';

const kettle = { sku: 'K-1', category: 'household', price: 35, weightKg: 1.2 };

test('REQ-010: an item with supplier_recall set is not eligible', () => {
  assert.equal(isBopisEligible({ ...kettle, supplier_recall: true }), false);
});

test('REQ-010: an item with supplier_recall false is eligible', () => {
  assert.equal(isBopisEligible({ ...kettle, supplier_recall: false }), true);
});

test('REQ-010: an item with no supplier_recall flag is eligible', () => {
  assert.equal(isBopisEligible(kettle), true);
});
