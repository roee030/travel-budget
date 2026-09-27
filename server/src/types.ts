import { z } from 'zod';

/**
 * The trip request is everything the user tells us up front. The web/mobile
 * wizard collects exactly these fields, and the whole planning pipeline is a
 * pure function of this object.
 */

export const PartyType = z.enum(['solo', 'couple', 'family', 'friends']);
export type PartyType = z.infer<typeof PartyType>;

export const TripVibe = z.enum([
  'relaxation', // "בטן גב" — resort, spa, beach, slow pace
  'attractions', // pack in sights, museums, tours
  'nightlife', // bars, clubs, live music
  'food', // culinary-led trip
  'nature', // hikes, parks, outdoors
  'culture', // history, art, local life
  'mixed', // a bit of everything
]);
export type TripVibe = z.infer<typeof TripVibe>;

export const TransportPreference = z.enum(['public', 'rental_car', 'mixed', 'walk']);
export type TransportPreference = z.infer<typeof TransportPreference>;

export const Traveler = z.object({
  /** age in years; used to tailor attractions and pacing */
  age: z.number().int().min(0).max(120),
});
export type Traveler = z.infer<typeof Traveler>;

export const TripRequestSchema = z
  .object({
    // ── Where ──────────────────────────────────────────
    origin: z.string().min(2).describe('Origin city or IATA code, e.g. "TLV"'),
    /** A concrete destination, or null when the user is open to suggestions. */
    destination: z.string().min(2).nullable().default(null),
    /** Optional hints when destination is open, e.g. "warm", "Europe", "beach". */
    destinationHints: z.array(z.string()).default([]),

    // ── When ───────────────────────────────────────────
    /** ISO date (YYYY-MM-DD). Ignored when flexibleDates is true and month set. */
    departDate: z.string().nullable().default(null),
    returnDate: z.string().nullable().default(null),
    flexibleDates: z.boolean().default(false),
    /** When flexible, the target month (1-12) and how many nights. */
    targetMonth: z.number().int().min(1).max(12).nullable().default(null),
    nights: z.number().int().min(1).max(60).default(5),

    // ── Who ────────────────────────────────────────────
    partyType: PartyType.default('couple'),
    adults: z.number().int().min(1).max(20).default(2),
    children: z.array(Traveler).default([]),

    // ── What kind of trip ──────────────────────────────
    vibe: TripVibe.default('mixed'),
    transport: TransportPreference.default('mixed'),

    // ── Budget ─────────────────────────────────────────
    /** Total budget for the whole trip, all travelers included. */
    budgetTotal: z.number().positive(),
    currency: z.string().length(3).default('USD'),

    // ── Free text ──────────────────────────────────────
    /** Anything specific the user must have: "kosher food", "near the beach". */
    specialRequests: z.string().max(2000).default(''),

    /** UI language for AI-generated copy. */
    language: z.enum(['he', 'en']).default('he'),
  })
  .strict();

export type TripRequest = z.infer<typeof TripRequestSchema>;

// ── Provider option shapes ────────────────────────────────

export interface FlightOption {
  id: string;
  provider: string;
  from: string;
  to: string;
  departAt: string; // ISO
  returnAt: string | null;
  airline: string;
  stops: number;
  durationMinutes: number;
  price: number; // total for the whole party, in request currency
  currency: string;
  deepLink?: string;
}

export interface HotelOption {
  id: string;
  provider: string;
  name: string;
  area: string;
  stars: number;
  rating: number; // 0-10 guest score
  reviewCount: number;
  pricePerNight: number;
  currency: string;
  amenities: string[];
  familyFriendly: boolean;
  deepLink?: string;
}

export type PlaceCategory = 'restaurant' | 'attraction' | 'nightlife' | 'transport';

export interface PlaceOption {
  id: string;
  provider: string;
  category: PlaceCategory;
  name: string;
  area: string;
  rating: number; // 0-5
  reviewCount: number;
  priceLevel: number; // 0-4
  /** Estimated cost per person for a typical visit/meal, in request currency. */
  estimatedCost: number;
  currency: string;
  tags: string[];
  kidFriendly: boolean;
  deepLink?: string;
}

/** A distilled, retrieval-augmented note about the destination from live sources. */
export interface Insight {
  id: string;
  source: string; // "reddit", "google", "blog", ...
  title: string;
  snippet: string;
  url?: string;
  score: number; // retrieval relevance 0-1
}

export interface DestinationData {
  destination: string;
  flights: FlightOption[];
  hotels: HotelOption[];
  restaurants: PlaceOption[];
  attractions: PlaceOption[];
  nightlife: PlaceOption[];
  transport: PlaceOption[];
  insights: Insight[];
}

// ── Budget allocation ─────────────────────────────────────

export const BUDGET_CATEGORIES = [
  'flights',
  'hotel',
  'food',
  'attractions',
  'transport',
  'buffer',
] as const;
export type BudgetCategory = (typeof BUDGET_CATEGORIES)[number];

export type BudgetAllocation = Record<BudgetCategory, number>;

// ── The final plan ────────────────────────────────────────

export interface ItineraryItem {
  time: string; // "09:00" or "morning"
  category: PlaceCategory | 'flight' | 'hotel' | 'free';
  title: string;
  description: string;
  estimatedCost: number;
  refId?: string; // links back to a provider option id
}

export interface ItineraryDay {
  day: number;
  date: string | null;
  summary: string;
  items: ItineraryItem[];
}

/**
 * A lightweight destination proposal for the results screen. Built without
 * calling Claude (data + budget engine only) so we can show several cards
 * cheaply; the full itinerary is generated on demand when a card is opened.
 */
export type ProposalStrategy = 'best_match' | 'max_savings' | 'exact_budget';

export interface ProposalSummary {
  id: string;
  destination: string;
  strategy: ProposalStrategy;
  /** 0-100 fit score against the traveler's profile and budget. */
  matchScore: number;
  currency: string;
  budgetTotal: number;
  estimatedTotal: number;
  /** budgetTotal - estimatedTotal (may be negative if over budget). */
  leftover: number;
  allocation: BudgetAllocation;
  estimatedSpend: BudgetAllocation;
  /** Short inclusion tags, e.g. "טיסות ישירות", "מלון 4★". */
  tags: string[];
  /** One distilled AI/insight line for the card. */
  headlineInsight: string | null;
  /** A short query the client can use to fetch a hero image. */
  imageQuery: string;
  topFlight: FlightOption | null;
  topHotel: HotelOption | null;
}

export interface TripPlan {
  id: string;
  createdAt: string;
  request: TripRequest;
  destination: string;
  currency: string;
  budgetTotal: number;
  allocation: BudgetAllocation;
  estimatedSpend: BudgetAllocation;
  selectedFlight: FlightOption | null;
  selectedHotel: HotelOption | null;
  days: ItineraryDay[];
  /** Claude's high-level reasoning shown to the user. */
  rationale: string;
  /** Short tips / warnings distilled from live insights. */
  tips: string[];
  /** True when any part of the data came from sample/fallback sources. */
  usedSampleData: boolean;
}
