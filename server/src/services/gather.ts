import type { DestinationData, TripRequest } from '../types.js';
import { cacheKey, getCache } from './cache.js';
import { fetchFlights } from '../providers/flights.js';
import { fetchHotels } from '../providers/hotels.js';
import { fetchPlaces } from '../providers/places.js';
import { fetchInsights } from '../providers/insights.js';

export interface GatherResult {
  data: DestinationData;
  usedSampleData: boolean;
}

/**
 * Fetches all provider data for a destination (flights, hotels, places,
 * insights) in parallel, with caching. Shared by the single-plan pipeline and
 * the proposals endpoint so both hit the same cache and provider adapters.
 */
export async function gatherForDestination(
  request: TripRequest,
  destination: string,
): Promise<GatherResult> {
  const cache = await getCache();
  const key = cacheKey('dest', {
    destination,
    origin: request.origin,
    departDate: request.departDate,
    returnDate: request.returnDate,
    nights: request.nights,
    adults: request.adults,
    children: request.children.length,
    currency: request.currency,
    vibe: request.vibe,
  });

  const cached = await cache.get<GatherResult>(key);
  if (cached) return cached;

  const [flights, hotels, places, insights] = await Promise.all([
    fetchFlights(request, destination),
    fetchHotels(request, destination),
    fetchPlaces(request, destination),
    fetchInsights(request, destination),
  ]);

  const data: DestinationData = {
    destination,
    flights: flights.data,
    hotels: hotels.data,
    restaurants: places.data.restaurants,
    attractions: places.data.attractions,
    nightlife: places.data.nightlife,
    transport: places.data.transport,
    insights: insights.data,
  };

  const usedSampleData =
    flights.usedSample || hotels.usedSample || places.usedSample || insights.usedSample;

  const result = { data, usedSampleData };
  await cache.set(key, result);
  return result;
}
