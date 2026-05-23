export type PostStatus = 'pending' | 'live' | 'completed';

export const POST_STATUSES: readonly PostStatus[] = ['pending', 'live', 'completed'];

export type Creator = {
  id: string;
  name: string;
  handle: string;
  postStatus: PostStatus;
  views: number;
  conversions: number;
  conversionRate: number;
  boosted: boolean;
};

export type CreatorsResponse = {
  campaignId: string;
  creators: Creator[];
};

export type StreamEvent = {
  creatorId: string;
  views: number;
  conversions: number;
  conversionRate: number;
};

export type SortKey = 'name' | 'postStatus' | 'views' | 'conversions' | 'conversionRate';
export type SortDir = 'asc' | 'desc';

export type Filters = {
  status: readonly PostStatus[] | null; // null = default (all). [] = explicitly none.
  minRate: number;                       // 0 — 1
  search: string;
  sort: SortKey;
  dir: SortDir;
};

export const DEFAULT_FILTERS: Filters = {
  status: null,
  minRate: 0,
  search: '',
  sort: 'conversionRate',
  dir: 'desc',
};
