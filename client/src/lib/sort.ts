import type { Creator, SortDir, SortKey } from './types';

// Status sort order matches workflow progression: pending → live → completed.
const STATUS_RANK: Record<Creator['postStatus'], number> = {
  pending: 0,
  live: 1,
  completed: 2,
};

export function applySort(
  creators: readonly Creator[],
  sort: SortKey,
  dir: SortDir,
): Creator[] {
  const mult = dir === 'asc' ? 1 : -1;
  const copy = [...creators];

  copy.sort((a, b) => {
    let cmp: number;
    switch (sort) {
      case 'name':
        cmp = a.name.localeCompare(b.name);
        break;
      case 'postStatus':
        cmp = STATUS_RANK[a.postStatus] - STATUS_RANK[b.postStatus];
        break;
      case 'views':
        cmp = a.views - b.views;
        break;
      case 'conversions':
        cmp = a.conversions - b.conversions;
        break;
      case 'conversionRate':
        cmp = a.conversionRate - b.conversionRate;
        break;
    }
    // Stable tie-break by id so two creators with identical metrics don't swap order on SSE patches.
    return cmp * mult || a.id.localeCompare(b.id);
  });

  return copy;
}
