import express from 'express';
import cors from 'cors';
import { config, hasAnthropic } from './config.js';
import { planRouter } from './routes/plan.js';
import { adminRouter } from './routes/admin.js';

const app = express();

app.use(express.json({ limit: '1mb' }));
app.use(
  cors({
    origin: (origin, cb) => {
      // Allow no-origin (curl, native apps) and any configured origin.
      if (!origin || config.corsOrigins.includes(origin) || config.corsOrigins.includes('*')) {
        return cb(null, true);
      }
      cb(null, false);
    },
  }),
);

app.get('/health', (_req, res) => {
  res.json({
    status: 'ok',
    ai: hasAnthropic() ? 'claude' : 'fallback-planner',
    sampleData: config.useSampleData,
  });
});

app.use('/api', planRouter);
// Internal knowledge-base admin API — open for now (no auth), see routes/admin.ts.
app.use('/api/admin', adminRouter);

app.listen(config.port, () => {
  console.log(`\n🧳 Trip Budget Planner API listening on http://localhost:${config.port}`);
  console.log(`   AI: ${hasAnthropic() ? `Claude (${config.anthropic.model})` : 'deterministic fallback (set ANTHROPIC_API_KEY to enable Claude)'}`);
  console.log(`   Providers: flights=${config.providers.kiwiApiKey ? 'kiwi' : 'sample'}, hotels=${config.providers.bookingApiKey ? 'booking' : 'sample'}, places=${config.providers.googlePlacesApiKey ? 'google' : 'sample'}, insights=${config.providers.serpApiKey ? 'serpapi' : 'sample'}`);
});
