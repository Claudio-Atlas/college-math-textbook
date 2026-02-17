#!/usr/bin/env python3
"""
Inject figure blocks into JSON files based on LaTeX source.

Finds TikZ figures in LaTeX, matches them to existing SVGs,
and adds figure blocks to JSON content at appropriate positions.
"""

import json
import re
from pathlib import Path

TEXTBOOKS_DIR = Path.home() / "Desktop" / "Atlas-Textbooks" / "source"
CONTENT_DIR = Path.home() / "Desktop" / "axiom-reader" / "content"
FIGURES_DIR = Path.home() / "Desktop" / "axiom-reader" / "public" / "figures"


def extract_figures_from_latex(tex_path: Path) -> list:
    """Extract figure info from LaTeX file."""
    content = tex_path.read_text()
    figures = []
    
    # Pattern for figure environments with TikZ
    # Captures: caption and label
    fig_pattern = re.compile(
        r'\\begin\{figure\}.*?'
        r'(?:\\caption\{([^}]*(?:\{[^}]*\}[^}]*)*)\})?.*?'
        r'(?:\\label\{(fig:[^}]+)\})?.*?'
        r'\\end\{figure\}',
        re.DOTALL
    )
    
    # Also find standalone TikZ (not in figure env)
    standalone_pattern = re.compile(
        r'(?<!\\begin\{figure\}.*?)\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}',
        re.DOTALL
    )
    
    # Find all figure environments
    for i, match in enumerate(fig_pattern.finditer(content)):
        caption = match.group(1) or ""
        label = match.group(2) or f"fig:standalone-{i+1}"
        
        # Clean up caption (remove LaTeX commands)
        caption = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', caption)
        caption = re.sub(r'\$([^$]+)\$', r'\1', caption)  # Keep math content
        caption = caption.strip()
        
        figures.append({
            'label': label,
            'caption': caption,
            'position': match.start()  # For ordering
        })
    
    # Count standalone TikZ (outside figure environments)
    standalone_count = len(standalone_pattern.findall(content))
    fig_env_count = len(figures)
    
    # If we have standalone TikZ but fewer figure envs, add placeholders
    if standalone_count > fig_env_count:
        for i in range(fig_env_count, standalone_count):
            figures.append({
                'label': f'fig:standalone-{i+1}',
                'caption': '',
                'position': 999999 + i
            })
    
    return figures


def find_svg_for_figure(book: str, chapter: int, section: int, label: str):
    """Find the SVG file for a figure label."""
    fig_dir = FIGURES_DIR / book / f"ch{chapter:02d}"
    
    # Extract figure ID from label
    fig_id = label.replace('fig:', '')
    
    # Try different naming patterns
    patterns = [
        f"sec{section:02d}-{fig_id}.svg",
        f"sec{section:02d}-standalone-*.svg",
    ]
    
    for pattern in patterns:
        matches = list(fig_dir.glob(pattern))
        if matches:
            # Return web-accessible path
            return f"/figures/{book}/ch{chapter:02d}/{matches[0].name}"
    
    return None


def inject_figures_into_json(book: str, chapter: int, section: int):
    """Add figure blocks to a JSON section file."""
    # Find LaTeX source
    book_dir = TEXTBOOKS_DIR / book
    chapter_dirs = sorted([d for d in book_dir.iterdir() if d.is_dir() and d.name.startswith('ch')])
    
    if chapter > len(chapter_dirs):
        return
    
    chapter_dir = chapter_dirs[chapter - 1]
    tex_files = sorted([f for f in chapter_dir.glob('sec*.tex')])
    
    if section > len(tex_files):
        return
    
    tex_path = tex_files[section - 1]
    
    # Find JSON file
    json_path = CONTENT_DIR / book / f"ch{chapter:02d}" / f"sec{section:02d}.json"
    if not json_path.exists():
        print(f"  ❌ JSON not found: {json_path}")
        return
    
    # Extract figures from LaTeX
    figures = extract_figures_from_latex(tex_path)
    if not figures:
        return
    
    print(f"  📄 {tex_path.name}: {len(figures)} figure(s)")
    
    # Load JSON
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    content = data.get('content', [])
    
    # Check which figures already exist
    existing_ids = {item.get('id') for item in content if item.get('type') == 'figure'}
    
    # Find SVGs and create figure blocks
    figures_added = 0
    for fig in figures:
        fig_id = f"fig-{fig['label'].replace('fig:', '')}"
        
        if fig_id in existing_ids:
            continue
        
        # Find SVG
        svg_path = find_svg_for_figure(book, chapter, section, fig['label'])
        
        if svg_path:
            figure_block = {
                "type": "figure",
                "id": fig_id,
                "src": svg_path,
                "caption": fig['caption'],
                "alt": fig['caption'] or f"Figure {fig_id}"
            }
            
            # Add to content (at end for now - could be smarter about positioning)
            # Find a good insertion point - after examples/definitions, before exercises
            insert_idx = len(content)
            for i, item in enumerate(content):
                if item.get('type') == 'exercise' or (item.get('type') == 'heading' and 'exercise' in item.get('text', '').lower()):
                    insert_idx = i
                    break
            
            content.insert(insert_idx, figure_block)
            figures_added += 1
            print(f"    ✅ Added {fig_id} → {svg_path}")
        else:
            print(f"    ⚠️  No SVG for {fig['label']}")
    
    if figures_added > 0:
        data['content'] = content
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=2)
        print(f"    📝 Updated {json_path.name} (+{figures_added} figures)")


def process_book(book: str):
    """Process all sections in a book."""
    book_dir = TEXTBOOKS_DIR / book
    if not book_dir.exists():
        print(f"❌ Book not found: {book}")
        return
    
    print(f"📚 Processing: {book}")
    
    chapter_dirs = sorted([d for d in book_dir.iterdir() if d.is_dir() and d.name.startswith('ch')])
    
    for ch_idx, chapter_dir in enumerate(chapter_dirs, 1):
        print(f"  📖 Chapter {ch_idx}: {chapter_dir.name}")
        
        tex_files = sorted([f for f in chapter_dir.glob('sec*.tex')])
        for sec_idx, tex_file in enumerate(tex_files, 1):
            inject_figures_into_json(book, ch_idx, sec_idx)


if __name__ == '__main__':
    import argparse
    parser = argparse.ArgumentParser()
    parser.add_argument('--book', default='vol1', help='Book to process')
    args = parser.parse_args()
    
    process_book(args.book)
