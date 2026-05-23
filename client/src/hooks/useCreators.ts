import { useQuery, type UseQueryResult } from '@tanstack/react-query';
import { getCreators } from '@/api/creators';
import type { CreatorsResponse } from '@/lib/types';

export const creatorsKey = (campaignId: string) => ['creators', campaignId] as const;

export function useCreators(campaignId: string): UseQueryResult<CreatorsResponse> {
  return useQuery({
    queryKey: creatorsKey(campaignId),
    queryFn: () => getCreators(campaignId),
  });
}
