import { config } from '../config.js';
import type { PlaceCategory, PlaceOption, TripRequest } from '../types.js';
import type { ProviderResult } from './flights.js';
import { sampleDestinationData } from './sampleData.js';

interface PlacesBundle {
  restaurants: PlaceOption[];
  attractions: PlaceOption[];
  nightlife: PlaceOption[];
  transport: PlaceOption[];
}

/**
 * Restaurants / attractions / nightlife / transport via Google Places
 * (Places API v1: places:searchText) when GOOGLE_PLACES_API_KEY is set,
 * otherwise sample data.
 */
export async function fetchPlaces(
  request: TripRequest,
  destination: string,
): Promise<ProviderResult<PlacesBundle>> {
  const sample = sampleDestinationData(request, destination);
  const fallback: PlacesBundle = {
    restaurants: sample.restaurants,
    attractions: sample.attractions,
    nightlife: sample.nightlife,
    transport: sample.transport,
  };

  if (config.useSampleData || !config.providers.googlePlacesApiKey) {
    return { data: fallback, usedSample: true };
  }

  try {
    const [restaurants, attractions, nightlife] = await Promise.all([
      searchGoogle(`best restaurants in ${destination}`, 'restaurant', request),
      searchGoogle(`top attractions in ${destination}`, 'attraction', request),
      searchGoogle(`nightlife and bars in ${destination}`, 'nightlife', request),
    ]);
    return {
      data: {
        restaurants: restaurants.length ? restaurants : fallback.restaurants,
        attractions: attractions.length ? attractions : fallback.attractions,
        nightlife: nightlife.length ? nightlife : fallback.nightlife,
        // Transport isn't a Places search; keep the curated options.
        transport: fallback.transport,
      },
      usedSample: false,
    };
  } catch (err) {
    console.warn('[places] Google request failed, using sample data:', (err as Error).message);
    return { data: fallback, usedSample: true };
  }
}

async function searchGoogle(
  query: string,
  category: PlaceCategory,
  request: TripRequest,
): Promise<PlaceOption[]> {
  const res = await fetch('https://places.googleapis.com/v1/places:searchText', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-Goog-Api-Key': config.providers.googlePlacesApiKey,
      'X-Goog-FieldMask':
        'places.id,places.displayName,places.formattedAddress,places.rating,places.userRatingCount,places.priceLevel,places.types',
    },
    body: JSON.stringify({ textQuery: query, maxResultCount: 10 }),
  });
  if (!res.ok) throw new Error(`Google Places HTTP ${res.status}`);
  const json = (await res.json()) as any;

  return (json.places ?? []).map((p: any): PlaceOption => {
    const priceLevel = mapPriceLevel(p.priceLevel);
    return {
      id: p.id ?? `gpl_${Math.random().toString(36).slice(2)}`,
      provider: 'google',
      category,
      name: p.displayName?.text ?? 'Unknown',
      area: p.formattedAddress ?? '',
      rating: p.rating ?? 0,
      reviewCount: p.userRatingCount ?? 0,
      priceLevel,
      estimatedCost: estimateCost(category, priceLevel),
      currency: request.currency,
      tags: (p.types ?? []).slice(0, 4),
      kidFriendly: category !== 'nightlife',
    };
  });
}

function mapPriceLevel(level: string | undefined): number {
  switch (level) {
    case 'PRICE_LEVEL_FREE':
      return 0;
    case 'PRICE_LEVEL_INEXPENSIVE':
      return 1;
    case 'PRICE_LEVEL_MODERATE':
      return 2;
    case 'PRICE_LEVEL_EXPENSIVE':
      return 3;
    case 'PRICE_LEVEL_VERY_EXPENSIVE':
      return 4;
    default:
      return 2;
  }
}

/** Rough per-person cost estimate from a price level, tuned per category. */
function estimateCost(category: PlaceCategory, priceLevel: number): number {
  const base: Record<PlaceCategory, number> = {
    restaurant: 15,
    attraction: 8,
    nightlife: 20,
    transport: 10,
  };
  return base[category] * (priceLevel + 1);
}
