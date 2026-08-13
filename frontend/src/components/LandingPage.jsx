import Logo from './Logo.jsx'
import { posts } from '../data.js'
import { CLAIM_VERDICT } from '../lib/verification.js'

/**
 * Marketing page shown before sign-in. The pipeline section mirrors the
 * 15 stages of the Social Verification System flow.
 */
export default function LandingPage({ onGetStarted }) {
  return (
    <div className="min-h-full bg-white">
      <TopNav onGetStarted={onGetStarted} />
      <Hero onGetStarted={onGetStarted} />
      <Features />
      <Pipeline />
      <Footer />
    </div>
  )
}

/* ------------------------------------------------------------------ */

function TopNav({ onGetStarted }) {
  return (
    <header className="sticky top-0 z-30 border-b border-sky-light/50 bg-card/85 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-3">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="text-[17px] font-bold tracking-tight">
            True<span className="text-sky">post</span>
          </span>
        </div>
        <button
          onClick={onGetStarted}
          className="cursor-pointer rounded-lg bg-gradient-to-br from-sky to-navy px-4 py-2 text-sm font-semibold text-white shadow-sm shadow-sky/25 transition hover:brightness-105"
        >
          Sign in
        </button>
      </div>
    </header>
  )
}

function Hero({ onGetStarted }) {
  return (
    <section className="relative flex min-h-[calc(100vh-57px)] items-center overflow-hidden border-b border-sky-light/50 bg-[radial-gradient(1000px_520px_at_15%_-15%,rgba(33,150,243,0.18),transparent_60%),radial-gradient(760px_480px_at_100%_0%,rgba(13,71,161,0.10),transparent_60%)]">
      {/* soft brand blobs: they give the hero art something to sit on, so the
          cropped edges of social.png dissolve into colour instead of white */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        <span className="absolute -top-40 right-[-12%] size-[44rem] animate-blob rounded-full bg-sky/25 blur-[120px]" />
        <span className="absolute bottom-[-24%] right-[4%] size-[34rem] animate-blob-slow rounded-full bg-navy/15 blur-[130px]" />
        <span className="absolute bottom-[-28%] left-[-10%] size-[30rem] animate-blob-slow rounded-full bg-sky-light/30 blur-[120px]" />
      </div>

      <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-8 overflow-hidden px-5 py-16 lg:grid-cols-[1fr_1.4fr]">
        {/* left: text */}
        <div>
          <span className="inline-flex items-center gap-2 rounded-full border border-sky-light bg-sky-tint px-3 py-1 text-xs font-semibold text-navy">
            <span className="size-1.5 rounded-full bg-sky" />
            15-stage verification pipeline
          </span>

          <h1 className="mt-6 text-5xl font-bold leading-[1.08] tracking-tight sm:text-6xl">
            Check what a post actually claims —{' '}
            <span className="text-sky">before it spreads.</span>
          </h1>

          <p className="mt-6 max-w-xl text-xl leading-relaxed text-ink-soft">
            Truepost ingests posts from X, Facebook and Instagram, pulls the claims out of text,
            images and video, gathers evidence from ranked public sources, and puts an AI verdict in
            front of a human reviewer.
          </p>

          <div className="mt-10 flex flex-wrap items-center gap-4">
            <button
              onClick={onGetStarted}
              className="cursor-pointer rounded-xl bg-gradient-to-br from-sky to-navy px-8 py-4 text-base font-semibold text-white shadow-md shadow-sky/30 transition hover:brightness-105 active:scale-[.98]"
            >
              Open the workspace
            </button>
            <a
              href="#features"
              className="cursor-pointer rounded-xl border border-sky-light/50 bg-card px-8 py-4 text-base font-semibold text-ink-soft transition hover:border-sky hover:text-ink"
            >
              See how it works
            </a>
          </div>
        </div>

        {/* right: hero image */}
        <div className="relative flex items-center justify-center lg:justify-end lg:overflow-visible">
          {/* halo directly behind the art, and a fade on the image itself so the
              hard bottom crop of the PNG never shows as a straight edge */}
          <span
            aria-hidden="true"
            className="pointer-events-none absolute inset-x-[2%] inset-y-[6%] rounded-[50%] bg-white/70 blur-3xl"
          />
          <img
            src="/social.png"
            alt="Truepost verification dashboard"
            className="relative w-full drop-shadow-2xl [mask-image:linear-gradient(to_bottom,#000_78%,transparent_98%)] lg:w-[90%] lg:max-w-none"
            draggable={false}
          />
        </div>
      </div>
    </section>
  )
}

function Stat({ value, label }) {
  return (
    <div>
      <dt className="text-3xl font-bold tracking-tight text-navy">{value}</dt>
      <dd className="mt-1 text-[13px] text-muted">{label}</dd>
    </div>
  )
}

/* ------------------------------------------------------------------ */

const FEATURES = [
  {
    icon: IconFeed,
    title: 'Multi-platform ingestion',
    body: 'Fetch posts from the X and Meta APIs on a schedule, with rate-limit handling, deduplication and a job per batch. Raw JSON, post metadata and media references are kept intact for audit.',
    stages: '1–3',
  },
  {
    icon: IconExtract,
    title: 'Content extraction',
    body: 'Text, hashtags, mentions, URLs, engagement counts and platform metadata are split out of the raw payload into named fields you can query.',
    stages: '4',
  },
  {
    icon: IconOcr,
    title: 'OCR and media analysis',
    body: 'Carousels and video carry most political messaging as pixels. OCR lifts the text back out, and media analysis records logos, objects and file metadata.',
    stages: '5–6',
  },
  {
    icon: IconClaim,
    title: 'Claim extraction',
    body: 'An NLP/LLM pass turns normalized content into discrete factual claims, with the entities, dates, locations, people and organisations each claim depends on.',
    stages: '7',
  },
  {
    icon: IconSearch,
    title: 'Evidence retrieval and source ranking',
    body: 'Generated queries run against web and domain-restricted search. Every hit is classified — official, news, verified channel or other — and scored for reliability before it becomes evidence.',
    stages: '8–10',
  },
  {
    icon: IconVerdict,
    title: 'AI verification engine',
    body: 'The LLM weighs claims against collected evidence and returns a verdict — true, false, misleading or unverifiable — with reasoning, a confidence score and per-claim results linked to sources.',
    stages: '11–12',
  },
  {
    icon: IconCorrection,
    title: 'Correction engine',
    body: 'Where a post is wrong or misleading, the system drafts the fix: revised text, keyword and hashtag suggestions, and image recommendations.',
    stages: '13',
  },
  {
    icon: IconHuman,
    title: 'Human-in-the-loop review',
    body: 'Nothing publishes itself. A reviewer sees the original post, the verdict and confidence, the claims and evidence, the suggested corrections and the source links — then approves, edits or rejects.',
    stages: '14–15',
  },
]

function Features() {
  return (
    <section id="features" className="border-b border-sky-light/50">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel>Features</SectionLabel>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
          Everything between a raw post and a published correction
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          Each stage writes its output to the record, so a verdict can always be traced back to the
          claim, the evidence and the source that produced it.
        </p>

        <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {FEATURES.map(({ icon: Icon, title, body, stages }) => (
            <article
              key={title}
              className="rounded-2xl border border-sky-light/50 bg-card p-6 transition hover:border-sky hover:shadow-lg hover:shadow-sky/5"
            >
              <div className="flex items-center justify-between">
                <span className="grid size-10 place-items-center rounded-xl bg-sky-tint text-navy">
                  <Icon />
                </span>
                <span className="font-mono text-[11px] text-muted/70">stage {stages}</span>
              </div>
              <h3 className="mt-4 text-[15px] font-bold tracking-tight">{title}</h3>
              <p className="mt-2 text-[13.5px] leading-relaxed text-ink-soft">{body}</p>
            </article>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

const PHASES = [
  {
    name: 'Collect',
    tone: 'from-sky/15',
    steps: [
      ['1', 'Data sources', 'X, Facebook and Instagram APIs'],
      ['2', 'Post ingestion service', 'Fetch, rate-limit, deduplicate, create job'],
      ['3', 'Raw post storage', 'Post metadata, raw JSON, media references'],
      ['4', 'Content extraction', 'Text, hashtags, mentions, URLs, engagement'],
    ],
  },
  {
    name: 'Understand',
    tone: 'from-sky-light/15',
    steps: [
      ['5', 'Media processing', 'OCR on images, logo and object analysis'],
      ['6', 'Content normalization', 'Merge every extracted signal into one format'],
      ['7', 'Claim extraction', 'Factual claims, entities, dates, people, places'],
    ],
  },
  {
    name: 'Verify',
    tone: 'from-sky/15',
    steps: [
      ['8', 'Search and retrieval', 'Query generation, web and domain-restricted search'],
      ['9', 'Source classification', 'Official, news, verified channel — ranked by reliability'],
      ['10', 'Evidence collection', 'High-quality sources gathered with metadata'],
      ['11', 'AI verification engine', 'Analyse, reason, decide, score confidence'],
    ],
  },
  {
    name: 'Resolve',
    tone: 'from-sky-light/15',
    steps: [
      ['12', 'Verification result', 'Verdict, confidence, per-claim results, sources'],
      ['13', 'Correction engine', 'Text, keyword, hashtag and image suggestions'],
      ['14', 'Human-in-the-loop review', 'Approve, edit or reject with full context'],
      ['15', 'Final content', 'Approved output after review and edits'],
    ],
  },
]

function Pipeline() {
  return (
    <section id="pipeline" className="border-b border-sky-light/50 bg-sky-tint/70">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel>Pipeline</SectionLabel>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
          Fifteen stages, four phases
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          A post enters at stage 1 and leaves at stage 15 as reviewed, publishable content. Every
          intermediate artefact — raw JSON, OCR text, claims, evidence, verdict — stays attached to
          the record.
        </p>

        <div className="mt-12 grid gap-5 lg:grid-cols-4">
          {PHASES.map((phase, phaseIndex) => (
            <div key={phase.name} className="relative">
              <div className="mb-4 flex items-center gap-2">
                <span className="font-mono text-xs font-bold text-navy">
                  0{phaseIndex + 1}
                </span>
                <h3 className="text-sm font-bold uppercase tracking-[0.1em]">{phase.name}</h3>
              </div>
              <div
                className={`space-y-3 rounded-2xl bg-gradient-to-b ${phase.tone} to-transparent p-3`}
              >
                {phase.steps.map(([n, title, detail]) => (
                  <div key={n} className="rounded-xl border border-sky-light/50 bg-card p-4">
                    <div className="flex items-baseline gap-2">
                      <span className="grid size-5 flex-none place-items-center rounded-md bg-sky-tint font-mono text-[10px] font-bold text-navy">
                        {n}
                      </span>
                      <span className="text-[13.5px] font-bold">{title}</span>
                    </div>
                    <p className="mt-1.5 pl-7 text-xs leading-relaxed text-muted">{detail}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

/* ------------------------------------------------------------------ */

const WORKSPACE_POINTS = [
  ['Verdicts at a glance', 'The queue is an explore grid of post thumbnails, each with a green, amber or red badge in the corner, so a batch can be triaged without opening a single record.'],
  ['Claim by claim, not post by post', 'Every post is broken into its checkable claims, and each claim carries its own verdict, the reasoning behind it and the sources it rests on.'],
  ['Sources checked, not just cited', 'Each cited URL is probed server-side before it reaches you. Links that did not resolve are marked as unconfirmed rather than presented as evidence.'],
  ['Field-level corrections', 'Where something has to change, the panel names the field — caption, hashtags, a specific claim — and says what is wrong with it.'],
  ['Filter by status or search', 'Narrow the queue to clear, changes-needed or flagged posts, or search across usernames, platforms, captions and hashtags.'],
  ['Media reviewed alongside text', 'Images and video attached to a post render as a carousel with a thumbnail strip and keyboard navigation, so the pixels are checked next to the caption.'],
]

function Workspace({ onGetStarted }) {
  return (
    <section id="workspace" className="border-b border-sky-light/50">
      <div className="mx-auto max-w-6xl px-5 py-20">
        <SectionLabel>The workspace</SectionLabel>
        <h2 className="mt-3 max-w-2xl text-3xl font-bold tracking-tight">
          What a reviewer sees in this build
        </h2>
        <p className="mt-4 max-w-2xl text-[15px] leading-relaxed text-ink-soft">
          The review surface is live today: posts are loaded from local JSON, and the verdicts come
          back from Claude on AWS Bedrock with every cited link probed. The pipeline stages above
          describe the wider system it plugs into.
        </p>

        <div className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
          {WORKSPACE_POINTS.map(([title, body]) => (
            <div key={title} className="flex gap-3">
              <IconCheck />
              <div>
                <h3 className="text-[14.5px] font-bold tracking-tight">{title}</h3>
                <p className="mt-1 text-[13.5px] leading-relaxed text-ink-soft">{body}</p>
              </div>
            </div>
          ))}
        </div>

        <div className="mt-14 flex justify-center">
          <button
            onClick={onGetStarted}
            className="cursor-pointer rounded-lg bg-gradient-to-br from-sky to-navy px-6 py-3 text-sm font-semibold text-white shadow-sm shadow-sky/30 transition hover:brightness-105"
          >
            Open the workspace
          </button>
        </div>
      </div>
    </section>
  )
}

function Footer() {
  return (
    <footer className="mx-auto max-w-6xl px-5 py-12">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <Logo className="h-7 w-auto" />
          <span className="text-sm font-bold">
            True<span className="text-sky">post</span>
          </span>
        </div>
        <p className="max-w-xl text-xs leading-relaxed text-muted">
          Posts bundled with this build are real public content loaded for review. Verdicts are
          generated by a language model and are not a published fact check until a human reviewer
          has approved them.
        </p>
      </div>
    </footer>
  )
}

function SectionLabel({ children }) {
  return (
    <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-navy">
      {children}
    </span>
  )
}

/* --- icons: 20px, inherit currentColor --------------------------- */

const svg = { width: 20, height: 20, viewBox: '0 0 24 24', fill: 'none', stroke: 'currentColor', strokeWidth: 1.8, strokeLinecap: 'round', strokeLinejoin: 'round' }

function IconFeed() {
  return (
    <svg {...svg}>
      <rect x="3" y="4" width="18" height="16" rx="2" />
      <path d="M7 9h6M7 13h10M7 17h4" />
    </svg>
  )
}

function IconExtract() {
  return (
    <svg {...svg}>
      <path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z" />
      <path d="M14 3v5h5M9 13h6M9 17h4" />
    </svg>
  )
}

function IconOcr() {
  return (
    <svg {...svg}>
      <path d="M3 8V5a2 2 0 0 1 2-2h3M21 8V5a2 2 0 0 0-2-2h-3M3 16v3a2 2 0 0 0 2 2h3M21 16v3a2 2 0 0 1-2 2h-3" />
      <path d="M8 12h8" />
    </svg>
  )
}

function IconClaim() {
  return (
    <svg {...svg}>
      <path d="M12 3a4 4 0 0 0-4 4c-1.7.7-3 2.4-3 4.4 0 1.5.7 2.8 1.8 3.6-.2.5-.3 1-.3 1.5A3.5 3.5 0 0 0 12 20a3.5 3.5 0 0 0 5.5-3.5c0-.5-.1-1-.3-1.5 1.1-.8 1.8-2.1 1.8-3.6 0-2-1.3-3.7-3-4.4a4 4 0 0 0-4-4z" />
    </svg>
  )
}

function IconSearch() {
  return (
    <svg {...svg}>
      <circle cx="11" cy="11" r="7" />
      <path d="m20 20-3.5-3.5" />
    </svg>
  )
}

function IconVerdict() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="9" r="6" />
      <path d="m9 14-1 7 4-2 4 2-1-7M10 9l1.5 1.5L15 7" />
    </svg>
  )
}

function IconCorrection() {
  return (
    <svg {...svg}>
      <path d="M21 15a2 2 0 0 1-2 2H8l-4 4V6a2 2 0 0 1 2-2h13a2 2 0 0 1 2 2z" />
      <path d="m9 10 2 2 4-4" />
    </svg>
  )
}

function IconHuman() {
  return (
    <svg {...svg}>
      <circle cx="12" cy="8" r="3.5" />
      <path d="M5 20a7 7 0 0 1 14 0" />
    </svg>
  )
}

function IconCheck() {
  return (
    <span className="mt-0.5 grid size-6 flex-none place-items-center rounded-full bg-sky-tint text-navy">
      <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
        <path d="m5 13 4 4L19 7" />
      </svg>
    </span>
  )
}
