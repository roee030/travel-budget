import type { AdminDestinationFull, AdminDestinationSummary } from '../admin/adminApi';

import Amsterdam from './knowledge/Amsterdam.json';
import Athens from './knowledge/Athens.json';
import Bangkok from './knowledge/Bangkok.json';
import Barcelona from './knowledge/Barcelona.json';
import Dubai from './knowledge/Dubai.json';
import Istanbul from './knowledge/Istanbul.json';
import Lisbon from './knowledge/Lisbon.json';
import London from './knowledge/London.json';
import Paris from './knowledge/Paris.json';
import Prague from './knowledge/Prague.json';
import Rome from './knowledge/Rome.json';
import Tokyo from './knowledge/Tokyo.json';

/**
 * A frozen, read-only snapshot of the internal research knowledge base
 * (server/data/research/*.json), bundled into the app so the "ניהול" admin
 * tab has something real to show on the static demo build (e.g. GitHub
 * Pages), which has no live backend to query. Live editing still requires a
 * real server — see AdminScreen's demo banner.
 */
export const snapshotDestinations: AdminDestinationFull[] = [
  Amsterdam,
  Athens,
  Bangkok,
  Barcelona,
  Dubai,
  Istanbul,
  Lisbon,
  London,
  Paris,
  Prague,
  Rome,
  Tokyo,
] as unknown as AdminDestinationFull[];

export const snapshotSummaries: AdminDestinationSummary[] = snapshotDestinations.map((d) => ({
  destination: d.destination,
  country: d.country,
  flag: d.flag,
  researchedAt: d.researchedAt,
  summaryHe: d.summaryHe,
  itemCount: Object.values(d.categories).reduce((sum, items) => sum + (items?.length ?? 0), 0),
}));

export function findSnapshot(destination: string): AdminDestinationFull | null {
  return snapshotDestinations.find((d) => d.destination === destination) ?? null;
}
