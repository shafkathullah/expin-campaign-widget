import { ArrowDown, ArrowUp, ArrowUpDown } from 'lucide-react';
import { CreatorRow } from './CreatorRow';
import { useT } from '@/i18n/I18nProvider';
import type { Creator, SortDir, SortKey } from '@/lib/types';

type Props = {
  campaignId: string;
  creators: Creator[];
  sort: SortKey;
  dir: SortDir;
  onSort: (key: SortKey, dir: SortDir) => void;
  subscribeFlash: (fn: (id: string) => void) => () => void;
};

type Column = { key: SortKey; labelKey: Parameters<ReturnType<typeof useT>>[0]; align: 'start' | 'end' };

const COLUMNS: readonly Column[] = [
  { key: 'name', labelKey: 'table.name', align: 'start' },
  { key: 'postStatus', labelKey: 'table.status', align: 'start' },
  { key: 'views', labelKey: 'table.views', align: 'end' },
  { key: 'conversions', labelKey: 'table.conversions', align: 'end' },
  { key: 'conversionRate', labelKey: 'table.conversionRate', align: 'end' },
];

export function CreatorTable({
  campaignId,
  creators,
  sort,
  dir,
  onSort,
  subscribeFlash,
}: Props) {
  const t = useT();

  const handleSort = (key: SortKey) => {
    if (key === sort) {
      onSort(key, dir === 'asc' ? 'desc' : 'asc');
    } else {
      // Numeric columns default to desc (highest first), name to asc.
      onSort(key, key === 'name' ? 'asc' : 'desc');
    }
  };

  return (
    <div className="overflow-x-auto rounded-lg border bg-card">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b bg-muted/30 text-xs uppercase tracking-wide text-muted-foreground">
            {COLUMNS.map((col) => (
              <th
                key={col.key}
                className={col.align === 'end' ? 'px-3 py-2.5 text-end' : 'px-3 py-2.5 text-start'}
              >
                <SortHeader
                  active={sort === col.key}
                  dir={dir}
                  align={col.align}
                  onClick={() => handleSort(col.key)}
                >
                  {t(col.labelKey)}
                </SortHeader>
              </th>
            ))}
            <th className="px-3 py-2.5 text-end">{t('table.action')}</th>
          </tr>
        </thead>
        <tbody>
          {creators.map((c) => (
            <CreatorRow
              key={c.id}
              campaignId={campaignId}
              creator={c}
              subscribeFlash={subscribeFlash}
            />
          ))}
        </tbody>
      </table>
    </div>
  );
}

type SortHeaderProps = {
  active: boolean;
  dir: SortDir;
  align: 'start' | 'end';
  onClick: () => void;
  children: React.ReactNode;
};

function SortHeader({ active, dir, align, onClick, children }: SortHeaderProps) {
  const Icon = active ? (dir === 'asc' ? ArrowUp : ArrowDown) : ArrowUpDown;
  return (
    <button
      type="button"
      onClick={onClick}
      className={
        'inline-flex items-center gap-1.5 font-semibold uppercase tracking-wide hover:text-foreground ' +
        (active ? 'text-foreground' : '') +
        (align === 'end' ? ' flex-row-reverse' : '')
      }
    >
      <span>{children}</span>
      <Icon className="h-3 w-3" aria-hidden />
    </button>
  );
}
