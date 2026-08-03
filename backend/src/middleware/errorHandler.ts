/** Central Express error handler — returns { error, code }, never leaks internals in prod. */
import type { Request, Response, NextFunction } from 'express'
import { AppError } from '../lib/errors.js'

export function errorHandler(
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
) {
  if (err instanceof AppError) {
    return res.status(err.status).json({ error: err.message, code: err.code })
  }
  // Unknown error: log server-side, return a generic message to the client.
  console.error('Unhandled error:', err)
  const message =
    process.env.NODE_ENV === 'production'
      ? 'Something went wrong'
      : err instanceof Error
        ? err.message
        : 'Unknown error'
  res.status(500).json({ error: message, code: 'INTERNAL' })
}
