# HEALTH.md - Axiom Reader

*Last updated: 2026-02-17*

## Project Status: 🟡 PLANNING

The reader is being rebuilt from scratch with Astro + React. Content and pipeline preserved from v1.

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Content (JSON)** | ✅ Ready | 858 JSON files across 20+ books |
| **Pipeline** | ✅ Ready | LaTeX → JSON converter working |
| **TikZ Extractor** | ✅ Ready | TikZ → SVG extraction working |
| **Astro Project** | 🔴 Not Started | Need to scaffold |
| **Reader Layout** | 🔴 Not Started | Sidebar + content area |
| **Content Renderer** | 🔴 Not Started | JSON → React components |
| **Math Rendering** | 🔴 Not Started | MathJax integration |
| **Environments** | 🔴 Not Started | Definition/Theorem/Example boxes |
| **Navigation** | 🔴 Not Started | TOC sidebar, prev/next |
| **Search** | 🔴 Not Started | In-book search |
| **Accessibility** | 🔴 Not Started | WCAG 2.1 AA compliance |
| **PDF Export** | 🔴 Not Started | Keep using LaTeX for now |

---

## Persona Scores

| Persona | Score | Notes |
|---------|-------|-------|
| 🛡️ Security Sam | 8/10 | Low risk (static reader) |
| 🎨 UX Uma | —/10 | Primary focus |
| 📚 Professor Pete | —/10 | Content exists, renderer pending |
| ⚡ Performance Pat | —/10 | Not measurable yet |
| 🏛️ Compliance Carl | —/10 | Critical for contracts |
| 📖 Student Sarah | —/10 | Core user |

---

## Architecture

```
User visits atlasclassicalpress.com/books/vol1/ch01/sec01
         ↓
    Astro SSG (pre-rendered HTML)
         ↓
    React Island hydrates (interactive components)
         ↓
    MathJax renders equations
         ↓
    User reads, navigates, searches
```

**Design principles:**
- Static-first (Astro)
- Hydrate only what needs interactivity (React islands)
- Accessible by default (MathJax a11y)
- Fast on slow connections

---

## Priority Tasks

### P0 — Must Have (Week 1-2)

- [ ] Scaffold Astro project
- [ ] Create reader layout (sidebar + content)
- [ ] Build ContentRenderer (JSON → components)
- [ ] Integrate MathJax with a11y
- [ ] Style Definition/Theorem/Example boxes
- [ ] Implement collapsible sidebar
- [ ] Add prev/next navigation

### P1 — Should Have (Week 2-3)

- [ ] Figure component with lightbox
- [ ] Table rendering
- [ ] Exercise component (collapsible solution)
- [ ] In-book search
- [ ] Text size control
- [ ] Mobile responsive design

### P2 — Nice to Have (Week 3-4)

- [ ] Progress tracking (localStorage)
- [ ] Bookmarks
- [ ] Highlights/annotations
- [ ] Keyboard shortcuts
- [ ] Print stylesheet

### P3 — Future

- [ ] Offline support (PWA)
- [ ] EPUB export
- [ ] Interactive exercises
- [ ] User accounts
- [ ] LMS integration

---

## Blockers

None currently.

---

## Tech Stack

| Layer | Technology | Rationale |
|-------|------------|-----------|
| Framework | Astro | Static-first, fast, good DX |
| Components | React | Familiar, good ecosystem |
| Styling | Tailwind CSS | Rapid styling, consistent design |
| Math | MathJax 3 | Best accessibility, wide LaTeX support |
| Build | Vite (via Astro) | Fast builds |
| Hosting | Vercel / Cloudflare | Edge deployment, fast globally |

---

## Design Reference

**OpenStax** (openstax.org) — Key patterns to adopt:
- Collapsible sidebar with icon tabs (Contents / Highlights)
- Yellow/gold header bar with book + section title
- Gray boxes for definitions
- Numbered examples with clear problem/solution
- Search in sidebar
- Text size control (AA button)
- Previous/Next navigation at bottom
- Click-to-enlarge figures

---

## Content Inventory

| Book | Chapters | Sections | Status |
|------|----------|----------|--------|
| Calculus Vol 1 | 6 | 39 | ✅ Content ready |
| Algebra 1 | ~10 | ~40 | ✅ Content ready |
| Algebra 2 | ~12 | ~50 | ✅ Content ready |
| Precalculus | ~10 | ~40 | ✅ Content ready |
| Geometry | ~12 | ~48 | ✅ Content ready |
| + 15 more books | — | — | ✅ Content ready |

**Total: 858 JSON section files**

---

## Output Formats

| Format | Source | Status |
|--------|--------|--------|
| **Web** | JSON → Astro/React | 🔴 Building |
| **PDF (Download)** | LaTeX → pdflatex | ✅ Existing |
| **PDF (Print)** | LaTeX → print shop | ✅ Existing |
| **EPUB** | JSON → epub-gen | 🔴 Future |

---

## Notes

- Edition (Christian/Secular) is determined by domain, not user toggle
- Keep LaTeX source as the "source of truth" for print
- JSON is derived from LaTeX, used for web only
- Pipeline scripts are solid and production-ready
- Vol 1 figures: 38/42 extracted to SVG (Feb 10)

---

## Next Session

1. Scaffold Astro project (`npm create astro@latest`)
2. Set up Tailwind CSS
3. Create basic reader layout
4. Build first content component (Paragraph)
5. Integrate MathJax
