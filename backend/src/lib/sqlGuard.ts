/** Guards against non-read-only or multi-statement SQL before execution. */
import { AppError } from './errors.js'

const FORBIDDEN = /\b(INSERT|UPDATE|DELETE|DROP|ALTER|TRUNCATE|CREATE|GRANT|REVOKE|COPY|MERGE|CALL|DO)\b/i

/**
 * Throws AppError(code UNSAFE_SQL) unless `sql` is exactly one read-only
 * SELECT/WITH statement. Returns the trimmed, single-statement SQL.
 */
export function assertReadOnly(sql: string): string {
  const trimmed = sql.trim().replace(/;+\s*$/, '') // strip a single trailing semicolon

  if (!trimmed) {
    throw new AppError('Empty query', 'UNSAFE_SQL')
  }
  if (trimmed.includes(';')) {
    throw new AppError('Multiple statements are not allowed', 'UNSAFE_SQL')
  }
  if (!/^\s*(SELECT|WITH)\b/i.test(trimmed)) {
    throw new AppError('Only SELECT queries are allowed', 'UNSAFE_SQL')
  }
  if (FORBIDDEN.test(trimmed)) {
    throw new AppError('Query contains a forbidden keyword', 'UNSAFE_SQL')
  }
  return trimmed
}
