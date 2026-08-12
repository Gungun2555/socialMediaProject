# SocialVeri

React + Vite + Tailwind UI for reviewing social media posts and legal records side by side.

```bash
npm install
npm run dev      # http://localhost:5173
npm run build    # static build into dist/
```

**Login** — any username with the password `kaidoko@@2026` (client-side only, kept in `sessionStorage`).

## Data

Both datasets use the same record schema, so one viewer renders both:

```json
{
  "id": "post_001",
  "username": "seven_shots_",
  "caption": "text, may contain [markdown links](https://example.com) and \n\n paragraphs",
  "hashtags": ["#tag"],
  "links": ["https://example.com"],
  "platform": "Instagram"
}
```

| File | Records | Notes |
| --- | --- | --- |
| `post/posts.json` | 6 | Social media posts |
| `legal_document/legal_documents.json` | 8 | Synthetic legal records — notice, order, FIR, RTI reply, affidavit, PIL, judgment, takedown notice |

Every legal caption opens with a `[SYNTHETIC SAMPLE — …]` marker. The UI lifts that line into a
warning banner and shows a dataset-level disclaimer in the sidebar: the parties, case numbers and
orders are fictional and must not be presented as genuine legal records.

Records are imported at build time — no backend, no fetch. Add a record by appending an object to
either JSON file; the dropdowns and platform filters pick it up automatically.

## Media

Media is matched to a record by folder name — no JSON wiring needed:

```
images/
  post_001/01.png 02.png 03.png     -> 3-image carousel
  post_004/01.mp4                   -> video player
  post_005/01.png … 06.png          -> 6-image carousel
```

The folder name must equal the record's `id`. Files are ordered naturally by filename, `.mp4`,
`.webm`, `.mov` and `.m4v` render as video and the rest as images. A record with no folder shows
"No media found in images/&lt;id&gt;/". To add media for a legal record, create `images/legal_001/`.

Media is bundled by Vite, so `dist/` carries a hashed copy of every file — the 26 MB `.mp4` in
`post_004` dominates build output.

## Layout

```
index.html
src/
  App.jsx                    tabs, dropdowns, session state
  data.js                    imports both JSON datasets
  index.css                  Tailwind v4 theme tokens (white + orange)
  lib/format.jsx             caption parsing, inline markdown links
  components/
    Login.jsx
    RecordView.jsx           renders one record from either dataset
    ui.jsx                   Card, Pill, Meta, Chips, RawRecord
```
