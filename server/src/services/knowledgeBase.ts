import { readdir, readFile, writeFile, mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { randomUUID } from 'node:crypto';
import {
  DestinationKnowledgeSchema,
  KnowledgeItemSchema,
  type DestinationKnowledge,
  type KnowledgeItem,
  type PlaceCategoryKey,
} from '../types/knowledge.js';

/**
 * The internal knowledge base: loads every `data/research/<Destination>.json`
 * file into memory at startup, and persists admin writes straight back to
 * those same files — so it survives restarts without needing a real database
 * yet. This is intentionally simple (file-backed, no auth — "open to
 * everyone" per the current product stage) and swaps for a real DB later
 * without changing the API shape.
 */

// Resolve relative to this module's own location (server/src/services/), not
// process.cwd() — the server can be started from the repo root or from
// server/, and cwd-based resolution would silently point at the wrong
// directory (and, in dev via tsx, at src/ instead of the built dist/).
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../../data/research');

class KnowledgeBase {
  private byDestination = new Map<string, DestinationKnowledge>();
  private loaded = false;

  async ensureLoaded(): Promise<void> {
    if (this.loaded) return;
    await mkdir(DATA_DIR, { recursive: true });
    let files: string[] = [];
    try {
      files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
    } catch {
      files = [];
    }
    for (const file of files) {
      try {
        const raw = await readFile(path.join(DATA_DIR, file), 'utf-8');
        const parsed = DestinationKnowledgeSchema.parse(JSON.parse(raw));
        this.byDestination.set(parsed.destination, parsed);
      } catch (err) {
        console.warn(`[knowledgeBase] failed to load ${file}:`, (err as Error).message);
      }
    }
    this.loaded = true;
    console.log(`[knowledgeBase] loaded ${this.byDestination.size} destination(s) from ${DATA_DIR}`);
  }

  list(): DestinationKnowledge[] {
    return [...this.byDestination.values()];
  }

  get(destination: string): DestinationKnowledge | undefined {
    return this.byDestination.get(destination);
  }

  private async persist(entry: DestinationKnowledge): Promise<void> {
    const file = path.join(DATA_DIR, `${entry.destination}.json`);
    await mkdir(DATA_DIR, { recursive: true });
    await writeFile(file, JSON.stringify(entry, null, 2), 'utf-8');
  }

  async upsertDestination(entry: DestinationKnowledge): Promise<DestinationKnowledge> {
    const parsed = DestinationKnowledgeSchema.parse(entry);
    this.byDestination.set(parsed.destination, parsed);
    await this.persist(parsed);
    return parsed;
  }

  async deleteDestination(destination: string): Promise<boolean> {
    const existed = this.byDestination.delete(destination);
    return existed;
  }

  async upsertItem(
    destination: string,
    category: PlaceCategoryKey,
    item: Partial<KnowledgeItem> & { id?: string },
  ): Promise<{ entry: DestinationKnowledge; item: KnowledgeItem } | null> {
    const entry = this.byDestination.get(destination);
    if (!entry) return null;
    const id = item.id ?? randomUUID();
    const parsedItem = KnowledgeItemSchema.parse({ ...item, id });
    const list = entry.categories[category] ?? [];
    const idx = list.findIndex((i) => i.id === id);
    const nextList = [...list];
    if (idx >= 0) nextList[idx] = parsedItem;
    else nextList.push(parsedItem);
    const nextEntry: DestinationKnowledge = {
      ...entry,
      categories: { ...entry.categories, [category]: nextList },
    };
    this.byDestination.set(destination, nextEntry);
    await this.persist(nextEntry);
    return { entry: nextEntry, item: parsedItem };
  }

  async deleteItem(destination: string, category: PlaceCategoryKey, id: string): Promise<boolean> {
    const entry = this.byDestination.get(destination);
    if (!entry) return false;
    const list = entry.categories[category] ?? [];
    const nextList = list.filter((i) => i.id !== id);
    if (nextList.length === list.length) return false;
    const nextEntry: DestinationKnowledge = {
      ...entry,
      categories: { ...entry.categories, [category]: nextList },
    };
    this.byDestination.set(destination, nextEntry);
    await this.persist(nextEntry);
    return true;
  }
}

let instance: KnowledgeBase | null = null;

export function getKnowledgeBase(): KnowledgeBase {
  if (!instance) instance = new KnowledgeBase();
  return instance;
}
