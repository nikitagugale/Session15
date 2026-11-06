# BOPIS eligibility: specification

**Owner:** Dana Whitfield (product owner)
**Source:** PRD v0.3 (`docs/prd.md`), converted by Claude Code. First draft.

An item is *eligible* when the site may offer it for pickup at the customer's chosen store.

## REQ-001: Store stock buffer

An item is eligible only if the chosen store has at least the quantity the customer wants plus a buffer of 3 units.

- **Given** a store with 4 units of an item and a customer who wants 1
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** a store with 3 units of an item and a customer who wants 1
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** a store with 7 units of an item and a customer who wants 4
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

Perishable items, meaning items that spoil within 7 days, are not eligible for pickup.

- **Given** an item with a shelf life of 5 days
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** an item with a shelf life of 30 days
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

Items heavier than 20 kg are not eligible, because they are too heavy for curbside loading.

- **Given** an item that weighs 20.1 kg
- **When** eligibility is checked
- **Then** the item is not eligible

- **Given** an item that weighs exactly 20 kg
- **When** eligibility is checked
- **Then** the item is eligible

- **Given** an item that weighs 5 kg
- **When** eligibility is checked
- **Then** the item is eligible

## Non-goals

This spec does not cover substitutions, home delivery, pricing and discounts, or payment. They are out of scope for this release.

## Flagged: too vague to test

These sentences from section 9 of the PRD cannot be turned into a requirement as they are. They need an answer from the product owner.

- "Eligibility checks should be fast." Fast compared with what, and how is it measured?
- "Most large items should be excluded." What is large, and what is "most"?
- "Customers should have a good experience when an item is not eligible." Nothing here can be checked by a test.
- "Items that are risky to hand over should be handled carefully." Which items, and what does carefully mean?

## Changelog

- 1: First draft, converted from PRD v0.3 by Claude Code.
