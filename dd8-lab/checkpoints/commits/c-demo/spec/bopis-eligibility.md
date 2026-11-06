# BOPIS eligibility: specification

**Owner:** Dana Whitfield (product owner)
**Approved by:** Dana Whitfield, after the review in `docs/spec-review.md`
**Source:** PRD v0.3 (`docs/prd.md`), the Slack thread in `docs/slack-thread.md`, and the product owner's answers.

An item is *eligible* when the site may offer it for pickup at the customer's chosen store.

## REQ-001: Store stock buffer

An item is eligible only if the chosen store has at least the quantity the customer wants plus a buffer of 2 units.

- **Given** a store with 3 units of an item and a customer who wants 1
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** a store with 2 units of an item and a customer who wants 1
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** a store with 6 units of an item and a customer who wants 4
- **When** eligibility is checked
- **Then** the item is eligible

## REQ-002: Quantity limit

A customer can order at most 6 units of one item for a single pickup.

- **Given** a customer who wants 6 units of an item
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** a customer who wants 7 units of an item
- **When** eligibility is checked
- **Then** the item is not eligible

## REQ-003: Perishable items are not eligible

Items in the categories produce, dairy, meat, frozen and bakery are perishable, and perishable items are not eligible for pickup. Whether an item is perishable depends only on its category, not on the date on the packet. Pantry items are shelf-stable and are not perishable.

- **Given** an item in the produce, dairy, meat, frozen or bakery category
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** a frozen item whose shelf life is 180 days
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** a pantry item whose date is 3 days away
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** an item in a category that is not on the perishable list, such as apparel
- **When** eligibility is checked
- **Then** the item is eligible

## REQ-004: Hazardous items are not eligible

Items flagged as hazardous materials (hazmat) are not eligible for pickup.

- **Given** an item flagged as hazmat
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** an item that is not flagged as hazmat
- **When** eligibility is checked
- **Then** the item is eligible

## REQ-005: Age-restricted items need age verification

An age-restricted item is eligible only when the customer's age has been verified at checkout.

- **Given** an age-restricted item and an order with no age check
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** an age-restricted item and an order whose age was verified
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** an item that is not age-restricted and an order with no age check
- **When** eligibility is checked
- **Then** the item is eligible

## REQ-006: Gift cards are not eligible

Gift cards are never eligible for pickup, because they are delivered digitally.

- **Given** an item in the gift-card category
- **When** eligibility is checked
- **Then** the item is not eligible

## REQ-007: The store must be open

Pickup is offered only while the chosen store is open for pickup.

- **Given** a store that is closed for pickup
- **When** eligibility is checked
- **Then** no item is eligible

- **Given** a store that is open for pickup
- **When** eligibility is checked
- **Then** an ordinary item is eligible

## REQ-008: Heavy items are not eligible

Items heavier than 20 kg are not eligible, because they are too heavy for curbside loading. Every item over 20 kg is excluded, not just some of them.

- **Given** an item that weighs 20.1 kg
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** an item that weighs exactly 20 kg
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** an item that weighs 5 kg
- **When** eligibility is checked
- **Then** the item is eligible

## REQ-009: High-value items are not eligible

An item priced above $2,000 is not eligible for pickup. This is the fraud team's rule from sprint 2. An item priced at exactly $2,000 is eligible.

- **Given** an item priced at $2,000.01
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** an item priced at exactly $2,000
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** an item priced at $1,999.99
- **When** eligibility is checked
- **Then** the item is eligible

## REQ-010: Recalled items are not eligible

An item flagged for a supplier recall (supplier_recall is true) is not eligible for pickup, because it must not be handed to a customer.

- **Given** an item with supplier_recall set to true
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** an item with supplier_recall set to false
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** an item with no supplier_recall flag
- **When** eligibility is checked
- **Then** the item is eligible

## Non-goals

This spec does not cover substitutions, home delivery, pricing and discounts, or payment. They are out of scope for this release. It also does not set a speed target for the eligibility check, and it does not cover how a customer is told that an item is not eligible.

## Flagged: too vague to test

These sentences from section 9 of the PRD were too vague to become requirements. The product owner has answered each one.

- "Eligibility checks should be fast." Not a requirement of this feature. Performance is tracked elsewhere, so it is left out.
- "Most large items should be excluded." Large means heavy: see REQ-008.
- "Customers should have a good experience when an item is not eligible." Out of scope: it is the design team's work (see Non-goals).
- "Items that are risky to hand over should be handled carefully." Means hazardous and age-restricted items: see REQ-004 and REQ-005.

## Changelog

- 1: First draft, converted from PRD v0.3 by Claude Code.
- 2: Reviewed against the product owner's answers. REQ-001: buffer is 2 (Slack decision). REQ-003: perishable is a list of five categories, not a shelf life. New REQ-009: the $2,000 rule. REQ-008 now covers "most large items". Section 9 answered.
- 3: New REQ-010 from the recall decision in Slack (docs/slack-recall.md): recalled items are not eligible.
