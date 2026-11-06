# BOPIS eligibility spec

Owner: Dana Whitfield
Approved by: Dana Whitfield

Source: docs/prd.md v0.3. Where the product owner's answers differ from the PRD, the answers win.

## REQ-001: Store stock with buffer
An item is eligible only if store stock is at least the requested quantity plus a buffer of 2 units.
- Given quantity 2 and store stock 4, When eligibility is checked, Then the item is eligible (4 >= 2 + 2).
- Given quantity 2 and store stock 3, When eligibility is checked, Then the item is not eligible (3 < 4).

## REQ-002: Maximum quantity
A customer may order at most 6 units of one item per pickup.
- Given quantity 6 and ample stock, When eligibility is checked, Then the item is eligible.
- Given quantity 7 and ample stock, When eligibility is checked, Then the item is not eligible.

## REQ-003: Perishable items excluded
An item is perishable, and never eligible, if its category is produce, dairy, meat, frozen or bakery.
- Given an item of category frozen (shelf life of months), When eligibility is checked, Then the item is not eligible.
- Given an item of category produce, dairy, meat or bakery, When eligibility is checked, Then the item is not eligible.
- Given an item of category pantry with shelfLifeDays 2, When eligibility is checked, Then perishability does not exclude it (pantry is shelf-stable).
- Given an item of any other category, When eligibility is checked, Then perishability does not exclude it. The shelf-life date is not used.

## REQ-004: Hazardous items excluded
Items flagged as hazmat are never eligible for pickup.
- Given an item with hazmat true, When eligibility is checked, Then the item is not eligible.
- Given an item with hazmat false, When eligibility is checked, Then hazmat does not exclude it.

## REQ-005: Age-restricted items need verification
Age-restricted items are eligible only when the customer's age is verified.
- Given an age-restricted item and ageVerified false, When eligibility is checked, Then the item is not eligible.
- Given an age-restricted item and ageVerified true, When eligibility is checked, Then the item is eligible (other rules met).

## REQ-006: Gift cards excluded
Gift cards are never eligible for pickup.
- Given an item of category gift-card, When eligibility is checked, Then the item is not eligible, whatever the quantity or stock.

## REQ-007: Store must be open
Pickup is offered only while the chosen store is open.
- Given storeOpen false, When eligibility is checked, Then the item is not eligible.
- Given storeOpen true, When eligibility is checked, Then the store does not exclude it.

## REQ-008: Heavy items excluded
Items heavier than 20 kg are not eligible for pickup.
- Given an item with weightKg 20, When eligibility is checked, Then the item is eligible (other rules met).
- Given an item with weightKg 20.1, When eligibility is checked, Then the item is not eligible.

## REQ-009: High-value items excluded
An item priced above $2,000 is not eligible for pickup (fraud team rule).
- Given an item priced 2000.00, When eligibility is checked, Then the item is eligible (other rules met).
- Given an item priced 2000.01, When eligibility is checked, Then the item is not eligible.

## Non-goals
Substitutions, home delivery, pricing and discounts, and payment (PRD section 10).
Also out of scope, by the product owner's decision:
- Check speed ("Eligibility checks should be fast"): performance is tracked elsewhere.
- Customer experience when an item is not eligible: the design team's work.

## Flagged: too vague, resolved by the product owner
No open questions remain. These PRD section 9 sentences are not requirements.
- "Eligibility checks should be fast." Dropped: not a requirement of this feature.
- "Most large items should be excluded." Large means heavy: all items over 20 kg are excluded, which is REQ-008.
- "Customers should have a good experience when an item is not eligible." Out of scope, design team.
- "Items that are risky to hand over should be handled carefully." Means hazardous and age-restricted items: REQ-004 and REQ-005.

## Changelog
- 2026-11-04: First draft, converted from PRD v0.3 by Claude. Not yet reviewed by the owner.
- 2026-11-04: Reviewed against the product owner's answers. REQ-001 buffer changed from 3 to 2 (Slack decision confirmed). REQ-003 changed from a 7-day shelf-life guess to five categories (produce, dairy, meat, frozen, bakery). REQ-009 added for the $2,000 price cap. Section 9 sentences answered and the open questions closed. Approved by the product owner. Further changes to a requirement need her approval.
