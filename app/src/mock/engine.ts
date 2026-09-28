import type {
  BudgetAllocation,
  ItineraryDay,
  ItineraryItem,
  ProposalStrategy,
  ProposalSummary,
  TripPlan,
  TripRequest,
  TripVibe,
} from '../types';
import { CATALOG, findDestination, airlineDomain, type MockDestination, type MockPlace } from './catalog';

// ── currency: catalog is USD; convert to the user's currency for display ──
function fx(currency: string): number {
  return currency === 'ILS' ? 3.7 : 1;
}

// ── seeded RNG so a given input yields stable-but-varied output ──
function hash(s: string): number {
  let h = 1779033703 ^ s.length;
  for (let i = 0; i < s.length; i++) {
    h = Math.imul(h ^ s.charCodeAt(i), 3432918353);
    h = (h << 13) | (h >>> 19);
  }
  return h >>> 0;
}
function rng(seed: number) {
  let a = seed;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const VIBE_WEIGHTS: Record<TripVibe, Omit<BudgetAllocation, 'buffer'>> = {
  relaxation: { flights: 0.28, hotel: 0.42, food: 0.16, attractions: 0.08, transport: 0.06 },
  attractions: { flights: 0.3, hotel: 0.26, food: 0.16, attractions: 0.22, transport: 0.06 },
  nightlife: { flights: 0.28, hotel: 0.28, food: 0.2, attractions: 0.16, transport: 0.08 },
  food: { flights: 0.28, hotel: 0.28, food: 0.3, attractions: 0.08, transport: 0.06 },
  nature: { flights: 0.3, hotel: 0.26, food: 0.16, attractions: 0.16, transport: 0.12 },
  culture: { flights: 0.3, hotel: 0.28, food: 0.16, attractions: 0.2, transport: 0.06 },
  mixed: { flights: 0.3, hotel: 0.3, food: 0.18, attractions: 0.16, transport: 0.06 },
};
const BUFFER_RATIO = 0.08;
const round = (n: number) => Math.round(n);

/** Blend the weights of every selected vibe (simple average) so a multi-vibe
 * trip (e.g. relaxation + food) balances both instead of picking just one. */
function blendedVibeWeights(vibes: TripVibe[]): Omit<BudgetAllocation, 'buffer'> {
  const list = vibes.length ? vibes : ['mixed' as TripVibe];
  const keys: (keyof Omit<BudgetAllocation, 'buffer'>)[] = ['flights', 'hotel', 'food', 'attractions', 'transport'];
  const sum: Omit<BudgetAllocation, 'buffer'> = { flights: 0, hotel: 0, food: 0, attractions: 0, transport: 0 };
  for (const v of list) {
    const w = VIBE_WEIGHTS[v] ?? VIBE_WEIGHTS.mixed;
    for (const k of keys) sum[k] += w[k];
  }
  for (const k of keys) sum[k] /= list.length;
  return sum;
}

export function allocate(request: TripRequest): BudgetAllocation {
  const spendable = request.budgetTotal * (1 - BUFFER_RATIO);
  const w = blendedVibeWeights(request.vibes);
  const a: BudgetAllocation = {
    flights: round(spendable * w.flights),
    hotel: round(spendable * w.hotel),
    food: round(spendable * w.food),
    attractions: round(spendable * w.attractions),
    transport: round(spendable * w.transport),
    buffer: round(request.budgetTotal * BUFFER_RATIO),
  };
  if (request.transport === 'rental_car') {
    const shift = Math.min(a.attractions * 0.25, a.transport);
    a.attractions -= round(shift);
    a.transport += round(shift);
  }
  return a;
}

const STRATEGIES: ProposalStrategy[] = ['best_match', 'max_savings', 'exact_budget'];

function pickCandidates(request: TripRequest): MockDestination[] {
  if (request.destination) {
    const d = findDestination(request.destination);
    if (d) return [d, d, d];
  }
  const hints = request.destinationHints.map((h) => h.toLowerCase());
  const wanted = new Set<string>([...hints, ...request.vibes]);
  const scored = CATALOG.map((d) => {
    let score = d.tags.reduce((s, t) => s + (wanted.has(t) ? 2 : 0), 0);
    score += Math.random() * 0.001; // stable enough; tie-break
    return { d, score };
  });
  scored.sort((a, b) => b.score - a.score);
  const top = scored.map((s) => s.d);
  return top.slice(0, 3).length === 3 ? top.slice(0, 3) : CATALOG.slice(0, 3);
}

/** Generates a realistic, browsable list of flight options across the destination's
 * airlines — a direct pricier option and cheaper 1-stop options — each carrying an
 * airline logo domain for display. */
function buildFlightOptions(d: MockDestination, request: TripRequest, rate: number, heads: number) {
  const base = d.baseFlight * heads * rate;
  return d.airlines.map((airline, i): import('../types').FlightOption => {
    const stops = i === 0 ? 0 : i === 1 ? 1 : 1;
    const priceFactor = i === 0 ? 1.15 : i === 1 ? 1 : 0.82;
    const durationBase = 180 + Math.round(d.baseFlight / 3);
    return {
      id: `flt-${d.key}-${i}`,
      airline,
      stops,
      price: round(base * priceFactor),
      currency: request.currency,
      durationMinutes: durationBase + stops * 110,
      from: request.origin,
      to: d.key,
      logoDomain: airlineDomain(airline),
      departTime: ['06:15', '10:40', '14:05'][i % 3],
    };
  });
}

function pickHotel(d: MockDestination, request: TripRequest, strategy: ProposalStrategy, nightlyBudget: number) {
  const withKids = request.children.length > 0;
  const pool = d.hotels.filter((h) => !withKids || h.familyFriendly || h.stars >= 3);
  const hs = pool.length ? pool : d.hotels;
  if (strategy === 'max_savings') return [...hs].sort((a, b) => a.pricePerNight - b.pricePerNight)[0];
  if (strategy === 'exact_budget')
    return (
      [...hs].filter((h) => h.pricePerNight <= nightlyBudget * 1.2).sort((a, b) => b.pricePerNight - a.pricePerNight)[0] ??
      [...hs].sort((a, b) => a.pricePerNight - b.pricePerNight)[0]
    );
  const inBudget = hs.filter((h) => h.pricePerNight <= nightlyBudget * 1.1);
  return [...(inBudget.length ? inBudget : hs)].sort((a, b) => b.rating - a.rating)[0];
}

export function generateProposals(request: TripRequest): ProposalSummary[] {
  const dests = pickCandidates(request);
  const rate = fx(request.currency);
  const heads = request.adults + request.children.length;
  const alloc = allocate(request);
  const nights = request.nights;

  const proposals = dests.map((d, i) => {
    const strategy = STRATEGIES[i % 3];
    const nightlyBudgetUsd = alloc.hotel / Math.max(1, nights) / rate;
    const hotel = pickHotel(d, request, strategy, nightlyBudgetUsd);
    const flightOptions = buildFlightOptions(d, request, rate, heads);
    const chosenFlight =
      strategy === 'max_savings'
        ? [...flightOptions].sort((a, b) => a.price - b.price)[0]
        : strategy === 'exact_budget'
          ? [...flightOptions].sort((a, b) => b.price - a.price)[0]
          : flightOptions.find((f) => f.stops === 0) ?? flightOptions[0];
    const factor = strategy === 'max_savings' ? 0.75 : strategy === 'exact_budget' ? 1.15 : 1;

    const avgMeal = d.restaurants.reduce((s, r) => s + r.cost, 0) / d.restaurants.length;
    const avgAttr = d.attractions.reduce((s, a) => s + a.cost, 0) / d.attractions.length;

    const estimatedSpend: BudgetAllocation = {
      flights: chosenFlight.price,
      hotel: round(hotel.pricePerNight * rate * nights),
      food: round(avgMeal * heads * 2 * nights * rate * factor),
      attractions: round(avgAttr * heads * 1.5 * nights * rate * factor),
      transport: round((request.transport === 'rental_car' ? 45 : 10) * heads * nights * rate),
      buffer: alloc.buffer,
    };
    const estimatedTotal = Object.values(estimatedSpend).reduce((s, v) => s + v, 0);
    const leftover = round(request.budgetTotal - estimatedTotal);

    const util = estimatedTotal / request.budgetTotal;
    const budgetFit = util > 1 ? Math.max(0, 1 - (util - 1) * 2) : 1 - Math.abs(0.95 - util);
    const matchScore = Math.round(
      Math.min(100, Math.max(45, (budgetFit * 0.5 + hotel.rating / 10 * 0.3 + 0.2 + (strategy === 'best_match' ? 0.05 : 0)) * 100)),
    );

    const tags: string[] = [];
    tags.push(chosenFlight.stops === 0 ? 'טיסות ישירות' : `${chosenFlight.stops} עצירה`);
    tags.push(`מלון ${hotel.stars}★`);
    if (request.transport === 'rental_car') tags.push('רכב שכור');
    else tags.push('תחבורה ציבורית');
    tags.push(`${Math.min(d.attractions.length, 5)} אטרקציות`);
    if (request.vibes.includes('food')) tags.push('מסלול קולינרי');

    return {
      id: `${d.key}-${strategy}`,
      destination: d.he,
      strategy,
      matchScore,
      currency: request.currency,
      budgetTotal: request.budgetTotal,
      estimatedTotal,
      leftover,
      allocation: alloc,
      estimatedSpend,
      tags: tags.slice(0, 5),
      headlineInsight: d.insights[0] ?? null,
      imageQuery: d.photo,
      topFlight: chosenFlight,
      topHotel: {
        id: `htl-${d.key}`,
        name: hotel.name,
        area: hotel.area,
        stars: hotel.stars,
        rating: hotel.rating,
        pricePerNight: round(hotel.pricePerNight * rate),
        currency: request.currency,
        familyFriendly: hotel.familyFriendly,
      },
    } satisfies ProposalSummary;
  });

  proposals.sort((a, b) => b.matchScore - a.matchScore);
  return proposals;
}

const HOURS = ['09:30', '11:30', '13:30', '16:00', '20:00', '22:30'];

function placeItem(time: string, category: string, p: MockPlace, rate: number, heads: number): ItineraryItem {
  const cost = round(p.cost * rate * (category === 'restaurant' ? heads : 1));
  return {
    time,
    category,
    title: p.name,
    description: `${p.area} · ${p.tags.join(', ')}`,
    estimatedCost: cost,
    refId: `${category}-${p.name}`,
    rating: p.rating,
    social: p.social,
    imageQuery: p.imageQ,
    swappable: category === 'restaurant' || category === 'attraction',
  };
}

export function generatePlan(request: TripRequest, destinationName: string): TripPlan {
  const d = findDestination(destinationName) ?? CATALOG[0];
  const rate = fx(request.currency);
  const heads = request.adults + request.children.length;
  const withKids = request.children.length > 0;
  const alloc = allocate(request);
  const r = rng(hash(d.key + request.vibes.join(',') + request.nights + request.budgetTotal));

  const hotel = pickHotel(d, request, 'best_match', alloc.hotel / Math.max(1, request.nights) / rate);
  const flightOptions = buildFlightOptions(d, request, rate, heads);
  const selectedFlight = flightOptions.find((f) => f.stops === 0) ?? flightOptions[0];
  const attractions = shuffle([...d.attractions], r);
  const restaurants = shuffle([...d.restaurants], r);
  const nightlife = shuffle([...d.nightlife], r);
  const perDay = request.vibes.includes('attractions') ? 3 : request.vibes.length === 1 && request.vibes[0] === 'relaxation' ? 1 : 2;

  const days: ItineraryDay[] = [];
  let ai = 0;
  let ri = 0;
  let ni = 0;
  for (let day = 0; day < request.nights; day++) {
    const items: ItineraryItem[] = [];
    if (day === 0) {
      items.push({
        time: '09:30',
        category: 'flight',
        title: `טיסה ${request.origin} → ${d.key} (${selectedFlight.airline})`,
        description: 'נחיתה, איסוף מזוודות והגעה למלון.',
        estimatedCost: selectedFlight.price,
        refId: selectedFlight.id,
        imageQuery: undefined,
      });
      items.push({
        time: '13:00',
        category: 'hotel',
        title: `צ׳ק-אין: ${hotel.name}`,
        description: `${hotel.stars}★ ב${hotel.area} · ציון אורחים ${hotel.rating}`,
        estimatedCost: round(hotel.pricePerNight * rate),
        refId: `htl-${d.key}`,
      });
    }
    // morning attraction
    if (attractions[ai]) items.push(placeItem(day === 0 ? '16:00' : '10:00', 'attraction', attractions[ai++ % attractions.length], rate, heads));
    // lunch
    if (restaurants[ri]) {
      const it = placeItem('13:30', 'restaurant', restaurants[ri++ % restaurants.length], rate, heads);
      it.title = `צהריים: ${it.title}`;
      items.push(it);
    }
    // afternoon attraction (skip on relaxation)
    if (perDay >= 2 && attractions[ai]) items.push(placeItem('16:30', 'attraction', attractions[ai++ % attractions.length], rate, heads));
    if (perDay >= 3 && attractions[ai]) items.push(placeItem('18:00', 'attraction', attractions[ai++ % attractions.length], rate, heads));
    // dinner
    if (restaurants[ri]) {
      const it = placeItem('20:00', 'restaurant', restaurants[ri++ % restaurants.length], rate, heads);
      it.title = `ערב: ${it.title}`;
      it.tip = d.insights[(day + 1) % d.insights.length];
      items.push(it);
    }
    // nightlife every other night, no young kids
    if (!withKids && day % 2 === 1 && nightlife[ni]) {
      items.push(placeItem('22:30', 'nightlife', nightlife[ni++ % nightlife.length], rate, heads));
    }
    days.push({
      day: day + 1,
      date: null,
      summary: day === 0 ? `הגעה ל${d.key}` : `יום ${day + 1}`,
      items,
    });
  }

  const estimatedSpend = spendFromDays(days, request, alloc);

  return {
    id: `plan-${d.key}-${Date.now()}`,
    createdAt: new Date().toISOString(),
    request,
    destination: d.he,
    currency: request.currency,
    budgetTotal: request.budgetTotal,
    allocation: alloc,
    estimatedSpend,
    selectedFlight,
    flightOptions,
    selectedHotel: {
      id: `htl-${d.key}`,
      name: hotel.name,
      area: hotel.area,
      stars: hotel.stars,
      rating: hotel.rating,
      pricePerNight: round(hotel.pricePerNight * rate),
      currency: request.currency,
      familyFriendly: hotel.familyFriendly,
    },
    days,
    rationale: `המסלול נבנה לפי אופי "${vibeLabel(request.vibes)}" ובתוך התקציב, עם איזון בין אטרקציות, ארוחות ומנוחה ב${d.key}.`,
    tips: d.insights,
    usedSampleData: true,
  };
}

function spendFromDays(days: ItineraryDay[], request: TripRequest, alloc: BudgetAllocation): BudgetAllocation {
  const sum = (cat: string) => days.flatMap((d) => d.items).filter((i) => i.category === cat).reduce((s, i) => s + i.estimatedCost, 0);
  const hotelNights = days.flatMap((d) => d.items).find((i) => i.category === 'hotel');
  const hotelTotal = (hotelNights?.estimatedCost ?? 0) * request.nights;
  return {
    flights: sum('flight'),
    hotel: hotelTotal,
    food: sum('restaurant'),
    attractions: sum('attraction') + sum('nightlife'),
    transport: alloc.transport,
    buffer: alloc.buffer,
  };
}

// ── interactive "AI" actions (mocked) ──

/** Swap one itinerary item for a fresh pick from the same catalog category. */
export function swapPlanItem(plan: TripPlan, dayIndex: number, itemIndex: number): TripPlan {
  const d = findDestination(plan.destination) ?? CATALOG[0];
  const rate = fx(plan.currency);
  const heads = plan.request.adults + plan.request.children.length;
  const day = plan.days[dayIndex];
  const item = day?.items[itemIndex];
  if (!item) return plan;
  const pool = item.category === 'restaurant' ? d.restaurants : item.category === 'attraction' ? d.attractions : d.nightlife;
  const used = new Set(plan.days.flatMap((dd) => dd.items).map((i) => i.title.replace(/^(צהריים|ערב): /, '')));
  const candidates = pool.filter((p) => !used.has(p.name));
  const pick = (candidates.length ? candidates : pool)[Math.floor(Math.random() * (candidates.length ? candidates.length : pool.length))];
  const prefix = item.title.startsWith('צהריים:') ? 'צהריים: ' : item.title.startsWith('ערב:') ? 'ערב: ' : '';
  const swapped = placeItem(item.time, item.category, pick, rate, heads);
  swapped.title = prefix + swapped.title;
  swapped.tip = item.tip;
  const newItems = [...day.items];
  newItems[itemIndex] = swapped;
  const newDays = [...plan.days];
  newDays[dayIndex] = { ...day, items: newItems };
  return { ...plan, days: newDays, estimatedSpend: spendFromDays(newDays, plan.request, plan.allocation) };
}

/** Loosen (fewer items) or tighten (more items) a given day. */
export function repaceDay(plan: TripPlan, dayIndex: number, mode: 'relax' | 'intense'): TripPlan {
  const d = findDestination(plan.destination) ?? CATALOG[0];
  const rate = fx(plan.currency);
  const heads = plan.request.adults + plan.request.children.length;
  const day = plan.days[dayIndex];
  if (!day) return plan;
  let items = [...day.items];
  if (mode === 'relax') {
    // drop one attraction (keep flight/hotel/meals)
    const idx = items.map((i, n) => ({ i, n })).filter((x) => x.i.category === 'attraction').pop()?.n;
    if (idx !== undefined) items.splice(idx, 1);
  } else {
    // add one more attraction not already used that day
    const usedTitles = new Set(items.map((i) => i.title));
    const extra = d.attractions.find((a) => !usedTitles.has(a.name));
    if (extra) {
      const it = placeItem('18:30', 'attraction', extra, rate, heads);
      const dinnerIdx = items.findIndex((i) => i.time === '20:00');
      if (dinnerIdx >= 0) items.splice(dinnerIdx, 0, it);
      else items.push(it);
    }
  }
  const newDays = [...plan.days];
  newDays[dayIndex] = { ...day, items };
  return { ...plan, days: newDays, estimatedSpend: spendFromDays(newDays, plan.request, plan.allocation) };
}

// ── utils ──
function shuffle<T>(arr: T[], rand: () => number): T[] {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}
const VIBE_LABELS: Record<TripVibe, string> = {
  relaxation: 'בטן-גב',
  attractions: 'אטרקציות',
  nightlife: 'חיי לילה',
  food: 'קולינרי',
  nature: 'טבע',
  culture: 'תרבות',
  mixed: 'קצת מהכל',
};
function vibeLabel(vibes: TripVibe[]): string {
  if (!vibes.length) return 'מעורב';
  return vibes.map((v) => VIBE_LABELS[v] ?? v).join(' + ');
}
