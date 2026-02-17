#!/usr/bin/env python3
"""
Compile TikZ Figures to SVG
===========================
Compiles TikZ figure .tex files to SVG using pdflatex and pdf2svg.

Usage:
    python pipeline/compile_tikz_figures.py [--dry-run] [--chapter N]
"""

import subprocess
import tempfile
import shutil
import os
from pathlib import Path

# Configuration
LATEX_SOURCE = Path.home() / "Desktop/Atlas-Textbooks/source/vol1"
AXIOM_READER = Path.home() / "Desktop/Axiom-Reader"
PUBLIC_FIGURES = AXIOM_READER / "public/figures/vol1"

# TinyTeX path
TINYTEX_BIN = Path.home() / "Library/TinyTeX/bin/universal-darwin"
PDFLATEX = TINYTEX_BIN / "pdflatex"
PDF2SVG = "/opt/homebrew/bin/pdf2svg"

# Chapter mapping
CHAPTERS = {
    3: "ch03-derivatives",
    4: "ch04-diff-rules",
    5: "ch05-applications-diff",
    6: "ch06-integrals",
}

# Standalone LaTeX wrapper template
STANDALONE_TEMPLATE = r"""
\documentclass[tikz,border=5pt]{standalone}
\usepackage[utf8]{inputenc}
\usepackage{amsmath,amssymb}
\usepackage{textcomp}

% Define \centernot manually (centernot package not always available)
\newcommand{\centernot}[1]{\ensuremath{\mathrel{\ooalign{$#1$\cr\hidewidth$\not$\hidewidth\cr}}}}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usepgfplotslibrary{fillbetween}
\usetikzlibrary{intersections,patterns,decorations.markings,arrows.meta,calc}

% Atlas color definitions
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
\definecolor{AtlasCoral}{HTML}{F97316}
\definecolor{AtlasLime}{HTML}{059669}
\definecolor{AtlasSlate}{HTML}{64748B}

% Ignore \Description command (accessibility, not needed for SVG)
\newcommand{\Description}[1]{}

% Custom math commands from Atlas style
\newcommand{\dx}{\,dx}
\newcommand{\dy}{\,dy}
\newcommand{\dt}{\,dt}
\newcommand{\du}{\,du}
\newcommand{\dv}{\,dv}

\begin{document}
%TIKZ_CONTENT%
\end{document}
"""


def extract_tikzpicture(tex_path: Path) -> str | None:
    """Extract the tikzpicture environment from a figure .tex file"""
    try:
        content = tex_path.read_text()
    except Exception as e:
        print(f"  ⚠️  Cannot read {tex_path}: {e}")
        return None
    
    # Find tikzpicture content (may be wrapped in figure environment)
    import re
    
    # Try to find \begin{tikzpicture}...\end{tikzpicture}
    match = re.search(
        r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})',
        content,
        re.DOTALL
    )
    
    if match:
        return match.group(1)
    
    # Maybe it's just axis content without tikzpicture wrapper?
    match = re.search(
        r'(\\begin\{axis\}.*?\\end\{axis\})',
        content,
        re.DOTALL
    )
    
    if match:
        return f"\\begin{{tikzpicture}}\n{match.group(1)}\n\\end{{tikzpicture}}"
    
    return None


def compile_to_svg(tikz_content: str, output_svg: Path, dry_run: bool = False) -> bool:
    """Compile TikZ content to SVG via PDF"""
    if dry_run:
        return True
    
    # Create standalone document
    standalone_doc = STANDALONE_TEMPLATE.replace("%TIKZ_CONTENT%", tikz_content)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        tex_file = tmpdir / "figure.tex"
        pdf_file = tmpdir / "figure.pdf"
        
        # Write LaTeX file
        tex_file.write_text(standalone_doc)
        
        # Run pdflatex
        try:
            result = subprocess.run(
                [str(PDFLATEX), "-interaction=nonstopmode", "-halt-on-error", str(tex_file)],
                cwd=tmpdir,
                capture_output=True,
                timeout=60,
                env={**os.environ, "PATH": f"{TINYTEX_BIN}:{os.environ.get('PATH', '')}"}
            )
            
            if not pdf_file.exists():
                print(f"  ❌ pdflatex failed")
                # Show relevant error lines
                log_file = tmpdir / "figure.log"
                if log_file.exists():
                    log = log_file.read_text()
                    for line in log.split('\n'):
                        if '!' in line or 'Error' in line:
                            print(f"      {line[:100]}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"  ❌ pdflatex timed out")
            return False
        except Exception as e:
            print(f"  ❌ pdflatex error: {e}")
            return False
        
        # Convert PDF to SVG
        try:
            output_svg.parent.mkdir(parents=True, exist_ok=True)
            result = subprocess.run(
                [PDF2SVG, str(pdf_file), str(output_svg)],
                capture_output=True,
                timeout=30
            )
            
            if not output_svg.exists():
                print(f"  ❌ pdf2svg failed")
                return False
                
        except Exception as e:
            print(f"  ❌ pdf2svg error: {e}")
            return False
    
    return True


def process_chapter(chapter_num: int, dry_run: bool = False) -> dict:
    """Process all figures in a chapter"""
    stats = {"found": 0, "compiled": 0, "failed": 0, "skipped": 0}
    
    chapter_dir = CHAPTERS.get(chapter_num)
    if not chapter_dir:
        print(f"  ⚠️  Unknown chapter {chapter_num}")
        return stats
    
    figures_dir = LATEX_SOURCE / chapter_dir / "figures"
    if not figures_dir.exists():
        print(f"  ⚠️  No figures directory: {figures_dir}")
        return stats
    
    output_dir = PUBLIC_FIGURES / f"ch{chapter_num:02d}"
    
    # Find all .tex figure files
    tex_files = sorted(figures_dir.glob("fig-*.tex"))
    stats["found"] = len(tex_files)
    
    for tex_file in tex_files:
        svg_name = tex_file.stem + ".svg"
        svg_path = output_dir / svg_name
        
        # Check if SVG already exists
        if svg_path.exists():
            print(f"  ⏭️  {svg_name} (exists)")
            stats["skipped"] += 1
            continue
        
        print(f"  🔧 {tex_file.name} → {svg_name}")
        
        # Extract tikzpicture
        tikz_content = extract_tikzpicture(tex_file)
        if not tikz_content:
            print(f"     ⚠️  No tikzpicture found")
            stats["failed"] += 1
            continue
        
        # Compile to SVG
        if compile_to_svg(tikz_content, svg_path, dry_run):
            if dry_run:
                print(f"     ✅ Would compile")
            else:
                print(f"     ✅ Compiled")
            stats["compiled"] += 1
        else:
            stats["failed"] += 1
    
    return stats


def main():
    import sys
    
    dry_run = "--dry-run" in sys.argv
    
    # Check for specific chapter
    chapter_filter = None
    for arg in sys.argv:
        if arg.startswith("--chapter="):
            chapter_filter = int(arg.split("=")[1])
        elif arg == "--chapter" and sys.argv.index(arg) + 1 < len(sys.argv):
            next_idx = sys.argv.index(arg) + 1
            chapter_filter = int(sys.argv[next_idx])
    
    if dry_run:
        print("🔍 DRY RUN MODE\n")
    else:
        print("🚀 COMPILING TIKZ FIGURES TO SVG\n")
    
    # Verify tools exist
    if not PDFLATEX.exists():
        print(f"❌ pdflatex not found at {PDFLATEX}")
        return
    if not Path(PDF2SVG).exists():
        print(f"❌ pdf2svg not found at {PDF2SVG}")
        return
    
    print(f"Using: {PDFLATEX}")
    print(f"Using: {PDF2SVG}")
    print()
    
    total_stats = {"found": 0, "compiled": 0, "failed": 0, "skipped": 0}
    
    chapters_to_process = [chapter_filter] if chapter_filter else sorted(CHAPTERS.keys())
    
    for chapter_num in chapters_to_process:
        chapter_dir = CHAPTERS[chapter_num]
        print(f"\n{'='*60}")
        print(f"📚 Chapter {chapter_num}: {chapter_dir}")
        print('='*60)
        
        stats = process_chapter(chapter_num, dry_run)
        
        for key in total_stats:
            total_stats[key] += stats[key]
        
        print(f"\n  📊 Found: {stats['found']}, Compiled: {stats['compiled']}, "
              f"Skipped: {stats['skipped']}, Failed: {stats['failed']}")
    
    print(f"\n{'='*60}")
    print("📊 SUMMARY")
    print('='*60)
    print(f"Total figures found: {total_stats['found']}")
    print(f"Compiled to SVG: {total_stats['compiled']}")
    print(f"Already existed: {total_stats['skipped']}")
    print(f"Failed: {total_stats['failed']}")
    
    if dry_run:
        print("\n⚠️  This was a dry run. Run without --dry-run to compile.")


if __name__ == "__main__":
    main()
