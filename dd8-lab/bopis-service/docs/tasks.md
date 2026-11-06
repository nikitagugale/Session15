# Task breakdown for spec/bopis-eligibility.md

Built (per the drift report and spec review): REQ-001, 002, 004, 005, 006, 007, 009. Not built: REQ-003 (perishable) and REQ-008 (heavy).
`src/bopis/catalog.js` `isPerishable` is not reused: it tests shelfLifeDays <= 7, but REQ-003 is category based.

| Order | Task | Requirement | Files | Notes |
|---|---|---|---|---|
| 1 | Write failing tests for perishable: produce, dairy, meat, frozen, bakery excluded; pantry with shelfLifeDays 2 not excluded | REQ-003 | tests/spec/req-003.test.js (new) | Write first and see them red. Do not use shelfLifeDays |
| 2 | Add perishable rule by category in the eligibility function, with the ID in a comment | REQ-003 | src/bopis/eligibility.js | New code. Do not call the old `isPerishable` helper |
| 3 | Write failing tests for heavy: 20 kg eligible, 20.1 kg not | REQ-008 | tests/spec/req-008.test.js (new) | Write first and see them red. A missing weightKg counts as "no" per the header comment, so decide that case and test it |
| 4 | Add weight rule `weightKg > 20` returns false, with the ID in a comment | REQ-008 | src/bopis/eligibility.js | New code |
| 5 | Test stock buffer: stock 4 with quantity 2 eligible, stock 3 not | REQ-001 | tests/spec/req-001.test.js (new) | Already built, test only. Add the ID in a comment next to `STOCK_BUFFER` |
| 6 | Test quantity: 6 eligible, 7 not | REQ-002 | tests/spec/req-002.test.js (new) | Already built, test only. Add the ID in a comment next to `MAX_QUANTITY` |
| 7 | Test hazmat excluded | REQ-004 | tests/spec/req-004.test.js (new) | Already built, test only. Add the ID in a comment |
| 8 | Test age-restricted: excluded unless ageVerified | REQ-005 | tests/spec/req-005.test.js (new) | Already built, test only. Add the ID in a comment |
| 9 | Test gift cards excluded | REQ-006 | tests/spec/req-006.test.js (new) | Already built, test only. Add the ID in a comment |
| 10 | Test store closed excluded | REQ-007 | tests/spec/req-007.test.js (new) | Already built, test only. Add the ID in a comment |
| 11 | Test price cap: 2000 eligible, 2000.01 not | REQ-009 | tests/spec/req-009.test.js (new) | Already built, test only. Add the ID in a comment next to `HIGH_VALUE` |
