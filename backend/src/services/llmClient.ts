/**
 * LLM provider abstraction.
 * LLM_PROVIDER=cli       -> shells out to the local `claude` CLI (uses your Claude Code auth,
 *                           no API key). Only works where the CLI is installed + logged in.
 * LLM_PROVIDER=anthropic -> uses the Anthropic SDK with ANTHROPIC_API_KEY (works in the cloud).
 * Default: anthropic.
 */
import 'dotenv/config'
import { spawn } from 'node:child_process'
import Anthropic from '@anthropic-ai/sdk'
import { AppError } from '../lib/errors.js'

const MODEL = 'claude-sonnet-4-20250514'
const PROVIDER = (process.env.LLM_PROVIDER || 'anthropic').toLowerCase()

/** Ask the model to complete `user` under instructions `system`. Returns raw text. */
export async function complete(system: string, user: string, maxTokens = 500): Promise<string> {
  return PROVIDER === 'cli'
    ? completeViaCli(system, user)
    : completeViaSdk(system, user, maxTokens)
}

function completeViaSdk(system: string, user: string, maxTokens: number): Promise<string> {
  const apiKey = process.env.ANTHROPIC_API_KEY
  if (!apiKey) throw new AppError('AI is not configured', 'AI_UNCONFIGURED', 500)
  const client = new Anthropic({ apiKey })
  return client.messages
    .create({
      model: MODEL,
      max_tokens: maxTokens,
      system,
      messages: [{ role: 'user', content: user }],
    })
    .then((msg) => {
      const block = msg.content.find((b) => b.type === 'text')
      return block && block.type === 'text' ? block.text : ''
    })
}

function completeViaCli(system: string, user: string): Promise<string> {
  // The CLI has no separate system slot in -p mode, so prepend the system instructions.
  const prompt = `${system}\n\n---\n\n${user}`
  return new Promise((resolve, reject) => {
    const child = spawn('claude', ['-p', '--output-format', 'text'], {
      stdio: ['pipe', 'pipe', 'pipe'],
    })
    let out = ''
    let err = ''
    const timer = setTimeout(() => {
      child.kill('SIGKILL')
      reject(new AppError('Local Claude CLI timed out', 'AI_ERROR', 504))
    }, 60_000)

    child.stdout.on('data', (d) => (out += d.toString()))
    child.stderr.on('data', (d) => (err += d.toString()))
    child.on('error', () =>
      reject(new AppError('Local Claude CLI not available', 'AI_UNCONFIGURED', 500)),
    )
    child.on('close', (code) => {
      clearTimeout(timer)
      if (code === 0) resolve(out.trim())
      else reject(new AppError(`Local Claude CLI failed: ${err.trim()}`, 'AI_ERROR', 502))
    })

    child.stdin.write(prompt)
    child.stdin.end()
  })
}
