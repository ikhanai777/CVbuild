import { describe, expect, it } from 'vitest';
import { Packer } from 'docx';
import { buildDocument, suggestedFileName } from './docx';
import { migrateResume, exportJson, parseJsonResume } from './json';
import { sampleResume } from '../../data/sampleResume';
import { emptyResume } from '../../data/defaults';
import { TEMPLATES } from '../../templates/registry';

describe('docx export', () => {
  it('produces a real, non-trivial .docx for every template', async () => {
    for (const template of TEMPLATES) {
      const resume = sampleResume();
      resume.settings.templateId = template.id;
      const buffer = await Packer.toBuffer(buildDocument(resume));
      // A .docx is a zip: check the local file header magic and a real payload.
      expect(buffer.length).toBeGreaterThan(2000);
      expect(buffer[0]).toBe(0x50); // 'P'
      expect(buffer[1]).toBe(0x4b); // 'K'
    }
  });

  it('handles an empty CV without throwing', async () => {
    const buffer = await Packer.toBuffer(buildDocument(emptyResume()));
    expect(buffer.length).toBeGreaterThan(500);
  });

  it('names the file after the person and their target role', () => {
    expect(suggestedFileName(sampleResume(), 'pdf')).toBe('Amara-Osei-Senior-Product-Manager-CV.pdf');
  });
});

describe('json round-trip', () => {
  it('survives export and re-import unchanged', () => {
    const original = sampleResume();
    const restored = parseJsonResume(exportJson(original));
    expect(restored.basics).toEqual(original.basics);
    expect(restored.experience).toEqual(original.experience);
    expect(restored.settings.templateId).toBe(original.settings.templateId);
  });

  it('imports a JSON Resume document', () => {
    const jsonResume = {
      basics: {
        name: 'Rae Mensah',
        label: 'Data Analyst',
        email: 'rae@example.com',
        location: { city: 'Accra', countryCode: 'GH' },
        profiles: [{ network: 'LinkedIn', url: 'linkedin.com/in/rae' }],
        summary: 'Analyst with 5 years in retail forecasting.',
      },
      work: [
        {
          name: 'Kente Retail',
          position: 'Data Analyst',
          startDate: '2020-01',
          highlights: ['Cut stockouts by 22%.'],
        },
      ],
      skills: [{ name: 'Tools', keywords: ['SQL', 'dbt'] }],
    };
    const resume = migrateResume(jsonResume);
    expect(resume.basics.fullName).toBe('Rae Mensah');
    expect(resume.basics.location).toBe('Accra, GH');
    expect(resume.basics.linkedin).toBe('linkedin.com/in/rae');
    expect(resume.experience[0].company).toBe('Kente Retail');
    expect(resume.experience[0].current).toBe(true);
    expect(resume.skills[0].items).toEqual(['SQL', 'dbt']);
  });

  it('fills in defaults for a partial or corrupt document', () => {
    const resume = migrateResume({ basics: { fullName: 'Half Record' } });
    expect(resume.basics.fullName).toBe('Half Record');
    expect(Array.isArray(resume.experience)).toBe(true);
    expect(resume.settings.sectionOrder.length).toBeGreaterThan(0);
    expect(migrateResume(null).basics.fullName).toBe('');
    expect(migrateResume('nonsense').experience).toEqual([]);
  });
});
