# Conductor — AI Data-Insights Assistant

Ask a data question in plain English; get a runnable SQL query, a narrative answer, a table,
and a chart. Conductor uses Claude to translate natural language into **read-only** SQL over a
real database, so non-technical users can self-serve data questions without writing SQL or
waiting on a data engineer.

> Capstone project for the Vibe Coding course. The React frontend was an existing project;
> this version adds a full Node/Express + PostgreSQL backend and the Claude AI layer.

Demo video: https://github.com/user-attachments/assets/6ae52778-0d9f-455f-871a-0d1feca803de

## What it does
- Select datasets (Database / S3 / Kafka tabs), type a question, submit.
- Claude generates a single read-only PostgreSQL `SELECT` from the question + schema.
- The backend guards the SQL (SELECT-only), executes it against a read-only DB role, and shapes
  the result into a table + Chart.js data.
- Claude writes a one-paragraph plain-English answer.
- Export the table (CSV) / chart (PNG), copy the generated query.

## Architecture
```
React (Netlify)  --HTTP-->  Express API (Railway)  -->  Claude API (text-to-SQL, summary)
                                        |
                                        +-->  PostgreSQL (Supabase, read-only role)
```
| Layer | Tech |
|---|---|
| Frontend | React (CRA), Chart.js, axios |
| Backend | Node 20, Express 4, TypeScript 5, `@anthropic-ai/sdk` |
| Database | PostgreSQL 15 (Supabase), seeded e-commerce dataset |
| Deploy | Netlify (web) · Railway (api) · Supabase (db) |

See `backend/README.md` for API details and `docs/API.md` for the full API reference.

## Run locally
**Backend**
```bash
cd backend
cp .env.example .env      # fill ANTHROPIC_API_KEY, DATABASE_URL, DATABASE_URL_READONLY, FRONTEND_URL
npm install
npm run db:seed           # schema + demo data
npm run dev               # http://localhost:4000
npm test                  # SQL-guard unit tests
```
**Frontend**
```bash
npm install
echo "REACT_APP_API_URL=http://localhost:4000" > .env
npm start                 # http://localhost:3000
```

## Environment variables
| Where | Variable | Purpose |
|---|---|---|
| backend | `ANTHROPIC_API_KEY` | Claude API key (server-side only) |
| backend | `DATABASE_URL` | full-privilege connection, seeding only |
| backend | `DATABASE_URL_READONLY` | read-only role, used at request time |
| backend | `FRONTEND_URL` | CORS allow-list |
| backend | `PORT`, `NODE_ENV` | server config |
| frontend | `REACT_APP_API_URL` | backend base URL |

## Deploy (order matters: DB → API → Web)
1. **Supabase** — create project; run `backend/src/db/schema.sql` and `npm run db:seed`; create a
   read-only role for `DATABASE_URL_READONLY`.
2. **Railway** — deploy from this repo, root `backend/`; set all backend env vars; note the URL.
3. **Netlify** — set `REACT_APP_API_URL` to the Railway URL; redeploy.
4. Smoke test the core journey (select dataset → ask → query + answer + chart).

## Security
- Anthropic key is backend-only; never shipped to the browser.
- Request-time DB user is **read-only**; the SQL guard (`backend/src/lib/sqlGuard.ts`) allows only a
  single `SELECT`/`WITH` and rejects DDL/DML and multi-statements.
- The generated SQL is always shown to the user for transparency.

## Tests
`cd backend && npm test` — SQL-guard unit tests (accepts SELECT/WITH; rejects INSERT/UPDATE/DROP/
multi-statement/empty).

## Feature list
NL→SQL analysis · narrative answer · table + line/bar chart · show generated query · CSV/PNG export ·
read-only SQL guard · clear non-technical error states · mobile-responsive layout · loading states.
