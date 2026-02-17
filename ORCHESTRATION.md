# ORCHESTRATION.md - Sub-Agent Coordination for Vol 1 Completion

> **Orchestrator:** Main Session (Claudio)  
> **Last Updated:** 2026-02-17

---

## Current Status

| Asset | Status | Count |
|-------|--------|-------|
| Section JSONs | ✅ Complete | 39/39 |
| TikZ → SVG Figures | ✅ Complete | 38/38 verified |
| Dynamic Routing | ✅ Complete | All routes working |
| Chapter QA | ⏳ Wave 2 | 0/6 |

---

## Vol 1 Structure

| Chapter | Sections | Title |
|---------|----------|-------|
| Ch 1 | 5 | Functions — The Language of Creation |
| Ch 2 | 8 | Limits — Approaching the Infinite |
| Ch 3 | 4 | The Derivative — Moments of Transformation |
| Ch 4 | 9 | Rules of Differentiation — God-Given Skill |
| Ch 5 | 8 | Applications of Differentiation — Wisdom in Optimization |
| Ch 6 | 5 | The Integral — Wholeness from Fragments |
| **Total** | **39** | |

---

## Wave Strategy

### Wave 0: Infrastructure (Orchestrator Only)
**Assigned to:** Main Session (Claudio)  
**Status:** ✅ COMPLETE (2026-02-17 09:52 MST)

**Tasks:**
- [x] Create PIPELINE.md documentation
- [x] Create ORCHESTRATION.md (this file)
- [x] Create dynamic routing (`/vol1/ch01/sec01` → loads correct JSON)
- [x] Test routing with all 39 sections
- [x] Commit routing changes

**Deliverables:**
- `src/pages/[bookId]/[chapterId]/[sectionId].astro` — dynamic section pages
- `src/pages/[bookId]/index.astro` — book TOC
- `src/pages/index.astro` — home/library page
- All routes using `prerender = false` for SSR

---

### Wave 1: Figure Audit & Extraction (3 Sub-Agents)
**Status:** ✅ COMPLETE (2026-02-17 09:56 MST)

**Goal:** Ensure all figures render correctly across all sections.

#### Sub-Agent 1A: Chapters 1-2 Figures
```
Task: Audit and fix figures for Chapters 1-2

1. Read PIPELINE.md for context
2. For each section in ch01 and ch02:
   - Load the JSON file
   - Find all "type": "figure" blocks
   - Verify the SVG exists in public/figures/vol1/ch{NN}/
   - If missing, check if TikZ source exists and extract
   - If SVG exists but broken, regenerate
3. Report: List of (section, figure_id, status)

Files to check:
- content/vol1/ch01/sec01.json through sec05.json
- content/vol1/ch02/sec01.json through sec08.json
- public/figures/vol1/ch01/*.svg
- public/figures/vol1/ch02/*.svg (may need creation)
```

#### Sub-Agent 1B: Chapters 3-4 Figures
```
Task: Audit and fix figures for Chapters 3-4

Same process as 1A, but for:
- content/vol1/ch03/sec01.json through sec04.json
- content/vol1/ch04/sec01.json through sec09.json
- public/figures/vol1/ch03/*.svg
- public/figures/vol1/ch04/*.svg
```

#### Sub-Agent 1C: Chapters 5-6 Figures
```
Task: Audit and fix figures for Chapters 5-6

Same process as 1A, but for:
- content/vol1/ch05/sec01.json through sec08.json
- content/vol1/ch06/sec01.json through sec05.json
- public/figures/vol1/ch05/*.svg
- public/figures/vol1/ch06/*.svg
```

**Merge Strategy:** Each sub-agent commits to a branch `wave1-figures-{A|B|C}`. Orchestrator merges after all complete.

---

### Wave 2: Chapter QA & Rendering Verification (3 Sub-Agents)
**Status:** 🔄 READY TO LAUNCH

**Goal:** Visit every section in the browser, verify it renders correctly.

#### Sub-Agent 2A: QA Chapters 1-2
```
Task: QA all sections in Chapters 1-2

1. Start dev server: npm run dev
2. For each section:
   - Visit http://localhost:4321/vol1/ch{NN}/sec{NN}
   - Verify: Math renders (no raw $...$)
   - Verify: Figures load (no broken images)
   - Verify: All environment boxes styled (Definition, Theorem, Example)
   - Verify: Exercises have show/hide solution
   - Note any issues in report
3. Report format:
   Section | Math | Figures | Envs | Exercises | Issues
   1.1     | ✅   | ✅      | ✅   | ✅        | None
   1.2     | ✅   | ❌      | ✅   | ✅        | Missing fig-1.2-3

Sections to QA: 1.1-1.5, 2.1-2.8 (13 total)
```

#### Sub-Agent 2B: QA Chapters 3-4
```
Same process for sections 3.1-3.4, 4.1-4.9 (13 total)
```

#### Sub-Agent 2C: QA Chapters 5-6
```
Same process for sections 5.1-5.8, 6.1-6.5 (13 total)
```

**Merge Strategy:** QA reports collected. Orchestrator creates fix tasks for Wave 3 if needed.

---

### Wave 3: Fixes & Polish (As Needed)
**Status:** ⏳ Pending Wave 2

Based on Wave 2 QA reports, spawn targeted sub-agents to fix specific issues:
- Missing/broken figures
- Content rendering bugs
- Styling inconsistencies
- Accessibility gaps

---

### Wave 4: Final Review & Ship
**Status:** ⏳ Pending Wave 3

**Orchestrator tasks:**
- [ ] Full book navigation test
- [ ] Mobile responsiveness check
- [ ] Accessibility audit (screen reader)
- [ ] Performance check (lighthouse)
- [ ] Deploy to staging

---

## Sub-Agent Instructions Template

When spawning a sub-agent, use this format:

```
You are working on Axiom Reader, a math textbook web reader.

**Your Task:** [SPECIFIC TASK]

**Before starting:**
1. Read ~/Desktop/Axiom-Reader/PIPELINE.md (full process documentation)
2. Read ~/Desktop/Axiom-Reader/CLAUDE.md (project rules)

**Your scope:**
- Files: [LIST SPECIFIC FILES]
- Do NOT modify files outside your scope
- Commit to branch: [BRANCH NAME]

**Deliverable:**
[WHAT TO PRODUCE - report, code changes, etc.]

**When done:**
Summarize what you completed and any issues found.
```

---

## Spawning Commands

### Wave 1 Example:
```
sessions_spawn(
  task="Audit and fix figures for Chapters 1-2. Read PIPELINE.md first. Check each section JSON for figure blocks, verify SVGs exist in public/figures/vol1/ch01/ and ch02/. Report missing/broken figures. Create branch wave1-figures-A for any fixes.",
  label="axiom-wave1-figures-A"
)
```

### Wave 2 Example:
```
sessions_spawn(
  task="QA Chapters 1-2. Start dev server (npm run dev in ~/Desktop/Axiom-Reader). Visit each section /vol1/ch01/sec01 through /vol1/ch02/sec08. Verify math renders, figures load, environments styled. Report in table format.",
  label="axiom-wave2-qa-A"
)
```

---

## Progress Tracking

### Wave 0
| Task | Status | Notes |
|------|--------|-------|
| PIPELINE.md | ✅ | Complete |
| ORCHESTRATION.md | ✅ | This file |
| Dynamic routing | ✅ | All 39 sections routable |

### Wave 1
| Sub-Agent | Chapters | Status | Report |
|-----------|----------|--------|--------|
| 1A | 1-2 | ✅ | 18 figures, 0 missing |
| 1B | 3-4 | ✅ | 6 figures, 0 missing |
| 1C | 5-6 | ✅ | 14 figures, 0 missing |

**Session Labels:** `axiom-wave1-figures-A`, `axiom-wave1-figures-B`, `axiom-wave1-figures-C`

### Wave 2
| Sub-Agent | Chapters | Status | Issues Found |
|-----------|----------|--------|--------------|
| 2A | 1-2 | ⏳ Ready | — |
| 2B | 3-4 | ⏳ Ready | — |
| 2C | 5-6 | ⏳ Ready | — |

---

## Conflict Resolution

If two sub-agents need to modify the same file:
1. **Stop** — Don't proceed
2. **Report** to orchestrator with details
3. Orchestrator will reassign or merge manually

Files that should NEVER be modified by sub-agents without orchestrator approval:
- `astro.config.mjs`
- `package.json`
- `PIPELINE.md`
- `ORCHESTRATION.md`
- `book.json`

---

## Communication

Sub-agents report back via their session completion message.

Orchestrator checks sub-agent status via:
```
sessions_list(kinds=["isolated"], messageLimit=1)
sessions_history(sessionKey="...", limit=10)
```

---

## Timeline Estimate

| Wave | Duration | Parallelism |
|------|----------|-------------|
| Wave 0 | 30 min | 1 (orchestrator) |
| Wave 1 | 1 hour | 3 sub-agents |
| Wave 2 | 1 hour | 3 sub-agents |
| Wave 3 | Variable | As needed |
| Wave 4 | 30 min | 1 (orchestrator) |

**Total estimated:** 3-4 hours with parallelization

---

## Ready to Start?

When Clayton says go:
1. Orchestrator completes Wave 0 (dynamic routing)
2. Orchestrator spawns Wave 1 sub-agents (3 parallel)
3. Wait for Wave 1 completion, merge branches
4. Orchestrator spawns Wave 2 sub-agents (3 parallel)
5. Collect QA reports, spawn Wave 3 fixes
6. Final review and ship
