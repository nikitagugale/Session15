// Milestone 8: prove the test was red first. The check does what the card asks you to do: it takes the fix away (the shipped code is put
// back in a scratch copy) and runs the requirement's tests. Some must fail there and all must pass with the fix. docs/red-green.md is your record.
import test from 'node:test';
import assert from 'node:assert/strict';
import { PRISTINE } from '../../../checks/oracle/variants.mjs';
import { commitsTouching, dirtyWork, exists, isRepoReady, parseSpec, read, runTests, SPEC, testsAgainst, words, withTree } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/red-green.md';
function perishableId() {
  assert.ok(exists(SPEC), `${SPEC} is missing. Do the earlier milestones first (or run npm run checkpoint -- 7).`);
  const req = parseSpec(read(SPEC)).reqs.find(r => /perishab|spoil/i.test(`${r.title} ${r.statement}`));
  assert.ok(req, 'the spec has no perishable requirement');
  return req.id;
}

test('with the fix, the requirement\'s tests pass', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const id = perishableId();
  const r = await withTree('WORKING', async dir => runTests(dir, ['--grep', id]));
  assert.equal(r.status, 0, `the ${id} tests fail with your fix: ${r.failed.slice(0, 2).join(' | ')}`);
  assert.ok(r.pass >= 3, `only ${r.pass} test(s) ran for ${id}`);
});

test('without the fix, at least two of them FAIL: they are red first, so they are a real check', async () => {
  const id = perishableId();
  const r = await withTree('WORKING', async dir => testsAgainst(dir, PRISTINE, ['--grep', id]));
  assert.ok(r.fail >= 2, `with the fix taken away, only ${r.fail} of the ${id} tests fail. A test that stays green when the feature is missing is not testing the feature. Make the tests specific`);
});

test('docs/red-green.md records what you did: the commands, the failure, the pass, and what a test that was never red would mean', () => {
  assert.ok(exists(FILE), `${FILE} is missing. Write down what you did and what you saw`);
  const text = read(FILE);
  assert.ok(words(text) >= 30, 'the note is too short to tell someone else how to repeat it');
  assert.ok(text.includes(perishableId()), 'the note does not name the requirement it is about');
  assert.ok(/npm test/.test(text), 'the note does not show the command you ran (npm test -- --grep <the ID>)');
  assert.ok(/\bfail/i.test(text) && /\bpass/i.test(text), 'the note should say what you saw in both runs: it failed without the fix, and passed with it');
  assert.ok(/never (been )?red|tautolog|always pass|could not fail|can.t fail|cannot fail|proves nothing|not (really )?check/i.test(text), 'say, in your own words, what it would mean if the test had never been red');
});

test('the note is committed, and nothing else is waiting to be committed', () => {
  assert.ok(commitsTouching(FILE).length >= 1, `${FILE} is not committed yet`);
  assert.deepEqual(dirtyWork(), [], 'you have changes that are not committed (did a stash get left behind? git stash list shows it; git stash pop brings the fix back)');
});
