// Milestone 5: the missing requirement. The perishable rule must do exactly what the (reviewed) spec says, nothing more, and its tests
// must carry the requirement's ID in their names AND be able to fail: each is run against five slightly wrong versions of the rule.
import test from 'node:test';
import assert from 'node:assert/strict';
import { REFERENCE, WITH_WEIGHT, PERISHABLE_MUTANTS } from '../../../checks/oracle/variants.mjs';
import { behaviourIn, commitsTouching, describeDifference, dirtyWork, editedFixtures, exists, isRepoReady, parseSpec, read, runTests, SPEC, testNames, testsAgainst, walk, withTree } from '../../../checks/lib/helpers.mjs';

function perishableId() {
  assert.ok(exists(SPEC), `${SPEC} is missing. Do milestones 2 and 3 first (or run npm run checkpoint -- 4).`);
  const req = parseSpec(read(SPEC)).reqs.find(r => /perishab|spoil/i.test(`${r.title} ${r.statement}`));
  assert.ok(req, 'the spec has no perishable requirement');
  return req.id;
}
const mine = (names, id) => names.filter(t => t.name.trim().startsWith(id) && !t.todo);

test('the code is committed, and the files that are not yours are untouched', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed. Put them back with git checkout -- <file>');
  assert.deepEqual(dirtyWork().filter(l => /src\/|tests\//.test(l)), [], 'you have code or test changes that are not committed. Commit them');
  assert.ok(commitsTouching('src').length >= 1, 'no commit has changed src/ yet');
});

test('the code does exactly what the spec says: perishable items are refused, and nothing else has changed', async () => {
  const r = await withTree('WORKING', dir => behaviourIn(dir, [REFERENCE, WITH_WEIGHT]));
  assert.equal(r.different, 0, `in ${r.different} of ${r.total} sample situations the code does not do what the spec says:\n${describeDifference(r)}\n  Fix the rule, and change nothing else: the other rules are not part of this milestone`);
});

test('the requirement ID is written next to the code that implements it', () => {
  const id = perishableId();
  const where = walk('src').filter(f => f.endsWith('.js')).filter(f => new RegExp(`\\b${id}\\b`).test(read(f)));
  assert.ok(where.length, `no file in src/ mentions ${id}. Put the ID in a comment next to the rule, so that "why does this code exist?" has a one-line answer`);
});

test('there are tests whose names start with the requirement ID, and they pass', async () => {
  const id = perishableId();
  const names = await withTree('WORKING', async dir => testNames(dir));
  assert.ok(mine(names, id).length >= 3, `found ${mine(names, id).length} test${mine(names, id).length === 1 ? '' : 's'} whose name starts with ${id}. You need at least three: one for what is excluded, one for what is NOT excluded, and one on the boundary`);
  const r = await withTree('WORKING', async dir => runTests(dir, ['--grep', id]));
  assert.equal(r.status, 0, `the ${id} tests do not all pass: ${r.failed.slice(0, 2).join(' | ')}`);
  assert.ok(r.pass >= 3, `only ${r.pass} test(s) ran for ${id}`);
});

test('the tests can fail: each of five slightly wrong versions of the rule is caught', async () => {
  const id = perishableId();
  const survived = await withTree('WORKING', async dir => {
    const out = [];
    for (const [what, cfg] of PERISHABLE_MUTANTS) {
      const r = testsAgainst(dir, cfg, ['--grep', id]);
      if (r.status === 0) out.push(what);
    }
    return out;
  });
  assert.deepEqual(survived, [], `your ${id} tests did NOT notice these mistakes in the rule. A test named after a requirement has to fail when the requirement is broken. Write a test that would fail for each`);
});
