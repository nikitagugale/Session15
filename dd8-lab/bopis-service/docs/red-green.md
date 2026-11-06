# Red, then green: REQ-003 (perishable items)

Requirement: REQ-003, perishable items are not eligible (category produce, dairy, meat, frozen or bakery).

## Commands

1. Take the fix away: I deleted the one line `if (PERISHABLE_CATEGORIES.includes(item.category)) return false; // REQ-003` from `src/bopis/eligibility.js`.
2. `npm test -- --grep REQ-003`
3. Put the fix back with `git checkout src/bopis/eligibility.js`, because the fix is committed (`git stash` would have found nothing to set aside).
4. `npm test -- --grep REQ-003` again.

## What I saw

- **Without the fix (red):** 7 failed and 6 passed. The failures were the tests for bakery, dairy, frozen, meat and produce, the frozen item with a long shelf life, and the perishable item with a long date (30 days).
- **With the fix (green):** all 13 passed, 0 failed.
- The ones that stayed green without the fix are the cases where the item is meant to be eligible (pantry with a short date, household, and the short-dated non-perishable item). They pass either way, and that is right: they guard against a rule that is too wide, not a rule that is missing.

## What it would mean if a test had never been red

A test that was never red, and passes even with the fix removed, proves nothing: it is not checking the rule at all, so a green run says nothing about whether the feature works.

`git stash list` is empty and the fix is restored.
