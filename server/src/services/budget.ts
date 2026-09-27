import {
  type BudgetAllocation,
  type DestinationData,
  type HotelOption,
  type FlightOption,
  type PlaceOption,
  type TripRequest,
  type TripVibe,
} from '../types.js';

/**
 * Budget weights per vibe. Each column sums to 1 across the five spend
 * categories (a 'buffer' is carved out separately below). These are the
 * levers that make a "בטן גב" trip skew to hotel while an "attractions"
 * trip skews to activities.
 */
const VIBE_WEIGHTS: Record<TripVibe, Omit<BudgetAllocation, 'buffer'>> = {
  relaxation: { flights: 0.28, hotel: 0.42, food: 0.16, attractions: 0.08, transport: 0.06 },
  attractions: { flights: 0.3, hotel: 0.26, food: 0.16, attractions: 0.22, transport: 0.06 },
  nightlife: { flights: 0.28, hotel: 0.28, food: 0.2, attractions: 0.16, transport: 0.08 },
  food: { flights: 0.28, hotel: 0.28, food: 0.3, attractions: 0.08, transport: 0.06 },
  nature: { flights: 0.3, hotel: 0.26, food: 0.16, attractions: 0.16, transport: 0.12 },
  culture: { flights: 0.3, hotel: 0.28, food: 0.16, attractions: 0.2, transport: 0.06 },
  mixed: { flights: 0.3, hotel: 0.3, food: 0.18, attractions: 0.16, transport: 0.06 },
};

const BUFFER_RATIO = 0.08;

export function allocateBudget(request: TripRequest): BudgetAllocation {
  const spendable = request.budgetTotal * (1 - BUFFER_RATIO);
  const w = VIBE_WEIGHTS[request.vibe];

  const allocation: BudgetAllocation = {
    flights: round(spendable * w.flights),
    hotel: round(spendable * w.hotel),
    food: round(spendable * w.food),
    attractions: round(spendable * w.attractions),
    transport: round(spendable * w.transport),
    buffer: round(request.budgetTotal * BUFFER_RATIO),
  };

  // If the user prefers a rental car, shift a little from attractions.
  if (request.transport === 'rental_car') {
    const shift = Math.min(allocation.attractions * 0.25, allocation.transport);
    allocation.attractions -= round(shift);
    allocation.transport += round(shift);
  }
  return allocation;
}

/**
 * Reduce the full provider payload to a ranked short list that fits the
 * budget. This is what keeps Claude's prompt small and cheap: instead of
 * dozens of flights/hotels/places, Claude sees only the best few per category.
 */
export function trimToBudget(
  request: TripRequest,
  allocation: BudgetAllocation,
  data: DestinationData,
): DestinationData {
  const heads = request.adults + request.children.length;
  const withKids = request.children.length > 0;

  // ── Flights: within budget (with 15% slack), cheapest & fewest stops first
  const flights = rank(
    data.flights.filter((f) => f.price <= allocation.flights * 1.15),
    (f) => flightScore(f),
  ).slice(0, 3);
  const flightsFallback = flights.length
    ? flights
    : rank(data.flights, (f) => flightScore(f)).slice(0, 2);

  // ── Hotels: within per-night budget, best rated first
  const nightlyBudget = allocation.hotel / Math.max(1, request.nights);
  const hotels = rank(
    data.hotels.filter(
      (h) => h.pricePerNight <= nightlyBudget * 1.2 && (!withKids || h.familyFriendly || h.stars >= 3),
    ),
    (h) => hotelScore(h),
  ).slice(0, 4);
  const hotelsFallback = hotels.length
    ? hotels
    : rank(data.hotels, (h) => hotelScore(h)).slice(0, 2);

  // ── Places: rank by rating/value, drop items unsuitable for the party
  const restaurants = topPlaces(data.restaurants, withKids, 8);
  const attractions = topPlaces(matchVibe(data.attractions, request.vibe), withKids, 10);
  const nightlife = withKids ? [] : topPlaces(data.nightlife, false, 4);
  const transport = filterTransport(data.transport, request);

  return {
    destination: data.destination,
    flights: flightsFallback,
    hotels: hotelsFallback,
    restaurants,
    attractions,
    nightlife,
    transport,
    insights: data.insights.slice(0, 8),
  };
}

/** A quick estimate of what the trimmed selection would actually cost. */
export function estimateSpend(
  request: TripRequest,
  data: DestinationData,
): BudgetAllocation {
  const heads = request.adults + request.children.length;
  const cheapestFlight = min(data.flights.map((f) => f.price));
  const cheapestHotel = min(data.hotels.map((h) => h.pricePerNight));
  const avgMeal = avg(data.restaurants.map((r) => r.estimatedCost)) || 20;
  const avgAttraction = avg(data.attractions.map((a) => a.estimatedCost)) || 12;
  const transportPerDay = min(data.transport.map((t) => t.estimatedCost)) || 10;

  return {
    flights: round(cheapestFlight),
    hotel: round(cheapestHotel * request.nights),
    // ~2 meals out per day per person
    food: round(avgMeal * heads * 2 * request.nights),
    // ~1.5 attractions per day per person
    attractions: round(avgAttraction * heads * 1.5 * request.nights),
    transport: round(transportPerDay * heads * request.nights),
    buffer: round(request.budgetTotal * BUFFER_RATIO),
  };
}

// ── scoring helpers ───────────────────────────────────────

function flightScore(f: FlightOption): number {
  // lower is better → invert into a positive score
  return -(f.price + f.stops * 120 + f.durationMinutes * 0.1);
}

function hotelScore(h: HotelOption): number {
  return h.rating * 10 + Math.min(h.reviewCount, 5000) / 500 - h.pricePerNight * 0.05;
}

function placeScore(p: PlaceOption): number {
  return p.rating * 20 + Math.min(p.reviewCount, 50000) / 2000 - p.priceLevel * 2;
}

function topPlaces(places: PlaceOption[], withKids: boolean, n: number): PlaceOption[] {
  const filtered = withKids ? places.filter((p) => p.kidFriendly || p.category !== 'nightlife') : places;
  return rank(filtered, placeScore).slice(0, n);
}

function matchVibe(places: PlaceOption[], vibe: TripVibe): PlaceOption[] {
  const prefer: Partial<Record<TripVibe, string[]>> = {
    nature: ['park', 'beach', 'views', 'hike', 'relax'],
    culture: ['museum', 'history', 'landmark', 'architecture'],
    relaxation: ['beach', 'park', 'relax', 'spa', 'views'],
    food: ['market', 'food'],
  };
  const keys = prefer[vibe];
  if (!keys) return places;
  return [...places].sort((a, b) => vibeBoost(b, keys) - vibeBoost(a, keys));
}

function vibeBoost(p: PlaceOption, keys: string[]): number {
  return p.tags.some((t) => keys.some((k) => t.toLowerCase().includes(k))) ? 100 : 0;
}

function filterTransport(transport: PlaceOption[], request: TripRequest): PlaceOption[] {
  switch (request.transport) {
    case 'public':
      return transport.filter((t) => t.tags.includes('metro') || t.tags.includes('bus') || t.tags.includes('transfer'));
    case 'rental_car':
      return transport.filter((t) => t.tags.includes('car') || t.tags.includes('transfer'));
    case 'walk':
      return transport.filter((t) => t.tags.includes('transfer'));
    default:
      return transport;
  }
}

// ── generic utils ─────────────────────────────────────────

function rank<T>(items: T[], score: (t: T) => number): T[] {
  return [...items].sort((a, b) => score(b) - score(a));
}
function round(n: number): number {
  return Math.round(n);
}
function min(xs: number[]): number {
  return xs.length ? Math.min(...xs) : 0;
}
function avg(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}
