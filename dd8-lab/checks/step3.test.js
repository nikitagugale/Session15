// Milestone 3: the review. The spec must now say what the product owner said (not what the PRD said, and not what the AI guessed),
// the review must be written down, and the spec must have a history. Reads spec/bopis-eligibility.md and docs/spec-review.md.
import test from 'node:test';
import assert from 'node:assert/strict';
import { columnIndex, commitsTouching, dirtyWork, exists, isRepoReady, parseSpec, read, section, SPEC, table, words } from '../../../checks/lib/helpers.mjs';
import { PERISHABLE_CATEGORIES, VAGUE } from '../../../checks/lib/truth.mjs';

const REVIEW = 'docs/spec-review.md';
const spec = () => {
  assert.ok(exists(SPEC), `${SPEC} is missing. Do milestone 2 first (or run npm run checkpoint -- 2).`);
  return parseSpec(read(SPEC));
};
const about = (reqs, re) => reqs.find(r => re.test(`${r.title} ${r.statement}`));

test('the perishable requirement says what the product owner means by perishable, and nothing looser', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const req = about(spec().reqs, /perishab|spoil/i);
  assert.ok(req, 'the spec has no perishable requirement. Do milestone 2 first');
  const t = req.text.toLowerCase();
  const missing = PERISHABLE_CATEGORIES.filter(c => !t.includes(c));
  assert.deepEqual(missing, [], 'the perishable requirement does not yet name every category that the product owner counts as perishable. Ask the product owner: npm run po');
  assert.ok(/pantry|shelf[- ]stable/.test(t), 'the perishable requirement does not say what is NOT perishable. A boundary is part of the requirement');
  const dateWords = /shelf[- ]life|expir|best before|use by|\bdays\b|\bdate\b|spoil within/i;
  const definedByDate = req.statement.split(/(?<=[.!?])\s+/).filter(s => dateWords.test(s) && !/\b(not|no|never|regardless|ignor\w+|rather than|instead of|isn.t|doesn.t|without)\b/i.test(s));
  const refusedByDate = req.criteria.filter(c => dateWords.test(c) && /not eligible|ineligible|refus/i.test(c.split(/\bthen\b/i).pop()) && !PERISHABLE_CATEGORIES.some(k => c.toLowerCase().includes(k)));
  assert.deepEqual([...definedByDate, ...refusedByDate], [], 'the perishable requirement still decides by the date on the packet. The product owner decided by something else');
});

test('the stock requirement follows the decision the team took in Slack and the product owner confirmed', () => {
  const req = about(spec().reqs, /stock|buffer|inventory/i);
  assert.ok(req, 'the spec has no stock requirement. Do milestone 2 first');
  const head = `${req.title} ${req.statement}`;
  assert.ok(/\b(2|two)\b/i.test(head) && !/\b(3|three)\b/i.test(head), 'the stock requirement still says what the PRD said. The code does something else, on purpose: find out why');
});

test('the rule that only the code knew about is now a requirement, so the code has a reason to exist', () => {
  const { reqs } = spec();
  assert.ok(reqs.some(r => /2,?000/.test(r.text) && /price|value|cost|\$/i.test(r.text)), 'a rule in the code is in no requirement. Code that no requirement explains is code nobody can defend in six months. Ask the product owner whether to keep it');
});

test('the review is written down: what the AI wrote, what you decided, and why', () => {
  assert.ok(exists(REVIEW), `${REVIEW} is missing. Create it with the table from the milestone card.`);
  const t = table(read(REVIEW), h => columnIndex(h, /decision|outcome|action|verdict/i) >= 0 && columnIndex(h, /item|requirement|spec|what|sentence/i) >= 0);
  assert.ok(t, 'there is no table with an Item column and a Decision column');
  const d = columnIndex(t.header, /decision|outcome|action|verdict/i);
  const why = columnIndex(t.header, /why|reason|because|note/i);
  assert.ok(t.rows.length >= 4, `the review has ${t.rows.length} row${t.rows.length === 1 ? '' : 's'}. List every place where the AI guessed, or the PRD was unclear, or the product owner disagreed`);
  const undecided = t.rows.filter(r => !/accept|keep|kept|add|chang|correct|reject|remov|drop|merg|mov|asked|ask |question|defer|open|non-?goal|out of scope|confirm|fix|rewr|new|follow|tighten|clarif|sharpen|narrow|replac|updat|reword|adjust|amend|split|flag|specif|defin|align|approv|reconcil|rename|expand|extend|limit|decid/i.test(r[d] ?? ''));
  assert.deepEqual(undecided.map(r => r[0].slice(0, 40)), [], 'these rows do not say what you decided in the Decision column. Begin it with a verb such as accepted, changed, tightened, dropped, merged, moved, asked or deferred');
  if (why >= 0) assert.ok(t.rows.filter(r => words(r[why]) >= 4).length >= 3, 'at least three rows need a reason of a few words: why did you decide that?');
  const text = read(REVIEW);
  assert.ok(/perishab/i.test(text), 'the review says nothing about the perishable requirement, the one the AI is most likely to have read too loosely');
  const flagged = VAGUE.filter(v => v.re.test(text)).length;
  assert.ok(flagged >= 3, `the review deals with ${flagged} of the 4 vague sentences. Each one needs an answer: a requirement, a non-goal, or dropped`);
});

test('the spec is approved by its owner and its history shows the change', () => {
  const s = spec();
  assert.ok(s.approvedBy && /dana/i.test(s.approvedBy), 'the spec has no "Approved by" line naming the product owner. Nothing in a spec is settled until its owner says so');
  assert.ok(s.owner && /dana/i.test(s.owner), 'the owner of the spec is not the product owner');
  const log = section(s.text, /change ?log|version|history/i) ?? '';
  assert.ok(log.split('\n').filter(l => /\S/.test(l) && !/^\W*(date|version)\W*\|/i.test(l) && !/^[\s|:-]+$/.test(l)).length >= 2, 'the changelog has fewer than two entries: the first draft, and this review');
  assert.ok(commitsTouching('spec').length >= 2, 'the spec has been committed only once. Commit the AI\'s first draft, then commit your review of it: git log then shows the change, and what was there before');
  assert.deepEqual(dirtyWork().filter(l => /spec\/|docs\//.test(l)), [], 'the spec or the review has changes that are not committed');
});
