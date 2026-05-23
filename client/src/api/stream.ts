import { STREAM_BASE } from './client';
import type { StreamEvent } from '@/lib/types';

export type StreamHandlers = {
  onMessage: (event: StreamEvent) => void;
  onOpen?: (isReconnect: boolean) => void;
  onError?: (err: Event) => void;
};

export type StreamHandle = {
  close: () => void;
};

export function openCreatorStream(campaignId: string, handlers: StreamHandlers): StreamHandle {
  const url = `${STREAM_BASE}/stream?campaignId=${encodeURIComponent(campaignId)}`;
  const es = new EventSource(url);

  let hasOpenedOnce = false;

  es.onopen = () => {
    const isReconnect = hasOpenedOnce;
    hasOpenedOnce = true;
    handlers.onOpen?.(isReconnect);
  };

  es.onmessage = (ev) => {
    try {
      const data = JSON.parse(ev.data) as StreamEvent;
      handlers.onMessage(data);
    } catch {
      // Keepalive comments arrive as separate "comment" frames the browser
      // never surfaces as `message` events, so any JSON parse failure here is
      // an unexpected payload — ignore it.
    }
  };

  es.onerror = (err) => {
    handlers.onError?.(err);
    // EventSource auto-reconnects on transient errors. Don't close on error.
  };

  return {
    close: () => es.close(),
  };
}
