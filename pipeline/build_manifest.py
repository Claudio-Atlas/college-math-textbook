#!/usr/bin/env python3
"""Build figure manifest by matching SVGs to LaTeX labels."""
import os, json, re, glob

svg_dir = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))), "public", "figures", "precalculus")
tex_dir = os.path.expanduser("~/Desktop/Atlas-Textbooks/source/precalculus")

# Scan SVGs
svgs = {}
for path in sorted(glob.glob(os.path.join(svg_dir, "**", "*.svg"), recursive=True)):
    rel = os.path.relpath(path, svg_dir)
    ch = rel.split("/")[0]
    svgs.setdefault(ch, []).append(rel)

# Scan LaTeX for \label{fig:...}
labels_by_chapter = {}
for ch_dir in sorted(glob.glob(os.path.join(tex_dir, "ch*"))):
    ch_name = os.path.basename(ch_dir)
    m = re.search(r"ch(\d+)", ch_name)
    if not m:
        continue
    ch_key = "ch" + m.group(1).zfill(2)
    labels = []
    for tex_file in sorted(glob.glob(os.path.join(ch_dir, "*.tex"))):
        with open(tex_file) as f:
            content = f.read()
        for m2 in re.finditer(r"\\label\{(fig:[^}]+)\}", content):
            labels.append(m2.group(1))
    labels_by_chapter[ch_key] = labels

# Match
manifest = {"precalculus": {}}
for ch_key in sorted(labels_by_chapter.keys()):
    labels = labels_by_chapter[ch_key]
    ch_svgs = svgs.get(ch_key, [])
    matched_svgs = set()
    
    for label in labels:
        svg_name = label.replace(":", "-") + ".svg"
        svg_path = ch_key + "/" + svg_name
        if svg_path in ch_svgs:
            manifest["precalculus"][label] = svg_path
            matched_svgs.add(svg_path)
    
    unmatched_labels = [l for l in labels if l not in manifest["precalculus"]]
    unmatched_svgs = sorted([s for s in ch_svgs if s not in matched_svgs])
    
    if unmatched_labels:
        # Try positional matching for numbered SVGs
        positional = [s for s in unmatched_svgs if re.search(r"fig-\d+\.\d+-(?:fig|inline)-\d+\.svg", s)]
        subfig = [s for s in unmatched_svgs if "subfig" in s]
        remaining = [s for s in unmatched_svgs if s not in positional and s not in subfig]
        
        print(f"{ch_key}: {len(unmatched_labels)} unmatched labels: {unmatched_labels}")
        if unmatched_svgs:
            print(f"  Available unmatched SVGs: {unmatched_svgs}")

total = len(manifest["precalculus"])
print(f"\nTotal matched: {total}")
total_labels = sum(len(v) for v in labels_by_chapter.values())
print(f"Total labels: {total_labels}")
total_svgs = sum(len(v) for v in svgs.values())
print(f"Total SVGs: {total_svgs}")

# Write manifest
out_path = os.path.join(os.path.dirname(os.path.abspath(__file__)), "figure_manifest.json")
with open(out_path, "w") as f:
    json.dump(manifest, f, indent=2)
print(f"\nWrote: {out_path}")
