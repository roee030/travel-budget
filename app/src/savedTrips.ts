import { Platform } from 'react-native';
import type { TripPlan } from './types';

/** A trip the user chose to keep, so they can reopen its itinerary later without re-planning. */
export interface SavedTrip {
  id: string;
  savedAt: string;
  plan: TripPlan;
}

const STORAGE_KEY = 'triporia:savedTrips';

function readStorage(): SavedTrip[] {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeStorage(trips: SavedTrip[]): void {
  if (Platform.OS !== 'web' || typeof localStorage === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(trips));
  } catch {
    // storage full/unavailable — saving is a nice-to-have, fail silently
  }
}

export function loadSavedTrips(): SavedTrip[] {
  return readStorage().sort((a, b) => b.savedAt.localeCompare(a.savedAt));
}

export function saveTrip(plan: TripPlan): SavedTrip[] {
  const trips = readStorage().filter((t) => t.plan.id !== plan.id);
  trips.push({ id: plan.id, savedAt: new Date().toISOString(), plan });
  writeStorage(trips);
  return loadSavedTrips();
}

export function deleteTrip(id: string): SavedTrip[] {
  const trips = readStorage().filter((t) => t.id !== id);
  writeStorage(trips);
  return loadSavedTrips();
}

export function isTripSaved(id: string | undefined, trips: SavedTrip[]): boolean {
  if (!id) return false;
  return trips.some((t) => t.id === id);
}
