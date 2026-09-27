import { config } from '../config.js';
import type { HotelOption, TripRequest } from '../types.js';
import type { ProviderResult } from './flights.js';
import { sampleDestinationData } from './sampleData.js';

/**
 * Hotels. A real Booking.com / partner integration plugs in here; until a key
 * is configured we serve sample inventory. The shape returned is identical
 * either way so the rest of the pipeline is provider-agnostic.
 */
export async function fetchHotels(
  request: TripRequest,
  destination: string,
): Promise<ProviderResult<HotelOption[]>> {
  const useReal = !config.useSampleData && config.providers.bookingApiKey;

  if (useReal) {
    try {
      const data = await fetchFromBooking(request, destination);
      if (data.length > 0) return { data, usedSample: false };
    } catch (err) {
      console.warn('[hotels] Booking request failed, using sample data:', (err as Error).message);
    }
  }

  return { data: sampleDestinationData(request, destination).hotels, usedSample: true };
}

/**
 * Placeholder for the real Booking.com / RapidAPI call. The exact endpoint and
 * auth depend on the partner program; this is where the mapping to HotelOption
 * lives once a key is provisioned.
 */
async function fetchFromBooking(
  _request: TripRequest,
  _destination: string,
): Promise<HotelOption[]> {
  // Intentionally not implemented against a specific endpoint yet — a partner
  // key determines the exact API surface. Throwing routes us to sample data.
  throw new Error('Booking provider not configured');
}
