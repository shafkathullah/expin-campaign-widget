import type { Creator, Filters } from './types';

export function applyFilters(creators: readonly Creator[], filters: Filters): Creator[] {
  const { status, minRate, search } = filters;
  const needle = search.trim().toLowerCase();

  return creators.filter((c) => {
    if (status !== null && !status.includes(c.postStatus)) return false;
    if (c.conversionRate < minRate) return false;
    if (needle && !`${c.name} ${c.handle}`.toLowerCase().includes(needle)) return false;
    return true;
  });
}

export function isDefaultFilters(filters: Filters): boolean {
  return (
    filters.status === null &&
    filters.minRate === 0 &&
    filters.search === '' &&
    filters.sort === 'conversionRate' &&
    filters.dir === 'desc'
  );
}

export function countActiveFilters(filters: Filters): number {
  let n = 0;
  if (filters.status !== null) n++;
  if (filters.minRate > 0) n++;
  if (filters.search !== '') n++;
  return n;
}
