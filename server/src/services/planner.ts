import { randomUUID } from 'node:crypto';
import type {
  Insight,
  TripPlan,
  TripRequest,
} from '../types.js';
import { allocateBudget, estimateSpend, trimToBudget } from './budget.js';
import { buildItinerary } from './ai.js';
import { getVectorStore } from './vectorStore.js';
import { gatherForDestination } from './gather.js';
import { sampleDestinationCandidates } from '../providers/sampleData.js';

/** Full pipeline: gather → retrieve → allocate → trim → reason → assemble. */
export async function planTrip(request: TripRequest): Promise<TripPlan> {
  const destination = await resolveDestination(request);

  const { data, usedSampleData } = await gatherForDestination(request, destination);

  // ── RAG: embed live insights, retrieve the most relevant for this trip
  const retrieved = await retrieveInsights(request, destination, data.insights);

  // ── Budget: allocate, then trim options to a short list for Claude
  const allocation = allocateBudget(request);
  const trimmed = trimToBudget(request, allocation, data);
  const estimatedSpend = estimateSpend(request, trimmed);

  // ── Reason: Claude builds the itinerary from the short list + insights
  const core = await buildItinerary(request, allocation, trimmed, retrieved);

  const selectedFlight = trimmed.flights.find((f) => f.id === core.selectedFlightId) ?? trimmed.flights[0] ?? null;
  const selectedHotel = trimmed.hotels.find((h) => h.id === core.selectedHotelId) ?? trimmed.hotels[0] ?? null;

  return {
    id: randomUUID(),
    createdAt: new Date().toISOString(),
    request,
    destination,
    currency: request.currency,
    budgetTotal: request.budgetTotal,
    allocation,
    estimatedSpend,
    selectedFlight,
    selectedHotel,
    days: core.days,
    rationale: core.rationale,
    tips: core.tips,
    usedSampleData,
  };
}

async function resolveDestination(request: TripRequest): Promise<string> {
  if (request.destination) return request.destination;
  // Open destination: pick the best sample candidate for now. A future version
  // can ask Claude to choose among candidates given the vibe/budget.
  const candidates = sampleDestinationCandidates(request);
  return candidates[0] ?? 'Barcelona';
}

async function retrieveInsights(
  request: TripRequest,
  destination: string,
  insights: Insight[],
): Promise<Insight[]> {
  if (insights.length === 0) return [];
  const store = await getVectorStore();
  const ns = `insights:${destination.toLowerCase()}`;
  await store.upsert(
    ns,
    insights.map((i) => ({ id: i.id, text: `${i.title}. ${i.snippet}`, metadata: { source: i.source, url: i.url } })),
  );

  const query = [
    destination,
    request.vibe,
    request.partyType,
    request.children.length ? 'with kids family' : '',
    request.transport,
    request.specialRequests,
  ]
    .filter(Boolean)
    .join(' ');

  const hits = await store.query(ns, query, 6);
  const byId = new Map(insights.map((i) => [i.id, i]));
  const retrieved = hits
    .map((h) => byId.get(h.id))
    .filter((i): i is Insight => Boolean(i));
  return retrieved.length ? retrieved : insights.slice(0, 6);
}
