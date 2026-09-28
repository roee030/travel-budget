#!/usr/bin/env node
/**
 * Validates every file in data/research/ against the DestinationKnowledge
 * schema and prints a summary. Run with: npx tsx scripts/validate-research.ts
 * (from server/). Exits non-zero if any file fails to parse.
 */
import { readdir, readFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { DestinationKnowledgeSchema } from '../src/types/knowledge.js';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DATA_DIR = path.resolve(__dirname, '../data/research');

async function main() {
  const files = (await readdir(DATA_DIR)).filter((f) => f.endsWith('.json'));
  if (files.length === 0) {
    console.log('No research files found in', DATA_DIR);
    return;
  }

  let ok = 0;
  let failed = 0;
  let totalItems = 0;
  let totalSourced = 0;

  for (const file of files.sort()) {
    const raw = await readFile(path.join(DATA_DIR, file), 'utf-8');
    try {
      const parsed = DestinationKnowledgeSchema.parse(JSON.parse(raw));
      const counts = Object.entries(parsed.categories).map(([k, v]) => `${k}:${v?.length ?? 0}`);
      const itemCount = Object.values(parsed.categories).reduce((s, v) => s + (v?.length ?? 0), 0);
      const sourcedCount = Object.values(parsed.categories)
        .flat()
        .filter((i) => i && i.sources && i.sources.length > 0).length;
      totalItems += itemCount;
      totalSourced += sourcedCount;
      const unsourced = itemCount - sourcedCount;
      console.log(
        `✅ ${file.padEnd(16)} ${parsed.flag} ${parsed.destination.padEnd(12)} ${itemCount} items (${sourcedCount} sourced${unsourced ? `, ${unsourced} unsourced` : ''}) — ${counts.join(' ')}`,
      );
      ok++;
    } catch (err) {
      console.error(`❌ ${file}: ${(err as Error).message}`);
      failed++;
    }
  }

  console.log(`\n${ok} valid, ${failed} failed. ${totalItems} total items, ${totalSourced} with citations (${Math.round((totalSourced / Math.max(1, totalItems)) * 100)}%).`);
  if (failed > 0) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
