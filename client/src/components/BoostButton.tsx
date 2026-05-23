import { Loader2, Sparkles, Check } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useBoostCreator } from '@/hooks/useBoostCreator';
import { useT } from '@/i18n/I18nProvider';

type Props = {
  campaignId: string;
  creatorId: string;
  boosted: boolean;
};

export function BoostButton({ campaignId, creatorId, boosted }: Props) {
  const mutation = useBoostCreator(campaignId);
  const t = useT();

  // The optimistic flip happens in `onMutate`, so `boosted` already reflects
  // the in-flight optimistic state. We track `isPending` only to show the
  // spinner — the button is "done" the moment the optimistic write lands.
  const pending = mutation.isPending && mutation.variables === creatorId;

  if (boosted) {
    return (
      <Button size="sm" variant="secondary" disabled className="gap-1.5">
        <Check className="h-3.5 w-3.5" aria-hidden />
        {t('boost.done')}
      </Button>
    );
  }

  return (
    <Button
      size="sm"
      onClick={() => mutation.mutate(creatorId)}
      disabled={pending}
      className="gap-1.5"
    >
      {pending ? (
        <>
          <Loader2 className="h-3.5 w-3.5 animate-spin" aria-hidden />
          {t('boost.pending')}
        </>
      ) : (
        <>
          <Sparkles className="h-3.5 w-3.5" aria-hidden />
          {t('boost.action')}
        </>
      )}
    </Button>
  );
}
