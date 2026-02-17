# HEALTH.md - Axiom Reader

*Last updated: 2025-02-17*

## Project Status: 🟢 VOL 1 READER-READY

All 39 sections of Calculus Volume 1 are rendering correctly with full figure support.

---

## Component Status

| Component | Status | Notes |
|-----------|--------|-------|
| **Content (JSON)** | ✅ Done | 39 sections, all content types |
| **Pipeline** | ✅ Done | LaTeX → JSON converter working |
| **TikZ Extraction** | ✅ Done | 113 figures extracted to SVG |
| **Astro Project** | ✅ Done | React + Tailwind v4 |
| **Dynamic Routing** | ✅ Done | `/vol1/ch01/sec01` pattern |
| **Reader Layout** | ✅ Done | Header + sidebar + content |
| **Content Renderer** | ✅ Done | All 11 content types |
| **Math Rendering** | ✅ Done | MathJax + custom macros |
| **Definition Box** | ✅ Done | Gray/sage styling |
| **Theorem Box** | ✅ Done | Teal border styling |
| **Example Box** | ✅ Done | Collapsible solutions |
| **Exercise Box** | ✅ Done | Show/hide solutions |
| **Caution Box** | ✅ Done | Amber warning |
| **Figure Rendering** | ✅ Done | 113 SVGs with alt text |
| **Navigation Sidebar** | ✅ Done | OpenStax-style TOC |
| **QA Verification** | ✅ Done | All 39 sections tested |
| **Figure Lightbox** | 🔴 Not Started | Click to enlarge |
| **Mobile Responsive** | 🟡 Needs Testing | Likely needs tweaks |
| **Accessibility** | 🟡 Partial | Alt text done, need focus states |
| **Search** | 🔴 Not Started | In-book search |
| **PDF Export** | ⏸️ Deferred | Using LaTeX for print |

---

## Vol 1 Stats

| Metric | Count |
|--------|-------|
| Chapters | 6 |
| Sections | 39 |
| Figures | 113 |
| Content blocks | ~2,500 |

### Figures by Chapter

| Chapter | In JSON | SVGs |
|---------|---------|------|
| Ch01 | 18 | 18 |
| Ch02 | 47 | 47 |
| Ch03 | 13 | 18 |
| Ch04 | 5 | 6 |
| Ch05 | 17 | 28 |
| Ch06 | 13 | 16 |

---

## Remaining Polish (Post-MVP)

| Task | Priority | Effort |
|------|----------|--------|
| Mobile responsive testing | P1 | 1-2 hrs |
| Accessibility audit (WCAG 2.1) | P1 | 2-3 hrs |
| Figure lightbox component | P2 | 1 hr |
| Epigraph/margin styling | P2 | 30 min |
| In-book search | P3 | 4+ hrs |

---

## Persona Scores

| Persona | Score | Notes |
|---------|-------|-------|
| 🛡️ Security Sam | 9/10 | Static site, minimal attack surface |
| 🎨 UX Uma | 8/10 | Clean design, needs mobile testing |
| 📚 Professor Pete | 9/10 | All content renders beautifully |
| ⚡ Performance Pat | 9/10 | Astro SSG is blazing fast |
| 🏛️ Compliance Carl | 6/10 | Alt text done, need WCAG audit |
| 📖 Student Sarah | 8/10 | Great reading experience |

---

## Tech Stack

| Layer | Technology | Version |
|-------|------------|---------|
| Framework | Astro | 5.x |
| Components | React | 19.x |
| Styling | Tailwind CSS | 4.x |
| Math | MathJax | 3.x |
| Build | Vite | via Astro |
| Hosting | Vercel | Planned |

---

## Repository

- **GitHub:** https://github.com/Claudio-Atlas/axiom-reader
- **Branch:** master

---

## Vol 2 Status: 🟡 IN PROGRESS

### Chapter 7 Figures (14 total - COMPLETE)

| Section | Figures | Status |
|---------|---------|--------|
| sec01 - Area Between Curves | 2 | ✅ SVG ready |
| sec02 - Disks/Washers | 2 | ✅ SVG ready |
| sec03 - Shells | 2 | ✅ SVG ready (incl. comparison diagram) |
| sec04 - Arc Length | 1 | ✅ SVG ready |
| sec05 - Work | 3 | ✅ SVG ready (pump + spring + cable) |
| sec06 - Centers of Mass | 3 | ✅ SVG ready (seesaw + strip + example) |
| sec08 - Hyperbolic | 1 | ✅ SVG ready |

**Location:** `public/figures/vol2/ch07/`

### Next: Vol 2 Pipeline

- [ ] Extract remaining TikZ from ch11 (31 figures - parametric/polar)
- [ ] Convert ch07-11 LaTeX → JSON
- [ ] Write alt text for all 39 Vol 2 figures
- [ ] QA test all 28 Vol 2 sections

---

## Next Steps

1. ~~Deploy to Vercel for preview URL~~ ✅ DONE
2. ~~Mobile responsive testing~~ ✅ Works great
3. ~~Accessibility fixes (skip link, landmarks)~~ ✅ DONE
4. ~~Custom domain setup~~ ✅ atlasclassicalpress.com + meridian-press.com
5. Vol 2 content pipeline
6. Full WCAG 2.1 AA audit (automated tools)
