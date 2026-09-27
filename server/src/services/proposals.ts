import { randomUUID } from 'node:crypto';
import type {
  BudgetAllocation,
  DestinationData,
  FlightOption,
  HotelOption,
  ProposalStrategy,
  ProposalSummary,
  TripRequest,
} from '../types.js';
import { allocateBudget } from './budget.js';
import { gatherForDestination } from './gather.js';
import { sampleDestinationCandidates } from '../providers/sampleData.js';

const STRATEGIES: ProposalStrategy[] = ['best_match', 'max_savings', 'exact_budget'];

/**
 * Builds the 3 proposal cards for the results screen WITHOUT calling Claude —
 * pure data + budget-engine work, so it's cheap and fast. The full Claude
 * itinerary is generated later, only when the user opens one proposal.
 */
export async function generateProposals(request: TripRequest): Promise<ProposalSummary[]> {
  const destinations = await resolveCandidates(request);

  // Gather each destination's data once (cached), in parallel.
  const gathered = await Promise.all(
    destinations.map(async (d) => ({ destination: d, ...(await gatherForDestination(request, d)) })),
  );

  const proposals = gathered.map((g, i) =>
    buildProposal(request, g.destination, g.data, STRATEGIES[i % STRATEGIES.length]),
  );

  // Sort so the best match is first (matches the mockup's "AI choice" card).
  proposals.sort((a, b) => b.matchScore - a.matchScore);
  return proposals;
}

async function resolveCandidates(request: TripRequest): Promise<string[]> {
  if (request.destination) {
    // Specific destination: show three strategy variants of the same place.
    return [request.destination, request.destination, request.destination];
  }
  const candidates = sampleDestinationCandidates(request);
  // Ensure exactly three, padding from the default list if needed.
  while (candidates.length < 3) candidates.push(candidates[candidates.length - 1] ?? 'Barcelona');
  return candidates.slice(0, 3);
}

function buildProposal(
  request: TripRequest,
  destination: string,
  data: DestinationData,
  strategy: ProposalStrategy,
): ProposalSummary {
  const heads = request.adults + request.children.length;
  const allocation = allocateBudget(request);

  const nightlyBudget = allocation.hotel / Math.max(1, request.nights);
  const flight = pickFlight(data.flights, strategy);
  const hotel = pickHotel(data.hotels, request, strategy, nightlyBudget);
  const foodPerDay = avg(data.restaurants.map((r) => r.estimatedCost)) || 20;
  const attractionPerDay = avg(data.attractions.map((a) => a.estimatedCost)) || 12;
  const transportPerDay = min(data.transport.map((t) => t.estimatedCost)) || 10;

  const intensity = strategy === 'max_savings' ? 0.75 : strategy === 'exact_budget' ? 1.2 : 1;

  const estimatedSpend: BudgetAllocation = {
    flights: round(flight?.price ?? allocation.flights),
    hotel: round((hotel?.pricePerNight ?? nightlyBudget) * request.nights),
    food: round(foodPerDay * heads * 2 * request.nights * intensity),
    attractions: round(attractionPerDay * heads * 1.5 * request.nights * intensity),
    transport: round(transportPerDay * heads * request.nights),
    buffer: allocation.buffer,
  };

  const estimatedTotal = sum(Object.values(estimatedSpend));
  const leftover = round(request.budgetTotal - estimatedTotal);

  return {
    id: randomUUID(),
    destination,
    strategy,
    matchScore: scoreProposal(request, strategy, estimatedTotal, hotel, flight),
    currency: request.currency,
    budgetTotal: request.budgetTotal,
    estimatedTotal,
    leftover,
    allocation,
    estimatedSpend,
    tags: buildTags(request, flight, hotel, data),
    headlineInsight: data.insights[0]?.snippet ?? null,
    imageQuery: `${destination} travel skyline`,
    topFlight: flight,
    topHotel: hotel,
  };
}

function pickFlight(flights: FlightOption[], strategy: ProposalStrategy): FlightOption | null {
  if (flights.length === 0) return null;
  const byPrice = [...flights].sort((a, b) => a.price - b.price);
  if (strategy === 'max_savings') return byPrice[0];
  // Prefer direct flights for best_match / exact_budget.
  const direct = byPrice.find((f) => f.stops === 0);
  return direct ?? byPrice[0];
}

function pickHotel(
  hotels: HotelOption[],
  request: TripRequest,
  strategy: ProposalStrategy,
  nightlyBudget: number,
): HotelOption | null {
  if (hotels.length === 0) return null;
  const withKids = request.children.length > 0;
  const suitable = hotels.filter((h) => !withKids || h.familyFriendly || h.stars >= 3);
  const pool = suitable.length ? suitable : hotels;

  switch (strategy) {
    case 'max_savings':
      return [...pool].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
    case 'exact_budget':
      // Most premium option that still fits within ~1.2x the nightly budget.
      return (
        [...pool]
          .filter((h) => h.pricePerNight <= nightlyBudget * 1.2)
          .sort((a, b) => b.pricePerNight - a.pricePerNight)[0] ??
        [...pool].sort((a, b) => a.pricePerNight - b.pricePerNight)[0]
      );
    default: {
      // Best match: highest-rated hotel that fits the nightly budget.
      const inBudget = pool.filter((h) => h.pricePerNight <= nightlyBudget * 1.1);
      const candidates = inBudget.length ? inBudget : pool;
      return [...candidates].sort((a, b) => b.rating - a.rating)[0];
    }
  }
}

/** 0-100 fit: budget utilization (without overshooting) + hotel quality + directness. */
function scoreProposal(
  request: TripRequest,
  strategy: ProposalStrategy,
  estimatedTotal: number,
  hotel: HotelOption | null,
  flight: FlightOption | null,
): number {
  const utilization = estimatedTotal / request.budgetTotal;
  // Peak score at ~95% utilization; penalize going over budget heavily.
  const budgetFit =
    utilization > 1 ? Math.max(0, 1 - (utilization - 1) * 2) : 1 - Math.abs(0.95 - utilization);
  const hotelQuality = hotel ? hotel.rating / 10 : 0.6;
  const directness = flight ? (flight.stops === 0 ? 1 : 0.7) : 0.7;
  const strategyBoost = strategy === 'best_match' ? 0.05 : 0;

  const raw = budgetFit * 0.5 + hotelQuality * 0.3 + directness * 0.2 + strategyBoost;
  return Math.round(Math.min(100, Math.max(40, raw * 100)));
}

function buildTags(
  request: TripRequest,
  flight: FlightOption | null,
  hotel: HotelOption | null,
  data: DestinationData,
): string[] {
  const he = request.language === 'he';
  const tags: string[] = [];
  if (flight && flight.stops === 0) tags.push(he ? 'טיסות ישירות' : 'Direct flights');
  if (hotel) tags.push(he ? `מלון ${hotel.stars}★` : `${hotel.stars}★ hotel`);
  if (request.transport === 'rental_car') tags.push(he ? 'רכב שכור' : 'Rental car');
  else if (request.transport === 'public') tags.push(he ? 'תחבורה ציבורית' : 'Public transport');
  if (data.attractions.length) tags.push(he ? `${Math.min(data.attractions.length, 5)} אטרקציות` : `${Math.min(data.attractions.length, 5)} attractions`);
  if (request.vibe === 'food') tags.push(he ? 'מסלול קולינרי' : 'Culinary route');
  if (request.vibe === 'relaxation') tags.push(he ? 'בטן-גב' : 'Relaxation');
  return tags.slice(0, 5);
}

// ── utils ──
function round(n: number): number {
  return Math.round(n);
}
function sum(xs: number[]): number {
  return xs.reduce((s, x) => s + x, 0);
}
function avg(xs: number[]): number {
  return xs.length ? xs.reduce((s, x) => s + x, 0) / xs.length : 0;
}
function min(xs: number[]): number {
  return xs.length ? Math.min(...xs) : 0;
}
