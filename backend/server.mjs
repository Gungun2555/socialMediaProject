import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { runVerification } from './verify.mjs'

const app = express()
const PORT = process.env.PORT || 3001

// Allow requests from the frontend origin.
// In production set FRONTEND_URL in your Render environment variables.
const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
  .split(',')
  .map((s) => s.trim())

app.use(
  cors({
    origin: (origin, callback) => {
      // allow server-to-server / curl (no Origin header) and listed origins
      if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
      callback(new Error(`CORS: origin ${origin} not allowed`))
    },
  }),
)

// Warm the cache as soon as the server starts — Claude begins working
// immediately rather than waiting for the first browser request.
runVerification().catch((err) => console.error('[verify] warm-up failed:', err.message))

app.get('/api/verify', async (req, res) => {
  try {
    const force = req.query.refresh === '1'
    const result = await runVerification({ force })
    res.json(result)
  } catch (err) {
    console.error('[api/verify]', err)
    res.status(500).json({ error: err.message ?? 'Verification failed' })
  }
})

app.get('/health', (_req, res) => res.json({ ok: true }))

app.listen(PORT, () => {
  console.log(`[truepost-backend] listening on http://localhost:${PORT}`)
})
