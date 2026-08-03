/** Wraps the Anthropic SDK: natural language -> SQL, and result rows -> narrative. */
import 'dotenv/config'
import Anthropic from '@anthropic-ai/sdk'
import { AppError } from '../lib/errors.js'
import { sqlSystemPrompt, summariseSystemPrompt, stripFence } from './prompts.js'

const MODEL = 'claude-sonnet-4-20250514'

function client(): Anthropic {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new AppError('AI is not configured', 'AI_UNCONFIGURED', 500)
  return new Anthropic({ apiKey })
}

function textOf(msg: Anthropic.Message): string {
  const block = msg.content.find((b) => b.type === 'text')
  return block && block.type === 'text' ? block.text : ''
}

/** Turn a question + schema into a single read-only SQL string. */
export async function generateSql(
  question: string,
  schemaDdl: string,
  datasets: string[],
): Promise<string> {
  try {
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 500,
      system: sqlSystemPrompt(schemaDdl),
      messages: [
        {
          role: 'user',
          content: `Selected datasets: ${datasets.join(', ') || 'all'}\nQuestion: ${question}`,
        },
      ],
    })
    const sql = stripFence(textOf(msg))
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
): Promise<string> {
  try {
    const sample = rows.slice(0, 50)
    const msg = await client().messages.create({
      model: MODEL,
      max_tokens: 300,
      system: summariseSystemPrompt,
      messages: [
        {
          role: 'user',
          content: `Question: ${question}\nRows (JSON): ${JSON.stringify(sample)}`,
        },
      ],
    })
    return textOf(msg).trim() || 'No summary available.'
  } catch {
    // A failed summary should not fail the whole request — the table/chart still stand.
    return 'A summary could not be generated, but the table and chart below answer the question.'
  }
}
