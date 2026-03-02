#!/usr/bin/env python3
"""
Parity check between LaTeX source and JSON web viewer content.
Usage: python3 parity_check.py [--book precalculus]
"""

import argparse
import json
import os
import re
from collections import Counter
from pathlib import Path
from difflib import SequenceMatcher

# Config
LATEX_BASE = Path.home() / "Desktop/Atlas-Textbooks/source"
JSON_BASE = Path.home() / "Desktop/Axiom-Reader/content"
OUTPUT_PATH = Path.home() / ".openclaw/workspace/memory/projects/axiom-reader-parity-report.md"

# LaTeX environments to count → JSON type mapping
ENV_MAP = {
    'atlasdefinition': 'definition',
    'atlastheorem': 'theorem',
    'atlasexample': 'example',
    'atlasremark': 'remark',
    'atlaswarning': 'warning',
    'atlasstrategy': 'strategy',
    'atlasalgorithm': 'algorithm',
    'atlassummary': 'summary',
    'atlasmethod': 'method',
    'atlascorollary': 'corollary',
    'atlaslemma': 'lemma',
    'figure': 'figure',
}

# Exercise commands to count
EXERCISE_PATTERNS = [
    r'\\begin\{exercise\}',
    r'\\exercisedrill\b',
    r'\\exerciseconceptual\b',
    r'\\exerciseapplication\b',
    r'\\exercisechallenge\b',
    r'\\exerciseerror\b',
    r'\\exercisevocab\b',
]


def find_chapter_dirs(latex_path):
    """Map ch01 → ch01-functions-graphs etc."""
    mapping = {}
    for d in sorted(latex_path.iterdir()):
        if d.is_dir() and d.name.startswith('ch'):
            m = re.match(r'(ch\d+)', d.name)
            if m:
                mapping[m.group(1)] = d
    return mapping


def find_sections(chapter_dir):
    """Find sec*.tex files in a chapter dir."""
    sections = {}
    for f in sorted(chapter_dir.glob('sec*.tex')):
        m = re.match(r'sec(\d+)', f.name)
        if m:
            sec_key = f'sec{m.group(1)}'
            sections[sec_key] = f
    return sections


def count_latex_envs(tex_content):
    """Count environments and exercises in LaTeX source."""
    counts = {}
    for env, json_type in ENV_MAP.items():
        pattern = rf'\\begin\{{{env}\}}'
        counts[json_type] = len(re.findall(pattern, tex_content))
    
    # Count exercises
    ex_count = 0
    for pat in EXERCISE_PATTERNS:
        ex_count += len(re.findall(pat, tex_content))
    counts['exercise'] = ex_count
    return counts


def count_json_blocks(json_data):
    """Count block types in JSON content."""
    if 'content' not in json_data:
        return {}
    return dict(Counter(b['type'] for b in json_data['content']))


def extract_latex_titles(tex_content):
    """Extract titles from LaTeX environments. Handles both {Title} and [Title] forms."""
    titles = {}
    # {Title} form: \begin{atlasdefinition}{Title}
    for m in re.finditer(r'\\begin\{(atlas\w+)\}\{([^}]+)\}', tex_content):
        env, title = m.group(1), m.group(2)
        json_type = ENV_MAP.get(env, env)
        titles.setdefault(json_type, []).append(title.strip())
    # [Title] form: \begin{atlasexample}[Title]
    for m in re.finditer(r'\\begin\{(atlas\w+)\}\[([^\]]+)\]', tex_content):
        env, title = m.group(1), m.group(2)
        json_type = ENV_MAP.get(env, env)
        titles.setdefault(json_type, []).append(title.strip())
    return titles


def extract_json_titles(json_data):
    """Extract titles from JSON blocks."""
    titles = {}
    for b in json_data.get('content', []):
        if 'title' in b and b['title']:
            titles.setdefault(b['type'], []).append(b['title'].strip())
    return titles


def count_latex_exercises_max(tex_content):
    """Find the highest exercise number in LaTeX."""
    # Look for patterns like exercise numbering in \begin{exercise} blocks
    # Count total exercise starts
    total = 0
    for pat in EXERCISE_PATTERNS:
        total += len(re.findall(pat, tex_content))
    return total


def count_json_exercises(json_data):
    """Count exercises and find max number in JSON."""
    exercises = [b for b in json_data.get('content', []) if b['type'] == 'exercise']
    count = len(exercises)
    max_num = 0
    for ex in exercises:
        if 'number' in ex:
            try:
                n = int(ex['number'])
                max_num = max(max_num, n)
            except (ValueError, TypeError):
                pass
    return count, max_num


def fuzzy_match_titles(latex_titles, json_titles):
    """Find missing/extra titles between LaTeX and JSON."""
    missing_in_json = []
    extra_in_json = list(json_titles)
    
    for lt in latex_titles:
        best_ratio = 0
        best_idx = -1
        lt_clean = re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', lt)
        lt_clean = re.sub(r'[\\${}]', '', lt_clean).strip().lower()
        for i, jt in enumerate(extra_in_json):
            jt_clean = re.sub(r'\*\*([^*]*)\*\*', r'\1', jt).strip().lower()
            ratio = SequenceMatcher(None, lt_clean, jt_clean).ratio()
            if ratio > best_ratio:
                best_ratio = ratio
                best_idx = i
        if best_ratio > 0.5 and best_idx >= 0:
            extra_in_json.pop(best_idx)
        else:
            missing_in_json.append(lt)
    
    return missing_in_json, extra_in_json


def check_section(tex_path, json_path, ch_key, sec_key):
    """Run all parity checks for a single section."""
    tex_content = tex_path.read_text(encoding='utf-8')
    json_data = json.loads(json_path.read_text(encoding='utf-8'))
    
    result = {
        'key': f'{ch_key}/{sec_key}',
        'title': json_data.get('title', ''),
        'structural': {},
        'missing_in_json': [],
        'extra_in_json': [],
        'exercise_latex': 0,
        'exercise_json': 0,
        'exercise_max_json': 0,
        'has_mismatch': False,
    }
    
    # Level 1: Structural
    latex_counts = count_latex_envs(tex_content)
    json_counts = count_json_blocks(json_data)
    
    all_types = sorted(set(list(latex_counts.keys()) + [t for t in json_counts if t in ENV_MAP.values() or t == 'exercise']))
    # Only compare mapped types
    compare_types = [t for t in ['definition', 'theorem', 'example', 'remark', 'warning', 
                                  'strategy', 'algorithm', 'summary', 'method', 'corollary', 
                                  'lemma', 'figure', 'exercise'] if latex_counts.get(t, 0) > 0 or json_counts.get(t, 0) > 0]
    
    for t in compare_types:
        lc = latex_counts.get(t, 0)
        jc = json_counts.get(t, 0)
        match = lc == jc
        result['structural'][t] = (lc, jc, match)
        if not match:
            result['has_mismatch'] = True
    
    # Level 2: Title comparison
    latex_titles = extract_latex_titles(tex_content)
    json_titles = extract_json_titles(json_data)
    
    for block_type in ['definition', 'theorem', 'example', 'warning', 'strategy', 'summary', 'remark', 'corollary', 'lemma', 'method']:
        lt = latex_titles.get(block_type, [])
        jt = json_titles.get(block_type, [])
        if lt or jt:
            missing, extra = fuzzy_match_titles(lt, jt)
            for m in missing:
                result['missing_in_json'].append(f'{block_type.title()} "{m}"')
                result['has_mismatch'] = True
            for e in extra:
                result['extra_in_json'].append(f'{block_type.title()} "{e}"')
                result['has_mismatch'] = True
    
    # Level 3: Exercise deep check
    result['exercise_latex'] = latex_counts.get('exercise', 0)
    ex_count, ex_max = count_json_exercises(json_data)
    result['exercise_json'] = ex_count
    result['exercise_max_json'] = ex_max
    
    return result


def generate_report(results, book):
    """Generate markdown report."""
    total = len(results)
    structural_mismatches = sum(1 for r in results if r['has_mismatch'])
    title_mismatches = sum(1 for r in results if r['missing_in_json'] or r['extra_in_json'])
    exercise_mismatches = sum(1 for r in results if r['exercise_latex'] != r['exercise_json'])
    
    lines = [
        f'# Axiom Reader Parity Report: {book.title()}',
        f'',
        f'## Overall Summary',
        f'- Sections checked: {total}',
        f'- Structural mismatches: {structural_mismatches} sections',
        f'- Title mismatches: {title_mismatches} sections',
        f'- Exercise count mismatches: {exercise_mismatches} sections',
        f'',
        f'## Section-by-Section Details',
        f'',
    ]
    
    clean_sections = []
    
    for r in results:
        if not r['has_mismatch']:
            clean_sections.append(f"- ✅ **{r['key']}** — {r['title']}")
            continue
        
        lines.append(f"### {r['key']} — {r['title']}")
        lines.append('')
        lines.append('| Block Type | LaTeX | JSON | Match? |')
        lines.append('|-----------|-------|------|--------|')
        
        for t, (lc, jc, match) in r['structural'].items():
            icon = '✅' if match else f'❌ {jc-lc:+d}'
            lines.append(f'| {t} | {lc} | {jc} | {icon} |')
        
        lines.append('')
        
        if r['missing_in_json']:
            lines.append(f"**Missing in JSON:** {', '.join(r['missing_in_json'])}")
        if r['extra_in_json']:
            lines.append(f"**Extra in JSON:** {', '.join(r['extra_in_json'])}")
        if not r['missing_in_json'] and not r['extra_in_json']:
            lines.append('**Titles:** All matched')
        
        if r['exercise_max_json'] > 0:
            lines.append(f"**Exercise max number in JSON:** {r['exercise_max_json']}")
        
        lines.append('')
    
    if clean_sections:
        lines.append('### Clean Sections (No Mismatches)')
        lines.append('')
        lines.extend(clean_sections)
        lines.append('')
    
    return '\n'.join(lines)


def main():
    parser = argparse.ArgumentParser(description='Parity check: LaTeX vs JSON')
    parser.add_argument('--book', default='precalculus', help='Book name')
    args = parser.parse_args()
    
    latex_path = LATEX_BASE / args.book
    json_path = JSON_BASE / args.book
    
    if not latex_path.exists():
        print(f"LaTeX path not found: {latex_path}")
        return
    if not json_path.exists():
        print(f"JSON path not found: {json_path}")
        return
    
    chapter_map = find_chapter_dirs(latex_path)
    results = []
    
    for ch_key in sorted(chapter_map.keys()):
        ch_dir = chapter_map[ch_key]
        json_ch_dir = json_path / ch_key
        
        if not json_ch_dir.exists():
            print(f"⚠️  JSON chapter dir missing: {json_ch_dir}")
            continue
        
        sections = find_sections(ch_dir)
        for sec_key in sorted(sections.keys()):
            tex_file = sections[sec_key]
            json_file = json_ch_dir / f'{sec_key}.json'
            
            if not json_file.exists():
                print(f"⚠️  JSON file missing: {json_file}")
                results.append({
                    'key': f'{ch_key}/{sec_key}',
                    'title': '⚠️ MISSING JSON FILE',
                    'structural': {},
                    'missing_in_json': ['ENTIRE SECTION'],
                    'extra_in_json': [],
                    'exercise_latex': 0, 'exercise_json': 0,
                    'exercise_max_json': 0, 'has_mismatch': True,
                })
                continue
            
            r = check_section(tex_file, json_file, ch_key, sec_key)
            results.append(r)
            status = '✅' if not r['has_mismatch'] else '❌'
            print(f"  {status} {r['key']} — {r['title']}")
    
    report = generate_report(results, args.book)
    OUTPUT_PATH.parent.mkdir(parents=True, exist_ok=True)
    OUTPUT_PATH.write_text(report, encoding='utf-8')
    print(f"\nReport written to: {OUTPUT_PATH}")


if __name__ == '__main__':
    main()
