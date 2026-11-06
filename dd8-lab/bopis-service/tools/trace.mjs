#!/usr/bin/env node
// Traceability check: links every requirement in spec/ to its code in src/ and its tests in tests/, and flags gaps, orphans and drift.
// Usage: node tools/trace.mjs [--json] [--root <dir>] [--base <git-ref>]
// It reads the files on every run and keeps nothing between runs.
import { readdirSync, readFileSync, statSync, existsSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import path from 'node:path';

const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const value = (n) => { const i = args.indexOf(n); return i >= 0 ? args[i + 1] : undefined; };
const root = path.resolve(value('--root') ?? process.cwd());
const base = value('--base');
const asJson = flag('--json');

const rel = (f) => path.relative(root, f).split(path.sep).join('/');

function walk(dir) {
  if (!existsSync(dir)) return [];
  const out = [];
  for (const name of readdirSync(dir).sort()) {
    if (name === 'node_modules' || name === '.git') continue;
    const p = path.join(dir, name);
    if (statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

// Replace comments with spaces (keeping newlines), leaving strings alone. Good enough for plain JavaScript.
function stripComments(src) {
  let out = '';
  let i = 0;
  while (i < src.length) {
    const c = src[i], d = src[i + 1];
    if (c === '/' && d === '/') {
      while (i < src.length && src[i] !== '\n') { out += ' '; i++; }
    } else if (c === '/' && d === '*') {
      out += '  '; i += 2;
      while (i < src.length && !(src[i] === '*' && src[i + 1] === '/')) { out += src[i] === '\n' ? '\n' : ' '; i++; }
      out += '  '; i += 2;
    } else if (c === '"' || c === "'" || c === '`') {
      out += c; i++;
      while (i < src.length && src[i] !== c) {
        if (src[i] === '\\') { out += src[i++]; }
        out += src[i++] ?? '';
      }
      out += src[i++] ?? '';
    } else { out += c; i++; }
  }
  return out;
}

// 1. Requirements: a heading "## REQ-001" in a file under spec/.
const requirements = new Map();
for (const f of walk(path.join(root, 'spec'))) {
  if (!/\.(md|markdown)$/i.test(f)) continue;
  for (const line of readFileSync(f, 'utf8').split('\n')) {
    const m = /^#{1,6}\s+(REQ-\d+)\b/.exec(line);
    if (m && !requirements.has(m[1])) requirements.set(m[1], { id: m[1], code: new Set(), tests: [] });
  }
}

// 2. Code: any file under src/ that contains the ID.
const orphanFiles = new Map();
const addOrphan = (id, file) => {
  if (!orphanFiles.has(id)) orphanFiles.set(id, new Set());
  orphanFiles.get(id).add(file);
};
for (const f of walk(path.join(root, 'src'))) {
  const text = readFileSync(f, 'utf8');
  for (const id of new Set(text.match(/REQ-\d+/g) ?? [])) {
    if (requirements.has(id)) requirements.get(id).code.add(rel(f));
    else addOrphan(id, rel(f));
  }
}

// 3. Tests: test(...) or it(...) calls under tests/ whose name starts with the ID. Comments are blanked first, so they never count.
const TEST_CALL = /\b(?:test|it)(?:\.(?:only|skip|todo))?\s*\(\s*(['"`])(REQ-\d+)\b((?:\\.|(?!\1)[^\\])*)\1?/g;
for (const f of walk(path.join(root, 'tests'))) {
  if (!/\.(js|mjs|cjs|jsx|ts)$/.test(f)) continue;
  const text = stripComments(readFileSync(f, 'utf8'));
  for (const m of text.matchAll(TEST_CALL)) {
    const id = m[2];
    const name = id + m[3];
    if (requirements.has(id)) requirements.get(id).tests.push(name);
    else addOrphan(id, rel(f));
  }
}

const rows = [...requirements.values()].sort((a, b) => a.id.localeCompare(b.id)).map((r) => {
  const code = [...r.code].sort();
  const missing = [];
  if (!code.length) missing.push('NO CODE');
  if (!r.tests.length) missing.push('NO TEST');
  return { id: r.id, code, tests: r.tests, status: missing.length ? missing.join(', ') : 'OK' };
});
const orphans = [...orphanFiles.entries()].sort().map(([id, files]) => ({ id, files: [...files].sort() }));

// 4. Drift: src/ changed since <ref> and nothing under spec/ did. A change to comments only does not count.
let drift = null;
if (base) {
  const git = (...a) => spawnSync('git', ['-C', root, ...a], { encoding: 'utf8' });
  const diff = git('diff', '--name-only', '--relative', base, '--', '.');
  if (diff.status !== 0) {
    console.error(`git diff against ${base} failed: ${diff.stderr.trim()}`);
    process.exit(2);
  }
  const changed = diff.stdout.split('\n').filter(Boolean);
  const norm = (t) => stripComments(t).replace(/\s+/g, ' ').trim();
  const srcChanged = changed.filter((f) => f.startsWith('src/')).filter((f) => {
    const old = git('show', `${base}:./${f}`);
    const now = existsSync(path.join(root, f)) ? readFileSync(path.join(root, f), 'utf8') : null;
    if (old.status !== 0 || now === null) return true;
    return norm(old.stdout) !== norm(now);
  });
  const specChanged = changed.filter((f) => f.startsWith('spec/'));
  drift = { base, srcChanged, specChanged, drifted: srcChanged.length > 0 && specChanged.length === 0 };
}

const gaps = rows.some((r) => r.status !== 'OK') || orphans.length > 0;
const ok = !gaps && !(drift && drift.drifted);

if (asJson) {
  const out = { ok, requirements: rows.map(({ id, code, tests }) => ({ id, code, tests })), orphans };
  if (drift) out.drift = drift;
  console.log(JSON.stringify(out, null, 2));
} else {
  const table = [['Requirement', 'Code', 'Tests', 'Status'], ...rows.map((r) => [r.id, r.code.join(', ') || '-', String(r.tests.length), r.status])];
  const w = table[0].map((_, i) => Math.max(...table.map((r) => r[i].length)));
  const line = (r) => '| ' + r.map((c, i) => c.padEnd(w[i])).join(' | ') + ' |';
  console.log(line(table[0]));
  console.log('|' + w.map((n) => '-'.repeat(n + 2)).join('|') + '|');
  table.slice(1).forEach((r) => console.log(line(r)));
  for (const o of orphans) console.log(`ORPHAN: ${o.id} appears in ${o.files.join(', ')} but is not a requirement in spec/`);
  if (drift) {
    if (drift.drifted) console.log(`DRIFT: ${drift.srcChanged.join(', ')} changed since ${base} and nothing under spec/ did`);
    else console.log(`No drift since ${base}.`);
  }
  console.log(ok ? 'All requirements are traced.' : 'Not fully traced.');
}
process.exit(ok ? 0 : 1);
