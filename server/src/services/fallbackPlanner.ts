import type {
  DestinationData,
  ItineraryDay,
  ItineraryItem,
  TripRequest,
} from '../types.js';

export interface PlanCore {
  selectedFlightId: string | null;
  selectedHotelId: string | null;
  days: ItineraryDay[];
  rationale: string;
  tips: string[];
}

/**
 * Deterministic planner used when no Anthropic key is configured (or as a
 * safety net if the AI call fails). It spreads attractions and meals across
 * the nights so the product always returns a coherent itinerary.
 */
export function fallbackPlan(request: TripRequest, data: DestinationData): PlanCore {
  const flight = data.flights[0] ?? null;
  const hotel = data.hotels[0] ?? null;

  const attractions = [...data.attractions];
  const restaurants = [...data.restaurants];
  const nightlife = [...data.nightlife];

  const days: ItineraryDay[] = [];
  for (let d = 0; d < request.nights; d++) {
    const items: ItineraryItem[] = [];

    if (d === 0 && flight) {
      items.push({
        time: 'morning',
        category: 'flight',
        title: `Flight ${flight.from} → ${flight.to} (${flight.airline})`,
        description: `${flight.stops === 0 ? 'Direct' : `${flight.stops} stop(s)`}, arrive and check in.`,
        estimatedCost: flight.price,
        refId: flight.id,
      });
      if (hotel) {
        items.push({
          time: '15:00',
          category: 'hotel',
          title: `Check in: ${hotel.name}`,
          description: `${hotel.stars}★ in ${hotel.area}, guest score ${hotel.rating}.`,
          estimatedCost: hotel.pricePerNight,
          refId: hotel.id,
        });
      }
    }

    const morning = attractions.shift();
    if (morning) {
      items.push({
        time: '10:00',
        category: 'attraction',
        title: morning.name,
        description: `${morning.area} · rating ${morning.rating}`,
        estimatedCost: morning.estimatedCost,
        refId: morning.id,
      });
    }

    const lunch = restaurants.shift();
    if (lunch) {
      items.push({
        time: '13:00',
        category: 'restaurant',
        title: `Lunch: ${lunch.name}`,
        description: `${lunch.tags.join(', ')} · ~${lunch.estimatedCost} ${lunch.currency}/person`,
        estimatedCost: lunch.estimatedCost,
        refId: lunch.id,
      });
    }

    const afternoon = attractions.shift();
    if (afternoon) {
      items.push({
        time: '16:00',
        category: 'attraction',
        title: afternoon.name,
        description: `${afternoon.area} · rating ${afternoon.rating}`,
        estimatedCost: afternoon.estimatedCost,
        refId: afternoon.id,
      });
    }

    const dinner = restaurants.shift();
    if (dinner) {
      items.push({
        time: '20:00',
        category: 'restaurant',
        title: `Dinner: ${dinner.name}`,
        description: `${dinner.tags.join(', ')} · ~${dinner.estimatedCost} ${dinner.currency}/person`,
        estimatedCost: dinner.estimatedCost,
        refId: dinner.id,
      });
    }

    if (request.children.length === 0 && d % 2 === 1) {
      const spot = nightlife.shift();
      if (spot) {
        items.push({
          time: '22:30',
          category: 'nightlife',
          title: spot.name,
          description: `${spot.tags.join(', ')}`,
          estimatedCost: spot.estimatedCost,
          refId: spot.id,
        });
      }
    }

    days.push({
      day: d + 1,
      date: null,
      summary: d === 0 ? 'Arrival & first taste of the city' : `Day ${d + 1}`,
      items,
    });
  }

  const tips = data.insights.slice(0, 4).map((i) => i.snippet);

  return {
    selectedFlightId: flight?.id ?? null,
    selectedHotelId: hotel?.id ?? null,
    days,
    rationale:
      request.language === 'he'
        ? 'המסלול נבנה אוטומטית לפי התקציב וההעדפות שלך, עם איזון בין אטרקציות, ארוחות ומנוחה.'
        : 'This itinerary was assembled automatically from your budget and preferences, balancing sights, meals and downtime.',
    tips,
  };
}
