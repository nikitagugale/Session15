// Shared helpers for the lab's checks. They read YOUR work and never change it: anything that writes runs in a scratch folder.
// This file is outside the folder you open on purpose: it holds the answers to some of the milestones.
import { execFileSync, spawnSync } from 'node:child_process';
import { createHash } from 'node:crypto';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { PRISTINE, make, variantSource } from '../oracle/variants.mjs';
import { compare, describeCase, generateCases } from '../oracle/cases.mjs';

const here = path.dirname(fileURLToPath(import.meta.url));
export const KIT = path.resolve(here, '..', '..');
export const APP = path.join(KIT, 'bopis-service');
export const CODE = 'src/bopis/eligibility.js';
export const SPEC = 'spec/bopis-eligibility.md';
export const rel = p => path.join(APP, p);
export const sha256 = buf => createHash('sha256').update(buf).digest('hex');
export const readJson = file => JSON.parse(readFileSync(file, 'utf8').replace(/^﻿/, ''));
export const pristine = readJson(path.join(KIT, 'checks', 'pristine.json'));
export const { PRISTINE: PRISTINE_CFG, make: makeVariant, variantSource: variantText } = { PRISTINE, make, variantSource };
export { compare, describeCase, generateCases };

// ---------------------------------------------------------------------------------------------------------------------
// files

export const exists = file => existsSync(rel(file));
export const read = file => readFileSync(rel(file), 'utf8');
export function walk(dir, root = APP) {
  const abs = path.join(root, dir);
  if (!existsSync(abs)) return [];
  return readdirSync(abs, { withFileTypes: true }).flatMap(e => {
    const r = path.join(dir, e.name);
    return e.isDirectory() ? (e.name === 'node_modules' || e.name === '.git' || e.name === 'steps' ? [] : walk(r, root)) : [r.split(path.sep).join('/')];
  });
}

/** Import one of YOUR modules fresh, so an edit made after an earlier import is seen. */
export const load = (rootDir, relPath) => import(`${pathToFileURL(path.join(rootDir, relPath)).href}?t=${Date.now()}${Math.random()}`);

// ---------------------------------------------------------------------------------------------------------------------
// git

export function git(args, cwd = APP) {
  const r = spawnSync('git', args, { cwd, encoding: 'utf8' });
  return { status: r.status, stdout: (r.stdout ?? '').trim(), stderr: (r.stderr ?? '').trim(), out: `${r.stdout ?? ''}${r.stderr ?? ''}`.trim() };
}
export const gitAs = (args, cwd) => git(['-c', 'user.name=lab', '-c', 'user.email=lab@local', '-c', 'core.autocrlf=false', '-c', 'commit.gpgsign=false', ...args], cwd);

export function baselineCommit() {
  const f = rel('.lab/baseline-commit');
  return existsSync(f) ? readFileSync(f, 'utf8').trim() : null;
}
export const isRepoReady = () => existsSync(rel('.git')) && !!baselineCommit();

/** Commits after the starting commit, oldest first. */
export function commitsSince(base = baselineCommit()) {
  const r = git(['rev-list', '--reverse', `${base}..HEAD`]);
  return r.status === 0 && r.stdout ? r.stdout.split('\n') : [];
}

/** Commits since the start that changed a path (a folder or a file). */
export function commitsTouching(pathspec) {
  const base = baselineCommit();
  const r = git(['rev-list', '--reverse', `${base}..HEAD`, '--', pathspec]);
  return r.status === 0 && r.stdout ? r.stdout.split('\n') : [];
}

/** Uncommitted changes to the documents, code or tests (the clock in .lab/ does not count). */
export function dirtyWork() {
  return git(['status', '--porcelain', '--', 'spec', 'docs', 'src', 'tests', 'tools', 'scripts', 'package.json', ':(exclude)tests/steps']).stdout.split('\n').filter(Boolean);
}

/** The files of the lab itself (scripts, the team's tests, the source documents) that differ from what the kit shipped. */
export function editedFixtures() {
  return Object.entries(pristine)
    .filter(([f]) => /^(scripts|tests\/(existing|baseline))\//.test(f) || /^docs\/(prd|slack-thread)\.md$/.test(f))
    .filter(([f, h]) => !existsSync(rel(f)) || sha256(readFileSync(rel(f))) !== h).map(([f]) => f);
}

/** A copy of the working tree (including uncommitted changes), or a checkout of a commit, in a scratch folder. */
export async function withTree(commit, fn) {
  const dir = mkdtempSync(path.join(tmpdir(), 'dd8-tree-'));
  try {
    if (commit === 'WORKING') {
      cpSync(APP, dir, { recursive: true, filter: p => !/[\\/](node_modules|\.git|\.lab|\.checkpoint-backup)([\\/]|$)/.test(p) && !p.endsWith(`${path.sep}tests${path.sep}steps`) });
    } else {
      git(['worktree', 'prune']);
      const r = git(['worktree', 'add', '--detach', '--force', dir, commit]);
      if (r.status !== 0) throw new Error(`could not check out ${commit}: ${r.out}`);
    }
    return await fn(dir);
  } finally {
    if (commit !== 'WORKING') git(['worktree', 'remove', '--force', dir]);
    rmSync(dir, { recursive: true, force: true });
    git(['worktree', 'prune']);
  }
}

// ---------------------------------------------------------------------------------------------------------------------
// running the project's tests

export function runTests(dir, extra = []) {
  const env = { ...process.env };
  delete env.NODE_TEST_CONTEXT;
  const r = spawnSync(process.execPath, ['scripts/test.mjs', ...extra], { cwd: dir, encoding: 'utf8', env, timeout: 180000, killSignal: 'SIGKILL' });
  const out = `${r.stdout ?? ''}${r.stderr ?? ''}`;
  const pass = Number(/^ℹ pass (\d+)/m.exec(out)?.[1] ?? 0);
  const fail = Number(/^ℹ fail (\d+)/m.exec(out)?.[1] ?? 0);
  return { status: r.status, out, pass, fail, failed: out.split('\n').filter(l => /^\s*✖/.test(l)).map(l => l.replace(/\s*\([\d.]+ms\)\s*$/, '').trim()) };
}

/** Names of the tests in a folder, found by reading the files: test('...') and it('...'), with .todo and .skip noted. */
export function testNames(dir, folder = 'tests/spec') {
  const out = [];
  for (const f of walk(folder, dir).filter(x => /\.test\.[cm]?js$/.test(x))) {
    const text = readFileSync(path.join(dir, f), 'utf8');
    for (const m of text.matchAll(/\b(test|it)(\.todo|\.skip)?\s*\(\s*(['"`])((?:\\.|(?!\3).)*)\3/g)) out.push({ file: f, name: m[4], todo: !!m[2] });
  }
  return out;
}

/** Replace the eligibility module in a scratch copy with another implementation, then run some tests against it. */
export function testsAgainst(dir, cfg, extra = []) {
  writeFileSync(path.join(dir, CODE), variantText(cfg));
  return runTests(dir, extra);
}

// ---------------------------------------------------------------------------------------------------------------------
// the behaviour of YOUR eligibility function

let cases;
export const allCases = () => (cases ??= generateCases());
/** Compare the code in a tree with the expected behaviour. `expectedCfg` can be a list: the code may match any one of them (the homework adds a rule). */
export async function behaviourIn(dir, expectedCfg) {
  const mod = await load(dir, CODE);
  const list = Array.isArray(expectedCfg) ? expectedCfg : [expectedCfg];
  let best;
  for (const cfg of list) {
    const r = compare(makeVariant(cfg), mod.isBopisEligible, allCases());
    if (!best || r.different < best.different) best = r;
    if (!r.different) break;
  }
  return best;
}
export function describeDifference(r) {
  return r.first.slice(0, 2).map(f => `  ${describeCase(f.input)}\n    it should say ${f.expected}, your code says ${f.actual}`).join('\n');
}

// ---------------------------------------------------------------------------------------------------------------------
// markdown

export const words = text => String(text).split(/\s+/).filter(w => /[A-Za-z]/.test(w)).length;
export const cellsOf = l => l.trim().replace(/^\||\|$/g, '').split('|').map(c => c.replace(/[*_`]/g, '').trim());
export const columnIndex = (header, pattern) => header.findIndex(h => pattern.test(h));

/** The first table in a markdown text whose header row passes `isHeader(cells)`. */
export function table(markdown, isHeader) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  for (let i = 0; i < lines.length - 1; i++) {
    if (!lines[i].includes('|') || !/^\s*\|?\s*:?-{2,}/.test(lines[i + 1])) continue;
    const header = cellsOf(lines[i]);
    if (!isHeader(header)) continue;
    const rows = [];
    for (let j = i + 2; j < lines.length && lines[j].includes('|'); j++) rows.push(cellsOf(lines[j]));
    return { header, rows };
  }
  return null;
}

/** The text under a heading (any level) whose title matches `pattern`, up to the next heading of the same or higher level. */
export function section(markdown, pattern) {
  const lines = markdown.replace(/\r/g, '').split('\n');
  const start = lines.findIndex(l => /^#{1,6}\s/.test(l) && pattern.test(l));
  if (start < 0) return null;
  const level = lines[start].match(/^#+/)[0].length;
  let end = lines.length;
  for (let i = start + 1; i < lines.length; i++) { const m = /^(#{1,6})\s/.exec(lines[i]); if (m && m[1].length <= level) { end = i; break; } }
  return lines.slice(start + 1, end).join('\n').trim();
}

/**
 * Reads a spec: the requirements (## REQ-001 ...), each with a one-line statement and its given/when/then criteria.
 * Returns { reqs: [{ id, title, statement, criteria, text }], owner, approvedBy, text }.
 */
export function parseSpec(markdown) {
  const text = markdown.replace(/\r/g, '');
  const reqs = [];
  const blocks = text.split(/^(?=##\s+REQ-\d{3}\b)/m).slice(1);
  for (const block of blocks) {
    const lines = block.split('\n');
    const head = /^##\s+(REQ-\d{3})\b[\s:.\-—–]*(.*)$/.exec(lines[0]);
    let end = lines.length;
    for (let i = 1; i < lines.length; i++) if (/^#{1,2}\s+(?!REQ-\d{3})/.test(lines[i])) { end = i; break; }
    const body = lines.slice(1, end);
    const plain = l => l.replace(/^[\s>*+\-\d.)]*/, '').replace(/\*\*|__|`/g, '').trim();
    const statement = body.map(plain).find(l => l && !/^(given|when|then|and|but|acceptance|criteria)\b/i.test(l)) ?? '';
    const criteria = [];
    let open = false;
    for (const l of body.map(plain)) {
      if (/^given\b/i.test(l)) { criteria.push(l); open = true; continue; }
      if (open && /^(when|then|and|but)\b/i.test(l)) { criteria[criteria.length - 1] += ` ${l}`; continue; }
      if (l !== '') open = false;
    }
    const valid = criteria.filter(c => /\bwhen\b/i.test(c) && /\bthen\b/i.test(c));
    reqs.push({ id: head[1], title: head[2].trim(), statement, criteria: valid, criteriaFound: criteria.length, text: lines.slice(0, end).join('\n') });
  }
  return {
    reqs,
    owner: /^\W*Owner\W*[:：]\s*(.+)$/im.exec(text)?.[1]?.trim() ?? null,
    approvedBy: /Approved by\W*[:：]\s*(.+)$/im.exec(text)?.[1]?.trim() ?? null,
    text,
  };
}
