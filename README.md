# Expin — Campaign Performance Widget (Take-Home Starter)

This is the starter for the Expin Product Engineer (Merchant Web) take-home task.

The task brief was sent to you separately. This README covers **setup only**.

---

## Before you start

You received this as a zip file. To work on the task:

1. **Unzip it somewhere on your machine.**
2. **Create a new GitHub repo** under your account (public, or private with our reviewer invited — username will be sent separately).
3. **Initialize git inside the unzipped folder and push to your new repo:**

```bash
cd expin-campaign-widget-starter
git init
git add .
git commit -m "Initial commit from starter"
git remote add origin <your-new-repo-url>
git push -u origin main
```

From here, commit and push as you build. When you submit, you'll send us the repo URL and the commit SHA you want graded.

---

## What's in here

- `client/` — React 18 + Vite + TypeScript + Tailwind + Shadcn/ui + TanStack Query + Zustand. Empty scaffold; you build the widget here.
- `mock-server/` — Node + Express. Three endpoints (creators list, SSE stream, boost). Runs locally on your machine. **No connection to any Expin infrastructure.**
- Root `package.json` — runs both with one command.

---

## Setup

```bash
# Install dependencies for root, client, and server
npm install
npm --prefix client install
npm --prefix mock-server install

# Run both client and server (in two terminals or via the root script)
npm run dev
```

Then open `http://localhost:5173`. The mock API runs on `http://localhost:4000`.

If port 5173 is already in use, Vite will pick the next available port — check your terminal output for the actual URL.

If you'd rather run them separately:

```bash
# Terminal 1
npm --prefix mock-server run dev

# Terminal 2
npm --prefix client run dev
```

---

## Mock API

The mock server in `mock-server/` ships three endpoints. **All data is fake, generated locally with Faker.js.** No network calls leave your machine.

### `GET /creators?campaignId=demo`

Returns a list of 50 creators with current performance metrics.

Response shape:

```ts
{
  campaignId: string;
  creators: Array<{
    id: string;
    name: string;
    handle: string;
    postStatus: 'pending' | 'live' | 'completed';
    views: number;
    conversions: number;
    conversionRate: number; // 0.0 — 1.0
    boosted: boolean;
  }>;
}
```

### `GET /stream?campaignId=demo`

Server-Sent Events stream. Pushes a metric update every 2–5 seconds.

**Updates only fire for creators with `postStatus === 'live'`.** Pending and completed creators stay frozen. If no creators are currently live, the stream sends keepalive comments every 15s but no data events — this is expected, not a bug.

Each data event is JSON of shape:

```ts
{
  creatorId: string;
  views: number;
  conversions: number;
  conversionRate: number;
}
```

Connect with `EventSource` or any SSE library. The stream stays open until you disconnect.

### `POST /creators/:id/boost`

Marks a creator as boosted. Randomly **succeeds (70%) or fails (30%)** after 1–3 seconds of simulated latency.

On success, returns `{ ok: true, creator: { ...updated } }`. On failure, returns HTTP 500 with `{ ok: false, error: 'string' }`.

If a creator is already boosted, the endpoint returns HTTP 409 with `{ ok: false, error: 'Creator is already boosted' }` — your UI should prevent re-clicking once a boost succeeds.

---

## Tech you have available

The client comes pre-configured with:

- **React 18 + Vite + TypeScript** — Vite dev server, HMR works.
- **Tailwind CSS** — configured with Shadcn CSS variables.
- **Shadcn/ui** — `button`, `input`, `badge`, `select`, `slider`, `sonner` (toaster), `skeleton` are pre-installed in `client/src/components/ui/`. Add more with `npx shadcn@latest add <component>`.
- **TanStack Query** — `QueryClientProvider` is wired up in `main.tsx`. You decide the cache strategy.
- **Zustand** — installed. Create stores as you need them.

What's **not** decided for you:

- The state architecture (you choose what lives in TanStack Query vs Zustand vs URL).
- The streaming integration approach (you choose).
- The folder structure inside `src/` (organize as you would on a real project).
- Whether you use React Hook Form for the filter bar, or roll your own, or use URL state directly.

---

## Reminders

- Submission requires a **GitHub repo + commit SHA + Loom + AI workflow artifacts**. See the task brief for the full list.
- The task brief specifies time, scope, and what we evaluate. This README is setup only.
- Reply to the task email with questions. Aim for one batched question rather than a stream — we're fast but not instant.

Good luck.
