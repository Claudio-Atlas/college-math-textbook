# GOALS.md - Axiom Reader

*Last updated: 2025-02-17*

---

## Vision

A beautiful, accessible web reader for Atlas Classical Press and Meridian Press math textbooks. Government-contract ready (WCAG 2.1 AA / Section 508).

---

## Milestone 1: Section 1.1 Perfect ← CURRENT

**Target:** One section working flawlessly as our template.

| Goal | Status | Notes |
|------|--------|-------|
| All content types rendering | ✅ | 11 types working |
| MathJax integration | ✅ | Inline + display math |
| Definition/Theorem/Example boxes | ✅ | Styled correctly |
| Exercise component | ✅ | With collapsible solution |
| Real TikZ figures | 🔴 | Run extract_tikz.py |
| Figure lightbox | 🔴 | Click to enlarge |
| Mobile responsive | 🔴 | Test + fix |
| Epigraph styling | 🔴 | Scripture quote |
| Basic a11y | 🔴 | Keyboard nav, focus states |

**Definition of Done:**
- [ ] Section 1.1 renders identically on desktop + mobile
- [ ] All 3 figures are real SVGs from TikZ
- [ ] Figures enlarge on click
- [ ] Passes basic keyboard navigation test
- [ ] No console errors

---

## Milestone 2: Navigation System

**Target:** OpenStax-style sidebar + navigation.

| Goal | Status | Notes |
|------|--------|-------|
| Collapsible TOC sidebar | 🔴 | Icon tabs like OpenStax |
| Chapter/section hierarchy | 🔴 | Nested tree |
| Current section highlight | 🔴 | Visual indicator |
| Prev/Next with titles | 🔴 | Not just arrows |
| Search box | 🔴 | In header |
| Text size control | 🔴 | AA button |
| Mobile drawer | 🔴 | Slide-over nav |

**Definition of Done:**
- [ ] Can navigate entire Vol 1 via sidebar
- [ ] Search finds content across sections
- [ ] Works on mobile (hamburger → drawer)

---

## Milestone 3: Full Vol 1

**Target:** All 6 chapters of Calculus Vol 1 readable.

| Goal | Status | Notes |
|------|--------|-------|
| All section JSON converted | ✅ | 39 sections ready |
| All TikZ figures extracted | 🔴 | ~100+ figures |
| Dynamic routing | 🔴 | /books/vol1/ch01/sec01 |
| Chapter overview pages | 🔴 | List of sections |
| Book landing page | 🔴 | Cover + description |

**Definition of Done:**
- [ ] Can read Vol 1 start to finish
- [ ] All figures render correctly
- [ ] Navigation between all sections

---

## Milestone 4: Accessibility & Compliance

**Target:** WCAG 2.1 AA compliant for government contracts.

| Goal | Status | Notes |
|------|--------|-------|
| Color contrast audit | 🔴 | 4.5:1 minimum |
| Focus indicators | 🔴 | Visible focus rings |
| Skip navigation link | 🔴 | Jump to content |
| ARIA labels | 🔴 | Landmarks, roles |
| Screen reader test | 🔴 | VoiceOver / NVDA |
| Keyboard-only nav | 🔴 | No mouse required |
| MathJax a11y | 🔴 | Speech, braille |

**Definition of Done:**
- [ ] Passes axe-core automated audit
- [ ] Manual screen reader test passes
- [ ] Lighthouse accessibility score > 95

---

## Milestone 5: Multi-Book & Deploy

**Target:** Production deployment with multiple books.

| Goal | Status | Notes |
|------|--------|-------|
| Book index page | 🔴 | Grid of all books |
| Edition switching | 🔴 | Domain-based |
| Vercel deployment | 🔴 | CI/CD |
| Custom domains | 🔴 | atlasclassicalpress.com |
| Analytics | 🔴 | Privacy-friendly |
| Error tracking | 🔴 | Sentry or similar |

**Definition of Done:**
- [ ] Live on atlasclassicalpress.com
- [ ] All 20+ books accessible
- [ ] Christian/Secular editions work via domain

---

## Future Ideas (Backlog)

- [ ] Progress tracking (localStorage)
- [ ] Bookmarks & highlights
- [ ] Dark mode / sepia mode
- [ ] Offline support (PWA)
- [ ] EPUB export
- [ ] Interactive exercises
- [ ] User accounts
- [ ] LMS integration (Meridian LMS)
- [ ] Print stylesheet

---

## Success Metrics

| Metric | Target |
|--------|--------|
| Lighthouse Performance | > 90 |
| Lighthouse Accessibility | > 95 |
| Time to Interactive | < 2s |
| Mobile usability | 100% |
| WCAG 2.1 AA | Full compliance |
