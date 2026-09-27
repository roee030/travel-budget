import Anthropic from '@anthropic-ai/sdk';
import { config, hasAnthropic } from '../config.js';
import type {
  BudgetAllocation,
  DestinationData,
  Insight,
  TripRequest,
} from '../types.js';
import { fallbackPlan, type PlanCore } from './fallbackPlanner.js';

/**
 * Turns the trimmed, budget-fitted short list into a concrete itinerary using
 * Claude. Claude receives only the short list + retrieved insights (kept small
 * by the budget engine), reasons about pacing/value, and returns strict JSON.
 * Any failure falls back to the deterministic planner.
 */
export async function buildItinerary(
  request: TripRequest,
  allocation: BudgetAllocation,
  data: DestinationData,
  retrieved: Insight[],
): Promise<PlanCore> {
  if (!hasAnthropic()) return fallbackPlan(request, data);

  try {
    const client = new Anthropic({ apiKey: config.anthropic.apiKey });
    const system = buildSystemPrompt(request);
    const user = buildUserPrompt(request, allocation, data, retrieved);

    const response = await client.messages.create({
      model: config.anthropic.model,
      max_tokens: 4000,
      system,
      messages: [{ role: 'user', content: user }],
    });

    const text = response.content
      .filter((b): b is Anthropic.TextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('\n');

    const parsed = extractJson(text);
    return normalize(parsed, request, data);
  } catch (err) {
    console.warn('[ai] Claude call failed, using fallback planner:', (err as Error).message);
    return fallbackPlan(request, data);
  }
}

function buildSystemPrompt(request: TripRequest): string {
  const lang = request.language === 'he' ? 'Hebrew' : 'English';
  return [
    'You are an expert travel planner. You design realistic, well-paced trips',
    'that respect a budget and the travelers\' profile (party type, kids and their ages, vibe).',
    'You are given a short list of real flight/hotel/place options plus fresh insights',
    'gathered from forums and reviews. Use ONLY the provided options; reference them by id.',
    `Write all human-readable text (summaries, descriptions, rationale, tips) in ${lang}.`,
    'Balance the days according to the vibe: relaxation = slower, fewer items;',
    'attractions = fuller days; family with young kids = shorter days and kid-friendly picks.',
    'Respect the per-category budget. Do not invent places that are not in the input.',
    'Return ONLY a JSON object, no prose, no markdown fences.',
  ].join(' ');
}

function buildUserPrompt(
  request: TripRequest,
  allocation: BudgetAllocation,
  data: DestinationData,
  retrieved: Insight[],
): string {
  const compact = {
    request: {
      destination: data.destination,
      origin: request.origin,
      nights: request.nights,
      party: { adults: request.adults, children: request.children.map((c) => c.age), type: request.partyType },
      vibe: request.vibe,
      transport: request.transport,
      currency: request.currency,
      specialRequests: request.specialRequests,
    },
    budgetAllocation: allocation,
    options: {
      flights: data.flights.map((f) => ({ id: f.id, airline: f.airline, stops: f.stops, price: f.price, durationMinutes: f.durationMinutes })),
      hotels: data.hotels.map((h) => ({ id: h.id, name: h.name, area: h.area, stars: h.stars, rating: h.rating, pricePerNight: h.pricePerNight, familyFriendly: h.familyFriendly })),
      restaurants: data.restaurants.map((p) => ({ id: p.id, name: p.name, area: p.area, rating: p.rating, estimatedCost: p.estimatedCost, tags: p.tags, kidFriendly: p.kidFriendly })),
      attractions: data.attractions.map((p) => ({ id: p.id, name: p.name, area: p.area, rating: p.rating, estimatedCost: p.estimatedCost, tags: p.tags, kidFriendly: p.kidFriendly })),
      nightlife: data.nightlife.map((p) => ({ id: p.id, name: p.name, area: p.area, rating: p.rating, estimatedCost: p.estimatedCost, tags: p.tags })),
      transport: data.transport.map((p) => ({ id: p.id, name: p.name, estimatedCost: p.estimatedCost, tags: p.tags })),
    },
    insights: retrieved.map((i) => ({ source: i.source, title: i.title, snippet: i.snippet })),
  };

  return [
    'Plan the trip using the data below.',
    '',
    JSON.stringify(compact),
    '',
    'Respond with JSON of exactly this shape:',
    JSON.stringify({
      selectedFlightId: 'string|null',
      selectedHotelId: 'string|null',
      rationale: 'string — 2-4 sentences explaining your choices and how they fit the budget',
      tips: ['string', '...  3-6 short, concrete tips distilled from the insights'],
      days: [
        {
          day: 1,
          summary: 'string',
          items: [
            {
              time: '10:00',
              category: 'attraction|restaurant|nightlife|transport|flight|hotel|free',
              title: 'string',
              description: 'string',
              estimatedCost: 0,
              refId: 'the id of the referenced option, or omit',
            },
          ],
        },
      ],
    }),
  ].join('\n');
}

function extractJson(text: string): any {
  const trimmed = text.trim();
  // Handle accidental markdown fences.
  const fenced = trimmed.match(/```(?:json)?\s*([\s\S]*?)```/);
  const candidate = fenced ? fenced[1] : trimmed;
  const start = candidate.indexOf('{');
  const end = candidate.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON object in model response');
  return JSON.parse(candidate.slice(start, end + 1));
}

/** Validate/repair the model output into a PlanCore, falling back per-field. */
function normalize(parsed: any, request: TripRequest, data: DestinationData): PlanCore {
  const validIds = new Set([
    ...data.flights.map((f) => f.id),
    ...data.hotels.map((h) => h.id),
    ...data.restaurants.map((p) => p.id),
    ...data.attractions.map((p) => p.id),
    ...data.nightlife.map((p) => p.id),
    ...data.transport.map((p) => p.id),
  ]);

  const days = Array.isArray(parsed.days) && parsed.days.length
    ? parsed.days.map((d: any, i: number) => ({
        day: Number(d.day) || i + 1,
        date: d.date ?? null,
        summary: String(d.summary ?? `Day ${i + 1}`),
        items: Array.isArray(d.items)
          ? d.items.map((it: any) => ({
              time: String(it.time ?? ''),
              category: it.category ?? 'free',
              title: String(it.title ?? ''),
              description: String(it.description ?? ''),
              estimatedCost: Number(it.estimatedCost) || 0,
              refId: it.refId && validIds.has(it.refId) ? it.refId : undefined,
            }))
          : [],
      }))
    : fallbackPlan(request, data).days;

  const selectedFlightId =
    parsed.selectedFlightId && validIds.has(parsed.selectedFlightId)
      ? parsed.selectedFlightId
      : data.flights[0]?.id ?? null;
  const selectedHotelId =
    parsed.selectedHotelId && validIds.has(parsed.selectedHotelId)
      ? parsed.selectedHotelId
      : data.hotels[0]?.id ?? null;

  return {
    selectedFlightId,
    selectedHotelId,
    days,
    rationale: String(parsed.rationale ?? ''),
    tips: Array.isArray(parsed.tips) ? parsed.tips.map(String).slice(0, 6) : [],
  };
}
