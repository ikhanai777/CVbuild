/**
 * Heuristic parser: plain CV text in, structured {@link Resume} out.
 *
 * There is no reliable schema in a CV, so this works the way a human skim does:
 * find the contact details anywhere on the page, split the rest into sections by
 * their headings, then split each section into dated entries with bullets
 * hanging off them. Everything it is unsure about is reported in `notes` so the
 * user knows what to check rather than discovering it after they apply.
 */
import type {
  CertificationItem,
  EducationItem,
  ExperienceItem,
  ProjectItem,
  Resume,
  SectionKey,
} from '../../types/resume';
import { emptyResume } from '../../data/defaults';
import { uid } from '../id';

export interface ParseResult {
  resume: Resume;
  notes: string[];
  /** Section headings found in the source, for the "what we read" summary. */
  detectedSections: string[];
}

/* ------------------------------------------------------------------ */
/* patterns                                                            */
/* ------------------------------------------------------------------ */

const EMAIL_RE = /[\w.+-]+@[\w-]+\.[\w.-]{2,}/;
const PHONE_RE =
  /(\+\d{1,3}[\s.-]?)?(\(\d{1,4}\)[\s.-]?)?\d[\d\s.-]{6,}\d/;
const URL_RE = /\b((https?:\/\/)?(www\.)?[\w-]+\.[a-z]{2,}(\.[a-z]{2,})?(\/[^\s,;)]*)?)/gi;

const MONTH =
  '(?:jan|feb|mar|apr|may|jun|jul|aug|sep|sept|oct|nov|dec)[a-z]*\\.?';
const DATE_TOKEN = `(?:${MONTH}[\\s.\\-/]*\\d{2,4}|\\d{1,2}[./-]\\d{4}|\\d{4})`;
const DATE_RANGE_RE = new RegExp(
  `(${DATE_TOKEN})\\s*(?:-|–|—|to|until|through|\\u2013|\\u2014)\\s*(${DATE_TOKEN}|present|current|now|ongoing|date)`,
  'i',
);
const SINGLE_DATE_RE = new RegExp(`\\b${DATE_TOKEN}\\b`, 'i');

const BULLET_RE = /^\s*([•●○◦‣·▪▫*•●▪⁃+]|[-–—](?=\s)|\d{1,2}[.)](?=\s))\s*/;

const SEPARATOR_RE = /\s+(?:[|·•‖]|--|—|–|\bat\b|\bwith\b)\s+/i;

/* ------------------------------------------------------------------ */
/* section heading detection                                           */
/* ------------------------------------------------------------------ */

const SECTION_SYNONYMS: Array<{ key: SectionKey; patterns: RegExp }> = [
  {
    key: 'summary',
    patterns:
      /^(professional\s+)?(summary|profile|about( me)?|personal\s+statement|career\s+(summary|objective|profile)|objective|executive\s+summary|overview|introduction)$/i,
  },
  {
    key: 'experience',
    patterns:
      /^(work|professional|employment|career|relevant|industry)?\s*(experience|history|background|employment|positions?|appointments?)$/i,
  },
  {
    key: 'education',
    patterns:
      /^(education(\s+(and|&)\s+(training|qualifications))?|academic\s+(background|qualifications|history)|qualifications|training)$/i,
  },
  {
    key: 'skills',
    patterns:
      /^((core|key|technical|professional|it|software|hard|main)\s+)?(skills?|competencies|competences|expertise|proficiencies|technologies|tech\s+stack|tools?( (and|&) technologies)?)( (and|&) (abilities|interests|tools))?$/i,
  },
  {
    key: 'projects',
    patterns: /^((key|selected|personal|side|academic|notable)\s+)?projects?( (and|&) portfolio)?$/i,
  },
  {
    key: 'certifications',
    patterns:
      /^(certifications?|certificates?|licen[cs]es?( (and|&) certifications?)?|accreditations?|professional\s+development|courses?)$/i,
  },
  {
    key: 'awards',
    patterns: /^(awards?( (and|&) (honou?rs|achievements))?|honou?rs|achievements|accomplishments|scholarships?|grants?)$/i,
  },
  {
    key: 'publications',
    patterns: /^(publications?|papers?|research( output)?|conference\s+(papers|presentations)|talks?|presentations?)$/i,
  },
  { key: 'languages', patterns: /^(languages?|language\s+skills)$/i },
  {
    key: 'volunteer',
    patterns:
      /^(volunteer(ing|\s+(experience|work))?|community( (involvement|service))?|extracurricular(\s+activities)?|societies)$/i,
  },
  {
    key: 'interests',
    patterns: /^(interests?|hobbies( (and|&) interests)?|personal\s+interests|activities)$/i,
  },
  { key: 'references', patterns: /^(references?|referees?)$/i },
];

function cleanHeading(line: string): string {
  return line
    .replace(/[:••]+\s*$/, '')
    .replace(/^[\s••*\-–—]+/, '')
    .replace(/\s{2,}/g, ' ')
    .trim();
}

/** Returns the section this line is a heading for, or null. */
export function detectSectionHeading(line: string): SectionKey | 'custom' | null {
  const raw = line.trim();
  if (!raw || raw.length > 46) return null;
  if (BULLET_RE.test(raw)) return null;
  const text = cleanHeading(raw);
  if (!text || /[.!?]$/.test(text)) return null;
  if (EMAIL_RE.test(text) || DATE_RANGE_RE.test(text)) return null;

  for (const { key, patterns } of SECTION_SYNONYMS) {
    if (patterns.test(text)) return key;
  }

  // An unknown heading is only trusted when it is *styled* like one: set in
  // capitals, or title case followed by a colon. Title case alone is far too
  // common inside a section — "BSc Computer Science" and "Senior Engineer" are
  // entry titles, and promoting one to a heading destroys the rest of the parse.
  const words = text.split(/\s+/);
  if (words.length > 4 || /\d/.test(text)) return null;
  const isCaps = text === text.toUpperCase() && /[A-Z]{3,}/.test(text);
  const isTitledColon =
    /:\s*$/.test(raw) && words.every((w) => /^[A-Z&(]/.test(w) || w.length <= 3);
  if (isCaps || isTitledColon) return 'custom';

  return null;
}

/* ------------------------------------------------------------------ */
/* contact extraction                                                  */
/* ------------------------------------------------------------------ */

const LOCATION_RE =
  /\b([A-Z][a-zA-Z.'-]+(?:[ ][A-Z][a-zA-Z.'-]+){0,2}),\s*([A-Z][a-zA-Z.'-]+(?:[ ][A-Z][a-zA-Z.'-]+){0,2}|[A-Z]{2})\b/;

export interface ContactInfo {
  email: string;
  phone: string;
  location: string;
  website: string;
  linkedin: string;
  github: string;
}

export function extractContacts(text: string): ContactInfo {
  const email = EMAIL_RE.exec(text)?.[0] ?? '';

  // Search for the phone on lines that aren't dominated by dates, so a
  // "2019 - 2021" range is never mistaken for a number.
  let phone = '';
  for (const line of text.split('\n').slice(0, 25)) {
    if (DATE_RANGE_RE.test(line)) continue;
    const candidate = PHONE_RE.exec(line)?.[0]?.trim();
    if (candidate && candidate.replace(/\D/g, '').length >= 7 && candidate.replace(/\D/g, '').length <= 15) {
      phone = candidate.replace(/\s{2,}/g, ' ');
      break;
    }
  }

  let linkedin = '';
  let github = '';
  let website = '';
  // Strip emails first: the domain-shaped left half of "river.okonkwo@example.com"
  // otherwise gets picked up as a personal website.
  const withoutEmails = text.replace(/[\w.+-]+@[\w-]+\.[\w.-]{2,}/g, ' ');
  const urls = withoutEmails.match(URL_RE) ?? [];
  for (const raw of urls) {
    const url = raw.replace(/[.,;)]+$/, '');
    if (/@/.test(url)) continue;
    if (/linkedin\.com/i.test(url)) linkedin ||= url;
    else if (/github\.com/i.test(url)) github ||= url;
    else if (
      !website &&
      !/\.(png|jpe?g|gif|pdf|docx?)$/i.test(url) &&
      !/(gmail|outlook|hotmail|yahoo|icloud|proton)\./i.test(url)
    ) {
      website = url;
    }
  }

  // The location is usually on one of the first few lines, next to the contacts.
  let location = '';
  for (const line of text.split('\n').slice(0, 12)) {
    if (DATE_RANGE_RE.test(line)) continue;
    const m = LOCATION_RE.exec(line.replace(EMAIL_RE, ''));
    if (m) {
      location = `${m[1]}, ${m[2]}`;
      break;
    }
  }

  return { email, phone, location, website, linkedin, github };
}

export function extractName(lines: string[]): string {
  for (const raw of lines.slice(0, 12)) {
    const line = raw.trim();
    if (!line || line.length > 48) continue;
    if (EMAIL_RE.test(line) || /\d{3}/.test(line) || /https?:|www\./i.test(line)) continue;
    // A name set in caps looks exactly like an unrecognised heading, so only
    // *known* section headings disqualify a line here.
    const heading = detectSectionHeading(line);
    if (heading && heading !== 'custom') continue;
    const words = line.replace(/[,|·•].*$/, '').trim().split(/\s+/);
    if (words.length < 2 || words.length > 5) continue;
    if (!words.every((w) => /^[A-Za-z][A-Za-z'’.-]*$/.test(w))) continue;
    // Reject lines that read as a job title rather than a name.
    if (/\b(manager|engineer|developer|analyst|director|consultant|designer|specialist|officer|lead|intern)\b/i.test(line)) {
      continue;
    }
    return line
      .split(/\s+/)
      .map((w) => (w === w.toUpperCase() && w.length > 1 ? w[0] + w.slice(1).toLowerCase() : w))
      .join(' ');
  }
  return '';
}

/* ------------------------------------------------------------------ */
/* entry splitting                                                     */
/* ------------------------------------------------------------------ */

interface RawEntry {
  headerLines: string[];
  bullets: string[];
}

function isBullet(line: string): boolean {
  return BULLET_RE.test(line);
}

function stripBullet(line: string): string {
  return line.replace(BULLET_RE, '').trim();
}

/**
 * Splits a section's lines into entries. A line carrying a date range starts a
 * new entry; so does a non-bullet line that directly follows bullets.
 */
export function splitEntries(lines: string[]): RawEntry[] {
  const entries: RawEntry[] = [];
  let current: RawEntry | null = null;
  let lastWasBullet = false;

  for (const raw of lines) {
    const line = raw.trim();
    if (!line) continue;

    if (isBullet(line)) {
      if (!current) current = { headerLines: [], bullets: [] };
      current.bullets.push(stripBullet(line));
      lastWasBullet = true;
      continue;
    }

    if (current) {
      // A date line belongs to the header above it, so a date only starts a new
      // entry once the current one already carries its own dates.
      const currentHasDate = current.headerLines.some((l) => DATE_RANGE_RE.test(l));
      const startsEntry =
        lastWasBullet ||
        (DATE_RANGE_RE.test(line) && currentHasDate) ||
        current.headerLines.length >= 4;
      if (startsEntry) {
        entries.push(current);
        current = null;
      }
    }
    if (!current) current = { headerLines: [], bullets: [] };

    // A long sentence after a header is prose, not another header line.
    if (current.headerLines.length && line.split(/\s+/).length > 16) {
      current.bullets.push(line);
    } else {
      current.headerLines.push(line);
    }
    lastWasBullet = false;
  }

  if (current && (current.headerLines.length || current.bullets.length)) entries.push(current);
  return entries;
}

interface HeaderParts {
  primary: string;
  secondary: string;
  location: string;
  startDate: string;
  endDate: string;
  current: boolean;
}

function titleCaseMonth(token: string): string {
  return token.replace(/\b[a-z]/g, (c) => c.toUpperCase()).replace(/\.$/, '');
}

function normaliseDate(token: string): string {
  const t = token.trim().replace(/\s{2,}/g, ' ');
  if (/^(present|current|now|ongoing|date)$/i.test(t)) return '';
  const monthYear = new RegExp(`^(${MONTH})[\\s.\\-/]*(\\d{2,4})$`, 'i').exec(t);
  if (monthYear) {
    const month = titleCaseMonth(monthYear[1]).slice(0, 3);
    const year = monthYear[2].length === 2 ? `20${monthYear[2]}` : monthYear[2];
    return `${month} ${year}`;
  }
  const numeric = /^(\d{1,2})[./-](\d{4})$/.exec(t);
  if (numeric) {
    const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const idx = Number(numeric[1]) - 1;
    return months[idx] ? `${months[idx]} ${numeric[2]}` : numeric[2];
  }
  return t;
}

/** Pulls dates, location and the two title lines out of an entry's header. */
export function parseHeader(headerLines: string[]): HeaderParts {
  const parts: HeaderParts = {
    primary: '',
    secondary: '',
    location: '',
    startDate: '',
    endDate: '',
    current: false,
  };

  const remaining: string[] = [];
  for (const line of headerLines) {
    let rest = line;
    const range = DATE_RANGE_RE.exec(rest);
    if (range && !parts.startDate) {
      parts.startDate = normaliseDate(range[1]);
      parts.current = /present|current|now|ongoing|date/i.test(range[2]);
      parts.endDate = parts.current ? '' : normaliseDate(range[2]);
      rest = rest.replace(range[0], ' ');
    } else if (!parts.startDate && !parts.endDate) {
      const single = SINGLE_DATE_RE.exec(rest);
      // Only treat a bare date as the entry date when the line is mostly that date.
      if (single && rest.replace(single[0], '').replace(/[^\w]/g, '').length <= 3) {
        parts.endDate = normaliseDate(single[0]);
        rest = rest.replace(single[0], ' ');
      }
    }
    rest = rest.replace(/[|·•,\-–—\s]+$/, '').replace(/^[|·•,\-–—\s]+/, '').replace(/\s{2,}/g, ' ').trim();
    if (rest) remaining.push(rest);
  }

  // Split a combined "Position | Company | City" line.
  const fragments: string[] = [];
  for (const line of remaining) {
    const pieces = line.split(SEPARATOR_RE).map((p) => p.trim()).filter(Boolean);
    fragments.push(...(pieces.length > 1 ? pieces : [line]));
  }

  // Scan from the end: the place name is conventionally last, and an employer
  // like "University of California, Berkeley" also matches the "City, Region"
  // shape, so organisation words disqualify a fragment.
  const ORG_RE = /\b(university|college|school|institute|academy|ltd|limited|inc|llc|gmbh|plc|corp|group|company|bank|hospital)\b/i;
  for (let i = fragments.length - 1; i > 0; i -= 1) {
    const fragment = fragments[i];
    if (LOCATION_RE.test(fragment) && fragment.split(/\s+/).length <= 4 && !ORG_RE.test(fragment)) {
      parts.location = fragments.splice(i, 1)[0];
      break;
    }
  }

  parts.primary = fragments[0] ?? '';
  parts.secondary = fragments.slice(1).join(', ');
  return parts;
}

const GRADE_RE =
  /\b(gpa|grade|class|distinction|merit|honou?rs|cum laude|[0-9](\.[0-9]+)?\s*\/\s*[45](\.0)?|[12]:[12])\b/i;

const DEGREE_RE =
  /\b(b\.?sc|b\.?a|b\.?eng|bachelor|m\.?sc|m\.?a|m\.?eng|mba|master|ph\.?d|doctor|diploma|certificate|hnd|btec|a-?levels?|gcses?|foundation|associate)\b/i;

/* ------------------------------------------------------------------ */
/* main parse                                                          */
/* ------------------------------------------------------------------ */

export function parseResumeText(text: string, name = 'Imported CV'): ParseResult {
  const notes: string[] = [];
  const detectedSections: string[] = [];
  const resume = emptyResume(name);

  const normalised = text
    .replace(/\r\n?/g, '\n')
    .replace(/ /g, ' ')
    .replace(/[\t ]{2,}/g, '  ')
    .replace(/\n{3,}/g, '\n\n');
  const lines = normalised.split('\n').map((l) => l.replace(/\s+$/, ''));

  /* contacts and name */
  const contacts = extractContacts(normalised);
  resume.basics.email = contacts.email;
  resume.basics.phone = contacts.phone;
  resume.basics.location = contacts.location;
  resume.basics.website = contacts.website;
  resume.basics.linkedin = contacts.linkedin;
  resume.basics.github = contacts.github;
  resume.basics.fullName = extractName(lines);

  if (!resume.basics.fullName) notes.push('Could not identify a name — add it in the Details tab.');
  if (!contacts.email) notes.push('No email address found in the document.');

  /* split into sections */
  const blocks: Array<{ key: SectionKey | 'custom'; title: string; lines: string[] }> = [];
  let preamble: string[] = [];
  let currentBlock: { key: SectionKey | 'custom'; title: string; lines: string[] } | null = null;

  let seenKnownHeading = false;
  for (const line of lines) {
    let heading = detectSectionHeading(line);
    // The name and job title at the top of a CV are short capitalised lines and
    // look exactly like unrecognised headings. Custom sections effectively never
    // appear before the first standard one, so only trust them after that point.
    if (heading === 'custom' && !seenKnownHeading) heading = null;
    if (heading) {
      if (heading !== 'custom') seenKnownHeading = true;
      if (currentBlock) blocks.push(currentBlock);
      currentBlock = { key: heading, title: cleanHeading(line), lines: [] };
      detectedSections.push(cleanHeading(line));
      continue;
    }
    if (currentBlock) currentBlock.lines.push(line);
    else preamble.push(line);
  }
  if (currentBlock) blocks.push(currentBlock);

  /* headline: a short role-ish line in the preamble, under the name */
  const nameIdx = preamble.findIndex(
    (l) => !!resume.basics.fullName && l.trim().toLowerCase() === resume.basics.fullName.toLowerCase(),
  );
  const afterName = preamble.slice(nameIdx + 1, nameIdx + 4);
  for (const line of afterName) {
    const t = line.trim();
    if (!t || t.length > 70) continue;
    if (EMAIL_RE.test(t) || /https?:|www\.|@/.test(t)) continue;
    if (PHONE_RE.test(t) && t.replace(/\D/g, '').length >= 7) continue;
    if (t === contacts.location) continue;
    resume.basics.headline = t.replace(/^[|·•\-–—\s]+/, '').trim();
    break;
  }

  /* a summary paragraph sitting above any heading */
  const preambleProse = preamble
    .filter((l) => l.trim().split(/\s+/).length > 12)
    .join(' ')
    .trim();
  if (preambleProse) resume.basics.summary = preambleProse;

  /* per-section parsing */
  for (const block of blocks) {
    const body = block.lines.filter((l) => l.trim());
    if (!body.length) continue;

    switch (block.key) {
      case 'summary': {
        const prose = body.map((l) => stripBullet(l)).join(' ').replace(/\s{2,}/g, ' ').trim();
        if (prose) resume.basics.summary = prose;
        break;
      }

      case 'experience': {
        for (const entry of splitEntries(body)) {
          const h = parseHeader(entry.headerLines);
          if (!h.primary && !entry.bullets.length) continue;
          const job: ExperienceItem = {
            id: uid('exp'),
            position: h.primary,
            company: h.secondary,
            location: h.location,
            startDate: h.startDate,
            endDate: h.endDate,
            current: h.current,
            summary: '',
            highlights: entry.bullets,
          };
          // A "Company — Position" order is as common as the reverse; prefer the
          // fragment that looks like a job title as the position.
          if (
            job.company &&
            /\b(manager|engineer|developer|analyst|director|consultant|designer|specialist|officer|lead|head|intern|associate|assistant|coordinator|architect|scientist|president|partner)\b/i.test(
              job.company,
            ) &&
            !/\b(manager|engineer|developer|analyst|director|consultant|designer|specialist|officer|lead|head|intern|associate|assistant|coordinator|architect|scientist|president|partner)\b/i.test(
              job.position,
            )
          ) {
            [job.position, job.company] = [job.company, job.position];
          }
          resume.experience.push(job);
        }
        break;
      }

      case 'education': {
        for (const entry of splitEntries(body)) {
          // A grade often sits on its own header line ("GPA 3.8/4.0") rather
          // than as a bullet; pull it out before the header is interpreted.
          const gradeLines = entry.headerLines.filter(
            (l) => GRADE_RE.test(l) && l.split(/\s+/).length <= 7,
          );
          const h = parseHeader(entry.headerLines.filter((l) => !gradeLines.includes(l)));
          if (!h.primary) continue;
          const degreeLine = [h.primary, h.secondary].find((l) => DEGREE_RE.test(l ?? '')) ?? '';
          const institution =
            degreeLine === h.primary ? h.secondary : degreeLine ? h.primary : h.primary;
          const degreeText = degreeLine || h.secondary;
          const [degree, ...fieldParts] = degreeText.split(/\s+(?:in|of)\s+|,\s*/i);
          const item: EducationItem = {
            id: uid('edu'),
            institution: degreeLine === h.primary ? h.secondary : institution,
            degree: (degree ?? '').trim(),
            field: fieldParts.join(', ').trim(),
            location: h.location,
            startDate: h.startDate,
            endDate: h.endDate,
            grade: gradeLines[0] ?? entry.bullets.find((bl) => GRADE_RE.test(bl)) ?? '',
            highlights: entry.bullets.filter((bl) => !GRADE_RE.test(bl)),
          };
          if (!item.institution) item.institution = h.primary;
          resume.education.push(item);
        }
        break;
      }

      case 'skills': {
        for (const raw of body) {
          const line = stripBullet(raw);
          if (!line) continue;
          const labelled = /^([A-Za-z][\w &/+-]{2,32}):\s*(.+)$/.exec(line);
          if (labelled) {
            resume.skills.push({
              id: uid('sk'),
              category: labelled[1].trim(),
              items: splitList(labelled[2]),
            });
          } else {
            const items = splitList(line);
            if (!items.length) continue;
            const last = resume.skills[resume.skills.length - 1];
            if (last && !last.category) last.items.push(...items);
            else resume.skills.push({ id: uid('sk'), category: '', items });
          }
        }
        break;
      }

      case 'projects': {
        for (const entry of splitEntries(body)) {
          const h = parseHeader(entry.headerLines);
          if (!h.primary) continue;
          const urlMatch = entry.headerLines.join(' ').match(URL_RE)?.[0] ?? '';
          const project: ProjectItem = {
            id: uid('pr'),
            name: h.primary,
            role: '',
            link: urlMatch && !/@/.test(urlMatch) ? urlMatch : '',
            startDate: h.startDate,
            endDate: h.endDate,
            description: h.secondary,
            highlights: entry.bullets,
          };
          resume.projects.push(project);
        }
        break;
      }

      case 'certifications': {
        for (const raw of body) {
          const line = stripBullet(raw);
          if (!line) continue;
          const date = SINGLE_DATE_RE.exec(line)?.[0] ?? '';
          const withoutDate = line.replace(date, '').replace(/[(),|–—-]+\s*$/, '').trim();
          const [namePart, ...issuerParts] = withoutDate.split(/\s*[–—|,]\s*|\s+[-–]\s+/);
          const cert: CertificationItem = {
            id: uid('ce'),
            name: (namePart ?? withoutDate).trim(),
            issuer: issuerParts.join(', ').trim(),
            date: normaliseDate(date),
            credentialId: '',
            link: '',
          };
          if (cert.name) resume.certifications.push(cert);
        }
        break;
      }

      case 'awards': {
        for (const raw of body) {
          const line = stripBullet(raw);
          if (!line) continue;
          const date = SINGLE_DATE_RE.exec(line)?.[0] ?? '';
          const rest = line.replace(date, '').replace(/[(),|–—-]+\s*$/, '').trim();
          const [title, ...issuer] = rest.split(/\s*[–—|,]\s*/);
          resume.awards.push({
            id: uid('aw'),
            title: (title ?? rest).trim(),
            issuer: issuer.join(', ').trim(),
            date: normaliseDate(date),
            description: '',
          });
        }
        break;
      }

      case 'publications': {
        for (const raw of body) {
          const line = stripBullet(raw);
          if (line.split(/\s+/).length < 4) continue;
          const year = /(19|20)\d{2}/.exec(line)?.[0] ?? '';
          resume.publications.push({
            id: uid('pb'),
            title: line.replace(/^\d+[.)]\s*/, '').trim(),
            publisher: '',
            date: year,
            authors: '',
            link: line.match(URL_RE)?.[0] ?? '',
          });
        }
        break;
      }

      case 'languages': {
        for (const raw of body) {
          const line = stripBullet(raw);
          for (const chunk of line.split(/[,;·•|]/)) {
            const piece = chunk.trim();
            if (!piece) continue;
            const m = /^([A-Za-z\s]{2,24}?)\s*[–—:(-]\s*([A-Za-z\s\d/()]+)\)?$/.exec(piece);
            if (m) {
              resume.languages.push({
                id: uid('ln'),
                name: m[1].trim(),
                level: m[2].replace(/[)\s]+$/, '').trim(),
              });
            } else if (/^[A-Za-z\s]{2,24}$/.test(piece)) {
              resume.languages.push({ id: uid('ln'), name: piece, level: '' });
            }
          }
        }
        break;
      }

      case 'volunteer': {
        for (const entry of splitEntries(body)) {
          const h = parseHeader(entry.headerLines);
          if (!h.primary) continue;
          resume.volunteer.push({
            id: uid('vo'),
            role: h.primary,
            organization: h.secondary,
            startDate: h.startDate,
            endDate: h.endDate,
            description: '',
            highlights: entry.bullets,
          });
        }
        break;
      }

      case 'interests': {
        resume.interests.push(...body.flatMap((l) => splitList(stripBullet(l))));
        break;
      }

      case 'references': {
        const joined = body.map(stripBullet).join(' ');
        if (/available on request/i.test(joined)) break;
        for (const entry of splitEntries(body)) {
          const h = parseHeader(entry.headerLines);
          if (!h.primary) continue;
          resume.references.push({
            id: uid('rf'),
            name: h.primary,
            title: h.secondary,
            company: '',
            contact: entry.bullets.join(' '),
          });
        }
        break;
      }

      case 'custom': {
        const entries = splitEntries(body).map((entry) => {
          const h = parseHeader(entry.headerLines);
          return {
            id: uid('cu'),
            title: h.primary,
            subtitle: h.secondary,
            date: h.startDate || h.endDate ? [h.startDate, h.endDate].filter(Boolean).join(' – ') : '',
            description: '',
            highlights: entry.bullets,
          };
        });
        if (entries.some((e) => e.title || e.highlights.length)) {
          const id = uid('cs');
          resume.customSections.push({ id, title: block.title, entries });
          resume.settings.sectionOrder.push(`custom:${id}`);
        }
        break;
      }
    }
  }

  /* only keep sections hidden when they genuinely have no content */
  resume.settings.hiddenSections = resume.settings.hiddenSections.filter((key) => {
    switch (key) {
      case 'publications':
        return !resume.publications.length;
      case 'volunteer':
        return !resume.volunteer.length;
      case 'references':
        return !resume.references.length;
      case 'awards':
        return !resume.awards.length;
      default:
        return true;
    }
  });

  if (!resume.experience.length) {
    notes.push('No work experience was recognised. Check the Experience tab and add roles manually.');
  }
  if (!resume.education.length) notes.push('No education entries were recognised.');
  if (!resume.skills.length) notes.push('No skills were recognised.');
  const undated = resume.experience.filter((e) => !e.startDate).length;
  if (undated) notes.push(`${undated} role(s) came through without dates — worth checking.`);

  resume.meta.updatedAt = new Date().toISOString();
  return { resume, notes, detectedSections };
}

/** Splits "React, Node.js · SQL | Figma" into discrete skill items. */
export function splitList(text: string): string[] {
  return text
    .split(/[,;·•|]|\s{2,}|\s+\/\s+/)
    .map((s) => s.replace(/^[-–—\s]+|[.\s]+$/g, '').trim())
    .filter((s) => s.length > 1 && s.length < 48);
}
