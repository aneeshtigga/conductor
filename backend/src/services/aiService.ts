/** Natural language -> SQL, and result rows -> narrative. Provider-agnostic (see llmClient). */
import { AppError } from '../lib/errors.js'
import { complete } from './llmClient.js'
import { sqlSystemPrompt, summariseSystemPrompt, stripFence } from './prompts.js'

/** Turn a question + schema into a single read-only SQL string. */
export async function generateSql(
  question: string,
  schemaDdl: string,
  datasets: string[],
  userKey?: string,
): Promise<string> {
  try {
    const user = `Selected datasets: ${datasets.join(', ') || 'all'}\nQuestion: ${question}`
    const text = await complete(sqlSystemPrompt(schemaDdl), user, 500, userKey)
    const sql = stripFence(text)
    if (!sql) throw new AppError('AI returned no query', 'AI_EMPTY', 502)
    return sql
  } catch (err) {
    if (err instanceof AppError) throw err
    throw new AppError('AI query generation failed', 'AI_ERROR', 502)
  }
}

/** Summarise result rows into one plain-English paragraph. */
export async function summarise(
  question: string,
  rows: Record<string, unknown>[],
  userKey?: string,
): Promise<string> {
  try {
    const sample = rows.slice(0, 50)
    const user = `Question: ${question}\nRows (JSON): ${JSON.stringify(sample)}`
    const text = await complete(summariseSystemPrompt, user, 300, userKey)
    return text.trim() || 'No summary available.'
  } catch {
    // A failed summary should not fail the whole request — the table/chart still stand.
    return 'A summary could not be generated, but the table and chart below answer the question.'
  }
}
