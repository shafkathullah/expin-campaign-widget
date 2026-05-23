import { useMemo } from 'react';
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
          creators={visible}
          sort={filters.sort}
          dir={filters.dir}
          onSort={setSort}
          subscribeFlash={subscribeFlash}
        />
      )}
    </div>
  );
}
