import { z } from 'zod';

/**
 * The internal, admin-managed knowledge base: curated, forum-sourced info
 * about what's actually worth doing in each destination — attractions,
 * restaurants, nightlife, nature, markets, day trips, viewpoints, family
 * activities, wellness, adventure, hidden gems and seasonal events — each
 * backed by real source citations so we know *why* something is
 * recommended, not just that it is. This is what lets the app rank options
 * with real signal instead of relying on a single API's opinion.
 */

export const PlaceCategoryKey = z.enum([
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
]);
export type PlaceCategoryKey = z.infer<typeof PlaceCategoryKey>;

export const CATEGORY_LABELS: Record<PlaceCategoryKey, string> = {
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

export const SourceSchema = z.object({
  title: z.string(),
  url: z.string().optional(),
  platform: z.enum(['reddit', 'tripadvisor', 'blog', 'other']).default('other'),
});
export type Source = z.infer<typeof SourceSchema>;

export const KnowledgeItemSchema = z.object({
  id: z.string(),
  name: z.string(),
  nameHe: z.string().optional(),
  area: z.string().default(''),
  descriptionHe: z.string().default(''),
  priceEstimateUsd: z.number().nullable().default(null),
  priceLevel: z.number().int().min(0).max(4).default(2),
  popularityScore: z.number().min(0).max(5).default(3),
  reviewSignal: z.string().default(''),
  mustDo: z.boolean().default(false),
  kidFriendly: z.boolean().default(false),
  bestFor: z.array(z.string()).default([]),
  tags: z.array(z.string()).default([]),
  imageQuery: z.string().default(''),
  sources: z.array(SourceSchema).default([]),
});
export type KnowledgeItem = z.infer<typeof KnowledgeItemSchema>;

export const PracticalTipSchema = z.object({
  title: z.string(),
  descriptionHe: z.string(),
  sources: z.array(SourceSchema).default([]),
});
export type PracticalTip = z.infer<typeof PracticalTipSchema>;

export const DestinationKnowledgeSchema = z.object({
  destination: z.string(),
  country: z.string().default(''),
  flag: z.string().default(''),
  researchedAt: z.string().default(() => new Date().toISOString()),
  summaryHe: z.string().default(''),
  weatherHe: z.string().default(''),
  generalTipsHe: z.array(z.string()).default([]),
  categories: z.record(PlaceCategoryKey, z.array(KnowledgeItemSchema)).default({}),
  practicalTips: z.array(PracticalTipSchema).default([]),
});
export type DestinationKnowledge = z.infer<typeof DestinationKnowledgeSchema>;
