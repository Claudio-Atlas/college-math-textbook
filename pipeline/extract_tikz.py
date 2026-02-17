#!/usr/bin/env python3
"""
TikZ Figure Extractor for Axiom Web Reader

Extracts TikZ figures from LaTeX sources, compiles them to PDF,
converts to SVG, and updates JSON files with figure references.

Usage:
    python extract_tikz.py --book vol1
    python extract_tikz.py --book vol1 --chapter 1
    python extract_tikz.py --all
    python extract_tikz.py --list  # List figures without extracting
"""

import argparse
import json
import os
import re
import subprocess
import tempfile
from pathlib import Path
from typing import List, Dict, Tuple
import shutil

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

TEXTBOOKS_DIR = Path.home() / "Desktop" / "Atlas-Textbooks" / "source"
OUTPUT_DIR = Path.home() / "Desktop" / "Axiom-Reader" / "public" / "figures"
CONTENT_DIR = Path.home() / "Desktop" / "Axiom-Reader" / "content"

# LaTeX preamble for standalone TikZ compilation
TIKZ_PREAMBLE = r"""
\documentclass[tikz,border=10pt]{standalone}
\usepackage{amsmath,amssymb}
\usepackage{tikz}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usetikzlibrary{arrows.meta,calc,patterns,positioning,shapes,decorations.markings,backgrounds,fit,intersections}

% Atlas colors (from atlas-calculus.cls - exact hex values)
\definecolor{AtlasTeal}{HTML}{5BA4A4}
\definecolor{AtlasTealDark}{HTML}{4A8F8F}
\definecolor{AtlasTealLight}{HTML}{E8F4F4}
\definecolor{AtlasDeep}{HTML}{2C5F5F}
\definecolor{AtlasCream}{HTML}{FAF9F7}
\definecolor{AtlasSage}{HTML}{7BAE7F}
\definecolor{AtlasSageLight}{HTML}{EDF5EE}
\definecolor{AtlasWarm}{HTML}{D4A853}
\definecolor{AtlasWarmLight}{HTML}{FDF6E8}
\definecolor{AtlasRose}{HTML}{C97B84}
\definecolor{AtlasRoseLight}{HTML}{F9EEF0}
\definecolor{AtlasText}{HTML}{2D2D2D}
\definecolor{AtlasSecondary}{HTML}{6B6B6B}
\definecolor{AtlasMuted}{HTML}{9E9E9E}
\definecolor{AtlasBorder}{HTML}{E8E5E1}
\definecolor{AtlasElevated}{HTML}{F5F3F0}

\begin{document}
"""

TIKZ_POSTAMBLE = r"""
\end{document}
"""

# ═══════════════════════════════════════════════════════════════
# FIGURE EXTRACTION
# ═══════════════════════════════════════════════════════════════

def find_tikz_figures(tex_content: str) -> List[Dict]:
    """Extract all TikZ figures from LaTeX content."""
    figures = []
    
    # Pattern for figure environments containing tikzpicture
    figure_pattern = re.compile(
        r'\\begin\{figure\}.*?'
        r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})'
        r'.*?\\caption\{([^}]*)\}'
        r'.*?\\label\{([^}]*)\}'
        r'.*?\\end\{figure\}',
        re.DOTALL
    )
    
    for match in figure_pattern.finditer(tex_content):
        tikz_code = match.group(1)
        caption = match.group(2)
        label = match.group(3)
        
        figures.append({
            'tikz': tikz_code,
            'caption': clean_latex(caption),
            'label': label,
            'full_match': match.group(0)
        })
    
    # Also find standalone tikzpicture (not in figure env)
    standalone_pattern = re.compile(
        r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})',
        re.DOTALL
    )
    
    # Count existing to generate IDs for standalone
    standalone_count = len(figures)
    for match in standalone_pattern.finditer(tex_content):
        tikz_code = match.group(1)
        # Skip if already captured in figure env
        if any(tikz_code in f['tikz'] for f in figures):
            continue
        standalone_count += 1
        figures.append({
            'tikz': tikz_code,
            'caption': '',
            'label': f'fig:standalone-{standalone_count}',
            'full_match': match.group(0)
        })
    
    return figures


def clean_latex(text: str) -> str:
    """Clean LaTeX commands from caption text."""
    text = re.sub(r'\\textbf\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\emph\{([^}]*)\}', r'\1', text)
    text = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', text)
    text = re.sub(r'~', ' ', text)
    return text.strip()


def compile_tikz_to_svg(tikz_code: str, output_path: Path) -> bool:
    """Compile TikZ code to SVG via PDF."""
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        
        # Write LaTeX file
        tex_file = tmpdir / "figure.tex"
        tex_content = TIKZ_PREAMBLE + tikz_code + TIKZ_POSTAMBLE
        tex_file.write_text(tex_content)
        
        # Compile to PDF
        try:
            result = subprocess.run(
                ['pdflatex', '-interaction=nonstopmode', 'figure.tex'],
                cwd=tmpdir,
                capture_output=True,
                timeout=30
            )
            if result.returncode != 0:
                print(f"  ⚠️  pdflatex failed")
                return False
        except (subprocess.TimeoutExpired, FileNotFoundError) as e:
            print(f"  ⚠️  pdflatex error: {e}")
            return False
        
        pdf_file = tmpdir / "figure.pdf"
        if not pdf_file.exists():
            print(f"  ⚠️  PDF not generated")
            return False
        
        # Convert PDF to SVG
        try:
            # Try pdf2svg first
            result = subprocess.run(
                ['pdf2svg', str(pdf_file), str(output_path)],
                capture_output=True,
                timeout=30
            )
            if result.returncode == 0:
                return True
        except FileNotFoundError:
            pass
        
        try:
            # Fallback to inkscape
            result = subprocess.run(
                ['inkscape', str(pdf_file), '--export-type=svg', f'--export-filename={output_path}'],
                capture_output=True,
                timeout=30
            )
            if result.returncode == 0:
                return True
        except FileNotFoundError:
            pass
        
        print(f"  ⚠️  No PDF to SVG converter found (install pdf2svg or inkscape)")
        return False


def process_section(book: str, chapter: int, section: int, tex_path: Path) -> List[Dict]:
    """Process a single section, extracting and compiling figures."""
    print(f"  📄 Processing {tex_path.name}")
    
    tex_content = tex_path.read_text()
    figures = find_tikz_figures(tex_content)
    
    if not figures:
        print(f"    (no TikZ figures)")
        return []
    
    print(f"    Found {len(figures)} figure(s)")
    
    # Ensure output directory exists
    fig_dir = OUTPUT_DIR / book / f"ch{chapter:02d}"
    fig_dir.mkdir(parents=True, exist_ok=True)
    
    results = []
    for i, fig in enumerate(figures, 1):
        fig_id = fig['label'].replace('fig:', '').replace(':', '-')
        svg_name = f"sec{section:02d}-{fig_id}.svg"
        svg_path = fig_dir / svg_name
        
        print(f"    🖼️  {fig_id}...", end=" ")
        
        if compile_tikz_to_svg(fig['tikz'], svg_path):
            print("✅")
            results.append({
                'label': fig['label'],
                'caption': fig['caption'],
                'src': f"/figures/{book}/ch{chapter:02d}/{svg_name}",
                'svg_path': str(svg_path)
            })
        else:
            print("❌")
    
    return results


def update_json_with_figures(json_path: Path, figures: List[Dict]):
    """Update JSON file with actual figure paths."""
    if not json_path.exists() or not figures:
        return
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    # Create lookup by label
    fig_lookup = {f['label']: f for f in figures}
    
    # Update figure references in content
    def update_content(content):
        if isinstance(content, list):
            for item in content:
                update_content(item)
        elif isinstance(content, dict):
            if content.get('type') == 'figure':
                label = content.get('id', '').replace('fig-', 'fig:')
                if label in fig_lookup:
                    content['src'] = fig_lookup[label]['src']
                    if not content.get('caption'):
                        content['caption'] = fig_lookup[label]['caption']
            for value in content.values():
                update_content(value)
    
    update_content(data.get('content', []))
    
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"    📝 Updated {json_path.name}")


def process_book(book: str):
    """Process all sections in a book."""
    book_dir = TEXTBOOKS_DIR / book
    if not book_dir.exists():
        print(f"❌ Book not found: {book}")
        return
    
    print(f"📚 Processing: {book}")
    
    # Find all chapter directories
    chapters = sorted([d for d in book_dir.iterdir() 
                      if d.is_dir() and d.name.startswith('ch') and not d.name.startswith('_')])
    
    for chapter_dir in chapters:
        # Extract chapter number
        ch_match = re.match(r'ch(\d+)', chapter_dir.name)
        if not ch_match:
            continue
        chapter_num = int(ch_match.group(1))
        
        print(f"  📖 Chapter {chapter_num}: {chapter_dir.name}")
        
        # Find all section files
        sections = sorted(chapter_dir.glob('sec*.tex'))
        
        for sec_path in sections:
            sec_match = re.match(r'sec(\d+)', sec_path.name)
            if not sec_match:
                continue
            section_num = int(sec_match.group(1))
            
            figures = process_section(book, chapter_num, section_num, sec_path)
            
            # Update corresponding JSON
            json_path = CONTENT_DIR / book / f"ch{chapter_num:02d}" / f"sec{section_num:02d}.json"
            update_json_with_figures(json_path, figures)


def list_figures(book: str):
    """List all TikZ figures without compiling."""
    book_dir = TEXTBOOKS_DIR / book
    if not book_dir.exists():
        print(f"❌ Book not found: {book}")
        return
    
    print(f"📚 Figures in: {book}\n")
    
    total = 0
    chapters = sorted([d for d in book_dir.iterdir() 
                      if d.is_dir() and d.name.startswith('ch') and not d.name.startswith('_')])
    
    for chapter_dir in chapters:
        sections = sorted(chapter_dir.glob('sec*.tex'))
        chapter_figures = 0
        
        for sec_path in sections:
            tex_content = sec_path.read_text()
            figures = find_tikz_figures(tex_content)
            if figures:
                for fig in figures:
                    print(f"  {chapter_dir.name}/{sec_path.name}: {fig['label']}")
                    chapter_figures += 1
        
        if chapter_figures:
            total += chapter_figures
    
    print(f"\n📊 Total: {total} figures")


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(description='Extract TikZ figures to SVG')
    parser.add_argument('--book', help='Book to process (e.g., vol1)')
    parser.add_argument('--chapter', type=int, help='Specific chapter')
    parser.add_argument('--all', action='store_true', help='Process all books')
    parser.add_argument('--list', action='store_true', help='List figures only')
    
    args = parser.parse_args()
    
    if args.list and args.book:
        list_figures(args.book)
    elif args.book:
        process_book(args.book)
    elif args.all:
        for book_dir in TEXTBOOKS_DIR.iterdir():
            if book_dir.is_dir() and not book_dir.name.startswith(('.', '_')):
                if book_dir.name not in ['shared', 'homework']:
                    process_book(book_dir.name)
    else:
        parser.print_help()


if __name__ == '__main__':
    main()
