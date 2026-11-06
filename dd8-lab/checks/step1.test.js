// Milestone 1: the drift report. Reads docs/drift-report.md and judges its FACTS against the hidden ground truth.
// Whether the prose is sensible is judged at the summary; what it claims about the code is checked now.
import test from 'node:test';
import assert from 'node:assert/strict';
import { columnIndex, commitsTouching, editedFixtures, exists, isRepoReady, read, table } from '../../../checks/lib/helpers.mjs';
import { DRIFT, statusKind } from '../../../checks/lib/truth.mjs';

const FILE = 'docs/drift-report.md';
const evidenceAt = h => h.findIndex(c => /evidence|proof|where|file/i.test(c) && !/source/i.test(c));
const ORDER = ['perishable', 'hazmat', 'gift', 'weight', 'highvalue', 'age', 'store', 'stock', 'quantity'];

function rows() {
  assert.ok(exists(FILE), `${FILE} is missing. Create it with the table from the milestone card.`);
  const t = table(read(FILE), h => columnIndex(h, /item|requirement|what|rule/i) >= 0 && columnIndex(h, /status|state|finding|result/i) >= 0 && evidenceAt(h) >= 0);
  assert.ok(t, 'there is no table with an Item column, a Status column and an Evidence column');
  const [i, s, e] = [columnIndex(t.header, /item|requirement|what|rule/i), columnIndex(t.header, /status|state|finding|result/i), evidenceAt(t.header)];
  return t.rows.filter(r => r[i]).map(r => ({ item: r[i], status: r[s] ?? '', evidence: r[e] ?? '', text: r.join(' ') }));
}

/** Give each truth the first unused row that is about it. */
function assign() {
  const all = rows(); // read once: a row used for one rule must not be given to another
  const used = new Set();
  const found = {};
  for (const id of ORDER) {
    const truth = DRIFT.find(d => d.id === id);
    const row = all.find(r => !used.has(r) && truth.item.test(r.item));
    if (row) { used.add(row); found[id] = row; }
  }
  return found;
}

test('docs/drift-report.md exists and has a table with an item, a status and the evidence for each row', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  assert.ok(rows().length >= 8, `the table has ${rows().length} rows. Go through every requirement of the PRD, and also look for what the code does that the PRD never mentions.`);
});

test('every requirement of the PRD has a row, and so does the rule that only the code knows about', () => {
  const found = assign();
  const missing = DRIFT.filter(d => !found[d.id]).map(d => d.what);
  assert.ok(missing.length <= 1, `these are not in your table: ${missing.join(', ')}. Read the PRD from section 1 to section 8, then read the code from the top.`);
});

test('the status of each row is what the code really shows', () => {
  const found = assign();
  const wrong = DRIFT.filter(d => found[d.id] && statusKind(found[d.id].status) !== d.expect);
  assert.deepEqual(wrong.map(d => `"${found[d.id].item.slice(0, 50)}"`), [], 'the status of these rows is not what the code shows. Open src/bopis/ and read it, line by line: do not search for a word and stop at the first hit');
});

test('every row says where you looked: a file that exists', () => {
  const bad = rows().filter(r => !(r.evidence.match(/\b(?:src|docs|tests)\/[\w./-]+/g) ?? []).some(f => exists(f)));
  assert.ok(bad.length <= 1, `these rows name no file that exists in the project: ${bad.slice(0, 3).map(r => `"${r.item.slice(0, 40)}"`).join(', ')}. In the Evidence column, name the file (and the line or the words) that shows it`);
});

test('the Slack thread is used as evidence, because it holds decisions the PRD does not', () => {
  assert.ok(rows().some(r => /slack/i.test(r.evidence) || /slack/i.test(r.text)), 'no row cites docs/slack-thread.md. Two of the rules the code follows were decided there');
});

test('the report is committed, and the PRD, the Slack export and the tests are untouched', () => {
  assert.deepEqual(editedFixtures(), [], 'these source files were changed. They are the record of what the team had: put them back with git checkout -- <file>');
  assert.ok(commitsTouching(FILE).length >= 1, 'docs/drift-report.md is not committed yet');
});
