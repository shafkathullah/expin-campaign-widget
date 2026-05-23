import { useEffect, useMemo, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { CreatorTable } from './CreatorTable';
import { FilterBar } from './FilterBar';
import { EmptyState } from './EmptyState';
import { ErrorState } from './ErrorState';
import { TableSkeleton } from './TableSkeleton';
import { StreamIndicator } from './StreamIndicator';
import { useCreators, creatorsKey } from '@/hooks/useCreators';
import { useCreatorStream } from '@/hooks/useCreatorStream';
import { useFilters } from '@/hooks/useFilters';
import { useI18n } from '@/i18n/I18nProvider';
import { applyFilters } from '@/lib/filter';
import { applySort } from '@/lib/sort';
import { applyFrozenOrder } from '@/lib/freezeOrder';
import { formatInt } from '@/lib/format';

type Props = {
  campaignId: string;
};

export function CampaignWidget({ campaignId }: Props) {
  const { t, locale } = useI18n();
  const queryClient = useQueryClient();
  const { filters, setStatus, setMinRate, setSearch, setSort, reset } = useFilters();
  const query = useCreators(campaignId);
  const { connected, subscribeFlash } = useCreatorStream(campaignId);

  const allCreators = query.data?.creators ?? [];

  // Filter + sort derive cheaply from the current cache snapshot. We re-run
  // on every render — for 50 rows this is microseconds, and useMemo would
  // mostly cache misses (the array reference changes on SSE patches anyway).
  const filtered = applyFilters(allCreators, filters);
  const visible = useMemo(
    () => applySort(filtered, filters.sort, filters.dir),
    [filtered, filters.sort, filters.dir],
  );

  // ---- Freeze row order while the pointer is over the table --------------
  // Live re-sort is honest but lets a row slide out from under the cursor
  // mid-click. While the pointer is over the table we hold the row *sequence*
  // (cell values still update live via applyFrozenOrder); on pointer-leave the
  // order snaps back to the true sort.
  const [hovering, setHovering] = useState(false);
  const [frozenOrder, setFrozenOrder] = useState<string[] | null>(null);

  // Capture (and refresh) the held sequence. We recapture on hover start and
  // on an explicit sort change — so a header click the user makes while
  // hovering is honored — but deliberately NOT on `visible` changing, so SSE
  // patches don't move rows under the cursor. `visible` is intentionally
  // omitted from the deps for exactly that reason.
  useEffect(() => {
    setFrozenOrder(hovering ? visible.map((c) => c.id) : null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hovering, filters.sort, filters.dir]);

  const displayed = useMemo(
    () => (frozenOrder ? applyFrozenOrder(visible, frozenOrder) : visible),
    [visible, frozenOrder],
  );

  // ---- Render branches ---------------------------------------------------

  if (query.isLoading) {
    return (
      <div className="space-y-4">
        <div className="rounded-lg border bg-card p-4">
          <div className="h-16 animate-pulse rounded bg-muted/50" />
        </div>
        <TableSkeleton />
      </div>
    );
  }

  if (query.isError) {
    return (
      <ErrorState
        title={t('error.load.title')}
        body={t('error.load.body')}
        retryLabel={t('error.retry')}
        onRetry={() => queryClient.invalidateQueries({ queryKey: creatorsKey(campaignId) })}
      />
    );
  }

  if (allCreators.length === 0) {
    return (
      <EmptyState
        variant="no-creators"
        title={t('empty.noCreators.title')}
        body={t('empty.noCreators.body')}
      />
    );
  }

  return (
    <div className="space-y-4">
      <FilterBar
        filters={filters}
        onStatusChange={setStatus}
        onMinRateChange={setMinRate}
        onSearchChange={setSearch}
        onReset={reset}
      />

      <div className="flex items-center justify-between text-xs text-muted-foreground">
        <span>
          {t('table.resultCount', {
            visible: formatInt(visible.length, locale),
            total: formatInt(allCreators.length, locale),
          })}
        </span>
        <StreamIndicator connected={connected} />
      </div>

      {visible.length === 0 ? (
        <EmptyState
          variant="no-results"
          title={t('empty.noResults.title')}
          body={t('empty.noResults.body')}
          action={{ label: t('filters.reset'), onClick: reset }}
        />
      ) : (
        <CreatorTable
          campaignId={campaignId}
          creators={displayed}
          sort={filters.sort}
          dir={filters.dir}
          onSort={setSort}
          subscribeFlash={subscribeFlash}
          onPointerEnter={() => setHovering(true)}
          onPointerLeave={() => setHovering(false)}
        />
      )}
    </div>
  );
}
