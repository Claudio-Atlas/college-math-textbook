#!/usr/bin/env python3
"""
Extract Inline Figures from Section Files
==========================================
Finds tikzpicture environments embedded directly in section .tex files
(not via \input{} references) and extracts them to JSON + SVG.

This handles Case 2 of figure extraction:
- Case 1: \input{figures/fig-...} references → extract_missing_figures.py
- Case 2: Inline \begin{tikzpicture} in sections → THIS SCRIPT
- Case 3: Manual/pre-existing figures → handled separately

Usage:
    python pipeline/extract_inline_figures.py [--dry-run] [--chapter N]
"""

import json
import re
import subprocess
import tempfile
import os
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Configuration
LATEX_SOURCE = Path.home() / "Desktop/Atlas-Textbooks/source/vol1"
AXIOM_READER = Path.home() / "Desktop/Axiom-Reader"
JSON_CONTENT = AXIOM_READER / "src-content/calculus-vol1"
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

% Ignore \Description command
\newcommand{\Description}[1]{}

% Custom math commands
\newcommand{\dx}{\,dx}
\newcommand{\dy}{\,dy}
\newcommand{\dt}{\,dt}
\newcommand{\du}{\,du}
\newcommand{\dv}{\,dv}
\newcommand{\deriv}[2]{\frac{d#1}{d#2}}
\newcommand{\pderiv}[2]{\frac{\partial #1}{\partial #2}}

% Define \centernot manually
\newcommand{\centernot}[1]{\ensuremath{\mathrel{\ooalign{$#1$\cr\hidewidth$\not$\hidewidth\cr}}}}

\begin{document}
%TIKZ_CONTENT%
\end{document}
"""


@dataclass
class InlineFigure:
    """An inline figure found in a section file"""
    chapter: int
    section: int
    line_number: int
    tikz_content: str
    description: str
    caption: str
    label: str
    fig_id: str  # Generated ID like "fig-5.4-inline-1"


def extract_inline_figures(section_tex: Path, chapter: int, section: int) -> list[InlineFigure]:
    r"""
    Find all inline tikzpicture environments in a section file.
    Excludes figures that are loaded via \input{} (those are handled separately).
    
    Handles multiple patterns:
    1. \begin{figure}...\begin{tikzpicture}...\end{tikzpicture}...\caption...\end{figure}
    2. \begin{center}\begin{tikzpicture}\Description{...}...\end{tikzpicture}\end{center}
    3. Standalone \begin{tikzpicture}\Description{...}...\end{tikzpicture}
    """
    figures = []
    
    try:
        content = section_tex.read_text()
    except Exception as e:
        print(f"  ⚠️  Cannot read {section_tex}: {e}")
        return figures
    
    # Find ALL tikzpicture environments with \Description tags
    # This catches inline figures in center, figure, or standalone environments
    # Handles optional [options] after \begin{tikzpicture}
    tikz_pattern = re.compile(
        r'(\\begin\{tikzpicture\}(?:\[[^\]]*\])?\s*'
        r'\\Description\{((?:[^{}]|\{(?:[^{}]|\{[^{}]*\})*\})*)\}'  # Nested braces up to 2 levels
        r'.*?'
        r'\\end\{tikzpicture\})',
        re.DOTALL
    )
    
    inline_count = 0
    
    for match in tikz_pattern.finditer(content):
        tikz_content = match.group(1)
        description = match.group(2).strip()
        description = re.sub(r'\s+', ' ', description)
        
        match_start = match.start()
        line_number = content[:match_start].count('\n') + 1
        
        # Check if this tikzpicture is from an \input{} reference
        # by looking for \input{...fig...} on a nearby preceding line
        preceding_100_chars = content[max(0, match_start-100):match_start]
        if re.search(r'\\input\{[^}]*fig[^}]*\}', preceding_100_chars):
            continue  # Skip - this is from an external file
        
        # Try to extract caption from surrounding figure environment
        # Look backwards for \begin{figure} and forwards for \caption
        caption = ""
        label = ""
        
        # Check if inside a figure environment
        before = content[:match_start]
        after = content[match.end():match.end()+500]
        
        # Find most recent \begin{figure}
        fig_start = before.rfind(r'\begin{figure}')
        if fig_start != -1:
            # Check if there's no \end{figure} between fig_start and our tikz
            between = before[fig_start:]
            if r'\end{figure}' not in between:
                # We're inside a figure env - look for caption
                cap_match = re.search(r'\\caption\{((?:[^{}]|\{[^{}]*\})*)\}', after)
                if cap_match:
                    caption = cap_match.group(1).strip()
                    caption = re.sub(r'\s+', ' ', caption)
                
                lab_match = re.search(r'\\label\{([^}]+)\}', after)
                if lab_match:
                    label = lab_match.group(1).strip()
        
        # Generate figure ID
        inline_count += 1
        fig_id = f"fig-{chapter}.{section}-inline-{inline_count}"
        
        figures.append(InlineFigure(
            chapter=chapter,
            section=section,
            line_number=line_number,
            tikz_content=tikz_content,
            description=description,
            caption=caption,
            label=label,
            fig_id=fig_id
        ))
    
    return figures


def compile_to_svg(tikz_content: str, output_svg: Path, dry_run: bool = False) -> bool:
    """Compile TikZ content to SVG via PDF"""
    if dry_run:
        return True
    
    standalone_doc = STANDALONE_TEMPLATE.replace("%TIKZ_CONTENT%", tikz_content)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tmpdir = Path(tmpdir)
        tex_file = tmpdir / "figure.tex"
        pdf_file = tmpdir / "figure.pdf"
        
        tex_file.write_text(standalone_doc)
        
        try:
            result = subprocess.run(
                [str(PDFLATEX), "-interaction=nonstopmode", "-halt-on-error", str(tex_file)],
                cwd=tmpdir,
                capture_output=True,
                timeout=60,
                env={**os.environ, "PATH": f"{TINYTEX_BIN}:{os.environ.get('PATH', '')}"}
            )
            
            if not pdf_file.exists():
                log_file = tmpdir / "figure.log"
                if log_file.exists():
                    log = log_file.read_text()
                    for line in log.split('\n'):
                        if '!' in line or 'Error' in line:
                            print(f"      {line[:100]}")
                return False
                
        except subprocess.TimeoutExpired:
            print(f"      ❌ pdflatex timed out")
            return False
        except Exception as e:
            print(f"      ❌ pdflatex error: {e}")
            return False
        
        try:
            output_svg.parent.mkdir(parents=True, exist_ok=True)
            subprocess.run(
                [PDF2SVG, str(pdf_file), str(output_svg)],
                capture_output=True,
                timeout=30
            )
            
            if not output_svg.exists():
                return False
                
        except Exception as e:
            print(f"      ❌ pdf2svg error: {e}")
            return False
    
    return True


def get_section_number(filename: str) -> Optional[int]:
    """Extract section number from secNN-name.tex"""
    match = re.match(r'sec(\d+)', filename)
    return int(match.group(1)) if match else None


def process_chapter(chapter_num: int, dry_run: bool = False) -> dict:
    """Process all sections in a chapter for inline figures"""
    stats = {"sections": 0, "figures_found": 0, "compiled": 0, "failed": 0, "added_to_json": 0}
    
    chapter_dir = CHAPTERS.get(chapter_num)
    if not chapter_dir:
        print(f"  ⚠️  Unknown chapter {chapter_num}")
        return stats
    
    chapter_path = LATEX_SOURCE / chapter_dir
    if not chapter_path.exists():
        print(f"  ⚠️  Chapter directory not found: {chapter_path}")
        return stats
    
    # Find all section .tex files
    section_files = sorted(chapter_path.glob("sec*.tex"))
    
    for section_tex in section_files:
        sec_num = get_section_number(section_tex.name)
        if sec_num is None:
            continue
        
        stats["sections"] += 1
        
        # Extract inline figures
        figures = extract_inline_figures(section_tex, chapter_num, sec_num)
        
        if not figures:
            continue
        
        print(f"\n  📄 Section {chapter_num}.{sec_num}: {section_tex.name}")
        print(f"     Found {len(figures)} inline figure(s)")
        stats["figures_found"] += len(figures)
        
        # Load corresponding JSON
        json_path = JSON_CONTENT / f"ch{chapter_num:02d}/sec{sec_num:02d}.json"
        if not json_path.exists():
            print(f"     ⚠️  JSON not found: {json_path}")
            continue
        
        try:
            section_data = json.loads(json_path.read_text())
        except Exception as e:
            print(f"     ⚠️  Cannot parse JSON: {e}")
            continue
        
        content = section_data.get("content", [])
        existing_ids = {b.get("id") for b in content if b.get("type") == "figure"}
        
        output_dir = PUBLIC_FIGURES / f"ch{chapter_num:02d}"
        figures_added = []
        
        for fig in figures:
            # Check if already in JSON
            if fig.fig_id in existing_ids:
                print(f"     ⏭️  {fig.fig_id} already in JSON")
                continue
            
            svg_filename = f"{fig.fig_id}.svg"
            svg_path = output_dir / svg_filename
            
            print(f"     🔧 {fig.fig_id} (line {fig.line_number})")
            
            # Compile to SVG
            if svg_path.exists():
                print(f"        SVG exists")
                compiled = True
            elif compile_to_svg(fig.tikz_content, svg_path, dry_run):
                if not dry_run:
                    print(f"        ✅ Compiled SVG")
                else:
                    print(f"        ✅ Would compile")
                compiled = True
                stats["compiled"] += 1
            else:
                print(f"        ❌ Failed to compile")
                compiled = False
                stats["failed"] += 1
            
            if compiled:
                # Create figure block for JSON
                block = {
                    "type": "figure",
                    "id": fig.fig_id,
                    "src": f"/figures/vol1/ch{chapter_num:02d}/{svg_filename}",
                    "caption": fig.caption,
                    "alt": fig.description
                }
                figures_added.append(block)
        
        # Add figures to JSON
        if figures_added and not dry_run:
            for block in figures_added:
                content.append(block)
                stats["added_to_json"] += 1
            
            section_data["content"] = content
            json_path.write_text(json.dumps(section_data, indent=2))
            print(f"     💾 Added {len(figures_added)} figure(s) to JSON")
    
    return stats


def main():
    import sys
    
    dry_run = "--dry-run" in sys.argv
    
    # Check for specific chapter
    chapter_filter = None
    for i, arg in enumerate(sys.argv):
        if arg.startswith("--chapter="):
            chapter_filter = int(arg.split("=")[1])
        elif arg == "--chapter" and i + 1 < len(sys.argv):
            chapter_filter = int(sys.argv[i + 1])
    
    if dry_run:
        print("🔍 DRY RUN MODE\n")
    else:
        print("🚀 EXTRACTING INLINE FIGURES\n")
    
    print(f"LaTeX source: {LATEX_SOURCE}")
    print(f"JSON content: {JSON_CONTENT}")
    print()
    
    total_stats = {"sections": 0, "figures_found": 0, "compiled": 0, "failed": 0, "added_to_json": 0}
    
    chapters_to_process = [chapter_filter] if chapter_filter else sorted(CHAPTERS.keys())
    
    for chapter_num in chapters_to_process:
        chapter_dir = CHAPTERS[chapter_num]
        print(f"\n{'='*60}")
        print(f"📚 Chapter {chapter_num}: {chapter_dir}")
        print('='*60)
        
        stats = process_chapter(chapter_num, dry_run)
        
        for key in total_stats:
            total_stats[key] += stats[key]
    
    print(f"\n{'='*60}")
    print("📊 SUMMARY")
    print('='*60)
    print(f"Sections scanned: {total_stats['sections']}")
    print(f"Inline figures found: {total_stats['figures_found']}")
    print(f"SVGs compiled: {total_stats['compiled']}")
    print(f"Added to JSON: {total_stats['added_to_json']}")
    print(f"Failed: {total_stats['failed']}")
    
    if dry_run:
        print("\n⚠️  This was a dry run. Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
