# College Mathematics — Textbook

A standalone Astro + React reader for the *College Mathematics* companion textbook, served as a separate app from the MAT-144 FastAPI site. Forked from a copy of Axiom Reader (stripped to single-book, single-brand) and rebranded for College Mathematics.

**Author:** Clayton Ragsdale

## Quick Start

```bash
cd Textbook/
npm install
npm run dev          # localhost:4321
```

Build for production:

```bash
npm run build
npm run preview
```

## How content gets in

The book content is **auto-generated once** from the MAT-144 site's lesson data (`../routers/public.py`), then lives as JSON files in `content/college-math/` and is **edited directly** from there. The converter is a one-shot bootstrap, not a build step.

To re-run the converter (will overwrite existing JSON — only do this when you want to re-import from the FastAPI site):

```bash
npm run convert
# or directly:
python3 scripts/convert.py
```

Output:

```
content/college-math/
├── book.json                ← TOC + book metadata
├── ch01/sec01.json … sec06.json
├── ch02/...
├── ch03/...
└── ch04/...
```

24 sections (Topics 1-4 of MAT-144) come over on the first run. Topics 5-7 land once those lessons are authored on the FastAPI site.

## URL structure

- `/` — cover (title, author, "Start reading")
- `/college-math` — chapter list / TOC
- `/college-math/ch01/sec01` — section reader

## Project layout

```
Textbook/
├── content/college-math/      Generated JSON content (edit-in-place after bootstrap)
├── public/                    Static assets (figures, favicon)
├── scripts/
│   └── convert.py             One-shot bootstrap from ../routers/public.py
├── src/
│   ├── components/
│   │   ├── brand/             Single-brand BrandProvider + Logo
│   │   ├── environments/      Definition, Theorem, Example, Exercise, etc.
│   │   ├── reader/            Sidebar, ContentRenderer, SearchModal, etc.
│   │   └── MathJaxProvider.tsx
│   ├── layouts/ReaderLayout.astro
│   ├── lib/
│   │   ├── access.ts          Open access (no gate)
│   │   ├── books.ts           Single book entry
│   │   ├── content.ts
│   │   ├── edition.ts         Stub kept for API compat
│   │   └── types.ts
│   ├── pages/
│   │   ├── index.astro                          Cover
│   │   └── [bookId]/
│   │       ├── index.astro                      Chapter list
│   │       ├── answers.astro                    Answer key
│   │       ├── highlights.astro                 Saved highlights
│   │       └── [chapterId]/[sectionId].astro    Section reader
│   └── styles/
│       └── global.css         Axiom design tokens + reader typography
├── astro.config.mjs
├── package.json
└── tsconfig.json
```

## Removing this textbook entirely

This subfolder is fully self-contained. To remove the textbook feature:

1. `rm -rf Textbook/` from the standalone repo root
2. Remove any navbar link from `templates/public/base.html` that points to the deployed textbook URL

Nothing else in the FastAPI site references this folder.

## Provenance

Originally cloned from Axiom Reader (Atlas Classical Press / Meridian Press). All other books (Calculus Vol 1-3, Pre-algebra, Algebra 1-2, Linear Algebra) stripped. Dual-edition (Christian/secular) machinery stripped. Marketing/catalog pages stripped. AI tutor stripped. Reader core, environment renderers, MathJax integration, search, highlights, and dark/light theme retained.
