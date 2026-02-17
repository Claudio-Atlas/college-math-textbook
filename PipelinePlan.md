# PipelinePlan.md - Vol 1 Completion Tracker

> **Orchestrator:** Main Session (Claudio)  
> **Started:** 2026-02-17 09:50 MST  
> **Target:** All 39 sections of Calculus Vol 1 rendering in Axiom Reader

---

## Quick Status

| Wave | Status | Completed |
|------|--------|-----------|
| Wave 0: Infrastructure | ✅ COMPLETE | 2026-02-17 09:52 MST |
| Wave 1: Figure Audit | ✅ COMPLETE | 2026-02-17 09:56 MST |
| **Wave 1.5: Extract 75 Missing Figs** | ⏳ **NEXT** | — |
| Wave 2: Chapter QA | ⏳ Pending | — |
| Wave 3: Fixes | ⏳ Pending | — |
| Wave 4: Final Review | ⏳ Pending | — |

---

## Wave 0: Infrastructure (Orchestrator Only)

**Goal:** Create dynamic routing so all 39 sections load automatically

**Tasks:**
- [x] Create dynamic route `src/pages/[bookId]/[chapterId]/[sectionId].astro`
- [x] Create book index page `src/pages/[bookId]/index.astro`
- [x] Create home page with book library
- [x] Add prev/next navigation between sections
- [x] Test all 6 chapters load correctly
- [x] Commit changes

**Started:** 2026-02-17 09:50 MST  
**Completed:** 2026-02-17 09:52 MST

**Notes:**
```
- All 39 sections accessible via /vol1/ch{NN}/sec{NN}
- Book TOC at /vol1
- Home page at /
- Using prerender=false for SSR in dev (will need adapter for production)
- Sidebar auto-highlights current section
- Prev/Next links auto-generated from book.json
```

---

## Wave 1: Figure Audit (3 Sub-Agents)

**Goal:** Ensure all figures exist and render

| Agent | Chapters | Sections | Status | Figures | Issues |
|-------|----------|----------|--------|---------|--------|
| 1A | 1-2 | 13 | ✅ Complete | 18 | 0 |
| 1B | 3-4 | 13 | ✅ Complete | 6 | 0 |
| 1C | 5-6 | 13 | ✅ Complete | 14 | 0 |
| **Total** | **1-6** | **39** | ✅ | **38** | **0** |

**Started:** 2026-02-17 09:53 MST  
**Completed:** 2026-02-17 09:56 MST

**Results:**
- 38 figures in JSON have matching SVGs ✅
- **BUT: 75 figures MISSING from JSON entirely!**

### ⚠️ CRITICAL: Converter Bug Discovered

| Source | Count |
|--------|-------|
| LaTeX source figures | **113** (with alt text!) |
| JSON figures | 38 (manually added) |
| **MISSING** | **75** |

**Root cause:** `latex_converter.py` bugs:
- Line 476: TikZ figures explicitly `return None`
- `\input{figures/...}` external refs not followed
- `_parse_figure()` only handles `\includegraphics`

**Next step:** Write extraction script before Wave 2

**Notes:**
```
(Will update after Wave 1)
```

---

## Wave 1.5: Figure Extraction Script (Orchestrator)

**Goal:** Extract the 75 missing figures from LaTeX to JSON

**Status:** ⏳ NEXT

**Tasks:**
- [ ] Write `pipeline/extract_missing_figures.py` script
- [ ] Scan all LaTeX for `\input{...figures/fig-...}` references
- [ ] Parse each figure `.tex` file for `\caption{}`, `\label{}`, `\Description{}`
- [ ] Generate SVG paths using naming convention
- [ ] Insert figure blocks into corresponding section JSONs
- [ ] Run TikZ → SVG extraction for new figures
- [ ] Verify all 113 figures now in JSON

**Started:** —  
**Completed:** —

---

## Wave 2: Chapter QA (3 Sub-Agents)

**Goal:** Visit every section, verify rendering

| Agent | Chapters | Sections | Status | Issues Found |
|-------|----------|----------|--------|--------------|
| 2A | 1-2 | 13 | ⏳ | — |
| 2B | 3-4 | 13 | ⏳ | — |
| 2C | 5-6 | 13 | ⏳ | — |

**Started:** —  
**Completed:** —

**Notes:**
```
(Will update after Wave 2)
```

---

## Wave 3: Fixes

**Goal:** Fix issues found in QA

| Issue | Section | Agent | Status |
|-------|---------|-------|--------|
| (TBD from QA) | — | — | — |

**Started:** —  
**Completed:** —

---

## Wave 4: Final Review (Orchestrator)

**Checklist:**
- [ ] Full book navigation test
- [ ] Mobile responsiveness
- [ ] Accessibility (screen reader)
- [ ] Performance (Lighthouse)
- [ ] Deploy to staging

**Started:** —  
**Completed:** —

---

## Section Inventory

### Chapter 1: Functions (5 sections)
- [ ] 1.1 What Is a Function?
- [ ] 1.2 A Catalog of Essential Functions
- [ ] 1.3 Transformations and Combinations of Functions
- [ ] 1.4 Inverse Functions
- [ ] 1.5 Trigonometric Functions and Their Properties

### Chapter 2: Limits (8 sections)
- [ ] 2.1 The Tangent and Velocity Problems
- [ ] 2.2 The Limit of a Function
- [ ] 2.3 Calculating Limits Using the Limit Laws
- [ ] 2.4 Infinite Limits and Vertical Asymptotes
- [ ] 2.5 Limits at Infinity and Horizontal Asymptotes
- [ ] 2.6 The Squeeze Theorem
- [ ] 2.7 The Precise Definition of a Limit
- [ ] 2.8 Continuity

### Chapter 3: The Derivative (4 sections)
- [ ] 3.1 Derivatives and Rates of Change
- [ ] 3.2 The Derivative as a Function
- [ ] 3.3 What the Derivative Tells Us
- [ ] 3.4 A Bridge to the Rules

### Chapter 4: Rules of Differentiation (9 sections)
- [ ] 4.1 Derivatives of Polynomials and Exponential Functions
- [ ] 4.2 The Product and Quotient Rules
- [ ] 4.3 Derivatives of Trigonometric Functions
- [ ] 4.4 The Chain Rule
- [ ] 4.5 Implicit Differentiation
- [ ] 4.6 Derivatives of Logarithmic and Inverse Trig Functions
- [ ] 4.7 Rates of Change in Science and Engineering
- [ ] 4.8 Related Rates
- [ ] 4.9 Linear Approximations and Differentials

### Chapter 5: Applications of Differentiation (8 sections)
- [ ] 5.1 Maximum and Minimum Values
- [ ] 5.2 The Mean Value Theorem
- [ ] 5.3 How Derivatives Affect the Shape of a Graph
- [ ] 5.4 Curve Sketching
- [ ] 5.5 Optimization Problems
- [ ] 5.6 Newton's Method
- [ ] 5.7 Antiderivatives
- [ ] 5.8 L'Hôpital's Rule

### Chapter 6: The Integral (5 sections)
- [ ] 6.1 Antiderivatives
- [ ] 6.2 The Area Problem and Riemann Sums
- [ ] 6.3 The Definite Integral
- [ ] 6.4 The Fundamental Theorem of Calculus
- [ ] 6.5 The Substitution Rule

**Total: 39 sections**

---

## Log

### 2026-02-17

**09:50** - Created PipelinePlan.md, starting Wave 0

**09:52** - Wave 0 COMPLETE
- Created dynamic routing for all 39 sections
- Routes tested: all 6 chapters loading correctly
- Files added:
  - `src/pages/[bookId]/[chapterId]/[sectionId].astro`
  - `src/pages/[bookId]/index.astro`
  - Updated `src/pages/index.astro`
- Ready for Wave 1

**09:53** - Spawned Wave 1 sub-agents (Figure Audit)
- 1A: Chapters 1-2 → `axiom-wave1-figures-A`
- 1B: Chapters 3-4 → `axiom-wave1-figures-B`
- 1C: Chapters 5-6 → `axiom-wave1-figures-C`

**09:56** - Wave 1 COMPLETE
- 1A: 18 figures, all exist ✅
- 1B: 6 figures, all exist ✅
- 1C: 14 figures, all exist ✅
- **Total: 38 figures, 0 missing**
- Ready for Wave 2 (Chapter QA)
