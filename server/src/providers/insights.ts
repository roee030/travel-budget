import { config } from '../config.js';
import type { Insight, TripRequest } from '../types.js';
import type { ProviderResult } from './flights.js';
import { sampleDestinationData } from './sampleData.js';

/**
 * "What's hot right now" — pulls fresh chatter from forums/reviews (Reddit,
 * blogs, Google) via SerpAPI. These raw hits are later embedded into the
 * vector store and retrieved as grounding for Claude, so the itinerary
 * reflects current, real-world opinion rather than only static API listings.
 */
export async function fetchInsights(
  request: TripRequest,
  destination: string,
): Promise<ProviderResult<Insight[]>> {
  if (config.useSampleData || !config.providers.serpApiKey) {
    return { data: sampleDestinationData(request, destination).insights, usedSample: true };
  }

  try {
    const queries = buildQueries(request, destination);
    const results = await Promise.all(queries.map((q) => serpSearch(q)));
    const flat = dedupe(results.flat());
    if (flat.length === 0) {
      return { data: sampleDestinationData(request, destination).insights, usedSample: true };
    }
    return { data: flat, usedSample: false };
  } catch (err) {
    console.warn('[insights] SerpAPI request failed, using sample data:', (err as Error).message);
    return { data: sampleDestinationData(request, destination).insights, usedSample: true };
  }
}

function buildQueries(request: TripRequest, destination: string): string[] {
  const q = [
    `${destination} travel tips reddit`,
    `best things to do in ${destination} ${new Date().getFullYear()}`,
    `${destination} where to stay ${request.vibe}`,
  ];
  if (request.children.length > 0) q.push(`${destination} with kids family friendly`);
  if (request.specialRequests.trim()) q.push(`${destination} ${request.specialRequests.slice(0, 60)}`);
  return q;
}

async function serpSearch(query: string): Promise<Insight[]> {
  const params = new URLSearchParams({
    engine: 'google',
    q: query,
    api_key: config.providers.serpApiKey,
    num: '5',
  });
  const res = await fetch(`https://serpapi.com/search.json?${params}`);
  if (!res.ok) throw new Error(`SerpAPI HTTP ${res.status}`);
  const json = (await res.json()) as any;

  const organic = (json.organic_results ?? []) as any[];
  return organic.slice(0, 5).map((r, i): Insight => ({
    id: `serp_${hash(r.link ?? query)}_${i}`,
    source: sourceFromUrl(r.link),
    title: r.title ?? query,
    snippet: r.snippet ?? '',
    url: r.link,
    score: Math.max(0.4, 1 - i * 0.12),
  }));
}

function sourceFromUrl(url: string | undefined): string {
  if (!url) return 'web';
  if (url.includes('reddit.com')) return 'reddit';
  if (url.includes('tripadvisor')) return 'tripadvisor';
  if (url.includes('youtube')) return 'youtube';
  return 'web';
}

function dedupe(items: Insight[]): Insight[] {
  const seen = new Set<string>();
  const out: Insight[] = [];
  for (const it of items) {
    const key = it.url ?? it.title;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(it);
  }
  return out.sort((a, b) => b.score - a.score).slice(0, 12);
}

function hash(s: string): string {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = (Math.imul(31, h) + s.charCodeAt(i)) | 0;
  return Math.abs(h).toString(36);
}
