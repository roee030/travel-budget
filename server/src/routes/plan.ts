import { Router } from 'express';
import { ZodError } from 'zod';
import { TripRequestSchema } from '../types.js';
import { planTrip } from '../services/planner.js';
import { generateProposals } from '../services/proposals.js';
import { getRepository } from '../services/repository.js';

export const planRouter = Router();

/** POST /api/proposals — cheap, Claude-free ranked destination proposals. */
planRouter.post('/proposals', async (req, res) => {
  let request;
  try {
    request = TripRequestSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'invalid_request', issues: err.issues });
    }
    throw err;
  }

  try {
    const proposals = await generateProposals(request);
    res.json({ proposals });
  } catch (err) {
    console.error('[proposals] failed:', err);
    res.status(500).json({ error: 'proposals_failed', message: (err as Error).message });
  }
});

/** POST /api/plan — build a full trip plan from the wizard input. */
planRouter.post('/plan', async (req, res) => {
  let request;
  try {
    request = TripRequestSchema.parse(req.body);
  } catch (err) {
    if (err instanceof ZodError) {
      return res.status(400).json({ error: 'invalid_request', issues: err.issues });
    }
    throw err;
  }

  try {
    const plan = await planTrip(request);
    res.json(plan);
  } catch (err) {
    console.error('[plan] failed:', err);
    res.status(500).json({ error: 'planning_failed', message: (err as Error).message });
  }
});

/** POST /api/trips — save a generated plan. */
planRouter.post('/trips', async (req, res) => {
  const repo = getRepository();
  const plan = req.body;
  if (!plan?.id) return res.status(400).json({ error: 'missing_plan' });
  const saved = await repo.save(plan);
  res.status(201).json(saved);
});

/** GET /api/trips/:id — fetch a saved plan. */
planRouter.get('/trips/:id', async (req, res) => {
  const repo = getRepository();
  const plan = await repo.get(req.params.id);
  if (!plan) return res.status(404).json({ error: 'not_found' });
  res.json(plan);
});
