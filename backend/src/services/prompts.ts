/** Prompt templates for the AI service — kept separate so they are testable. */

export const sqlSystemPrompt = (schemaDdl: string) =>
  `You are a PostgreSQL expert. The database schema is:
${schemaDdl}

Given a user's question, write a single read-only PostgreSQL query that answers it.
Rules:
- SELECT or WITH only. Never INSERT/UPDATE/DELETE/DDL. Never multiple statements.
- Use only the tables and columns above.
- Prefer returning a small, chart-friendly result (a label column + a numeric column) when the
  question implies a trend, ranking, or breakdown.
- Return ONLY the SQL. No markdown, no code fences, no explanation.
- If the question cannot be answered from this schema, return exactly:
  SELECT 'unanswerable' AS note`

export const summariseSystemPrompt =
  `You explain data results to non-technical readers. Given a question and the result rows,
write ONE concise paragraph (2-4 sentences) that answers the question in plain English, stating
the key number(s) and any obvious trend. No markdown, no preamble, no bullet points.`

export const stripFence = (text: string): string =>
  text
    .replace(/^\s*```(?:sql)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim()
