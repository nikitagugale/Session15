# Drift report: PRD v0.3 vs Slack thread vs shipped code

| Item | Source | Status | Evidence |
|---|---|---|---|
| Store stock | PRD section 1 | differs: PRD buffer is 3, code uses 2 | src/bopis/eligibility.js `STOCK_BUFFER = 2` and `storeStock < quantity + STOCK_BUFFER`. Slack, sprint 2 Tuesday: Dana and Raj agreed to 2, PRD never updated |
| Quantity | PRD section 2 | implemented | src/bopis/eligibility.js `MAX_QUANTITY = 6`, `quantity > MAX_QUANTITY` returns false |
| Perishable items | PRD section 3 | missing | src/bopis/eligibility.js has no perishable check. `isPerishable` in src/bopis/catalog.js is never imported or called (sprint 1 spike, "never wired in"). Slack, sprint 3 Monday/Wednesday: nobody owns it |
| Hazardous items | PRD section 4 | implemented | src/bopis/eligibility.js `if (item.hazmat) return false;` |
| Age-restricted items | PRD section 5 | implemented | src/bopis/eligibility.js `if (item.ageRestricted && !ageVerified) return false;` |
| Gift cards | PRD section 6 | implemented | src/bopis/eligibility.js `item.category === 'gift-card'` returns false |
| Store must be open | PRD section 7 | implemented | src/bopis/eligibility.js `if (!storeOpen) return false;` |
| Heavy items (over 20 kg) | PRD section 8 | missing | src/bopis/eligibility.js never reads `weightKg` (it is only listed in the header comment). Slack, sprint 3 Wednesday: nobody remembers whether it made it in |
| High-value price cap (over $2,000, exactly $2,000 allowed) | Slack sprint 2 Thursday (Mei, Raj); in no PRD section | undocumented | src/bopis/eligibility.js `HIGH_VALUE = 2000`, `item.price > HIGH_VALUE` returns false (strict, so $2,000 passes) |

**Summary:** 1 differs (stock buffer), 2 missing (perishable, heavy), 1 undocumented (price cap), 5 implemented.
