#!/usr/bin/env python3
"""
Precalculus TikZ → SVG Figure Pipeline
Extracts tikzpicture environments from LaTeX source, compiles to PDF, converts to SVG.
"""

import argparse
import os
import re
import subprocess
import sys
import tempfile
import shutil
from pathlib import Path

SOURCE_DIR = Path.home() / "Desktop/Atlas-Textbooks/source/precalculus"
OUTPUT_BASE = Path.home() / "Desktop/Axiom-Reader/public/figures/precalculus"
PDFLATEX = Path.home() / "Library/TinyTeX/bin/universal-darwin/pdflatex"
PDF2SVG = Path("/opt/homebrew/bin/pdf2svg")

CHAPTER_DIRS = [
    "ch01-functions-graphs",
    "ch02-polynomial-functions",
    "ch03-rational-functions",
    "ch04-exponential-functions",
    "ch05-logarithmic-functions",
    "ch06-trigonometric-functions",
    "ch07-trig-identities",
    "ch08-applications-trig",
    "ch09-systems-matrices",
    "ch10-conic-sections",
    "ch11-sequences-series",
]

STANDALONE_PREAMBLE = r"""\documentclass[tikz,border=5pt]{standalone}
\usepackage[utf8]{inputenc}
\usepackage{amsmath,amssymb,mathtools,cancel,textcomp,pifont}
\DeclareUnicodeCharacter{00B0}{\ensuremath{{}^{\circ}}}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\usepgfplotslibrary{fillbetween,polar}
\usetikzlibrary{shapes.geometric,intersections,calc,positioning,arrows.meta,patterns,decorations.markings,angles,quotes,backgrounds}

% Atlas colors
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

% Fallbacks
\newcommand{\Description}[1]{}
\providecommand{\centernot}[1]{\ensuremath{\not{#1}}}
\newcommand{\dx}{\,dx}
\newcommand{\dy}{\,dy}
\newcommand{\dt}{\,dt}
\providecommand{\R}{\mathbb{R}}
\providecommand{\N}{\mathbb{N}}
\providecommand{\Z}{\mathbb{Z}}
\providecommand{\Q}{\mathbb{Q}}
\providecommand{\abs}[1]{\left\lvert #1 \right\rvert}

\begin{document}
"""

STANDALONE_END = r"""
\end{document}
"""


def get_chapter_num(dirname):
    m = re.match(r'ch(\d+)', dirname)
    return int(m.group(1)) if m else None


def extract_figures_from_tex(filepath, chapter_num, section_num):
    """Extract tikzpicture environments from a .tex file. Returns list of (name, tikz_code)."""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()

    figures = []
    
    # Pattern 1: \begin{figure}...\end{figure} containing tikzpicture
    fig_pattern = re.compile(
        r'\\begin\{figure\}.*?\n(.*?)\\end\{figure\}',
        re.DOTALL
    )
    
    used_positions = set()  # track tikzpicture positions already captured by figure env
    
    for m in fig_pattern.finditer(content):
        body = m.group(1)
        if r'\begin{tikzpicture}' not in body:
            continue
        
        # Extract label
        label_m = re.search(r'\\label\{fig:([^}]+)\}', body)
        if label_m:
            name = f"fig-{label_m.group(1)}"
        else:
            name = f"fig-{chapter_num}.{section_num}-fig-{len(figures)+1}"
        
        # Extract tikzpicture
        tikz_m = re.search(r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})', body, re.DOTALL)
        if tikz_m:
            tikz_code = tikz_m.group(1)
            # Mark position as used
            abs_start = content.find(tikz_code, m.start())
            used_positions.add(abs_start)
            figures.append((name, tikz_code))
    
    # Pattern 2: Bare tikzpicture (not inside figure env)
    bare_pattern = re.compile(r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})', re.DOTALL)
    inline_count = 0
    for m in bare_pattern.finditer(content):
        if m.start() in used_positions:
            continue
        # Check if this tikzpicture is inside a figure environment
        # by looking backwards for \begin{figure} without matching \end{figure}
        preceding = content[:m.start()]
        fig_opens = len(re.findall(r'\\begin\{figure\}', preceding))
        fig_closes = len(re.findall(r'\\end\{figure\}', preceding))
        if fig_opens > fig_closes:
            continue  # inside a figure env, already captured
        
        inline_count += 1
        name = f"fig-{chapter_num}.{section_num}-inline-{inline_count}"
        figures.append((name, m.group(1)))
    
    return figures


def extract_figures_from_commands(filepath, chapter_num):
    """Extract tikzpicture from \\newcommand{\\figXxx}{...} in figures.tex."""
    with open(filepath, encoding='utf-8') as f:
        content = f.read()
    
    figures = []
    # Match \newcommand{\figName}{ ... tikzpicture ... }
    # Need to handle nested braces
    cmd_pattern = re.compile(r'\\newcommand\{\\(fig[A-Za-z]+)\}')
    
    for m in cmd_pattern.finditer(content):
        cmd_name = m.group(1)
        # Find matching braces
        start = content.index('{', m.end())
        depth = 0
        i = start
        while i < len(content):
            if content[i] == '{':
                depth += 1
            elif content[i] == '}':
                depth -= 1
                if depth == 0:
                    break
            i += 1
        
        body = content[start+1:i]
        
        tikz_m = re.search(r'(\\begin\{tikzpicture\}.*?\\end\{tikzpicture\})', body, re.DOTALL)
        if tikz_m:
            # Convert camelCase to kebab-case
            kebab = re.sub(r'(?<!^)(?=[A-Z])', '-', cmd_name[3:]).lower()  # strip 'fig'
            name = f"fig-{kebab}"
            # In \newcommand bodies, ## becomes # when expanded
            tikz_code = tikz_m.group(1).replace('##', '#')
            figures.append((name, tikz_code))
    
    return figures


def compile_figure(name, tikz_code, output_dir, verbose=False):
    """Compile tikz to PDF then SVG. Returns (success, error_msg)."""
    output_dir.mkdir(parents=True, exist_ok=True)
    svg_path = output_dir / f"{name}.svg"
    
    with tempfile.TemporaryDirectory() as tmpdir:
        tex_path = os.path.join(tmpdir, "figure.tex")
        pdf_path = os.path.join(tmpdir, "figure.pdf")
        
        with open(tex_path, 'w') as f:
            f.write(STANDALONE_PREAMBLE)
            f.write(tikz_code)
            f.write(STANDALONE_END)
        
        # Compile
        result = subprocess.run(
            [str(PDFLATEX), "-interaction=nonstopmode", "-halt-on-error", "figure.tex"],
            cwd=tmpdir,
            capture_output=True,
            text=True,
            timeout=30,
        )
        
        if not os.path.exists(pdf_path):
            error = extract_latex_error(result.stdout + result.stderr)
            if verbose:
                print(f"  FAIL: {error}")
            return False, error
        
        # Convert to SVG
        result2 = subprocess.run(
            [str(PDF2SVG), pdf_path, str(svg_path)],
            capture_output=True,
            text=True,
            timeout=15,
        )
        
        if result2.returncode != 0:
            return False, f"pdf2svg failed: {result2.stderr[:200]}"
    
    return True, None


def extract_latex_error(log):
    """Extract meaningful error from LaTeX log."""
    for line in log.split('\n'):
        if line.startswith('!'):
            return line[:200]
    return "Unknown compilation error"


def get_section_num(filename):
    m = re.search(r'sec(\d+)', filename)
    return int(m.group(1)) if m else 0


def main():
    parser = argparse.ArgumentParser(description="Compile precalculus TikZ figures to SVG")
    parser.add_argument('--dry-run', action='store_true', help='List figures without compiling')
    parser.add_argument('--chapter', type=int, help='Only process chapter N')
    parser.add_argument('--verbose', action='store_true', help='Show compilation output')
    args = parser.parse_args()

    all_figures = []  # (chapter_num, output_dir, name, tikz_code)

    for ch_dir in CHAPTER_DIRS:
        ch_num = get_chapter_num(ch_dir)
        if args.chapter and ch_num != args.chapter:
            continue
        
        ch_path = SOURCE_DIR / ch_dir
        out_dir = OUTPUT_BASE / f"ch{ch_num:02d}"
        
        # Section files
        for tex_file in sorted(ch_path.glob("sec*.tex")):
            sec_num = get_section_num(tex_file.name)
            figs = extract_figures_from_tex(tex_file, ch_num, sec_num)
            for name, code in figs:
                all_figures.append((ch_num, out_dir, name, code))
        
        # figures.tex (ch07, ch09)
        figures_tex = ch_path / "figures.tex"
        if figures_tex.exists():
            figs = extract_figures_from_commands(figures_tex, ch_num)
            for name, code in figs:
                all_figures.append((ch_num, out_dir, name, code))
    
    print(f"Found {len(all_figures)} figures across {len(set(f[0] for f in all_figures))} chapters")
    
    if args.dry_run:
        for ch_num, _, name, _ in all_figures:
            print(f"  Ch{ch_num:02d}: {name}")
        return
    
    compiled = 0
    failed = 0
    failures = []
    
    for ch_num, out_dir, name, tikz_code in all_figures:
        if args.verbose:
            print(f"  Compiling Ch{ch_num:02d}/{name}...", end=" ")
        
        try:
            success, error = compile_figure(name, tikz_code, out_dir, args.verbose)
        except subprocess.TimeoutExpired:
            success, error = False, "Compilation timeout"
        except Exception as e:
            success, error = False, str(e)[:200]
        
        if success:
            compiled += 1
            if args.verbose:
                print("OK")
        else:
            failed += 1
            failures.append((ch_num, name, error))
            if not args.verbose:
                print(f"  FAIL Ch{ch_num:02d}/{name}: {error}")
    
    print(f"\n{'='*60}")
    print(f"Results: {compiled} compiled, {failed} failed, {compiled+failed} total")
    print(f"{'='*60}")
    
    if failures:
        print(f"\nFailed figures ({len(failures)}):")
        for ch, name, err in failures:
            print(f"  Ch{ch:02d}/{name}: {err}")


if __name__ == "__main__":
    main()
