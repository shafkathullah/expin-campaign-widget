import { Badge } from '@/components/ui/badge';
import { useT } from '@/i18n/I18nProvider';
import type { PostStatus } from '@/lib/types';

const VARIANT_CLASS: Record<PostStatus, string> = {
  pending: 'bg-amber-100 text-amber-900 border-amber-200 dark:bg-amber-950 dark:text-amber-100 dark:border-amber-900',
  live: 'bg-emerald-100 text-emerald-900 border-emerald-200 dark:bg-emerald-950 dark:text-emerald-100 dark:border-emerald-900',
  completed: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-800 dark:text-slate-200 dark:border-slate-700',
};

export function StatusBadge({ status }: { status: PostStatus }) {
  const t = useT();
  return (
    <Badge variant="outline" className={VARIANT_CLASS[status]}>
      {t(`status.${status}` as const)}
    </Badge>
  );
}
