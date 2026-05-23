import { useEffect, useRef, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { openCreatorStream, type StreamHandle } from '@/api/stream';
import { creatorsKey } from './useCreators';
import type { CreatorsResponse, StreamEvent } from '@/lib/types';

/**
 * Opens a single SSE connection and patches incoming metric updates into the
 * creators query cache. Components subscribed via `useCreators` re-render only
 * for rows that actually changed (TanStack Query diffs by reference).
 *
 * The patch updater MUST NOT touch `boosted` — that field is owned by the
 * boost mutation. Letting a stale SSE patch reset it would clobber the
 * optimistic flag mid-flight. See SPEC §2 race-condition #1 and #2.
 */
export function useCreatorStream(campaignId: string) {
  const queryClient = useQueryClient();
  const handleRef = useRef<StreamHandle | null>(null);
  const flashRef = useRef<(creatorId: string) => void>(() => {});
  const [connected, setConnected] = useState(false);

  // Expose a way for components to register a "flash highlight" subscriber
  // without re-creating the EventSource. The hook owns the connection lifecycle;
  // the row-flash effect is purely presentational.
  const [flashSubscribers] = useState(() => new Set<(creatorId: string) => void>());

  flashRef.current = (id) => {
    flashSubscribers.forEach((fn) => fn(id));
  };

  useEffect(() => {
    const handle = openCreatorStream(campaignId, {
      onMessage: (ev: StreamEvent) => {
        queryClient.setQueryData<CreatorsResponse>(creatorsKey(campaignId), (prev) => {
          if (!prev) return prev;
          let changed = false;
          const next = prev.creators.map((c) => {
            if (c.id !== ev.creatorId) return c;
            if (
              c.views === ev.views &&
              c.conversions === ev.conversions &&
              c.conversionRate === ev.conversionRate
            ) {
              return c;
            }
            changed = true;
            // Only touch metric fields. `boosted` / `postStatus` / identity untouched.
            return {
              ...c,
              views: ev.views,
              conversions: ev.conversions,
              conversionRate: ev.conversionRate,
            };
          });
          return changed ? { ...prev, creators: next } : prev;
        });
        flashRef.current(ev.creatorId);
      },
      onOpen: (isReconnect) => {
        setConnected(true);
        if (isReconnect) {
          // Events fired during the disconnect window are lost. Refetch to resync.
          queryClient.invalidateQueries({ queryKey: creatorsKey(campaignId) });
        }
      },
      onError: () => {
        setConnected(false);
      },
    });

    handleRef.current = handle;
    return () => {
      handle.close();
      handleRef.current = null;
    };
  }, [campaignId, queryClient]);

  const subscribeFlash = (fn: (creatorId: string) => void) => {
    flashSubscribers.add(fn);
    return () => flashSubscribers.delete(fn);
  };

  return { connected, subscribeFlash };
}
