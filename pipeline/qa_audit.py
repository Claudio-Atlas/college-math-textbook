#!/usr/bin/env python3
"""Comprehensive QA audit for Axiom Reader precalculus JSON content.

Checks all known bug patterns from 4+ rounds of QA. Exit 0 = clean, exit 1 = issues found.
"""

import json, glob, os, re, sys
from collections import defaultdict

BASE = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(BASE, "content", "precalculus")
PUBLIC_DIR = os.path.join(BASE, "public")

issues = []

def issue(file, block_idx, category, severity, desc):
    issues.append({"file": file, "block": block_idx, "cat": category, "sev": severity, "desc": desc})

def strip_math(text):
    """Remove content inside $...$ and $$...$$ to check non-math text."""
    # Remove $$ blocks first, then $ blocks
    out = re.sub(r'\$\$.*?\$\$', ' MATH ', text, flags=re.DOTALL)
    out = re.sub(r'\$[^$]+?\$', ' MATH ', out)
    return out

def check_text(text, filepath, block_idx):
    """Run all text-level checks on a string."""
    if not text:
        return
    
    short = os.path.relpath(filepath, CONTENT_DIR)
    
    # 2. PLACEHOLDERS
    for pat, name in [
        (r'__ESCAPED_DOLLAR__', '__ESCAPED_DOLLAR__'),
        (r'__DOLLAR__', '__DOLLAR__'),
        (r'__MATH_BLOCK_\d+__', '__MATH_BLOCK_N__'),
        (r'__[A-Z][A-Z_]*__', 'placeholder __X__'),
    ]:
        if re.search(pat, text):
            issue(short, block_idx, "PLACEHOLDER", "ERROR", f"Found {name}: ...{re.search(pat, text).group()[:60]}...")

    # 4. MATH — mangled \\[Npt] → \\$$Npt]
    if re.search(r'\\\\\$\$\d+pt\]', text):
        issue(short, block_idx, "MATH", "ERROR", "Mangled \\\\[Npt] → \\\\$$Npt]")

    # 4. MATH — unmatched $$ (odd count)
    # Count $$ as a delimiter; should be even
    dd_count = len(re.findall(r'(?<!\$)\$\$(?!\$)', text))
    if dd_count % 2 != 0:
        issue(short, block_idx, "MATH", "ERROR", f"Odd count of $$ delimiters ({dd_count})")

    # 4. MATH — unmatched aligned
    aligned_open = text.count(r'\begin{aligned}')
    aligned_close = text.count(r'\end{aligned}')
    if aligned_open != aligned_close:
        issue(short, block_idx, "MATH", "ERROR", f"Unmatched aligned: {aligned_open} opens vs {aligned_close} closes")

    # Check non-math text
    nomath = strip_math(text)

    # 3. RAW LATEX outside math
    raw_checks = [
        (r'\\item\b', '\\item'),
        (r'\\end\{itemize\}', '\\end{itemize}'),
        (r'\\end\{enumerate\}', '\\end{enumerate}'),
        (r'\\begin\{itemize\}', '\\begin{itemize}'),
        (r'\\begin\{enumerate\}', '\\begin{enumerate}'),
        (r'\\hline\b', '\\hline'),
        (r'\\textbf\{', '\\textbf{'),
        (r'\\label\{', '\\label{'),
        (r'\\index\{', '\\index{'),
        (r'\\begin\{align', '\\begin{align...}'),
        (r'\\end\{align', '\\end{align...}'),
    ]
    for pat, name in raw_checks:
        if re.search(pat, nomath):
            issue(short, block_idx, "RAW_LATEX", "ERROR", f"Raw LaTeX outside math: {name}")

    # 3. Orphaned \begin{ or \end{ outside math (excluding known OK patterns)
    for pat, name in [(r'\\begin\{(?!aligned|cases|pmatrix|bmatrix|vmatrix|array|matrix|gathered)', 'orphaned \\begin{'),
                       (r'\\end\{(?!aligned|cases|pmatrix|bmatrix|vmatrix|array|matrix|gathered)', 'orphaned \\end{')]:
        if re.search(pat, nomath):
            m = re.search(pat, nomath)
            # get context
            start = max(0, m.start() - 10)
            end = min(len(nomath), m.end() + 30)
            issue(short, block_idx, "RAW_LATEX", "WARN", f"{name} outside math: ...{nomath[start:end]}...")

    # 4. Bare & outside math
    if re.search(r'(?<!\w)&(?!\w)', nomath) and '&amp;' not in nomath:
        # Only flag if it looks like a LaTeX alignment &
        if re.search(r'(?<!&)\s*&\s*(?!&)', nomath):
            # Be conservative — skip if it looks like & in normal text
            stripped = nomath.replace(' MATH ', '')
            if '&' in stripped and not re.search(r'\w&\w', stripped):
                issue(short, block_idx, "MATH", "WARN", "Bare & outside math delimiters")

    # 4. Literal \[ or \] outside math (should be $$)
    if re.search(r'(?<!\\)\\\[', nomath):
        issue(short, block_idx, "MATH", "ERROR", "Literal \\[ outside math (should be $$)")
    if re.search(r'(?<!\\)\\\]', nomath):
        issue(short, block_idx, "MATH", "ERROR", "Literal \\] outside math (should be $$)")

    # 4. Bare \\ outside math
    if re.search(r'\\\\', nomath):
        # Only flag if not part of \\$ or similar
        issue(short, block_idx, "MATH", "WARN", "Bare \\\\ outside math delimiters")

    # 5. CONTENT — truncated text ending with unclosed math
    stripped = text.rstrip()
    if stripped and stripped[-1] != '$' and not stripped.endswith('===') and not stripped.endswith('=='):
        # Check for text ending with = (possibly truncated equation) or \ (possibly stripped \%)
        if re.search(r'(?<![=!<>])=\s*$', stripped):
            # Ends with lone = (not ==, !=, <=, >=) — possible truncation
            issue(short, block_idx, "CONTENT", "WARN", "Text may be truncated (ends with =)")
        elif stripped.endswith('\\') and not stripped.endswith('\\\\'):
            # Ends with single \ — possible truncation (stripped \% or similar)
            issue(short, block_idx, "CONTENT", "WARN", "Text may be truncated (ends with \\)")

    # 6. ENCODING — null bytes
    if '\x00' in text:
        issue(short, block_idx, "ENCODING", "ERROR", "Null byte found")


def check_figure(block, filepath, block_idx):
    short = os.path.relpath(filepath, CONTENT_DIR)
    src = block.get("src", "")
    
    if not src:
        # Empty src — only OK for table-figures
        if block.get("id", "").startswith("tab:") or "table" in block.get("caption", "").lower():
            return
        issue(short, block_idx, "FIGURE", "WARN", "Empty figure src (not a table-figure)")
        return
    
    # Check file exists
    full_path = os.path.join(PUBLIC_DIR, src.lstrip("/"))
    if not os.path.exists(full_path):
        issue(short, block_idx, "FIGURE", "ERROR", f"Missing figure file: {src}")
    
    # Check for hash-garbage names (fig-NNNNN.svg with 5+ random digits)
    basename = os.path.basename(src)
    if re.match(r'fig-\d{5,}\.svg$', basename):
        issue(short, block_idx, "FIGURE", "WARN", f"Possible hash-garbage figure name: {basename}")


def audit_file(filepath):
    with open(filepath, 'r') as f:
        raw = f.read()
    
    # Encoding check on raw content
    short = os.path.relpath(filepath, CONTENT_DIR)
    if '\x00' in raw:
        issue(short, -1, "ENCODING", "ERROR", "Null bytes in file")
    
    data = json.loads(raw)
    
    for i, block in enumerate(data.get("content", [])):
        btype = block.get("type", "")
        
        if btype == "figure":
            check_figure(block, filepath, i)
            # Also check caption text
            check_text(block.get("caption", ""), filepath, i)
        
        # Check all text fields
        for field in ["text", "title", "caption", "statement", "proof"]:
            if field in block and isinstance(block[field], str):
                check_text(block[field], filepath, i)
        
        # Check list items
        if "items" in block and isinstance(block["items"], list):
            for item in block["items"]:
                if isinstance(item, str):
                    check_text(item, filepath, i)
                elif isinstance(item, dict):
                    for v in item.values():
                        if isinstance(v, str):
                            check_text(v, filepath, i)
        
        # Check example/exercise fields
        if btype in ("example", "exercise"):
            for field in ["problem", "solution", "answer"]:
                val = block.get(field, "")
                if isinstance(val, str):
                    check_text(val, filepath, i)
                elif isinstance(val, list):
                    for item in val:
                        if isinstance(item, str):
                            check_text(item, filepath, i)
                        elif isinstance(item, dict):
                            for v in item.values():
                                if isinstance(v, str):
                                    check_text(v, filepath, i)
            
            # 5. Empty example problem
            if btype == "example" and not block.get("problem"):
                issue(short, i, "CONTENT", "WARN", "Empty example problem field")
        
        # Check steps
        if "steps" in block and isinstance(block["steps"], list):
            for step in block["steps"]:
                if isinstance(step, str):
                    check_text(step, filepath, i)
                elif isinstance(step, dict):
                    for v in step.values():
                        if isinstance(v, str):
                            check_text(v, filepath, i)


def main():
    json_files = sorted(glob.glob(os.path.join(CONTENT_DIR, "ch*/sec*.json")))
    
    if not json_files:
        print("ERROR: No JSON files found!")
        sys.exit(1)
    
    print(f"Auditing {len(json_files)} files...")
    
    for f in json_files:
        audit_file(f)
    
    # Summary
    cats = defaultdict(int)
    sevs = defaultdict(int)
    for iss in issues:
        cats[iss["cat"]] += 1
        sevs[iss["sev"]] += 1
    
    if issues:
        print(f"\n{'='*80}")
        print(f"ISSUES FOUND: {len(issues)}")
        print(f"{'='*80}")
        
        # Group by file
        by_file = defaultdict(list)
        for iss in issues:
            by_file[iss["file"]].append(iss)
        
        for fname in sorted(by_file):
            print(f"\n--- {fname} ---")
            for iss in by_file[fname]:
                print(f"  [{iss['sev']}] block {iss['block']:3d} | {iss['cat']:12s} | {iss['desc']}")
        
        print(f"\n{'='*80}")
        print("By category:")
        for cat, count in sorted(cats.items()):
            print(f"  {cat}: {count}")
        print("By severity:")
        for sev, count in sorted(sevs.items()):
            print(f"  {sev}: {count}")
        print(f"TOTAL: {len(issues)}")
        sys.exit(1)
    else:
        print("\n✅ ALL CLEAN — zero issues found!")
        sys.exit(0)


if __name__ == "__main__":
    main()
