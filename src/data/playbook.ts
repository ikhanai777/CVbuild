/**
 * The strategy library.
 *
 * These are the rules the scorecard enforces, written out so the user can see
 * the reasoning rather than just the penalty. They reflect the guidance that is
 * consistent across recruiter surveys, ATS vendor documentation and university
 * careers services — not any one employer's house style.
 */

export interface PlaybookEntry {
  id: string;
  title: string;
  body: string;
  /** A concrete before/after, which teaches faster than the rule does. */
  before?: string;
  after?: string;
}

export interface PlaybookChapter {
  id: string;
  title: string;
  intro: string;
  entries: PlaybookEntry[];
}

export const PLAYBOOK: PlaybookChapter[] = [
  {
    id: 'foundations',
    title: 'The six-second scan',
    intro:
      'A first pass over a CV takes a handful of seconds and follows a predictable path: name, current title, current employer, dates, education, then the top of the page again. Everything below is written to survive that pass.',
    entries: [
      {
        id: 'headline',
        title: 'Name the role you want, under your name',
        body: 'A CV with no target title makes the reader guess which pile it belongs in, and guesses go on the "no" pile. Use the advert\'s own job title when it is honest to do so.',
        before: 'Amara Osei\namara.osei@example.com',
        after: 'Amara Osei\nSenior Product Manager — Payments & Growth',
      },
      {
        id: 'top-third',
        title: 'Spend your best material in the top third',
        body: 'The first third of page one decides whether the rest is read. Your strongest quantified achievement belongs in the summary or the first bullet of your current role — never buried on page two.',
      },
      {
        id: 'reverse-chron',
        title: 'Stay reverse-chronological',
        body: 'Most recent first, everywhere. Functional CVs that hide dates read as gap-concealment and most ATS parsers mangle them. If you are changing career, keep the chronology and use the summary to explain the pivot.',
      },
      {
        id: 'one-page',
        title: 'One page under ten years, two pages after',
        body: 'Length signals judgement. Under ten years of experience, one page. Beyond that, two. Academic CVs, federal applications and senior clinical roles are the exceptions and have no limit.',
      },
    ],
  },
  {
    id: 'bullets',
    title: 'Writing bullets that land',
    intro:
      'A bullet exists to answer one question: what changed because you were there? Duty lists answer a different question, which is why they are ignored.',
    entries: [
      {
        id: 'xyz',
        title: 'The X-Y-Z formula',
        body: 'Accomplished [X] as measured by [Y] by doing [Z]. It forces an outcome, a number and a method into one line, which is exactly what an interviewer needs to ask a follow-up question.',
        before: 'Responsible for the checkout team and improving payment performance.',
        after: 'Cut payment failure rate from 5.1% to 3.4% by migrating checkout to a modular platform, recovering £12M in annualised revenue.',
      },
      {
        id: 'verb-first',
        title: 'Open with a past-tense action verb',
        body: 'Led, Built, Reduced, Negotiated, Launched. Verb-first bullets are shorter, active and scannable down the left edge of the page — which is how they are actually read.',
      },
      {
        id: 'quantify',
        title: 'Quantify at least half of your bullets',
        body: 'Numbers are the only part of a CV that cannot be bluffed cheaply, so readers weight them heavily. If you do not have exact figures, ranges, percentages, frequencies, team sizes and budgets all count.',
        before: 'Improved the onboarding process significantly.',
        after: 'Redesigned seller onboarding, lifting activation from 41% to 63% across 4,800 sellers.',
      },
      {
        id: 'no-duties',
        title: 'Delete "responsible for"',
        body: 'It describes the job description, not you — someone else held the same responsibility and achieved nothing. Replace it with what you actually delivered.',
      },
      {
        id: 'length',
        title: 'Keep bullets under two printed lines',
        body: 'One bullet, one achievement, ideally 15–25 words. A four-line bullet is a paragraph wearing a dot, and the second half is never read.',
      },
      {
        id: 'count',
        title: 'Three to six bullets for recent roles, one or two for old ones',
        body: 'Detail should decay with age. A role from twelve years ago earns a single line; your current role earns the space.',
      },
    ],
  },
  {
    id: 'ats',
    title: 'Getting through the filter',
    intro:
      'Most mid-size and large employers run applications through an applicant tracking system before a human sees them. You are not trying to trick it — you are trying not to be lost by it.',
    entries: [
      {
        id: 'mirror',
        title: 'Mirror the advert\'s language',
        body: 'If the advert says "stakeholder management" and your CV says "worked with senior people", a keyword filter scores you zero. Use their term wherever it is honestly true of you.',
      },
      {
        id: 'both-forms',
        title: 'Spell out acronyms once',
        body: 'Write "Search Engine Optimisation (SEO)" the first time. Filters may be configured for either form, and you cannot know which.',
      },
      {
        id: 'structure',
        title: 'Use standard section headings',
        body: '"Experience", "Education", "Skills". Creative headings like "Where I\'ve Made My Mark" are unparseable and cost you nothing to drop.',
      },
      {
        id: 'no-images',
        title: 'Never put text in an image, header or text box',
        body: 'Parsers frequently ignore page headers, footers and graphics entirely. Your phone number in the page header may not exist as far as the system is concerned.',
      },
      {
        id: 'columns',
        title: 'Prefer one column for portal applications',
        body: 'Column layouts can be read across rather than down, interleaving two roles into nonsense. Keep a single-column version for portals and a designed version for direct applications.',
      },
      {
        id: 'file',
        title: 'Send a text-based PDF unless Word is requested',
        body: 'PDF preserves your layout everywhere. Make sure it is text, not a scan — if you cannot select the text in the file, neither can the filter. When the advert asks for Word, send Word.',
      },
    ],
  },
  {
    id: 'tailoring',
    title: 'Tailoring per application',
    intro:
      'One generic CV sent to forty employers performs worse than eight tailored ones. Tailoring is mostly reordering, not rewriting.',
    entries: [
      {
        id: 'reorder',
        title: 'Reorder before you rewrite',
        body: 'Move the most relevant role\'s bullets to the top of their list, promote the section the advert cares about, and cut the bullets that serve a different job. Twenty minutes of reordering beats an hour of new prose.',
      },
      {
        id: 'summary-swap',
        title: 'Rewrite only the summary and headline each time',
        body: 'These two blocks carry almost all the role-specific signal. Keep a master CV and change these per application.',
      },
      {
        id: 'evidence',
        title: 'Answer the advert\'s top three requirements explicitly',
        body: 'Find the three things the advert repeats. Make sure each has a matching bullet with evidence. If one has no evidence, that is what the cover letter is for.',
      },
    ],
  },
  {
    id: 'pitfalls',
    title: 'What loses applications',
    intro: 'Most rejections at CV stage are not about capability. They are about avoidable friction.',
    entries: [
      {
        id: 'typos',
        title: 'Typos and inconsistent dates',
        body: 'Read it backwards, bullet by bullet, then have someone else read it. Inconsistent date formats look careless in a document that claims attention to detail.',
      },
      {
        id: 'gaps',
        title: 'Explain gaps briefly and move on',
        body: 'An unexplained gap invites the worst assumption. One line — "Career break — full-time caring responsibilities" — closes the question completely.',
      },
      {
        id: 'cliches',
        title: 'Cut claims you have not evidenced',
        body: '"Team player", "results-driven", "excellent communicator". They cost a line each and persuade nobody. Replace with the evidence that would make the reader think it themselves.',
      },
      {
        id: 'photo',
        title: 'Know the photo convention for the market',
        body: 'Photos are standard in much of continental Europe and expected on some CVs in Asia and Latin America. In the UK, US, Canada, Australia and Ireland they invite bias-screening rejection. Match the market you are applying to.',
      },
      {
        id: 'references',
        title: 'Leave references off',
        body: '"References available on request" is assumed and wastes a line. Employers ask when they need them.',
      },
      {
        id: 'personal-data',
        title: 'Leave out age, marital status and full address',
        body: 'In most English-speaking markets these are not asked for, can trigger bias, and are a needless privacy exposure. City and country is enough.',
      },
    ],
  },
];

/** Summary-writing scaffolds offered in the editor. */
export const SUMMARY_TEMPLATES: Array<{ label: string; text: string }> = [
  {
    label: 'Experienced professional',
    text: '[Job title] with [N] years in [industry/domain]. [Strongest achievement with a number]. Looking to bring [specific strength] to [type of role or company].',
  },
  {
    label: 'Career changer',
    text: '[Previous field] professional moving into [new field], with [transferable achievement with a number] and [relevant training or project]. Seeking a [target role] where [overlap between the two fields] applies directly.',
  },
  {
    label: 'Recent graduate',
    text: '[Degree] graduate from [institution] with hands-on experience through [project, placement or internship], where [achievement with a number]. Looking for a [target role] in [industry].',
  },
  {
    label: 'Senior / executive',
    text: '[Title] with [N] years leading [function] across [scale: markets, headcount, revenue]. [Largest measurable outcome]. Track record of [second theme], most recently [proof point].',
  },
  {
    label: 'Returning after a break',
    text: '[Job title] returning to [field] after [brief reason]. Previously [strongest achievement with a number] at [company type]. Recently [refresher training, freelance or volunteer work] and ready to [target role].',
  },
];

/** Bullet scaffolds, offered inline next to each highlight field. */
export const BULLET_PATTERNS: Array<{ label: string; text: string }> = [
  { label: 'Impact', text: '[Verb] [what] by [how], [result with a number]' },
  { label: 'Scale', text: '[Verb] [scope: team size / budget / users] across [markets or systems]' },
  { label: 'Efficiency', text: 'Reduced [cost/time/errors] from [X] to [Y] by [change made]' },
  { label: 'Growth', text: 'Grew [metric] by [X%] in [timeframe] through [initiative]' },
  { label: 'Leadership', text: 'Led [N people/teams] to deliver [outcome] [ahead of schedule / under budget]' },
  { label: 'Problem solved', text: 'Diagnosed [problem costing X] and [fix], eliminating [quantified loss]' },
];
