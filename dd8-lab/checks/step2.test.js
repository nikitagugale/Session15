// Milestone 2: the structured spec. Reads spec/bopis-eligibility.md. It judges the SHAPE of the spec (ids, statements, given/when/then,
// non-goals, an owner, a changelog) and what it covers. Whether each requirement is RIGHT is milestone 3.
import test from 'node:test';
import assert from 'node:assert/strict';
import { commitsTouching, dirtyWork, exists, isRepoReady, parseSpec, read, section, SPEC, words } from '../../../checks/lib/helpers.mjs';
import { TOPICS, TOPIC_ORDER, VAGUE } from '../../../checks/lib/truth.mjs';

const spec = () => {
  assert.ok(exists(SPEC), `${SPEC} is missing. Create it: one "## REQ-001" style heading for each requirement.`);
  return parseSpec(read(SPEC));
};

/** Give each topic of the PRD to the first requirement that is about it (the requirement's heading and statement decide). */
function coverage() {
  const { reqs } = spec();
  const taken = new Set();
  const byTopic = {};
  for (const id of TOPIC_ORDER) {
    const topic = TOPICS.find(t => t.id === id);
    const req = reqs.find(r => !taken.has(r.id) && topic.re.test(`${r.title} ${r.statement}`));
    if (req) { taken.add(req.id); byTopic[id] = req.id; }
  }
  return byTopic;
}

test('the spec exists and every requirement has an ID of the form REQ-001, and no two share one', () => {
  assert.ok(isRepoReady(), 'there is no starting commit yet. Run: npm run setup');
  const { reqs } = spec();
  assert.ok(reqs.length >= 7, `the spec has ${reqs.length} requirement${reqs.length === 1 ? '' : 's'}. The PRD has eight sections that say what must happen: each becomes one requirement.`);
  const ids = reqs.map(r => r.id);
  assert.equal(new Set(ids).size, ids.length, 'two requirements have the same ID. An ID is stable: it names one requirement, forever');
  assert.equal(ids[0], 'REQ-001', 'the first requirement should be REQ-001');
});

test('each requirement is one clear statement followed by at least one given/when/then criterion', () => {
  const { reqs } = spec();
  const noStatement = reqs.filter(r => words(r.statement) < 4).map(r => r.id);
  assert.deepEqual(noStatement, [], 'these requirements have no one-line statement under the heading (a sentence of at least four words)');
  const noCriteria = reqs.filter(r => r.criteria.length < 1).map(r => r.id);
  assert.deepEqual(noCriteria, [], 'these requirements have no acceptance criterion in given/when/then form. A criterion starts with Given, then has a When and a Then, and is precise enough to write a test from');
});

test('the spec covers what the PRD asks for, one requirement for each thing', () => {
  const found = coverage();
  const missing = TOPICS.filter(t => !found[t.id]).map(t => t.id);
  assert.ok(missing.length <= 1, `${missing.length} of the PRD's requirements have no requirement of their own in the spec. Read sections 1 to 8 of the PRD again, and give each one its own REQ`);
  assert.ok(found.perishable && found.weight, 'the two requirements that the shipped code does not meet must be in the spec too: a spec records what is wanted, not what is built');
});

test('the vague sentences are flagged for the product owner, and are not turned into requirements', () => {
  const { reqs, text } = spec();
  const flagged = section(text, /flag|vague|open question|clarif|unclear|ambiguous|too vague/i);
  assert.ok(flagged, 'there is no section for the sentences that are too vague to test. Give it a heading such as "Flagged: too vague to test"');
  const hit = VAGUE.filter(v => v.re.test(flagged)).length;
  assert.ok(hit >= 3, `your flagged section names ${hit} of the 4 sentences in the PRD that cannot be tested. Read section 9 of the PRD again`);
  const sneaked = reqs.filter(r => /\bfast\b|performance|good experience/i.test(`${r.title} ${r.statement}`)).map(r => r.id);
  assert.deepEqual(sneaked, [], 'these requirements are a vague PRD sentence in disguise. Flag a sentence you cannot test; do not guess what it means');
});

test('the non-goals are written down, so the AI does not build more than was asked', () => {
  const { text } = spec();
  const ng = section(text, /non-?goals?|out of scope|not in scope|won.t do/i);
  assert.ok(ng, 'there is no Non-goals section. The PRD says what is out of scope: write it into the spec');
  const named = [/substitut/i, /deliver/i, /pric|discount/i, /payment/i].filter(re => re.test(ng)).length;
  assert.ok(named >= 2, 'the Non-goals section names fewer than two of the things the PRD says are out of scope');
});

test('the spec has a named owner and a changelog, and it is committed', () => {
  const s = spec();
  assert.ok(s.owner && s.owner.length >= 2, 'the spec does not say who owns it. Add a line such as "Owner: <name>": someone has to approve every change');
  assert.ok(section(s.text, /change ?log|version|history/i)?.split('\n').filter(l => l.trim()).length >= 1, 'the spec has no changelog. Add a "Changelog" section with a first entry, so a change to a requirement is never silent');
  assert.ok(commitsTouching('spec').length >= 1, 'spec/ is not committed yet. A spec in git has a history: that is what makes drift visible');
  assert.deepEqual(dirtyWork().filter(l => /spec\//.test(l)), [], 'the spec has changes that are not committed');
});
