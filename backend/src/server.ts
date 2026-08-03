/** Conductor API server. */
import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import datasetsRouter from './routes/datasets.js'
import analyzeRouter from './routes/analyze.js'
import { errorHandler } from './middleware/errorHandler.js'

const app = express()

app.use(
  cors({
    origin: process.env.FRONTEND_URL || 'http://localhost:3000',
    credentials: true,
  }),
)
app.use(express.json({ limit: '256kb' }))

app.get('/health', (_req, res) => res.json({ ok: true }))
app.use('/api', datasetsRouter)
app.use('/api', analyzeRouter)

app.use(errorHandler)

const port = Number(process.env.PORT) || 4000
app.listen(port, () => {
  console.log(`Conductor API listening on :${port}`)
})
