#!/usr/bin/env python3
"""
Smart figure placement based on content references.

Places figures RIGHT BEFORE the block that first references them.
"""

import json
import re
from pathlib import Path

TEXTBOOKS_DIR = Path.home() / "Desktop" / "Atlas-Textbooks" / "source"
CONTENT_DIR = Path.home() / "Desktop" / "axiom-reader" / "content"


def extract_figure_captions_from_latex(tex_path: Path) -> dict:
    """Extract figure labels and captions from LaTeX."""
    content = tex_path.read_text()
    figures = {}
    
    # Find all figure environments
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
        
        caption = caption_raw.strip()
        caption = re.sub(r'\s+', ' ', caption)
        
        fig_name = label.replace('fig:', '')
        figures[fig_name] = caption
    
    return figures


def find_reference_in_block(block: dict, fig_name: str) -> bool:
    """Check if a content block references a figure."""
    text = ""
    
    if block.get('type') == 'paragraph':
        text = block.get('text', '')
    elif block.get('type') == 'example':
        text = block.get('problem', '') + ' ' + block.get('solution', '')
    elif block.get('type') in ('definition', 'theorem', 'proof'):
        text = block.get('content', '')
    elif block.get('type') == 'list':
        text = ' '.join(block.get('items', []))
    
    if not text:
        return False
    
    # Check for various reference patterns
    patterns = [
        rf'\\cref\{{fig:{re.escape(fig_name)}\}}',
        rf'\\ref\{{fig:{re.escape(fig_name)}\}}',
        rf'[Ff]igure\s+\d+\.\d+',  # Generic "Figure X.Y"
        fig_name.replace('-', ' ').lower(),  # "mapping diagram" in text
    ]
    
    for pattern in patterns:
        if re.search(pattern, text, re.IGNORECASE):
            return True
    
    return False


def place_figures_in_section(book: str, chapter: int, section: int):
    """Place figures correctly based on content references."""
    
    # Find LaTeX and JSON paths
    book_dir = TEXTBOOKS_DIR / book
    chapter_dirs = sorted([d for d in book_dir.iterdir() if d.is_dir() and d.name.startswith('ch')])
    
    if chapter > len(chapter_dirs):
        return
    
    chapter_dir = chapter_dirs[chapter - 1]
    tex_files = sorted([f for f in chapter_dir.glob('sec*.tex')])
    
    if section > len(tex_files):
        return
    
    tex_path = tex_files[section - 1]
    json_path = CONTENT_DIR / book / f"ch{chapter:02d}" / f"sec{section:02d}.json"
    
    if not json_path.exists():
        return
    
    # Get captions from LaTeX
    captions = extract_figure_captions_from_latex(tex_path)
    
    # Load JSON
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    content = data.get('content', [])
    
    # Separate figures from other content
    figures = []
    other_content = []
    
    for block in content:
        if block.get('type') == 'figure':
            figures.append(block)
        else:
            other_content.append(block)
    
    if not figures:
        return
    
    print(f"  📄 Ch{chapter} Sec{section}: {len(figures)} figure(s)")
    
    # Update captions
    for fig in figures:
        fig_id = fig.get('id', '')
        # Extract name: fig-1.1-mapping-diagram -> mapping-diagram
        parts = fig_id.split('-')
        if len(parts) >= 3:
            fig_name = '-'.join(parts[2:])
        else:
            fig_name = parts[-1] if parts else ''
        
        if fig_name in captions and captions[fig_name]:
            fig['caption'] = captions[fig_name]
    
    # Build new content with figures placed at references
    new_content = []
    figures_to_place = figures.copy()
    
    for i, block in enumerate(other_content):
        # Check if this block references any unplaced figure
        for fig in figures_to_place[:]:  # Copy to allow removal during iteration
            fig_id = fig.get('id', '')
            parts = fig_id.split('-')
            fig_name = '-'.join(parts[2:]) if len(parts) >= 3 else parts[-1]
            
            if find_reference_in_block(block, fig_name):
                # Place figure BEFORE this block
                new_content.append(fig)
                figures_to_place.remove(fig)
                print(f"    ✓ {fig_id} placed before block {i} (references it)")
        
        new_content.append(block)
    
    # Any remaining figures go before exercises
    if figures_to_place:
        # Find exercises heading
        exercise_idx = len(new_content)
        for i, block in enumerate(new_content):
            if block.get('type') == 'heading' and 'exercise' in block.get('text', '').lower():
                exercise_idx = i
                break
        
        for fig in figures_to_place:
            new_content.insert(exercise_idx, fig)
            print(f"    ✓ {fig['id']} placed before exercises (no reference found)")
            exercise_idx += 1
    
    # Save
    data['content'] = new_content
    with open(json_path, 'w') as f:
        json.dump(data, f, indent=2)
    
    print(f"    📝 Updated {json_path.name}")


def process_book(book: str):
    """Process all sections."""
    print(f"📚 Smart figure placement: {book}")
    
    book_content_dir = CONTENT_DIR / book
    if not book_content_dir.exists():
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
            place_figures_in_section(book, ch_num, sec_num)


if __name__ == '__main__':
    import sys
    book = sys.argv[1] if len(sys.argv) > 1 else 'vol1'
    process_book(book)
