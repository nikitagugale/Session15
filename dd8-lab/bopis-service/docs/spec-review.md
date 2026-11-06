# Spec review against the product owner's answers

| Item | What the AI wrote | Decision | Why |
|---|---|---|---|
| REQ-003 Perishable (most loosely read) | Perishable if shelfLifeDays <= 7, a guess borrowed from the unused `isPerishable` helper | Changed: perishable means category produce, dairy, meat, frozen or bakery; pantry and all others are not | Dana said it is not about the date. Frozen counts despite its long life, and short-dated pantry items do not |
| REQ-001 Stock buffer | Buffer of 3, from the PRD | Changed to 2 | The Slack decision stands and Dana confirmed it. The code already used 2 on purpose |
| $2,000 price cap | Only a flagged open question, no requirement | Added as REQ-009: above 2000.00 is excluded, exactly 2000 is eligible | Dana wants it kept as the fraud team's rule, so the code now has a requirement behind it |
| REQ-008 Heavy items | 20 kg limit, 20 eligible, 20.1 not | Accepted | Dana confirmed 20 kg exactly is eligible. Still wanted, not yet implemented |
| "Eligibility checks should be fast" | Flagged as an open question | Dropped, listed under Non-goals | Performance is tracked elsewhere, not a requirement of this feature |
| "Most large items should be excluded" | Flagged: what is "large"? | Merged into REQ-008 | Large means heavy, and all items over 20 kg are excluded |
| "Good experience when not eligible" | Flagged: what is observable? | Dropped, listed under Non-goals | It is the design team's work, out of scope for this spec |
| "Risky items handled carefully" | Flagged: which items? | Merged into REQ-004 and REQ-005 | Dana meant hazardous and age-restricted items, which have their own requirements |
| REQ-002, 004, 005, 006, 007 | Rules as in the PRD | Accepted | Dana: as the PRD says |
