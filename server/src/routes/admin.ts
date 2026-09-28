import { Router } from 'express';
import { ZodError } from 'zod';
import { getKnowledgeBase } from '../services/knowledgeBase.js';
import { DestinationKnowledgeSchema, KnowledgeItemSchema, PlaceCategoryKey } from '../types/knowledge.js';

/**
 * Admin CRUD for the internal knowledge base (destinations + categorized
 * places). Intentionally open — no auth yet. This is a placeholder product
 * stage, not a security decision: gate this behind real auth before this API
 * is exposed publicly with write access on a hosted deployment.
 */
export const adminRouter = Router();

adminRouter.use(async (_req, _res, next) => {
  await getKnowledgeBase().ensureLoaded();
  next();
});

// ── destinations ──

adminRouter.get('/destinations', (_req, res) => {
  const list = getKnowledgeBase()
    .list()
    .map((d) => ({
      destination: d.destination,
      country: d.country,
      flag: d.flag,
      researchedAt: d.researchedAt,
      summaryHe: d.summaryHe,
      itemCount: Object.values(d.categories).reduce((s, arr) => s + (arr?.length ?? 0), 0),
    }));
  res.json({ destinations: list });
});

adminRouter.get('/destinations/:destination', (req, res) => {
  const entry = getKnowledgeBase().get(req.params.destination);
  if (!entry) return res.status(404).json({ error: 'not_found' });
  res.json(entry);
});

adminRouter.put('/destinations/:destination', async (req, res) => {
  try {
    const entry = DestinationKnowledgeSchema.parse({ ...req.body, destination: req.params.destination });
    const saved = await getKnowledgeBase().upsertDestination(entry);
    res.json(saved);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: 'invalid_body', issues: err.issues });
    console.error('[admin] upsertDestination failed:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

adminRouter.delete('/destinations/:destination', async (req, res) => {
  const deleted = await getKnowledgeBase().deleteDestination(req.params.destination);
  if (!deleted) return res.status(404).json({ error: 'not_found' });
  res.status(204).end();
});

// ── items within a destination/category ──

adminRouter.put('/destinations/:destination/:category/items/:id', async (req, res) => {
  const category = PlaceCategoryKey.safeParse(req.params.category);
  if (!category.success) return res.status(400).json({ error: 'invalid_category' });
  try {
    const item = KnowledgeItemSchema.partial().parse({ ...req.body, id: req.params.id });
    const result = await getKnowledgeBase().upsertItem(req.params.destination, category.data, item);
    if (!result) return res.status(404).json({ error: 'destination_not_found' });
    res.json(result.item);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: 'invalid_body', issues: err.issues });
    console.error('[admin] upsertItem failed:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

adminRouter.post('/destinations/:destination/:category/items', async (req, res) => {
  const category = PlaceCategoryKey.safeParse(req.params.category);
  if (!category.success) return res.status(400).json({ error: 'invalid_category' });
  try {
    const item = KnowledgeItemSchema.partial().parse(req.body);
    const result = await getKnowledgeBase().upsertItem(req.params.destination, category.data, item);
    if (!result) return res.status(404).json({ error: 'destination_not_found' });
    res.status(201).json(result.item);
  } catch (err) {
    if (err instanceof ZodError) return res.status(400).json({ error: 'invalid_body', issues: err.issues });
    console.error('[admin] createItem failed:', err);
    res.status(500).json({ error: 'internal_error' });
  }
});

adminRouter.delete('/destinations/:destination/:category/items/:id', async (req, res) => {
  const category = PlaceCategoryKey.safeParse(req.params.category);
  if (!category.success) return res.status(400).json({ error: 'invalid_category' });
  const deleted = await getKnowledgeBase().deleteItem(req.params.destination, category.data, req.params.id);
  if (!deleted) return res.status(404).json({ error: 'not_found' });
  res.status(204).end();
});
