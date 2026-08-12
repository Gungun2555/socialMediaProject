import 'dotenv/config'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { runVerification } from './server/verify.mjs'

/**
 * Dev/preview-only API: serves live Claude (Bedrock) verification results at
 * GET /api/verify. Runs entirely in this Node process — AWS credentials from
 * .env never reach the client bundle. Not available on a static production
 * build; a real deployment would move this to an actual backend/serverless
 * function.
 */
function bedrockVerifyPlugin() {
  /**
   * Start the fact check as soon as the app is first requested, so the model
   * is already working while the visitor reads the landing page and signs in.
   * Concurrent callers share the one run, so this never duplicates the work.
   */
  const warmOnAppLoad = (req, res, next) => {
    if (req.method === 'GET' && (req.headers.accept ?? '').includes('text/html')) {
      runVerification().catch((err) => console.error('[api/verify] warm-up:', err.message))
    }
    next()
  }

  const handler = async (req, res) => {
    try {
      const url = new URL(req.url, 'http://localhost')
      const force = url.searchParams.get('refresh') === '1'
      const result = await runVerification({ force })
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify(result))
    } catch (err) {
      console.error('[api/verify]', err)
      res.statusCode = 500
      res.setHeader('Content-Type', 'application/json')
      res.end(JSON.stringify({ error: err.message ?? 'Verification failed' }))
    }
  }

  return {
    name: 'bedrock-verify-api',
    configureServer(server) {
      server.middlewares.use('/api/verify', handler)
      server.middlewares.use(warmOnAppLoad)
    },
    configurePreviewServer(server) {
      server.middlewares.use('/api/verify', handler)
      server.middlewares.use(warmOnAppLoad)
    },
  }
}

export default defineConfig({
  plugins: [react(), tailwindcss(), bedrockVerifyPlugin()],
  server: { port: 5173, open: true },
})
