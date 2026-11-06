# Spec review: what the AI wrote, and what I decided

I compared the first draft of `spec/bopis-eligibility.md` with the product owner's answers (`npm run po`), the Slack thread and the code.

| Item | What the AI wrote | Decision | Why |
|---|---|---|---|
| REQ-003 perishable | "Items that spoil within 7 days": decided by shelf life | Changed to five categories (produce, dairy, meat, frozen, bakery) and pantry is not perishable | The product owner said it is not about the date on the packet. Frozen food lasts months and is still perishable |
| REQ-001 stock buffer | A buffer of 3, copied from the PRD | Changed to 2 | The Slack decision lowered it and the product owner confirmed it. The code already says 2 |
| The $2,000 rule | Not in the draft, because it is not in the PRD | Added as REQ-009 | The product owner wants it kept. Code with no requirement cannot be explained later |
| "Eligibility checks should be fast" | Flagged as too vague | Dropped, and added to the Non-goals | The product owner said performance is tracked elsewhere |
| "Most large items should be excluded" | Flagged as too vague | Merged into REQ-008 | The product owner said large means heavy: all items over 20 kg |
| "Good experience when not eligible" | Flagged as too vague | Moved to the Non-goals | The product owner said it is the design team's work |
| "Risky to hand over" | Flagged as too vague | Merged with REQ-004 and REQ-005 | The product owner meant hazardous and age-restricted items |
| REQ-001 to REQ-002 and REQ-004 to REQ-008 | Statements copied from the PRD, with given/when/then | Accepted | They match the PRD and the product owner's answers |

The AI guessed in two places (perishable, and the buffer), and left one gap (the $2,000 rule). Without the review each of them would have gone into the spec with the spec's authority.
