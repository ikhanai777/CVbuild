/**
 * Job-description keyword matching.
 *
 * Applicant tracking systems and the humans reading behind them look for the
 * language of the advert. This extracts the terms that carry signal from a
 * pasted job description and reports which ones the CV never uses.
 */
import type { Resume } from '../../types/resume';

const STOP_WORDS = new Set(
  `a an the and or but if then than that this these those with without within into onto from for to of on in at by as is are was were be been being will would shall should can could may might must do does did done have has had having you your yours we our ours they them their it its he she his her who whom which what when where why how all any both each few more most other some such no nor not only own same so too very s t just don now able across about after again against because before below between during further here once other over same under until up down out off again also
  role roles job jobs position positions candidate candidates applicant applicants company companies team teams work working works experience experiences year years month months day days new strong great good excellent successful successfully ability abilities skill skills skilled knowledge understanding required requirement requirements responsibility responsibilities preferred plus bonus nice must please apply application applications opportunity opportunities benefit benefits salary contract permanent full time part hybrid remote office based looking seeking join help support ensure ensuring provide providing include including etc eg ie per across using use used
  degree bachelor bachelors master masters phd university college equivalent
  environment environments fast paced fast-paced culture value values mission vision people world class`
    .split(/\s+/)
    .filter(Boolean),
);

/** Multi-word terms worth keeping intact when they appear. */
const PHRASES = [
  'machine learning', 'data science', 'project management', 'product management',
  'stakeholder management', 'customer success', 'business development', 'user research',
  'continuous integration', 'continuous delivery', 'test automation', 'quality assurance',
  'financial modelling', 'financial modeling', 'risk management', 'change management',
  'supply chain', 'account management', 'go to market', 'go-to-market', 'a/b testing',
  'public speaking', 'cross functional', 'cross-functional', 'agile delivery',
  'digital marketing', 'content strategy', 'social media', 'search engine optimisation',
  'search engine optimization', 'software engineering', 'cloud infrastructure',
  'data analysis', 'process improvement', 'people management', 'p&l',
];

function normalise(text: string): string {
  return text
    .toLowerCase()
    .replace(/[‘’]/g, "'")
    .replace(/[^a-z0-9+#./&'\s-]/g, ' ');
}

/** Crude singulariser — enough to match "engineers" against "engineer". */
function stem(word: string): string {
  if (word.length > 4 && word.endsWith('ies')) return `${word.slice(0, -3)}y`;
  if (word.length > 3 && word.endsWith('es') && !word.endsWith('ses')) return word.slice(0, -2);
  if (word.length > 3 && word.endsWith('s') && !word.endsWith('ss')) return word.slice(0, -1);
  return word;
}

export interface KeywordHit {
  term: string;
  /** How often the term appears in the job description. */
  weight: number;
  present: boolean;
}

export function extractKeywords(jobDescription: string, limit = 30): Array<{ term: string; weight: number }> {
  const text = normalise(jobDescription);
  if (!text.trim()) return [];

  const counts = new Map<string, number>();

  for (const phrase of PHRASES) {
    const occurrences = text.split(phrase).length - 1;
    if (occurrences > 0) counts.set(phrase, (counts.get(phrase) ?? 0) + occurrences * 2);
  }

  const words = text.split(/\s+/).filter(Boolean);
  for (const raw of words) {
    const word = raw.replace(/^[-.]+|[-.]+$/g, '');
    if (word.length < 3 && !/^(ai|ux|ui|qa|bi|ml|hr|js|go|c#)$/.test(word)) continue;
    if (STOP_WORDS.has(word)) continue;
    if (/^\d+$/.test(word)) continue;
    const key = stem(word);
    if (STOP_WORDS.has(key)) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }

  return [...counts.entries()]
    .map(([term, weight]) => ({ term, weight }))
    .sort((a, b) => b.weight - a.weight || a.term.localeCompare(b.term))
    .slice(0, limit);
}

/** Every piece of text on the CV that a reader would actually see. */
export function resumeText(resume: Resume): string {
  const parts: string[] = [
    resume.basics.headline,
    resume.basics.summary,
    ...resume.experience.flatMap((e) => [e.position, e.company, e.summary, ...e.highlights]),
    ...resume.education.flatMap((e) => [e.degree, e.field, e.institution, ...e.highlights]),
    ...resume.skills.flatMap((g) => [g.category, ...g.items]),
    ...resume.projects.flatMap((p) => [p.name, p.role, p.description, ...p.highlights]),
    ...resume.certifications.flatMap((c) => [c.name, c.issuer]),
    ...resume.awards.flatMap((a) => [a.title, a.issuer, a.description]),
    ...resume.publications.flatMap((p) => [p.title, p.publisher]),
    ...resume.volunteer.flatMap((v) => [v.role, v.organization, v.description, ...v.highlights]),
    ...resume.interests,
    ...resume.customSections.flatMap((s) => [
      s.title,
      ...s.entries.flatMap((e) => [e.title, e.subtitle, e.description, ...e.highlights]),
    ]),
  ];
  return parts.filter(Boolean).join('\n');
}

export interface KeywordMatch {
  hits: KeywordHit[];
  matched: number;
  total: number;
  /** 0–100. Weighted by how often each term appears in the advert. */
  coverage: number;
}

export function matchKeywords(resume: Resume, jobDescription: string, limit = 30): KeywordMatch {
  const keywords = extractKeywords(jobDescription, limit);
  if (!keywords.length) return { hits: [], matched: 0, total: 0, coverage: 0 };

  const haystack = new Set(
    normalise(resumeText(resume))
      .split(/\s+/)
      .filter(Boolean)
      .map((w) => stem(w.replace(/^[-.]+|[-.]+$/g, ''))),
  );
  const haystackText = normalise(resumeText(resume));

  const hits: KeywordHit[] = keywords.map(({ term, weight }) => ({
    term,
    weight,
    present: term.includes(' ') ? haystackText.includes(term) : haystack.has(stem(term)),
  }));

  const totalWeight = hits.reduce((sum, h) => sum + h.weight, 0);
  const matchedWeight = hits.filter((h) => h.present).reduce((sum, h) => sum + h.weight, 0);

  return {
    hits,
    matched: hits.filter((h) => h.present).length,
    total: hits.length,
    coverage: totalWeight ? Math.round((matchedWeight / totalWeight) * 100) : 0,
  };
}
