import { config } from '../config.js';
import type { TripPlan } from '../types.js';

/**
 * Persistence for saved trips / history. Defaults to an in-memory store so the
 * server runs with no database; a Postgres adapter slots in behind the same
 * interface once DATABASE_URL is set.
 */
export interface TripRepository {
  save(plan: TripPlan): Promise<TripPlan>;
  get(id: string): Promise<TripPlan | null>;
  listByUser(userId: string): Promise<TripPlan[]>;
}

class MemoryTripRepository implements TripRepository {
  private trips = new Map<string, TripPlan & { userId: string }>();

  async save(plan: TripPlan, userId = 'anon'): Promise<TripPlan> {
    this.trips.set(plan.id, { ...plan, userId });
    return plan;
  }
  async get(id: string): Promise<TripPlan | null> {
    return this.trips.get(id) ?? null;
  }
  async listByUser(userId: string): Promise<TripPlan[]> {
    return [...this.trips.values()]
      .filter((t) => t.userId === userId)
      .sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
  }
}

let instance: TripRepository | null = null;

export function getRepository(): TripRepository {
  if (instance) return instance;
  if (config.database.url) {
    console.warn(
      '[db] DATABASE_URL is set but the Postgres adapter is not wired yet — using in-memory store. ' +
        'Implement a Postgres TripRepository behind this interface to enable persistence.',
    );
  }
  instance = new MemoryTripRepository();
  return instance;
}
