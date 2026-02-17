# HEALTH.md - Axiom Reader

*Last updated: 2025-02-17*

## Project Status: 🟢 ACTIVE

Section 1.1 is ~80% complete. Reader rendering works, need real figures + polish.

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Content (JSON)** | ✅ Ready | 858 JSON files across 20+ books |
| **Pipeline** | ✅ Ready | LaTeX → JSON converter working |
| **TikZ Extractor** | ✅ Ready | TikZ → SVG script exists |
| **Astro Project** | ✅ Done | Scaffolded with React + Tailwind |
| **Reader Layout** | ✅ Done | Header + content area |
| **Content Renderer** | ✅ Done | All 11 content types for 1.1 |
| **Math Rendering** | ✅ Done | MathJax inline + display |
| **Definition Box** | ✅ Done | Gray/sage styling |
| **Theorem Box** | ✅ Done | Blue styling |
| **Example Box** | ✅ Done | Warm/rose styling |
| **Exercise Box** | ✅ Done | Blue, collapsible solution |
| **Caution Box** | ✅ Done | Amber warning |
| **Figure Rendering** | 🟡 Placeholder | Need real TikZ SVGs |
| **Figure Lightbox** | 🔴 Not Started | Click to enlarge |
| **Navigation Sidebar** | 🔴 Not Started | OpenStax-style TOC |
| **Search** | 🔴 Not Started | In-book search |
| **Mobile Responsive** | 🔴 Not Started | Need to test/fix |
| **Accessibility** | 🔴 Not Started | WCAG 2.1 AA |
| **PDF Export** | ⏸️ Paused | Using LaTeX for now |

---

## Current Milestone

**Section 1.1 Perfect** — Get one section bulletproof as template.

### Remaining Tasks

| Task | Priority | Effort |
|------|----------|--------|
| Run TikZ extraction for ch01 | P0 | 30 min |
| Figure lightbox component | P1 | 1 hr |
| Mobile responsive check | P1 | 1 hr |
| Epigraph/scripture styling | P2 | 30 min |
| Basic a11y (focus states) | P2 | 1 hr |

---

## Persona Scores

| Persona | Score | Notes |
|---------|-------|-------|
| 🛡️ Security Sam | 9/10 | Static site, low attack surface |
| 🎨 UX Uma | 7/10 | Good styling, needs nav sidebar |
| 📚 Professor Pete | 8/10 | Content renders well |
| ⚡ Performance Pat | 8/10 | Astro SSG is fast |
| 🏛️ Compliance Carl | 4/10 | A11y work pending |
| 📖 Student Sarah | 7/10 | Readable, needs mobile polish |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Astro | 5.17.2 |
| Components | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Math | MathJax | 3.x |
| Build | Vite | via Astro |
| Hosting | Vercel | Planned |

---

## File Structure

```
~/Desktop/Axiom-Reader/
├── content/           # 858 JSON section files
│   ├── vol1/
│   │   └── ch01/
│   │       └── sec01.json
│   └── ...
├── pipeline/          # LaTeX → JSON tools
│   ├── latex_converter.py
│   └── extract_tikz.py
├── public/
│   └── figures/       # SVG figures
├── src/
│   ├── components/
│   │   ├── reader/
│   │   │   ├── ContentRenderer.tsx
│   │   │   └── RichText.tsx
│   │   └── environments/
│   │       ├── Definition.tsx
│   │       ├── Theorem.tsx
│   │       ├── Example.tsx
│   │       └── Proof.tsx
│   ├── layouts/
│   │   └── ReaderLayout.astro
│   ├── lib/
│   │   ├── types.ts
│   │   └── content.ts
│   ├── pages/
│   │   ├── index.astro
│   │   └── test.astro
│   └── styles/
│       └── global.css
├── CLAUDE.md
├── GOALS.md
├── HEALTH.md
├── HEALTH-LOG.md
├── PERSONAS.md
├── README.md
└── ROADMAP.md
```

---

## Blockers

None currently.

---

## Next Session

1. Run `extract_tikz.py` on Chapter 1 figures
2. Add figure lightbox component
3. Test mobile responsive
4. Commit + push progress
