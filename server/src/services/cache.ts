import { config } from '../config.js';

/**
 * A tiny cache abstraction. Defaults to an in-process Map so the server runs
 * with zero infrastructure; when REDIS_URL is set it lazily loads ioredis.
 * Keeping provider + AI results here is what stops us from burning API budget
 * on every screen refresh.
 */
export interface Cache {
  get<T>(key: string): Promise<T | null>;
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>;
}

class MemoryCache implements Cache {
  private store = new Map<string, { value: unknown; expiresAt: number }>();

  async get<T>(key: string): Promise<T | null> {
    const hit = this.store.get(key);
    if (!hit) return null;
    if (hit.expiresAt !== 0 && hit.expiresAt < Date.now()) {
      this.store.delete(key);
      return null;
    }
    return hit.value as T;
  }

  async set<T>(key: string, value: T, ttlSeconds = config.cache.ttlSeconds): Promise<void> {
    const expiresAt = ttlSeconds > 0 ? Date.now() + ttlSeconds * 1000 : 0;
    this.store.set(key, { value, expiresAt });
  }
}

class RedisCache implements Cache {
  // Loosely typed to avoid a hard dependency on ioredis types.
  constructor(private client: any) {}

  async get<T>(key: string): Promise<T | null> {
    const raw = await this.client.get(key);
    return raw ? (JSON.parse(raw) as T) : null;
  }

  async set<T>(key: string, value: T, ttlSeconds = config.cache.ttlSeconds): Promise<void> {
    const raw = JSON.stringify(value);
    if (ttlSeconds > 0) await this.client.set(key, raw, 'EX', ttlSeconds);
    else await this.client.set(key, raw);
  }
}

let instance: Cache | null = null;

export async function getCache(): Promise<Cache> {
  if (instance) return instance;

  if (config.cache.redisUrl) {
    try {
      // Dynamic import keeps ioredis optional until someone actually uses Redis.
      const { default: Redis } = await import('ioredis' as string);
      const client = new Redis(config.cache.redisUrl);
      instance = new RedisCache(client);
      console.log('[cache] using Redis');
      return instance;
    } catch (err) {
      console.warn(
        '[cache] REDIS_URL set but ioredis not available — falling back to memory. Install with `npm i ioredis -w server`.',
      );
    }
  }

  instance = new MemoryCache();
  return instance;
}

/** Build a stable cache key from a namespace and an arbitrary payload. */
export function cacheKey(namespace: string, payload: unknown): string {
  return `${namespace}:${stableStringify(payload)}`;
}

function stableStringify(value: unknown): string {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map(stableStringify).join(',')}]`;
  const keys = Object.keys(value as Record<string, unknown>).sort();
  return `{${keys
    .map((k) => `${JSON.stringify(k)}:${stableStringify((value as Record<string, unknown>)[k])}`)
    .join(',')}}`;
}
