import { readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { config } from '../config.js';
import type { HotelOption, TripRequest } from '../types.js';
import type { ProviderResult } from './flights.js';
import { sampleDestinationData } from './sampleData.js';

/**
 * Hotels. Real data — pulled once via the Booking.com accommodations API
 * (a legitimate partner integration, not scraping) and checked into
 * data/hotels/<Destination>.json — is served when we have it for the
 * requested destination; otherwise we fall back to curated sample
 * inventory. A live per-request Booking.com API call (with a real
 * BOOKING_API_KEY) plugs into fetchFromBooking() below when one is
 * provisioned; the shape returned is identical either way so the rest of
 * the pipeline is provider-agnostic.
 */

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REAL_HOTELS_DIR = path.resolve(__dirname, '../../data/hotels');

export async function fetchHotels(
  request: TripRequest,
  destination: string,
): Promise<ProviderResult<HotelOption[]>> {
  if (!config.useSampleData) {
    const real = await loadRealHotels(destination);
    if (real && real.length > 0) return { data: real, usedSample: false };
  }

  if (!config.useSampleData && config.providers.bookingApiKey) {
    try {
      const data = await fetchFromBooking(request, destination);
      if (data.length > 0) return { data, usedSample: false };
    } catch (err) {
      console.warn('[hotels] Booking request failed, using sample data:', (err as Error).message);
    }
  }

  return { data: sampleDestinationData(request, destination).hotels, usedSample: true };
}

/** Real hotel data checked into data/hotels/<Destination>.json (see providers/README notes). */
async function loadRealHotels(destination: string): Promise<HotelOption[] | null> {
  try {
    const raw = await readFile(path.join(REAL_HOTELS_DIR, `${destination}.json`), 'utf-8');
    return JSON.parse(raw) as HotelOption[];
  } catch {
    return null;
  }
}

/**
 * Placeholder for a live per-request Booking.com Demand API call. The exact
 * endpoint and auth depend on the partner program; this is where the mapping
 * to HotelOption lives once a key is provisioned. Until then, loadRealHotels()
 * above and sample data cover the product.
 */
async function fetchFromBooking(
  _request: TripRequest,
  _destination: string,
): Promise<HotelOption[]> {
  throw new Error('Booking live API not configured');
}
