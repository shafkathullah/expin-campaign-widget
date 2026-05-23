import { memo, useEffect, useState } from 'react';
import { BoostButton } from './BoostButton';
import { StatusBadge } from './StatusBadge';
import { useI18n } from '@/i18n/I18nProvider';
import { formatInt, formatPercent } from '@/lib/format';
import type { Creator } from '@/lib/types';

type Props = {
  campaignId: string;
  creator: Creator;
  subscribeFlash: (fn: (id: string) => void) => () => void;
};

function CreatorRowImpl({ campaignId, creator, subscribeFlash }: Props) {
  const { locale } = useI18n();
  const [flash, setFlash] = useState(false);

  useEffect(() => {
    const unsubscribe = subscribeFlash((id) => {
      if (id !== creator.id) return;
      setFlash(true);
      // Reset after the CSS transition completes.
      const timer = window.setTimeout(() => setFlash(false), 700);
      return () => window.clearTimeout(timer);
    });
    return () => {
      unsubscribe();
    };
  }, [creator.id, subscribeFlash]);

  return (
    <tr
      className={
        'border-b transition-colors duration-700 ' +
        (flash ? 'bg-emerald-50 dark:bg-emerald-950/30' : 'bg-transparent')
      }
    >
      <td className="px-3 py-2.5">
        {/* Handle is forced LTR so `@username` doesn't render as `username@`
            in RTL contexts (the @ glyph is weak-direction and inherits the
            surrounding paragraph direction otherwise). */}
        <div className="font-medium text-foreground" dir="ltr">{creator.name}</div>
        <div className="text-xs text-muted-foreground" dir="ltr">{creator.handle}</div>
      </td>
      <td className="px-3 py-2.5">
        <StatusBadge status={creator.postStatus} />
      </td>
      <td className="px-3 py-2.5 text-end tabular-nums">{formatInt(creator.views, locale)}</td>
      <td className="px-3 py-2.5 text-end tabular-nums">
        {formatInt(creator.conversions, locale)}
      </td>
      <td className="px-3 py-2.5 text-end tabular-nums font-medium">
        {formatPercent(creator.conversionRate, locale)}
      </td>
      <td className="px-3 py-2.5 text-end">
        <BoostButton campaignId={campaignId} creatorId={creator.id} boosted={creator.boosted} />
      </td>
    </tr>
  );
}

// Memoize on the creator reference so unchanged rows skip render entirely.
// `subscribeFlash` is stable (set instance from useState), so it doesn't
// invalidate memo.
export const CreatorRow = memo(CreatorRowImpl);
