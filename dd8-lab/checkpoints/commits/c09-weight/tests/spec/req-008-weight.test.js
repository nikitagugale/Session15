// Tests for REQ-008 (items heavier than 20 kg are not eligible), written from its acceptance criteria.
import test from 'node:test';
import assert from 'node:assert/strict';
import { isBopisEligible } from '../../src/bopis/eligibility.js';

const item = weightKg => ({ sku: 'W-1', category: 'household', price: 40, weightKg });

test('REQ-008: an item that weighs 20.1 kg is not eligible', () => {
  assert.equal(isBopisEligible(item(20.1)), false);
});

test('REQ-008: an item that weighs exactly 20 kg is eligible', () => {
  assert.equal(isBopisEligible(item(20)), true);
});

test('REQ-008: an item that weighs 5 kg is eligible', () => {
  assert.equal(isBopisEligible(item(5)), true);
});

test('REQ-008: an item of 35 kg is not eligible', () => {
  assert.equal(isBopisEligible(item(35)), false);
});
