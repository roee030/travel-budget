import { Platform } from 'react-native';
import type { ProposalSummary, TripPlan, TripRequest } from './types';
import { generatePlan, generateProposals } from './mock/engine';

/**
 * Base URL of the Triporia API. Override with EXPO_PUBLIC_API_URL; defaults to
 * localhost for web/simulator development.
 */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://localhost:4000' : 'http://localhost:4000');

/**
 * When no backend URL is configured (e.g. the static GitHub Pages build) we run
 * in demo mode: a client-side mock engine generates varied, believable results
 * from the user's actual input — no network needed.
 */
const DEMO = !process.env.EXPO_PUBLIC_API_URL;

/** True when the app is serving generated demo data rather than a live backend. */
export const isDemo = DEMO;

async function post<T>(path: string, body: unknown): Promise<T> {
  const res = await fetch(`${API_URL}${path}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`API ${path} failed (${res.status}): ${text}`);
  }
  return (await res.json()) as T;
}

export async function fetchProposals(request: TripRequest): Promise<{ proposals: ProposalSummary[] }> {
  if (DEMO) return { proposals: generateProposals(request) };
  try {
    return await post('/api/proposals', request);
  } catch {
    return { proposals: generateProposals(request) };
  }
}

export async function fetchPlan(request: TripRequest): Promise<TripPlan> {
  const destination = request.destination ?? 'Barcelona';
  if (DEMO) return generatePlan(request, destination);
  try {
    return await post('/api/plan', request);
  } catch {
    return generatePlan(request, destination);
  }
}

export { API_URL };
