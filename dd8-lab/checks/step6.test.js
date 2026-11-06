// Milestone 6: tests from the acceptance criteria. Every criterion of every requirement that is built has a test whose name starts with
// the requirement's ID; the whole REQ suite is green; and the tests can FAIL: sixteen slightly wrong versions of the rules are run against them.
import test from 'node:test';
import assert from 'node:assert/strict';
import { OTHER_MUTANTS, PERISHABLE_MUTANTS } from '../../../checks/oracle/variants.mjs';
import { behaviourIn, commitsTouching, dirtyWork, editedFixtures, exists, isRepoReady, parseSpec, read, runTests, SPEC, testNames, testsAgainst, withTree } from '../../../checks/lib/helpers.mjs';
import { REFERENCE, WITH_WEIGHT } from '../../../checks/oracle/variants.mjs';

const notBuilt = r => /weight|\bkg\b|heavy/i.test(`${r.title} ${r.statement}`);
const specReqs = () => {
  assert.ok(exists(SPEC), `${SPEC} is missing. Do milestones 2 to 5 first (or run npm run checkpoint -- 5).`);
  return parseSpec(read(SPEC)).reqs;
};

test('the code and the tests are committed, and the files that are not yours are untouched', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed: put them back with git checkout -- <file>');
  assert.deepEqual(dirtyWork().filter(l => /src\/|tests\//.test(l)), [], 'you have code or test changes that are not committed');
  assert.ok(commitsTouching('tests/spec').length >= 1, 'no commit has added tests under tests/spec/ yet');
});

test('the code still does exactly what the spec says', async () => {
  const r = await withTree('WORKING', dir => behaviourIn(dir, [REFERENCE, WITH_WEIGHT]));
  assert.equal(r.different, 0, `the code no longer does what the spec says in ${r.different} sample situations. Writing tests should not change the code`);
});

test('every acceptance criterion of every built requirement has a test whose name starts with the requirement ID', async () => {
  const reqs = specReqs().filter(r => !notBuilt(r));
  const names = await withTree('WORKING', async dir => testNames(dir));
  const short = [];
  for (const r of reqs) {
    const have = names.filter(t => t.name.trim().startsWith(r.id) && !t.todo).length;
    if (have < Math.max(1, r.criteria.length)) short.push(`${r.id} (${have} test${have === 1 ? '' : 's'} for ${Math.max(1, r.criteria.length)} criteri${r.criteria.length === 1 ? 'on' : 'a'})`);
  }
  assert.deepEqual(short, [], 'these requirements have fewer tests than acceptance criteria. Each given/when/then is one test, named after its requirement');
  const known = new Set(specReqs().map(r => r.id));
  const strange = names.map(t => /^REQ-\d{3}/.exec(t.name.trim())?.[0]).filter(id => id && !known.has(id));
  assert.deepEqual([...new Set(strange)], [], 'these tests cite a requirement that is not in the spec');
});

test('the whole suite is green, and so is everything that carries a requirement ID: npm test -- --grep REQ-', async () => {
  const all = await withTree('WORKING', async dir => runTests(dir));
  assert.equal(all.status, 0, `npm test fails: ${all.failed.slice(0, 2).join(' | ')}`);
  const req = await withTree('WORKING', async dir => runTests(dir, ['--grep', 'REQ-']));
  assert.equal(req.status, 0, `the REQ- tests fail: ${req.failed.slice(0, 2).join(' | ')}`);
  assert.ok(req.pass >= specReqs().filter(r => !notBuilt(r)).length, `only ${req.pass} tests carry a requirement ID`);
});

test('the tests can fail: they notice when a rule is made slightly wrong', async () => {
  const survived = await withTree('WORKING', async dir => {
    const out = [];
    for (const [what, cfg] of [...PERISHABLE_MUTANTS, ...OTHER_MUTANTS]) {
      if (testsAgainst(dir, cfg, ['--grep', 'REQ-']).status === 0) out.push(what);
    }
    return out;
  });
  assert.ok(survived.length <= 1, `your REQ- tests did NOT notice these mistakes in the rules: ${survived.join('; ')}. A test that cannot fail proves nothing. Write one that would`);
});
