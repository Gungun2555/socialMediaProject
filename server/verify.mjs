import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

/**
 * Server-only Bedrock integration. This module is imported exclusively by
 * vite.config.js (a Node process) and is never bundled into the client —
 * the AWS credentials in .env never reach the browser.
 *
 * It asks Claude (via AWS Bedrock) to fact-check each post: pull out the
 * checkable factual claims, say whether the public record supports them,
 * and cite publicly available sources for each one.
 *
 * Latency comes almost entirely from tokens the model writes, and those are
 * written serially, so each post gets its own short request and the posts are
 * checked concurrently rather than as one long generation. Results are cached
 * to disk against a fingerprint of the posts and the prompt, so a restart
 * costs nothing until one of those actually changes.
 *
 * The model has no web access, so its citations come from training data and
 * can be stale or invented. Every URL it returns is therefore probed over
 * the network here (see attachReachability) and flagged in the response, so
 * the UI can distinguish a link that actually resolves from one that doesn't.
 */

const ROOT = path.dirname(path.dirname(fileURLToPath(import.meta.url)))
const POSTS_FILE = path.join(ROOT, 'post/posts.json')
const CACHE_FILE = path.join(ROOT, '.cache/verification.json')

/** Posts checked at once. Each is an independent request to Bedrock. */
const CONCURRENCY = 6

const SYSTEM_PROMPT = `You are the fact-checking pipeline for Truepost, a social media moderation tool. For the post you are given, you check whether the information in it is correct, and you cite publicly available sources.

Work claim by claim:
1. Extract each specific, checkable factual claim in the post (who did what, when, numbers, dates, named events, quoted actions). Ignore pure opinion, rhetoric and calls to action — those are not checkable claims. Extract at most 6 claims; if the post has more, keep the most consequential ones.
2. For each claim, decide a verdict against what is publicly documented:
   - "accurate"       — the public record supports it.
   - "partly-accurate"— broadly right but overstated, missing context, or imprecise.
   - "unsupported"    — no public record establishes it (but nothing contradicts it either).
   - "inaccurate"     — the public record contradicts it.
   - "unverifiable"   — it concerns events you have no reliable knowledge of (for example, later than your training data, or purely internal/private matters).
3. For each claim, list publicly available sources a reader could check.

CRITICAL RULES ABOUT SOURCES — you have no web access, so:
- Only cite a URL you are genuinely confident exists. Prefer stable, canonical pages (a publication's homepage or section, an official government/parliament/court domain, a well-known reference page) over specific article URLs you are guessing at.
- Never invent a plausible-looking article URL. If you cannot cite a real URL for a claim, return an empty "sources" array and say so in the explanation.
- If a claim concerns events you have no reliable knowledge of, use verdict "unverifiable" with empty "sources" rather than guessing.

Then decide an overall status for the post:
- "green"  — the checkable claims hold up (or the post is opinion with nothing factually wrong). Nothing needs changing.
- "yellow" — changes needed: claims that are unsupported, unverifiable, partly accurate, or stated as fact without a citation.
- "red"    — should be removed: the post contains materially false information contradicted by the public record.

And a route describing how the post was resolved:
- "verified" — at least one claim was confirmed against public sources, and nothing is inaccurate.
- "disputed" — one or more claims are inaccurate or contradicted by the public record.
- "hitl"     — the claims could not be checked against public sources, so it goes to a human reviewer. Include a short reviewer credit line.

Finally list field-level issues: which specific part of the post needs a change — use field values like "Caption text", "Hashtags", "Keywords / framing", "Links", "Dates / numbers" — with a short message on what to change and why.

Be concise: explanations and messages are one or two sentences, never paragraphs.

Respond with ONLY a single JSON object for this one post, no markdown code fences, no commentary before or after, of exactly this shape:
{
  "status": "green" | "yellow" | "red",
  "route": "verified" | "disputed" | "hitl",
  "summary": "one or two sentence explanation of the verdict",
  "reviewer": "only present when route is hitl — a short human reviewer credit line",
  "claims": [
    {
      "claim": "the factual claim, quoted or closely paraphrased from the post",
      "verdict": "accurate" | "partly-accurate" | "unsupported" | "inaccurate" | "unverifiable",
      "explanation": "what the public record does or does not establish",
      "sources": [ { "title": "page or publication name", "publisher": "who runs it", "url": "https://..." } ]
    }
  ],
  "issues": [ { "field": "short field name", "message": "what needs to change and why" } ]
}`

function buildUserPrompt(post) {
  return `Fact-check this post.

POST ${post.id}
  username: ${post.username}
  platform: ${post.platform}
  hashtags: ${JSON.stringify(post.hashtags ?? [])}
  links: ${JSON.stringify(post.links ?? [])}
  caption: ${post.caption}

Return the JSON object described in the system prompt.`
}

function extractJson(text) {
  const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/i)
  const candidate = fenced ? fenced[1] : text
  const start = candidate.indexOf('{')
  const end = candidate.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('Model response did not contain a JSON object.')
  return JSON.parse(candidate.slice(start, end + 1))
}

const UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36'

async function probe(url, method) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 5000)
  try {
    const res = await fetch(url, {
      method,
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA },
    })
    return res.status
  } finally {
    clearTimeout(timer)
  }
}

const ok = (status) => status >= 200 && status < 400

/**
 * True only if the URL actually resolves right now. HEAD is tried first
 * because it is cheap, but plenty of servers answer it with 404/405/403 while
 * serving GET fine (delhipolice.gov.in does exactly this), so any non-2xx
 * HEAD is treated as inconclusive and confirmed with a GET.
 */
async function isReachable(url) {
  if (!/^https?:\/\//i.test(url ?? '')) return false
  try {
    if (ok(await probe(url, 'HEAD'))) return true
  } catch {
    // fall through to GET — a refused HEAD tells us nothing conclusive
  }
  try {
    return ok(await probe(url, 'GET'))
  } catch {
    return false
  }
}

async function mapLimited(items, limit, fn) {
  const results = new Array(items.length)
  let cursor = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (cursor < items.length) {
      const i = cursor++
      results[i] = await fn(items[i])
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * Probes every unique source URL in one post's verdict and annotates each
 * source with `reachable`, so the UI never presents an unchecked link as
 * verified. Runs per post, while the other posts are still generating.
 */
async function attachReachability(entry) {
  const urls = [
    ...new Set(
      (entry?.claims ?? []).flatMap((claim) =>
        (claim?.sources ?? []).map((source) => source?.url).filter(Boolean),
      ),
    ),
  ]

  const statuses = await mapLimited(urls, 8, isReachable)
  const reachableByUrl = new Map(urls.map((url, i) => [url, statuses[i]]))

  for (const claim of entry?.claims ?? []) {
    for (const source of claim?.sources ?? []) {
      if (source?.url) source.reachable = reachableByUrl.get(source.url) ?? false
    }
  }

  return { checked: urls.length, reachable: statuses.filter(Boolean).length }
}

let client = null
function getClient() {
  if (client) return client
  const region = process.env.AWS_DEFAULT_REGION
  const accessKeyId = process.env.AWS_ACCESS_KEY_ID
  const secretAccessKey = process.env.AWS_SECRET_ACCESS_KEY
  if (!region || !accessKeyId || !secretAccessKey) {
    throw new Error('Missing AWS credentials — check AWS_DEFAULT_REGION / AWS_ACCESS_KEY_ID / AWS_SECRET_ACCESS_KEY in .env')
  }
  client = new BedrockRuntimeClient({ region, credentials: { accessKeyId, secretAccessKey } })
  return client
}

function getModelId() {
  const modelId = process.env.BEDROCK_INFERENCE_PROFILE_ARN || process.env.MODEL_ID
  if (!modelId) throw new Error('Missing BEDROCK_INFERENCE_PROFILE_ARN / MODEL_ID in .env')
  return modelId
}

async function verifyPost(post, modelId) {
  const command = new ConverseCommand({
    modelId,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [{ role: 'user', content: [{ text: buildUserPrompt(post) }] }],
    inferenceConfig: { maxTokens: 3000, temperature: 0.1 },
  })

  const response = await getClient().send(command)
  const text = (response.output?.message?.content ?? []).map((c) => c.text ?? '').join('')
  const entry = extractJson(text)
  const linkCheck = await attachReachability(entry)
  return { entry, linkCheck }
}

/** Cached results are reused until the posts, the prompt or the model change. */
function fingerprint(postsRaw, modelId) {
  return createHash('sha1').update(postsRaw).update(SYSTEM_PROMPT).update(modelId).digest('hex')
}

async function readDiskCache(expected) {
  try {
    const saved = JSON.parse(await readFile(CACHE_FILE, 'utf-8'))
    return saved.fingerprint === expected ? saved : null
  } catch {
    return null
  }
}

async function writeDiskCache(payload) {
  try {
    await mkdir(path.dirname(CACHE_FILE), { recursive: true })
    await writeFile(CACHE_FILE, JSON.stringify(payload))
  } catch (err) {
    console.warn('[api/verify] could not write cache:', err.message)
  }
}

async function buildVerification(postsRaw, modelId) {
  const posts = JSON.parse(postsRaw)
  const startedAt = Date.now()

  const settled = await mapLimited(posts, CONCURRENCY, async (post) => {
    try {
      return { post, result: await verifyPost(post, modelId) }
    } catch {
      // one retry — throttling and the occasional truncated JSON are transient
      try {
        return { post, result: await verifyPost(post, modelId) }
      } catch (err) {
        return { post, error: err }
      }
    }
  })

  const failed = settled.filter((s) => s.error)
  if (failed.length) {
    throw new Error(
      `Fact check failed for ${failed.map((f) => f.post.id).join(', ')} — ${failed[0].error.message}`,
    )
  }

  const data = {}
  const linkCheck = { checked: 0, reachable: 0 }
  for (const { post, result } of settled) {
    data[post.id] = result.entry
    linkCheck.checked += result.linkCheck.checked
    linkCheck.reachable += result.linkCheck.reachable
  }

  const seconds = ((Date.now() - startedAt) / 1000).toFixed(1)
  console.log(`[api/verify] fact-checked ${posts.length} posts in ${seconds}s`)

  const payload = {
    data,
    generatedAt: new Date().toISOString(),
    linkCheck,
    fingerprint: fingerprint(postsRaw, modelId),
  }
  await writeDiskCache(payload)
  return payload
}

let cache = null
let inFlight = null

/**
 * Returns the verdicts for every post. Concurrent callers share one run, so
 * warming the cache and the client's own fetch never duplicate the work.
 */
export async function runVerification({ force = false } = {}) {
  if (cache && !force) return cache
  if (inFlight && !force) return inFlight

  const postsRaw = readFileSync(POSTS_FILE, 'utf-8')
  const modelId = getModelId()

  inFlight = (async () => {
    if (!force) {
      const saved = await readDiskCache(fingerprint(postsRaw, modelId))
      if (saved) {
        console.log(`[api/verify] reusing cached fact check from ${saved.generatedAt}`)
        return saved
      }
    }
    return buildVerification(postsRaw, modelId)
  })()
    .then((result) => {
      cache = result
      return result
    })
    .finally(() => {
      inFlight = null
    })

  return inFlight
}
