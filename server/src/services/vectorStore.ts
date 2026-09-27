import { config } from '../config.js';

/**
 * Minimal vector-store abstraction for RAG. The default MemoryVectorStore uses
 * a dependency-free bag-of-words cosine similarity so retrieval works out of
 * the box; Pinecone/Chroma adapters (which use real embeddings) slot in behind
 * the same interface when VECTOR_STORE is switched and a key is provided.
 */
export interface VectorDoc {
  id: string;
  text: string;
  metadata?: Record<string, unknown>;
}

export interface ScoredDoc extends VectorDoc {
  score: number;
}

export interface VectorStore {
  upsert(namespace: string, docs: VectorDoc[]): Promise<void>;
  query(namespace: string, text: string, k: number): Promise<ScoredDoc[]>;
}

class MemoryVectorStore implements VectorStore {
  private ns = new Map<string, VectorDoc[]>();

  async upsert(namespace: string, docs: VectorDoc[]): Promise<void> {
    const existing = this.ns.get(namespace) ?? [];
    const byId = new Map(existing.map((d) => [d.id, d]));
    for (const d of docs) byId.set(d.id, d);
    this.ns.set(namespace, [...byId.values()]);
  }

  async query(namespace: string, text: string, k: number): Promise<ScoredDoc[]> {
    const docs = this.ns.get(namespace) ?? [];
    const q = termFreq(tokenize(text));
    const scored = docs.map((d) => ({
      ...d,
      score: cosine(q, termFreq(tokenize(d.text))),
    }));
    scored.sort((a, b) => b.score - a.score);
    return scored.slice(0, k);
  }
}

let instance: VectorStore | null = null;

export async function getVectorStore(): Promise<VectorStore> {
  if (instance) return instance;

  if (config.vector.store !== 'memory') {
    console.warn(
      `[vector] VECTOR_STORE=${config.vector.store} requested but the adapter is not wired yet — using in-memory store. ` +
        'Add a Pinecone/Chroma adapter behind the VectorStore interface to enable it.',
    );
  }
  instance = new MemoryVectorStore();
  return instance;
}

// ── tiny text-similarity helpers ─────────────────────────

function tokenize(s: string): string[] {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9֐-׿\s]/g, ' ')
    .split(/\s+/)
    .filter((t) => t.length > 2);
}

function termFreq(tokens: string[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const t of tokens) m.set(t, (m.get(t) ?? 0) + 1);
  return m;
}

function cosine(a: Map<string, number>, b: Map<string, number>): number {
  let dot = 0;
  for (const [t, av] of a) {
    const bv = b.get(t);
    if (bv) dot += av * bv;
  }
  const magA = Math.sqrt([...a.values()].reduce((s, v) => s + v * v, 0));
  const magB = Math.sqrt([...b.values()].reduce((s, v) => s + v * v, 0));
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}
