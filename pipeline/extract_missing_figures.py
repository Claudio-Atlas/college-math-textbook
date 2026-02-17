#!/usr/bin/env python3
"""
Extract Missing Figures Script
==============================
Scans LaTeX source files for figure references and injects them into JSON content.

Problem: latex_converter.py skips TikZ figures and doesn't follow \input{} refs.
Solution: This script extracts figure metadata directly and injects into JSONs.

Usage:
    python pipeline/extract_missing_figures.py [--dry-run]
"""

import json
import re
import os
import shutil
from pathlib import Path
from dataclasses import dataclass
from typing import Optional

# Configuration
LATEX_SOURCE = Path.home() / "Desktop/Atlas-Textbooks/source/vol1"
AXIOM_READER = Path.home() / "Desktop/Axiom-Reader"
JSON_CONTENT = AXIOM_READER / "src-content/calculus-vol1"
PUBLIC_FIGURES = AXIOM_READER / "public/figures/vol1"

# Chapter directory mapping (LaTeX dir name -> chapter number)
CHAPTER_MAP = {
    "ch01-functions": 1,
    "ch02-limits": 2,
    "ch03-derivatives": 3,
    "ch04-diff-rules": 4,
    "ch05-applications-diff": 5,
    "ch06-integrals": 6,
}

@dataclass
class FigureInfo:
    """Extracted figure metadata"""
    chapter: int
    section: int
    fig_number: str  # e.g., "2.1.1"
    name: str  # e.g., "secant-line"
    tex_path: Path
    svg_path: Optional[Path]
    caption: str
    alt: str
    label: str


def extract_figure_metadata(tex_path: Path) -> Optional[dict]:
    """Extract \Description, \caption, and \label from a figure .tex file"""
    try:
        content = tex_path.read_text()
    except Exception as e:
        print(f"  ⚠️  Cannot read {tex_path}: {e}")
        return None
    
    # Extract \Description{...} - handles multi-line
    desc_match = re.search(r'\\Description\{((?:[^{}]|\{[^{}]*\})*)\}', content, re.DOTALL)
    description = desc_match.group(1).strip() if desc_match else ""
    # Clean up whitespace
    description = re.sub(r'\s+', ' ', description)
    
    # Extract \caption{...}
    cap_match = re.search(r'\\caption\{((?:[^{}]|\{[^{}]*\})*)\}', content, re.DOTALL)
    caption = cap_match.group(1).strip() if cap_match else ""
    caption = re.sub(r'\s+', ' ', caption)
    
    # Extract \label{...}
    label_match = re.search(r'\\label\{([^}]+)\}', content)
    label = label_match.group(1).strip() if label_match else ""
    
    return {
        "caption": caption,
        "alt": description,
        "label": label
    }


def parse_figure_reference(input_line: str, chapter_dir: str) -> Optional[dict]:
    """Parse a \input{chXX-.../figures/fig-X.Y.Z-name.tex} line"""
    # Match: \input{ch02-limits/figures/fig-2.1.1-secant-line.tex}
    match = re.search(r'\\input\{([^}]+/figures/fig-(\d+)\.(\d+)\.(\d+)-([^}]+)\.tex)\}', input_line)
    if not match:
        return None
    
    rel_path = match.group(1)
    ch_num = int(match.group(2))
    sec_num = int(match.group(3))
    fig_idx = int(match.group(4))
    fig_name = match.group(5)
    
    return {
        "rel_path": rel_path,
        "chapter": ch_num,
        "section": sec_num,
        "fig_idx": fig_idx,
        "fig_number": f"{ch_num}.{sec_num}.{fig_idx}",
        "name": fig_name
    }


def scan_latex_for_figures(section_tex: Path, chapter_dir: str) -> list[dict]:
    """Scan a section .tex file for all figure \input references"""
    figures = []
    try:
        content = section_tex.read_text()
    except Exception as e:
        print(f"  ⚠️  Cannot read {section_tex}: {e}")
        return figures
    
    for line in content.split('\n'):
        if '\\input{' in line and '/figures/' in line:
            parsed = parse_figure_reference(line, chapter_dir)
            if parsed:
                figures.append(parsed)
    
    return figures


def get_section_number_from_filename(filename: str) -> Optional[int]:
    """Extract section number from sec01-name.tex or secNN-name.tex"""
    match = re.match(r'sec(\d+)', filename)
    return int(match.group(1)) if match else None


def create_figure_block(fig_info: dict, metadata: dict, chapter: int) -> dict:
    """Create a JSON figure block"""
    # Generate SVG path: /figures/vol1/ch02/fig-2.1.1-secant-line.svg
    svg_filename = f"fig-{fig_info['fig_number']}-{fig_info['name']}.svg"
    src = f"/figures/vol1/ch{chapter:02d}/{svg_filename}"
    
    return {
        "type": "figure",
        "id": f"fig-{fig_info['fig_number']}",
        "src": src,
        "caption": metadata.get("caption", ""),
        "alt": metadata.get("alt", "")
    }


def find_insertion_point(content: list, section: int, fig_idx: int) -> int:
    """
    Find where to insert figure in content array.
    Strategy: Insert after corresponding definition/example if numbering matches,
    otherwise append to end of content.
    """
    # For now, append to end - more sophisticated logic can be added
    # A better approach would be to track position in LaTeX and mirror it
    return len(content)


def process_chapter(chapter_dir: str, chapter_num: int, dry_run: bool = False) -> dict:
    """Process all sections in a chapter"""
    stats = {"sections": 0, "figures_found": 0, "figures_added": 0, "svgs_copied": 0}
    
    chapter_path = LATEX_SOURCE / chapter_dir
    figures_dir = chapter_path / "figures"
    
    if not chapter_path.exists():
        print(f"  ⚠️  Chapter directory not found: {chapter_path}")
        return stats
    
    # Find all section .tex files
    section_files = sorted(chapter_path.glob("sec*.tex"))
    
    for section_tex in section_files:
        sec_num = get_section_number_from_filename(section_tex.name)
        if sec_num is None:
            continue
        
        stats["sections"] += 1
        print(f"\n  📄 Section {chapter_num}.{sec_num}: {section_tex.name}")
        
        # Scan for figure references
        figures = scan_latex_for_figures(section_tex, chapter_dir)
        stats["figures_found"] += len(figures)
        
        if not figures:
            print(f"     No figures found")
            continue
        
        print(f"     Found {len(figures)} figure(s)")
        
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
        existing_figure_ids = {b.get("id") for b in content if b.get("type") == "figure"}
        
        figures_to_add = []
        
        for fig in figures:
            fig_id = f"fig-{fig['fig_number']}"
            
            if fig_id in existing_figure_ids:
                print(f"     ⏭️  {fig_id} already in JSON")
                continue
            
            # Get figure .tex file path
            fig_tex_path = LATEX_SOURCE / fig["rel_path"]
            if not fig_tex_path.exists():
                print(f"     ⚠️  Figure .tex not found: {fig_tex_path}")
                continue
            
            # Extract metadata
            metadata = extract_figure_metadata(fig_tex_path)
            if not metadata:
                continue
            
            # Check for SVG
            svg_source = figures_dir / f"fig-{fig['fig_number']}-{fig['name']}.svg"
            svg_exists = svg_source.exists()
            
            # Create figure block
            block = create_figure_block(fig, metadata, chapter_num)
            figures_to_add.append((fig, block, svg_source if svg_exists else None))
            
            status = "✅" if svg_exists else "⚠️ NO SVG"
            print(f"     {status} {fig_id}: {fig['name']}")
            if metadata.get("caption"):
                print(f"         Caption: {metadata['caption'][:60]}...")
        
        # Add figures to content
        if figures_to_add and not dry_run:
            for fig, block, svg_source in figures_to_add:
                content.append(block)
                stats["figures_added"] += 1
                
                # Copy SVG to public directory
                if svg_source and svg_source.exists():
                    dest_dir = PUBLIC_FIGURES / f"ch{chapter_num:02d}"
                    dest_dir.mkdir(parents=True, exist_ok=True)
                    dest_path = dest_dir / svg_source.name
                    if not dest_path.exists():
                        shutil.copy2(svg_source, dest_path)
                        stats["svgs_copied"] += 1
                        print(f"     📋 Copied SVG to {dest_path.name}")
            
            # Save updated JSON
            section_data["content"] = content
            json_path.write_text(json.dumps(section_data, indent=2))
            print(f"     💾 Updated {json_path.name}")
    
    return stats


def main():
    import sys
    dry_run = "--dry-run" in sys.argv
    
    if dry_run:
        print("🔍 DRY RUN MODE - No changes will be made\n")
    else:
        print("🚀 EXTRACTING MISSING FIGURES\n")
    
    print(f"LaTeX source: {LATEX_SOURCE}")
    print(f"JSON content: {JSON_CONTENT}")
    print(f"Public figures: {PUBLIC_FIGURES}")
    print()
    
    total_stats = {"sections": 0, "figures_found": 0, "figures_added": 0, "svgs_copied": 0}
    
    for chapter_dir, chapter_num in sorted(CHAPTER_MAP.items(), key=lambda x: x[1]):
        print(f"\n{'='*60}")
        print(f"📚 Chapter {chapter_num}: {chapter_dir}")
        print('='*60)
        
        stats = process_chapter(chapter_dir, chapter_num, dry_run)
        
        for key in total_stats:
            total_stats[key] += stats[key]
    
    print(f"\n{'='*60}")
    print("📊 SUMMARY")
    print('='*60)
    print(f"Sections scanned: {total_stats['sections']}")
    print(f"Figures found in LaTeX: {total_stats['figures_found']}")
    print(f"Figures added to JSON: {total_stats['figures_added']}")
    print(f"SVGs copied to public: {total_stats['svgs_copied']}")
    
    if dry_run:
        print("\n⚠️  This was a dry run. Run without --dry-run to apply changes.")


if __name__ == "__main__":
    main()
