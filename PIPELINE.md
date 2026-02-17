# PIPELINE.md - LaTeX to Web Reader Pipeline

> **For sub-agents and collaborators:** Follow this document exactly when converting content or adding features to Axiom Reader.

---

## Overview

Axiom Reader converts LaTeX math textbooks into an accessible, interactive web reader. The pipeline has 6 phases:

```
LaTeX Source → JSON Content → React Components → Web Pages
     ↓
TikZ Figures → SVG Files → Public Assets
```

---

## Phase 1: Content Conversion (LaTeX → JSON)

### Command
```bash
cd ~/Desktop/Axiom-Reader/pipeline
python latex_converter.py path/to/chapter.tex --output ../content/vol1/ch01/
```

### What It Does
- Parses LaTeX structure (chapters, sections)
- Extracts content blocks by type
- Preserves math as raw LaTeX strings (`$f(x)$`, `$$\int...$$`)
- Outputs one JSON file per section

### Block Type Mapping

| LaTeX Environment | JSON Type |
|-------------------|-----------|
| `\begin{definition}` | `"definition"` |
| `\begin{theorem}` | `"theorem"` |
| `\begin{lemma}` | `"lemma"` |
| `\begin{corollary}` | `"corollary"` |
| `\begin{example}` | `"example"` |
| `\begin{proof}` | `"proof"` |
| `\begin{exercise}` | `"exercise"` |
| `\begin{caution}` | `"caution"` |
| `\begin{historical}` | `"historical"` |
| `\begin{strategy}` | `"strategy"` |
| `\begin{keyconcept}` | `"keyconcept"` |
| Paragraphs | `"paragraph"` |
| `\section{}` | `"heading"` (level 2) |
| `\subsection{}` | `"heading"` (level 3) |
| `\begin{enumerate}` | `"list"` (ordered) |
| `\begin{itemize}` | `"list"` (unordered) |
| `\begin{figure}` | `"figure"` |
| `\begin{tabular}` | `"table"` |

### Output JSON Structure

```json
{
  "chapter": 1,
  "section": 1,
  "title": "What Is a Function?",
  "slug": "what-is-a-function",
  "objectives": ["Objective 1", "Objective 2"],
  "epigraph": {
    "text": "Quote text",
    "reference": "Author"
  },
  "content": [
    { "type": "paragraph", "text": "Content with $math$..." },
    { "type": "definition", "id": "def-1.1", "number": "1.1", "title": "Function", "content": "..." },
    { "type": "example", "id": "ex-1.1", "number": "1.1", "problem": "...", "solution": "..." }
  ]
}
```

---

## Phase 2: Figure Extraction (TikZ → SVG)

Figures can exist in three patterns in LaTeX. Each requires a different extraction approach.

### The Three Cases

| Case | Pattern | Script | Example |
|------|---------|--------|---------|
| **1. External Files** | `\input{figures/fig-X.Y.Z-name.tex}` | `extract_missing_figures.py` | Chapter 2 figures |
| **2. Inline TikZ** | `\begin{tikzpicture}` directly in section | `extract_inline_figures.py` | Ch5 curve sketches |
| **3. Manual/Existing** | Pre-converted figures | Manual | Chapter 1 figures |

### Case 1: External Figure Files

When sections use `\input{figures/fig-X.Y.Z-name.tex}`:

```bash
cd ~/Desktop/Axiom-Reader/pipeline
python extract_missing_figures.py [--dry-run]
```

**What it does:**
1. Scans section `.tex` files for `\input{...figures/fig-...}` patterns
2. Opens referenced figure `.tex` files
3. Extracts `\Description{}`, `\caption{}`, `\label{}`
4. Copies existing SVGs from LaTeX source to `public/figures/`
5. Adds figure blocks to JSON with alt text

### Case 2: Inline TikZ Figures

When `\begin{tikzpicture}` appears directly in section files:

```bash
cd ~/Desktop/Axiom-Reader/pipeline
python extract_inline_figures.py [--dry-run] [--chapter N]
```

**What it does:**
1. Finds `\begin{tikzpicture}[options]\Description{...}...\end{tikzpicture}`
2. Compiles to PDF via `pdflatex` with standalone class
3. Converts PDF → SVG via `pdf2svg`
4. Adds figure blocks to JSON

**Naming convention:** `fig-{chapter}.{section}-inline-{N}.svg`

### Case 3: Compile TikZ to SVG

For figure `.tex` files that need SVG generation (no pre-existing SVGs):

```bash
cd ~/Desktop/Axiom-Reader/pipeline
python compile_tikz_figures.py [--dry-run] [--chapter N]
```

**What it does:**
1. Finds `fig-*.tex` files in chapter figures directories
2. Extracts tikzpicture content
3. Compiles with standalone LaTeX + Atlas color definitions
4. Outputs SVG to `public/figures/vol1/ch{NN}/`

### Requirements

- **TinyTeX** at `~/Library/TinyTeX/bin/universal-darwin/`
- **pdf2svg** via Homebrew (`brew install pdf2svg`)

### Custom LaTeX Commands

The compilation scripts include:
```latex
% Atlas colors
\definecolor{AtlasTeal}{HTML}{5BA4A4}
\definecolor{AtlasCoral}{HTML}{F97316}
% ... etc

% Math shortcuts
\newcommand{\dx}{\,dx}
\newcommand{\deriv}[2]{\frac{d#1}{d#2}}

% Accessibility (ignored for SVG)
\newcommand{\Description}[1]{}
```

### Complete Workflow for New Textbook

```bash
# 1. Extract figures from \input{} references
python extract_missing_figures.py --dry-run  # Preview
python extract_missing_figures.py             # Execute

# 2. Compile TikZ files that don't have SVGs
python compile_tikz_figures.py --dry-run
python compile_tikz_figures.py

# 3. Extract inline figures from section files
python extract_inline_figures.py --dry-run
python extract_inline_figures.py

# 4. Verify totals match ACCESSIBILITY-TRACKING.md
find public/figures/vol1 -name "*.svg" | wc -l
```

### Output Location
```
public/figures/vol1/ch{NN}/
├── fig-X.Y.Z-descriptive-name.svg      # From TikZ files
├── fig-X.Y-inline-N.svg                # From inline extraction
└── sec{NN}-descriptive-name.svg        # Legacy manual naming
```

### JSON Figure Block
```json
{
  "type": "figure",
  "id": "fig-2.1.1",
  "src": "/figures/vol1/ch02/fig-2.1.1-secant-line.svg",
  "caption": "A secant line through two points...",
  "alt": "A coordinate plane showing a smooth curve..."
}
```

---

## Phase 3: Web Framework

### Tech Stack
- **Astro** - Static site generator
- **React** - Interactive components (islands)
- **Tailwind CSS v4** - Styling
- **better-react-mathjax** - Math rendering

### Key Configuration

**astro.config.mjs:**
```javascript
export default defineConfig({
  integrations: [react()],
  vite: {
    plugins: [tailwindcss()],
    optimizeDeps: {
      include: ['better-react-mathjax'],
    },
    ssr: {
      noExternal: ['better-react-mathjax'],
    },
  }
});
```

**Import pattern for better-react-mathjax:**
```typescript
// ✅ Correct - works with Vite SSR
import * as BetterReactMathJax from 'better-react-mathjax';
const { MathJax, MathJaxContext } = BetterReactMathJax;

// ❌ Wrong - breaks SSR
import { MathJax } from 'better-react-mathjax';
```

---

## Phase 4: Content Components

### Component Mapping

| JSON Type | Component | Location |
|-----------|-----------|----------|
| `paragraph` | `<RichText>` | `src/components/reader/RichText.tsx` |
| `definition` | `<Definition>` | `src/components/environments/Definition.tsx` |
| `theorem` | `<Theorem>` | `src/components/environments/Theorem.tsx` |
| `lemma` | `<Theorem label="Lemma">` | (same component) |
| `corollary` | `<Theorem label="Corollary">` | (same component) |
| `example` | `<Example>` | `src/components/environments/Example.tsx` |
| `proof` | `<Proof>` | `src/components/environments/Proof.tsx` |
| `exercise` | Inline in ContentRenderer | |
| `caution` | Inline in ContentRenderer | |
| `figure` | Inline `<figure>` | |
| `list` | `<ol>` / `<ul>` | |
| `table` | `<table>` | |

### ContentRenderer

`src/components/reader/ContentRenderer.tsx` is the main dispatcher:

```tsx
<ContentRenderer content={section.content} client:only="react" />
```

**Important:** Use `client:only="react"` to avoid hydration mismatch with MathJax.

### RichText Component

Handles inline math and markdown-style formatting:
- `$...$` → MathJax inline math
- `**text**` → `<strong>`
- `*text*` → `<em>`
- `` `code` `` → `<code>`

---

## Phase 5: Navigation (Sidebar)

### Book Metadata

`content/vol1/book.json`:
```json
{
  "id": "vol1",
  "title": "Calculus Volume 1",
  "chapters": [
    {
      "id": "ch01",
      "number": 1,
      "title": "Functions — The Language of Creation",
      "sections": [
        { "id": "sec01", "number": 1, "title": "What Is a Function?", "slug": "..." }
      ]
    }
  ]
}
```

### Sidebar Component

`src/components/reader/Sidebar.tsx`:
- Icon rail (always visible): Contents, Highlights
- Expandable panel with chapter tree
- Current section highlighting
- Accessible: proper ARIA attributes

---

## Phase 6: Page Assembly

### Static Page (Current)

```astro
---
// src/pages/test.astro
import ReaderLayout from '../layouts/ReaderLayout.astro';
import { ContentRenderer } from '../components/reader/ContentRenderer';
import bookData from '../../content/vol1/book.json';
import sectionData from '../../content/vol1/ch01/sec01.json';
---

<ReaderLayout 
  title={`${sectionData.title} - ${bookData.title}`}
  book={bookData}
  currentChapter={sectionData.chapter}
  currentSection={sectionData.section}
  sectionTitle={sectionData.title}
>
  <article class="px-4 sm:px-8 py-6 max-w-4xl mx-auto">
    <h1>{sectionData.chapter}.{sectionData.section} {sectionData.title}</h1>
    <ContentRenderer content={sectionData.content} client:only="react" />
  </article>
</ReaderLayout>
```

### Dynamic Routing (Future)

Create `src/pages/[bookId]/[chapterId]/[sectionId].astro` for automatic routing.

---

## File Structure

```
Axiom-Reader/
├── content/
│   └── vol1/
│       ├── book.json              # TOC metadata
│       └── ch01/
│           ├── sec01.json         # Section content
│           └── ...
├── public/
│   └── figures/vol1/ch01/         # SVG figures
├── src/
│   ├── components/
│   │   ├── reader/
│   │   │   ├── ContentRenderer.tsx
│   │   │   ├── RichText.tsx
│   │   │   └── Sidebar.tsx
│   │   ├── environments/
│   │   │   ├── Definition.tsx
│   │   │   ├── Theorem.tsx
│   │   │   ├── Example.tsx
│   │   │   └── Proof.tsx
│   │   └── MathJaxProvider.tsx
│   ├── layouts/
│   │   └── ReaderLayout.astro
│   ├── lib/
│   │   └── types.ts               # TypeScript interfaces
│   ├── pages/
│   │   ├── index.astro
│   │   └── test.astro
│   └── styles/
│       └── global.css
├── pipeline/
│   ├── latex_converter.py
│   ├── extract_tikz.py
│   └── README.md
├── CLAUDE.md                      # Project rules
├── HEALTH.md                      # Status tracking
├── PIPELINE.md                    # This file
└── README.md
```

---

## Adding a New Section

### Step-by-step:

1. **Convert LaTeX to JSON**
   ```bash
   python pipeline/latex_converter.py input.tex --section 2 --output content/vol1/ch01/
   ```

2. **Extract TikZ figures** (if any)
   ```bash
   python pipeline/extract_tikz.py input.tex --output public/figures/vol1/ch01/
   ```

3. **Update book.json** - Add section to chapter's `sections` array

4. **Create page route** - Either static `.astro` file or use dynamic routing

5. **Test locally**
   ```bash
   npm run dev
   # Visit http://localhost:4321/[route]
   ```

6. **Verify**
   - Math renders correctly
   - Figures load
   - Sidebar shows section
   - Mobile responsive

---

## Styling Guide

### Atlas Color Palette

| Name | Hex | Usage |
|------|-----|-------|
| `atlas-teal` | `#5BA4A4` | Primary accent, links |
| `atlas-teal-dark` | `#4A8F8F` | Hover states |
| `atlas-teal-light` | `#E8F4F4` | Backgrounds |
| `atlas-deep` | `#2C5F5F` | Headings |
| `atlas-cream` | `#FAF9F7` | Page background |
| `atlas-sage` | `#7BAE7F` | Learning objectives |
| `atlas-warm` | `#D4A853` | Header bar |
| `atlas-rose` | `#C97B84` | Warnings |
| `atlas-text` | `#2D2D2D` | Body text |
| `atlas-secondary` | `#6B6B6B` | Muted text |

### Environment Box Styles

- **Definition**: Gray background (`bg-gray-100`), dark border
- **Theorem**: White background, teal left border
- **Example**: White background, collapsible solution
- **Caution**: Amber background, warning icon
- **Exercise**: Blue background, show/hide solution

---

## Troubleshooting

### MathJax not rendering
- Check `client:only="react"` on ContentRenderer
- Verify import pattern uses `import * as`
- Check browser console for errors

### Figures not loading
- Verify path matches `/figures/vol1/ch01/...`
- Check SVG exists in `public/figures/`
- Run `extract_tikz.py` if missing

### Hydration mismatch warnings
- Use `client:only="react"` for math-heavy components
- This skips SSR entirely for that component

### TikZ extraction fails
- Check TinyTeX PATH: `~/Library/TinyTeX/bin/universal-darwin/`
- Install missing packages: `tlmgr install [package]`
- Check for missing `\Description{}` in source

---

## Contact

Questions about this pipeline? Check:
1. `CLAUDE.md` - Project-specific rules
2. `HEALTH.md` - Current status and blockers
3. `pipeline/README.md` - Converter-specific docs
