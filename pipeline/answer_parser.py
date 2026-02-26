#!/usr/bin/env python3
"""
Answer Parser for Axiom Reader
Extracts odd-numbered exercise answers from LaTeX backmatter files
and injects them into JSON content files.

Handles three answer file formats:
1. Sequential numbering: \\textbf{1.} \\textbf{3.} ... (most chapters)
2. Exercise headers: \\textbf{Exercise N} with sub-answers (ch10)
3. Category-based with restarts: categories like "Vocabulary", "Finding Domain"
   each with \\textbf{1.} \\textbf{3.} (ch3)

Usage:
    python answer_parser.py [--dry-run] [--verbose]
"""

import re
import json
import glob
import os
import sys
import argparse

# --- Configuration ---
BASE_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
CONTENT_DIR = os.path.join(BASE_DIR, "content", "precalculus")

DEFAULT_ANSWER_SOURCES = {
    "main": os.path.expanduser(
        "~/Desktop/Atlas-Textbooks/source/precalculus/backmatter/answers.tex"
    ),
    "ch07": os.path.expanduser(
        "~/Desktop/Atlas-Textbooks/source/precalculus/backmatter/answers-ch07.tex"
    ),
    "ch08": os.path.expanduser(
        "~/Desktop/Atlas-Textbooks/source/precalculus/backmatter/answers-ch08.tex"
    ),
    "ch09": os.path.expanduser(
        "~/Desktop/Atlas-Textbooks/source/precalculus/backmatter/answers-ch09.tex"
    ),
    "ch10": os.path.expanduser(
        "~/Desktop/Atlas-Textbooks/source/precalculus/backmatter/answers-ch10.tex"
    ),
    "ch11": os.path.expanduser(
        "~/Desktop/Atlas-Textbooks/source/precalculus/backmatter/answers-ch11.tex"
    ),
}


def clean_answer(text: str) -> str:
    """Clean LaTeX markup from answer text, preserving math delimiters."""
    s = text.strip()
    s = re.sub(r"\\noindent\s*", "", s)
    s = re.sub(r"\\medskip\s*", "", s)
    s = re.sub(r"\\bigskip\s*", "", s)
    s = re.sub(r"\\smallskip\s*", "", s)
    s = re.sub(r"\\quad\s*", " ", s)
    s = re.sub(r"\\qquad\s*", "  ", s)
    s = re.sub(r"\\hfill\s*", " ", s)
    s = re.sub(r"\\newline\s*", "\n", s)
    s = re.sub(r"\\\\\s*", "\n", s)
    s = re.sub(r"\\vspace\{[^}]*\}", "", s)
    s = re.sub(r"\\hspace\{[^}]*\}", " ", s)
    s = re.sub(r"\\phantom\{[^}]*\}", "", s)
    s = re.sub(r"\\mbox\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\text\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\textrm\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\textit\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\textbf\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\emph\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\underline\{([^}]*)\}", r"\1", s)
    s = re.sub(r"\\begin\{center\}", "", s)
    s = re.sub(r"\\end\{center\}", "", s)
    s = re.sub(r"\\begin\{enumerate\}.*?", "", s)
    s = re.sub(r"\\end\{enumerate\}", "", s)
    s = re.sub(r"\\item\s*", "", s)
    s = re.sub(r"[ \t]+", " ", s)
    s = re.sub(r"\n{3,}", "\n\n", s)
    return s.strip()


def detect_section_format(lines):
    """Detect whether a section uses Exercise headers, category restarts, or sequential numbering."""
    has_exercise_headers = False
    exercise_nums = []
    
    for line in lines:
        if re.match(r"\\textbf\{Exercise\s+\d+\}", line):
            has_exercise_headers = True
        m = re.match(r"\\textbf\{(\d+)\.\}", line)
        if m:
            exercise_nums.append(int(m.group(1)))
    
    if has_exercise_headers:
        return "exercise_headers"
    
    # Check for restarts (number decreases)
    restarts = sum(1 for i in range(1, len(exercise_nums)) if exercise_nums[i] <= exercise_nums[i-1])
    if restarts > 2:  # More than 2 restarts = category-based
        return "category_restarts"
    
    return "sequential"


def parse_section_sequential(lines, chapter, section):
    """Parse a section with sequential exercise numbering."""
    answers = {}
    i = 0
    while i < len(lines):
        line = lines[i]
        ex_match = re.match(r"\\textbf\{(\d+)\.\}\s*(.*)", line)
        if ex_match:
            ex_num = int(ex_match.group(1))
            answer_lines = [ex_match.group(2)]
            i += 1
            while i < len(lines):
                next_line = lines[i]
                if re.match(r"\\textbf\{\d+\.\}", next_line):
                    break
                if re.match(r"\\(sub)?section\*\{", next_line):
                    break
                if re.match(r"\\textbf\{[A-Z][a-z]", next_line) and not re.match(r"\\textbf\{Exercise", next_line):
                    break
                if re.match(r"^%[=%]+$", next_line.strip()):
                    break
                answer_lines.append(next_line)
                i += 1
            raw = "\n".join(answer_lines)
            answer = clean_answer(raw)
            if answer and ex_num % 2 == 1:
                answers[(chapter, section, ex_num)] = answer
            continue
        i += 1
    return answers


def parse_section_exercise_headers(lines, chapter, section):
    """Parse a section with \\textbf{Exercise N} headers (ch10 style).
    All content under an Exercise header becomes the answer for that exercise number."""
    answers = {}
    current_ex = None
    current_lines = []
    
    for line in lines:
        ex_header = re.match(r"\\textbf\{Exercise\s+(\d+)\}", line)
        if ex_header:
            # Save previous exercise
            if current_ex is not None and current_ex % 2 == 1:
                answer = clean_answer("\n".join(current_lines))
                if answer:
                    answers[(chapter, section, current_ex)] = answer
            current_ex = int(ex_header.group(1))
            current_lines = []
            continue
        
        if current_ex is not None:
            # Skip section/subsection headers
            if re.match(r"\\(sub)?section\*\{", line):
                if current_ex % 2 == 1:
                    answer = clean_answer("\n".join(current_lines))
                    if answer:
                        answers[(chapter, section, current_ex)] = answer
                current_ex = None
                current_lines = []
                continue
            # Skip category headers within (like "Parabolas with Vertex at Origin")
            # but keep collecting content
            current_lines.append(line)
    
    # Save last exercise
    if current_ex is not None and current_ex % 2 == 1:
        answer = clean_answer("\n".join(current_lines))
        if answer:
            answers[(chapter, section, current_ex)] = answer
    
    return answers


def parse_answer_file(filepath: str, chapter_filter: set = None) -> dict:
    """Parse a LaTeX answer file into {(chapter, section, exercise_number): answer_text}."""
    with open(filepath, "r", encoding="utf-8") as f:
        content = f.read()

    answers = {}
    current_chapter = None
    current_section = None

    lines = content.split("\n")
    
    # First pass: identify section boundaries
    section_ranges = []  # [(start_line, end_line, chapter, section)]
    
    for i, line in enumerate(lines):
        ch_match = re.match(r"\\section\*\{Chapter\s+(\d+)", line)
        if ch_match:
            current_chapter = int(ch_match.group(1))
            continue
        
        sec_match = re.match(r"\\subsection\*\{Section\s+(\d+)\.(\d+)", line)
        if sec_match:
            ch_num = int(sec_match.group(1))
            sec_num = int(sec_match.group(2))
            if section_ranges:
                section_ranges[-1] = (*section_ranges[-1][:2], section_ranges[-1][2], section_ranges[-1][3])
                # Update end of previous section
                prev = section_ranges[-1]
                section_ranges[-1] = (prev[0], i, prev[2], prev[3])
            section_ranges.append((i + 1, len(lines), ch_num, sec_num))
            current_chapter = ch_num
            current_section = sec_num
    
    # Parse each section
    for start, end, ch, sec in section_ranges:
        if chapter_filter and ch not in chapter_filter:
            continue
        
        sec_lines = lines[start:end]
        fmt = detect_section_format(sec_lines)
        
        if fmt == "exercise_headers":
            sec_answers = parse_section_exercise_headers(sec_lines, ch, sec)
        elif fmt == "category_restarts":
            # For category-based sections, we still parse sequentially but
            # the numbers restart. We can't reliably map categories to JSON exercises
            # without content matching. Parse what we can — the first occurrence of
            # each odd number gets stored (vocabulary/first category answers).
            # This is imperfect but captures some answers.
            sec_answers = parse_category_section(sec_lines, ch, sec)
        else:
            sec_answers = parse_section_sequential(sec_lines, ch, sec)
        
        answers.update(sec_answers)

    return answers


def parse_category_section(lines, chapter, section):
    """Parse a section with category-based answer grouping.
    
    For these sections, each category (e.g., 'Finding Domain', 'Simplifying')
    contains answers for sub-problems within a macro exercise. We bundle all
    sub-answers within a category and try to map categories to exercise numbers
    by matching category names to exercise problem text in the JSON.
    """
    # Collect categories with their sub-answers
    categories = []  # [(category_name, {sub_num: answer_text})]
    current_category = None
    current_answers = {}
    
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Category header (non-numbered textbf)
        cat_match = re.match(r"\\textbf\{([A-Z][^}]+)\}", line)
        if cat_match and not re.match(r"\\textbf\{\d", line):
            if current_category and current_answers:
                categories.append((current_category, dict(current_answers)))
            current_category = cat_match.group(1)
            current_answers = {}
            i += 1
            continue
        
        # Exercise sub-answer
        ex_match = re.match(r"\\textbf\{(\d+)\.\}\s*(.*)", line)
        if ex_match:
            sub_num = int(ex_match.group(1))
            answer_lines = [ex_match.group(2)]
            i += 1
            while i < len(lines):
                next_line = lines[i]
                if re.match(r"\\textbf\{\d+\.\}", next_line):
                    break
                if re.match(r"\\textbf\{[A-Z]", next_line):
                    break
                if re.match(r"\\(sub)?section\*\{", next_line):
                    break
                if re.match(r"^%[=%]+$", next_line.strip()):
                    break
                answer_lines.append(next_line)
                i += 1
            raw = "\n".join(answer_lines)
            answer = clean_answer(raw)
            if answer:
                current_answers[sub_num] = answer
            continue
        
        i += 1
    
    if current_category and current_answers:
        categories.append((current_category, dict(current_answers)))
    
    # Now try to map categories to JSON exercise numbers
    # Load the corresponding JSON file to match
    json_path = os.path.join(
        CONTENT_DIR,
        f"ch{chapter:02d}",
        f"sec{section:02d}.json"
    )
    
    answers = {}
    
    if os.path.exists(json_path):
        with open(json_path) as f:
            data = json.load(f)
        
        exercises = [b for b in data.get("content", []) if b.get("type") == "exercise"]
        
        # Try to match each category to an exercise by keyword matching
        for cat_name, sub_answers in categories:
            cat_lower = cat_name.lower().strip()
            best_match = None
            best_score = 0
            
            for ex in exercises:
                ex_num = int(ex.get("number", "0"))
                if ex_num % 2 == 0:
                    continue  # Only odd exercises
                
                prob_lower = ex.get("problem", "").lower()[:200]
                
                # Score based on keyword overlap
                score = 0
                cat_words = set(re.findall(r'\w+', cat_lower))
                prob_words = set(re.findall(r'\w+', prob_lower))
                
                # Direct keyword matches
                overlap = cat_words & prob_words
                score = len(overlap)
                
                # Boost for specific pattern matches
                if "vocabulary" in cat_lower and ("fill in" in prob_lower or "blank" in prob_lower or "vocabulary" in prob_lower):
                    score += 5
                if "domain" in cat_lower and "domain" in prob_lower:
                    score += 5
                if "simplif" in cat_lower and "simplif" in prob_lower:
                    score += 5
                if "solving" in cat_lower and "solve" in prob_lower:
                    score += 5
                if "application" in cat_lower and ("pipe" in prob_lower or "boat" in prob_lower or "tank" in prob_lower or "travel" in prob_lower):
                    score += 3
                if "complex fraction" in cat_lower and "complex fraction" in prob_lower:
                    score += 10
                if "adding" in cat_lower and "add" in prob_lower:
                    score += 5
                if "subtracting" in cat_lower and "subtract" in prob_lower:
                    score += 5
                if "multiply" in cat_lower and "multiply" in prob_lower:
                    score += 5
                if "divid" in cat_lower and "divid" in prob_lower:
                    score += 5
                if "conceptual" in cat_lower and ("true" in prob_lower or "false" in prob_lower or "explain" in prob_lower):
                    score += 3
                if "challenge" in cat_lower:
                    score += 1  # low priority
                if "graph" in cat_lower and "graph" in prob_lower:
                    score += 3
                
                if score > best_score:
                    best_score = score
                    best_match = ex_num
            
            if best_match and best_score >= 2:
                # Bundle all sub-answers for this exercise
                parts = []
                for sub_num in sorted(sub_answers.keys()):
                    if sub_num % 2 == 1:  # odd sub-problems only
                        parts.append(f"{sub_num}. {sub_answers[sub_num]}")
                if parts:
                    combined = "\n".join(parts)
                    answers[(chapter, section, best_match)] = combined
    
    return answers


def inject_answers(answers: dict, content_dir: str, dry_run: bool = False, verbose: bool = False):
    """Inject answers into JSON content files."""
    injected = 0
    missing = 0
    files_modified = 0

    json_files = sorted(glob.glob(os.path.join(content_dir, "ch*/sec*.json")))

    for json_path in json_files:
        parts = json_path.split(os.sep)
        ch_dir = [p for p in parts if p.startswith("ch")][0]
        sec_file = [p for p in parts if p.startswith("sec")][0]
        ch_num = int(ch_dir[2:])
        sec_num = int(sec_file[3:5])

        with open(json_path, "r", encoding="utf-8") as f:
            data = json.load(f)

        modified = False
        for block in data.get("content", []):
            if block.get("type") != "exercise":
                continue
            ex_num = int(block.get("number", "0"))
            if ex_num % 2 == 0:
                continue

            key = (ch_num, sec_num, ex_num)
            if key in answers:
                block["answer"] = answers[key]
                injected += 1
                modified = True
                if verbose:
                    print(f"  ✓ Ch{ch_num} Sec{sec_num} Ex{ex_num}")
            else:
                missing += 1
                if verbose:
                    print(f"  ✗ Ch{ch_num} Sec{sec_num} Ex{ex_num}")

        if modified and not dry_run:
            for block in data.get("content", []):
                if block.get("type") == "exercise" and "answer" not in block:
                    block["answer"] = ""
            with open(json_path, "w", encoding="utf-8") as f:
                json.dump(data, f, indent=2, ensure_ascii=False)
                f.write("\n")
            files_modified += 1

    return injected, missing, files_modified


def main():
    parser = argparse.ArgumentParser(description="Parse LaTeX answers and inject into JSON")
    parser.add_argument("--dry-run", action="store_true", help="Don't write files")
    parser.add_argument("--verbose", "-v", action="store_true", help="Show each exercise")
    args = parser.parse_args()

    print("=" * 60)
    print("Axiom Reader — Answer Parser")
    print("=" * 60)

    all_answers = {}

    # Parse main file (ch1-6 only)
    main_file = DEFAULT_ANSWER_SOURCES["main"]
    if os.path.exists(main_file):
        print(f"\nParsing {os.path.basename(main_file)} (chapters 1-6)...")
        ch1_6 = parse_answer_file(main_file, chapter_filter={1, 2, 3, 4, 5, 6})
        print(f"  Found {len(ch1_6)} answers")
        all_answers.update(ch1_6)

    # Parse per-chapter files for ch07-11
    for key in ["ch07", "ch08", "ch09", "ch10", "ch11"]:
        filepath = DEFAULT_ANSWER_SOURCES[key]
        if os.path.exists(filepath):
            print(f"Parsing {os.path.basename(filepath)}...")
            ch_answers = parse_answer_file(filepath)
            print(f"  Found {len(ch_answers)} answers")
            all_answers.update(ch_answers)

    print(f"\nTotal answers parsed: {len(all_answers)}")

    ch_counts = {}
    for (ch, sec, ex) in all_answers:
        ch_counts[ch] = ch_counts.get(ch, 0) + 1
    for ch in sorted(ch_counts):
        print(f"  Chapter {ch}: {ch_counts[ch]} answers")

    print(f"\nInjecting into {CONTENT_DIR}...")
    injected, missing, files_modified = inject_answers(
        all_answers, CONTENT_DIR, dry_run=args.dry_run, verbose=args.verbose
    )

    print(f"\n{'[DRY RUN] ' if args.dry_run else ''}Results:")
    print(f"  Answers injected: {injected}")
    print(f"  Odd exercises without answers: {missing}")
    print(f"  Files modified: {files_modified}")

    if not args.dry_run:
        count = 0
        for f in sorted(glob.glob(os.path.join(CONTENT_DIR, "ch*/sec*.json"))):
            d = json.load(open(f))
            for b in d.get("content", []):
                if b.get("type") == "exercise" and b.get("answer", "").strip():
                    count += 1
        print(f"\n  Verification: {count} exercises now have answers")


if __name__ == "__main__":
    main()
