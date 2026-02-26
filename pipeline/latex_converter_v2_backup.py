#!/usr/bin/env python3
"""
Axiom LaTeX → JSON Converter v2 (Token-Based)

A clean, token-based converter for Atlas LaTeX textbooks to JSON format
for the Axiom Web Reader. Replaces the original regex-heavy converter.

Architecture:
  Phase 1: Strip comments, handle \ifchristian
  Phase 2: Tokenize into typed tokens (math, environments, commands, text)
  Phase 3: Parse token stream into structured content blocks
  Phase 4: Convert LaTeX markup in text fields to reader format

Usage:
    python latex_converter.py --book precalculus
    python latex_converter.py --book precalculus --chapter 1
"""

import argparse
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field
import logging

logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

TEXTBOOKS_DIR = Path.home() / "Desktop" / "Atlas-Textbooks" / "source"
OUTPUT_DIR = Path.home() / "Desktop" / "Axiom-Reader" / "content"
PIPELINE_DIR = Path(__file__).parent
MANIFEST_PATH = PIPELINE_DIR / "figure_manifest.json"

BOOK_TITLES = {
    "vol1": "Calculus Volume 1",
    "vol2": "Calculus Volume 2",
    "vol3": "Calculus Volume 3",
    "college-algebra": "College Algebra",
    "precalculus": "Precalculus",
    "geometry": "Geometry",
    "algebra-1": "Algebra 1",
    "algebra-2": "Algebra 2",
    "pre-algebra": "Pre-Algebra",
    "linear-algebra": "Linear Algebra",
    "diff-eq": "Differential Equations",
    "discrete-math": "Discrete Mathematics",
    "prob-stats": "Probability & Statistics",
    "ap-statistics": "AP Statistics",
    "real-analysis": "Real Analysis",
    "complex-analysis": "Complex Analysis",
    "abstract-algebra": "Abstract Algebra",
    "number-theory": "Number Theory",
    "numerical-analysis": "Numerical Analysis",
}

# Environment name → block type mapping
ENV_TYPE_MAP = {
    "atlasdefinition": "definition",
    "definition": "definition",
    "atlastheorem": "theorem",
    "theorem": "theorem",
    "atlasexample": "example",
    "example": "example",
    "atlaslemma": "lemma",
    "atlascorollary": "corollary",
    "atlaspostulate": "postulate",
    "atlasremark": "remark",
    "atlaswarning": "warning",
    "atlascaution": "caution",
    "atlasimportant": "important",
    "atlasstrategy": "strategy",
    "atlasalgorithm": "algorithm",
    "atlassummary": "summary",
    "atlasmethod": "method",
    "atlasconnection": "connection",
    "keyconcept": "keyconcept",
    "mathincontext": "context",
    "historicalnote": "historical",
    "proof": "proof",
    "myproof": "proof",
    "atlastip": "tip",
    "chapterintro": "chapterintro",
    "atlasreflection": "reflection",
}

# Environments that should be unwrapped (parse inner content)
UNWRAP_ENVS = {"exerciseblock", "multicols", "center", "quote"}

# Environments whose content is devotional
DEVOTIONAL_ENVS = {"devotional", "sectiondevotional", "atlasdevotional"}

# Math display environments (content preserved verbatim, wrapped in $$)
MATH_DISPLAY_ENVS = {"align", "align*", "equation", "equation*", "gather", "gather*",
                      "multline", "multline*", "flalign", "flalign*",
                      "alignat", "alignat*"}

# Math environments that stay inside $$ (not converted to aligned)
MATH_INNER_ENVS = {"cases", "pmatrix", "bmatrix", "vmatrix", "Vmatrix",
                    "matrix", "array", "gathered", "aligned", "split"}


# ═══════════════════════════════════════════════════════════════
# PHASE 1: PREPROCESSING
# ═══════════════════════════════════════════════════════════════

def strip_comments(text: str) -> str:
    """Remove all LaTeX comments (% to end of line), preserving \\%."""
    lines = text.split('\n')
    result = []
    for line in lines:
        cleaned = []
        i = 0
        while i < len(line):
            if line[i] == '%' and (i == 0 or line[i-1] != '\\'):
                break  # Rest of line is comment
            cleaned.append(line[i])
            i += 1
        result.append(''.join(cleaned))
    return '\n'.join(result)


def process_ifchristian(text: str, keep_christian: bool = True) -> str:
    """Process \\ifchristian...\\fi blocks. Handles \\else branches too."""
    if keep_christian:
        # Keep christian content, remove markers
        # But we need to handle \ifchristian...\else...\fi
        result = []
        pos = 0
        while pos < len(text):
            m = re.search(r'\\ifchristian\b', text[pos:])
            if not m:
                result.append(text[pos:])
                break
            result.append(text[pos:pos + m.start()])
            # Find matching \fi, handling nested \if...\fi
            inner_start = pos + m.start() + m.end() - m.start()
            depth = 1
            scan = inner_start
            else_pos = None
            while scan < len(text) and depth > 0:
                if text[scan:scan+3] == '\\if' and (scan + 3 >= len(text) or not text[scan+3].isdigit()):
                    # Check it's actually an \if command
                    rest = text[scan+1:]
                    if re.match(r'if[a-zA-Z]', rest):
                        depth += 1
                elif text[scan:scan+5] == '\\else' and depth == 1:
                    else_pos = scan
                elif text[scan:scan+3] == '\\fi' and (scan + 3 >= len(text) or not text[scan+3].isalpha()):
                    depth -= 1
                    if depth == 0:
                        if else_pos is not None:
                            result.append(text[inner_start:else_pos])
                        else:
                            result.append(text[inner_start:scan])
                        pos = scan + 3
                        # Skip trailing whitespace/newline
                        while pos < len(text) and text[pos] in ' \t':
                            pos += 1
                        if pos < len(text) and text[pos] == '\n':
                            pos += 1
                        break
                scan += 1
            else:
                # Unmatched \ifchristian — just remove the marker
                result.append(text[inner_start:])
                pos = len(text)
        return ''.join(result)
    else:
        # Remove christian content entirely (keep \else branch if present)
        result = []
        pos = 0
        while pos < len(text):
            m = re.search(r'\\ifchristian\b', text[pos:])
            if not m:
                result.append(text[pos:])
                break
            result.append(text[pos:pos + m.start()])
            inner_start = pos + m.start() + m.end() - m.start()
            depth = 1
            scan = inner_start
            else_pos = None
            while scan < len(text) and depth > 0:
                if text[scan:scan+3] == '\\if' and re.match(r'if[a-zA-Z]', text[scan+1:scan+20]):
                    depth += 1
                elif text[scan:scan+5] == '\\else' and depth == 1:
                    else_pos = scan
                elif text[scan:scan+3] == '\\fi' and (scan + 3 >= len(text) or not text[scan+3].isalpha()):
                    depth -= 1
                    if depth == 0:
                        if else_pos is not None:
                            result.append(text[else_pos+5:scan])
                        pos = scan + 3
                        while pos < len(text) and text[pos] in ' \t':
                            pos += 1
                        if pos < len(text) and text[pos] == '\n':
                            pos += 1
                        break
                scan += 1
            else:
                pos = len(text)
        return ''.join(result)


# ═══════════════════════════════════════════════════════════════
# PHASE 2: BRACE-AWARE PARSING UTILITIES
# ═══════════════════════════════════════════════════════════════

def find_matching_brace(text: str, start: int) -> int:
    """Find the position after the matching closing brace.
    start should point to the opening '{'.
    Returns position after '}', or -1 if unmatched."""
    if start >= len(text) or text[start] != '{':
        return -1
    depth = 0
    i = start
    while i < len(text):
        if text[i] == '{' and (i == 0 or text[i-1] != '\\'):
            depth += 1
        elif text[i] == '}' and (i == 0 or text[i-1] != '\\'):
            depth -= 1
            if depth == 0:
                return i + 1
        i += 1
    return -1


def extract_braced(text: str, start: int) -> Tuple[str, int]:
    """Extract content inside {...} starting at position of '{'.
    Returns (content, position_after_close_brace)."""
    end = find_matching_brace(text, start)
    if end == -1:
        return ("", start + 1)
    return (text[start+1:end-1], end)


def find_env_end(text: str, start: int, env_name: str) -> int:
    """Find the end of \\begin{env_name}...\\end{env_name}, handling nesting.
    start should point to the '\\' of \\begin.
    Returns position after \\end{env_name}."""
    begin_tag = f"\\begin{{{env_name}}}"
    end_tag = f"\\end{{{env_name}}}"
    depth = 0
    i = start
    while i < len(text):
        if text[i:i+len(begin_tag)] == begin_tag:
            depth += 1
            i += len(begin_tag)
        elif text[i:i+len(end_tag)] == end_tag:
            depth -= 1
            if depth == 0:
                return i + len(end_tag)
            i += len(end_tag)
        else:
            i += 1
    return len(text)


def extract_optional_arg(text: str, pos: int) -> Tuple[Optional[str], int]:
    """Extract optional argument [content] at position. Returns (content, new_pos)."""
    # Skip whitespace
    while pos < len(text) and text[pos] in ' \t\n':
        pos += 1
    if pos < len(text) and text[pos] == '[':
        depth = 0
        i = pos
        while i < len(text):
            if text[i] == '[':
                depth += 1
            elif text[i] == ']':
                depth -= 1
                if depth == 0:
                    return (text[pos+1:i], i + 1)
            i += 1
    return (None, pos)


def extract_required_arg(text: str, pos: int) -> Tuple[Optional[str], int]:
    """Extract required argument {content} at position. Returns (content, new_pos)."""
    while pos < len(text) and text[pos] in ' \t\n':
        pos += 1
    if pos < len(text) and text[pos] == '{':
        return extract_braced(text, pos)
    return (None, pos)


# ═══════════════════════════════════════════════════════════════
# FIGURE MANIFEST
# ═══════════════════════════════════════════════════════════════

_figure_manifest = None

def get_figure_manifest() -> Dict:
    global _figure_manifest
    if _figure_manifest is None:
        if MANIFEST_PATH.exists():
            with open(MANIFEST_PATH) as f:
                _figure_manifest = json.load(f)
        else:
            _figure_manifest = {}
    return _figure_manifest


def resolve_figure_src(book_id: str, label: str, chapter_num: int) -> str:
    """Resolve a figure label to its SVG path using the manifest."""
    manifest = get_figure_manifest()
    book_figs = manifest.get(book_id, {})
    if label in book_figs:
        return f"/figures/{book_id}/{book_figs[label]}"
    # Fallback: derive from label
    svg_name = label.replace(":", "-") + ".svg"
    return f"/figures/{book_id}/ch{chapter_num:02d}/{svg_name}"


# ═══════════════════════════════════════════════════════════════
# PHASE 2+3: TOKENIZE AND PARSE STRUCTURE
# ═══════════════════════════════════════════════════════════════

@dataclass
class Section:
    id: str
    title: str
    chapter: int
    section: int
    book: str
    objectives: List[str] = field(default_factory=list)
    devotional: Optional[Dict] = None
    epigraph: Optional[Dict] = None
    content: List[Dict] = field(default_factory=list)
    margin_notes: List[Dict] = field(default_factory=list)

    def to_dict(self) -> Dict:
        d = {
            "id": self.id,
            "title": self.title,
            "chapter": self.chapter,
            "section": self.section,
            "book": self.book,
        }
        if self.objectives:
            d["objectives"] = self.objectives
        if self.devotional:
            d["devotional"] = self.devotional
        if self.epigraph:
            d["epigraph"] = self.epigraph
        d["content"] = self.content
        if self.margin_notes:
            d["marginNotes"] = self.margin_notes
        return d


class SectionParser:
    """Parses a single LaTeX section file into structured JSON."""

    def __init__(self, book_id: str, chapter_num: int, section_num: int,
                 christian: bool = True):
        self.book_id = book_id
        self.chapter_num = chapter_num
        self.section_num = section_num
        self.christian = christian
        self.counters = {
            "definition": 0, "theorem": 0, "example": 0,
            "lemma": 0, "corollary": 0, "postulate": 0,
            "algorithm": 0,
        }
        self.inline_figure_counter = 0

    def parse(self, raw_tex: str) -> Section:
        """Main entry point: raw .tex content → Section."""
        # Phase 1: preprocess
        text = strip_comments(raw_tex)
        text = process_ifchristian(text, self.christian)
        text = self._preprocess_strip(text)

        # Extract metadata before structural parse
        title = self._extract_title(text)
        section_id = f"{self.book_id}-ch{self.chapter_num:02d}-sec{self.section_num:02d}"

        sec = Section(
            id=section_id, title=title,
            chapter=self.chapter_num, section=self.section_num,
            book=self.book_id,
        )

        sec.epigraph = self._extract_epigraph(text)
        sec.devotional = self._extract_devotional(text)
        sec.objectives = self._extract_objectives(text)
        sec.margin_notes = self._extract_margin_notes(text)

        # Remove already-extracted elements
        text = self._remove_extracted(text)

        # Split exercises from main content
        text, exercise_text = self._split_exercises(text)

        # Phase 2+3: parse content into blocks
        sec.content = self._parse_body(text)

        # Parse exercises
        if exercise_text:
            sec.content.extend(self._parse_exercises(exercise_text))

        return sec

    # ── Early Preprocessing (strip junk commands) ──────────

    def _preprocess_strip(self, text: str) -> str:
        """Strip LaTeX commands that have no meaning in web output, BEFORE any parsing."""
        # \renewcommand{...}{...} (with any number of args)
        # Matches \renewcommand{\arraystretch}{1.3} etc.
        text = re.sub(r'\\renewcommand\s*\{[^}]*\}\s*\{[^}]*\}', '', text)

        # \lettrine[opts]{X}{rest} → Xrest
        text = re.sub(r'\\lettrine(?:\[[^\]]*\])*\{([^}])\}\{([^}]*)\}', r'\1\2', text)

        # \addcontentsline{...}{...}{...}
        text = re.sub(r'\\addcontentsline\{[^}]*\}\{[^}]*\}\{[^}]*\}', '', text)

        # \setcounter{...}{...}
        text = re.sub(r'\\setcounter\{[^}]*\}\{[^}]*\}', '', text)

        # NOTE: Do NOT strip \label{} here — _parse_figure needs them for manifest lookup.
        # Labels are stripped later in _remove_extracted and _convert_text.

        # \index{...}
        text = re.sub(r'\\index\{[^}]*\}', '', text)

        # {Atlas Press} as standalone fragment
        text = re.sub(r'\{Atlas Press\}', '', text)

        # \textsuperscript{...} → content
        text = re.sub(r'\\textsuperscript\{([^}]*)\}', r'\1', text)

        # \polylongdiv{...}{...} → placeholder
        text = re.sub(r'\\polylongdiv\{[^}]*\}\{[^}]*\}', '[polynomial long division]', text)

        # \cancel{text} → text
        text = re.sub(r'\\cancel\{([^}]*)\}', r'\1', text)

        # \eqref{...} → strip
        text = re.sub(r'\\eqref\{[^}]*\}', '', text)

        # \hline inside align/aligned environments — strip
        text = re.sub(r'(\\begin\{align\*?\}.*?)\\hline\s*(.*?\\end\{align\*?\})', 
                       r'\1\2', text, flags=re.DOTALL)
        # Also strip standalone \hline
        text = re.sub(r'^\s*\\hline\s*$', '', text, flags=re.MULTILINE)

        return text

    # ── Metadata Extraction ──────────────────────────────────

    def _extract_title(self, text: str) -> str:
        m = re.search(r'\\section\*?\{', text)
        if m:
            content, _ = extract_braced(text, m.end() - 1)
            return self._convert_text(content)
        return "Untitled Section"

    def _extract_epigraph(self, text: str) -> Optional[Dict]:
        """Extract \\scriptureepigraph{text}{ref}{quote}{author} or \\epigraph{text}{source}."""
        # scriptureepigraph: 4 args — {scripture_text}{reference}{secular_quote}{quote_author}
        m = re.search(r'\\scriptureepigraph\{', text)
        if m:
            pos = m.end() - 1
            arg1, pos = extract_braced(text, pos)  # scripture text
            arg2, pos = extract_braced(text, pos)  # reference
            arg3, pos = extract_braced(text, pos)  # secular quote
            arg4, pos = extract_braced(text, pos)  # quote author

            result = {
                "text": self._convert_text(arg1),
                "reference": arg2.strip(),
            }
            if arg3 and arg4:
                result["quote"] = self._convert_text(arg3)
                result["quoteAuthor"] = self._convert_text(arg4)

            # Scripture epigraphs are christian edition content
            result["edition"] = "christian"
            return result

        # Regular \epigraph{text}{source}
        m = re.search(r'\\epigraph\{', text)
        if m:
            pos = m.end() - 1
            arg1, pos = extract_braced(text, pos)
            arg2, pos = extract_braced(text, pos)
            return {
                "text": self._convert_text(arg1),
                "reference": self._convert_text(arg2),
            }

        # \epigraphhead[N]{...}
        m = re.search(r'\\epigraphhead', text)
        if m:
            pos = m.end()
            _, pos = extract_optional_arg(text, pos)
            arg, pos = extract_braced(text, pos)
            if arg:
                return {"text": self._convert_text(arg), "reference": ""}

        return None

    def _extract_devotional(self, text: str) -> Optional[Dict]:
        for env_name in DEVOTIONAL_ENVS:
            m = re.search(rf'\\begin\{{{env_name}\}}\{{', text)
            if not m:
                continue
            # Find the full environment
            env_start = m.start()
            env_end = find_env_end(text, env_start, env_name)
            env_text = text[env_start:env_end]

            # Extract args after \begin{env}
            pos = m.end() - 1
            title, pos = extract_braced(text, pos)

            # Try second required arg (scripture reference)
            scripture = ""
            rel_pos = pos - env_start
            if rel_pos < len(env_text):
                sc, new_pos = extract_required_arg(text, pos)
                if sc is not None:
                    scripture = sc
                    pos = new_pos

            # Body is from pos to \end{env}
            end_tag = f"\\end{{{env_name}}}"
            body_end = text.find(end_tag, pos)
            if body_end == -1:
                body_end = env_end
            body = text[pos:body_end]

            # Extract reflection
            reflection = None
            rm = re.search(r'\\devotionalreflection\{', body)
            if rm:
                ref_content, _ = extract_braced(body, rm.end() - 1)
                reflection = self._convert_text(ref_content)
                body = body[:rm.start()] + body[_ :]  # remove it

            result = {
                "title": self._convert_text(title) if title else "",
                "scripture": scripture,
                "content": self._convert_text(body).strip(),
                "edition": "christian",
            }
            if reflection:
                result["reflection"] = reflection
            return result
        return None

    def _extract_objectives(self, text: str) -> List[str]:
        for env in ["sectionobjectives", "learningobjectives"]:
            m = re.search(rf'\\begin\{{{env}\}}', text)
            if not m:
                continue
            end = find_env_end(text, m.start(), env)
            body = text[m.end():text.find(f"\\end{{{env}}}", m.end())]
            items = re.split(r'\\item\s*', body)
            return [self._convert_text(it.strip()) for it in items if it.strip()]
        return []

    def _extract_margin_notes(self, text: str) -> List[Dict]:
        notes = []
        for m in re.finditer(r'\\marginscripture\{', text):
            pos = m.end() - 1
            ref, pos = extract_braced(text, pos)
            txt, pos = extract_braced(text, pos)
            notes.append({"type": "scripture", "reference": ref, "text": self._convert_text(txt), "edition": "christian"})

        for m in re.finditer(r'\\marginquote\{', text):
            pos = m.end() - 1
            author, pos = extract_braced(text, pos)
            txt, pos = extract_braced(text, pos)
            note = {"type": "quote", "author": self._convert_text(author), "text": self._convert_text(txt)}
            # Check if quote contains scripture references
            BIBLE_BOOKS = r'(?:Genesis|Exodus|Leviticus|Numbers|Deuteronomy|Joshua|Judges|Ruth|Samuel|Kings|Chronicles|Ezra|Nehemiah|Esther|Job|Psalms?|Proverbs|Ecclesiastes|Song of Solomon|Isaiah|Jeremiah|Lamentations|Ezekiel|Daniel|Hosea|Joel|Amos|Obadiah|Jonah|Micah|Nahum|Habakkuk|Zephaniah|Haggai|Zechariah|Malachi|Matthew|Mark|Luke|John|Acts|Romans|Corinthians|Galatians|Ephesians|Philippians|Colossians|Thessalonians|Timothy|Titus|Philemon|Hebrews|James|Peter|Jude|Revelation)'
            combined = f"{author} {txt}"
            if re.search(BIBLE_BOOKS, combined):
                note["edition"] = "christian"
            notes.append(note)
        return notes

    def _remove_extracted(self, text: str) -> str:
        """Remove already-extracted elements from text."""
        # Remove \section{...}
        m = re.search(r'\\section\*?\{', text)
        if m:
            end = find_matching_brace(text, m.end() - 1)
            if end > 0:
                text = text[:m.start()] + text[end:]

        # Remove \label after \section
        text = re.sub(r'\\label\{sec:[^}]*\}\s*', '', text, count=1)

        # Remove scriptureepigraph
        m = re.search(r'\\scriptureepigraph\{', text)
        if m:
            pos = m.start()
            end = m.end() - 1
            for _ in range(4):
                _, end = extract_braced(text, end)
            text = text[:pos] + text[end:]

        # Remove \epigraph{...}{...}
        m = re.search(r'\\epigraph\{', text)
        if m:
            pos = m.start()
            end = m.end() - 1
            _, end = extract_braced(text, end)
            _, end = extract_braced(text, end)
            text = text[:pos] + text[end:]

        # Remove \epigraphhead
        m = re.search(r'\\epigraphhead', text)
        if m:
            pos = m.start()
            end = m.end()
            _, end = extract_optional_arg(text, end)
            _, end = extract_braced(text, end)
            text = text[:pos] + text[end:]

        # Remove devotional environments
        for env in DEVOTIONAL_ENVS:
            m = re.search(rf'\\begin\{{{env}\}}', text)
            if m:
                end = find_env_end(text, m.start(), env)
                text = text[:m.start()] + text[end:]

        # Remove objectives environments
        for env in ["sectionobjectives", "learningobjectives"]:
            m = re.search(rf'\\begin\{{{env}\}}', text)
            if m:
                end = find_env_end(text, m.start(), env)
                text = text[:m.start()] + text[end:]

        # Remove margin notes
        text = re.sub(r'\\marginscripture\{[^}]*\}\{[^}]*\}', '', text)
        # Use brace-aware removal for marginquote (text may contain nested braces)
        while True:
            m = re.search(r'\\marginquote\{', text)
            if not m:
                break
            pos = m.end() - 1
            _, pos = extract_braced(text, pos)
            _, pos = extract_braced(text, pos)
            text = text[:m.start()] + text[pos:]

        # Remove \marginnote{...}
        while True:
            m = re.search(r'\\marginnote(?:\[[^\]]*\])?\{', text)
            if not m:
                break
            pos = m.end() - 1
            _, pos = extract_braced(text, pos)
            text = text[:m.start()] + text[pos:]

        # Remove \index{...}
        text = re.sub(r'\\index\{[^}]*\}', '', text)

        return text

    def _split_exercises(self, text: str) -> Tuple[str, str]:
        """Split content at \\subsection*{Exercises} or similar."""
        m = re.search(r'\\subsection\*?\{(?:Review )?Exercises\}', text)
        if m:
            return text[:m.start()], text[m.end():]
        return text, ""

    # ── Body Parsing (Phase 2+3) ─────────────────────────────

    def _parse_body(self, text: str) -> List[Dict]:
        """Parse the main body text into content blocks."""
        blocks = []
        pos = 0

        while pos < len(text):
            # Skip whitespace
            while pos < len(text) and text[pos] in ' \t\n':
                pos += 1
            if pos >= len(text):
                break

            # Try to match an environment
            env_match = re.match(r'\\begin\{([^}]+)\}', text[pos:])
            if env_match:
                env_name = env_match.group(1)
                env_end = find_env_end(text, pos, env_name)
                env_text = text[pos:env_end]
                new_blocks = self._parse_environment(env_name, env_text)
                blocks.extend(new_blocks)
                pos = env_end
                continue

            # Try to match a subsection heading
            heading_match = re.match(r'\\subsection\*?\{', text[pos:])
            if heading_match:
                brace_start = pos + heading_match.end() - 1
                content, end = extract_braced(text, brace_start)
                blocks.append({
                    "type": "heading",
                    "level": 2,
                    "text": self._convert_text(content),
                })
                pos = end
                continue

            # Try standalone exercise markers (exercisevocab, exerciseconceptual, etc.)
            ex_marker = re.match(r'\\(exercisevocab|exerciseconceptual|exercisestar|exerciseerror|exercisetech)\b\s*', text[pos:])
            if ex_marker:
                # These are just category markers before exercise content
                # Convert to heading
                marker_names = {
                    "exercisevocab": "Vocabulary",
                    "exerciseconceptual": "True or False?",
                    "exercisestar": "Challenge",
                    "exerciseerror": "Error Analysis",
                    "exercisetech": "Technology",
                }
                pos += ex_marker.end()
                # Find the text until next paragraph break or environment
                text_end = self._find_text_end(text, pos)
                chunk = text[pos:text_end].strip()
                if chunk:
                    blocks.append({"type": "paragraph", "text": self._convert_text(chunk)})
                pos = text_end
                continue

            # Try standalone commands that we should skip
            skip_match = re.match(r'\\(clearpage|pagebreak|newpage|vfill|bigskip|medskip|smallskip|noindent|vspace\*?\{[^}]*\}|hspace\*?\{[^}]*\})\s*', text[pos:])
            if skip_match:
                pos += skip_match.end()
                continue

            # Try standalone \label{...}
            label_match = re.match(r'\\label\{[^}]*\}\s*', text[pos:])
            if label_match:
                pos += label_match.end()
                continue

            # Try \textbf{Category Header} as a standalone line (exercise section headers)
            bold_header = re.match(r'\\textbf\{([^}]+)\}\s*\n', text[pos:])
            if bold_header:
                header_text = self._convert_text(bold_header.group(1).strip())
                # If it looks like a category header (title case, short), make it a heading
                if len(header_text) < 60:
                    blocks.append({"type": "heading", "level": 3, "text": header_text})
                    pos += bold_header.end()
                    continue

            # Collect text until next environment or heading
            text_end = self._find_text_end(text, pos)
            chunk = text[pos:text_end].strip()
            if chunk:
                para_blocks = self._parse_text_to_paragraphs(chunk)
                blocks.extend(para_blocks)
            pos = text_end

        return blocks

    def _find_text_end(self, text: str, pos: int) -> int:
        """Find where a text chunk ends (next structural \\begin{}, \\subsection, \\section, or EOF).
        
        CRITICAL: \\begin{cases} etc. inside \\[...\\] are NOT structural boundaries.
        Only structural environments (atlas*, figure, exercise, etc.) end a text chunk.
        """
        STRUCTURAL_ENVS = {
            "atlasdefinition", "atlastheorem", "atlasexample", "atlaslemma",
            "atlascorollary", "atlaspostulate", "atlasremark", "atlaswarning",
            "atlascaution", "atlasimportant", "atlasstrategy", "atlasalgorithm",
            "atlassummary", "atlasmethod", "atlasconnection", "keyconcept",
            "mathincontext", "historicalnote", "atlastip", "proof", "myproof",
            "atlasreflection", "devotional", "sectiondevotional", "atlasdevotional",
            "figure", "exercise", "exercisewithsolution", "exerciseblock",
            "chapterintro", "secularintro", "solution",
            "definition", "theorem", "example",
            "itemize", "enumerate",
        }
        i = pos
        while i < len(text):
            if text[i] == '\\':
                if text[i:].startswith('\\begin{'):
                    # Extract env name
                    m = re.match(r'\\begin\{([^}]+)\}', text[i:])
                    if m and m.group(1) in STRUCTURAL_ENVS:
                        return i
                    # Non-structural \begin — skip past it (it's inline content like cases, align, etc.)
                    i += len(m.group(0)) if m else i + 7
                    continue
                if text[i:].startswith('\\subsection'):
                    return i
                if text[i:].startswith('\\section'):
                    return i
                if re.match(r'\\(exercisevocab|exerciseconceptual|exercisestar|exerciseerror|exercisetech)\b', text[i:]):
                    return i
                # Skip past commands
                i += 1
                while i < len(text) and text[i].isalpha():
                    i += 1
                continue
            i += 1
        return len(text)

    def _parse_text_to_paragraphs(self, text: str) -> List[Dict]:
        """Split text into paragraph blocks, separated by blank lines.
        
        CRITICAL: Must protect display math \[...\] before splitting,
        since they can span multiple lines and contain \begin{cases}.
        """
        blocks = []
        
        # First, convert the entire chunk (this protects math spanning newlines)
        converted = self._convert_text(text)
        if not converted or not converted.strip():
            return blocks
        
        # Now split the converted text into paragraphs
        paragraphs = re.split(r'\n\s*\n', converted)
        for para in paragraphs:
            para = para.strip()
            if not para:
                continue
            if len(para) <= 2:
                continue
            # *{Title} or *{Title pattern → heading (lost \subsection*)
            if para.startswith('*{') and '\n' not in para:
                title = para[2:].rstrip('}').strip()
                if title:
                    blocks.append({"type": "heading", "level": 3, "text": title})
                    continue
            blocks.append({"type": "paragraph", "text": para})
        return blocks

    def _parse_environment(self, env_name: str, env_text: str) -> List[Dict]:
        """Parse an environment into one or more content blocks."""
        # Extract the body (between \begin{env}...\end{env})
        begin_tag = f"\\begin{{{env_name}}}"
        end_tag = f"\\end{{{env_name}}}"

        # Position after \begin{env_name}
        pos = len(begin_tag)

        # Extract optional and required args
        opt_arg, pos = extract_optional_arg(env_text, pos)
        req_arg, pos = extract_required_arg(env_text, pos)

        # For some envs, there may be a second required arg
        req_arg2 = None
        if env_name in DEVOTIONAL_ENVS:
            req_arg2, pos = extract_required_arg(env_text, pos)

        # Body
        body_end = env_text.rfind(end_tag)
        if body_end == -1:
            body = env_text[pos:]
        else:
            body = env_text[pos:body_end]

        # ── Handle different environment types ──

        # Unwrap environments: parse inner content
        if env_name in UNWRAP_ENVS:
            # For multicols, skip the required arg (column count)
            return self._parse_body(body)

        # Figure
        if env_name == "figure":
            fig = self._parse_figure(body)
            return [fig] if fig else []

        # TikZ — opaque blob, replace with figure placeholder
        if env_name == "tikzpicture":
            self.inline_figure_counter += 1
            return [{
                "type": "figure",
                "id": f"inline-tikz-{self.chapter_num}.{self.section_num}-{self.inline_figure_counter}",
                "src": "",
                "caption": "",
            }]

        # Lists
        if env_name in ("enumerate", "itemize"):
            return [self._parse_list(env_name, body)]

        # Math display environments
        if env_name in MATH_DISPLAY_ENVS:
            # Convert align/align* → aligned for KaTeX
            inner_env = "aligned"
            return [{"type": "paragraph", "text": f"$$\\begin{{{inner_env}}}{body}\\end{{{inner_env}}}$$"}]

        # Standalone equation
        if env_name in ("equation", "equation*"):
            return [{"type": "paragraph", "text": f"$${body.strip()}$$"}]

        # Tabular
        if env_name == "tabular":
            col_spec = req_arg or opt_arg or ""
            return [self._parse_tabular(body, col_spec)]

        # Atlas environments
        if env_name in ENV_TYPE_MAP:
            block_type = ENV_TYPE_MAP[env_name]
            return [self._parse_atlas_env(block_type, env_name, opt_arg, req_arg, body)]

        # Solution (standalone — attach to previous example if possible)
        if env_name == "solution":
            # Return as a special marker; caller handles attachment
            return [{"type": "_solution", "content": self._convert_text(body)}]

        # Secularintro — pass through as paragraphs
        if env_name == "secularintro" or env_name == "chapterintro":
            return self._parse_body(body)

        # Exercise environments
        if env_name in ("exercise", "exercisewithsolution"):
            return [self._parse_exercise_env(opt_arg, body)]

        if env_name in ("exrow", "exitem"):
            return self._parse_body(body)

        # Unknown env — try to parse body as content
        return self._parse_body(body)

    def _parse_atlas_env(self, block_type: str, env_name: str,
                         opt_arg: Optional[str], req_arg: Optional[str],
                         body: str) -> Dict:
        """Parse an Atlas theorem/definition/example/etc environment."""
        title = req_arg or opt_arg or ""

        # Increment counter — use section-prefixed IDs to avoid duplicates
        sec_prefix = f"ch{self.chapter_num:02d}-sec{self.section_num:02d}"
        if block_type in self.counters:
            self.counters[block_type] += 1
            number = f"{self.chapter_num}.{self.counters[block_type]}"
            block_id = f"{sec_prefix}-{block_type}-{number}"
        else:
            number = ""
            block_id = f"{sec_prefix}-{block_type}"

        # Example: split problem/solution
        if block_type == "example":
            problem, solution = self._split_solution(body)
            return {
                "type": "example",
                "id": block_id,
                "number": number,
                "title": self._convert_text(title) if title else None,
                "problem": self._convert_text(problem),
                "solution": self._convert_text(solution),
            }

        # Proof
        if block_type == "proof":
            return {
                "type": "proof",
                "content": self._convert_text(body),
            }

        # Reflection (christian)
        if block_type == "reflection":
            return {
                "type": "paragraph",
                "text": self._convert_text(body),
                "edition": "christian",
            }

        # Everything else: definition, theorem, warning, etc.
        result = {
            "type": block_type,
            "id": block_id,
            "title": self._convert_text(title) if title else "",
            "content": self._convert_text(body),
        }
        if number:
            result["number"] = number
        return result

    def _split_solution(self, body: str) -> Tuple[str, str]:
        """Extract \\begin{solution}...\\end{solution} from example body."""
        m = re.search(r'\\begin\{solution\}', body)
        if m:
            sol_start = m.end()
            # Find matching \end{solution} handling nesting
            sol_env_end = find_env_end(body, m.start(), "solution")
            end_tag = "\\end{solution}"
            sol_end_tag = body.rfind(end_tag, m.start(), sol_env_end)
            if sol_end_tag != -1:
                problem = body[:m.start()].strip()
                solution = body[sol_start:sol_end_tag].strip()
                return problem, solution
            else:
                problem = body[:m.start()].strip()
                solution = body[sol_start:sol_env_end].strip()
                return problem, solution
        return body.strip(), ""

    def _parse_figure(self, body: str) -> Optional[Dict]:
        """Parse a figure environment body."""
        # Extract caption (brace-aware)
        caption = ""
        cm = re.search(r'\\caption\{', body)
        if cm:
            cap_content, _ = extract_braced(body, cm.end() - 1)
            caption = self._convert_text(cap_content)

        # Extract label
        lm = re.search(r'\\label\{([^}]+)\}', body)
        fig_id = lm.group(1) if lm else ""

        # Check for TikZ
        has_tikz = '\\begin{tikzpicture}' in body

        # Check for fig commands (\figXxx)
        fig_cmd = re.search(r'\\(fig[A-Z][a-zA-Z]*)', body)

        # Check for \includegraphics
        img_match = re.search(r'\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}', body)

        # Resolve src
        src = ""
        if fig_id:
            src = resolve_figure_src(self.book_id, fig_id, self.chapter_num)
        elif img_match:
            img_path = img_match.group(1)
            basename = os.path.basename(img_path)
            name = basename.rsplit('.', 1)[0] if '.' in basename else basename
            src = f"/figures/{self.book_id}/ch{self.chapter_num:02d}/{name}.svg"

        # For TikZ figures without labels, try to generate a src
        if not src and (has_tikz or fig_cmd):
            self.inline_figure_counter += 1
            src = f"/figures/{self.book_id}/ch{self.chapter_num:02d}/fig-{self.chapter_num}.{self.section_num}-inline-{self.inline_figure_counter}.svg"
            if not fig_id:
                fig_id = f"fig-{self.chapter_num}.{self.section_num}-inline-{self.inline_figure_counter}"

        if not fig_id and not caption and not has_tikz and not fig_cmd and not img_match:
            # Check if it's a table-in-figure or something with just a center+tabular
            if '\\begin{tabular}' in body:
                return self._parse_tabular_from_body(body)
            return None

        result = {
            "type": "figure",
            "id": fig_id or f"fig-{self.chapter_num}.{self.section_num}-{self.inline_figure_counter}",
            "src": src,
            "caption": caption,
            "alt": caption,
        }
        if has_tikz or fig_cmd:
            result["tikz"] = True
        if fig_cmd:
            result["figCommand"] = fig_cmd.group(1)
        return result

    def _parse_tabular_from_body(self, body: str) -> Optional[Dict]:
        """Extract and parse a tabular from a figure/center body."""
        m = re.search(r'\\begin\{tabular\}\{', body)
        if not m:
            return None
        col_spec_start = m.end() - 1
        col_spec, pos = extract_braced(body, col_spec_start)
        tab_end = body.find('\\end{tabular}', pos)
        if tab_end == -1:
            return None
        return self._parse_tabular(body[pos:tab_end], col_spec or "")

    def _parse_list(self, env_name: str, body: str) -> Dict:
        """Parse an itemize/enumerate into a list block."""
        ordered = env_name == "enumerate"
        items = []

        # Split on \item, handling optional args
        parts = re.split(r'\\item(?:\[[^\]]*\])?\s*', body)
        for part in parts:
            part = part.strip()
            if not part:
                continue
            # Check for nested environments in the item
            converted = self._convert_text(part)
            if converted:
                items.append(converted)

        return {"type": "list", "ordered": ordered, "items": items}

    def _parse_tabular(self, body: str, col_spec: str) -> Dict:
        """Parse tabular body into a table block."""
        body = body.strip()
        body = re.sub(r'\\(?:toprule|midrule|bottomrule|hline)\s*', '', body)
        body = re.sub(r'\\cline\{[^}]*\}\s*', '', body)

        rows_raw = re.split(r'\\\\(?:\[[^\]]*\])?\s*', body)
        all_rows = []
        for row in rows_raw:
            row = row.strip()
            if not row:
                continue
            cells = [self._convert_text(c.strip()) for c in row.split('&')]
            if any(c for c in cells):
                all_rows.append(cells)

        if not all_rows:
            return {"type": "paragraph", "text": ""}

        headers = all_rows[0] if len(all_rows) >= 2 else []
        data_rows = all_rows[1:] if len(all_rows) >= 2 else all_rows

        alignments = []
        for c in col_spec:
            if c == 'l': alignments.append('left')
            elif c == 'c': alignments.append('center')
            elif c == 'r': alignments.append('right')

        return {
            "type": "table",
            "headers": headers,
            "rows": data_rows,
            "alignment": alignments,
        }

    # ── Exercise Parsing ─────────────────────────────────────

    def _parse_exercises(self, text: str) -> List[Dict]:
        """Parse the exercises section."""
        blocks = []
        exercise_num = 0

        # Unwrap exerciseblock, multicols
        text = re.sub(r'\\begin\{exerciseblock\}(?:\{[^}]*\})?', '', text)
        text = re.sub(r'\\end\{exerciseblock\}', '', text)
        text = re.sub(r'\\begin\{multicols\}\{\d+\}', '', text)
        text = re.sub(r'\\end\{multicols\}', '', text)

        # Inline quote blocks so they become part of exercise text flow
        text = re.sub(r'\n*\\begin\{quote\}\s*', '\n> ', text)
        text = re.sub(r'\s*\\end\{quote\}\s*', '\n', text)

        # Find exercises
        pos = 0
        while pos < len(text):
            # Skip whitespace
            while pos < len(text) and text[pos] in ' \t\n':
                pos += 1
            if pos >= len(text):
                break

            # Category headers (bold text or exercise* commands)
            bold_match = re.match(r'\\textbf\{([^}]+)\}\s*', text[pos:])
            if bold_match:
                blocks.append({"type": "heading", "level": 3, "text": self._convert_text(bold_match.group(1).strip())})
                pos += bold_match.end()
                continue

            ex_cmd = re.match(r'\\(exercisevocab|exerciseconceptual|exercisestar|exerciseerror|exercisetech)\b\s*', text[pos:])
            if ex_cmd:
                marker_type = ex_cmd.group(1)
                variant_map = {
                    "exercisevocab": "vocabulary",
                    "exerciseconceptual": "conceptual",
                    "exercisestar": "starred",
                    "exerciseerror": "error-analysis",
                    "exercisetech": "technology",
                }
                variant = variant_map.get(marker_type, "regular")
                pos += ex_cmd.end()
                text_end = self._find_exercise_text_end(text, pos)
                chunk = text[pos:text_end].strip()
                if chunk:
                    exercise_num += 1
                    blocks.append({
                        "type": "exercise",
                        "id": f"ch{self.chapter_num:02d}-sec{self.section_num:02d}-ex-{exercise_num}",
                        "number": str(exercise_num),
                        "problem": self._convert_text(chunk),
                        "variant": variant,
                    })
                pos = text_end
                continue

            # \begin{exercise}
            env_match = re.match(r'\\begin\{exercise\}', text[pos:])
            if env_match:
                env_end = find_env_end(text, pos, "exercise")
                env_body_start = pos + len("\\begin{exercise}")
                opt, env_body_start = extract_optional_arg(text, env_body_start)
                body_end = text.rfind("\\end{exercise}", pos, env_end)
                body = text[env_body_start:body_end] if body_end > 0 else text[env_body_start:env_end]

                exercise_num += 1
                variant = "regular"
                if opt and ('\\star' in opt or '$\\star$' in opt):
                    variant = "starred"
                elif opt and opt.lower() in ('proof', 'show that'):
                    variant = "conceptual"

                blocks.append({
                    "type": "exercise",
                    "id": f"ch{self.chapter_num:02d}-sec{self.section_num:02d}-ex-{exercise_num}",
                    "number": str(exercise_num),
                    "problem": self._convert_text(body),
                    "variant": variant,
                })
                pos = env_end
                continue

            # \begin{exercisewithsolution}
            ewsm = re.match(r'\\begin\{exercisewithsolution\}', text[pos:])
            if ewsm:
                env_end = find_env_end(text, pos, "exercisewithsolution")
                body_start = pos + len("\\begin{exercisewithsolution}")
                body_end_pos = text.rfind("\\end{exercisewithsolution}", pos, env_end)
                body = text[body_start:body_end_pos] if body_end_pos > 0 else text[body_start:env_end]

                exercise_num += 1
                problem, solution = self._split_solution(body)
                blocks.append({
                    "type": "exercise",
                    "id": f"ch{self.chapter_num:02d}-sec{self.section_num:02d}-ex-{exercise_num}",
                    "number": str(exercise_num),
                    "problem": self._convert_text(problem),
                    "solution": self._convert_text(solution),
                    "variant": "regular",
                })
                pos = env_end
                continue

            # Skip other environments
            other_env = re.match(r'\\begin\{([^}]+)\}', text[pos:])
            if other_env:
                env_end = find_env_end(text, pos, other_env.group(1))
                pos = env_end
                continue

            # Skip standalone commands
            cmd_match = re.match(r'\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?:\{[^}]*\})?\s*', text[pos:])
            if cmd_match:
                pos += cmd_match.end()
                continue

            # Skip other text
            pos += 1

        return blocks

    def _find_exercise_text_end(self, text: str, pos: int) -> int:
        """Find end of exercise description text.
        
        Stops at the next exercise marker/environment, NOT at blank lines,
        since error-analysis exercises span multiple paragraphs with quote blocks.
        """
        i = pos
        while i < len(text):
            if text[i:].startswith('\\begin{exercise}'):
                return i
            if text[i:].startswith('\\begin{exercisewithsolution}'):
                return i
            if re.match(r'\\(exercisevocab|exerciseconceptual|exercisestar|exerciseerror|exercisetech)\b', text[i:]):
                return i
            # Stop at section-level markers
            if text[i:].startswith('\\subsection'):
                return i
            if text[i:].startswith('\\textbf{') and i > pos:
                # Check if this is a standalone category header like "Challenge Problems"
                m = re.match(r'\\textbf\{([^}]+)\}', text[i:])
                if m:
                    header_text = m.group(1).strip()
                    # Only treat as boundary if it's a short category name (not exercise content)
                    # Skip things like \textbf{(a)}, \textbf{Problem:}, \textbf{Student work:}
                    if (not re.match(r'\([a-z]\)', header_text) and
                        ':' not in header_text and
                        len(header_text) < 40 and
                        header_text[0].isupper()):
                        line_start = text.rfind('\n', pos, i)
                        before = text[line_start+1:i].strip() if line_start >= 0 else text[pos:i].strip()
                        if not before:
                            return i
            i += 1
        return len(text)

    def _parse_exercise_env(self, opt_arg: Optional[str], body: str) -> Dict:
        """Parse a single exercise environment."""
        variant = "regular"
        if opt_arg and ('\\star' in opt_arg or '$\\star$' in opt_arg):
            variant = "starred"
        elif opt_arg and opt_arg.lower() in ('proof', 'show that'):
            variant = "conceptual"

        problem, solution = self._split_solution(body)
        result = {
            "type": "exercise",
            "problem": self._convert_text(problem),
            "variant": variant,
        }
        if solution:
            result["solution"] = self._convert_text(solution)
        return result

    # ── Phase 4: Text Conversion ─────────────────────────────

    def _convert_text(self, latex: str) -> str:
        """Convert LaTeX text to reader format, preserving math verbatim.

        This is the heart of the converter. It:
        1. Protects all math content (inline and display)
        2. Replaces TikZ with figure placeholders
        3. Converts LaTeX commands to markdown
        4. Restores math content
        """
        if not latex:
            return ""

        text = latex
        math_store: List[str] = []

        def store_math(content: str) -> str:
            idx = len(math_store)
            math_store.append(content)
            return f"\x01MATH{idx}\x01"

        # Step 0: Handle escaped dollar signs FIRST
        text = text.replace('\\$', '\x01DOLLAR\x01')

        # Step 1: Protect TikZ environments (opaque blobs → remove)
        def replace_tikz(m):
            self.inline_figure_counter += 1
            return store_math("")  # Just remove TikZ code
        text = re.sub(r'\\begin\{tikzpicture\}.*?\\end\{tikzpicture\}', replace_tikz, text, flags=re.DOTALL)

        # Step 2: Protect math display environments (align, equation, etc.)
        # These need to be converted: align* → aligned for KaTeX
        for env in sorted(MATH_DISPLAY_ENVS, key=len, reverse=True):
            pattern = re.compile(rf'\\begin\{{{re.escape(env)}\}}(.*?)\\end\{{{re.escape(env)}\}}', re.DOTALL)
            def make_aligned(m, e=env):
                inner = m.group(1)
                return store_math(f"$$\\begin{{aligned}}{inner}\\end{{aligned}}$$")
            text = pattern.sub(make_aligned, text)

        # Step 3: Protect display math \[...\]
        # CRITICAL: Use brace-depth aware scanning, not regex
        text = self._protect_display_math(text, math_store, store_math)

        # Step 4: Protect display math $$...$$
        def save_dd(m):
            return store_math(m.group(0))
        text = re.sub(r'\$\$(?:(?!\$\$).)+\$\$', save_dd, text, flags=re.DOTALL)

        # Step 5: Protect inline math $...$
        # Must not match escaped dollars (already replaced)
        def save_inline(m):
            return store_math(m.group(0))
        text = re.sub(r'\$(?:[^$\\]|\\.)+?\$', save_inline, text)

        # Step 6: Restore escaped dollars as literal $
        text = text.replace('\x01DOLLAR\x01', '$')

        # Step 7: Convert lists inside text
        text = self._convert_inline_lists(text)

        # Step 8: Convert tables inside text
        text = self._convert_inline_tables(text)

        # Step 9: Convert figure environments inside text (remove TikZ, keep ref)
        text = re.sub(r'\\begin\{figure\}(?:\[[^\]]*\])?.*?\\end\{figure\}', '', text, flags=re.DOTALL)

        # Step 10: Text formatting commands
        # Brace-aware replacements for \textbf, \emph, \textit, etc.
        text = self._convert_formatting_commands(text)

        # Step 11: Remove/convert remaining commands
        # References
        text = re.sub(r'\\(?:cref|Cref|ref)\{([^}]*)\}', r'[\1]', text)

        # Labels (remove)
        text = re.sub(r'\\label\{[^}]*\}', '', text)

        # Index (remove)
        text = re.sub(r'\\index\{[^}]*\}', '', text)

        # Lettrine
        text = re.sub(r'\\lettrine(?:\[[^\]]*\])*\{[^}]*\}\{([^}]*)\}', r'\1', text)

        # Colors
        text = re.sub(r'\\(?:color|textcolor)\{[^}]*\}\{?', '', text)
        text = re.sub(r'\{\\color\{[^}]*\}([^}]*)\}', r'\1', text)

        # Math symbols outside math
        text = text.replace('\\R', 'ℝ')
        text = text.replace('\\N', 'ℕ')
        text = text.replace('\\Z', 'ℤ')
        text = text.replace('\\Q', 'ℚ')
        text = text.replace('\\C', 'ℂ')

        # Spacing commands
        text = re.sub(r'\\(?:quad|qquad|enspace|thinspace|;|,|!)\s*', ' ', text)
        text = re.sub(r'\\hspace\*?\{[^}]*\}', ' ', text)
        text = re.sub(r'\\vspace\*?\{[^}]*\}', '', text)

        # Underline/fill
        text = re.sub(r'\\underline\{\\hspace\{[^}]*\}\}', '___', text)
        text = re.sub(r'\\underline\{([^}]*)\}', r'\1', text)

        # Quotes
        text = text.replace('``', '\u201c')
        text = text.replace("''", '\u201d')
        text = text.replace('`', '\u2018')
        text = text.replace("'", '\u2019')  # careful — only curly if after letter? No, LaTeX uses `` and ''

        # Actually, let's be simpler about quotes — just do the LaTeX ones
        # Revert the single quote replacement as it breaks apostrophes
        text = text.replace('\u2018', '`')
        text = text.replace('\u2019', "'")
        text = text.replace('\u201c', '"')
        text = text.replace('\u201d', '"')

        # Dashes
        text = text.replace('---', '—')
        text = text.replace('--', '–')

        # Ellipsis
        text = re.sub(r'\\(?:ldots|dots|cdots)', '…', text)

        # Non-breaking space
        text = text.replace('~', ' ')
        
        # Escaped special characters (MUST be before \\ cleanup)
        text = text.replace('\\&', '&')
        text = text.replace('\\%', '%')
        text = text.replace('\\#', '#')
        text = text.replace('\\_', '_')
        
        # Bare \\ outside math → newline
        # Match \\ optionally followed by [Npt] spacing  
        text = re.sub(r'\\\\(?:\[\d+[a-z]*\])?\s*', '\n', text)

        # \text{...} (often in math, but may appear outside)
        text = re.sub(r'\\text\{([^}]*)\}', r'\1', text)

        # \mbox{...}
        text = re.sub(r'\\mbox\{([^}]*)\}', r'\1', text)

        # \phantom{...} — invisible
        text = re.sub(r'\\phantom\{[^}]*\}', '', text)

        # \vphantom{...}
        text = re.sub(r'\\vphantom\{[^}]*\}', '', text)

        # \boxed{...}
        text = re.sub(r'\\boxed\{([^}]*)\}', r'\1', text)

        # \centering
        text = text.replace('\\centering', '')

        # \ding{...} — dingbat symbols
        text = re.sub(r'\\ding\{51\}', '✓', text)
        text = re.sub(r'\\ding\{55\}', '✗', text)
        text = re.sub(r'\\ding\{\d+\}', '', text)
        
        # \checkmark, \cmark, \xmark
        text = text.replace('\\checkmark', '✓')
        text = text.replace('\\cmark', '✓')
        text = text.replace('\\xmark', '✗')

        # \par
        text = text.replace('\\par', '\n\n')

        # Remove remaining \begin{center}\end{center} wrappers
        text = re.sub(r'\\begin\{center\}\s*', '', text)
        text = re.sub(r'\\end\{center\}\s*', '', text)

        # Convert remaining \begin{quote}\end{quote} to blockquote
        text = re.sub(r'\\begin\{quote\}\s*', '\n> ', text)
        text = re.sub(r'\\end\{quote\}\s*', '\n', text)

        # Remove orphaned \end{solution}
        text = re.sub(r'\\end\{solution\}\s*', '', text)

        # Remove orphaned \end{itemize}, \end{enumerate}, \begin{itemize}, \begin{enumerate}
        text = re.sub(r'\\end\{(?:itemize|enumerate)\}\s*', '', text)
        text = re.sub(r'\\begin\{(?:itemize|enumerate)\}(?:\[[^\]]*\])?\s*', '', text)
        
        # Remove orphaned \item
        text = re.sub(r'\\item(?:\[[^\]]*\])?\s*', '\n- ', text)

        # Generic: remove remaining \command{content} → content
        # Be careful not to eat actual structural commands
        text = re.sub(r'\\(?:textsf|textsc|texttt|textrm|mathrm|operatorname)\{([^}]*)\}', r'\1', text)

        # Remove standalone unknown commands (\foo with no args)
        text = re.sub(r'\\[a-zA-Z]+\*?(?=\s|[^a-zA-Z{[]|$)', '', text)

        # Step 12: Restore math blocks
        for i, block in enumerate(math_store):
            text = text.replace(f"\x01MATH{i}\x01", block)
        
        # Safety: remove any remaining placeholder markers
        text = re.sub(r'\x01MATH\d+\x01', '', text)

        # Restore any \x01DOLLAR\x01 that leaked through math blocks
        text = text.replace('\x01DOLLAR\x01', '$')

        # Cross-references: [fig:...], [sec:...], [ex:...], [thm:...] → strip brackets
        text = re.sub(r'\[(?:fig|sec|ex|thm|eq|tab|def):[^\]]*\]', '', text)

        # Strip stray \hline outside math
        text = text.replace('\\hline', '')

        # {,} → , (LaTeX thousand separator)
        text = text.replace('{,}', ',')

        # Strip isolated stray closing braces (LaTeX artifacts) but NOT inside math
        # Only strip } that follows a word char and precedes punctuation/space,
        # and is NOT inside $...$ or $$...$$
        def strip_stray_braces(t):
            """Remove stray } outside math contexts."""
            result = []
            in_math = False
            in_display = False
            i = 0
            while i < len(t):
                if t[i:i+2] == '$$' and not in_display:
                    in_display = True
                    result.append('$$')
                    i += 2
                    continue
                elif t[i:i+2] == '$$' and in_display:
                    in_display = False
                    result.append('$$')
                    i += 2
                    continue
                elif t[i] == '$' and not in_display and not in_math:
                    in_math = True
                    result.append('$')
                    i += 1
                    continue
                elif t[i] == '$' and in_math:
                    in_math = False
                    result.append('$')
                    i += 1
                    continue
                elif t[i] == '}' and not in_math and not in_display:
                    # Check if it's a stray brace (after word char, before punct/space)
                    if i > 0 and result and result[-1] and result[-1][-1:].isalpha():
                        if i + 1 >= len(t) or t[i+1] in ' \t\n),.;:!?':
                            i += 1  # skip stray brace
                            continue
                result.append(t[i])
                i += 1
            return ''.join(result)
        text = strip_stray_braces(text)

        # Final cleanup
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = text.strip()

        return text

    def _protect_display_math(self, text: str, store: List[str],
                              store_fn) -> str:
        """Protect \\[...\\] display math using brace-depth-aware scanning.

        CRITICAL: Must distinguish \\[ (display math) from \\\\[8pt] (line break with spacing).
        \\[ display math starts at the beginning of a context or after whitespace.
        \\\\[8pt] is \\\\ followed by [8pt] — the \\\\ is a line break.
        """
        result = []
        i = 0
        while i < len(text):
            # Check for \[ that is NOT \\[
            if text[i:i+2] == '\\[':
                # Check it's not \\[ (line break + optional spacing)
                if i > 0 and text[i-1] == '\\':
                    # This is \\[ — a line break with spacing, not display math
                    result.append(text[i])
                    i += 1
                    continue

                # This is \[ — start of display math
                # Find matching \] handling nested \begin{cases} etc.
                j = i + 2
                depth = 0  # track nested environments
                found = False
                while j < len(text):
                    if text[j:j+2] == '\\]' and depth == 0:
                        # Check not \\]
                        if j > 0 and text[j-1] == '\\':
                            j += 1
                            continue
                        # Found the matching \]
                        inner = text[i+2:j]
                        result.append(store_fn(f"$${inner}$$"))
                        i = j + 2
                        found = True
                        break
                    elif text[j:j+7] == '\\begin{':
                        depth += 1
                        j += 7
                    elif text[j:j+5] == '\\end{':
                        depth -= 1
                        j += 5
                    else:
                        j += 1

                if not found:
                    # Unmatched \[ — just keep it
                    result.append(text[i])
                    i += 1
            else:
                result.append(text[i])
                i += 1

        return ''.join(result)

    def _convert_inline_lists(self, text: str) -> str:
        """Convert \\begin{itemize/enumerate}...\\end{...} inside text to markdown lists."""
        for env in ("enumerate", "itemize"):
            while True:
                m = re.search(rf'\\begin\{{{env}\}}(?:\[[^\]]*\])?', text)
                if not m:
                    break
                # Find matching \end{env} handling nesting
                env_end = find_env_end(text, m.start(), env)
                end_tag = f"\\end{{{env}}}"
                end_tag_start = text.rfind(end_tag, m.start(), env_end)
                if end_tag_start == -1:
                    end_tag_start = env_end
                
                # Skip optional arg after \begin{env}
                body_start = m.end()
                
                body = text[body_start:end_tag_start]

                items = re.split(r'\\item(?:\[[^\]]*\])?\s*', body)
                lines = []
                item_num = 0
                for item in items:
                    item = item.strip()
                    if not item:
                        continue
                    item_num += 1
                    prefix = f"{item_num}." if env == "enumerate" else "-"
                    lines.append(f"\n{prefix} {item}")

                text = text[:m.start()] + '\n'.join(lines) + text[env_end:]
        return text

    def _convert_inline_tables(self, text: str) -> str:
        """Convert tabular environments inside text to markdown tables."""
        while True:
            m = re.search(r'\\begin\{tabular\}\{', text)
            if not m:
                break
            col_start = m.end() - 1
            col_spec, body_start = extract_braced(text, col_start)
            end_pos = text.find('\\end{tabular}', body_start)
            if end_pos == -1:
                break
            body = text[body_start:end_pos]
            end_full = end_pos + len('\\end{tabular}')

            # Parse into markdown table
            body = re.sub(r'\\(?:toprule|midrule|bottomrule|hline)\s*', '', body)
            body = re.sub(r'\\cline\{[^}]*\}\s*', '', body)
            rows = re.split(r'\\\\(?:\[[^\]]*\])?\s*', body)

            md_lines = []
            for row in rows:
                row = row.strip()
                if not row:
                    continue
                cells = [c.strip() for c in row.split('&')]
                cells = [re.sub(r'\\multicolumn\{\d+\}\{[^}]*\}\{([^}]*)\}', r'\1', c) for c in cells]
                md_lines.append("| " + " | ".join(cells) + " |")

            text = text[:m.start()] + '\n' + '\n'.join(md_lines) + '\n' + text[end_full:]
        return text

    def _convert_formatting_commands(self, text: str) -> str:
        """Convert \\textbf, \\emph, \\textit, etc. using brace-aware parsing."""
        cmds = [
            ('\\textbf{', '**', '**'),
            ('\\mathbf{', '**', '**'),
            ('\\textit{', '*', '*'),
            ('\\emph{', '*', '*'),
            ('\\texttt{', '`', '`'),
            ('\\textsc{', '', ''),
            ('\\textsf{', '', ''),
            ('\\textrm{', '', ''),
        ]

        for cmd, prefix, suffix in cmds:
            while cmd in text:
                idx = text.index(cmd)
                brace_pos = idx + len(cmd) - 1
                content, end_pos = extract_braced(text, brace_pos)
                text = text[:idx] + prefix + content + suffix + text[end_pos:]

        return text

    def _convert_accents(self, text: str) -> str:
        """Convert LaTeX accents to Unicode."""
        replacements = [
            (r"\'{e}", "é"), (r"\'{a}", "á"), (r"\'{o}", "ó"),
            (r"\'{i}", "í"), (r"\'{u}", "ú"),
            (r"\`{e}", "è"), (r"\`{a}", "à"), (r"\`{o}", "ò"),
            (r"\^{o}", "ô"), (r"\^{e}", "ê"), (r"\^{a}", "â"),
            (r'\"o', "ö"), (r'\"u', "ü"), (r'\"a', "ä"),
            (r"\c{c}", "ç"), (r"\~{n}", "ñ"),
        ]
        for pat, rep in replacements:
            text = text.replace(pat, rep)
        return text


# ═══════════════════════════════════════════════════════════════
# POST-PROCESSING: ATTACH ORPHAN SOLUTIONS
# ═══════════════════════════════════════════════════════════════

def attach_orphan_solutions(blocks: List[Dict]) -> List[Dict]:
    """Attach standalone _solution blocks to the previous example."""
    result = []
    for block in blocks:
        if block.get("type") == "_solution":
            # Attach to previous example
            if result and result[-1].get("type") == "example" and not result[-1].get("solution"):
                result[-1]["solution"] = block["content"]
            # Otherwise discard
            continue
        result.append(block)
    return result


def clean_empty_blocks(blocks: List[Dict]) -> List[Dict]:
    """Remove empty/trivial blocks and stub headings."""
    result = []
    for block in blocks:
        btype = block.get("type", "")
        if btype == "paragraph" and not block.get("text", "").strip():
            continue
        if btype == "list" and not block.get("items"):
            continue
        # Strip empty heading stubs: "1.", "2.", "Bonus.", etc.
        if btype == "heading":
            heading_text = block.get("text", "").strip()
            if re.match(r'^(\d+\.|Bonus\.?|[a-z]\.)$', heading_text):
                continue
            if not heading_text:
                continue
        # Strip \hline that leaked into paragraph text
        if btype == "paragraph":
            block["text"] = block["text"].replace('\\hline', '').strip()
            if not block["text"]:
                continue
        result.append(block)
    return result


# ═══════════════════════════════════════════════════════════════
# BOOK CONVERTER
# ═══════════════════════════════════════════════════════════════

class BookConverter:
    def __init__(self, christian: bool = True):
        self.christian = christian

    def convert_book(self, book_name: str, chapter_filter: Optional[int] = None) -> bool:
        book_path = TEXTBOOKS_DIR / book_name
        if not book_path.exists():
            logger.error(f"❌ Book not found: {book_path}")
            return False

        logger.info(f"📚 Converting: {book_name}")
        output_path = OUTPUT_DIR / book_name
        output_path.mkdir(parents=True, exist_ok=True)

        chapter_dirs = self._find_chapter_dirs(book_path)
        if chapter_filter is not None:
            chapter_dirs = [d for d in chapter_dirs if self._chapter_num(d.name) == chapter_filter]

        if not chapter_dirs:
            logger.warning("  ⚠️ No chapters found")
            return False

        book_data = {
            "id": book_name,
            "title": BOOK_TITLES.get(book_name, book_name.replace("-", " ").title()),
            "subtitle": "",
            "author": "Atlas Classical Press",
            "chapters": [],
        }

        for chapter_dir in chapter_dirs:
            ch_num = self._chapter_num(chapter_dir.name)
            if ch_num is None:
                continue

            logger.info(f"  📖 Chapter {ch_num}: {chapter_dir.name}")
            ch_title = self._get_chapter_title(chapter_dir)
            ch_output = output_path / f"ch{ch_num:02d}"
            ch_output.mkdir(exist_ok=True)

            section_files = self._find_section_files(chapter_dir)
            sections_meta = []

            for sec_num, sec_file in enumerate(section_files, start=1):
                logger.info(f"    📄 Section {sec_num}: {sec_file.name}")
                try:
                    with open(sec_file, 'r', encoding='utf-8') as f:
                        raw = f.read()

                    parser = SectionParser(book_name, ch_num, sec_num, self.christian)
                    sec = parser.parse(raw)

                    # Post-process
                    sec.content = attach_orphan_solutions(sec.content)
                    sec.content = clean_empty_blocks(sec.content)

                    # Write JSON
                    sec_output = ch_output / f"sec{sec_num:02d}.json"
                    with open(sec_output, 'w', encoding='utf-8') as f:
                        json.dump(sec.to_dict(), f, indent=2, ensure_ascii=False)

                    slug = self._title_to_slug(sec.title)
                    sections_meta.append({
                        "id": f"sec{sec_num:02d}",
                        "number": sec_num,
                        "title": sec.title,
                        "slug": slug,
                    })
                    logger.info(f"      ✅ {sec_output.name}")

                except Exception as e:
                    logger.error(f"      ❌ Error: {e}")
                    import traceback
                    traceback.print_exc()

            book_data["chapters"].append({
                "id": f"ch{ch_num:02d}",
                "number": ch_num,
                "title": ch_title,
                "sections": sections_meta,
            })

        # Write book manifest
        manifest_path = output_path / "book.json"
        with open(manifest_path, 'w', encoding='utf-8') as f:
            json.dump(book_data, f, indent=2, ensure_ascii=False)

        logger.info(f"  📋 Wrote manifest: {manifest_path}")
        logger.info(f"✅ Done: {book_name}")
        return True

    def _find_chapter_dirs(self, book_path: Path) -> List[Path]:
        dirs = []
        for d in sorted(book_path.iterdir()):
            if d.is_dir() and re.match(r'ch\d', d.name):
                dirs.append(d)
        return dirs

    def _chapter_num(self, name: str) -> Optional[int]:
        m = re.search(r'ch(\d+)', name)
        return int(m.group(1)) if m else None

    def _get_chapter_title(self, chapter_dir: Path) -> str:
        chapter_file = chapter_dir / "chapter.tex"
        if chapter_file.exists():
            with open(chapter_file) as f:
                content = f.read()
            m = re.search(r'\\chapter\{([^}]+)\}', content)
            if m:
                return m.group(1).strip()
        return f"Chapter {self._chapter_num(chapter_dir.name)}"

    def _find_section_files(self, chapter_dir: Path) -> List[Path]:
        """Find section files in order from chapter.tex \\input commands."""
        chapter_file = chapter_dir / "chapter.tex"
        files = []

        if chapter_file.exists():
            with open(chapter_file) as f:
                content = f.read()
            for m in re.finditer(r'\\input\{([^}]+)\}', content):
                input_path = m.group(1)
                if not input_path.endswith('.tex'):
                    input_path += '.tex'
                sec_file = chapter_dir / Path(input_path).name
                if not sec_file.exists():
                    sec_file = chapter_dir.parent / input_path
                if sec_file.exists():
                    name = sec_file.name.lower()
                    # Skip non-section files
                    if name in ('chapter.tex', 'figures.tex') or name.startswith('exercises-additional'):
                        continue
                    if 'frontmatter' in name or name.startswith('devotional'):
                        continue
                    files.append(sec_file)

        if not files:
            for f in sorted(chapter_dir.iterdir()):
                if f.is_file() and f.suffix == '.tex' and f.name != 'chapter.tex':
                    name = f.name.lower()
                    if 'sec' in name and name != 'figures.tex' and not name.startswith('exercises-additional'):
                        files.append(f)

        return files

    def _title_to_slug(self, title: str) -> str:
        slug = title.lower()
        slug = re.sub(r'[^a-z0-9\s-]', '', slug)
        slug = re.sub(r'\s+', '-', slug)
        slug = re.sub(r'-+', '-', slug)
        return slug.strip('-')


# ═══════════════════════════════════════════════════════════════
# CLI
# ═══════════════════════════════════════════════════════════════

def main():
    parser = argparse.ArgumentParser(
        description="Convert Atlas LaTeX textbooks to JSON for Axiom Web Reader"
    )
    parser.add_argument("--book", "-b", help="Textbook to convert")
    parser.add_argument("--chapter", "-c", type=int, help="Specific chapter")
    parser.add_argument("--all", "-a", action="store_true", help="Convert all textbooks")
    parser.add_argument("--list", "-l", action="store_true", help="List available textbooks")
    parser.add_argument("--secular", action="store_true", help="Secular edition")

    args = parser.parse_args()

    if args.list:
        print("Available textbooks:")
        for d in sorted(TEXTBOOKS_DIR.iterdir()):
            if d.is_dir() and not d.name.startswith('.') and d.name not in ['shared', 'homework']:
                title = BOOK_TITLES.get(d.name, "")
                print(f"  - {d.name}" + (f" ({title})" if title else ""))
        return

    converter = BookConverter(christian=not args.secular)

    if args.all:
        books = [d.name for d in TEXTBOOKS_DIR.iterdir()
                 if d.is_dir() and not d.name.startswith('.') and d.name not in ['shared', 'homework']]
        for book in sorted(books):
            converter.convert_book(book)
    elif args.book:
        converter.convert_book(args.book, args.chapter)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
