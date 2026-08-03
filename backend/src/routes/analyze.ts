/** POST /api/analyze — NL question -> Claude SQL -> execute -> narrative + table + chart. */
import { Router } from 'express'
import { generateSql, summarise } from '../services/aiService.js'
import { run, toGraphData } from '../services/queryService.js'
import { SCHEMA_DDL } from '../db/pool.js'
import { AppError } from '../lib/errors.js'

const router = Router()

router.post('/analyze', async (req, res, next) => {
  try {
    const { dataset, question } = req.body ?? {}
    if (typeof question !== 'string' || !question.trim()) {
      throw new AppError('A question is required', 'INVALID_INPUT')
    }
    const datasets: string[] = Array.isArray(dataset) ? dataset : []

    // 1. NL -> SQL (Claude)
    const query = await generateSql(question, SCHEMA_DDL, datasets)

    // 2. Guard + execute (read-only)
    const { tableHeaders, tableData } = await run(query)

    // 3. Narrative + chart shaping
    const answer_text = await summarise(question, tableData)
    const graph = toGraphData(tableData, tableHeaders)

    // 4. Respond in the exact shape the existing frontend parses.
    res.json({
      query,
      answer_text,
      tableHeaders,
      tableData: JSON.stringify(tableData),
      graphData: JSON.stringify(graph),
    })
  } catch (err) {
    next(err)
  }
})

export default router
