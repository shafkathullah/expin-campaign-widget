import type { Creator } from './types';

/**
 * Reorder `creators` to match a frozen sequence of ids, so live SSE updates
 * don't move a row out from under the user's cursor (a mis-click hazard — see
 * README "Live re-sort, not pinned order").
 *
 * Cell values stay live: each id is looked up in the *current* `creators`
 * array, so metrics keep updating in place — only the row sequence is held.
 *
 * - ids in `order` that are still present keep their frozen relative position;
 * - ids no longer present (filtered out / removed) are dropped;
 * - ids not in `order` (newly arrived / newly matching a filter) are appended
 *   in their incoming order, so the visible set always matches `creators`.
 */
export function applyFrozenOrder(creators: readonly Creator[], order: readonly string[]): Creator[] {
  const byId = new Map(creators.map((c) => [c.id, c]));
  const result: Creator[] = [];
  const seen = new Set<string>();

  for (const id of order) {
    const c = byId.get(id);
    if (c) {
      result.push(c);
      seen.add(id);
    }
  }
  for (const c of creators) {
    if (!seen.has(c.id)) result.push(c);
  }

  return result;
}
