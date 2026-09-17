/**
 * The CV scorecard.
 *
 * Each category encodes a rule that recruiters and ATS vendors consistently
 * apply: contact details must be complete and machine-readable, bullets must
 * lead with an action verb and carry a measurable outcome, length must match
 * career stage, and the file must be parseable. The score is a weighted mean of
 * the categories, so no single rule can sink an otherwise strong CV.
 */
import type { Resume } from '../../types/resume';
import { getTemplate } from '../../templates/registry';
import {
  clichesIn,
  hasMetric,
  isPassive,
  startsWithActionVerb,
  usesPronouns,
  weakOpener,
  wordCount,
} from './language';
import { matchKeywords } from './keywords';

export type Severity = 'critical' | 'warning' | 'suggestion';

export interface Issue {
  id: string;
  severity: Severity;
  message: string;
  /** What to do about it. */
  fix: string;
  /** Human-readable pointer, e.g. "Experience › Northwind Payments › bullet 2". */
  location?: string;
  category: string;
}

export interface ScoreCategory {
  id: string;
  label: string;
  /** 0–100 for this category alone. */
  score: number;
  weight: number;
  summary: string;
}

export interface ResumeStats {
  bulletCount: number;
  quantifiedBullets: number;
  actionVerbBullets: number;
  averageBulletWords: number;
  longBullets: number;
  totalWords: number;
  estimatedPages: number;
  yearsCovered: number;
}

export interface ResumeScore {
  total: number;
  grade: 'Excellent' | 'Strong' | 'Needs work' | 'Incomplete';
  categories: ScoreCategory[];
  issues: Issue[];
  stats: ResumeStats;
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^[+()\d][\d\s().-]{6,}$/;

function clamp(n: number): number {
  return Math.max(0, Math.min(100, Math.round(n)));
}

function allBullets(resume: Resume) {
  const out: Array<{ text: string; location: string }> = [];
  resume.experience.forEach((job) => {
    const where = job.company || job.position || 'Experience';
    job.highlights.forEach((h, i) => {
      if (h.trim()) out.push({ text: h, location: `Experience › ${where} › bullet ${i + 1}` });
    });
  });
  resume.projects.forEach((p) => {
    p.highlights.forEach((h, i) => {
      if (h.trim()) out.push({ text: h, location: `Projects › ${p.name || 'Project'} › bullet ${i + 1}` });
    });
  });
  resume.volunteer.forEach((v) => {
    v.highlights.forEach((h, i) => {
      if (h.trim())
        out.push({ text: h, location: `Volunteering › ${v.organization || 'Entry'} › bullet ${i + 1}` });
    });
  });
  return out;
}

function parseYear(value: string): number | null {
  const m = /(19|20)\d{2}/.exec(value);
  return m ? Number(m[0]) : null;
}

/** Rough page estimate from rendered line count — good enough to warn on length. */
export function estimatePages(resume: Resume): number {
  const charsPerLine = resume.settings.paperSize === 'A4' ? 96 : 100;
  const scale = resume.settings.fontScale || 1;
  const effectiveChars = Math.round(charsPerLine / scale);
  const template = getTemplate(resume.settings.templateId);
  const twoCol = template.layout !== 'single' && template.layout !== 'timeline';

  let lines = 6; // header block
  const textLines = (text: string, width = effectiveChars) =>
    Math.max(1, Math.ceil(text.trim().length / width));

  if (resume.basics.summary && !resume.settings.hiddenSections.includes('summary')) {
    lines += 1 + textLines(resume.basics.summary);
  }
  const bodyWidth = twoCol ? Math.round(effectiveChars * 0.66) : effectiveChars;

  resume.experience.forEach((job) => {
    lines += 2.4;
    if (job.summary) lines += textLines(job.summary, bodyWidth);
    job.highlights.filter(Boolean).forEach((h) => (lines += textLines(h, bodyWidth)));
  });
  resume.education.forEach((ed) => {
    lines += 2.2 + ed.highlights.filter(Boolean).length;
  });
  resume.projects.forEach((p) => {
    lines += 2 + (p.description ? textLines(p.description, bodyWidth) : 0) + p.highlights.filter(Boolean).length;
  });
  lines += resume.skills.length * 1.4;
  lines += resume.certifications.length + resume.awards.length * 1.6;
  lines += resume.publications.length * 2;
  lines += resume.languages.length * (twoCol ? 1 : 0.5);
  lines += resume.volunteer.length * 2.5;
  lines += resume.customSections.reduce((n, s) => n + 1 + s.entries.length * 2.2, 0);
  lines += 1.6 * 6; // section headings and gaps

  const usableHeight = (resume.settings.paperSize === 'A4' ? 297 : 279.4) - resume.settings.margin * 2;
  const lineHeightMm = 3.6 * scale * (resume.settings.lineHeight / 1.35);
  const linesPerPage = Math.max(20, Math.floor(usableHeight / lineHeightMm));

  return Math.max(1, Math.round((lines / linesPerPage) * 10) / 10);
}

export function scoreResume(resume: Resume): ResumeScore {
  const issues: Issue[] = [];
  const add = (
    category: string,
    severity: Severity,
    message: string,
    fix: string,
    location?: string,
  ) => {
    issues.push({ id: `${category}-${issues.length}`, category, severity, message, fix, location });
  };

  const b = resume.basics;
  const bullets = allBullets(resume);

  /* --- 1. Contact & headline ------------------------------------------ */
  let contact = 100;
  if (!b.fullName.trim()) {
    contact -= 40;
    add('Contact', 'critical', 'No name on the CV.', 'Add your full name — it is the anchor every reader and parser looks for.');
  }
  if (!b.email.trim()) {
    contact -= 30;
    add('Contact', 'critical', 'No email address.', 'Add a professional email address. Without one you cannot be contacted.');
  } else if (!EMAIL_RE.test(b.email.trim())) {
    contact -= 20;
    add('Contact', 'critical', 'The email address looks malformed.', 'Check for typos — a broken address silently loses you the application.');
  }
  if (!b.phone.trim()) {
    contact -= 12;
    add('Contact', 'warning', 'No phone number.', 'Recruiters still call. Add a number with the country code.');
  } else if (!PHONE_RE.test(b.phone.trim())) {
    contact -= 6;
    add('Contact', 'suggestion', 'The phone number format is unusual.', 'Use an international format, e.g. +44 7700 900142.');
  }
  if (!b.location.trim()) {
    contact -= 8;
    add('Contact', 'warning', 'No location.', 'Add "City, Country". Employers filter on it, and remote roles still ask.');
  }
  if (!b.linkedin.trim() && !b.website.trim() && !b.github.trim()) {
    contact -= 10;
    add('Contact', 'suggestion', 'No LinkedIn or portfolio link.', 'Add at least one link. A CV with no online profile reads as incomplete in 2020s hiring.');
  }
  if (!b.headline.trim()) {
    contact -= 12;
    add('Contact', 'warning', 'No target job title under your name.', 'Add the title of the role you are applying for. It tells the reader in one second which pile you belong in.');
  }

  /* --- 2. Summary ------------------------------------------------------ */
  let summaryScore = 100;
  const summaryWords = wordCount(b.summary);
  if (!b.summary.trim()) {
    summaryScore = 45;
    add('Summary', 'warning', 'No professional summary.', 'Write 2–4 sentences: your title and years of experience, your strongest proof point with a number, and what you are looking for.');
  } else {
    if (summaryWords < 25) {
      summaryScore -= 25;
      add('Summary', 'suggestion', 'The summary is very short.', 'Aim for 40–80 words — enough for a role, a proof point and a direction.');
    }
    if (summaryWords > 110) {
      summaryScore -= 25;
      add('Summary', 'warning', 'The summary is too long.', 'Cut to 80 words or fewer. Anything longer is skipped and eats space your experience needs.');
    }
    if (!hasMetric(b.summary)) {
      summaryScore -= 15;
      add('Summary', 'suggestion', 'The summary contains no numbers.', 'Put your single best measurable result in the summary — it is the most-read part of the CV.');
    }
    if (usesPronouns(b.summary)) {
      summaryScore -= 10;
      add('Summary', 'suggestion', 'The summary uses first-person pronouns.', 'CV convention drops "I" and "my": "Senior engineer with…" rather than "I am a senior engineer…".');
    }
    const summaryCliches = clichesIn(b.summary);
    if (summaryCliches.length) {
      summaryScore -= 12;
      add('Summary', 'warning', `Cliché phrasing: "${summaryCliches[0]}".`, 'Replace the claim with the evidence for it. "Cut release time by 40%" beats "results-driven".');
    }
  }

  /* --- 3. Impact: quantified, verb-led bullets ------------------------- */
  let impact = 100;
  const quantified = bullets.filter((x) => hasMetric(x.text)).length;
  const verbLed = bullets.filter((x) => startsWithActionVerb(x.text)).length;
  const quantRatio = bullets.length ? quantified / bullets.length : 0;
  const verbRatio = bullets.length ? verbLed / bullets.length : 0;

  if (!bullets.length) {
    impact = 20;
    add('Impact', 'critical', 'No achievement bullets anywhere on the CV.', 'Add 3–6 bullets to each recent role. A CV without bullets gives a reader nothing to assess.');
  } else {
    impact = clamp(quantRatio * 55 + verbRatio * 45);
    if (quantRatio < 0.5) {
      add(
        'Impact',
        quantRatio < 0.25 ? 'critical' : 'warning',
        `Only ${quantified} of ${bullets.length} bullets contain a number.`,
        'Aim for at least half. Use the X-Y-Z formula: accomplished [X] as measured by [Y] by doing [Z].',
      );
    }
    bullets.forEach((bullet) => {
      const weak = weakOpener(bullet.text);
      if (weak) {
        add('Impact', 'warning', `Weak opener: "${weak.phrase}".`, weak.fix, bullet.location);
      } else if (!startsWithActionVerb(bullet.text)) {
        add(
          'Impact',
          'suggestion',
          'Bullet does not start with a recognised action verb.',
          'Open with a strong past-tense verb — Led, Built, Reduced, Delivered.',
          bullet.location,
        );
      }
      if (isPassive(bullet.text)) {
        add('Impact', 'suggestion', 'Passive voice.', 'Rewrite actively so the achievement is clearly yours.', bullet.location);
      }
      if (usesPronouns(bullet.text)) {
        add('Impact', 'suggestion', 'Bullet uses "I" or "we".', 'Drop the pronoun and start with the verb.', bullet.location);
      }
      const found = clichesIn(bullet.text);
      if (found.length) {
        add('Impact', 'suggestion', `Cliché: "${found[0]}".`, 'Swap the claim for the evidence.', bullet.location);
      }
    });
  }

  /* --- 4. Brevity ------------------------------------------------------ */
  let brevity = 100;
  const bulletWords = bullets.map((x) => wordCount(x.text));
  const avgWords = bulletWords.length
    ? Math.round((bulletWords.reduce((a, c) => a + c, 0) / bulletWords.length) * 10) / 10
    : 0;
  const longBullets = bullets.filter((_, i) => bulletWords[i] > 34);
  const pages = estimatePages(resume);
  const latestStart = resume.experience
    .map((e) => parseYear(e.startDate))
    .filter((y): y is number => y != null);
  const earliest = latestStart.length ? Math.min(...latestStart) : null;
  const yearsCovered = earliest ? new Date().getFullYear() - earliest : 0;

  longBullets.forEach((bullet) => {
    brevity -= 6;
    add(
      'Brevity',
      'suggestion',
      'Bullet runs longer than two printed lines.',
      'Cut to under 30 words. One bullet, one achievement.',
      bullet.location,
    );
  });

  const expectedPages = yearsCovered >= 10 ? 2 : 1;
  const template = getTemplate(resume.settings.templateId);
  const academic = template.id === 'academic-cv' || template.id === 'federal-detailed';
  if (!academic) {
    if (pages > expectedPages + 0.15) {
      brevity -= 22;
      add(
        'Brevity',
        pages > expectedPages + 1 ? 'warning' : 'suggestion',
        `Estimated length is ${pages} pages; ${expectedPages} is expected for your experience level.`,
        'Cut the oldest roles to one line each, drop bullets that repeat, and tighten the summary. The Compact One-Page template also buys roughly a third of a page.',
      );
    }
    if (pages < 0.65 && bullets.length) {
      brevity -= 10;
      add('Brevity', 'suggestion', 'The CV leaves a lot of the page empty.', 'Add bullets to your most recent role, or a projects section, rather than padding margins and font size.');
    }
  }
  if (avgWords > 0 && avgWords < 8) {
    brevity -= 12;
    add('Brevity', 'suggestion', 'Bullets are very terse.', 'A bullet needs the action and its result — around 15–25 words.');
  }
  if (!bullets.length) {
    // Nothing has been written yet, so a full mark here would flatter an empty
    // document into looking half-finished rather than empty.
    brevity = Math.min(brevity, 30);
  }
  brevity = clamp(brevity);

  /* --- 5. Structure & completeness ------------------------------------- */
  let structure = 100;
  if (!resume.experience.length) {
    structure -= 30;
    add('Structure', 'critical', 'No experience section.', 'Add roles, internships, freelance or significant volunteering — anything with dates and outcomes.');
  }
  if (!resume.education.length) {
    structure -= 12;
    add('Structure', 'warning', 'No education section.', 'Add your highest qualification, even if it is not recent.');
  }
  if (!resume.skills.length) {
    structure -= 18;
    add('Structure', 'warning', 'No skills section.', 'List the tools and methods named in the job advert. This is the section keyword filters read first.');
  }
  const undated = resume.experience.filter((e) => !e.startDate.trim() || (!e.endDate.trim() && !e.current));
  if (undated.length) {
    structure -= 12;
    add('Structure', 'warning', `${undated.length} role(s) missing a start or end date.`, 'Fill in every date. Unexplained gaps and missing dates are the most common reason a CV is set aside.');
  }
  const thinRoles = resume.experience.filter((e) => e.highlights.filter(Boolean).length === 0);
  if (thinRoles.length) {
    structure -= 10;
    add('Structure', 'warning', `${thinRoles.length} role(s) have no bullets.`, 'Give every role from the last ten years at least two achievement bullets.');
  }
  const recent = resume.experience[0];
  if (recent && recent.highlights.filter(Boolean).length > 8) {
    structure -= 5;
    add('Structure', 'suggestion', 'Your most recent role has more than 8 bullets.', 'Keep the 5–6 strongest. Past a handful, readers skim and the best ones get lost.');
  }
  if (resume.references.length && !resume.settings.hiddenSections.includes('references')) {
    structure -= 4;
    add('Structure', 'suggestion', 'References are printed on the CV.', 'Space is better spent on achievements — employers ask for references when they need them.');
  }
  structure = clamp(structure);

  /* --- 6. ATS & formatting --------------------------------------------- */
  let ats = 100;
  if (!template.atsSafe) {
    ats -= 18;
    const isMultiColumn =
      template.layout === 'sidebar-left' ||
      template.layout === 'sidebar-right' ||
      template.layout === 'header-band';
    add(
      'ATS',
      'suggestion',
      isMultiColumn
        ? `"${template.name}" is a multi-column design.`
        : `"${template.name}" uses decorative elements a parser may not read cleanly.`,
      isMultiColumn
        ? 'Some applicant tracking systems read columns out of order. For online portals, switch to ATS Classic or Modern Professional and keep this one for direct applications.'
        : 'Symbols, borders and non-standard headings can confuse a parser even in a single column. For online portals, switch to ATS Classic or Modern Professional and keep this one for direct applications.',
    );
  }
  if (resume.settings.showPhoto && resume.basics.photo) {
    ats -= 10;
    add(
      'ATS',
      'suggestion',
      'The CV includes a photo.',
      'Standard in much of continental Europe; in the UK, US, Canada and Australia it invites bias screening and some systems reject it. Turn it off for those markets.',
    );
  }
  if (resume.settings.fontScale < 0.9) {
    ats -= 8;
    add('ATS', 'warning', 'The font is scaled below 90%.', 'Below roughly 9.5pt the CV becomes hard to read on paper. Cut content instead.');
  }
  if (resume.settings.margin < 10) {
    ats -= 8;
    add('ATS', 'warning', 'Margins are under 10mm.', 'Most office printers clip below 10mm. Keep 12–20mm.');
  }
  if (b.email && /hotmail|aol\.com|yahoo\.co/i.test(b.email)) {
    ats -= 4;
    add('ATS', 'suggestion', 'Dated email provider.', 'A plain Gmail or custom-domain address reads as more current.');
  }
  if (b.email && /\d{4,}|(sexy|cool|kitty|babe|xx)/i.test(b.email.split('@')[0] ?? '')) {
    ats -= 6;
    add('ATS', 'warning', 'Unprofessional-looking email handle.', 'Use firstname.lastname@ wherever you can.');
  }
  ats = clamp(ats);

  /* --- 7. Keyword targeting -------------------------------------------- */
  const jd = resume.meta.targetJobDescription.trim();
  const keyword = matchKeywords(resume, jd);
  let keywordScore = 70; // neutral when no advert has been pasted
  if (jd) {
    keywordScore = clamp(keyword.coverage);
    const missing = keyword.hits.filter((h) => !h.present).slice(0, 6);
    if (keyword.coverage < 60 && missing.length) {
      add(
        'Keywords',
        keyword.coverage < 40 ? 'warning' : 'suggestion',
        `The CV misses ${keyword.total - keyword.matched} of ${keyword.total} terms from the advert.`,
        `Work these in where they are honestly true: ${missing.map((m) => m.term).join(', ')}.`,
      );
    }
  } else {
    add(
      'Keywords',
      'suggestion',
      'No job advert pasted in.',
      'Paste the advert into the Target role box to see which of its terms your CV is missing. Tailoring per application is the single highest-return edit.',
    );
  }

  /* --- weighted total --------------------------------------------------- */
  const categories: ScoreCategory[] = [
    {
      id: 'contact',
      label: 'Contact & headline',
      score: clamp(contact),
      weight: 12,
      summary: 'Can a recruiter reach you, and do they know what role you want?',
    },
    {
      id: 'summary',
      label: 'Professional summary',
      score: clamp(summaryScore),
      weight: 12,
      summary: 'The most-read four lines on the page.',
    },
    {
      id: 'impact',
      label: 'Impact & action verbs',
      score: clamp(impact),
      weight: 28,
      summary: `${quantified}/${bullets.length || 0} bullets quantified, ${verbLed}/${bullets.length || 0} verb-led.`,
    },
    {
      id: 'brevity',
      label: 'Length & brevity',
      score: brevity,
      weight: 14,
      summary: `About ${pages} page${pages === 1 ? '' : 's'}, ${avgWords} words per bullet.`,
    },
    {
      id: 'structure',
      label: 'Structure & completeness',
      score: structure,
      weight: 16,
      summary: 'Sections, dates and coverage of every role.',
    },
    {
      id: 'ats',
      label: 'ATS & formatting',
      score: ats,
      weight: 10,
      summary: template.atsSafe ? 'Parser-friendly layout.' : 'Multi-column layout — human readers only.',
    },
    {
      id: 'keywords',
      label: 'Role targeting',
      score: keywordScore,
      weight: 8,
      summary: jd ? `${keyword.coverage}% keyword coverage.` : 'No advert pasted yet.',
    },
  ];

  const totalWeight = categories.reduce((s, c) => s + c.weight, 0);
  const total = clamp(
    categories.reduce((s, c) => s + c.score * c.weight, 0) / totalWeight,
  );

  const grade: ResumeScore['grade'] =
    total >= 85 ? 'Excellent' : total >= 70 ? 'Strong' : total >= 45 ? 'Needs work' : 'Incomplete';

  const severityRank: Record<Severity, number> = { critical: 0, warning: 1, suggestion: 2 };
  issues.sort((a, b2) => severityRank[a.severity] - severityRank[b2.severity]);

  return {
    total,
    grade,
    categories,
    issues,
    stats: {
      bulletCount: bullets.length,
      quantifiedBullets: quantified,
      actionVerbBullets: verbLed,
      averageBulletWords: avgWords,
      longBullets: longBullets.length,
      totalWords: bulletWords.reduce((a, c) => a + c, 0) + summaryWords,
      estimatedPages: pages,
      yearsCovered,
    },
  };
}
