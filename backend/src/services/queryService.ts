/** Executes guarded read-only SQL and shapes results for the frontend. */
import { readPool } from '../db/pool.js'
import { assertReadOnly } from '../lib/sqlGuard.js'
import { AppError } from '../lib/errors.js'

export interface QueryResult {
  tableHeaders: string[]
  tableData: Record<string, unknown>[]
  rowCount: number
}

/** Validate then run `sql`; returns headers + rows. Throws AppError on failure. */
export async function run(sql: string): Promise<QueryResult> {
  const safe = assertReadOnly(sql)
  try {
    const res = await readPool.query(safe)
    const tableHeaders = res.fields.map((f) => f.name)
    return { tableHeaders, tableData: res.rows, rowCount: res.rowCount ?? res.rows.length }
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Query execution failed'
    throw new AppError(`Query failed: ${message}`, 'QUERY_FAILED', 422)
  }
}

/**
 * Build Chart.js data from rows. Picks the first text column as labels and the
 * first numeric column as the series when xKey/yKey are not supplied.
 */
export function toGraphData(
  rows: Record<string, unknown>[],
  headers: string[],
  xKey?: string,
  yKey?: string,
): { labels: string[]; datasets: { label: string; data: number[] }[] } {
  if (rows.length === 0) return { labels: [], datasets: [] }

  const numeric = (k: string) => rows.every((r) => r[k] === null || !isNaN(Number(r[k])))
  const x = xKey ?? headers.find((h) => !numeric(h)) ?? headers[0]
  const y = yKey ?? headers.find((h) => h !== x && numeric(h)) ?? headers[headers.length - 1]

  return {
    labels: rows.map((r) => String(r[x])),
    datasets: [{ label: y, data: rows.map((r) => Number(r[y]) || 0) }],
  }
}
