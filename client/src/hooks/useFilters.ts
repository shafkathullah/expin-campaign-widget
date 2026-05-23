import { useMemo } from 'react';
import {
  createParser,
  parseAsFloat,
  parseAsString,
  parseAsStringLiteral,
  useQueryState,
} from 'nuqs';
import { POST_STATUSES, type Filters, type PostStatus, type SortDir, type SortKey } from '@/lib/types';

const SORT_KEYS: readonly SortKey[] = [
  'name',
  'postStatus',
  'views',
  'conversions',
  'conversionRate',
];
const SORT_DIRS: readonly SortDir[] = ['asc', 'desc'];

// Status uses a custom parser because we need to distinguish three states:
//   - default ("show all") → param absent
//   - explicit none ("user unchecked everything") → ?status=none
//   - partial selection → ?status=live,completed
//
// We use a `none` literal sentinel instead of `?status=` (empty value) so the
// URL is self-documenting when shared — `?status=` looks like a typo. SPEC §2.
const NONE_SENTINEL = 'none';

const statusParser = createParser<readonly PostStatus[]>({
  parse(value) {
    if (value === NONE_SENTINEL) return [];
    const parts = value
      .split(',')
      .filter((s): s is PostStatus => (POST_STATUSES as readonly string[]).includes(s));
    return parts.length > 0 ? parts : null;
  },
  serialize(value) {
    if (value.length === 0) return NONE_SENTINEL;
    return value.join(',');
  },
});

const sortParser = parseAsStringLiteral(SORT_KEYS).withDefault('conversionRate');
const dirParser = parseAsStringLiteral(SORT_DIRS).withDefault('desc');
const minRateParser = parseAsFloat.withDefault(0);
const searchParser = parseAsString.withDefault('');

export function useFilters() {
  const [status, setStatusRaw] = useQueryState('status', statusParser);
  const [minRate, setMinRateRaw] = useQueryState('minRate', minRateParser);
  const [search, setSearchRaw] = useQueryState('q', searchParser);
  const [sort, setSortRaw] = useQueryState('sort', sortParser);
  const [dir, setDirRaw] = useQueryState('dir', dirParser);

  const filters: Filters = useMemo(
    () => ({ status, minRate, search, sort, dir }),
    [status, minRate, search, sort, dir],
  );

  const setStatus = (next: readonly PostStatus[] | null) => {
    void setStatusRaw(next === null ? null : [...next]);
  };

  const setMinRate = (next: number) => {
    void setMinRateRaw(next === 0 ? null : next);
  };

  const setSearch = (next: string) => {
    void setSearchRaw(next === '' ? null : next);
  };

  const setSort = (key: SortKey, nextDir: SortDir) => {
    void setSortRaw(key === 'conversionRate' ? null : key);
    void setDirRaw(nextDir === 'desc' ? null : nextDir);
  };

  const reset = () => {
    void setStatusRaw(null);
    void setMinRateRaw(null);
    void setSearchRaw(null);
    void setSortRaw(null);
    void setDirRaw(null);
  };

  return { filters, setStatus, setMinRate, setSearch, setSort, reset };
}
