import { createHash } from 'node:crypto'
import { readFileSync, writeFileSync } from 'node:fs'
import { mkdir, readFile, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { BedrockRuntimeClient, ConverseCommand } from '@aws-sdk/client-bedrock-runtime'

const ROOT = path.dirname(fileURLToPath(import.meta.url))
// backend/data/posts.json is the copy Claude actually fact-checks. frontend/post/posts.json
// is the copy the UI renders. When both live in the same checkout (local dev, monorepo
// deploys) they must be identical or the UI can show text that was never verified — so
// whenever the frontend copy is present we treat it as the source of truth and mirror it
// into backend/data/posts.json. In deploys where only the backend is checked out, the
// mirrored copy on disk is used as-is.
const LOCAL_POSTS_FILE = path.join(ROOT, 'data/posts.json')
const FRONTEND_POSTS_FILE = path.join(ROOT, '../frontend/post/posts.json')
const CACHE_FILE = path.join(ROOT, '.cache/verification.json')

const CONCURRENCY = 6

const SYSTEM_PROMPT = `You are the fact-checking pipeline for Truepost, a social media moderation tool. For the post you are given, you check whether the information in it is correct, and you cite publicly available sources.

Work claim by claim:
1. Extract each specific, checkable factual claim in the post (who did what, when, numbers, dates, named events, quoted actions). Ignore pure opinion, rhetoric and calls to action — those are not checkable claims. Extract at most 6 claims; if the post has more, keep the most consequential ones.
   - ALWAYS extract claims about a named, real, identifiable person's death, health, safety, criminal guilt, or holding/losing office — these are high-severity and must never be dropped as "just rhetoric", even if stated in passing or as a single short sentence (e.g. "X is dead", "X resigned", "X was arrested").
2. For each claim, decide a verdict against what is publicly documented:
   - "accurate"       — the public record supports it.
   - "partly-accurate"— broadly right but overstated, missing context, or imprecise.
   - "unsupported"    — no public record establishes it (but nothing contradicts it either).
   - "inaccurate"     — the public record contradicts it.
   - "unverifiable"   — it concerns events you have no reliable knowledge of (for example, later than your training data, or purely internal/private matters).
   - DECISIVENESS RULE: if the claim is about a well-known, currently-serving public figure (head of state/government, other widely-known office holder) and it contradicts a basic, stable fact you are confident about (e.g. claiming they are dead, resigned, arrested, or replaced when you have no reliable knowledge of that happening), classify it as "inaccurate", not "unverifiable" or "unsupported". Only use "unverifiable" for claims you genuinely have no basis to judge either way (e.g. a private conversation, an unreleased document). Do not hedge on claims that are basic, checkable public facts.
   - CONSISTENCY RULE: apply this same reasoning and the same verdict every time you see the same or a materially identical claim — do not vary the verdict between runs. When a claim is a false statement about a real person's death, health, or crimes, always treat it the same way: "inaccurate", not sometimes "unverifiable" or "unsupported".
   - DATE RULE: you will be told today's real-world date in the user message. Compare an event's date to THAT date, not to your training-data cutoff. If the event date is on or before today, the event may already have happened even though you have no training data about it — do not say it "hasn't happened yet" or call it a "future event" in that case. Instead say plainly that it postdates your training data and you cannot confirm the reported outcome, and use verdict "unverifiable" (unless web evidence is supplied to you, see below). Only call something a future event if its date is genuinely after today.
3. For each claim, list publicly available sources a reader could check.

CRITICAL RULES ABOUT SOURCES — you have no web access of your own, so:
- Only cite a URL you are genuinely confident exists. Prefer stable, canonical pages (a publication's homepage or section, an official government/parliament/court domain, a well-known reference page) over specific article URLs you are guessing at.
- Never invent a plausible-looking article URL. If you cannot cite a real URL for a claim, return an empty "sources" array and say so in the explanation.
- If a claim concerns events you have no reliable knowledge of, use verdict "unverifiable" with empty "sources" rather than guessing.
- EVIDENCE RULE: sometimes, in a follow-up message, you will be given real text fetched moments ago from a page you (or a prior pass) cited — labeled "FETCHED WEB EVIDENCE". Treat that fetched text as ground truth for the claim it addresses, even where it contradicts your training data or an earlier guess, as long as it comes from a credible/official source and clearly speaks to the claim. Update the verdict, explanation, and overall status/route accordingly.

Separately from fact-checking, screen the post's language itself:
- Flag inflammatory, abusive, threatening, hateful, or defamatory language directed at any named, identifiable person (public figure or not) as a "Tone / language" issue, regardless of whether the surrounding claims are true. This includes false and damaging assertions about a real person (e.g. falsely claiming someone is dead, criminal, or disgraced) used to inflame or defame — flag these even if you also flagged them as an inaccurate claim above.
- Sharp policy criticism, protest language, and calls for accountability aimed at a public official's actions or decisions are legitimate speech, not foul language — only flag language that is abusive/defamatory toward a person, not mere disagreement or criticism of their conduct in office.

Then decide an overall status for the post:
- "green"  — the checkable claims hold up (or the post is opinion with nothing factually wrong) and there is no abusive/defamatory language. Nothing needs changing.
- "yellow" — changes needed: claims that are unsupported, unverifiable, partly accurate, or stated as fact without a citation.
- "red"    — should be removed: the post contains materially false information contradicted by the public record (this includes false claims of death, crime, or disgrace about a real named person), or contains abusive/defamatory/hateful language targeting a real person.
- SEVERITY OVERRIDE: if ANY claim has verdict "inaccurate" about a real named person's death, health, safety, criminal guilt, or removal from office, OR the "Tone / language" screen flags abusive/defamatory content, the overall status MUST be "red" — never "yellow" — regardless of how the rest of the post reads. Apply this override the same way every time for the same content.

And a route describing how the post was resolved:
- "verified" — at least one claim was confirmed against public sources, and nothing is inaccurate.
- "disputed" — one or more claims are inaccurate or contradicted by the public record, or the language screen found abusive/defamatory content.
- "hitl"     — the claims could not be checked against public sources, so it goes to a human reviewer. Include a short reviewer credit line.

Finally list field-level issues: which specific part of the post needs a change — use field values like "Caption text", "Hashtags", "Keywords / framing", "Links", "Dates / numbers", "Tone / language" — with a short message on what to change and why.

Be concise: explanations and messages are one or two sentences, never paragraphs.

Be deterministic: given the same post, always return the same status, route, verdicts, and issues. Do not introduce random variation — resolve any ambiguity using the rules above, every time, the same way.

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

function loadPostsRaw() {
  try {
    const fromFrontend = readFileSync(FRONTEND_POSTS_FILE, 'utf-8')
    JSON.parse(fromFrontend) // guard against reading a half-written file
    try {
      if (readFileSync(LOCAL_POSTS_FILE, 'utf-8') !== fromFrontend) {
        writeFileSync(LOCAL_POSTS_FILE, fromFrontend)
        console.log('[api/verify] synced backend/data/posts.json from frontend/post/posts.json')
      }
    } catch {
      writeFileSync(LOCAL_POSTS_FILE, fromFrontend)
    }
    return fromFrontend
  } catch {
    return readFileSync(LOCAL_POSTS_FILE, 'utf-8')
  }
}

function buildUserPrompt(post, today) {
  return `Fact-check this post. Today's real-world date is ${today} — use this, not your training cutoff, to judge whether an event is genuinely in the future.

POST ${post.id}
  username: ${post.username}
  platform: ${post.platform}
  hashtags: ${JSON.stringify(post.hashtags ?? [])}
  links: ${JSON.stringify(post.links ?? [])}
  caption: ${post.caption}

Return the JSON object described in the system prompt.`
}

function buildGroundingUserPrompt(post, today, evidenceBlocks) {
  return `Re-check this post. You previously fact-checked it from training data alone; below is real web content fetched just now for one or more of your own cited sources. Today's real-world date is ${today}.

POST ${post.id}
  username: ${post.username}
  platform: ${post.platform}
  hashtags: ${JSON.stringify(post.hashtags ?? [])}
  links: ${JSON.stringify(post.links ?? [])}
  caption: ${post.caption}

FETCHED WEB EVIDENCE:
${evidenceBlocks.join('\n\n')}

Re-evaluate every claim using this evidence plus your own knowledge, per the EVIDENCE RULE and DATE RULE in the system prompt. Return the complete JSON object described in the system prompt (same shape, all claims, all issues), with verdicts/status/route updated to reflect the evidence.`
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

async function isReachable(url) {
  if (!/^https?:\/\//i.test(url ?? '')) return false
  try {
    if (ok(await probe(url, 'HEAD'))) return true
  } catch {
    // fall through to GET
  }
  try {
    return ok(await probe(url, 'GET'))
  } catch {
    return false
  }
}

function htmlToText(html) {
  return html
    .replace(/<script[\s\S]*?<\/script>/gi, ' ')
    .replace(/<style[\s\S]*?<\/style>/gi, ' ')
    .replace(/<!--[\s\S]*?-->/g, ' ')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/g, ' ')
    .replace(/&amp;/g, '&')
    .replace(/\s+/g, ' ')
    .trim()
}

// Actually reads a cited source's content, unlike isReachable() which only checks the
// HTTP status. This is what lets the model ground a verdict in real, current text instead
// of relying solely on its frozen training data.
async function fetchPageText(url, maxChars = 4000) {
  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), 6000)
  try {
    const res = await fetch(url, {
      redirect: 'follow',
      signal: controller.signal,
      headers: { 'User-Agent': UA },
    })
    if (!ok(res.status)) return null
    const html = await res.text()
    const text = htmlToText(html).slice(0, maxChars)
    return text.length > 200 ? text : null // too short to be useful page content
  } catch {
    return null
  } finally {
    clearTimeout(timer)
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

async function callModel(userPrompt, modelId) {
  const command = new ConverseCommand({
    modelId,
    system: [{ text: SYSTEM_PROMPT }],
    messages: [{ role: 'user', content: [{ text: userPrompt }] }],
    // temperature 0 = greedy decoding, the most deterministic setting Bedrock exposes,
    // so re-verifying the same post gives the same status/route instead of flip-flopping.
    inferenceConfig: { maxTokens: 3000, temperature: 0 },
  })
  const response = await getClient().send(command)
  const text = (response.output?.message?.content ?? []).map((c) => c.text ?? '').join('')
  return extractJson(text)
}

const MAX_GROUNDING_CLAIMS = 3

// Claude's training data has a cutoff and it has no live web access, so the first pass can
// only guess at events near/after that cutoff (it marks them "unverifiable"). Here we take
// its own cited sources, actually fetch their real content (unlike attachReachability,
// which only checks HTTP status), and — if we got real text — ask it to re-check the post
// against that live evidence instead of its frozen memory.
async function groundWithEvidence(post, entry, modelId, today) {
  const candidates = (entry?.claims ?? [])
    .filter((claim) => claim.verdict === 'unverifiable')
    .flatMap((claim) => (claim.sources ?? []).filter((s) => s.reachable && s.url).map((s) => ({ claim, source: s })))
    .slice(0, MAX_GROUNDING_CLAIMS)

  if (!candidates.length) return entry

  const fetched = await mapLimited(candidates, 4, async ({ claim, source }) => ({
    claim,
    source,
    text: await fetchPageText(source.url),
  }))
  const withEvidence = fetched.filter((f) => f.text)
  if (!withEvidence.length) return entry

  const evidenceBlocks = withEvidence.map(
    ({ claim, source, text }) =>
      `Claim: "${claim.claim}"\nSource: ${source.url} (${source.title ?? source.publisher ?? 'untitled'})\nFetched content excerpt:\n"""\n${text}\n"""`,
  )

  try {
    const grounded = await callModel(buildGroundingUserPrompt(post, today, evidenceBlocks), modelId)
    return grounded
  } catch (err) {
    console.warn(`[api/verify] grounding pass failed for ${post.id}, keeping ungrounded result:`, err.message)
    return entry
  }
}

async function verifyPost(post, modelId, today) {
  let entry = await callModel(buildUserPrompt(post, today), modelId)
  await attachReachability(entry)
  entry = await groundWithEvidence(post, entry, modelId, today)
  const linkCheck = await attachReachability(entry)
  return { entry, linkCheck }
}

function fingerprint(postsRaw, modelId, today) {
  return createHash('sha1').update(postsRaw).update(SYSTEM_PROMPT).update(modelId).update(today).digest('hex')
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

async function buildVerification(postsRaw, modelId, today) {
  const posts = JSON.parse(postsRaw)
  const startedAt = Date.now()

  const settled = await mapLimited(posts, CONCURRENCY, async (post) => {
    try {
      return { post, result: await verifyPost(post, modelId, today) }
    } catch {
      try {
        return { post, result: await verifyPost(post, modelId, today) }
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
    fingerprint: fingerprint(postsRaw, modelId, today),
  }
  await writeDiskCache(payload)
  return payload
}

let cache = null
let inFlight = null

export async function runVerification({ force = false } = {}) {
  if (cache && !force) return cache
  if (inFlight && !force) return inFlight

  const postsRaw = loadPostsRaw()
  const modelId = getModelId()
  const today = new Date().toISOString().slice(0, 10) // re-verifies daily so "today" never goes stale

  inFlight = (async () => {
    if (!force) {
      const saved = await readDiskCache(fingerprint(postsRaw, modelId, today))
      if (saved) {
        console.log(`[api/verify] reusing cached fact check from ${saved.generatedAt}`)
        return saved
      }
    }
    return buildVerification(postsRaw, modelId, today)
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
