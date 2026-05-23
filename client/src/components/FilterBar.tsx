import { useEffect, useState } from 'react';
import { Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Slider } from '@/components/ui/slider';
import { useI18n } from '@/i18n/I18nProvider';
import { isDefaultFilters } from '@/lib/filter';
import { formatPercent } from '@/lib/format';
import { POST_STATUSES, type Filters, type PostStatus } from '@/lib/types';

type Props = {
  filters: Filters;
  onStatusChange: (next: readonly PostStatus[] | null) => void;
  onMinRateChange: (next: number) => void;
  onSearchChange: (next: string) => void;
  onReset: () => void;
};

const MIN_RATE_CEILING = 0.25; // 25% — matches the seed's upper bound
const MIN_RATE_STEP = 0.005; // 0.5%
const SEARCH_DEBOUNCE_MS = 250;

export function FilterBar({
  filters,
  onStatusChange,
  onMinRateChange,
  onSearchChange,
  onReset,
}: Props) {
  const { t, locale } = useI18n();
  const [searchInput, setSearchInput] = useState(filters.search);

  // Debounce search input writes to the URL. Local state stays snappy; URL
  // updates after the user pauses typing.
  useEffect(() => {
    if (searchInput === filters.search) return;
    const id = window.setTimeout(() => onSearchChange(searchInput), SEARCH_DEBOUNCE_MS);
    return () => window.clearTimeout(id);
    // We deliberately don't depend on `onSearchChange` — the parent should
    // pass a stable callback. Adding it would re-debounce on every render.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchInput]);

  // Sync the input if the URL changes externally (Reset button, back/forward).
  useEffect(() => {
    setSearchInput(filters.search);
  }, [filters.search]);

  const selectedStatuses = filters.status ?? POST_STATUSES;

  const toggleStatus = (status: PostStatus) => {
    const current = filters.status ?? POST_STATUSES;
    const next = current.includes(status)
      ? current.filter((s) => s !== status)
      : [...current, status];

    // If user is back to all three, clear the filter (default state).
    if (next.length === POST_STATUSES.length) {
      onStatusChange(null);
      return;
    }
    onStatusChange(next);
  };

  return (
    <section
      className="rounded-lg border bg-card p-4"
      aria-label={t('filters.title')}
    >
      <div className="flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
        <div className="flex flex-1 flex-col gap-4 md:flex-row md:items-start md:gap-6">
          {/* Status chips */}
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {t('filters.status')}
            </label>
            <div className="flex flex-wrap gap-1.5">
              {POST_STATUSES.map((status) => {
                const active = selectedStatuses.includes(status);
                return (
                  <button
                    key={status}
                    type="button"
                    onClick={() => toggleStatus(status)}
                    aria-pressed={active}
                    className={
                      'rounded-full border px-3 py-1 text-xs font-medium transition-colors ' +
                      (active
                        ? 'border-primary bg-primary text-primary-foreground'
                        : 'border-input bg-background text-muted-foreground hover:border-muted-foreground hover:text-foreground')
                    }
                  >
                    {t(`status.${status}` as const)}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Min conversion rate slider */}
          <div className="flex min-w-[14rem] flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <label className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                {t('filters.minRate')}
              </label>
              <span className="text-xs tabular-nums text-foreground">
                {formatPercent(filters.minRate, locale)}
              </span>
            </div>
            <Slider
              value={[filters.minRate]}
              min={0}
              max={MIN_RATE_CEILING}
              step={MIN_RATE_STEP}
              onValueChange={(v) => onMinRateChange(v[0] ?? 0)}
              aria-label={t('filters.minRate')}
            />
          </div>

          {/* Search */}
          <div className="flex min-w-[16rem] flex-col gap-3">
            <label
              htmlFor="creator-search"
              className="text-xs font-medium uppercase tracking-wide text-muted-foreground"
            >
              {t('filters.search')}
            </label>
            <div className="relative">
              <Search
                className="pointer-events-none absolute top-1/2 h-4 w-4 -translate-y-1/2 start-3 text-muted-foreground"
                aria-hidden
              />
              <Input
                id="creator-search"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                placeholder={t('filters.searchPlaceholder')}
                className="ps-9 pe-9"
              />
              {searchInput && (
                <button
                  type="button"
                  onClick={() => setSearchInput('')}
                  className="absolute top-1/2 -translate-y-1/2 end-2 rounded-md p-1 text-muted-foreground hover:bg-muted hover:text-foreground"
                  aria-label={t('filters.search')}
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              )}
            </div>
          </div>
        </div>

        {!isDefaultFilters(filters) && (
          <div className="flex md:self-end">
            <Button variant="ghost" size="sm" onClick={onReset}>
              {t('filters.reset')}
            </Button>
          </div>
        )}
      </div>
    </section>
  );
}
