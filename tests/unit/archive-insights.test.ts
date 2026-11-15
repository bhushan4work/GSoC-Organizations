import { describe, expect, it } from 'vitest';
import organizationsData from '../../src/data/organizations.json';
import { buildArchiveInsights } from '../../src/lib/archive-insights';
import type { Organization } from '../../src/types';

const template = organizationsData[0] as Organization;
const organization = (
  slug: string,
  counts: [number, number][],
): Organization => ({
  ...template,
  slug,
  years: counts.map(([year]) => year),
  participations: counts.map(([year, projectCount]) => ({
    year,
    projectCount,
    // Totals may exist even where the archive has no project detail records.
    projects: [],
  })),
});

describe('archive insights', () => {
  it('distinguishes first appearances from returning organizations across gaps', () => {
    const insights = buildArchiveInsights([
      organization('returning-after-gap', [
        [2024, 3],
        [2026, 7],
      ]),
      organization('first-seen-2025', [
        [2025, 2],
        [2026, 4],
      ]),
      organization('first-seen-2026', [[2026, 0]]),
    ]);

    expect(insights.organizationCount).toBe(3);
    expect(insights.repeatOrganizationCount).toBe(2);
    expect(insights.projectCount).toBe(16);
    expect(insights.years).toEqual([
      {
        year: 2026,
        organizationCount: 3,
        projectCount: 11,
        firstSeenCount: 1,
        returningCount: 2,
      },
      {
        year: 2025,
        organizationCount: 1,
        projectCount: 2,
        firstSeenCount: 1,
        returningCount: 0,
      },
      {
        year: 2024,
        organizationCount: 1,
        projectCount: 3,
        firstSeenCount: null,
        returningCount: null,
      },
    ]);
  });

  it('reconciles the published annual totals with the full dataset', () => {
    const organizations = organizationsData as Organization[];
    const insights = buildArchiveInsights(organizations);
    expect(insights.projectCount).toBe(
      organizations.reduce((sum, item) => sum + item.totalProjects, 0),
    );
    for (const year of insights.years) {
      if (year.firstSeenCount === null) {
        expect(year.year).toBe(insights.oldestYear);
      } else {
        expect(year.firstSeenCount + (year.returningCount ?? 0)).toBe(
          year.organizationCount,
        );
      }
    }
    expect(
      insights.years.reduce(
        (sum, year) => sum + (year.firstSeenCount ?? year.organizationCount),
        0,
      ),
    ).toBe(organizations.length);
    expect(
      insights.technologies.every(
        (hub) => hub.organizationCount <= organizations.length,
      ),
    ).toBe(true);
  });
});
