// Milestone 4: the task breakdown. Reads docs/tasks.md and the spec. Every task cites a requirement, every requirement has a task,
// and the plan is honest about which requirements still need code (two of them) and which only need a test.
import test from 'node:test';
import assert from 'node:assert/strict';
import { columnIndex, commitsTouching, dirtyWork, exists, isRepoReady, parseSpec, read, SPEC, table } from '../../../checks/lib/helpers.mjs';

const FILE = 'docs/tasks.md';

function load() {
  assert.ok(exists(SPEC), `${SPEC} is missing. Do milestones 2 and 3 first (or run npm run checkpoint -- 3).`);
  const reqs = parseSpec(read(SPEC)).reqs;
  assert.ok(exists(FILE), `${FILE} is missing. Create it with the table from the milestone card.`);
  const t = table(read(FILE), h => columnIndex(h, /req/i) >= 0 && columnIndex(h, /file|function|touch|where/i) >= 0);
  assert.ok(t, 'there is no table with a Requirement column and a Files column');
  const [task, r, f] = [columnIndex(t.header, /task|step|work|what/i), columnIndex(t.header, /req/i), columnIndex(t.header, /file|function|touch|where/i)];
  const rows = t.rows.filter(x => x.some(Boolean)).map(x => ({ task: x[task] ?? '', req: x[r] ?? '', files: x[f] ?? '', text: x.join(' ') }));
  return { reqs, rows };
}
const cited = text => [...String(text).matchAll(/REQ-\d{3}/g)].map(m => m[0]);
const missingCode = r => /perishab|spoil|weight|\bkg\b|heavy/i.test(`${r.title} ${r.statement}`);

test('the task list has a table of tasks, each naming its requirement and the files it touches', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const { rows } = load();
  assert.ok(rows.length >= 3, `the table has ${rows.length} task${rows.length === 1 ? '' : 's'}. There is more to plan than that`);
  const noReq = rows.filter(x => cited(x.req).length === 0).map(x => x.task.slice(0, 40));
  assert.deepEqual(noReq, [], 'these tasks cite no requirement. Work with no requirement ID is work nobody can explain later: tie it to a REQ, or leave it out');
});

test('every requirement in the spec has a task, and every requirement a task cites really exists', () => {
  const { reqs, rows } = load();
  const ids = new Set(reqs.map(r => r.id));
  const all = new Set(rows.flatMap(x => cited(x.req)));
  assert.deepEqual([...ids].filter(i => !all.has(i)), [], 'these requirements have no task');
  assert.deepEqual([...all].filter(i => !ids.has(i)), [], 'these tasks cite a requirement that is not in the spec');
});

test('each task names a file, and a file that is not there yet is marked as new', () => {
  const { rows } = load();
  const bad = [];
  for (const x of rows) {
    const paths = x.files.match(/[\w./-]+\.(?:js|mjs|md|json)\b|\b(?:src|tests|tools|spec|docs)\/[\w./-]*/g) ?? [];
    if (!paths.length) { bad.push(`"${x.task.slice(0, 40)}" names no file`); continue; }
    for (const p of paths) if (!exists(p.replace(/\/$/, '')) && !/\bnew\b|create|add|will be|to be/i.test(x.text)) bad.push(`"${x.task.slice(0, 30)}": ${p} is not in the project and the row does not say it is new`);
  }
  assert.deepEqual(bad.slice(0, 4), [], 'check the Files column');
});

test('the plan knows which requirements still need code and which already have it', () => {
  const { reqs, rows } = load();
  for (const r of reqs.filter(missingCode)) {
    const mine = rows.filter(x => cited(x.req).includes(r.id));
    assert.ok(mine.some(x => /eligibility\.js/.test(x.files)), `${r.id} is not built yet, but no task changes src/bopis/eligibility.js for it`);
    assert.ok(mine.some(x => /tests\/spec\//.test(x.files) || /\btest/i.test(x.task)), `${r.id} has no task for its test`);
    assert.ok(!mine.some(x => /already (built|implemented|done|there|exists?)|no change needed/i.test(x.text)), `${r.id} is marked as already built. Is it? Read the code again`);
  }
  const claimsNewCode = reqs.filter(r => !missingCode(r)).filter(r => {
    const mine = rows.filter(x => cited(x.req).includes(r.id));
    return mine.length && !mine.some(x => /already|existing|implemented|exists?|no (code )?change|tests? only|only (a |the )?tests?|add(ing)? tests?|write (a )?tests?|test(s)? for/i.test(x.text));
  });
  assert.deepEqual(claimsNewCode.map(r => r.id), [], 'these requirements are already built, but the plan has code work for them. A plan that rebuilds what exists is how code drifts from its spec: say that only a test is missing');
});

test('the task list is committed', () => {
  assert.ok(commitsTouching(FILE).length >= 1, `${FILE} is not committed yet`);
  assert.deepEqual(dirtyWork().filter(l => /docs\//.test(l)), [], 'docs/ has changes that are not committed');
});
