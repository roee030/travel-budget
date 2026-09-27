import { Platform } from 'react-native';
import type { ProposalSummary, TripPlan, TripRequest } from './types';

/**
 * Base URL of the Triporia API. Override with EXPO_PUBLIC_API_URL; defaults to
 * localhost for web/simulator development.
 */
const API_URL =
  process.env.EXPO_PUBLIC_API_URL ??
  (Platform.OS === 'web' ? 'http://localhost:4000' : 'http://localhost:4000');

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

export function fetchProposals(request: TripRequest): Promise<{ proposals: ProposalSummary[] }> {
  return post('/api/proposals', request);
}

export function fetchPlan(request: TripRequest): Promise<TripPlan> {
  return post('/api/plan', request);
}

export { API_URL };
