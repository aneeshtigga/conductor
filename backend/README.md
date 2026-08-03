# Conductor API

Backend for Conductor — turns a natural-language question over the seeded e-commerce
database into a Claude-generated **read-only** SQL query, executes it, and returns a
narrative answer + table + chart data in the shape the React frontend expects.

## Stack
Node 20 · Express 4 · TypeScript 5 · `@anthropic-ai/sdk` (claude-sonnet-4) · PostgreSQL 15 · `pg` · Vitest.

## Endpoints
| Method | Path | Body | Returns |
|---|---|---|---|
| GET | `/api/datasets` | — | `{ database[], s3[], kafka[] }` |
| POST | `/api/analyze` | `{ dataset: string[], question: string }` | `{ query, answer_text, tableHeaders, tableData, graphData }` |
| GET | `/health` | — | `{ ok: true }` |

Errors: `{ error, code }`.

## LLM provider
- `LLM_PROVIDER=cli` — shells to the local `claude` CLI (uses your Claude Code auth; **no API key**).
  Works only where the CLI is installed + logged in (i.e. your machine), so use it for local dev/demo.
- `LLM_PROVIDER=anthropic` (default) — uses the Anthropic SDK + `ANTHROPIC_API_KEY`; required for cloud
  deploys (Railway) where no `claude` CLI exists.

## Environment
Copy `.env.example` → `.env`:
- `LLM_PROVIDER` — `cli` or `anthropic`.
- `ANTHROPIC_API_KEY` — required only when `LLM_PROVIDER=anthropic`. Backend only, never exposed to the frontend.
- `DATABASE_URL` — full-privilege connection, used only for seeding.
- `DATABASE_URL_READONLY` — read-only role, used at request time.
- `FRONTEND_URL` — CORS allow-list origin.
- `PORT` (default 4000), `NODE_ENV`.

## Run locally
```bash
npm install
npm run db:seed     # applies schema.sql + generates demo data (needs DATABASE_URL)
npm run dev         # http://localhost:4000
npm test            # sqlGuard unit tests
```

## Safety
- `src/lib/sqlGuard.ts` allows only a single `SELECT`/`WITH`; rejects DDL/DML and multi-statements.
- Request-time DB user is **read-only** (`DATABASE_URL_READONLY`) — mutation is impossible even if the guard is bypassed.
- The generated SQL is always returned to the client for transparency.

## Deploy (Railway)
1. New project → Deploy from the GitHub repo, root = `backend/`.
2. Set env vars in the Railway dashboard (as above, `NODE_ENV=production`).
3. Build `npm run build`, start `npm start`.
4. Point the frontend's `REACT_APP_API_URL` at the Railway URL.
