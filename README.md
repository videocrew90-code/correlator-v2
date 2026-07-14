# Correlator V2

Paste a social media post. Correlator checks Reddit and Hacker News to see
whether the same idea is already spreading, writes an evidence-backed
rewrite, and — only if one genuinely fits — matches it to a meme template.
If nothing fits, it says so instead of forcing one.

This is a deliberately trimmed rebuild: one core loop, done well, instead of
a long feature list. See "What's not included" below for what was cut and why.

## Quick start

1. Download/unzip this project.
2. Open `index.html` directly in a browser (double-click it), or serve the
   folder with any static file server. No build step, no npm install.
3. Click **Settings** in the sidebar, paste a free Gemini API key from
   https://aistudio.google.com/apikey, click **Save key**.
4. Click **Research**, paste a post, click **Run correlation**.

## Deploying to GitHub Pages

1. Push this folder to a new GitHub repository (or use GitHub's web UI:
   "Add file → Create new file" and type the folder path, e.g.
   `css/tokens.css`, into the filename box — GitHub creates folders for you).
2. Repo **Settings → Pages** → Source: deploy from branch `main`, folder `/ (root)`.
3. Your app will be live at `https://<username>.github.io/<repo>/` within a minute or two.

## How it works

1. **Understand** — one Gemini call extracts topic, intent, emotion,
   audience, keywords, and search queries from the pasted post.
2. **Research** — those queries are run against Reddit's public search and
   the Hacker News (Algolia) API, in parallel, no keys required for either.
   Results are deduplicated by URL and ranked by a normalized engagement score.
3. **Generate** — a second Gemini call writes an evidence-backed rewrite,
   2-3 alternate angles, hooks, hashtags, and a posting recommendation,
   grounded in the actual evidence found (not just the original post).
4. **Match a meme** — Imgflip's free `get_memes` endpoint supplies a current
   template list. A third Gemini call picks the best-fitting template (or
   says nothing fits) and writes captions for it. Captions are rendered as
   an HTML text overlay on the template image client-side — no separate
   image-captioning key needed, no canvas/CORS issues.
5. Every analysis is saved to `localStorage` and browsable from History.

## Bring your own key

Only one API key is ever requested: Gemini. It's stored in this browser's
`localStorage` and sent only to `generativelanguage.googleapis.com` — never
anywhere else. Remove it any time from Settings.

## What's not included (and why)

The original spec asked for YouTube/GDELT/X search, a dozen extra content
formats (Instagram/Newsletter/Carousel/Podcast/Video-hook), a full analytics
dashboard (virality/novelty/momentum/controversy scoring), PDF/print export,
and per-platform settings. All of that adds real API-key and architecture
overhead without changing the core value: does this idea already exist, and
here's a better, evidence-backed version plus a meme. Those are reasonable
follow-ups once this loop is working well for you, not prerequisites for it.

## Known limitations

- Reddit's public search endpoint doesn't always send CORS headers depending
  on network path — if a Reddit request fails in your browser, the app just
  falls back to Hacker News results rather than crashing.
- Meme template variety is capped by what Imgflip's `get_memes` endpoint
  currently returns (roughly their top 100 templates).
- History is stored per-browser (localStorage), not synced across devices.

## Project structure

```
index.html
css/
  tokens.css        design tokens (color, type, spacing)
  base.css          reset + global typography
  layout.css        sidebar + workspace grid
  components.css    cards, buttons, thread board, meme frame, etc.
js/
  main.js           entry point, wires everything together
  services/         external API clients (gemini, reddit, hackernews, imgflip, storage)
  core/              pipeline.js (orchestrator), evidence.js (rank/dedupe), memeEngine.js
  components/        one file per view + toast/router
  utils/              dom.js, format.js
prompts/
  analyzePrompt.js   every Gemini prompt template, kept in one place
```
