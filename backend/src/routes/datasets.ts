/** GET /api/datasets — returns seeded datasets grouped by source. */
import { Router } from 'express'

const router = Router()

// v1 backs all three source tabs with the same seeded relational demo tables.
// The grouping is illustrative of the intended multi-source UX.
const TABLES = [
  { id: 1, type: 'database', name: 'customers' },
  { id: 2, type: 'database', name: 'products' },
  { id: 3, type: 'database', name: 'orders' },
  { id: 4, type: 'database', name: 'order_items' },
]

router.get('/datasets', (_req, res) => {
  res.json({
    database: TABLES.map((t) => ({ ...t, type: 'database' })),
    s3: TABLES.map((t) => ({ ...t, id: t.id + 100, type: 's3', name: `${t.name}.parquet` })),
    kafka: TABLES.map((t) => ({ ...t, id: t.id + 200, type: 'kafka', name: `${t.name}.stream` })),
  })
})

export default router
