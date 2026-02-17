# Axiom Reader

A modern, accessible web reader for mathematics textbooks.

**Brands:**
- **Atlas Classical Press** — Christian edition
- **Meridian Press** — Secular edition

## Features

- 📚 Beautiful textbook reading experience
- 🔢 High-quality math rendering (MathJax)
- ♿ Fully accessible (WCAG 2.1 AA, Section 508)
- 📱 Responsive design (desktop, tablet, mobile)
- 🔍 In-book search
- 📑 Collapsible table of contents
- 🎨 Text size control

## Tech Stack

- **Framework:** [Astro](https://astro.build/) (static-first)
- **Components:** React (interactive islands)
- **Styling:** Tailwind CSS
- **Math:** MathJax 3
- **Content:** JSON (converted from LaTeX)

## Quick Start

```bash
# Install dependencies
npm install

# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Project Structure

```
Axiom-Reader/
├── src/
│   ├── components/     # React components
│   ├── layouts/        # Astro layouts
│   ├── pages/          # Routes
│   └── styles/         # CSS
├── content/            # JSON textbook content
├── public/             # Static assets (figures)
├── pipeline/           # LaTeX → JSON tools
├── CLAUDE.md           # AI assistant instructions
├── PERSONAS.md         # Stakeholder personas
└── HEALTH.md           # Project status
```

## Content Pipeline

Textbooks are authored in LaTeX and converted to JSON for web rendering:

```bash
# Convert a book
cd pipeline
python3 latex_converter.py --book vol1

# Extract TikZ figures to SVG
python3 extract_tikz.py --book vol1
```

## License

Content © Atlas Classical Press / Meridian Press. All rights reserved.

Code: MIT License
