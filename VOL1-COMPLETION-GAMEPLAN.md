# Vol 1 Completion Game Plan

**Goal:** Complete the Axiom Web Reader for Calculus Volume 1

## Current Status

- ✅ All 39 sections converted to JSON
- ✅ Content renders (definitions, examples, theorems, proofs)
- ✅ Math rendering (KaTeX) working
- ⚠️ Exercises: Only Ch01 Sec02 has them (need to add to all sections)
- ⚠️ Figures: 42 TikZ figures need extraction to SVG
- ⚠️ Edition flags: In JSON, but UI toggle not implemented

---

## Phase 1: TikZ → SVG Figures (42 total) — ✅ 90% COMPLETE

**Status:** 38 of 42 figures extracted (Feb 10, 2:15pm)

### Completed

### Inventory by Chapter

| Chapter | Section | Figures | Names |
|---------|---------|---------|-------|
| Ch01 | sec01 | 3 | mapping-diagram, vertical-line-test, absolute-value |
| Ch01 | sec02 | 7 | linear-functions, polynomials, power-functions, rational-function, exponential-functions, log-functions, trig-preview |
| Ch01 | sec03 | 2 | shifts, combined-transformations |
| Ch01 | sec04 | 2 | horizontal-line-test, inverse-graph |
| Ch01 | sec05 | 4 | unit-circle, reference-triangles, sin-cos-graphs, tan-graph |
| Ch02 | — | 0 | (no TikZ figures) |
| Ch03 | sec02 | 3 | standalone-1, standalone-2, standalone-3 |
| Ch03 | sec03 | 2 | standalone-1, standalone-2 |
| Ch04 | sec08 | 1 | standalone-1 (related rates diagram) |
| Ch04 | sec09 | 1 | standalone-1 (linear approximation) |
| Ch05 | sec01 | 1 | standalone-1 (max/min) |
| Ch05 | sec02 | 1 | standalone-1 (MVT) |
| Ch05 | sec03 | 1 | standalone-1 (shape of graph) |
| Ch05 | sec04 | 5 | standalone-1 through standalone-5 (curve sketching examples) |
| Ch05 | sec05 | 1 | standalone-1 (optimization) |
| Ch05 | sec06 | 2 | standalone-1, standalone-2 (Newton's method) |
| Ch06 | sec02 | 3 | standalone-1, standalone-2, standalone-3 (Riemann sums) |
| Ch06 | sec03 | 1 | standalone-1 (definite integral) |
| Ch06 | sec04 | 2 | standalone-1, standalone-2 (FTC) |

### Extraction Process

1. Run `extract_tikz.py --book vol1` with LaTeX in PATH
2. Script compiles each TikZ to PDF, converts to SVG
3. SVGs saved to `public/figures/vol1/ch##/`
4. JSON files updated with `src` paths

### Figure Placement in JSON

Each JSON section has `figure` blocks like:
```json
{
  "type": "figure",
  "id": "fig-mapping-diagram",
  "src": "",  // ← Will be updated to "/figures/vol1/ch01/sec01-mapping-diagram.svg"
  "caption": "A mapping diagram for f(x) = x²...",
  "alt": "Mapping diagram showing domain and range"
}
```

The extractor updates `src` automatically when it finds matching labels.

---

## Phase 2: Exercises for All Sections

### Sections Needing Exercises

| Chapter | Sections | Sections with Exercises |
|---------|----------|------------------------|
| Ch01 | sec01, sec02, sec03, sec04, sec05 | sec02 only ✅ |
| Ch02 | sec01-sec08 | None |
| Ch03 | sec01-sec04 | None |
| Ch04 | sec01-sec09 | None |
| Ch05 | sec01-sec08 | None |
| Ch06 | sec01-sec05 | None |

**Total: 38 sections need exercises added**

### Exercise JSON Format

```json
{
  "type": "heading",
  "level": 2,
  "text": "Exercises"
},
{
  "type": "heading",
  "level": 3,
  "text": "Conceptual Questions"
},
{
  "type": "exercise",
  "id": "ex1.1.1",
  "number": "1",
  "problem": "Explain in your own words what it means for...",
  "hint": "Consider the definition...",  // optional
  "answer": "..."  // optional, for odd-numbered
},
{
  "type": "exercise",
  "id": "ex1.1.2",
  "number": "2",
  "problem": "Find the domain of $f(x) = \\sqrt{x-3}$."
}
```

### Exercise Categories (typical per section)

1. **Conceptual/Verbal** — explain, describe, true/false
2. **Computational** — calculate, evaluate, simplify
3. **Graphical** — sketch, interpret graphs
4. **Applied** — word problems, real-world contexts
5. **Challenging** — harder problems
6. **Proofs** — prove statements (optional, marked with tag)
7. **Creation Reveals** — faith-integrated problems (Christian edition only)

### Approach

Option A: **Sub-agent batch conversion**
- Spawn sub-agents to convert exercises from LaTeX source
- Each agent handles 1 chapter

Option B: **Manual section-by-section**
- Add exercises as we review each section

**Recommendation:** Option A — faster, can run overnight

---

## Phase 3: Edition Toggle (UI)

### Current State
- JSON has `"edition": "christian"` on faith content
- No UI toggle exists

### Implementation
1. Add edition state to `useReaderStore`
2. Add toggle button in header (Christian/Secular switch)
3. Filter content blocks by edition in `ContentRenderer`

```tsx
// In ContentRenderer
if (block.edition === 'christian' && edition === 'secular') {
  return null; // Skip Christian-only content
}
```

---

## Execution Plan

### Today
- [x] Fix RichText math-in-bold bug
- [x] Add Exercise component
- [ ] Complete TikZ extraction for Ch01
- [ ] Test figure rendering in web reader

### Next Session
- [ ] Complete TikZ extraction for Ch02-06
- [ ] Spawn sub-agents for exercise conversion
- [ ] Implement edition toggle

### Quality Check
- [ ] Review each chapter in web reader
- [ ] Verify all figures display
- [ ] Verify exercises render correctly
- [ ] Test both editions

---

## File Locations

| What | Where |
|------|-------|
| LaTeX Source | `~/Desktop/Atlas-Textbooks/source/vol1/` |
| JSON Content | `~/Desktop/axiom-reader/content/vol1/` |
| SVG Figures | `~/Desktop/axiom-reader/public/figures/vol1/` |
| Pipeline Scripts | `~/Desktop/axiom-reader/pipeline/` |
| Web App | `~/Desktop/axiom-reader/` (Next.js) |

---

## Commands Reference

```bash
# Start dev server
cd ~/Desktop/axiom-reader && npm run dev

# Extract TikZ figures (need LaTeX in PATH)
export PATH="/Library/TeX/texbin:$PATH"
cd ~/Desktop/axiom-reader/pipeline
python3 extract_tikz.py --book vol1

# List figures without extracting
python3 extract_tikz.py --book vol1 --list

# Extract specific chapter
python3 extract_tikz.py --book vol1 --chapter 1
```
