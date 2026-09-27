import assert from 'node:assert/strict';
import { test } from 'node:test';
import { allocateBudget, trimToBudget } from './budget.ts';
import { sampleDestinationData } from '../providers/sampleData.ts';
import { TripRequestSchema } from '../types.ts';

function req(overrides: Record<string, unknown> = {}) {
  return TripRequestSchema.parse({
    origin: 'TLV',
    destination: 'Barcelona',
    budgetTotal: 3000,
    nights: 5,
    ...overrides,
  });
}

test('allocation sums to the total budget', () => {
  const alloc = allocateBudget(req());
  const sum = Object.values(alloc).reduce((s, v) => s + v, 0);
  // Rounding can drift by a few units; assert within 1% of total.
  assert.ok(Math.abs(sum - 3000) < 30, `sum ${sum} should be ~3000`);
});

test('relaxation skews budget toward the hotel vs attractions', () => {
  const relax = allocateBudget(req({ vibe: 'relaxation' }));
  const sights = allocateBudget(req({ vibe: 'attractions' }));
  assert.ok(relax.hotel > sights.hotel, 'relaxation hotel > attractions hotel');
  assert.ok(sights.attractions > relax.attractions, 'attractions activities > relaxation');
});

test('rental_car preference shifts money into transport', () => {
  const base = allocateBudget(req({ transport: 'public' }));
  const car = allocateBudget(req({ transport: 'rental_car' }));
  assert.ok(car.transport > base.transport, 'car transport budget is larger');
});

test('trimming produces a short list and hides nightlife for families with kids', () => {
  const request = req({ partyType: 'family', adults: 2, children: [{ age: 4 }, { age: 7 }] });
  const alloc = allocateBudget(request);
  const data = sampleDestinationData(request, 'Barcelona');
  const trimmed = trimToBudget(request, alloc, data);

  assert.ok(trimmed.flights.length <= 3, 'at most 3 flights');
  assert.ok(trimmed.hotels.length <= 4, 'at most 4 hotels');
  assert.equal(trimmed.nightlife.length, 0, 'no nightlife when young kids are present');
  assert.ok(trimmed.attractions.every((a) => a.kidFriendly), 'attractions are kid-friendly');
});
