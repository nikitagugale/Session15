// The hidden ground truth about the PRD, the Slack thread and the shipped code. Lab fixture, outside the folder learners open.

/** The nine things a careful reading finds. `item` finds the learner's row; `expect` is what the status must say. */
export const DRIFT = [
  { id: 'stock', what: 'the stock buffer', item: /stock|buffer|inventory/i, expect: 'differs' },
  { id: 'quantity', what: 'the quantity limit', item: /quantit|units?\b|per (order|pickup)|\bsix\b|\b6\b|at most/i, expect: 'ok' },
  { id: 'perishable', what: 'the perishable rule', item: /perishab|spoil/i, expect: 'gap' },
  { id: 'hazmat', what: 'the hazmat rule', item: /hazmat|hazard/i, expect: 'ok' },
  { id: 'age', what: 'the age-restricted rule', item: /\bage\b|alcohol|tobacco|restrict/i, expect: 'ok' },
  { id: 'gift', what: 'the gift card rule', item: /gift/i, expect: 'ok' },
  { id: 'store', what: 'the store-open rule', item: /store.*(open|closed|hours)|\bopen\b|closed/i, expect: 'ok' },
  { id: 'weight', what: 'the weight limit', item: /weight|\bkg\b|heavy|\b20\b/i, expect: 'gap' },
  { id: 'highvalue', what: 'the high-value rule', item: /high[- ]?value|2,?000|expensive|price/i, expect: 'undocumented' },
];

/** What a status cell is saying. The order matters: "implemented but the value differs" is a difference, not a success. */
export function statusKind(cell) {
  const s = String(cell).toLowerCase();
  if (/undocumented|not in (the )?(prd|spec)|no requirement|orphan|code[- ]only|only in (the )?code|not written|unwritten/.test(s)) return 'undocumented';
  if (/missing|not (yet )?(implemented|enforced|wired|called|used|built|there)|unused|absent|no check|dead|never called|not applied|partial/.test(s)) return 'gap';
  if (/differ|chang|contradict|mismatch|drift|outdated|stale|conflict|disagree|wrong value|doesn.t match/.test(s)) return 'differs';
  if (/implemented|done|present|\bok\b|\byes\b|matches|✔|✓|exists|enforced|covered|in place/.test(s)) return 'ok';
  return 'unknown';
}

/** The requirements a spec must cover, found by what their text is about. Each must be in a requirement of its own. */
export const TOPICS = [
  { id: 'stock', re: /stock|buffer|on hand|inventory/i },
  { id: 'quantity', re: /at most|up to|maximum|per (order|pickup)|\b6\b|\bsix\b|too many/i },
  { id: 'perishable', re: /perishab|spoil/i },
  { id: 'hazmat', re: /hazmat|hazard/i },
  { id: 'age', re: /\bage\b|alcohol|tobacco|verif/i },
  { id: 'gift', re: /gift/i },
  { id: 'store', re: /store.*(open|closed)|\bopen\b/i },
  { id: 'weight', re: /weight|\bkg\b|heavy/i },
];
/** Strongest cue first: a requirement is given to the first topic whose cue appears in its statement. */
export const TOPIC_ORDER = ['perishable', 'hazmat', 'gift', 'weight', 'age', 'store', 'stock', 'quantity'];

/** The vague sentences of the PRD's "General" section. A good spec flags them and does not turn them into requirements. */
export const VAGUE = [
  { id: 'fast', re: /\bfast\b|performance|speed/i },
  { id: 'large', re: /\blarge\b|most large|\bmost\b/i },
  { id: 'experience', re: /good experience|experience/i },
  { id: 'risky', re: /\brisky\b|carefully/i },
];

export const PERISHABLE_CATEGORIES = ['produce', 'dairy', 'meat', 'frozen', 'bakery'];
