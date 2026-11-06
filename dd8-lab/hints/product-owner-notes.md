# Product owner's answers

*Dana Whitfield, product owner. Written after the team asked what the PRD really meant. These answers are the product owner's
actual intent. Where they differ from the PRD, they win.*

**Who approves changes to the spec?** I do. The spec owner is **Dana Whitfield**. Nobody else changes a requirement without my say.

## Stock buffer

The Slack decision stands: the buffer is **2 units**, not 3. An item is eligible when the store has at least the quantity wanted plus 2.

## Quantity

At most 6 units of one item. Six is allowed, seven is not.

## What "perishable" means

"Anything that spoils quickly" was my shorthand, and it is too loose. It is **not** about the date on the packet. Perishable means the
item is in one of these five categories: **produce, dairy, meat, frozen and bakery**. Frozen counts, even though a frozen item lasts
for months. **Pantry** items (tins, dry pasta, rice) are shelf-stable and are **not** perishable, even when they have a short date.
All other categories are not perishable.

## Hazardous, age-restricted, gift cards, store open

As the PRD says. For age-restricted items, "verified" means the order has an age check recorded at checkout. For a store that is not
open for pickup, nothing is eligible.

## Heavy items

The limit is **20 kg**. An item of exactly 20 kg is eligible; anything heavier is not. This one is still wanted: it is not done yet.

## The $2,000 rule

Keep it. It is the fraud team's rule, and I want it in the requirements. An item priced **above $2,000** is not eligible; exactly
$2,000 is fine.

## The sentences in section 9 of the PRD

- *"Eligibility checks should be fast."* This is not a requirement of this feature. Performance is tracked elsewhere. Leave it out.
- *"Most large items should be excluded."* Wrong word. Large means heavy, and **all** items over 20 kg are excluded. That is section 8.
- *"Customers should have a good experience when an item is not eligible."* That is the design team's work and is out of scope for this spec.
- *"Items that are risky to hand over should be handled carefully."* I meant hazardous and age-restricted items, which have their own requirements.

## Out of scope

Substitutions, home delivery, pricing and discounts, and payment, as the PRD says.
