# CLAUDE.md — College Mathematics Textbook

## Project overview

Standalone Astro + React reader for the *College Mathematics* companion textbook. Lives inside the `MAT144-Hub-standalone/` repo as a logically separated subfolder (`Textbook/`) so it can be removed cleanly without touching the FastAPI site.

**Stack:** Astro 5 + React 19 + Tailwind v4 + MathJax 3 (better-react-mathjax) + TypeScript. Forked from Axiom Reader, stripped to single-book and single-brand.

## Containment principle

The Textbook subfolder is its own deployable app. The FastAPI site at `../` (the MAT-144 hub) is unaware of it except for an eventual navbar link pointing to the deployed textbook URL.

**The only one-way dependency:** `scripts/convert.py` reads `../routers/public.py` at bootstrap time. After that initial run, `content/college-math/` is the textbook's source of truth — never auto-synced.

To delete the textbook completely: `rm -rf Textbook/` and remove any navbar link from `../templates/public/base.html`. Zero residue elsewhere.

## Content workflow

**Bootstrap (one-time):**
```bash
python3 scripts/convert.py
```
Walks `../routers/public.py`'s `TOPICS` list, converts each authored lesson dict into a JSON section file. Writes 1 `book.json` + N section JSONs into `content/college-math/`.

**After bootstrap — edit JSON directly:**
The textbook is *not* a derivative view of the FastAPI site. Hand-edit the JSON to refine prose, add closing essays per topic, drop interactive bits that read awkwardly in a textbook, adjust pacing. Re-running the converter overwrites the JSON, so use that as a fresh import only.

**Block types** (matching the `ContentRenderer`'s switch):
- `paragraph`, `heading`
- `definition`, `theorem`, `example` (with collapsible solution)
- `exercise` (with collapsible answer)
- `summary`, `figure`, `callout`
- `proof`, `algorithm`, `method`, `connection`, `remark`, `tip`, `warning`, `caution`, `historical`, `table`, `list`

## Routing

- `/` — cover landing
- `/college-math` — chapter list
- `/college-math/answers` — answer key
- `/college-math/highlights` — saved highlights (localStorage)
- `/college-math/{chapterId}/{sectionId}` — section reader (e.g. `/college-math/ch01/sec01`)

`bookId` is always `college-math`. Single-book site.

## Brand

Single brand, hardcoded. `BrandProvider` returns:
- `name: 'College Mathematics'`
- `colors.primary: '#8B5CF6'` (violet)
- `showScripture: false`
- `showEpigraphs: false`

The original Axiom dual-edition machinery (Atlas Classical / Meridian) is stubbed out — `useBrand()` always returns this single brand.

## Deployment

`astro.config.mjs` has the Vercel adapter wired up. Deploy as a separate Vercel project — its own domain or subdomain. The MAT-144 FastAPI site links to it from the public navbar.

## What NOT to do

- Don't add other books here. If a second book is needed later, fork this folder.
- Don't auto-sync from `routers/public.py` on every build. The converter is a one-shot.
- Don't re-introduce the dual-edition pattern. Single-brand is the constraint.
- Don't import from `..` outside of the converter script. Textbook stays separable.
