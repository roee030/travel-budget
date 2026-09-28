import { API_URL } from '../api';

/**
 * Client for the internal knowledge-base admin API (server/src/routes/admin.ts).
 * Unlike the trip-planning endpoints, this never falls back to bundled demo
 * data — the whole point of the admin page is to manage the *real* research
 * database, so when the backend isn't reachable we surface that plainly
 * instead of pretending to edit something that won't persist.
 */

export interface AdminSource {
  title: string;
  url?: string;
  platform: 'reddit' | 'tripadvisor' | 'blog' | 'other';
}

export interface AdminKnowledgeItem {
  id: string;
  name: string;
  nameHe?: string;
  area: string;
  descriptionHe: string;
  priceEstimateUsd: number | null;
  priceLevel: number;
  popularityScore: number;
  reviewSignal: string;
  mustDo: boolean;
  kidFriendly: boolean;
  bestFor: string[];
  tags: string[];
  imageQuery: string;
  sources: AdminSource[];
}

export type AdminCategoryKey =
  | 'attractions'
  | 'restaurants'
  | 'nightlife'
  | 'parks_nature'
  | 'shopping_markets'
  | 'day_trips'
  | 'viewpoints'
  | 'family_kids'
  | 'wellness'
  | 'adventure'
  | 'hidden_gems'
  | 'culture_events';

export const CATEGORY_ORDER: AdminCategoryKey[] = [
  'attractions',
  'restaurants',
  'nightlife',
  'parks_nature',
  'shopping_markets',
  'day_trips',
  'viewpoints',
  'family_kids',
  'wellness',
  'adventure',
  'hidden_gems',
  'culture_events',
];

export const CATEGORY_LABELS: Record<AdminCategoryKey, string> = {
  attractions: 'אטרקציות',
  restaurants: 'מסעדות',
  nightlife: 'חיי לילה',
  parks_nature: 'פארקים וטבע',
  shopping_markets: 'שווקים וקניות',
  day_trips: 'טיולי יום',
  viewpoints: 'נקודות תצפית',
  family_kids: 'משפחות וילדים',
  wellness: 'בריאות ורוגע',
  adventure: 'הרפתקאות',
  hidden_gems: 'פנינים נסתרות',
  culture_events: 'תרבות ואירועים',
};

export interface AdminDestinationSummary {
  destination: string;
  country: string;
  flag: string;
  researchedAt: string;
  summaryHe: string;
  itemCount: number;
}

export interface AdminDestinationFull {
  destination: string;
  country: string;
  flag: string;
  researchedAt: string;
  summaryHe: string;
  weatherHe: string;
  generalTipsHe: string[];
  categories: Partial<Record<AdminCategoryKey, AdminKnowledgeItem[]>>;
  practicalTips: { title: string; descriptionHe: string; sources: AdminSource[] }[];
}

async function req<T>(path: string, options?: RequestInit): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    headers: { 'Content-Type': 'application/json' },
    ...options,
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`${res.status}: ${text || res.statusText}`);
  }
  if (res.status === 204) return undefined as T;
  return (await res.json()) as T;
}

export const adminApi = {
  listDestinations: () => req<{ destinations: AdminDestinationSummary[] }>('/api/admin/destinations'),
  getDestination: (destination: string) => req<AdminDestinationFull>(`/api/admin/destinations/${encodeURIComponent(destination)}`),
  deleteDestination: (destination: string) => req<void>(`/api/admin/destinations/${encodeURIComponent(destination)}`, { method: 'DELETE' }),
  upsertItem: (destination: string, category: AdminCategoryKey, item: Partial<AdminKnowledgeItem>) =>
    req<AdminKnowledgeItem>(`/api/admin/destinations/${encodeURIComponent(destination)}/${category}/items/${encodeURIComponent(item.id ?? '')}`, {
      method: 'PUT',
      body: JSON.stringify(item),
    }),
  createItem: (destination: string, category: AdminCategoryKey, item: Partial<AdminKnowledgeItem>) =>
    req<AdminKnowledgeItem>(`/api/admin/destinations/${encodeURIComponent(destination)}/${category}/items`, {
      method: 'POST',
      body: JSON.stringify(item),
    }),
  deleteItem: (destination: string, category: AdminCategoryKey, id: string) =>
    req<void>(`/api/admin/destinations/${encodeURIComponent(destination)}/${category}/items/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
