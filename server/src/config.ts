import 'dotenv/config';

function bool(value: string | undefined, fallback = false): boolean {
  if (value === undefined) return fallback;
  return ['1', 'true', 'yes', 'on'].includes(value.toLowerCase());
}

function int(value: string | undefined, fallback: number): number {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

export const config = {
  port: int(process.env.PORT, 4000),
  corsOrigins: (process.env.CORS_ORIGIN ?? 'http://localhost:5173')
    .split(',')
    .map((s) => s.trim())
    .filter(Boolean),

  anthropic: {
    apiKey: process.env.ANTHROPIC_API_KEY ?? '',
    model: process.env.ANTHROPIC_MODEL ?? 'claude-sonnet-5',
  },

  providers: {
    kiwiApiKey: process.env.KIWI_API_KEY ?? '',
    bookingApiKey: process.env.BOOKING_API_KEY ?? '',
    googlePlacesApiKey: process.env.GOOGLE_PLACES_API_KEY ?? '',
    serpApiKey: process.env.SERPAPI_KEY ?? '',
  },

  vector: {
    store: (process.env.VECTOR_STORE ?? 'memory') as 'memory' | 'pinecone' | 'chroma',
    pineconeApiKey: process.env.PINECONE_API_KEY ?? '',
    pineconeIndex: process.env.PINECONE_INDEX ?? 'trip-insights',
    chromaUrl: process.env.CHROMA_URL ?? 'http://localhost:8000',
  },

  cache: {
    redisUrl: process.env.REDIS_URL ?? '',
    ttlSeconds: int(process.env.CACHE_TTL_SECONDS, 86400),
  },

  database: {
    url: process.env.DATABASE_URL ?? '',
  },

  /** Force sample data everywhere, regardless of individual keys. */
  useSampleData: bool(process.env.USE_SAMPLE_DATA, false),
} as const;

/** True when we have a real Anthropic key to call Claude with. */
export const hasAnthropic = () => Boolean(config.anthropic.apiKey);
