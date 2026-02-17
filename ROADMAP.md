# Axiom Reader Roadmap

*Created: 2025-02-17*

---

## Phase 1: Perfect Section 1.1 (Current Focus)

### Content Rendering Checklist

| Block Type | Count in 1.1 | Status | Notes |
|------------|--------------|--------|-------|
| paragraph | 19 | ✅ Done | Math renders inline |
| heading | 8 | ✅ Done | h2, h3, h4 styled |
| definition | 2 | ✅ Done | Gray box, teal label |
| theorem | 1 | ✅ Done | Blue box |
| example | 7 | ✅ Done | Warm/rose box |
| exercise | 30 | ✅ Done | Blue box, collapsible solution |
| figure | 3 | 🟡 Placeholder | Need real TikZ→SVG extraction |
| list | 2 | ✅ Done | Ordered & unordered |
| caution | 1 | ✅ Done | Amber warning box |
| historical | 1 | ✅ Done | Historical note box |
| strategy | 1 | ✅ Done | Strategy box |

### Remaining for 1.1 Perfect

- [ ] **Real figures** — Run `extract_tikz.py` on ch01 TikZ code
- [ ] **Figure lightbox** — Click to enlarge figures
- [ ] **Mobile responsive** — Test on small screens
- [ ] **Accessibility audit** — Screen reader test, keyboard nav
- [ ] **Learning objectives** — Link to relevant content sections
- [ ] **Epigraph styling** — Scripture quote at section start (Christian edition)
- [ ] **Print stylesheet** — Clean print version

---

## Phase 2: Navigation & Structure

### Collapsible Sidebar (OpenStax-style)

```
┌─────────────────────────────────────────────────┐
│ [≡] [📑]                                        │
├─────┬───────────────────────────────────────────┤
│     │                                           │
│ TOC │   Content Area                            │
│     │                                           │
│ 1.1 │   1.1 What Is a Function?                 │
│ 1.2 │                                           │
│ 1.3 │   [Definition 1.1]                        │
│ ... │   A function f from set A...             │
│     │                                           │
└─────┴───────────────────────────────────────────┘
```

**Features needed:**
- [ ] Collapsible left sidebar (hamburger toggle)
- [ ] Table of Contents tab
- [ ] Highlights/Bookmarks tab
- [ ] Current section highlighted
- [ ] Smooth scroll to section
- [ ] Remember collapsed state (localStorage)
- [ ] Mobile: slide-over drawer

### Header Bar

- [ ] Book title + section title (✅ have basic)
- [ ] Search box
- [ ] Text size control (AA button)
- [ ] Settings dropdown

### Bottom Navigation

- [ ] Previous/Next with section titles (✅ have basic arrows)
- [ ] Progress indicator (e.g., "Section 3 of 39")

---

## Phase 3: Reader Features

### Search
- [ ] In-book search
- [ ] Highlight search terms
- [ ] Jump to result
- [ ] Search across all books (future)

### Text Controls
- [ ] Font size adjustment (AA button)
- [ ] Font family option (serif/sans)
- [ ] Line spacing
- [ ] Dark mode / sepia mode

### Progress & Bookmarks
- [ ] Track reading progress (localStorage)
- [ ] Bookmark sections
- [ ] Highlight text + save
- [ ] Notes/annotations

### Keyboard Shortcuts
- [ ] `←` / `→` — Previous/Next section
- [ ] `t` — Toggle TOC sidebar
- [ ] `s` — Focus search
- [ ] `/` — Open command palette
- [ ] `Esc` — Close modals

---

## Phase 4: Polish & Accessibility

### WCAG 2.1 AA Compliance (Required for government contracts)

- [ ] Color contrast ratios
- [ ] Focus indicators
- [ ] Skip navigation link
- [ ] ARIA labels
- [ ] Screen reader testing
- [ ] Keyboard-only navigation
- [ ] MathJax a11y (speech, braille)

### Performance
- [ ] Lighthouse audit
- [ ] Image lazy loading
- [ ] Code splitting
- [ ] Service worker (offline support)

### Print
- [ ] Clean print stylesheet
- [ ] Page breaks at sections
- [ ] Hide navigation in print

---

## Phase 5: Multi-Book & Deployment

### Book Management
- [ ] Book index page (grid of covers)
- [ ] Chapter overview pages
- [ ] Book metadata (author, description)
- [ ] Cover images

### Edition Switching
- [ ] Domain-based: atlasclassicalpress.com → Christian
- [ ] Domain-based: meridianpress.com → Secular
- [ ] Filter content by `edition` field

### Deployment
- [ ] Vercel deployment
- [ ] Custom domains
- [ ] Analytics
- [ ] Error tracking

---

## Content Types Reference

All block types the renderer should handle:

| Type | Description | Box Color |
|------|-------------|-----------|
| paragraph | Body text | — |
| heading | h2/h3/h4 | — |
| definition | Formal definition | Gray/sage |
| theorem | Theorem/lemma/corollary/postulate | Blue |
| example | Worked example | Warm/rose |
| proof | Mathematical proof | Light gray |
| exercise | Practice problem | Blue |
| figure | Diagram/graph | — |
| table | Data table | — |
| list | Ordered/unordered list | — |
| warning | Warning box | Red |
| caution | Caution box | Amber |
| important | Important note | Red |
| historical | Historical note | Amber |
| keyconcept | Key concept | Teal |
| context | Math in context | Teal |
| strategy | Problem-solving strategy | Teal |

---

## Current Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Astro 5.x |
| Components | React 19 |
| Styling | Tailwind CSS 4 |
| Math | MathJax 3 |
| Build | Vite |
| Hosting | Vercel (planned) |

---

## Notes

- Keep LaTeX as source of truth for print
- JSON is for web only
- Pipeline: LaTeX → JSON → Astro → HTML
- Figures: TikZ → PDF → SVG
