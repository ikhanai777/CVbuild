import { describe, expect, it } from 'vitest';
import { estimatePages, scoreResume } from './score';
import { hasMetric, isPassive, startsWithActionVerb, weakOpener } from './language';
import { extractKeywords, matchKeywords } from './keywords';
import { sampleResume } from '../../data/sampleResume';
import { emptyResume } from '../../data/defaults';

describe('language rules', () => {
  it('detects metrics in the forms people actually write them', () => {
    expect(hasMetric('Cut failure rate by 34%')).toBe(true);
    expect(hasMetric('Recovered £12M in revenue')).toBe(true);
    expect(hasMetric('Led a team of 6')).toBe(true);
    expect(hasMetric('Improved the onboarding process')).toBe(false);
  });

  it('recognises action verbs and weak openers', () => {
    expect(startsWithActionVerb('Reduced latency by 40%')).toBe(true);
    expect(startsWithActionVerb('Responsible for the team')).toBe(false);
    expect(weakOpener('Responsible for managing the team')?.phrase).toBe('Responsible for');
    expect(weakOpener('Helped with the migration')?.phrase).toBe('Helped / assisted with');
    expect(weakOpener('Delivered the migration')).toBeNull();
  });

  it('recognises irregular past-tense verbs, not just regular ones', () => {
    for (const bullet of ['Rebuilt the pipeline', 'Grew revenue 3x', 'Wrote the spec', 'Ran the programme']) {
      expect(startsWithActionVerb(bullet)).toBe(true);
    }
  });

  it('flags passive voice only in the opening clause', () => {
    expect(isPassive('Was tasked with migrating the fleet')).toBe(true);
    // The passive half here describes what happened to other people, which is
    // correct usage and should not be flagged.
    expect(isPassive('Coached 3 associate PMs; two were promoted within 18 months')).toBe(false);
  });
});

describe('scoreResume', () => {
  it('rates a well-written CV highly', () => {
    const score = scoreResume(sampleResume());
    expect(score.total).toBeGreaterThanOrEqual(70);
    expect(score.stats.bulletCount).toBeGreaterThan(5);
    expect(score.stats.quantifiedBullets).toBeGreaterThan(4);
  });

  it('flags an empty CV as incomplete without throwing', () => {
    const score = scoreResume(emptyResume());
    expect(score.total).toBeLessThan(45);
    expect(score.grade).toBe('Incomplete');
    expect(score.issues.some((i) => i.severity === 'critical')).toBe(true);
  });

  it('penalises duty-listing bullets relative to quantified ones', () => {
    const base = sampleResume();
    const weak = structuredClone(base);
    weak.experience = weak.experience.map((job) => ({
      ...job,
      highlights: job.highlights.map(() => 'Responsible for various tasks across the team'),
    }));
    expect(scoreResume(weak).total).toBeLessThan(scoreResume(base).total);
  });

  it('describes a non-ATS-safe finding accurately for the actual layout', () => {
    // A regression: the message used to say "multi-column design" even for
    // single-column templates that are merely decorated (Monogram Modern,
    // Career Timeline, and now several Engineering templates).
    const singleColumnButDecorated = ['monogram-modern', 'terminal-console', 'systems-blueprint', 'git-changelog'];
    const trueMultiColumn = ['two-column-classic', 'tech-matrix', 'creative-band'];

    for (const id of singleColumnButDecorated) {
      const resume = sampleResume();
      resume.settings.templateId = id;
      const issue = scoreResume(resume).issues.find((i) => i.category === 'ATS');
      expect(issue?.message).not.toContain('multi-column');
    }
    for (const id of trueMultiColumn) {
      const resume = sampleResume();
      resume.settings.templateId = id;
      const issue = scoreResume(resume).issues.find((i) => i.category === 'ATS');
      expect(issue?.message).toContain('multi-column');
    }
  });

  it('locates the bullet each finding refers to', () => {
    const resume = sampleResume();
    resume.experience[0].highlights[0] = 'Responsible for the checkout platform';
    const issue = scoreResume(resume).issues.find((i) => i.message.includes('Weak opener'));
    expect(issue?.location).toContain('Northwind Payments');
  });

  it('every category stays within 0–100', () => {
    for (const resume of [sampleResume(), emptyResume()]) {
      for (const c of scoreResume(resume).categories) {
        expect(c.score).toBeGreaterThanOrEqual(0);
        expect(c.score).toBeLessThanOrEqual(100);
      }
    }
  });
});

describe('estimatePages', () => {
  it('returns at least one page and grows with content', () => {
    const one = sampleResume();
    expect(estimatePages(one)).toBeGreaterThanOrEqual(1);

    const long = structuredClone(one);
    long.experience = [...long.experience, ...long.experience, ...long.experience];
    expect(estimatePages(long)).toBeGreaterThan(estimatePages(one));
  });
});

describe('keyword matching', () => {
  const advert = `We are looking for a Senior Product Manager to own our payments roadmap.
    You will run experimentation, work with data engineering on the analytics pipeline,
    and drive pricing strategy across European markets. Experience with SQL and
    stakeholder management required. Payments experience is essential.`;

  it('extracts meaningful terms and drops boilerplate', () => {
    const terms = extractKeywords(advert).map((k) => k.term);
    expect(terms).toContain('payment');
    expect(terms).not.toContain('experience');
    expect(terms).not.toContain('the');
  });

  it('scores a matching CV higher than an unrelated one', () => {
    const matched = matchKeywords(sampleResume(), advert);
    const unrelated = matchKeywords(emptyResume(), advert);
    expect(matched.coverage).toBeGreaterThan(unrelated.coverage);
    expect(matched.hits.some((h) => h.present)).toBe(true);
  });

  it('returns an empty result when no advert is supplied', () => {
    expect(matchKeywords(sampleResume(), '')).toEqual({ hits: [], matched: 0, total: 0, coverage: 0 });
  });
});
