// Milestone 7: the traceability check. YOUR tools/trace.mjs is run on a dozen small projects built here, each with one thing wrong, and on your own.
// The contract is on the card: node tools/trace.mjs [--root <dir>] [--json] [--base <git-ref>].
import test from 'node:test';
import assert from 'node:assert/strict';
import { spawnSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { REFERENCE, WITH_WEIGHT } from '../../../checks/oracle/variants.mjs';
import { behaviourIn, commitsTouching, dirtyWork, editedFixtures, exists, gitAs, git, isRepoReady, parseSpec, read, SPEC, withTree } from '../../../checks/lib/helpers.mjs';

const TOOL = 'tools/trace.mjs';
let toolDir;
const made = [];
process.on('exit', () => { for (const d of made) rmSync(d, { recursive: true, force: true }); });

/** Build a small project from { 'path': 'text' } and return its folder. */
function project(files) {
  const dir = mkdtempSync(path.join(tmpdir(), 'dd8-trace-'));
  made.push(dir);
  for (const [f, text] of Object.entries(files)) { mkdirSync(path.dirname(path.join(dir, f)), { recursive: true }); writeFileSync(path.join(dir, f), text); }
  return dir;
}
const spec = ids => ids.map(id => `## ${id}\nSomething must hold for ${id}.\n\nGiven a, when b, then c.\n`).join('\n');
const code = (...ids) => `// ${ids.join(' ')}\nexport const x = 1;\n`;
const tests = (...ids) => `import test from 'node:test';\n${ids.map(id => `test('${id}: it holds', () => {});\n`).join('')}`;

function run(args, cwd) {
  const r = spawnSync(process.execPath, [path.join(toolDir, TOOL), ...args], { cwd, encoding: 'utf8', timeout: 30000 });
  return { status: r.status, out: `${r.stdout ?? ''}${r.stderr ?? ''}`, stdout: r.stdout ?? '' };
}
function json(dir, extra = []) {
  const r = run(['--root', dir, '--json', ...extra], dir);
  let data;
  try { data = JSON.parse(r.stdout); } catch { assert.fail(`--json printed something that is not JSON:\n${r.out.slice(0, 200)}`); }
  assert.ok(Array.isArray(data.requirements), '--json must print an object with a "requirements" array');
  return { ...r, data, by: id => data.requirements.find(x => x.id === id) };
}
const count = x => (Array.isArray(x) ? x.length : Number(x ?? 0));

test('tools/trace.mjs exists, is committed, and the files that are not yours are untouched', async () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  assert.ok(exists(TOOL), 'tools/trace.mjs does not exist yet. npm run trace runs it');
  assert.deepEqual(editedFixtures(), [], 'these files are not yours and were changed: put them back with git checkout -- <file>');
  assert.ok(commitsTouching('tools').length >= 1, 'tools/trace.mjs is not committed yet');
  assert.deepEqual(dirtyWork().filter(l => /tools\/|src\/|tests\//.test(l)), [], 'you have changes that are not committed');
});

test('a project where everything is linked passes, and the table names every requirement', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': spec(['REQ-001', 'REQ-002', 'REQ-003']), 'src/a.js': code('REQ-001'), 'src/deep/b.js': code('REQ-002', 'REQ-003'), 'tests/spec/a.test.js': tests('REQ-001', 'REQ-002'), 'tests/spec/sub/c.test.js': tests('REQ-003') });
    const plain = run(['--root', dir], dir);
    assert.equal(plain.status, 0, `the exit code should be 0 when every requirement has code and a test:\n${plain.out.slice(0, 300)}`);
    for (const id of ['REQ-001', 'REQ-002', 'REQ-003']) assert.ok(plain.out.includes(id), `the table does not mention ${id}`);
    const j = json(dir);
    for (const id of ['REQ-001', 'REQ-002', 'REQ-003']) assert.ok(count(j.by(id)?.code) >= 1 && count(j.by(id)?.tests) >= 1, `${id} should have code and a test in the JSON`);
    assert.equal(j.data.requirements.length, 3, 'the JSON lists a requirement that is not in the spec');
  });
});

test('a requirement with no code is flagged, and the exit code says so', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': spec(['REQ-001', 'REQ-002']), 'src/a.js': code('REQ-001'), 'tests/spec/a.test.js': tests('REQ-001', 'REQ-002') });
    const j = json(dir);
    assert.notEqual(j.status, 0, 'a requirement with no code should make the tool exit with a non-zero code');
    assert.equal(count(j.by('REQ-002')?.code), 0, 'REQ-002 has no code, but the JSON gives it some');
    assert.ok(count(j.by('REQ-001')?.code) >= 1, 'REQ-001 has code, but the JSON says it has none');
    assert.ok(/REQ-002/.test(run(['--root', dir], dir).out), 'the table should name the requirement that has no code');
  });
});

test('a requirement with code but no test is flagged', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': spec(['REQ-001', 'REQ-002']), 'src/a.js': code('REQ-001', 'REQ-002'), 'tests/spec/a.test.js': tests('REQ-001') });
    const j = json(dir);
    assert.notEqual(j.status, 0, 'a requirement with no test should make the tool exit with a non-zero code');
    assert.equal(count(j.by('REQ-002')?.tests), 0, 'REQ-002 has no test, but the JSON gives it some');
  });
});

test('only a real test counts as a test: a comment that mentions the ID is not one', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': spec(['REQ-001', 'REQ-002']), 'src/a.js': code('REQ-001', 'REQ-002'), 'tests/spec/a.test.js': `${tests('REQ-001')}// TODO test REQ-002 later\ntest('something else entirely', () => {});\n` });
    const j = json(dir);
    assert.equal(count(j.by('REQ-002')?.tests), 0, 'REQ-002 only appears in a comment and in no test name: it has no test');
  });
});

test('an ID in code or tests that the spec does not have is reported as an orphan', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': spec(['REQ-001']), 'src/a.js': code('REQ-001', 'REQ-009'), 'tests/spec/a.test.js': tests('REQ-001') });
    const j = json(dir);
    assert.ok(JSON.stringify(j.data.orphans ?? []).includes('REQ-009'), 'REQ-009 is in the code but not in the spec: list it under "orphans" in the JSON');
    assert.notEqual(j.status, 0, 'an orphan ID should make the tool exit with a non-zero code');
    assert.equal(j.data.requirements.length, 1, 'REQ-009 is not a requirement: it should not be in the "requirements" list');
  });
});

test('a requirement is a heading in the spec: an ID mentioned in the middle of a sentence is not one', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': `${spec(['REQ-001'])}\nSee REQ-005 in the old PRD for the background.\n`, 'src/a.js': code('REQ-001'), 'tests/spec/a.test.js': tests('REQ-001') });
    const j = json(dir);
    assert.equal(j.data.requirements.length, 1, 'REQ-005 is only mentioned in a sentence. A requirement is a "## REQ-005" heading');
    assert.equal(j.status, 0);
  });
});

test('the tool reads the project every time: it never reports a stale snapshot', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': spec(['REQ-001', 'REQ-002']), 'src/a.js': code('REQ-001', 'REQ-002'), 'tests/spec/a.test.js': tests('REQ-001', 'REQ-002') });
    assert.equal(json(dir).status, 0);
    writeFileSync(path.join(dir, 'src/a.js'), code('REQ-001'));
    const j = json(dir);
    assert.equal(count(j.by('REQ-002')?.code), 0, 'the code for REQ-002 was removed, but the tool still reports it. Do not cache: read the files on every run');
    assert.notEqual(j.status, 0);
  });
});

test('drift: a change to src/ with no change to spec/ is flagged; with a spec change it is not', async () => {
  await withTree('WORKING', async d => {
    toolDir = d;
    const dir = project({ 'spec/s.md': spec(['REQ-001']), 'src/a.js': code('REQ-001'), 'tests/spec/a.test.js': tests('REQ-001') });
    git(['init', '-q', '-b', 'main'], dir);
    const commit = m => { git(['add', '-A'], dir); gitAs(['commit', '-q', '-m', m], dir); };
    commit('first');
    writeFileSync(path.join(dir, 'src/a.js'), `${code('REQ-001')}export const y = 2; // behaviour changed\n`);
    commit('change the code only');
    const drift = run(['--root', dir, '--base', 'HEAD~1'], dir);
    assert.notEqual(drift.status, 0, 'code changed and the spec did not: the tool should exit with a non-zero code');
    assert.ok(/drift/i.test(drift.out), 'the output should say DRIFT when the code changed and the spec did not');
    writeFileSync(path.join(dir, 'src/a.js'), `${code('REQ-001')}export const y = 3; // changed again\n`);
    writeFileSync(path.join(dir, 'spec/s.md'), `${spec(['REQ-001'])}\n<!-- updated -->\n`);
    commit('change the code and the spec');
    const fine = run(['--root', dir, '--base', 'HEAD~1'], dir);
    assert.equal(fine.status, 0, `code and spec changed together: that is not drift.\n${fine.out.slice(0, 200)}`);
    assert.ok(!/drift/i.test(fine.out.replace(/no drift/gi, '')), 'the output says DRIFT, but the spec changed with the code');
    writeFileSync(path.join(dir, 'tests/spec/a.test.js'), `${tests('REQ-001')}// a note\n`);
    commit('change a test only');
    assert.equal(run(['--root', dir, '--base', 'HEAD~1'], dir).status, 0, 'only a test changed: that is not drift');
  });
});

test('on your own project the tool shows every built requirement traced, and the one that is not built yet', async () => {
  assert.ok(exists(SPEC), `${SPEC} is missing`);
  const reqs = parseSpec(read(SPEC)).reqs;
  await withTree('WORKING', async d => {
    toolDir = d;
    const j = json(d);
    assert.equal(j.data.requirements.length, reqs.length, `the spec has ${reqs.length} requirements and the tool lists ${j.data.requirements.length}`);
    const gaps = j.data.requirements.filter(r => count(r.code) === 0 || count(r.tests) === 0);
    const bad = gaps.filter(r => !/weight|\bkg\b|heavy/i.test(reqs.find(x => x.id === r.id)?.text ?? ''));
    assert.deepEqual(bad.map(r => r.id), [], 'these requirements are built, but the tool finds no code or no test for them. Put the ID in a comment next to the rule in src/, and at the start of each test name');
    assert.equal(j.status === 0, gaps.length === 0, gaps.length ? 'a requirement still has no code or no test, so the exit code should be non-zero' : 'every requirement is traced, so the exit code should be 0');
    if (!read('src/bopis/eligibility.js').includes('REQ-008')) assert.ok(gaps.length >= 1, 'the heavy-item requirement is not built yet, so the tool should flag it');
  });
});

test('adding the IDs to the code did not change what the code does', async () => {
  const r = await withTree('WORKING', dir => behaviourIn(dir, [REFERENCE, WITH_WEIGHT]));
  assert.equal(r.different, 0, `the code no longer does what the spec says in ${r.different} sample situations. Comments are free; behaviour must not change`);
});
