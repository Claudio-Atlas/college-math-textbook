#!/usr/bin/env python3
"""
Add figure blocks to JSON based on existing SVGs.
Simple approach: find SVGs, add them to corresponding JSON sections.
"""

import json
from pathlib import Path

CONTENT_DIR = Path.home() / "Desktop" / "axiom-reader" / "content"
FIGURES_DIR = Path.home() / "Desktop" / "axiom-reader" / "public" / "figures"


def add_figures_to_section(book: str, chapter: int, section: int):
    """Add figure blocks for any SVGs that exist for this section."""
    
    # Find SVGs for this section
    svg_dir = FIGURES_DIR / book / f"ch{chapter:02d}"
    svg_pattern = f"sec{section:02d}-*.svg"
    svgs = sorted(svg_dir.glob(svg_pattern))
    
    if not svgs:
        return 0
    
    # Load JSON
    json_path = CONTENT_DIR / book / f"ch{chapter:02d}" / f"sec{section:02d}.json"
    if not json_path.exists():
        print(f"  ❌ JSON not found: {json_path}")
        return 0
    
    with open(json_path, 'r') as f:
        data = json.load(f)
    
    content = data.get('content', [])
    
    # Get existing figure IDs
    existing_ids = {item.get('id') for item in content if item.get('type') == 'figure'}
    
    # Add figures
    added = 0
    for svg_path in svgs:
        # Extract figure name: sec01-mapping-diagram.svg -> mapping-diagram
        fig_name = svg_path.stem.split('-', 1)[1] if '-' in svg_path.stem else svg_path.stem
        # Include section in ID to avoid duplicates across sections
        fig_id = f"fig-{chapter}.{section}-{fig_name}"
        
        if fig_id in existing_ids:
            # Update src if figure exists
            for item in content:
                if item.get('id') == fig_id and item.get('type') == 'figure':
                    item['src'] = f"/figures/{book}/ch{chapter:02d}/{svg_path.name}"
            continue
        
        # Create new figure block
        figure_block = {
            "type": "figure",
            "id": fig_id,
            "src": f"/figures/{book}/ch{chapter:02d}/{svg_path.name}",
            "caption": "",
            "alt": f"Figure: {fig_name.replace('-', ' ').title()}"
        }
        
        # Find insertion point - before exercises heading if it exists
        insert_idx = len(content)
        for i, item in enumerate(content):
            if item.get('type') == 'heading' and 'exercise' in item.get('text', '').lower():
                insert_idx = i
                break
            if item.get('type') == 'exercise':
                insert_idx = i
                break
        
        content.insert(insert_idx, figure_block)
        added += 1
        print(f"    + {fig_id}")
    
    if added > 0:
        data['content'] = content
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=2)
    
    return added


def process_book(book: str):
    """Process all chapters/sections in a book."""
    print(f"📚 Adding figures to: {book}")
    
    book_content_dir = CONTENT_DIR / book
    if not book_content_dir.exists():
        print(f"❌ Content dir not found: {book_content_dir}")
        return
    
    total_added = 0
    
    for chapter_dir in sorted(book_content_dir.iterdir()):
        if not chapter_dir.is_dir() or not chapter_dir.name.startswith('ch'):
            continue
        
        ch_num = int(chapter_dir.name.replace('ch', ''))
        print(f"  📖 Chapter {ch_num}")
        
        for json_file in sorted(chapter_dir.glob('sec*.json')):
            # Skip files like sec01-manual.json
            stem = json_file.stem
            if '-' in stem:
                continue
            try:
                sec_num = int(stem.replace('sec', ''))
            except ValueError:
                continue
            added = add_figures_to_section(book, ch_num, sec_num)
            if added:
                total_added += added
    
    print(f"\n✅ Added {total_added} figure blocks")


if __name__ == '__main__':
    import sys
    book = sys.argv[1] if len(sys.argv) > 1 else 'vol1'
    process_book(book)
