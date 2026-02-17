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

### Command
```bash
cd ~/Desktop/Axiom-Reader/pipeline
python extract_tikz.py path/to/chapter.tex --output ../public/figures/vol1/ch01/
```

### Requirements
- TinyTeX installed at `~/Library/TinyTeX/bin/universal-darwin/`
- `pdf2svg` installed via Homebrew

### What It Does
1. Finds all `\begin{tikzpicture}` blocks
2. Wraps each in standalone LaTeX document
3. Compiles to PDF via `pdflatex`
4. Converts PDF → SVG via `pdf2svg`
5. Adds accessibility `<desc>` tags from `\Description{}` commands

### Output Location
```
public/figures/vol1/ch01/
├── sec01-mapping-diagram.svg
├── sec01-vertical-line-test.svg
├── sec01-absolute-value.svg
└── ...
```

### Figure Naming Convention
```
sec{NN}-{descriptive-name}.svg
```

Reference in JSON as:
```json
{
  "type": "figure",
  "src": "/figures/vol1/ch01/sec01-mapping-diagram.svg",
  "caption": "A mapping diagram for $f(x) = x^2$...",
  "alt": "Figure: Mapping Diagram"
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
