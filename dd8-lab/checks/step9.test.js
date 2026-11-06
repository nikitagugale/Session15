// Milestone 9 (homework): a second requirement, the weight limit, done the whole way: already in the spec, now built, tested and traced.
import test from 'node:test';
import assert from 'node:assert/strict';
import { WEIGHT_MUTANTS, WITH_WEIGHT } from '../../../checks/oracle/variants.mjs';
import { behaviourIn, commitsTouching, describeDifference, dirtyWork, editedFixtures, exists, isRepoReady, parseSpec, read, runTests, SPEC, testNames, testsAgainst, walk, withTree } from '../../../checks/lib/helpers.mjs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

function weightId() {
  assert.ok(exists(SPEC), `${SPEC} is missing`);
  const req = parseSpec(read(SPEC)).reqs.find(r => /weight|\bkg\b|heavy/i.test(`${r.title} ${r.statement}`));
  assert.ok(req, 'the spec has no requirement for the weight limit');
  return req.id;
}

test('the work is committed, and the files that are not yours are untouched', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed: put them back with git checkout -- <file>');
  assert.deepEqual(dirtyWork(), [], 'you have changes that are not committed');
});

test('the code now refuses items heavier than 20 kg, and nothing else has changed', async () => {
  const r = await withTree('WORKING', dir => behaviourIn(dir, WITH_WEIGHT));
  assert.equal(r.different, 0, `in ${r.different} of ${r.total} sample situations the code does not do what the spec says:\n${describeDifference(r)}`);
});

test('the requirement ID is in the code, and at least three tests carry it in their names', async () => {
  const id = weightId();
  assert.ok(walk('src').filter(f => f.endsWith('.js')).some(f => new RegExp(`\\b${id}\\b`).test(read(f))), `no file in src/ mentions ${id}`);
  const names = await withTree('WORKING', async dir => testNames(dir));
  assert.ok(names.filter(t => t.name.trim().startsWith(id) && !t.todo).length >= 3, `fewer than three tests start with ${id}: one for a heavy item, one for a light one, one on the boundary`);
  const r = await withTree('WORKING', async dir => runTests(dir, ['--grep', id]));
  assert.equal(r.status, 0, `the ${id} tests fail: ${r.failed.slice(0, 2).join(' | ')}`);
});

test('the tests can fail: three slightly wrong versions of the rule are caught, and the tests are red without the fix', async () => {
  const id = weightId();
  const survived = await withTree('WORKING', async dir => WEIGHT_MUTANTS.filter(([, cfg]) => testsAgainst(dir, cfg, ['--grep', id]).status === 0).map(([what]) => what));
  assert.deepEqual(survived, [], `your ${id} tests did NOT notice these mistakes`);
});

test('the traceability check shows every requirement traced, with no gaps and no orphans', async () => {
  assert.ok(exists('tools/trace.mjs'), 'tools/trace.mjs is missing (milestone 7)');
  const out = await withTree('WORKING', async dir => {
    const r = spawnSync(process.execPath, [path.join(dir, 'tools/trace.mjs'), '--json'], { cwd: dir, encoding: 'utf8' });
    return { status: r.status, text: r.stdout };
  });
  const data = JSON.parse(out.text);
  const gaps = data.requirements.filter(r => !(r.code?.length) || !(r.tests?.length));
  assert.deepEqual(gaps.map(r => r.id), [], 'these requirements still have no code or no test in the traceability check');
  assert.equal(out.status, 0, 'every requirement is traced, so the tool should exit with 0');
  assert.ok(commitsTouching('src').length >= 2, 'the homework should be its own commit');
});
