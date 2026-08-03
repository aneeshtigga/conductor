# Conductor API Reference

Base URL: `${REACT_APP_API_URL}` (local: `http://localhost:4000`).
All responses are JSON. Errors use `{ "error": string, "code": string }`.

---

## GET /health
Liveness check.

**Auth:** none
**Request:** —
**Response 200**
```json
{ "ok": true }
```

---

## GET /api/datasets
Lists the datasets available to query, grouped by source. In v1 all three groups are backed by
the same seeded relational demo tables (the grouping demonstrates the intended multi-source UX).

**Auth:** none
**Request:** —
**Response 200**
```json
{
  "database": [{ "id": 1, "type": "database", "name": "customers" }],
  "s3":       [{ "id": 101, "type": "s3", "name": "customers.parquet" }],
  "kafka":    [{ "id": 201, "type": "kafka", "name": "customers.stream" }]
}
```

---

## POST /api/analyze
Turns a natural-language question into a read-only SQL query, executes it, and returns a narrative
answer plus table and chart data.

**Auth:** none

**Request body**
| Field | Type | Required | Description |
|---|---|---|---|
| `question` | string | yes | The natural-language question |
| `dataset` | string[] | no | Selected dataset labels (e.g. `["database: orders"]`) |
| `original_query` | string | no | Prior query (reserved; unused in v1) |

```json
{
  "dataset": ["database: orders", "database: order_items"],
  "question": "What were the top 5 products by revenue?"
}
```

**Response 200**
| Field | Type | Description |
|---|---|---|
| `query` | string | The exact SQL that was executed (shown to the user) |
| `answer_text` | string | One-paragraph plain-English answer |
| `tableHeaders` | string[] | Column names |
| `tableData` | string | JSON-stringified array of row objects |
| `graphData` | string | JSON-stringified `{ labels: string[], datasets: [{ label, data }] }` |

```json
{
  "query": "SELECT p.name, SUM(oi.line_total) AS revenue FROM order_items oi JOIN products p ON p.id = oi.product_id GROUP BY p.name ORDER BY revenue DESC LIMIT 5",
  "answer_text": "The top product by revenue was Electronics Item 12 at $48,210, followed by ...",
  "tableHeaders": ["name", "revenue"],
  "tableData": "[{\"name\":\"Electronics Item 12\",\"revenue\":48210.00}]",
  "graphData": "{\"labels\":[\"Electronics Item 12\"],\"datasets\":[{\"label\":\"revenue\",\"data\":[48210]}]}"
}
```

**Errors**
| Status | code | When |
|---|---|---|
| 400 | `INVALID_INPUT` | `question` missing or empty |
| 400 | `UNSAFE_SQL` | Generated SQL was not a single read-only SELECT (blocked before execution) |
| 422 | `QUERY_FAILED` | SQL executed but failed (e.g. references a non-existent column) |
| 500 | `AI_UNCONFIGURED` | `ANTHROPIC_API_KEY` not set on the server |
| 502 | `AI_ERROR` / `AI_EMPTY` | Claude call failed or returned no query |
| 500 | `INTERNAL` | Unexpected server error |

```json
{ "error": "A question is required", "code": "INVALID_INPUT" }
```

---

## Notes
- `tableData` and `graphData` are returned as JSON **strings** to match the existing frontend, which
  `JSON.parse`s them before rendering.
- The result summary is best-effort: if the summariser call fails, `answer_text` falls back to a
  generic message and the table/chart are still returned.
- Only `SELECT`/`WITH` statements run, against a read-only database role.
