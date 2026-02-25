#!/usr/bin/env python3
"""Update figure src paths in JSON content files to point to generated SVGs."""

import json
import os
from pathlib import Path

CONTENT_DIR = Path.home() / "Desktop/Axiom-Reader/content/precalculus"
FIGURES_DIR = Path.home() / "Desktop/Axiom-Reader/public/figures/precalculus"

def get_available_svgs():
    """Build a map of figure-id -> relative web path for all generated SVGs."""
    svgs = {}
    for svg_file in FIGURES_DIR.rglob("*.svg"):
        # e.g. ch01/fig-function-machine.svg
        rel = svg_file.relative_to(FIGURES_DIR.parent)  # figures/precalculus/ch01/fig-x.svg
        name = svg_file.stem  # fig-function-machine
        ch_dir = svg_file.parent.name  # ch01
        web_path = f"/figures/precalculus/{ch_dir}/{svg_file.name}"
        
        # Map by fig id (fig:function-machine -> fig-function-machine)
        svgs[name] = web_path
    return svgs

def update_json_files():
    svgs = get_available_svgs()
    updated = 0
    matched = 0
    unmatched = []
    
    for json_file in sorted(CONTENT_DIR.rglob("*.json")):
        with open(json_file) as f:
            data = json.load(f)
        
        modified = False
        blocks = data.get('blocks', data.get('content', []))
        
        for block in blocks:
            if block.get('type') != 'figure':
                continue
            
            fig_id = block.get('id', '')  # e.g. "fig:function-machine"
            # Convert fig:name to fig-name
            fig_key = fig_id.replace(':', '-') if fig_id else None
            
            if fig_key and fig_key in svgs:
                new_src = svgs[fig_key]
                if block.get('src') != new_src:
                    block['src'] = new_src
                    modified = True
                matched += 1
            else:
                unmatched.append((json_file.name, fig_id, block.get('src', '')))
        
        if modified:
            with open(json_file, 'w') as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write('\n')
            updated += 1
    
    print(f"Updated {updated} JSON files, {matched} figures matched")
    if unmatched:
        print(f"\n{len(unmatched)} figures unmatched:")
        for fname, fid, src in unmatched:
            print(f"  {fname}: {fid} (current: {src})")

if __name__ == "__main__":
    update_json_files()
