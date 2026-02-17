#!/usr/bin/env python3
"""
Fix figure placement and captions in JSON files.

1. Extract captions from LaTeX
2. Find where figures are referenced in content
3. Update JSON with proper captions and placement
"""

import json
import re
from pathlib import Path

TEXTBOOKS_DIR = Path.home() / "Desktop" / "Atlas-Textbooks" / "source"
CONTENT_DIR = Path.home() / "Desktop" / "axiom-reader" / "content"
FIGURES_DIR = Path.home() / "Desktop" / "axiom-reader" / "public" / "figures"


def extract_figure_info_from_latex(tex_path: Path) -> dict:
    """Extract figure labels, captions, and approximate positions from LaTeX."""
    content = tex_path.read_text()
    figures = {}
    
    # Find all figure environments with their content
    fig_pattern = re.compile(
        r'\\begin\{figure\}.*?'
        r'(?:\\caption\{((?:[^{}]|\{[^{}]*\})*)\}).*?'
        r'\\label\{(fig:[^}]+)\}.*?'
        r'\\end\{figure\}',
        re.DOTALL
    )
    
    for match in fig_pattern.finditer(content):
        caption_raw = match.group(1) or ""
        label = match.group(2)
        position = match.start()
        
        # Clean up caption
        caption = caption_raw.strip()
        caption = re.sub(r'\s+', ' ', caption)  # Normalize whitespace
        # Keep math but clean other LaTeX commands
        caption = re.sub(r'\\cref\{[^}]+\}', '', caption)
        caption = re.sub(r'\\ref\{[^}]+\}', '', caption)
        caption = caption.strip()
        
        figures[label] = {
            'caption': caption,
            'position': position,
            'position_pct': position / len(content) if content else 0
        }
    
    return figures


def find_figure_references(content: list) -> dict:
    """Find where figures are referenced in content blocks."""
    refs = {}
    
    for idx, block in enumerate(content):
        text = ""
        if block.get('type') == 'paragraph':
            text = block.get('text', '')
        elif block.get('type') == 'example':
            text = block.get('problem', '') + ' ' + block.get('solution', '')
        elif block.get('type') in ('definition', 'theorem'):
            text = block.get('content', '')
        
        # Find figure references like Figure 1.1 or \cref{fig:...}
        # Also look for "figure" mentions
        fig_mentions = re.findall(r'[Ff]igure\s+(\d+\.\d+)', text)
        cref_mentions = re.findall(r'\\cref\{(fig:[^}]+)\}', text)
        ref_mentions = re.findall(r'\\ref\{(fig:[^}]+)\}', text)
        
        for ref in cref_mentions + ref_mentions:
            if ref not in refs:
                refs[ref] = idx
    
    return refs


def fix_section_figures(book: str, chapter: int, section: int):
    """Fix figure placement and captions for a section."""
    
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
        return
    
    # Extract figure info from LaTeX
    latex_figures = extract_figure_info_from_latex(tex_path)
    if not latex_figures:
        return
    
    print(f"  📄 {tex_path.name}: {len(latex_figures)} figure(s)")
    
    # Load JSON
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    content = data.get('content', [])
    
    # Find existing figures and remove them (we'll re-add in correct positions)
    figures_in_json = []
    new_content = []
    for block in content:
        if block.get('type') == 'figure':
            figures_in_json.append(block)
        else:
            new_content.append(block)
    
    if not figures_in_json:
        return
    
    # Update captions from LaTeX
    for fig in figures_in_json:
        fig_id = fig.get('id', '')
        # Convert fig-1.1-name to fig:name for matching
        fig_name = fig_id.split('-')[-1] if '-' in fig_id else fig_id
        
        # Try to find matching LaTeX figure
        for label, info in latex_figures.items():
            if fig_name in label or label.replace('fig:', '') == fig_name:
                if info['caption']:
                    fig['caption'] = info['caption']
                    print(f"    ✓ Caption: {fig_id} → \"{info['caption'][:50]}...\"")
                break
    
    # Find where figures should be placed based on references
    refs = find_figure_references(new_content)
    
    # Sort figures by their LaTeX position
    figures_sorted = sorted(figures_in_json, key=lambda f: 
        latex_figures.get(f'fig:{f["id"].split("-")[-1]}', {}).get('position_pct', 1))
    
    # Insert figures at appropriate positions
    # Strategy: Insert after the block that references them, or distribute evenly
    
    # For now, distribute figures throughout content based on their LaTeX position
    total_blocks = len(new_content)
    for fig in figures_sorted:
        fig_name = fig['id'].split('-')[-1] if '-' in fig['id'] else fig['id']
        latex_info = latex_figures.get(f'fig:{fig_name}', {})
        pos_pct = latex_info.get('position_pct', 0.5)
        
        # Calculate insertion index (before exercises)
        exercise_idx = total_blocks
        for i, block in enumerate(new_content):
            if block.get('type') == 'exercise' or (block.get('type') == 'heading' and 'exercise' in block.get('text', '').lower()):
                exercise_idx = i
                break
        
        # Insert at proportional position within content (before exercises)
        insert_idx = min(int(pos_pct * exercise_idx), exercise_idx)
        insert_idx = max(insert_idx, 1)  # At least after first block
        
        new_content.insert(insert_idx, fig)
        print(f"    ✓ Placed {fig['id']} at position {insert_idx}/{len(new_content)}")
    
    # Save updated JSON
    data['content'] = new_content
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"    📝 Updated {json_path.name}")


def process_book(book: str):
    """Process all sections in a book."""
    print(f"📚 Fixing figures in: {book}")
    
    book_content_dir = CONTENT_DIR / book
    if not book_content_dir.exists():
        print(f"❌ Content dir not found")
        return
    
    for chapter_dir in sorted(book_content_dir.iterdir()):
        if not chapter_dir.is_dir() or not chapter_dir.name.startswith('ch'):
            continue
        
        ch_num = int(chapter_dir.name.replace('ch', ''))
        print(f"  📖 Chapter {ch_num}")
        
        for json_file in sorted(chapter_dir.glob('sec*.json')):
            if '-' in json_file.stem:
                continue
            try:
                sec_num = int(json_file.stem.replace('sec', ''))
            except ValueError:
                continue
            fix_section_figures(book, ch_num, sec_num)


if __name__ == '__main__':
    import sys
    book = sys.argv[1] if len(sys.argv) > 1 else 'vol1'
    process_book(book)
