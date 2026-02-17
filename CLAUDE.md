# CLAUDE.md - Axiom Reader

## Project Overview

**Axiom Reader** is a web-based textbook reader for Atlas Classical Press (Christian edition) and Meridian Press (secular edition) mathematics textbooks.

**Stack:** Astro + React Islands + Tailwind CSS

## Quick Commands

```bash
# Development
npm run dev              # Start dev server (localhost:4321)
npm run build            # Build for production
npm run preview          # Preview production build

# Pipeline (LaTeX → JSON conversion)
cd pipeline
python3 latex_converter.py --book vol1              # Convert one book
python3 latex_converter.py --all                    # Convert all books
python3 extract_tikz.py --book vol1                 # Extract TikZ → SVG
```

## Architecture

```
Axiom-Reader/
├── src/
│   ├── components/        # React components (islands)
│   │   ├── reader/        # Core reader components
│   │   │   ├── Sidebar.tsx
│   │   │   ├── ContentRenderer.tsx
│   │   │   ├── MathBlock.tsx
│   │   │   └── ...
│   │   └── environments/  # Content block renderers
│   │       ├── Definition.tsx
│   │       ├── Theorem.tsx
│   │       ├── Example.tsx
│   │       └── ...
│   ├── layouts/
│   │   └── ReaderLayout.astro
│   ├── pages/
│   │   ├── index.astro
│   │   └── [book]/
│   │       └── [chapter]/
│   │           └── [section].astro
│   └── styles/
│       └── reader.css
├── content/               # JSON textbook content (858 files)
│   ├── vol1/
│   ├── algebra-1/
│   └── ...
├── public/
│   └── figures/           # SVG figures extracted from TikZ
├── pipeline/              # LaTeX → JSON conversion tools
│   ├── latex_converter.py # Main converter
│   └── extract_tikz.py    # TikZ → SVG extractor
└── astro.config.mjs
```

## Content JSON Format

Each section is a JSON file with this structure:

```json
{
  "id": "vol1-ch01-sec01",
  "title": "What Is a Function?",
  "chapter": 1,
  "section": 1,
  "book": "vol1",
  "objectives": ["..."],
  "devotional": { "title": "...", "scripture": "...", "content": "..." },
  "epigraph": { "text": "...", "reference": "..." },
  "content": [
    { "type": "paragraph", "text": "..." },
    { "type": "definition", "id": "...", "number": "1.1", "title": "...", "content": "..." },
    { "type": "theorem", "id": "...", "number": "1.1", "title": "...", "content": "...", "label": "Theorem" },
    { "type": "example", "id": "...", "number": "1.1", "problem": "...", "solution": "..." },
    { "type": "proof", "content": "..." },
    { "type": "figure", "id": "...", "src": "...", "caption": "...", "alt": "..." },
    { "type": "heading", "level": 2, "text": "..." },
    { "type": "list", "ordered": true, "items": ["..."] },
    { "type": "table", "headers": ["..."], "rows": [["..."]], "alignment": ["left"] }
  ]
}
```

## Edition Handling

- **Christian edition (Atlas Classical Press):** Includes devotionals, scripture epigraphs, margin notes
- **Secular edition (Meridian Press):** Same content minus Christian elements

Edition is determined by **domain/brand**, not user toggle:
- `atlasclassicalpress.com` → Christian
- `meridianpress.com` → Secular (TBD)

Content blocks have optional `edition: "christian"` flag. Filter at render time based on brand context.

## Math Rendering

Math is stored as LaTeX strings and rendered client-side:
- **Inline:** `$...$` → MathJax/KaTeX inline
- **Display:** `$$...$$` → MathJax/KaTeX display block

Use **MathJax** (not KaTeX) for accessibility features (screen reader support, speech, braille).

## Key Design Decisions

1. **Astro + React Islands:** Static-first for performance, React only where interactivity needed
2. **MathJax over KaTeX:** Better accessibility (a11y extensions)
3. **JSON content:** Pre-converted from LaTeX for fast rendering
4. **LaTeX for print:** Keep LaTeX source for PDF/print output (don't try to generate print from web)
5. **No user edition toggle:** Edition determined by brand/domain

## Accessibility Requirements

For Section 508 / government contracts:
- WCAG 2.1 AA compliance
- MathJax a11y extensions enabled
- Semantic HTML (headings, landmarks, alt text)
- Keyboard navigation
- Screen reader testing

## Code Style

- TypeScript for all React components
- Tailwind CSS for styling
- Prefer composition over inheritance
- Keep components small and focused
- Use Astro for static pages, React for interactive islands

## Testing Checklist

Before shipping a section:
- [ ] All math renders correctly
- [ ] Figures display with captions
- [ ] Definition/Theorem/Example boxes styled correctly
- [ ] Navigation (prev/next) works
- [ ] TOC sidebar collapses/expands
- [ ] Search returns results
- [ ] Text size control works
- [ ] Screen reader announces content properly
