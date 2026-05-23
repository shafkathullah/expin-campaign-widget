import { request } from './client';
import type { Creator, CreatorsResponse } from '@/lib/types';

export function getCreators(campaignId: string): Promise<CreatorsResponse> {
  return request<CreatorsResponse>(`/creators?campaignId=${encodeURIComponent(campaignId)}`);
}

export type BoostResponse = { ok: true; creator: Creator };

export function boostCreator(creatorId: string): Promise<BoostResponse> {
  return request<BoostResponse>(`/creators/${encodeURIComponent(creatorId)}/boost`, {
    method: 'POST',
  });
}
