# Task breakdown

Every task cites the requirement it serves. Two requirements still need code (REQ-003 and REQ-008). The others are already built, so for them the only missing thing is a test that names the requirement.

| Task | Requirement | Files | Notes |
|---|---|---|---|
| 1. Add tests for the stock buffer | REQ-001 | `tests/spec/requirements.test.js` (new) | Already implemented (`STOCK_BUFFER = 2`). Tests only |
| 2. Add tests for the quantity limit | REQ-002 | `tests/spec/requirements.test.js` (new) | Already implemented. Tests only |
| 3. Implement the perishable rule, by category | REQ-003 | `src/bopis/eligibility.js` | Not built: nothing refuses perishable items today. Do not reuse `isPerishable()` in `catalog.js`: it decides by shelf life, and the spec decides by category |
| 4. Add tests for the perishable rule | REQ-003 | `tests/spec/req-003-perishable.test.js` (new) | Write them first and watch them fail |
| 5. Add tests for hazmat items | REQ-004 | `tests/spec/requirements.test.js` (new) | Already implemented. Tests only |
| 6. Add tests for age-restricted items | REQ-005 | `tests/spec/requirements.test.js` (new) | Already implemented. Tests only |
| 7. Add tests for gift cards | REQ-006 | `tests/spec/requirements.test.js` (new) | Already implemented. Tests only |
| 8. Add tests for the store being open | REQ-007 | `tests/spec/requirements.test.js` (new) | Already implemented. Tests only |
| 9. Implement the weight limit, and test it | REQ-008 | `src/bopis/eligibility.js`, `tests/spec/req-008-weight.test.js` (new) | Not built. Homework |
| 10. Add tests for the high-value rule | REQ-009 | `tests/spec/requirements.test.js` (new) | Already implemented but in no requirement until the review. Tests only |
| 11. Write the REQ IDs next to the code | REQ-001 to REQ-009 | `src/bopis/eligibility.js` | Comments only, so that the traceability check can find them |
| 12. Build the traceability check | REQ-001 to REQ-009 | `tools/trace.mjs` (new) | Links each requirement to its code and its tests; flags drift |
