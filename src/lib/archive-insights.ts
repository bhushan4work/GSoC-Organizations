import { buildTaxonomyHubs, buildYearHubs } from './hubs';
import type { Organization } from '../types';

// Use normalized identities so renamed organizations are not counted twice.
// First appearance is relative to this archive, not the full history of GSoC.
export function buildArchiveInsights(organizations: Organization[]) {
  const yearHubs = buildYearHubs(organizations);
  const oldestYear = yearHubs.at(-1)?.year;
  const firstYears = new Map(
    organizations.map((organization) => [
      organization.slug,
      Math.min(...organization.years),
    ]),
  );
  const years = yearHubs.map((hub) => {
    const firstSeen = hub.organizations.filter(
      (organization) => firstYears.get(organization.slug) === hub.year,
    ).length;
    return {
      year: hub.year,
      organizationCount: hub.organizationCount,
      projectCount: hub.projectCount,
      // The earliest snapshot has no earlier data for comparison.
      firstSeenCount: hub.year === oldestYear ? null : firstSeen,
      returningCount:
        hub.year === oldestYear ? null : hub.organizationCount - firstSeen,
    };
  });

  return {
    years,
    oldestYear,
    latestYear: years[0]?.year,
    organizationCount: organizations.length,
    projectCount: years.reduce((sum, year) => sum + year.projectCount, 0),
    repeatOrganizationCount: organizations.filter(
      (organization) => organization.years.length > 1,
    ).length,
    technologies: buildTaxonomyHubs(organizations, 'technology').slice(0, 8),
  };
}
