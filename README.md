# Triporia — טריפוריה 🧳

AI-powered vacation planner that builds a **complete trip around your budget**:
flights, hotel, restaurants, transport (public / rental car) and attractions — all
in one place. The user enters their preferences once and comes out with an
organized, budget-fitted vacation.

> Status: **backend MVP** (Node + Express + Claude) is built and tested.
> The Expo (React Native for Web) app that implements the mobile/web UI is the
> next milestone.

## What it does

1. The user fills a wizard: where / when (fixed or flexible dates), party
   (solo / couple / family + kids' ages), trip vibe (relaxation, attractions,
   nightlife, food, nature, culture, mixed), transport preference, total budget,
   and any special requests (free text, e.g. "kosher-friendly", "near the beach").
2. The **budget engine** splits the budget across categories based on the vibe
   and party, then **trims and ranks** the provider options into a short list.
3. Provider adapters gather real options — **flights** (Kiwi), **hotels**
   (Booking), **restaurants / attractions / transport** (Google Places) — plus
   **live insights** from forums & reviews (SerpAPI → RAG).
4. Only the trimmed short list + retrieved insights are sent to **Claude**, which
   assembles a day-by-day itinerary with reasoning and tips.
5. The result: 3 ranked destination **proposals** (best match / max savings /
   exact budget) and, when one is opened, a full itinerary + budget breakdown.

## Architecture

```
                 ┌────────── providers (real API OR sample fallback) ──────────┐
  TripRequest →  │  flights(Kiwi)  hotels(Booking)  places(Google)  insights   │
                 └───────────────┬─────────────────────────────┬───────────────┘
                                 │ gather + cache (Redis/memory)│
                                 ▼                              ▼
                        Budget Engine (allocate + trim)   Vector store (RAG)
                                 │                              │
                                 └──────────────┬───────────────┘
                                                ▼
                                     Claude (itinerary + reasoning)
                                                ▼
                                        TripPlan / ProposalSummary
```

**Design principle: interfaces + graceful fallback everywhere.** The server runs
with **zero API keys** using curated sample data and a deterministic planner, and
upgrades to live APIs + Claude the moment you set the matching environment
variables. Cache, vector store and database each default to in-memory and swap to
Redis / Pinecone-Chroma / Postgres via env.

## Project layout

```
server/
  src/
    index.ts               Express app + CORS + /health
    config.ts              env-driven configuration
    types.ts               domain model (TripRequest, TripPlan, ProposalSummary…)
    routes/plan.ts         /api/proposals, /api/plan, /api/trips
    services/
      budget.ts            allocation + trimming (keeps Claude prompts small/cheap)
      proposals.ts         3 ranked proposals (no Claude — fast & cheap)
      planner.ts           full pipeline for one destination
      gather.ts            provider fetch + cache (shared)
      ai.ts                Claude call + strict-JSON parsing
      fallbackPlanner.ts   deterministic planner when no ANTHROPIC_API_KEY
      vectorStore.ts       RAG retrieval (memory; Pinecone/Chroma-ready)
      cache.ts             Redis or in-memory
      repository.ts        saved trips (Postgres-ready; in-memory default)
    providers/
      flights.ts hotels.ts places.ts insights.ts sampleData.ts
```

## API

| Method | Path              | Purpose |
| ------ | ----------------- | ------- |
| GET    | `/health`         | status + which AI/providers are active |
| POST   | `/api/proposals`  | 3 ranked destination proposals (cheap, no Claude) |
| POST   | `/api/plan`       | full itinerary for one destination (uses Claude) |
| POST   | `/api/trips`      | save a generated plan |
| GET    | `/api/trips/:id`  | fetch a saved plan |

Example:

```bash
curl -X POST http://localhost:4000/api/proposals \
  -H 'Content-Type: application/json' \
  -d '{"origin":"TLV","destination":null,"destinationHints":["europe","food"],
       "nights":6,"adults":2,"vibe":"food","transport":"public",
       "budgetTotal":4000,"currency":"USD","language":"he"}'
```

## Getting started

```bash
cp .env.example .env          # optionally add API keys
npm install
npm run dev                   # server on http://localhost:4000
npm test --workspace server   # budget-engine unit tests
```

With no keys set, everything works on sample data + the deterministic planner.
Add `ANTHROPIC_API_KEY` to enable Claude; add `KIWI_API_KEY`,
`GOOGLE_PLACES_API_KEY`, `SERPAPI_KEY`, etc. to go live per provider.

## Design system (from the product mockups)

- **Brand:** Triporia / טריפוריה, RTL Hebrew, `Rubik` + Material Symbols.
- **Material-3 palette:** primary teal `#00685f`, tertiary `#994100`, surface
  `#f8f9ff`, on-surface `#0b1c30`.
- **App shell:** bottom nav — תכנון חופשה (wizard) · הצעות AI (results) ·
  פירוט ותקציב (budget) · מסלול יומי (itinerary); ₪/$ currency toggle.
- Screens map 1:1 to the endpoints above.

## Roadmap

- [ ] **Expo (React Native for Web)** app: the 4 screens above from a single
      codebase (web + iOS + Android).
- [ ] Wire real providers (Kiwi / Booking / Google) once keys are provisioned.
- [ ] Postgres persistence + Redis cache + Pinecone/Chroma vector store.
- [ ] "Swap with AI" and "re-pace day" interactive endpoints.
- [ ] Multi-city trips (e.g. Lisbon + Porto), weather, export to PDF/Excel.
- [ ] Auth & user profiles / saved-trip history.
