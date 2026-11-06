# Drift report: the PRD, the Slack thread and the shipped code

I read `docs/prd.md` from section 1 to 8, then `docs/slack-thread.md`, then `src/bopis/eligibility.js` and `src/bopis/catalog.js` line by line. This table says, for each thing, what the PRD wants, what the code does, and where I saw it.

| Item | Source | Status | Evidence |
|---|---|---|---|
| Stock buffer | PRD section 1 says 3 units; Slack (sprint 2) lowered it to 2 | Differs: the code uses 2, the PRD still says 3 | `src/bopis/eligibility.js` (`STOCK_BUFFER = 2`), `docs/slack-thread.md` |
| Quantity limit of 6 | PRD section 2 | Implemented: seven or more is refused | `src/bopis/eligibility.js` (`MAX_QUANTITY`), `tests/existing/eligibility.test.js` |
| Perishable items | PRD section 3 | Missing: nothing in `eligibility.js` refuses them. `isPerishable()` exists in `catalog.js` but is never called, and nothing imports it | `src/bopis/catalog.js`, `src/bopis/eligibility.js` |
| Hazmat items | PRD section 4 | Implemented | `src/bopis/eligibility.js` (`item.hazmat`), `tests/existing/eligibility.test.js` |
| Age-restricted items | PRD section 5 | Implemented: needs `ageVerified` | `src/bopis/eligibility.js`, `tests/existing/eligibility.test.js` |
| Gift cards | PRD section 6 | Implemented | `src/bopis/eligibility.js` (`gift-card`), `tests/existing/eligibility.test.js` |
| Store must be open | PRD section 7 | Implemented | `src/bopis/eligibility.js` (`storeOpen`), `tests/existing/eligibility.test.js` |
| Heavy items over 20 kg | PRD section 8 | Missing: there is no weight check anywhere, and the word weight is not in the code | `src/bopis/eligibility.js` |
| Price above $2,000 | Slack (sprint 2, the fraud team) | Undocumented: the code refuses it, but no requirement mentions it and no test covers it | `src/bopis/eligibility.js` (`HIGH_VALUE`), `docs/slack-thread.md` |

**Also noticed.** Section 9 of the PRD ("General") has four sentences that cannot be tested as they stand: "fast", "most large items", "good experience" and "risky to hand over". They are not drift, but a spec cannot build on them.
