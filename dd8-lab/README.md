# DD8 Lab Kit: Spec-Driven Development with AI
**PwC Full-Stack AI track · Wed 4 Nov 2026 · 08:00–11:00 IST**

A retailer's "buy online, pick up in store" feature has drifted: the PRD says one thing, the team agreed another in Slack, and the
shipped code does a third. Over eight milestones you find the drift, turn the PRD into a structured spec, review it against what the
product owner really meant, close the gap with a test that cites its requirement, and build a traceability check that catches the next
drift before a customer does.

**This is a milestone lab, not a follow-along.** There are no prompts to paste. Each milestone is a ticket with a goal, an interface
contract and success criteria, in `LAB-GUIDE.md`. You decide how to get there, and you work at your own pace. The facilitator checks
in twice, after milestone 4 and after milestone 8, to walk through the steps, the tests and the solutions.

## Setup: at the start of the session (about a minute)

Needs **Node 20 or newer** and **git**. **There is nothing to install from the internet**: the project has no dependencies, so there is
no `npm ci`. Save `dd8-lab-kit.zip` in your home folder, then run this in a terminal on the lab VM:

```bash
cd ~
unzip -q dd8-lab-kit.zip     # or: python3 -m zipfile -e dd8-lab-kit.zip .
cd dd8-lab/bopis-service
npm test                     # should end with: pass 13
npm run setup                # makes the starting commit: "Shipped code as delivered"
npm run doctor               # should end with: Ready.
```

When `npm test` is green, open **only the `bopis-service` folder** in VS Code (File, Open Folder), then open `LAB-GUIDE.md`. Do not
open `dd8-lab` itself. The folders next to `bopis-service` (`hints/`, `checks/`, `checkpoints/`) hold the answers, including the
product owner's, and Claude Code reads everything in the folder you open.

Run `npm run setup` **before you change anything**: the starting commit must hold the code and the documents as delivered. (It
refuses if they have been changed.)

If `npm test` does not show `pass 13`, paste the last line of the error into the chat and carry on listening. It gets fixed at the
first break.

**Claude Code is the AI.** There is no API key, no database, no server. Every file in the project is made up: the retailer, the
people, the rules and the numbers.

## What is in the folder you open (`bopis-service/`)

| Path | What it is |
|---|---|
| `LAB-GUIDE.md` | **Your guide:** the nine milestone cards, the commands, the ground rules |
| `LAB-LOG.md` | **Your evidence log.** Two lines for each milestone |
| `docs/prd.md` | The product requirements (version 0.3, written in sprint 1) |
| `docs/slack-thread.md` | An export of what the team decided in Slack in sprints 2 and 3 |
| `src/bopis/eligibility.js` | **The shipped code:** `isBopisEligible(item, ctx)` |
| `src/bopis/catalog.js` | Item categories and helpers |
| `tests/existing/` | The team's tests. They record how the code behaves today. Not yours to edit |
| `tests/spec/` | **Your tests**, named after the requirements they check |
| `spec/` | **Your spec** goes here (`bopis-eligibility.md`) |
| `tools/` | **Your traceability check** goes here (`trace.mjs`) |
| `scripts/` | The lab's own runner (`step`, `hint`, `progress`, `checkpoint`, `po`). Not yours to edit |
| `CLAUDE.md` | The project's context file. Claude Code reads it automatically |

## Next to it (do not open these in VS Code)

| Folder | What it is |
|---|---|
| `checks/` | The hidden checks for each milestone, and the answer key they compare with |
| `checkpoints/` | The reference solution after each milestone (`npm run checkpoint -- N`) |
| `hints/` | Three hints for each milestone, the reference briefs, and the product owner's answers (`npm run po`) |
