# Axiom LaTeX → JSON Pipeline

Converts Atlas LaTeX textbooks into JSON format for the Axiom Web Reader.

## Quick Start

```bash
# Convert a single textbook
python3 latex_converter.py --book vol1

# Convert a specific chapter
python3 latex_converter.py --book vol1 --chapter 1

# Convert all textbooks
python3 latex_converter.py --all

# List available textbooks
python3 latex_converter.py --list

# Generate secular edition (omits Christian content)
python3 latex_converter.py --book vol1 --secular
```

## Directory Structure

**Input:** `~/Desktop/Atlas-Textbooks/source/{book}/`
```
vol1/
├── chapter.tex           # Chapter-level file (devotional, includes)
├── ch01-functions/
│   ├── chapter.tex       # Chapter title & devotional
│   ├── sec01-*.tex       # Section content
│   ├── sec02-*.tex
│   └── ...
├── ch02-limits/
│   └── ...
└── ...
```

**Output:** `~/Desktop/axiom-reader/content/{book}/`
```
vol1/
├── book.json             # Book manifest (chapters, sections, metadata)
├── ch01/
│   ├── sec01.json        # Section content
│   ├── sec02.json
│   └── ...
├── ch02/
│   └── ...
└── ...
```

## JSON Format

### book.json
```json
{
  "id": "vol1",
  "title": "Calculus Volume 1",
  "subtitle": "",
  "author": "Atlas Classical Press",
  "chapters": [
    {
      "id": "ch01",
      "number": 1,
      "title": "Functions — The Language of Creation",
      "sections": [
        {
          "id": "sec01",
          "number": 1,
          "title": "What Is a Function?",
          "slug": "what-is-a-function"
        }
      ]
    }
  ]
}
```

### sec01.json
```json
{
  "id": "vol1-ch01-sec01",
  "title": "What Is a Function?",
  "chapter": 1,
  "section": 1,
  "book": "vol1",
  "objectives": ["Use functional notation...", "..."],
  "devotional": {
    "title": "The Grammar of Creation",
    "scripture": "Genesis 1:1",
    "content": "In the beginning..."
  },
  "content": [
    {"type": "paragraph", "text": "..."},
    {"type": "definition", "id": "def-1.1", "title": "Function", "content": "..."},
    {"type": "example", "id": "ex-1.1", "problem": "...", "solution": "..."},
    {"type": "theorem", "id": "thm-1.1", "title": "...", "content": "..."},
    {"type": "proof", "content": "..."},
    {"type": "heading", "level": 2, "text": "..."},
    {"type": "list", "ordered": true, "items": ["...", "..."]},
    {"type": "figure", "id": "fig-1.1", "src": "...", "caption": "..."}
  ]
}
```

## Supported Content Types

### Environments (from `atlas-theorems.sty`)
| LaTeX Environment | JSON Type | Notes |
|-------------------|-----------|-------|
| `atlasdefinition` | `definition` | Numbered by chapter |
| `atlastheorem` | `theorem` | Numbered by chapter |
| `atlasexample` | `example` | Has `problem` and `solution` |
| `proof` | `proof` | Content only |
| `atlaslemma` | `lemma` | Labeled as "Lemma" |
| `atlascorollary` | `corollary` | Labeled as "Corollary" |
| `atlaspostulate` | `postulate` | Labeled as "Postulate" |
| `atlaswarning` / `atlascaution` | `warning` | Caution boxes |
| `atlasimportant` | `important` | Important notes |
| `atlasstrategy` | `strategy` | Problem-solving strategies |
| `atlasalgorithm` | `algorithm` | Algorithms |
| `historicalnote` | `historical` | Historical context |
| `keyconcept` | `keyconcept` | Key concepts |
| `mathincontext` | `context` | Real-world applications |

### Text Elements
| LaTeX | JSON | Notes |
|-------|------|-------|
| Paragraphs | `paragraph` | Automatic from text blocks |
| `\subsection*{...}` | `heading` | Level 2 headings |
| `enumerate`/`itemize` | `list` | Ordered/unordered lists |
| `figure` | `figure` | With `src`, `caption`, `alt` |

### Math
- **Inline math** `$...$` → preserved as-is for KaTeX
- **Display math** `$$...$$` or `\[...\]` → converted to `$$...$$`
- **Align environments** → converted to display math

### Edition Support
The converter handles `\ifchristian...\fi` blocks:
- **Default (Christian edition):** Includes devotionals, scripture, margin notes
- **`--secular` flag:** Omits all Christian content

## Math Content

Math is preserved as-is for client-side KaTeX rendering:
```json
{
  "type": "definition",
  "content": "A **function** $f$ from set $A$ to $B$ assigns each $x \\in A$ to exactly one $f(x) \\in B$."
}
```

The reader renders `$...$` inline and `$$...$$` as display math.

## Common LaTeX → Markdown Conversions

| LaTeX | Output |
|-------|--------|
| `\textbf{...}` | `**...**` |
| `\emph{...}` / `\textit{...}` | `*...*` |
| `\texttt{...}` | `` `...` `` |
| `---` | `—` (em dash) |
| `--` | `–` (en dash) |
| `\ldots` | `…` |

## When to Re-run

Run the converter when:
- Textbook content is updated
- New chapters/sections are added
- Errors in source are fixed
- Switching between Christian/secular editions

This is a **one-time conversion tool**, not a live compiler.

## Files in This Directory

| File | Purpose |
|------|---------|
| `latex_converter.py` | Main converter script |
| `parser.py` | Legacy tokenizer (unused) |
| `extractor.py` | Legacy extractor (unused) |
| `convert.py` | Legacy converter (unused) |
| `README.md` | This file |

## Troubleshooting

### Missing content
- Check that section files follow `sec##-*.tex` naming
- Verify `\input{...}` paths in `chapter.tex`

### Malformed math
- Ensure math delimiters are balanced (`$...$`, `$$...$$`)
- Check for unescaped special characters

### Missing devotionals
- Verify `\ifchristian` blocks are properly closed with `\fi`
- Check that `--secular` flag isn't set

## Future Improvements

- [ ] Extract TikZ figures to SVG
- [ ] Handle cross-references (`\cref`, `\ref`) with proper linking
- [ ] Parse exercise sections
- [ ] Support incremental updates (only re-convert changed files)
