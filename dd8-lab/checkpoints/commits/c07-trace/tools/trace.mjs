// Traceability check: links every requirement in spec/ to the code that carries its ID and the tests named after it.
//   node tools/trace.mjs                      the table; exit code 1 if a requirement has no code or no test, or an ID has no requirement
//   node tools/trace.mjs --json               the same, as JSON
//   node tools/trace.mjs --root <dir>         check another project folder
//   node tools/trace.mjs --base <git-ref>     also flag DRIFT: code under src/ changed since <ref> and nothing under spec/ did
//
// It reads the files on every run and keeps nothing, so it can never describe an old state of the project.
import { spawnSync } from 'node:child_process';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import path from 'node:path';

const args = process.argv.slice(2);
const has = name => args.includes(`--${name}`);
const value = name => { const i = args.indexOf(`--${name}`); return i >= 0 ? args[i + 1] : undefined; };
const root = path.resolve(value('root') ?? process.cwd());

function files(dir, keep) {
  const abs = path.join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs).flatMap(name => {
    const rel = `${dir}/${name}`;
    if (statSync(path.join(root, rel)).isDirectory()) return name === 'node_modules' ? [] : files(rel, keep);
    return keep(name) ? [rel] : [];
  });
}
const read = rel => readFileSync(path.join(root, rel), 'utf8');

// 1. the requirements: a "## REQ-001" heading in the spec (an ID in the middle of a sentence is not a requirement)
const reqs = new Map();
for (const f of files('spec', n => n.endsWith('.md'))) {
  for (const m of read(f).matchAll(/^##\s+(REQ-\d{3})\b[:\s.\-–—]*(.*)$/gm)) reqs.set(m[1], { id: m[1], title: m[2].trim(), code: [], tests: [] });
}

// 2. the code that carries an ID, and the tests whose name starts with one
const orphans = new Map();
const note = (id, where, kind, extra) => {
  const r = reqs.get(id);
  if (!r) { orphans.set(id, [...new Set([...(orphans.get(id) ?? []), where])]); return; }
  if (kind === 'code' && !r.code.includes(where)) r.code.push(where);
  if (kind === 'test') r.tests.push({ file: where, name: extra });
};
for (const f of files('src', n => /\.[cm]?js$/.test(n))) for (const id of new Set(read(f).match(/\bREQ-\d{3}\b/g) ?? [])) note(id, f, 'code');
for (const f of files('tests', n => /\.test\.[cm]?js$/.test(n))) {
  for (const m of read(f).matchAll(/\b(?:test|it)\s*\(\s*(['"`])\s*(REQ-\d{3})\b([^'"`]*)\1/g)) note(m[2], f, 'test', `${m[2]}${m[3]}`);
}

// 3. drift: the code moved and the spec did not
let drift = null;
if (value('base')) {
  const r = spawnSync('git', ['diff', '--name-only', value('base')], { cwd: root, encoding: 'utf8' });
  const changed = r.status === 0 ? r.stdout.split('\n').filter(Boolean) : [];
  const code = changed.filter(f => f.startsWith('src/'));
  drift = r.status !== 0 ? { error: r.stderr.trim() } : code.length && !changed.some(f => f.startsWith('spec/')) ? { code } : { code: [] };
}

const rows = [...reqs.values()].map(r => ({ ...r, tests: r.tests.map(t => t.name), status: r.code.length && r.tests.length ? 'OK' : [r.code.length ? '' : 'NO CODE', r.tests.length ? '' : 'NO TEST'].filter(Boolean).join(', ') }));
const gaps = rows.filter(r => r.status !== 'OK');
const ok = !gaps.length && !orphans.size && !(drift?.code?.length) && !drift?.error;

if (has('json')) {
  console.log(JSON.stringify({ ok, requirements: rows, orphans: [...orphans].map(([id, where]) => ({ id, files: where })), drift }, null, 2));
} else {
  const pad = (s, n) => String(s).padEnd(n);
  console.log(`${pad('Requirement', 12)}${pad('Code', 30)}${pad('Tests', 7)}Status`);
  for (const r of rows) console.log(`${pad(r.id, 12)}${pad(r.code.join(', ') || '-', 30)}${pad(r.tests.length, 7)}${r.status}`);
  for (const [id, where] of orphans) console.log(`ORPHAN: ${id} is used in ${where.join(', ')} but is not a requirement in spec/`);
  if (drift?.error) console.log(`Could not compare with ${value('base')}: ${drift.error}`);
  else if (drift?.code?.length) console.log(`DRIFT: ${drift.code.join(', ')} changed since ${value('base')}, and nothing in spec/ did`);
  else if (drift) console.log(`No drift since ${value('base')}.`);
  console.log(ok ? '\nEvery requirement is traced.' : `\n${gaps.length} requirement(s) not fully traced${orphans.size ? `, ${orphans.size} orphan ID(s)` : ''}${drift?.code?.length ? ', drift' : ''}.`);
}
process.exitCode = ok ? 0 : 1;
