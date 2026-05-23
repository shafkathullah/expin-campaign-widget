import express from 'express';
import cors from 'cors';
import { generateCreators } from './seed.js';

const PORT = 4000;
const app = express();

app.use(cors());
app.use(express.json());

// In-memory store. Reset on server restart.
let creators = generateCreators(50);

// ---------------------------------------------------------------------------
// GET /creators?campaignId=demo
// Returns the full list of creators with current metrics.
// ---------------------------------------------------------------------------
app.get('/creators', (req, res) => {
  const campaignId = req.query.campaignId || 'demo';
  // Small artificial latency so loading states are visible
  setTimeout(() => {
    res.json({ campaignId, creators });
  }, 200 + Math.random() * 300);
});

// ---------------------------------------------------------------------------
// GET /stream?campaignId=demo
// Server-Sent Events stream. Pushes one creator's updated metrics every 2–5s.
// Updates apply to creators with postStatus === 'live'.
// Pending creators stay at zero; completed creators stay frozen.
// ---------------------------------------------------------------------------
app.get('/stream', (req, res) => {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');
  res.flushHeaders();

  // Send a comment immediately so the client knows the connection is open
  res.write(': connected\n\n');

  // Keepalive — send a comment every 15s so proxies and the client know the connection is healthy
  // even when there are no live creators to push updates for.
  const keepalive = setInterval(() => {
    res.write(': keepalive\n\n');
  }, 15000);

  const tick = () => {
    const liveCreators = creators.filter((c) => c.postStatus === 'live');
    if (liveCreators.length === 0) {
      scheduleNext();
      return;
    }

    const target = liveCreators[Math.floor(Math.random() * liveCreators.length)];

    // Realistic-ish delta: views grow, conversions grow slightly slower, rate drifts
    const viewDelta = Math.floor(Math.random() * 400) + 20;
    const newViews = target.views + viewDelta;
    const rateDrift = (Math.random() - 0.5) * 0.005;
    const newRate = Math.max(0.001, Math.min(0.25, target.conversionRate + rateDrift));
    const newConversions = Math.round(newViews * newRate);

    // Mutate the in-memory record so subsequent GET /creators reflects the latest state
    target.views = newViews;
    target.conversions = newConversions;
    target.conversionRate = parseFloat(newRate.toFixed(4));

    const payload = {
      creatorId: target.id,
      views: target.views,
      conversions: target.conversions,
      conversionRate: target.conversionRate,
    };

    res.write(`data: ${JSON.stringify(payload)}\n\n`);

    scheduleNext();
  };

  let timeoutId;
  const scheduleNext = () => {
    const delay = 2000 + Math.random() * 3000; // 2–5 seconds
    timeoutId = setTimeout(tick, delay);
  };

  scheduleNext();

  // Cleanup on disconnect
  req.on('close', () => {
    if (timeoutId) clearTimeout(timeoutId);
    clearInterval(keepalive);
  });
});

// ---------------------------------------------------------------------------
// POST /creators/:id/boost
// Randomly succeeds (70%) or fails (30%) after 1–3 seconds of latency.
// ---------------------------------------------------------------------------
app.post('/creators/:id/boost', (req, res) => {
  const { id } = req.params;
  const creator = creators.find((c) => c.id === id);

  if (!creator) {
    return res.status(404).json({ ok: false, error: 'Creator not found' });
  }

  if (creator.boosted) {
    return res.status(409).json({ ok: false, error: 'Creator is already boosted' });
  }

  const latency = 1000 + Math.random() * 2000;
  const willSucceed = Math.random() < 0.7;

  setTimeout(() => {
    if (willSucceed) {
      creator.boosted = true;
      res.json({ ok: true, creator });
    } else {
      res.status(500).json({ ok: false, error: 'Boost failed — try again' });
    }
  }, latency);
});

// ---------------------------------------------------------------------------
// Health check
// ---------------------------------------------------------------------------
app.get('/health', (_req, res) => {
  res.json({ ok: true, creators: creators.length });
});

app.listen(PORT, () => {
  console.log(`[mock-server] Running on http://localhost:${PORT}`);
  console.log(`[mock-server] ${creators.length} creators seeded`);
  console.log(`[mock-server] Endpoints:`);
  console.log(`  GET  /creators?campaignId=demo`);
  console.log(`  GET  /stream?campaignId=demo  (SSE)`);
  console.log(`  POST /creators/:id/boost`);
});
