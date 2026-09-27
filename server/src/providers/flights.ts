import { config } from '../config.js';
import type { FlightOption, TripRequest } from '../types.js';
import { sampleDestinationData } from './sampleData.js';

export interface ProviderResult<T> {
  data: T;
  usedSample: boolean;
}

/**
 * Flights via Kiwi.com (Tequila) when KIWI_API_KEY is set, otherwise sample
 * data. On any network/parse error we degrade gracefully to samples so the
 * planner never hard-fails.
 */
export async function fetchFlights(
  request: TripRequest,
  destination: string,
): Promise<ProviderResult<FlightOption[]>> {
  const useReal =
    !config.useSampleData && config.providers.kiwiApiKey && !request.flexibleDates;

  if (useReal) {
    try {
      const data = await fetchFromKiwi(request, destination);
      if (data.length > 0) return { data, usedSample: false };
    } catch (err) {
      console.warn('[flights] Kiwi request failed, using sample data:', (err as Error).message);
    }
  }

  return { data: sampleDestinationData(request, destination).flights, usedSample: true };
}

async function fetchFromKiwi(
  request: TripRequest,
  destination: string,
): Promise<FlightOption[]> {
  const heads = request.adults + request.children.length;
  const params = new URLSearchParams({
    fly_from: request.origin,
    fly_to: destination,
    date_from: toKiwiDate(request.departDate),
    date_to: toKiwiDate(request.departDate),
    return_from: request.returnDate ? toKiwiDate(request.returnDate) : '',
    return_to: request.returnDate ? toKiwiDate(request.returnDate) : '',
    adults: String(request.adults),
    children: String(request.children.length),
    curr: request.currency,
    limit: '10',
    sort: 'price',
  });

  const res = await fetch(`https://api.tequila.kiwi.com/v2/search?${params}`, {
    headers: { apikey: config.providers.kiwiApiKey, accept: 'application/json' },
  });
  if (!res.ok) throw new Error(`Kiwi HTTP ${res.status}`);
  const json = (await res.json()) as any;

  return (json.data ?? []).map((f: any, i: number): FlightOption => ({
    id: f.id ?? `kiwi_${i}`,
    provider: 'kiwi',
    from: f.flyFrom ?? request.origin,
    to: f.flyTo ?? destination,
    departAt: f.local_departure ?? request.departDate ?? '',
    returnAt: request.returnDate,
    airline: (f.airlines ?? []).join(', ') || 'Unknown',
    stops: Math.max(0, (f.route?.length ?? 1) - 1),
    durationMinutes: Math.round((f.duration?.total ?? 0) / 60),
    // Kiwi price is per booking already; keep as-is but guard for per-head data.
    price: f.price ?? 0,
    currency: request.currency,
    deepLink: f.deep_link,
  }));
}

function toKiwiDate(iso: string | null): string {
  // Kiwi expects dd/mm/yyyy
  if (!iso) {
    const d = new Date();
    d.setMonth(d.getMonth() + 2);
    return formatDMY(d);
  }
  return formatDMY(new Date(iso));
}

function formatDMY(d: Date): string {
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = String(d.getMonth() + 1).padStart(2, '0');
  return `${dd}/${mm}/${d.getFullYear()}`;
}
