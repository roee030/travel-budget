// Slim mirror of the server's domain model (the fields the app consumes).

export type TripVibe =
  | 'relaxation'
  | 'attractions'
  | 'nightlife'
  | 'food'
  | 'nature'
  | 'culture'
  | 'mixed';

export type PartyType = 'solo' | 'couple' | 'family' | 'friends';
export type TransportPreference = 'public' | 'rental_car' | 'mixed' | 'walk';
export type ProposalStrategy = 'best_match' | 'max_savings' | 'exact_budget';

export interface TripRequest {
  origin: string;
  destination: string | null;
  destinationHints: string[];
  departDate: string | null;
  returnDate: string | null;
  flexibleDates: boolean;
  targetMonth: number | null;
  nights: number;
  partyType: PartyType;
  adults: number;
  children: { age: number }[];
  vibe: TripVibe;
  transport: TransportPreference;
  budgetTotal: number;
  currency: string;
  specialRequests: string;
  language: 'he' | 'en';
}

export type BudgetCategory =
  | 'flights'
  | 'hotel'
  | 'food'
  | 'attractions'
  | 'transport'
  | 'buffer';
export type BudgetAllocation = Record<BudgetCategory, number>;

export interface FlightOption {
  id: string;
  airline: string;
  stops: number;
  price: number;
  currency: string;
  durationMinutes: number;
  from: string;
  to: string;
}
export interface HotelOption {
  id: string;
  name: string;
  area: string;
  stars: number;
  rating: number;
  pricePerNight: number;
  currency: string;
  familyFriendly: boolean;
}

export interface ProposalSummary {
  id: string;
  destination: string;
  strategy: ProposalStrategy;
  matchScore: number;
  currency: string;
  budgetTotal: number;
  estimatedTotal: number;
  leftover: number;
  allocation: BudgetAllocation;
  estimatedSpend: BudgetAllocation;
  tags: string[];
  headlineInsight: string | null;
  imageQuery: string;
  topFlight: FlightOption | null;
  topHotel: HotelOption | null;
}

export interface ItineraryItem {
  time: string;
  category: string;
  title: string;
  description: string;
  estimatedCost: number;
  refId?: string;
}
export interface ItineraryDay {
  day: number;
  date: string | null;
  summary: string;
  items: ItineraryItem[];
}

export interface TripPlan {
  id: string;
  createdAt: string;
  request: TripRequest;
  destination: string;
  currency: string;
  budgetTotal: number;
  allocation: BudgetAllocation;
  estimatedSpend: BudgetAllocation;
  selectedFlight: FlightOption | null;
  selectedHotel: HotelOption | null;
  days: ItineraryDay[];
  rationale: string;
  tips: string[];
  usedSampleData: boolean;
}
