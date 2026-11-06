// The presenter's live demo (slide 161): a Slack decision that nobody wrote down. The same method as the lab, done once, in front of the room:
// the decision becomes a requirement in the spec, then code, then a test whose name cites the requirement. Not a milestone.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WITH_RECALL, RECALL_MUTANTS } from '../../../checks/oracle/variants.mjs';
import { behaviourIn, commitsTouching, describeDifference, dirtyWork, editedFixtures, exists, isRepoReady, parseSpec, read, runTests, SPEC, testNames, testsAgainst, walk, withTree } from '../../../checks/lib/helpers.mjs';

function recallReq() {
  assert.ok(exists(SPEC), `${SPEC} is missing`);
  const { reqs } = parseSpec(read(SPEC));
  const req = reqs.find(r => /recall/i.test(`${r.title} ${r.statement}`));
  assert.ok(req, 'the spec has no requirement about recalled items yet');
  return { req, reqs };
}

test('the Slack decision is a requirement in the spec: a statement, a given/when/then criterion, and an ID that is new', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const { req, reqs } = recallReq();
  assert.ok(req.criteria.length >= 1, `${req.id} has no given/when/then criterion`);
  assert.equal(reqs.filter(r => r.id === req.id).length, 1, 'the ID is used twice');
  assert.ok(/supplier_recall|recall/i.test(req.text) && /not eligible|ineligible|excluded|refus|is not|never/i.test(req.text), `${req.id} should say that a recalled item is not eligible`);
});

test('the code refuses recalled items, and nothing else has changed', async () => {
  const r = await withTree('WORKING', dir => behaviourIn(dir, WITH_RECALL));
  assert.equal(r.different, 0, `in ${r.different} of ${r.total} situations the code does not do what the new requirement says:\n${describeDifference(r)}`);
  assert.deepEqual(editedFixtures(), [], 'the lab files were changed');
});

test('the test\'s name cites the requirement, it passes, and it fails when the rule is missing', async () => {
  const { req } = recallReq();
  const names = await withTree('WORKING', async dir => testNames(dir));
  assert.ok(names.some(t => t.name.trim().startsWith(req.id)), `no test name starts with ${req.id}`);
  assert.ok(walk('src').filter(f => f.endsWith('.js')).some(f => new RegExp(`\\b${req.id}\\b`).test(read(f))), `${req.id} is not written next to the code`);
  const ok = await withTree('WORKING', async dir => runTests(dir, ['--grep', req.id]));
  assert.equal(ok.status, 0, `the ${req.id} test fails: ${ok.failed[0] ?? ''}`);
  const survived = await withTree('WORKING', async dir => RECALL_MUTANTS.filter(([, cfg]) => testsAgainst(dir, cfg, ['--grep', req.id]).status === 0).map(([w]) => w));
  assert.deepEqual(survived, [], 'the test stays green when the rule is taken away: it is not a check');
});

test('the work is committed', () => {
  assert.ok(commitsTouching('spec').length >= 1 && commitsTouching('src').length >= 1, 'commit the spec and the code');
  assert.deepEqual(dirtyWork(), [], 'there are changes that are not committed');
});
