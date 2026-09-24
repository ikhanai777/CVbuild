import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import {
  formatUaePhone,
  isUaeLocation,
  isUaeNational,
  keyFacts,
  missingLicences,
  namesEmirate,
  sensitiveFindings,
  uaeChecklist,
  uaeScore,
} from './uae';
import { sampleResumeUae } from '../data/sampleResumeUae';
import { sampleResume } from '../data/sampleResume';
import { emptyResume } from '../data/defaults';
import { scoreResume } from './analysis/score';
import { migrateResume, withBuiltInSections } from './export/json';
import { buildDocument } from './export/docx';
import { extractPersonalDetails, parseResumeText } from './import/parseResume';
import { personalRows, arabicSectionTitle } from '../templates/Sections';
import { TEMPLATES, getTemplate } from '../templates/registry';
import { applyTemplate } from '../templates/applyTemplate';

describe('UAE phone numbers', () => {
  it('normalises local, 00 and +971 mobile forms to one international format', () => {
    expect(formatUaePhone('0501234567')).toBe('+971 50 123 4567');
    expect(formatUaePhone('050 123 4567')).toBe('+971 50 123 4567');
    expect(formatUaePhone('00971 55 765 4321')).toBe('+971 55 765 4321');
    expect(formatUaePhone('+971-(0)56-111-2222')).toBe('+971 56 111 2222');
    expect(formatUaePhone('561112222')).toBe('+971 56 111 2222');
  });

  it('formats landlines with their one-digit area code', () => {
    expect(formatUaePhone('04 123 4567')).toBe('+971 4 123 4567');
    expect(formatUaePhone('+97121234567')).toBe('+971 2 123 4567');
  });

  it('leaves foreign and malformed numbers alone', () => {
    expect(formatUaePhone('+44 7700 900142')).toBeNull();
    expect(formatUaePhone('+91 98765 43210')).toBeNull();
    expect(formatUaePhone('0591234567')).toBeNull(); // 59 is not a UAE mobile prefix
    expect(formatUaePhone('')).toBeNull();
  });
});

describe('UAE places and nationality', () => {
  it('recognises emirates, cities and free zones', () => {
    expect(isUaeLocation('Dubai, UAE')).toBe(true);
    expect(isUaeLocation('Al Ain')).toBe(true);
    expect(isUaeLocation('JLT, Dubai')).toBe(true);
    expect(isUaeLocation('London, UK')).toBe(false);
    expect(namesEmirate('UAE')).toBe(false);
    expect(namesEmirate('Ras Al Khaimah, UAE')).toBe(true);
  });

  it('identifies UAE Nationals', () => {
    expect(isUaeNational('Emirati')).toBe(true);
    expect(isUaeNational('UAE National')).toBe(true);
    expect(isUaeNational('Indian')).toBe(false);
  });
});

describe('key facts', () => {
  it('labels each fact so it reads on its own in the header', () => {
    const r = sampleResumeUae();
    const facts = keyFacts(r).map((f) => f.text);
    expect(facts).toEqual([
      'Jordanian national',
      'Golden Visa (10-year residence)',
      '30 days notice',
      'UAE driving licence — light vehicle',
    ]);
  });

  it('says UAE National once, without a redundant visa line', () => {
    const r = sampleResumeUae();
    r.personal.nationality = 'Emirati';
    r.personal.visaStatus = 'UAE National — no visa required';
    expect(keyFacts(r).map((f) => f.text)).toEqual([
      'UAE National',
      '30 days notice',
      'UAE driving licence — light vehicle',
    ]);
  });

  it('is empty when switched off, and the personal section then carries them', () => {
    const r = sampleResumeUae();
    expect(personalRows(r)).toEqual([]);
    r.settings.showKeyFacts = false;
    expect(keyFacts(r)).toEqual([]);
    expect(personalRows(r).map((x) => x.label)).toEqual([
      'Nationality',
      'Visa status',
      'Availability',
      'Driving licence',
    ]);
  });
});

describe('UAE checklist', () => {
  it('passes the worked sample on every screening check', () => {
    const checks = uaeChecklist(sampleResumeUae());
    const failing = checks.filter((c) => c.status === 'missing' || c.status === 'risk');
    expect(failing).toEqual([]);
    expect(uaeScore(checks)).toBeGreaterThanOrEqual(90);
  });

  it('asks for visa, nationality and notice period when they are missing', () => {
    const ids = uaeChecklist(emptyResume())
      .filter((c) => c.status === 'missing')
      .map((c) => c.id);
    expect(ids).toEqual(expect.arrayContaining(['nationality', 'visa', 'availability', 'location', 'phone']));
  });

  it('does not ask a UAE National for a visa', () => {
    const r = sampleResumeUae();
    r.personal.nationality = 'Emirati';
    r.personal.visaStatus = '';
    const checks = uaeChecklist(r);
    expect(checks.find((c) => c.id === 'visa')).toBeUndefined();
    expect(checks.find((c) => c.id === 'emiratisation')).toBeDefined();
  });

  it('tells overseas candidates to state a relocation plan', () => {
    const check = uaeChecklist(sampleResume()).find((c) => c.id === 'location');
    expect(check?.status).toBe('tip');
    expect(check?.detail).toMatch(/relocating/i);
  });

  it('flags ID numbers, religion and salary as things to remove', () => {
    const r = sampleResumeUae();
    r.basics.summary += ' Emirates ID 784-1990-1234567-1.';
    r.personal.gender = 'Female';
    r.interests = ['Religion: Islam', 'Expected salary AED 40,000'];
    const kinds = sensitiveFindings(r).map((f) => f.kind);
    expect(kinds).toEqual(expect.arrayContaining(['emirates-id', 'religion', 'salary']));
    expect(uaeChecklist(r).filter((c) => c.status === 'risk').length).toBe(3);
  });

  it('asks a nurse for a DHA/DOH licence, and stops once it is mentioned', () => {
    const r = sampleResumeUae();
    r.basics.headline = 'Registered Nurse — ICU';
    expect(missingLicences(r).map((l) => l.id)).toEqual(['health']);
    r.certifications.push({ id: 'x', name: 'DHA Registered Nurse licence', issuer: '', date: '', credentialId: '', link: '' });
    expect(missingLicences(r)).toEqual([]);
  });
});

describe('scoring by market', () => {
  it('adds a UAE market category only for UAE CVs', () => {
    const uae = scoreResume(sampleResumeUae());
    expect(uae.categories.map((c) => c.id)).toContain('uae');

    const intl = sampleResumeUae();
    intl.settings.market = 'international';
    expect(scoreResume(intl).categories.map((c) => c.id)).not.toContain('uae');
  });

  it('does not penalise a photo in the UAE, where it is expected', () => {
    const r = sampleResumeUae();
    r.basics.photo = 'data:image/png;base64,AAAA';
    r.settings.showPhoto = true;
    expect(scoreResume(r).issues.some((i) => /includes a photo/.test(i.message))).toBe(false);
    r.settings.market = 'international';
    expect(scoreResume(r).issues.some((i) => /includes a photo/.test(i.message))).toBe(true);
  });

  it('scores the UAE sample as Excellent', () => {
    expect(scoreResume(sampleResumeUae()).total).toBeGreaterThanOrEqual(85);
  });
});

describe('migration', () => {
  it('gives documents saved before this release the personal section and fields', () => {
    const old = JSON.parse(JSON.stringify(sampleResume())) as Record<string, any>;
    delete old.personal;
    old.settings.sectionOrder = old.settings.sectionOrder.filter((id: string) => id !== 'personal');
    delete old.settings.market;
    const migrated = migrateResume(old);
    expect(migrated.personal.nationality).toBe('');
    expect(migrated.settings.market).toBe('uae');
    const order = migrated.settings.sectionOrder;
    expect(order.indexOf('personal')).toBe(order.indexOf('languages') + 1);
  });

  it('slots a missing section in without disturbing a custom order', () => {
    const custom = [
      'summary', 'skills', 'experience', 'languages', 'education', 'projects',
      'certifications', 'awards', 'publications', 'volunteer', 'interests', 'references',
    ] as const;
    expect(withBuiltInSections([...custom])).toEqual([
      'summary', 'skills', 'experience', 'languages', 'personal', 'education', 'projects',
      'certifications', 'awards', 'publications', 'volunteer', 'interests', 'references',
    ]);
  });
});

describe('import of Gulf CVs', () => {
  it('reads labelled personal details, including several on one line', () => {
    expect(
      extractPersonalDetails([
        'Nationality: Indian | Visa Status: Employment Visa',
        'Notice Period: 30 days',
        'Driving Licence: UAE',
        'D.O.B: 12/03/1992',
      ]),
    ).toEqual({
      nationality: 'Indian',
      visaStatus: 'Employment Visa',
      availability: '30 days',
      drivingLicence: 'UAE',
      dateOfBirth: '12/03/1992',
    });
  });

  it('parses a typical UAE CV with a Personal Details section and an Arabic name', () => {
    const text = [
      'Omar Khalid',
      'عمر خالد',
      'Senior Accountant',
      'omar.khalid@example.com | 050 765 4321 | Sharjah, UAE',
      '',
      'PROFESSIONAL SUMMARY',
      'Chartered accountant with 7 years in UAE audit and VAT compliance across retail and logistics groups.',
      '',
      'WORK EXPERIENCE',
      'Senior Accountant | Gulf Freight LLC | Jan 2020 – Present',
      '• Prepared quarterly VAT returns for 6 entities with zero FTA penalties.',
      '',
      'PERSONAL DETAILS',
      'Nationality: Egyptian',
      'Visa Status: Employment visa (transferable)',
      'Notice Period: Immediate',
      'Marital Status: Married',
    ].join('\n');
    const { resume, detectedSections } = parseResumeText(text);
    expect(resume.basics.fullName).toBe('Omar Khalid');
    expect(resume.basics.headline).toBe('Senior Accountant');
    expect(resume.personal).toMatchObject({
      nationality: 'Egyptian',
      visaStatus: 'Employment visa (transferable)',
      availability: 'Immediate',
      maritalStatus: 'Married',
      nameArabic: 'عمر خالد',
    });
    expect(detectedSections).toContain('PERSONAL DETAILS');
    expect(resume.customSections).toEqual([]);
  });
});

describe('templates and export', () => {
  it('registers the UAE & Gulf set with the personal block in every sidebar', () => {
    const gulf = TEMPLATES.filter((t) => t.category === 'UAE & Gulf');
    expect(gulf.length).toBeGreaterThanOrEqual(8);
    expect(gulf.filter((t) => t.atsSafe).map((t) => t.id)).toEqual(['dubai-executive', 'gulf-portal']);
    for (const t of TEMPLATES) {
      if (t.sidebarSections) expect(t.sidebarSections).toContain('personal');
    }
  });

  it('Diwan turns bilingual headings on and leads with personal details', () => {
    const settings = applyTemplate(sampleResumeUae().settings, 'diwan-formal');
    expect(settings.bilingualHeadings).toBe(true);
    expect(settings.sectionOrder.slice(0, 2)).toEqual(['summary', 'personal']);
    const r = { ...sampleResumeUae(), settings };
    expect(arabicSectionTitle(r, 'experience')).toBe('الخبرة العملية');
    expect(getTemplate('diwan-formal').header).toBe('centered');
  });

  it('builds a Word file with Arabic name, bilingual headings and key facts for every UAE template', async () => {
    for (const t of TEMPLATES.filter((x) => x.category === 'UAE & Gulf')) {
      const r = sampleResumeUae();
      r.settings = applyTemplate(r.settings, t.id);
      r.settings.bilingualHeadings = true;
      r.personal.dateOfBirth = '12 March 1992';
      const buffer = await Packer.toBuffer(buildDocument(r));
      expect(buffer.length).toBeGreaterThan(2000);
    }
  });
});
