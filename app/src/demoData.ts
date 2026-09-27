// Auto-generated demo fixtures captured from the Triporia backend sample data.
// Used when no EXPO_PUBLIC_API_URL is configured (e.g. the GitHub Pages build)
// or when the live API is unreachable, so the site stays fully browsable.
// Flight/hotel objects are reduced to the fields the app-side slim types (./types) declare.
import type { ProposalSummary, TripPlan } from "./types";

export const demoProposals: ProposalSummary[] = [
  {
    "id": "30d017d9-f095-4b20-8b5c-be2bf34a695b",
    "destination": "Bangkok",
    "strategy": "exact_budget",
    "matchScore": 75,
    "currency": "ILS",
    "budgetTotal": 12500,
    "estimatedTotal": 6177,
    "leftover": 6323,
    "allocation": {
      "flights": 3450,
      "hotel": 3450,
      "food": 2070,
      "attractions": 1840,
      "transport": 690,
      "buffer": 1000
    },
    "estimatedSpend": {
      "flights": 1040,
      "hotel": 2100,
      "food": 1808,
      "attractions": 149,
      "transport": 80,
      "buffer": 1000
    },
    "tags": [
      "טיסות ישירות",
      "מלון 5★",
      "4 אטרקציות"
    ],
    "headlineInsight": "Bangkok traffic is brutal; stay near a BTS Skytrain stop (Sukhumvit/Silom) and use it instead of taxis at rush hour.",
    "imageQuery": "Bangkok travel skyline",
    "topFlight": {
      "id": "flt_bangkok_0",
      "airline": "Thai Airways",
      "stops": 0,
      "price": 1040,
      "currency": "ILS",
      "durationMinutes": 180,
      "from": "TLV",
      "to": "Bangkok"
    },
    "topHotel": {
      "id": "htl_bangkok_2",
      "name": "Mandarin Oriental",
      "area": "Riverside",
      "stars": 5,
      "rating": 9.3,
      "pricePerNight": 420,
      "currency": "ILS",
      "familyFriendly": true
    }
  },
  {
    "id": "a46636f4-b999-4006-a92f-69b089e76d05",
    "destination": "Barcelona",
    "strategy": "best_match",
    "matchScore": 71,
    "currency": "ILS",
    "budgetTotal": 12500,
    "estimatedTotal": 4194,
    "leftover": 8306,
    "allocation": {
      "flights": 3450,
      "hotel": 3450,
      "food": 2070,
      "attractions": 1840,
      "transport": 690,
      "buffer": 1000
    },
    "estimatedSpend": {
      "flights": 288,
      "hotel": 1900,
      "food": 635,
      "attractions": 291,
      "transport": 80,
      "buffer": 1000
    },
    "tags": [
      "טיסות ישירות",
      "מלון 5★",
      "5 אטרקציות"
    ],
    "headlineInsight": "Book Sagrada Família tickets online at least a week ahead — same-day tickets are almost always sold out in summer.",
    "imageQuery": "Barcelona travel skyline",
    "topFlight": {
      "id": "flt_barcelona_0",
      "airline": "Vueling",
      "stops": 0,
      "price": 288,
      "currency": "ILS",
      "durationMinutes": 180,
      "from": "TLV",
      "to": "Barcelona"
    },
    "topHotel": {
      "id": "htl_barcelona_3",
      "name": "W Barcelona",
      "area": "Barceloneta",
      "stars": 5,
      "rating": 8.9,
      "pricePerNight": 380,
      "currency": "ILS",
      "familyFriendly": true
    }
  },
  {
    "id": "8124367d-a458-4670-a764-cc619c69d0b0",
    "destination": "Lisbon",
    "strategy": "max_savings",
    "matchScore": 58,
    "currency": "ILS",
    "budgetTotal": 12500,
    "estimatedTotal": 2299,
    "leftover": 10201,
    "allocation": {
      "flights": 3450,
      "hotel": 3450,
      "food": 2070,
      "attractions": 1840,
      "transport": 690,
      "buffer": 1000
    },
    "estimatedSpend": {
      "flights": 336,
      "hotel": 350,
      "food": 390,
      "attractions": 143,
      "transport": 80,
      "buffer": 1000
    },
    "tags": [
      "טיסות ישירות",
      "מלון 2★",
      "4 אטרקציות"
    ],
    "headlineInsight": "The city is steep. Use trams/funiculars and stay central to save your legs, especially with kids.",
    "imageQuery": "Lisbon travel skyline",
    "topFlight": {
      "id": "flt_lisbon_0",
      "airline": "TAP Air Portugal",
      "stops": 0,
      "price": 336,
      "currency": "ILS",
      "durationMinutes": 180,
      "from": "TLV",
      "to": "Lisbon"
    },
    "topHotel": {
      "id": "htl_lisbon_2",
      "name": "Lisbon Story Guesthouse",
      "area": "Baixa",
      "stars": 2,
      "rating": 8.8,
      "pricePerNight": 70,
      "currency": "ILS",
      "familyFriendly": false
    }
  }
];

export const demoPlan: TripPlan = {
  "id": "a92822c1-7612-467c-b433-09893b6b4e23",
  "createdAt": "2026-09-27T19:27:29.743Z",
  "request": {
    "origin": "TLV",
    "destination": "Bangkok",
    "destinationHints": [
      "europe"
    ],
    "departDate": null,
    "returnDate": null,
    "flexibleDates": true,
    "targetMonth": 9,
    "nights": 5,
    "partyType": "couple",
    "adults": 2,
    "children": [],
    "vibe": "mixed",
    "transport": "mixed",
    "budgetTotal": 12500,
    "currency": "ILS",
    "specialRequests": "",
    "language": "he"
  },
  "destination": "Bangkok",
  "currency": "ILS",
  "budgetTotal": 12500,
  "allocation": {
    "flights": 3450,
    "hotel": 3450,
    "food": 2070,
    "attractions": 1840,
    "transport": 690,
    "buffer": 1000
  },
  "estimatedSpend": {
    "flights": 1040,
    "hotel": 225,
    "food": 1507,
    "attractions": 124,
    "transport": 80,
    "buffer": 1000
  },
  "selectedFlight": {
    "id": "flt_bangkok_0",
    "airline": "Thai Airways",
    "stops": 0,
    "price": 1040,
    "currency": "ILS",
    "durationMinutes": 180,
    "from": "TLV",
    "to": "Bangkok"
  },
  "selectedHotel": {
    "id": "htl_bangkok_0",
    "name": "Riva Surya",
    "area": "Riverside",
    "stars": 4,
    "rating": 8.8,
    "pricePerNight": 95,
    "currency": "ILS",
    "familyFriendly": true
  },
  "days": [
    {
      "day": 1,
      "date": null,
      "summary": "Arrival & first taste of the city",
      "items": [
        {
          "time": "morning",
          "category": "flight",
          "title": "Flight TLV → Bangkok (Thai Airways)",
          "description": "Direct, arrive and check in.",
          "estimatedCost": 1040,
          "refId": "flt_bangkok_0"
        },
        {
          "time": "15:00",
          "category": "hotel",
          "title": "Check in: Riva Surya",
          "description": "4★ in Riverside, guest score 8.8.",
          "estimatedCost": 95,
          "refId": "htl_bangkok_0"
        },
        {
          "time": "10:00",
          "category": "attraction",
          "title": "Wat Arun",
          "description": "Riverside · rating 4.7",
          "estimatedCost": 3,
          "refId": "plc_attraction_bangkok_1"
        },
        {
          "time": "13:00",
          "category": "restaurant",
          "title": "Lunch: Thipsamai Pad Thai",
          "description": "pad thai, iconic · ~6 ILS/person",
          "estimatedCost": 6,
          "refId": "plc_restaurant_bangkok_1"
        },
        {
          "time": "16:00",
          "category": "attraction",
          "title": "Grand Palace",
          "description": "Old City · rating 4.6",
          "estimatedCost": 15,
          "refId": "plc_attraction_bangkok_0"
        },
        {
          "time": "20:00",
          "category": "restaurant",
          "title": "Dinner: Jay Fai",
          "description": "street food, michelin · ~40 ILS/person",
          "estimatedCost": 40,
          "refId": "plc_restaurant_bangkok_0"
        }
      ]
    },
    {
      "day": 2,
      "date": null,
      "summary": "Day 2",
      "items": [
        {
          "time": "10:00",
          "category": "attraction",
          "title": "Chatuchak Market",
          "description": "Chatuchak · rating 4.4",
          "estimatedCost": 10,
          "refId": "plc_attraction_bangkok_2"
        },
        {
          "time": "13:00",
          "category": "restaurant",
          "title": "Lunch: Gaggan Anand",
          "description": "fine dining, tasting · ~180 ILS/person",
          "estimatedCost": 180,
          "refId": "plc_restaurant_bangkok_2"
        },
        {
          "time": "16:00",
          "category": "attraction",
          "title": "Chao Phraya river boat",
          "description": "Riverside · rating 4.3",
          "estimatedCost": 5,
          "refId": "plc_attraction_bangkok_3"
        },
        {
          "time": "22:30",
          "category": "nightlife",
          "title": "Khao San Road",
          "description": "street, backpacker",
          "estimatedCost": 20,
          "refId": "plc_nightlife_bangkok_1"
        }
      ]
    },
    {
      "day": 3,
      "date": null,
      "summary": "Day 3",
      "items": []
    },
    {
      "day": 4,
      "date": null,
      "summary": "Day 4",
      "items": [
        {
          "time": "22:30",
          "category": "nightlife",
          "title": "Sky Bar (Lebua)",
          "description": "rooftop, views",
          "estimatedCost": 50,
          "refId": "plc_nightlife_bangkok_0"
        }
      ]
    },
    {
      "day": 5,
      "date": null,
      "summary": "Day 5",
      "items": []
    }
  ],
  "rationale": "המסלול נבנה אוטומטית לפי התקציב וההעדפות שלך, עם איזון בין אטרקציות, ארוחות ומנוחה.",
  "tips": [
    "Bangkok traffic is brutal; stay near a BTS Skytrain stop (Sukhumvit/Silom) and use it instead of taxis at rush hour.",
    "Cover shoulders and knees at the Grand Palace and temples or you will be turned away / have to rent a cover-up."
  ],
  "usedSampleData": true
};

/** Returns the demo plan with its destination swapped for the requested one. */
export function makeDemoPlan(destination: string): TripPlan {
  return { ...demoPlan, destination };
}
