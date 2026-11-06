# My lab log

*Keep this short. Two lines for each milestone is plenty. This is your own evidence of what you did and what you learned: the facilitator
may ask to see it, and the capstone will ask for the same kind of evidence.*

**Your name:**   **Date:** Wednesday 4 November 2026

---

## Milestone 1 · Find the drift
- **How I did it** (my brief, or by hand): Claude read the PRD, the Slack thread and the two source files and wrote `docs/drift-report.md`, one row per PRD requirement plus the price cap.
- **Hints taken** (none / 1 / 2 / 3, and whether early): none
- **Synced?** (yes / no): yes
- **What I learned, or what surprised me:** Two requirements (perishable, heavy) are missing, and `isPerishable` exists in `catalog.js` but is never called. The buffer (2 vs 3) and the $2,000 cap were decided only in Slack.
- **Noticed** (something that looks wrong, that I did not change): the step check needed a starting commit, so `npm run setup` had to be run, and my first report was swept into it.

## Milestone 2 · Convert the PRD to a spec
- **How I did it:** Claude drafted `spec/bopis-eligibility.md` from the PRD and my drift report: REQ-001 to REQ-008, Non-goals, a Flagged section, Owner and Changelog. I committed the first draft unedited.
- **Hints taken:** none
- **What the AI guessed:** the perishable cut-off (7 days, borrowed from the unused helper) and the PRD's buffer of 3 over Slack's 2. Both are flagged as open questions.
- **What I learned:** a spec needs numeric criteria and an honest list of what it cannot pin down. The four vague sentences in section 9 are flagged and are not requirements.

## Milestone 3 · Review against real intent
- **Did I ask the product owner before this milestone?** (yes / no): no, I ran `npm run po` at the start of this milestone, after the milestone 2 draft was committed.
- **What I changed, and why:** Perishable became five categories (produce, dairy, meat, frozen, bakery) instead of my 7-day guess. The stock buffer went from 3 to 2, and the $2,000 cap became REQ-009. The four vague sentences were answered, and Dana is recorded as approver.
- **Hints taken:** none

## Milestone 4 · Generate the task breakdown
- **How I did it:** Claude wrote `docs/tasks.md` from the reviewed spec and the drift report: 11 tasks, each citing a requirement ID. Perishable and heavy get a test task and a code task. The other seven requirements get a test task only.
- **Hints taken:** none
- **A task the AI proposed that I removed, and why:** none removed. Claude did not plan to reuse `isPerishable` from `catalog.js`, because it tests shelf life and the spec says perishable is decided by category.

## Milestone 5 · Implement the missing requirement
- **How I did it:** Claude wrote `tests/spec/req-003.test.js` first, then added a `PERISHABLE_CATEGORIES` list and one `// REQ-003` line to `src/bopis/eligibility.js`. Committed together.
- **Hints taken:** none
- **Did I write the tests first? Were they red?** Yes. 7 failed and 5 passed. The 5 that passed are cases where the rule is absent anyway (pantry, household, short-date non-perishables).
- **What I reviewed in the AI's diff:** The diff is 2 added lines in `eligibility.js`. It checks the category and does not use `shelfLifeDays`. It does not call the old `isPerishable` helper, and the weight rule is untouched.

## Milestone 6 · Tests from the acceptance criteria
- **How I did it:** Claude wrote `tests/spec/built-requirements.test.js`: 25 tests for REQ-001, 002, 004, 005, 006, 007 and 009, each name starting with its ID. The first tests follow the spec's criteria and the rest cover the edges (stock 3 vs 2, quantity 6 vs 7, price 2000 vs 2000.01). `src/` was not changed. Full suite: 49 pass.
- **Hints taken:** none
- **Which criterion was hardest to turn into a test?** The REQ-005 "no age check recorded" case, because the spec says only "verified" and the test has to assume a missing `ageVerified` means not verified. I did not break a rule by hand to see which test goes red.

## Milestone 7 · Build the traceability check
- **How I did it:**
- **Hints taken:**
- **What would have fooled a simple search for the ID?**

## Milestone 8 · Prove the test was red first
- **Which tests failed without the fix?**
- **Hints taken:**
- **Which did not, and was that right?**

## Homework · Milestone 9
- **Time it took:**
- **Anything in the earlier milestones that I would now change?**

---

## In one sentence
What is the difference between a PRD and a spec, in your own words?
