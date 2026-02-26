#!/usr/bin/env python3
"""Fix all ~48 QA issues in Axiom Reader precalculus JSON content."""

import json, os, re, glob

BASE = os.path.dirname(os.path.abspath(__file__))
CONTENT = os.path.join(BASE, 'content', 'precalculus')
PUBLIC = os.path.join(BASE, 'public')

def load(path):
    with open(os.path.join(CONTENT, path)) as f:
        return json.load(f)

def save(path, data):
    with open(os.path.join(CONTENT, path), 'w') as f:
        json.dump(data, f, indent=2, ensure_ascii=False)
    print(f"  Saved {path}")

def fix_all_strings(obj, fn):
    """Recursively apply fn to all string values in obj."""
    if isinstance(obj, str):
        return fn(obj)
    elif isinstance(obj, list):
        return [fix_all_strings(item, fn) for item in obj]
    elif isinstance(obj, dict):
        return {k: fix_all_strings(v, fn) for k, v in obj.items()}
    return obj

fixes = 0

# === Category 1: Fix ch01 figure paths missing ch01/ ===
print("=== Category 1: ch01 figure paths ===")
ch01_figs = [
    'fig-domain-range-graph', 'fig-parabola-x2-4', 'fig-vertical-line-test',
    'fig-read-graph', 'fig-inc-dec', 'fig-vertical-shifts', 'fig-horizontal-shifts',
    'fig-reflections', 'fig-vertical-scaling', 'fig-horizontal-scaling'
]
for sec_file in ['ch01/sec02.json', 'ch01/sec03.json', 'ch01/sec04.json']:
    d = load(sec_file)
    text = json.dumps(d)
    changed = False
    for fig in ch01_figs:
        bad = f'/figures/precalculus/{fig}.svg'
        good = f'/figures/precalculus/ch01/{fig}.svg'
        if bad in text:
            text = text.replace(bad, good)
            changed = True
            fixes += 1
            print(f"  Fixed {fig} in {sec_file}")
    if changed:
        d = json.loads(text)
        save(sec_file, d)

# === Category 2: \[ \] → $$ $$ ===
print("\n=== Category 2: display math delimiters ===")
for sec_file in glob.glob('ch*/sec*.json'):
    fpath = os.path.join(CONTENT, sec_file)
    if not os.path.exists(fpath):
        continue
    with open(fpath) as f:
        text = f.read()
    if '\\[' not in text and '\\]' not in text:
        continue
    # Replace \[ and \] that are display math delimiters (not inside $...$)
    new_text = text.replace('\\\\[', '$$').replace('\\\\]', '$$')
    # Actually in JSON, \[ is stored as \\[ (two chars in JSON string)
    # Let me check what the actual JSON contains
    pass

# Let me be more careful - load and check actual string values
for sec_file_pattern in ['ch01/sec01.json', 'ch03/sec01.json', 'ch05/sec02.json', 'ch05/sec03.json']:
    fpath = os.path.join(CONTENT, sec_file_pattern)
    if not os.path.exists(fpath):
        print(f"  SKIP {sec_file_pattern} (not found)")
        continue
    d = load(sec_file_pattern)
    def fix_display_math(s):
        global fixes
        if '\\[' in s or '\\]' in s:
            new_s = s.replace('\\[', '$$').replace('\\]', '$$')
            if new_s != s:
                fixes += 1
            return new_s
        return s
    d2 = fix_all_strings(d, fix_display_math)
    if json.dumps(d2) != json.dumps(d):
        save(sec_file_pattern, d2)
        print(f"  Fixed display math in {sec_file_pattern}")

# === Category 3: Raw \hline ===
print("\n=== Category 3: raw \\hline ===")
for sec_file in ['ch02/sec03.json', 'ch02/sec04.json']:
    d = load(sec_file)
    def strip_hline(s):
        global fixes
        if '\\hline' in s:
            new_s = s.replace('\\hline', '')
            if new_s != s:
                fixes += 1
            return new_s
        return s
    d2 = fix_all_strings(d, strip_hline)
    if json.dumps(d2) != json.dumps(d):
        save(sec_file, d2)
        print(f"  Stripped \\hline from {sec_file}")

# === Category 4: Garbled math blocks ===
print("\n=== Category 4: garbled math blocks ===")

# ch01/sec06 block 11 - rebuild from source
d = load('ch01/sec06.json')
d['content'][11] = {
    "type": "warning",
    "id": "warning-1.6",
    "number": None,
    "title": "Notation Confusion: $f^{-1}$ vs $\\frac{1}{f}$",
    "content": "$f^{-1}(x)$ means the inverse function, NOT $\\frac{1}{f(x)}$.\nFor example, $\\sin^{-1}(x) \\neq \\frac{1}{\\sin x}$ (that's $\\csc x$)."
}
save('ch01/sec06.json', d)
fixes += 1
print("  Rebuilt ch01/sec06 block 11")

# ch02/sec01 block 26 - fix garbled math
d = load('ch02/sec01.json')
d['content'][26] = {
    "type": "paragraph",
    "text": "The $x$-coordinate of the vertex is $-\\frac{b}{2a}$. To find the $y$-coordinate, substitute this value into the function. This is often easier than computing $c - \\frac{b^2}{4a}$."
}
save('ch02/sec01.json', d)
fixes += 1
print("  Fixed ch02/sec01 block 26")

# === Category 5: Raw \label{} and \index{} ===
print("\n=== Category 5: raw \\label and \\index ===")
# ch01/sec06 block 11 already fixed above
for sec_file in ['ch04/sec01.json', 'ch05/sec02.json']:
    d = load(sec_file)
    def strip_labels(s):
        global fixes
        new_s = re.sub(r'\\label\{[^}]*\}', '', s)
        new_s = re.sub(r'\\index\{[^}]*\}', '', new_s)
        if new_s != s:
            fixes += 1
        return new_s
    d2 = fix_all_strings(d, strip_labels)
    if json.dumps(d2) != json.dumps(d):
        save(sec_file, d2)
        print(f"  Stripped labels from {sec_file}")

# Also do a global pass for any remaining \label or \index
print("  Global pass for remaining \\label/\\index...")
for fpath in sorted(glob.glob(os.path.join(CONTENT, 'ch*/sec*.json'))):
    rel = os.path.relpath(fpath, CONTENT)
    with open(fpath) as f:
        text = f.read()
    if '\\label{' in text or '\\index{' in text:
        d = json.loads(text)
        d2 = fix_all_strings(d, strip_labels)
        if json.dumps(d2) != json.dumps(d):
            save(rel, d2)
            print(f"    Found and stripped in {rel}")

# === Category 6: Ch08 hash figure names ===
print("\n=== Category 6: ch08 figure remapping ===")
svg_dir = os.path.join(PUBLIC, 'figures', 'precalculus', 'ch08')
sections = {'ch08/sec01': '8.1', 'ch08/sec02': '8.2', 'ch08/sec03': '8.3', 'ch08/sec04': '8.4'}
for sec_path, sec_num in sections.items():
    fpath = f'{sec_path}.json'
    full = os.path.join(CONTENT, fpath)
    if not os.path.exists(full):
        continue
    d = load(fpath)
    
    def find_unresolved_figures(content, indices=None):
        if indices is None:
            indices = []
        for i, block in enumerate(content):
            if isinstance(block, dict):
                if block.get('type') == 'figure' and block.get('src'):
                    src = block['src']
                    if not os.path.exists(os.path.join(PUBLIC, src.lstrip('/'))):
                        indices.append((content, i))
                # Check nested figures
                for key in ['figures', 'content']:
                    if isinstance(block.get(key), list):
                        find_unresolved_figures(block[key], indices)
        return indices
    
    unresolved = find_unresolved_figures(d.get('content', []))
    if not unresolved:
        continue
    
    if os.path.exists(svg_dir):
        fig_svgs = sorted(
            [s for s in os.listdir(svg_dir) if re.match(rf'fig-{re.escape(sec_num)}-fig-\d+\.svg$', s)],
            key=lambda s: int(re.search(r'fig-(\d+)\.svg$', s).group(1))
        )
        for idx, (parent_list, block_i) in enumerate(unresolved):
            if idx < len(fig_svgs):
                old_src = parent_list[block_i]['src']
                parent_list[block_i]['src'] = f'/figures/precalculus/ch08/{fig_svgs[idx]}'
                fixes += 1
                print(f"  Remapped {old_src} → {fig_svgs[idx]}")
        save(fpath, d)

# === Category 7: ch06/sec02 corrupted block ===
print("\n=== Category 7: ch06/sec02 block 24 ===")
d = load('ch06/sec02.json')
d['content'][24] = {
    "type": "paragraph",
    "text": "You may also see $\\dfrac{\\sqrt{2}}{2}$ written as $\\dfrac{1}{\\sqrt{2}}$. These are equal\u2014the first is the rationalized form."
}
save('ch06/sec02.json', d)
fixes += 1
print("  Fixed ch06/sec02 block 24")

# === Category 8: ch11/sec01 cosmetic ===
print("\n=== Category 8: ch11/sec01 block 37 ===")
d = load('ch11/sec01.json')
b = d['content'][37]
if b.get('problem', '').endswith('\nsolution'):
    b['problem'] = b['problem'][:-len('\nsolution')]
    fixes += 1
    print("  Trimmed 'solution' from problem text")
elif 'solution' in b.get('problem', '')[-20:]:
    b['problem'] = re.sub(r'\s*solution\s*$', '', b['problem'])
    fixes += 1
    print("  Trimmed 'solution' from problem text")
save('ch11/sec01.json', d)

print(f"\n=== Total fixes applied: {fixes} ===")
