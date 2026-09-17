import { describe, expect, it } from 'vitest';
import {
  detectSectionHeading,
  extractContacts,
  extractName,
  parseHeader,
  parseResumeText,
  splitEntries,
  splitList,
} from './parseResume';

const SAMPLE = `JORDAN REYES
Senior Software Engineer
jordan.reyes@example.com | +1 (415) 555-0142 | San Francisco, CA
linkedin.com/in/jordanreyes | github.com/jreyes

PROFESSIONAL SUMMARY
Backend engineer with 9 years building distributed systems for high-traffic marketplaces. Cut p99 latency by 62% on the core order service and led the migration of 140 services to Kubernetes.

WORK EXPERIENCE

Staff Software Engineer | Halcyon Logistics | San Francisco, CA
Mar 2021 - Present
• Reduced p99 checkout latency from 1.8s to 680ms by rewriting the order service in Go.
• Led migration of 140 services to Kubernetes, cutting infrastructure spend by $2.1M annually.
• Mentored 6 engineers; 3 were promoted within two years.

Senior Backend Engineer | Tessellate | Remote
Jun 2017 – Feb 2021
- Built the event pipeline processing 4B events per day at 99.99% delivery.
- Responsible for the on-call rotation across 3 teams.

EDUCATION
BSc Computer Science
University of California, Berkeley — Berkeley, CA
2011 - 2015
GPA 3.8/4.0

SKILLS
Languages: Go, Python, TypeScript, Rust
Infrastructure: Kubernetes, Terraform, AWS, Kafka

CERTIFICATIONS
Certified Kubernetes Administrator — Linux Foundation, 2022

LANGUAGES
English (Native), Spanish (Professional)
`;

describe('detectSectionHeading', () => {
  it('recognises common headings and their synonyms', () => {
    expect(detectSectionHeading('WORK EXPERIENCE')).toBe('experience');
    expect(detectSectionHeading('Employment History')).toBe('experience');
    expect(detectSectionHeading('Professional Summary')).toBe('summary');
    expect(detectSectionHeading('Technical Skills')).toBe('skills');
    expect(detectSectionHeading('Education & Qualifications')).toBe('education');
    expect(detectSectionHeading('Referees')).toBe('references');
  });

  it('does not treat body text, bullets or dated lines as headings', () => {
    expect(detectSectionHeading('• Reduced latency by 40% across the fleet.')).toBeNull();
    expect(detectSectionHeading('Mar 2021 - Present')).toBeNull();
    expect(
      detectSectionHeading('Backend engineer with 9 years building distributed systems.'),
    ).toBeNull();
  });

  it('treats an unknown short capitalised line as a custom heading', () => {
    expect(detectSectionHeading('SPEAKING ENGAGEMENTS')).toBe('custom');
  });
});

describe('extractContacts', () => {
  it('pulls out email, phone, links and location', () => {
    const c = extractContacts(SAMPLE);
    expect(c.email).toBe('jordan.reyes@example.com');
    expect(c.phone.replace(/\D/g, '')).toBe('14155550142');
    expect(c.linkedin).toContain('linkedin.com/in/jordanreyes');
    expect(c.github).toContain('github.com/jreyes');
    expect(c.location).toBe('San Francisco, CA');
  });

  it('does not mistake a date range for a phone number', () => {
    const c = extractContacts('Ada Lovelace\nAnalyst\n2019 - 2021\nada@example.com');
    expect(c.phone).toBe('');
  });

  it('does not read the local part of an email address as a website', () => {
    const c = extractContacts('River Okonkwo\nriver.okonkwo@example.com | Leeds, UK');
    expect(c.email).toBe('river.okonkwo@example.com');
    expect(c.website).toBe('');
  });

  it('still finds a genuine website alongside an email', () => {
    const c = extractContacts('Dev Patel\ndev@example.com · devpatel.io · github.com/devp');
    expect(c.website).toBe('devpatel.io');
    expect(c.github).toBe('github.com/devp');
  });
});

describe('extractName', () => {
  it('reads the name from the first plausible line', () => {
    expect(extractName(SAMPLE.split('\n'))).toBe('Jordan Reyes');
  });

  it('skips job titles and contact lines', () => {
    const lines = ['Senior Product Manager', 'amara@example.com', 'Amara Osei'];
    expect(extractName(lines)).toBe('Amara Osei');
  });
});

describe('splitEntries', () => {
  it('groups header lines with the bullets that follow them', () => {
    const entries = splitEntries([
      'Staff Engineer | Halcyon | SF',
      'Mar 2021 - Present',
      '• Did a thing.',
      '• Did another thing.',
      'Senior Engineer | Tessellate',
      'Jun 2017 – Feb 2021',
      '- Did an older thing.',
    ]);
    expect(entries).toHaveLength(2);
    expect(entries[0].bullets).toHaveLength(2);
    expect(entries[1].bullets).toEqual(['Did an older thing.']);
  });
});

describe('parseHeader', () => {
  it('separates title, company, location and dates', () => {
    const h = parseHeader(['Staff Software Engineer | Halcyon Logistics | San Francisco, CA', 'Mar 2021 - Present']);
    expect(h.primary).toBe('Staff Software Engineer');
    expect(h.secondary).toContain('Halcyon Logistics');
    expect(h.location).toBe('San Francisco, CA');
    expect(h.startDate).toBe('Mar 2021');
    expect(h.current).toBe(true);
    expect(h.endDate).toBe('');
  });

  it('normalises numeric and abbreviated dates', () => {
    const h = parseHeader(['Analyst', '03/2019 - 11/2021']);
    expect(h.startDate).toBe('Mar 2019');
    expect(h.endDate).toBe('Nov 2021');
  });
});

describe('splitList', () => {
  it('splits on commas, bullets and pipes', () => {
    expect(splitList('Go, Python · TypeScript | Rust')).toEqual(['Go', 'Python', 'TypeScript', 'Rust']);
  });
});

describe('parseResumeText', () => {
  const { resume, detectedSections } = parseResumeText(SAMPLE);

  it('fills in the basics', () => {
    expect(resume.basics.fullName).toBe('Jordan Reyes');
    expect(resume.basics.headline).toBe('Senior Software Engineer');
    expect(resume.basics.email).toBe('jordan.reyes@example.com');
    expect(resume.basics.summary).toContain('Backend engineer with 9 years');
  });

  it('reads both roles with their dates and bullets', () => {
    expect(resume.experience).toHaveLength(2);
    const [first, second] = resume.experience;
    expect(first.position).toBe('Staff Software Engineer');
    expect(first.company).toContain('Halcyon Logistics');
    expect(first.startDate).toBe('Mar 2021');
    expect(first.current).toBe(true);
    expect(first.highlights).toHaveLength(3);
    expect(second.endDate).toBe('Feb 2021');
    expect(second.highlights).toHaveLength(2);
  });

  it('reads education, skills, certifications and languages', () => {
    expect(resume.education).toHaveLength(1);
    expect(resume.education[0].institution).toContain('Berkeley');
    expect(resume.education[0].grade).toContain('3.8');

    expect(resume.skills.map((s) => s.category)).toEqual(['Languages', 'Infrastructure']);
    expect(resume.skills[0].items).toContain('Go');

    expect(resume.certifications[0].name).toContain('Certified Kubernetes Administrator');
    expect(resume.languages.map((l) => l.name)).toContain('English');
  });

  it('reports the headings it found', () => {
    expect(detectedSections).toContain('WORK EXPERIENCE');
    expect(detectedSections).toContain('SKILLS');
  });

  it('never throws on junk input', () => {
    expect(() => parseResumeText('')).not.toThrow();
    expect(() => parseResumeText('....\n\n\n???')).not.toThrow();
  });
});
