/**
 * UAE market rules.
 *
 * A CV that works in London can fail in Dubai for reasons that have nothing to
 * do with its bullets: no visa status (can they be hired without sponsorship?),
 * no notice period (can they join this quarter?), a foreign number the
 * recruiter will not call, or a missing health or teaching licence that the
 * regulator requires before day one. These checks encode what UAE recruiters
 * screen on, and power both the scorecard and the UAE Toolkit panel.
 */
import type { PersonalDetails, Resume } from '../types/resume';
import { KEY_FACT_FIELDS } from '../types/resume';

export const EMIRATES = [
  'Dubai',
  'Abu Dhabi',
  'Sharjah',
  'Ajman',
  'Ras Al Khaimah',
  'Fujairah',
  'Umm Al Quwain',
] as const;

/** Also matches the free-zone and area names people write instead of the emirate. */
const UAE_PLACE_RE =
  /\b(u\.?a\.?e\.?|united arab emirates|emirates|dubai|abu\s*dhabi|sharjah|ajman|ras\s*al[\s-]*khaimah|rak|fujairah|umm\s*al[\s-]*quwain|al\s*ain|khor\s*fakkan|jebel\s*ali|difc|jlt)\b/i;

export function isUaeLocation(text: string): boolean {
  return UAE_PLACE_RE.test(text);
}

/** True when the location names an emirate or city, not just "UAE". */
export function namesEmirate(text: string): boolean {
  return /\b(dubai|abu\s*dhabi|sharjah|ajman|ras\s*al[\s-]*khaimah|rak|fujairah|umm\s*al[\s-]*quwain|al\s*ain)\b/i.test(
    text,
  );
}

export function isUaeNational(nationality: string): boolean {
  return /\b(emirati|uae\s*national|united arab emirates|^uae$)/i.test(nationality.trim());
}

/**
 * Normalises a UAE number to the international form recruiters dial from:
 * "+971 50 123 4567" for mobiles, "+971 4 123 4567" for landlines. Returns null
 * when the input is not recognisably a UAE number, so foreign numbers are
 * never rewritten.
 */
export function formatUaePhone(input: string): string | null {
  let digits = input.replace(/[^\d+]/g, '');
  if (digits.startsWith('+')) digits = digits.slice(1);
  else if (digits.startsWith('00')) digits = digits.slice(2);

  let local: string;
  if (digits.startsWith('971')) local = digits.slice(3);
  else if (digits.startsWith('0')) local = digits.slice(1);
  else if (/^5\d{8}$/.test(digits)) local = digits;
  else return null;
  if (local.startsWith('0')) local = local.slice(1);

  // Mobiles: 50, 52, 54, 55, 56, 58 + 7 digits.
  if (/^5[024568]\d{7}$/.test(local)) {
    return `+971 ${local.slice(0, 2)} ${local.slice(2, 5)} ${local.slice(5)}`;
  }
  // Landlines: single-digit area code (2 Abu Dhabi, 3 Al Ain, 4 Dubai, 6 Sharjah/Ajman/UAQ, 7 RAK, 9 Fujairah) + 7 digits.
  if (/^[234679]\d{7}$/.test(local)) {
    return `+971 ${local.slice(0, 1)} ${local.slice(1, 4)} ${local.slice(4)}`;
  }
  return null;
}

export function isUaePhone(input: string): boolean {
  return formatUaePhone(input) !== null;
}

/* ------------------------------------------------------------------ */
/* suggestions for the editor                                          */
/* ------------------------------------------------------------------ */

export const VISA_OPTIONS = [
  'UAE National — no visa required',
  'GCC National — no visa required',
  'Employment visa (transferable)',
  'Golden Visa (10-year residence)',
  'Green Visa (self-sponsored)',
  'Freelance permit',
  'Family / spouse sponsored — can work with a work permit',
  'Investor / partner visa',
  'Visit visa — available to convert',
  'Cancelled visa — within grace period',
  'Outside the UAE — requires sponsorship',
];

export const AVAILABILITY_OPTIONS = [
  'Immediate joiner',
  '1 week notice',
  '2 weeks notice',
  '30 days notice',
  '60 days notice',
  '90 days notice',
];

export const LICENCE_OPTIONS = [
  'UAE driving licence — light vehicle',
  'UAE driving licence — heavy vehicle',
  'UAE driving licence — motorcycle',
  'GCC driving licence',
  'International driving licence',
];

export const NATIONALITY_SUGGESTIONS = [
  'Emirati',
  'Indian',
  'Pakistani',
  'Filipino',
  'Egyptian',
  'Jordanian',
  'Lebanese',
  'Syrian',
  'Palestinian',
  'Bangladeshi',
  'Sri Lankan',
  'Nepali',
  'British',
  'American',
  'Canadian',
  'South African',
  'Saudi',
  'Omani',
  'Bahraini',
  'Kuwaiti',
  'Qatari',
  'Moroccan',
  'Tunisian',
  'Sudanese',
  'Nigerian',
  'Kenyan',
  'French',
  'German',
  'Russian',
  'Chinese',
];

/* ------------------------------------------------------------------ */
/* header key facts                                                    */
/* ------------------------------------------------------------------ */

export interface KeyFact {
  key: keyof PersonalDetails;
  icon: string;
  text: string;
}

const FACT_ICON: Partial<Record<keyof PersonalDetails, string>> = {
  nationality: 'flag',
  visaStatus: 'visa',
  availability: 'clock',
  drivingLicence: 'car',
};

/**
 * The facts printed in the header when the setting is on. Each is labelled —
 * "Visa: Golden Visa" — because a bare "30 days" beside a phone number means
 * nothing to a reader skimming the top line.
 */
export function keyFacts(resume: Resume): KeyFact[] {
  if (!resume.settings.showKeyFacts) return [];
  const p = resume.personal;
  const out: KeyFact[] = [];
  for (const key of KEY_FACT_FIELDS) {
    const value = p[key].trim();
    if (!value) continue;
    let text = value;
    if (key === 'nationality') {
      text = isUaeNational(value) ? 'UAE National' : `${value} national`;
      if (/national$/i.test(value)) text = value;
    } else if (key === 'visaStatus') {
      text = /visa|national|permit|residen/i.test(value) ? value : `Visa: ${value}`;
      // "UAE National — no visa required" already says it in the nationality fact.
      if (isUaeNational(p.nationality) && /no visa required/i.test(value)) continue;
    } else if (key === 'availability') {
      text = /notice|immediate|available|join/i.test(value) ? value : `Available: ${value}`;
    } else if (key === 'drivingLicence') {
      text = /licen[cs]e/i.test(value) ? value : `Licence: ${value}`;
    }
    out.push({ key, icon: FACT_ICON[key] ?? 'flag', text });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* whole-document text                                                  */
/* ------------------------------------------------------------------ */

export function resumeText(resume: Resume): string {
  const parts: string[] = [
    ...Object.values(resume.basics).filter((v) => !v.startsWith('data:')),
    ...Object.values(resume.personal),
  ];
  resume.experience.forEach((e) =>
    parts.push(e.company, e.position, e.location, e.summary, ...e.highlights),
  );
  resume.education.forEach((e) =>
    parts.push(e.institution, e.degree, e.field, e.grade, ...e.highlights),
  );
  resume.skills.forEach((g) => parts.push(g.category, ...g.items));
  resume.projects.forEach((p) => parts.push(p.name, p.description, ...p.highlights));
  resume.certifications.forEach((c) => parts.push(c.name, c.issuer, c.credentialId));
  resume.awards.forEach((a) => parts.push(a.title, a.issuer, a.description));
  resume.languages.forEach((l) => parts.push(l.name, l.level));
  resume.volunteer.forEach((v) => parts.push(v.role, v.organization, v.description, ...v.highlights));
  parts.push(...resume.interests);
  resume.references.forEach((r) => parts.push(r.name, r.contact));
  resume.customSections.forEach((s) =>
    s.entries.forEach((e) => parts.push(s.title, e.title, e.subtitle, e.description, ...e.highlights)),
  );
  return parts.filter(Boolean).join('\n');
}

/* ------------------------------------------------------------------ */
/* sensitive data                                                      */
/* ------------------------------------------------------------------ */

export interface SensitiveFinding {
  kind: 'emirates-id' | 'passport' | 'religion' | 'salary' | 'photo-id';
  message: string;
  fix: string;
}

const EMIRATES_ID_RE = /\b784[-\s]?\d{4}[-\s]?\d{7}[-\s]?\d\b/;
const PASSPORT_RE = /\bpassport\s*(no\.?|number|#)\s*[:\-]?\s*[A-Z0-9]{6,9}\b/i;

export function sensitiveFindings(resume: Resume): SensitiveFinding[] {
  const text = resumeText(resume);
  const out: SensitiveFinding[] = [];
  if (EMIRATES_ID_RE.test(text)) {
    out.push({
      kind: 'emirates-id',
      message: 'The CV contains an Emirates ID number.',
      fix: 'Remove it. Employers collect ID documents after an offer, through HR — a CV is forwarded, uploaded and stored in places you will never see.',
    });
  }
  if (PASSPORT_RE.test(text)) {
    out.push({
      kind: 'passport',
      message: 'The CV contains a passport number.',
      fix: 'Remove it. It is never needed at application stage and is the single most useful detail for identity fraud.',
    });
  }
  if (/\breligion\s*[:\-]/i.test(text)) {
    out.push({
      kind: 'religion',
      message: 'The CV states a religion.',
      fix: 'Leave it off. It is not relevant to the role, and UAE labour law prohibits discrimination on religion — do not invite it.',
    });
  }
  if (/\b(expected|current|desired)\s+salary\b|\bsalary\s+expectations?\b/i.test(text)) {
    out.push({
      kind: 'salary',
      message: 'The CV mentions salary.',
      fix: 'Keep salary for the application form or the first call. On the CV it anchors the negotiation before they have seen your value.',
    });
  }
  return out;
}

/* ------------------------------------------------------------------ */
/* regulated professions                                               */
/* ------------------------------------------------------------------ */

export interface LicenceRule {
  id: string;
  /** Matched against the headline and job titles. */
  role: RegExp;
  /** Any of these in the CV counts as the licence being mentioned. */
  evidence: RegExp;
  label: string;
  fix: string;
}

export const LICENCE_RULES: LicenceRule[] = [
  {
    id: 'health',
    role: /\b(nurse|nursing|doctor|physician|surgeon|(cardi|radi|dermat|onc|psych|neur|path|gynae?c|ur|ophthalm|haemat|hemat|endocrin|gastroenter)ologist|pharmacist|dentist|dental|physiotherap\w*|radiograph\w*|midwife|paramedic|medical\s+lab\w*|optometrist|dietitian|clinician|gp\b|general\s+practitioner|anaesthet\w*|anesthet\w*)/i,
    evidence: /\b(dha|doh|haad|mohap|moh|prometric|dataflow|healthcare\s+licen[cs]e|professional\s+licen[cs]e|eligibility\s+letter|good\s+standing)\b/i,
    label: 'Healthcare licence',
    fix: 'State your licence and its status near the top: "DHA licensed — Registered Nurse (active)", or "DOH eligibility letter, Prometric passed". Healthcare employers filter on it first, and an unlicensed hire cannot start work.',
  },
  {
    id: 'teaching',
    role: /\b(teacher|lecturer|tutor|head\s+of\s+(department|year)|principal|educator|instructor|senco|early\s+years)\b/i,
    evidence: /\b(khda|adek|moe|spea|teaching\s+licen[cs]e|tls|qts|pgce|b\.?\s?ed|m\.?\s?ed|pgde|celta|delta)\b/i,
    label: 'Teaching licence or qualification',
    fix: 'Name your teaching qualification (PGCE, B.Ed, QTS) and the UAE Teaching Licence status. Teachers in UAE schools need one, and schools regulated by KHDA, ADEK or the MOE check it during hiring.',
  },
  {
    id: 'engineering',
    role: /\b(civil|structural|mechanical|electrical|mep|geotechnical|chemical|petroleum|process|project)\s+engineer/i,
    evidence: /\b(society\s+of\s+engineers|soe|pe\b|p\.eng|chartered|ceng|mice|mimeche|miet|registered\s+engineer|pmp)\b/i,
    label: 'Engineering registration',
    fix: 'Add your professional registration — UAE Society of Engineers membership, Chartered status (CEng) or PE. Consultancies and authorities look for it on anyone signing off drawings or permits.',
  },
  {
    id: 'real-estate',
    role: /\b((real\s+estate|property)\s+(agent|broker|consultant|advisor|specialist|negotiator)|(real\s+estate|property|off-plan)\s+sales\s+(agent|consultant|executive)|leasing\s+(consultant|agent|executive))\b/i,
    evidence: /\b(rera|brn|broker\s+card|dld|adrec|real\s+estate\s+regulatory)\b/i,
    label: 'RERA broker registration',
    fix: 'State your RERA broker card and BRN, or "RERA certified". Dubai agencies cannot list or sell under your name without it.',
  },
  {
    id: 'accounting',
    role: /\b(accountant|auditor|finance\s+manager|financial\s+controller|cfo|tax\s+(manager|consultant|advisor))\b/i,
    evidence: /\b(acca|cpa|ca\b|cma|cia|cfa|chartered\s+accountant|vat|corporate\s+tax|fta|ifrs)\b/i,
    label: 'Accounting qualification & UAE tax',
    fix: 'Name your qualification (ACCA, CPA, CA, CMA) and UAE-specific exposure — VAT returns, Corporate Tax registration, FTA filings. Since UAE Corporate Tax took effect in 2023, finance employers screen for it.',
  },
  {
    id: 'safety',
    role: /\b(hse|health\s+and\s+safety|safety\s+(officer|engineer|manager)|ehs)\b/i,
    evidence: /\b(nebosh|iosh|osha|oshad|iso\s*45001|dm\s+approved|civil\s+defen[cs]e)\b/i,
    label: 'Safety certification',
    fix: 'List NEBOSH, IOSH or OSHAD certification and any authority approvals (Dubai Municipality, OSHAD). Most site roles in the UAE require one as a condition of entry.',
  },
];

export function missingLicences(resume: Resume): LicenceRule[] {
  const roles = [resume.basics.headline, ...resume.experience.slice(0, 2).map((e) => e.position)].join(' ');
  const text = resumeText(resume);
  return LICENCE_RULES.filter((rule) => rule.role.test(roles) && !rule.evidence.test(text));
}

/* ------------------------------------------------------------------ */
/* the checklist                                                       */
/* ------------------------------------------------------------------ */

export type CheckStatus = 'ok' | 'missing' | 'risk' | 'tip';

export interface UaeCheck {
  id: string;
  label: string;
  status: CheckStatus;
  detail: string;
  /** How much the check counts in the UAE score, out of the checks' total. */
  weight: number;
}

export function uaeChecklist(resume: Resume): UaeCheck[] {
  const b = resume.basics;
  const p = resume.personal;
  const checks: UaeCheck[] = [];
  const national = isUaeNational(p.nationality);
  const inUae = isUaeLocation(b.location);

  checks.push(
    p.nationality.trim()
      ? {
          id: 'nationality',
          label: national ? 'UAE National status stated' : 'Nationality stated',
          status: 'ok',
          detail: national
            ? 'Emiratisation targets make this one of the strongest lines on the page — keep it in the header.'
            : 'Recruiters use it to judge visa processing and Emiratisation mix.',
          weight: 14,
        }
      : {
          id: 'nationality',
          label: 'Nationality missing',
          status: 'missing',
          detail: 'UAE recruiters expect it on the CV. Without it, many shortlists skip the CV rather than ask.',
          weight: 14,
        },
  );

  if (!national) {
    checks.push(
      p.visaStatus.trim()
        ? {
            id: 'visa',
            label: 'Visa status stated',
            status: 'ok',
            detail: 'Tells the employer whether they must sponsor you, and how fast you can start.',
            weight: 16,
          }
        : {
            id: 'visa',
            label: 'Visa status missing',
            status: 'missing',
            detail: 'Add it — "Employment visa (transferable)", "Golden Visa", "Visit visa". It is the first thing a UAE recruiter asks.',
            weight: 16,
          },
    );
  }

  checks.push(
    p.availability.trim()
      ? {
          id: 'availability',
          label: 'Notice period / availability stated',
          status: 'ok',
          detail: 'Hiring managers plan around it — immediate joiners are shortlisted faster.',
          weight: 12,
        }
      : {
          id: 'availability',
          label: 'Notice period missing',
          status: 'missing',
          detail: 'Add "30 days notice" or "Immediate joiner". UAE notice periods run 30–90 days by law, so employers ask every time.',
          weight: 12,
        },
  );

  if (!b.location.trim()) {
    checks.push({
      id: 'location',
      label: 'Location missing',
      status: 'missing',
      detail: 'Add your emirate — "Dubai, UAE". Recruiters filter candidates in-country first.',
      weight: 10,
    });
  } else if (inUae && !namesEmirate(b.location)) {
    checks.push({
      id: 'location',
      label: 'Location does not name the emirate',
      status: 'tip',
      detail: 'Write "Abu Dhabi, UAE" rather than "UAE". Commute and emirate matter — a Dubai employer reads Abu Dhabi differently from Sharjah.',
      weight: 10,
    });
  } else if (!inUae) {
    checks.push({
      id: 'location',
      label: 'Based outside the UAE',
      status: 'tip',
      detail: 'Say you are relocating and when: "Mumbai, India — relocating to Dubai, available from March". Overseas CVs without it are often screened out as needing sponsorship and a long start.',
      weight: 10,
    });
  } else {
    checks.push({
      id: 'location',
      label: 'In-country location',
      status: 'ok',
      detail: 'Being in the UAE is a real advantage — it means no flights, a quick interview and a fast start.',
      weight: 10,
    });
  }

  if (!b.phone.trim()) {
    checks.push({
      id: 'phone',
      label: 'No phone number',
      status: 'missing',
      detail: 'UAE recruiters call — often on WhatsApp — before they email. Add a +971 number.',
      weight: 10,
    });
  } else if (isUaePhone(b.phone)) {
    checks.push({
      id: 'phone',
      label: 'UAE phone number',
      status: 'ok',
      detail: 'A local +971 number gets called; foreign numbers often do not.',
      weight: 10,
    });
  } else {
    checks.push({
      id: 'phone',
      label: 'Phone is not a UAE number',
      status: inUae ? 'missing' : 'tip',
      detail: inUae
        ? 'Use your UAE mobile in +971 5X XXX XXXX format — recruiters rarely dial abroad.'
        : 'If you can get a UAE or WhatsApp-reachable number, add it; otherwise keep full international format.',
      weight: 10,
    });
  }

  const hasArabic = resume.languages.some((l) => /arabic|عرب/i.test(l.name));
  checks.push(
    !resume.languages.length || resume.settings.hiddenSections.includes('languages')
      ? {
          id: 'languages',
          label: 'No languages listed',
          status: 'missing',
          detail: 'The UAE workforce speaks 200 nationalities. List English and every other language with a level — Arabic, Hindi, Urdu, Tagalog and Russian all win client-facing roles.',
          weight: 10,
        }
      : {
          id: 'languages',
          label: hasArabic ? 'Languages listed, including Arabic' : 'Languages listed',
          status: 'ok',
          detail: hasArabic
            ? 'Arabic is a genuine differentiator for government, banking and client roles.'
            : 'Even basic Arabic is worth listing if you have it.',
          weight: 10,
        },
  );

  const photoShown = resume.settings.showPhoto && !!b.photo;
  checks.push(
    photoShown
      ? {
          id: 'photo',
          label: 'Professional photo included',
          status: 'ok',
          detail: 'Common and expected in the Gulf. Keep a plain background and business attire. For portal uploads (Bayt, LinkedIn), an ATS-safe template without it parses more reliably.',
          weight: 6,
        }
      : {
          id: 'photo',
          label: 'No photo',
          status: 'tip',
          detail: 'A professional head-and-shoulders photo is the norm in the UAE, and near-mandatory in hospitality, aviation, retail and sales. Skip it only for pure portal uploads.',
          weight: 6,
        },
  );

  sensitiveFindings(resume).forEach((f) =>
    checks.push({
      id: `sensitive-${f.kind}`,
      label: f.message,
      status: 'risk',
      detail: f.fix,
      weight: f.kind === 'salary' ? 4 : 12,
    }),
  );

  missingLicences(resume).forEach((rule) =>
    checks.push({
      id: `licence-${rule.id}`,
      label: `${rule.label} not mentioned`,
      status: 'missing',
      detail: rule.fix,
      weight: 12,
    }),
  );

  if (national) {
    checks.push({
      id: 'emiratisation',
      label: 'Emiratisation advantage',
      status: 'tip',
      detail: 'Private-sector firms have Emiratisation targets. Put "UAE National" in the header, register on the Nafis platform, and name any national programmes you completed.',
      weight: 0,
    });
  }

  const attested = /\battest(ed|ation)\b|\bequivalen(cy|ce)\b/i.test(resumeText(resume));
  if (resume.education.length && !attested) {
    checks.push({
      id: 'attestation',
      label: 'Degree attestation not mentioned',
      status: 'tip',
      detail: 'Government, education and many regulated roles need an attested degree (and MOE equivalency for some). If yours is attested, add "(attested)" to the degree — it removes a hiring delay.',
      weight: 0,
    });
  }

  return checks;
}

/** 0–100 from the checklist, weighting each check by how often it decides a shortlist. */
export function uaeScore(checks: UaeCheck[]): number {
  let total = 0;
  let earned = 0;
  for (const c of checks) {
    if (!c.weight) continue;
    total += c.weight;
    if (c.status === 'ok') earned += c.weight;
    else if (c.status === 'tip') earned += c.weight * 0.6;
    else if (c.status === 'risk') earned -= c.weight * 0.5;
  }
  if (!total) return 100;
  return Math.max(0, Math.min(100, Math.round((earned / total) * 100)));
}
