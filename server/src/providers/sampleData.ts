import type {
  DestinationData,
  FlightOption,
  HotelOption,
  Insight,
  PlaceOption,
  TripRequest,
} from '../types.js';

/**
 * Curated, believable sample data so the whole product works end-to-end with
 * zero API keys. Each provider falls back to the slice it needs from here.
 * The numbers are illustrative — real providers replace them once keys exist.
 */

interface DestinationSeed {
  name: string;
  airlines: string[];
  baseFlightPrice: number; // per person, round trip
  areas: string[];
  hotels: Array<Omit<HotelOption, 'id' | 'provider' | 'currency'>>;
  restaurants: Array<Omit<PlaceOption, 'id' | 'provider' | 'currency' | 'category'>>;
  attractions: Array<Omit<PlaceOption, 'id' | 'provider' | 'currency' | 'category'>>;
  nightlife: Array<Omit<PlaceOption, 'id' | 'provider' | 'currency' | 'category'>>;
  insights: Array<Omit<Insight, 'id'>>;
}

const SEEDS: Record<string, DestinationSeed> = {
  Barcelona: {
    name: 'Barcelona',
    airlines: ['Vueling', 'Iberia', 'Wizz Air'],
    baseFlightPrice: 180,
    areas: ['Eixample', 'Gothic Quarter', 'Barceloneta', 'Gràcia'],
    hotels: [
      { name: 'Hotel Sixtytwo', area: 'Eixample', stars: 4, rating: 8.7, reviewCount: 2100, pricePerNight: 165, amenities: ['wifi', 'breakfast', 'central'], familyFriendly: true },
      { name: 'Barceló Raval', area: 'El Raval', stars: 4, rating: 8.5, reviewCount: 3400, pricePerNight: 140, amenities: ['rooftop pool', 'wifi'], familyFriendly: true },
      { name: 'Pensió 2000', area: 'Gothic Quarter', stars: 2, rating: 8.1, reviewCount: 900, pricePerNight: 85, amenities: ['wifi', 'budget'], familyFriendly: false },
      { name: 'W Barcelona', area: 'Barceloneta', stars: 5, rating: 8.9, reviewCount: 5200, pricePerNight: 380, amenities: ['beachfront', 'spa', 'pool'], familyFriendly: true },
    ],
    restaurants: [
      { name: 'Cervecería Catalana', area: 'Eixample', rating: 4.5, reviewCount: 12000, priceLevel: 2, estimatedCost: 28, tags: ['tapas', 'local'], kidFriendly: true },
      { name: 'Bar del Pla', area: 'Born', rating: 4.6, reviewCount: 4300, priceLevel: 2, estimatedCost: 32, tags: ['tapas', 'wine'], kidFriendly: false },
      { name: 'Can Solé', area: 'Barceloneta', rating: 4.4, reviewCount: 2800, priceLevel: 3, estimatedCost: 55, tags: ['paella', 'seafood'], kidFriendly: true },
      { name: 'Bo de B', area: 'Gothic Quarter', rating: 4.7, reviewCount: 6100, priceLevel: 1, estimatedCost: 12, tags: ['sandwiches', 'cheap eats'], kidFriendly: true },
    ],
    attractions: [
      { name: 'Sagrada Família', area: 'Eixample', rating: 4.8, reviewCount: 210000, priceLevel: 2, estimatedCost: 33, tags: ['landmark', 'gaudí', 'must-see'], kidFriendly: true },
      { name: 'Park Güell', area: 'Gràcia', rating: 4.6, reviewCount: 150000, priceLevel: 1, estimatedCost: 14, tags: ['park', 'gaudí', 'views'], kidFriendly: true },
      { name: 'Casa Batlló', area: 'Eixample', rating: 4.7, reviewCount: 90000, priceLevel: 2, estimatedCost: 35, tags: ['gaudí', 'architecture'], kidFriendly: true },
      { name: 'Barceloneta Beach', area: 'Barceloneta', rating: 4.3, reviewCount: 60000, priceLevel: 0, estimatedCost: 0, tags: ['beach', 'relax'], kidFriendly: true },
      { name: 'Montjuïc Cable Car', area: 'Montjuïc', rating: 4.4, reviewCount: 22000, priceLevel: 1, estimatedCost: 15, tags: ['views', 'ride'], kidFriendly: true },
    ],
    nightlife: [
      { name: 'Paradiso', area: 'Born', rating: 4.6, reviewCount: 8000, priceLevel: 3, estimatedCost: 45, tags: ['cocktails', 'speakeasy'], kidFriendly: false },
      { name: 'Opium Beach Club', area: 'Barceloneta', rating: 4.0, reviewCount: 12000, priceLevel: 3, estimatedCost: 60, tags: ['club', 'beach'], kidFriendly: false },
    ],
    insights: [
      { source: 'reddit', title: 'Skip the Sagrada line', snippet: 'Book Sagrada Família tickets online at least a week ahead — same-day tickets are almost always sold out in summer.', score: 0.94 },
      { source: 'blog', title: 'Eixample is the sweet spot', snippet: 'Staying in Eixample keeps you walkable to Gaudí sights and metro, quieter than the Gothic Quarter at night.', score: 0.88 },
      { source: 'google', title: 'Watch pickpockets on La Rambla', snippet: 'La Rambla and metro line 3 are pickpocket hotspots; keep bags zipped and in front.', score: 0.83 },
    ],
  },
  Lisbon: {
    name: 'Lisbon',
    airlines: ['TAP Air Portugal', 'easyJet', 'Ryanair'],
    baseFlightPrice: 210,
    areas: ['Baixa', 'Alfama', 'Bairro Alto', 'Belém'],
    hotels: [
      { name: 'Memmo Alfama', area: 'Alfama', stars: 4, rating: 9.0, reviewCount: 3100, pricePerNight: 190, amenities: ['rooftop', 'views', 'wifi'], familyFriendly: false },
      { name: 'Hotel Mundial', area: 'Baixa', stars: 4, rating: 8.4, reviewCount: 4500, pricePerNight: 130, amenities: ['central', 'rooftop bar'], familyFriendly: true },
      { name: 'Lisbon Story Guesthouse', area: 'Baixa', stars: 2, rating: 8.8, reviewCount: 1600, pricePerNight: 70, amenities: ['budget', 'wifi'], familyFriendly: false },
    ],
    restaurants: [
      { name: 'Time Out Market', area: 'Cais do Sodré', rating: 4.4, reviewCount: 45000, priceLevel: 2, estimatedCost: 25, tags: ['food hall', 'variety'], kidFriendly: true },
      { name: 'Cervejaria Ramiro', area: 'Intendente', rating: 4.6, reviewCount: 18000, priceLevel: 3, estimatedCost: 45, tags: ['seafood', 'local'], kidFriendly: true },
      { name: 'Pastéis de Belém', area: 'Belém', rating: 4.5, reviewCount: 60000, priceLevel: 1, estimatedCost: 8, tags: ['pastry', 'iconic'], kidFriendly: true },
    ],
    attractions: [
      { name: 'Belém Tower', area: 'Belém', rating: 4.6, reviewCount: 80000, priceLevel: 1, estimatedCost: 8, tags: ['landmark', 'history'], kidFriendly: true },
      { name: 'Tram 28 ride', area: 'Alfama', rating: 4.3, reviewCount: 40000, priceLevel: 1, estimatedCost: 3, tags: ['tram', 'views'], kidFriendly: true },
      { name: 'São Jorge Castle', area: 'Alfama', rating: 4.5, reviewCount: 55000, priceLevel: 1, estimatedCost: 15, tags: ['castle', 'views'], kidFriendly: true },
      { name: 'Oceanário de Lisboa', area: 'Parque das Nações', rating: 4.7, reviewCount: 70000, priceLevel: 2, estimatedCost: 25, tags: ['aquarium', 'family'], kidFriendly: true },
    ],
    nightlife: [
      { name: 'Pensão Amor', area: 'Cais do Sodré', rating: 4.4, reviewCount: 9000, priceLevel: 2, estimatedCost: 30, tags: ['bar', 'quirky'], kidFriendly: false },
      { name: 'Pink Street bars', area: 'Cais do Sodré', rating: 4.1, reviewCount: 15000, priceLevel: 2, estimatedCost: 35, tags: ['bars', 'crawl'], kidFriendly: false },
    ],
    insights: [
      { source: 'reddit', title: 'Lisbon is hilly — pack good shoes', snippet: 'The city is steep. Use trams/funiculars and stay central to save your legs, especially with kids.', score: 0.9 },
      { source: 'blog', title: 'Day trip to Sintra', snippet: 'Sintra is a must and only ~40 min by train from Rossio; go early to beat crowds at Pena Palace.', score: 0.92 },
    ],
  },
  Bangkok: {
    name: 'Bangkok',
    airlines: ['Thai Airways', 'EL AL', 'Emirates'],
    baseFlightPrice: 650,
    areas: ['Sukhumvit', 'Silom', 'Riverside', 'Old City'],
    hotels: [
      { name: 'Riva Surya', area: 'Riverside', stars: 4, rating: 8.8, reviewCount: 4200, pricePerNight: 95, amenities: ['pool', 'river view'], familyFriendly: true },
      { name: 'Ibis Sukhumvit 4', area: 'Sukhumvit', stars: 3, rating: 8.3, reviewCount: 6000, pricePerNight: 45, amenities: ['central', 'wifi'], familyFriendly: true },
      { name: 'Mandarin Oriental', area: 'Riverside', stars: 5, rating: 9.3, reviewCount: 3800, pricePerNight: 420, amenities: ['luxury', 'spa', 'river'], familyFriendly: true },
    ],
    restaurants: [
      { name: 'Jay Fai', area: 'Old City', rating: 4.5, reviewCount: 9000, priceLevel: 3, estimatedCost: 40, tags: ['street food', 'michelin'], kidFriendly: false },
      { name: 'Thipsamai Pad Thai', area: 'Old City', rating: 4.4, reviewCount: 22000, priceLevel: 1, estimatedCost: 6, tags: ['pad thai', 'iconic'], kidFriendly: true },
      { name: 'Gaggan Anand', area: 'Sukhumvit', rating: 4.7, reviewCount: 5000, priceLevel: 4, estimatedCost: 180, tags: ['fine dining', 'tasting'], kidFriendly: false },
    ],
    attractions: [
      { name: 'Grand Palace', area: 'Old City', rating: 4.6, reviewCount: 120000, priceLevel: 2, estimatedCost: 15, tags: ['temple', 'must-see'], kidFriendly: true },
      { name: 'Wat Arun', area: 'Riverside', rating: 4.7, reviewCount: 70000, priceLevel: 1, estimatedCost: 3, tags: ['temple', 'views'], kidFriendly: true },
      { name: 'Chatuchak Market', area: 'Chatuchak', rating: 4.4, reviewCount: 90000, priceLevel: 1, estimatedCost: 10, tags: ['market', 'shopping'], kidFriendly: true },
      { name: 'Chao Phraya river boat', area: 'Riverside', rating: 4.3, reviewCount: 30000, priceLevel: 1, estimatedCost: 5, tags: ['boat', 'views'], kidFriendly: true },
    ],
    nightlife: [
      { name: 'Sky Bar (Lebua)', area: 'Silom', rating: 4.3, reviewCount: 25000, priceLevel: 4, estimatedCost: 50, tags: ['rooftop', 'views'], kidFriendly: false },
      { name: 'Khao San Road', area: 'Old City', rating: 4.0, reviewCount: 40000, priceLevel: 1, estimatedCost: 20, tags: ['street', 'backpacker'], kidFriendly: false },
    ],
    insights: [
      { source: 'reddit', title: 'Use the BTS/MRT to beat traffic', snippet: 'Bangkok traffic is brutal; stay near a BTS Skytrain stop (Sukhumvit/Silom) and use it instead of taxis at rush hour.', score: 0.93 },
      { source: 'google', title: 'Dress code for temples', snippet: 'Cover shoulders and knees at the Grand Palace and temples or you will be turned away / have to rent a cover-up.', score: 0.87 },
    ],
  },
};

const DEFAULT_SEED_KEYS = Object.keys(SEEDS);

function pickSeed(destination: string): DestinationSeed {
  const key = DEFAULT_SEED_KEYS.find(
    (k) => k.toLowerCase() === destination.trim().toLowerCase(),
  );
  if (key) return SEEDS[key];
  // Generic seed derived from the requested destination name.
  return genericSeed(destination);
}

function genericSeed(destination: string): DestinationSeed {
  const d = destination || 'Your Destination';
  return {
    name: d,
    airlines: ['Local Air', 'EuroJet', 'Global Wings'],
    baseFlightPrice: 300,
    areas: ['City Center', 'Old Town', 'Waterfront', 'Uptown'],
    hotels: [
      { name: `${d} Central Hotel`, area: 'City Center', stars: 4, rating: 8.5, reviewCount: 1500, pricePerNight: 140, amenities: ['central', 'wifi', 'breakfast'], familyFriendly: true },
      { name: `${d} Boutique Stay`, area: 'Old Town', stars: 3, rating: 8.2, reviewCount: 800, pricePerNight: 95, amenities: ['charming', 'wifi'], familyFriendly: false },
      { name: `${d} Grand Resort`, area: 'Waterfront', stars: 5, rating: 9.0, reviewCount: 2600, pricePerNight: 320, amenities: ['pool', 'spa', 'sea view'], familyFriendly: true },
      { name: `${d} Budget Inn`, area: 'Uptown', stars: 2, rating: 7.9, reviewCount: 600, pricePerNight: 60, amenities: ['budget', 'wifi'], familyFriendly: true },
    ],
    restaurants: [
      { name: 'The Local Table', area: 'Old Town', rating: 4.5, reviewCount: 3000, priceLevel: 2, estimatedCost: 30, tags: ['local', 'traditional'], kidFriendly: true },
      { name: 'Harbor Grill', area: 'Waterfront', rating: 4.4, reviewCount: 2200, priceLevel: 3, estimatedCost: 50, tags: ['seafood', 'view'], kidFriendly: true },
      { name: 'Street Bites Market', area: 'City Center', rating: 4.6, reviewCount: 5000, priceLevel: 1, estimatedCost: 12, tags: ['street food', 'variety'], kidFriendly: true },
    ],
    attractions: [
      { name: `${d} Old Town Walk`, area: 'Old Town', rating: 4.5, reviewCount: 8000, priceLevel: 0, estimatedCost: 0, tags: ['walk', 'history'], kidFriendly: true },
      { name: `${d} National Museum`, area: 'City Center', rating: 4.4, reviewCount: 6000, priceLevel: 1, estimatedCost: 15, tags: ['museum', 'culture'], kidFriendly: true },
      { name: `${d} Waterfront Park`, area: 'Waterfront', rating: 4.6, reviewCount: 12000, priceLevel: 0, estimatedCost: 0, tags: ['park', 'relax'], kidFriendly: true },
      { name: `${d} Viewpoint`, area: 'Uptown', rating: 4.7, reviewCount: 9000, priceLevel: 1, estimatedCost: 10, tags: ['views', 'photo'], kidFriendly: true },
    ],
    nightlife: [
      { name: 'Skyline Lounge', area: 'City Center', rating: 4.3, reviewCount: 4000, priceLevel: 3, estimatedCost: 40, tags: ['rooftop', 'cocktails'], kidFriendly: false },
      { name: 'Old Town Pub Crawl', area: 'Old Town', rating: 4.1, reviewCount: 3000, priceLevel: 2, estimatedCost: 30, tags: ['bars', 'social'], kidFriendly: false },
    ],
    insights: [
      { source: 'blog', title: 'Stay central to save on transport', snippet: `Basing yourself in ${d} city center keeps most sights walkable and cuts taxi costs.`, score: 0.8 },
      { source: 'reddit', title: 'Book popular restaurants ahead', snippet: 'Top-rated spots fill up — reserve a day or two in advance, especially on weekends.', score: 0.78 },
    ],
  };
}

function party(request: TripRequest): number {
  return request.adults + request.children.length;
}

export function sampleDestinationData(
  request: TripRequest,
  destination: string,
): DestinationData {
  const seed = pickSeed(destination);
  const heads = party(request);
  const cur = request.currency;

  const flights: FlightOption[] = seed.airlines.map((airline, i) => {
    const perPerson = Math.round(seed.baseFlightPrice * (0.8 + i * 0.35));
    return {
      id: `flt_${slug(seed.name)}_${i}`,
      provider: 'sample',
      from: request.origin,
      to: seed.name,
      departAt: request.departDate ?? isoInMonth(request.targetMonth),
      returnAt: request.returnDate ?? null,
      airline,
      stops: i === 0 ? 0 : 1,
      durationMinutes: 180 + i * 90,
      price: perPerson * heads,
      currency: cur,
    };
  });

  const hotels: HotelOption[] = seed.hotels.map((h, i) => ({
    ...h,
    id: `htl_${slug(seed.name)}_${i}`,
    provider: 'sample',
    currency: cur,
  }));

  const toPlace =
    (category: PlaceOption['category']) =>
    (p: Omit<PlaceOption, 'id' | 'provider' | 'currency' | 'category'>, i: number): PlaceOption => ({
      ...p,
      id: `plc_${category}_${slug(seed.name)}_${i}`,
      provider: 'sample',
      currency: cur,
      category,
    });

  const restaurants = seed.restaurants.map(toPlace('restaurant'));
  const attractions = seed.attractions.map(toPlace('attraction'));
  const nightlife = seed.nightlife.map(toPlace('nightlife'));

  const transport: PlaceOption[] = [
    { id: `trn_metro_${slug(seed.name)}`, provider: 'sample', category: 'transport', name: 'Public transport day pass', area: seed.areas[0], rating: 4.3, reviewCount: 0, priceLevel: 1, estimatedCost: 8, tags: ['metro', 'bus'], kidFriendly: true, currency: cur },
    { id: `trn_car_${slug(seed.name)}`, provider: 'sample', category: 'transport', name: 'Rental car (per day)', area: seed.areas[0], rating: 4.1, reviewCount: 0, priceLevel: 2, estimatedCost: 45, tags: ['car', 'flexible'], kidFriendly: true, currency: cur },
    { id: `trn_taxi_${slug(seed.name)}`, provider: 'sample', category: 'transport', name: 'Airport transfer', area: seed.areas[0], rating: 4.0, reviewCount: 0, priceLevel: 2, estimatedCost: 35, tags: ['taxi', 'transfer'], kidFriendly: true, currency: cur },
  ];

  const insights: Insight[] = seed.insights.map((ins, i) => ({
    ...ins,
    id: `ins_${slug(seed.name)}_${i}`,
  }));

  return {
    destination: seed.name,
    flights,
    hotels,
    restaurants,
    attractions,
    nightlife,
    transport,
    insights,
  };
}

/** Candidate destinations when the user leaves the destination open. */
export function sampleDestinationCandidates(request: TripRequest): string[] {
  const hints = request.destinationHints.map((h) => h.toLowerCase());
  const all = DEFAULT_SEED_KEYS;
  if (hints.length === 0) return all.slice(0, 3);
  // Very light "matching": warm → Barcelona/Bangkok, europe → Barcelona/Lisbon.
  const scored = all.map((name) => {
    const seed = SEEDS[name];
    let score = 0;
    for (const hint of hints) {
      if (hint.includes('beach') && seed.attractions.some((a) => a.tags.includes('beach'))) score += 2;
      if (hint.includes('warm') && ['Barcelona', 'Bangkok'].includes(name)) score += 1;
      if (hint.includes('europe') && ['Barcelona', 'Lisbon'].includes(name)) score += 2;
      if (hint.includes('food') && seed.restaurants.length > 2) score += 1;
    }
    return { name, score };
  });
  scored.sort((a, b) => b.score - a.score);
  return scored.map((s) => s.name).slice(0, 3);
}

function slug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
}

function isoInMonth(month: number | null): string {
  const now = new Date();
  const m = month ?? ((now.getMonth() + 2) % 12) + 1;
  const year = m <= now.getMonth() + 1 ? now.getFullYear() + 1 : now.getFullYear();
  return `${year}-${String(m).padStart(2, '0')}-15`;
}
