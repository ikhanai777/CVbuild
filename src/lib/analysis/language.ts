/**
 * Language rules behind the writing coach.
 *
 * The advice encoded here is the standard recruiter-side guidance: bullets
 * should open with a strong past-tense verb, describe an outcome rather than a
 * duty, and carry a number wherever one honestly exists.
 */

/** Verbs grouped by the kind of contribution they signal. */
export const ACTION_VERBS: Record<string, string[]> = {
  Leadership: [
    'Led', 'Directed', 'Headed', 'Chaired', 'Oversaw', 'Coordinated', 'Mentored',
    'Coached', 'Supervised', 'Championed', 'Mobilised', 'Founded', 'Spearheaded',
    'Ran', 'Managed', 'Owned', 'Guided', 'Hired', 'Recruited', 'Empowered',
  ],
  'Achievement & impact': [
    'Delivered', 'Achieved', 'Exceeded', 'Generated', 'Drove', 'Secured', 'Won',
    'Captured', 'Boosted', 'Accelerated', 'Doubled', 'Tripled', 'Outperformed',
    'Grew', 'Increased', 'Raised', 'Earned', 'Surpassed', 'Closed', 'Sold',
  ],
  'Improvement & efficiency': [
    'Reduced', 'Streamlined', 'Optimised', 'Optimized', 'Automated', 'Consolidated',
    'Simplified', 'Eliminated', 'Cut', 'Standardised', 'Standardized', 'Refactored',
    'Modernised', 'Modernized', 'Scaled', 'Rebuilt', 'Overhauled', 'Migrated',
    'Improved', 'Decreased', 'Saved', 'Resolved', 'Fixed', 'Restructured',
  ],
  'Building & launching': [
    'Built', 'Launched', 'Designed', 'Developed', 'Engineered', 'Implemented',
    'Created', 'Architected', 'Shipped', 'Deployed', 'Established', 'Prototyped',
    'Introduced', 'Initiated', 'Integrated', 'Rolled', 'Produced', 'Wrote',
    'Rewrote', 'Set', 'Piloted', 'Devised',
  ],
  'Analysis & research': [
    'Analysed', 'Analyzed', 'Evaluated', 'Investigated', 'Modelled', 'Modeled',
    'Forecast', 'Audited', 'Benchmarked', 'Diagnosed', 'Quantified', 'Mapped',
    'Researched', 'Assessed', 'Identified', 'Tested', 'Validated', 'Measured',
  ],
  'Communication & influence': [
    'Negotiated', 'Presented', 'Persuaded', 'Advised', 'Briefed', 'Authored',
    'Facilitated', 'Partnered', 'Aligned', 'Lobbied', 'Consulted', 'Trained',
    'Taught', 'Influenced', 'Represented', 'Published', 'Pitched', 'Communicated',
  ],
};

export const ALL_ACTION_VERBS: string[] = Object.values(ACTION_VERBS).flat();

const ACTION_VERB_SET = new Set(ALL_ACTION_VERBS.map((v) => v.toLowerCase()));

/**
 * Openers that describe a job description rather than a contribution. Each maps
 * to the rewrite we suggest.
 */
export const WEAK_OPENERS: Array<{ pattern: RegExp; phrase: string; fix: string }> = [
  {
    pattern: /^\s*(was\s+)?responsible for\b/i,
    phrase: 'Responsible for',
    fix: 'Name the outcome instead: "Owned…", "Ran…", or better, the verb for what you actually achieved.',
  },
  {
    pattern: /^\s*(i\s+)?(helped|assisted)\s+(with|in|to)?\b/i,
    phrase: 'Helped / assisted with',
    fix: 'State your own contribution: "Built…", "Coordinated…", "Delivered…".',
  },
  {
    pattern: /^\s*worked (on|with|as)\b/i,
    phrase: 'Worked on',
    fix: 'Replace with what the work produced: "Shipped…", "Migrated…", "Designed…".',
  },
  {
    pattern: /^\s*(duties|responsibilities|tasks)\s+(included|involved)\b/i,
    phrase: 'Duties included',
    fix: 'Drop the preamble and lead with the strongest single achievement.',
  },
  {
    pattern: /^\s*(involved in|participated in|took part in)\b/i,
    phrase: 'Involved in / participated in',
    fix: 'Say what you personally did and what changed as a result.',
  },
  {
    pattern: /^\s*(in charge of|tasked with)\b/i,
    phrase: 'In charge of / tasked with',
    fix: 'Lead with the verb: "Managed a team of 6 that…".',
  },
  {
    pattern: /^\s*(successfully|various|numerous)\b/i,
    phrase: 'Successfully / various / numerous',
    fix: 'Filler words. Cut them and use the space for a number.',
  },
];

/** Overused, low-signal claims that recruiters discount. */
export const CLICHES = [
  'team player',
  'hard working',
  'hard-working',
  'go-getter',
  'self-starter',
  'think outside the box',
  'results-driven',
  'detail oriented',
  'detail-oriented',
  'go the extra mile',
  'dynamic professional',
  'proven track record',
  'synergy',
  'hit the ground running',
  'passionate about',
  'excellent communication skills',
];

/** First-person pronouns, which convention drops from CV bullets. */
const PRONOUN_RE = /\b(i|me|my|myself|we|our)\b/i;

/** Passive voice: a "to be" form followed by a past participle. */
const PASSIVE_RE = /\b(was|were|been|being|is|are|be)\s+\w+(ed|en)\b/i;

export function firstWord(text: string): string {
  return text.trim().split(/\s+/)[0]?.replace(/[^A-Za-z-]/g, '') ?? '';
}

export function startsWithActionVerb(text: string): boolean {
  return ACTION_VERB_SET.has(firstWord(text).toLowerCase());
}

/** True when the bullet carries a number, percentage, currency or magnitude. */
export function hasMetric(text: string): boolean {
  return /(\d+(\.\d+)?\s*%|[£$€¥]\s?\d|\b\d[\d,.]*\s*(k|m|bn|b|million|billion|thousand)\b|\b\d[\d,.]*\b)/i.test(
    text,
  );
}

export function weakOpener(text: string) {
  return WEAK_OPENERS.find((w) => w.pattern.test(text)) ?? null;
}

export function usesPronouns(text: string): boolean {
  return PRONOUN_RE.test(text);
}

/**
 * Only the opening clause is checked. "Coached 3 PMs; two were promoted" is
 * fine — the passive half describes what happened to someone else. What hurts
 * is a bullet that opens passively, because it hides who did the work.
 */
export function isPassive(text: string): boolean {
  const opening = text.split(/[;,]|\s+—\s+/)[0] ?? text;
  return PASSIVE_RE.test(opening);
}

export function clichesIn(text: string): string[] {
  const lower = text.toLowerCase();
  return CLICHES.filter((c) => lower.includes(c));
}

export function wordCount(text: string): number {
  return text.trim() ? text.trim().split(/\s+/).length : 0;
}

/**
 * Suggests replacement verbs for a bullet that opens weakly, biased towards the
 * category that matches the rest of the sentence.
 */
export function suggestVerbs(text: string, limit = 6): string[] {
  const lower = text.toLowerCase();
  const scored = Object.entries(ACTION_VERBS).map(([category, verbs]) => {
    const hints: Record<string, RegExp> = {
      Leadership: /\b(team|people|report|stakeholder|manage|hire|junior)\b/,
      'Achievement & impact': /\b(revenue|growth|sales|target|quota|customer|arr)\b/,
      'Improvement & efficiency': /\b(cost|time|process|efficien|manual|speed|latency)\b/,
      'Building & launching': /\b(build|launch|product|feature|system|platform|app)\b/,
      'Analysis & research': /\b(data|analy|research|report|insight|model|forecast)\b/,
      'Communication & influence': /\b(present|stakeholder|client|training|document|workshop)\b/,
    };
    return { category, verbs, score: hints[category]?.test(lower) ? 1 : 0 };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.flatMap((s) => s.verbs).slice(0, limit);
}
