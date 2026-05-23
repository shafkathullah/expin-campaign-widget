import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { boostCreator } from '@/api/creators';
import { ApiError } from '@/api/client';
import { creatorsKey } from './useCreators';
import { useT } from '@/i18n/I18nProvider';
import type { CreatorsResponse } from '@/lib/types';

type Context = { prev?: CreatorsResponse };

/**
 * Optimistic boost mutation. Pattern:
 *
 * - onMutate snapshots the cache and flips `boosted = true` immediately.
 * - onError restores the snapshot and toasts the failure.
 * - 409 ("already boosted") is treated as effective-success — we keep the
 *   optimistic flag and don't toast an error. This covers the race where the
 *   user re-clicks Boost on a row that *just* succeeded server-side but whose
 *   refetched cache hasn't landed yet.
 * - We deliberately do NOT invalidate the creators query on success. The
 *   optimistic write is the source of truth; the next refetch (reconnect, etc.)
 *   will reconcile from the server.
 */
export function useBoostCreator(campaignId: string) {
  const queryClient = useQueryClient();
  const t = useT();
  const key = creatorsKey(campaignId);

  return useMutation<unknown, Error, string, Context>({
    mutationFn: (creatorId) => boostCreator(creatorId),

    onMutate: async (creatorId) => {
      await queryClient.cancelQueries({ queryKey: key });
      const prev = queryClient.getQueryData<CreatorsResponse>(key);

      queryClient.setQueryData<CreatorsResponse>(key, (current) => {
        if (!current) return current;
        return {
          ...current,
          creators: current.creators.map((c) =>
            c.id === creatorId ? { ...c, boosted: true } : c,
          ),
        };
      });

      return { prev };
    },

    onError: (err, _creatorId, ctx) => {
      // 409 from the server means the creator was already boosted. Treat as success-equivalent.
      if (err instanceof ApiError && err.status === 409) {
        toast.success(t('boost.success'));
        return;
      }
      if (ctx?.prev) {
        queryClient.setQueryData(key, ctx.prev);
      }
      toast.error(t('boost.error'));
    },

    onSuccess: () => {
      toast.success(t('boost.success'));
    },
  });
}
