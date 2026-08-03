/**
 * Seeds the e-commerce demo database.
 * Runs schema.sql, then generates deterministic sample data and bulk-inserts it.
 * Usage: npm run db:seed   (requires DATABASE_URL in .env)
 */
import 'dotenv/config'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
import pg from 'pg'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Deterministic PRNG (mulberry32) so seeds are reproducible across runs.
function rng(seed: number) {
  let a = seed
  return () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}
const rand = rng(42)
const pick = <T>(arr: T[]): T => arr[Math.floor(rand() * arr.length)]
const between = (lo: number, hi: number) => lo + Math.floor(rand() * (hi - lo + 1))

const REGIONS = ['North America', 'Europe', 'Asia Pacific', 'Latin America', 'Middle East']
const CATEGORIES = ['Electronics', 'Home', 'Apparel', 'Sports', 'Books', 'Beauty']
const STATUSES = ['completed', 'completed', 'completed', 'pending', 'cancelled'] as const
const FIRST = ['Alex', 'Sam', 'Jordan', 'Riley', 'Casey', 'Morgan', 'Priya', 'Chen', 'Diego', 'Aisha']
const LAST = ['Patel', 'Kim', 'Garcia', 'Nguyen', 'Smith', 'Okafor', 'Muller', 'Rossi', 'Haddad', 'Silva']

async function main() {
  const { Pool } = pg
  const connectionString = process.env.DATABASE_URL
  const needsSsl = /supabase\.co|sslmode=require|render\.com|neon\.tech/i.test(connectionString || '')
  const pool = new Pool({
    connectionString,
    ssl: needsSsl ? { rejectUnauthorized: false } : undefined,
  })

  const schema = readFileSync(join(__dirname, 'schema.sql'), 'utf8')
  console.log('Applying schema...')
  await pool.query(schema)

  // Customers
  console.log('Seeding customers...')
  const customers: number[] = []
  for (let i = 0; i < 200; i++) {
    const name = `${pick(FIRST)} ${pick(LAST)}`
    const region = pick(REGIONS)
    const month = between(0, 11)
    const created = `2024-${String(month + 1).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`
    const res = await pool.query(
      'INSERT INTO customers(name, region, created_at) VALUES ($1,$2,$3) RETURNING id',
      [name, region, created],
    )
    customers.push(res.rows[0].id)
  }

  // Products
  console.log('Seeding products...')
  const products: { id: number; price: number }[] = []
  for (let i = 0; i < 50; i++) {
    const category = pick(CATEGORIES)
    const name = `${category} Item ${i + 1}`
    const price = between(8, 500) + 0.99
    const res = await pool.query(
      'INSERT INTO products(name, category, unit_price) VALUES ($1,$2,$3) RETURNING id',
      [name, category, price],
    )
    products.push({ id: res.rows[0].id, price })
  }

  // Orders + items over 12 months of 2024
  console.log('Seeding orders and items...')
  for (let o = 0; o < 5000; o++) {
    const customerId = pick(customers)
    const month = between(0, 11)
    const orderDate = `2024-${String(month + 1).padStart(2, '0')}-${String(between(1, 28)).padStart(2, '0')}`
    const status = pick([...STATUSES])
    const orderRes = await pool.query(
      'INSERT INTO orders(customer_id, order_date, status) VALUES ($1,$2,$3) RETURNING id',
      [customerId, orderDate, status],
    )
    const orderId = orderRes.rows[0].id
    const lineCount = between(1, 4)
    for (let l = 0; l < lineCount; l++) {
      const product = pick(products)
      const qty = between(1, 5)
      const lineTotal = +(product.price * qty).toFixed(2)
      await pool.query(
        'INSERT INTO order_items(order_id, product_id, quantity, line_total) VALUES ($1,$2,$3,$4)',
        [orderId, product.id, qty, lineTotal],
      )
    }
    if (o % 1000 === 0) console.log(`  ...${o} orders`)
  }

  const counts = await pool.query(
    `SELECT
       (SELECT count(*) FROM customers)   AS customers,
       (SELECT count(*) FROM products)    AS products,
       (SELECT count(*) FROM orders)      AS orders,
       (SELECT count(*) FROM order_items) AS order_items`,
  )
  console.log('Seed complete:', counts.rows[0])
  await pool.end()
}

main().catch((err) => {
  console.error('Seed failed:', err)
  process.exit(1)
})
