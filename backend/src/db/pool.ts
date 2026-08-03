/** Read-only Postgres pool used at request time. */
import 'dotenv/config'
import pg from 'pg'

const { Pool } = pg

const connectionString =
  process.env.DATABASE_URL_READONLY || process.env.DATABASE_URL

if (!connectionString) {
  throw new Error('DATABASE_URL_READONLY (or DATABASE_URL) must be set')
}

export const readPool = new Pool({
  connectionString,
  // Supabase and most managed Postgres require SSL in production.
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : undefined,
  max: 5,
  statement_timeout: 10_000,
})

/** DDL string describing the schema — injected into the text-to-SQL prompt. */
export const SCHEMA_DDL = `
customers(id, name, region, created_at)
products(id, name, category, unit_price)
orders(id, customer_id -> customers.id, order_date, status in {completed,pending,cancelled})
order_items(id, order_id -> orders.id, product_id -> products.id, quantity, line_total)
`.trim()
