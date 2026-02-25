#!/usr/bin/env python3
"""
Axiom LaTeX → JSON Converter

A comprehensive converter for Atlas LaTeX textbooks to JSON format
for the Axiom Web Reader.

Features:
- Parses individual section .tex files
- Handles all Atlas theorem/definition/example environments
- Preserves math content for KaTeX rendering
- Handles \ifchristian blocks for edition toggling
- Converts paragraphs, lists, figures, subsections
- Generates structured JSON matching the reader's expected format

Usage:
    python latex_converter.py --book vol1
    python latex_converter.py --book vol1 --chapter 1
    python latex_converter.py --all
"""

import argparse
import json
import os
import re
from pathlib import Path
from typing import List, Dict, Any, Optional, Tuple
from dataclasses import dataclass, field, asdict
from enum import Enum
import logging

# Setup logging
logging.basicConfig(level=logging.INFO, format='%(message)s')
logger = logging.getLogger(__name__)

# ═══════════════════════════════════════════════════════════════
# CONFIGURATION
# ═══════════════════════════════════════════════════════════════

TEXTBOOKS_DIR = Path.home() / "Desktop" / "Atlas-Textbooks" / "source"
OUTPUT_DIR = Path.home() / "Desktop" / "Axiom-Reader" / "content"

# Map book directory names to human-readable titles
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

# Atlas environments and their content types
ATLAS_ENVIRONMENTS = {
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
    "atlascaution": "warning",
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
}

# Environments that indicate Christian edition content
CHRISTIAN_ENVIRONMENTS = {"devotional", "atlasdevotional", "sectiondevotional"}

# Environments to unwrap (parse inner content, discard wrapper)
UNWRAP_ENVIRONMENTS = {"exerciseblock", "multicols"}

# ═══════════════════════════════════════════════════════════════
# DATA STRUCTURES
# ═══════════════════════════════════════════════════════════════

@dataclass
class ContentBlock:
    """A block of content in the section."""
    type: str
    data: Dict[str, Any] = field(default_factory=dict)
    
    def to_dict(self) -> Dict[str, Any]:
        result = {"type": self.type}
        result.update(self.data)
        return result


@dataclass
class SectionData:
    """Parsed section data."""
    id: str
    title: str
    chapter: int
    section: int
    book: str
    objectives: List[str] = field(default_factory=list)
    devotional: Optional[Dict[str, str]] = None
    epigraph: Optional[Dict[str, str]] = None
    content: List[ContentBlock] = field(default_factory=list)
    exercises: List[str] = field(default_factory=list)
    margin_notes: List[Dict[str, str]] = field(default_factory=list)
    
    def to_dict(self) -> Dict[str, Any]:
        result = {
            "id": self.id,
            "title": self.title,
            "chapter": self.chapter,
            "section": self.section,
            "book": self.book,
        }
        
        if self.objectives:
            result["objectives"] = self.objectives
        if self.devotional:
            result["devotional"] = self.devotional
        if self.epigraph:
            result["epigraph"] = self.epigraph
        
        result["content"] = [c.to_dict() for c in self.content]
        
        if self.exercises:
            result["exercises"] = self.exercises
        if self.margin_notes:
            result["marginNotes"] = self.margin_notes
            
        return result


# ═══════════════════════════════════════════════════════════════
# LATEX PARSER
# ═══════════════════════════════════════════════════════════════

class LatexConverter:
    """
    Converts LaTeX content to structured JSON.
    """
    
    def __init__(self, christian_edition: bool = True):
        self.christian_edition = christian_edition
        self.counters = {}
        
    def parse_section_file(self, filepath: Path, book_id: str, 
                          chapter_num: int, section_num: int) -> SectionData:
        """Parse a section .tex file and return structured data."""
        
        with open(filepath, 'r', encoding='utf-8') as f:
            content = f.read()
        
        # Reset counters for this section
        self.counters = {
            "definition": 0,
            "theorem": 0,
            "example": 0,
            "lemma": 0,
            "corollary": 0,
        }
        
        # Extract section title
        title = self._extract_section_title(content)
        
        # Create section ID
        section_id = f"{book_id}-ch{chapter_num:02d}-sec{section_num:02d}"
        
        section = SectionData(
            id=section_id,
            title=title,
            chapter=chapter_num,
            section=section_num,
            book=book_id,
        )
        
        # Handle \ifchristian blocks
        content = self._process_christian_blocks(content)
        
        # Extract components
        section.epigraph = self._extract_epigraph(content)
        section.devotional = self._extract_devotional(content)
        section.objectives = self._extract_objectives(content)
        section.margin_notes = self._extract_margin_notes(content)
        
        # Parse main content
        section.content = self._parse_content(content, chapter_num, section_num)
        
        return section
    
    def _process_christian_blocks(self, content: str) -> str:
        """Handle \ifchristian...\fi blocks based on edition."""
        if self.christian_edition:
            # Keep content inside \ifchristian...\fi blocks
            # Remove the \ifchristian and \fi markers
            content = re.sub(r'\\ifchristian\s*', '', content)
            content = re.sub(r'\\fi(?:\s*%[^\n]*)?', '', content)
        else:
            # Remove entire \ifchristian...\fi blocks
            # This is more complex due to nesting
            while True:
                match = re.search(r'\\ifchristian\b', content)
                if not match:
                    break
                    
                start = match.start()
                depth = 1
                pos = match.end()
                
                while pos < len(content) and depth > 0:
                    if content[pos:pos+3] == '\\if':
                        depth += 1
                        pos += 3
                    elif content[pos:pos+3] == '\\fi':
                        depth -= 1
                        pos += 3
                    else:
                        pos += 1
                
                content = content[:start] + content[pos:]
        
        return content
    
    def _extract_section_title(self, content: str) -> str:
        """Extract section title from \section{...} command."""
        # Handle nested braces in section title
        match = re.search(r'\\section\{', content)
        if match:
            start = match.end()
            depth = 1
            pos = start
            while pos < len(content) and depth > 0:
                if content[pos] == '{':
                    depth += 1
                elif content[pos] == '}':
                    depth -= 1
                pos += 1
            title = content[start:pos-1]
            return self._clean_latex_text(title)
        return "Untitled Section"
    
    def _extract_epigraph(self, content: str) -> Optional[Dict[str, str]]:
        """Extract scripture epigraph."""
        match = re.search(
            r'\\scriptureepigraph\{([^}]*)\}\{([^}]*)\}\s*(?:\{([^}]*)\}\{([^}]*)\})?',
            content
        )
        if match:
            result = {
                "text": self._clean_latex_text(match.group(1)),
                "reference": match.group(2),
            }
            if match.group(3) and match.group(4):
                result["quote"] = self._clean_latex_text(match.group(3))
                result["quoteAuthor"] = match.group(4)
            return result
        return None
    
    def _extract_devotional(self, content: str) -> Optional[Dict[str, str]]:
        """Extract devotional environment (devotional, sectiondevotional, atlasdevotional)."""
        env_names = r'(?:devotional|sectiondevotional|atlasdevotional)'
        
        # Try two-arg pattern first: {title}{scripture}
        match = re.search(
            rf'\\begin\{{{env_names}\}}\{{([^}}]*)\}}\{{([^}}]*)\}}(.*?)\\end\{{{env_names}\}}',
            content, re.DOTALL
        )
        if match:
            title, scripture, body = match.group(1), match.group(2), match.group(3)
        else:
            # Try one-arg pattern: {title}
            match = re.search(
                rf'\\begin\{{{env_names}\}}\{{([^}}]*)\}}(.*?)\\end\{{{env_names}\}}',
                content, re.DOTALL
            )
            if match:
                title, scripture, body = match.group(1), "", match.group(2)
            else:
                return None
        
        # Extract reflection if present
        reflection_match = re.search(
            r'\\devotionalreflection\{([^}]*)\}', body
        )
        reflection = reflection_match.group(1) if reflection_match else None
        
        # Clean body
        body = re.sub(r'\\devotionalreflection\{[^}]*\}', '', body)
        body = self._clean_latex_text(body)
        
        result = {
            "title": title,
            "scripture": scripture,
            "content": body.strip(),
            "edition": "christian",
        }
        if reflection:
            result["reflection"] = self._clean_latex_text(reflection)
        return result
    
    def _extract_devotional_from_body(self, env_name: str, optional_arg: str, 
                                       required_arg: str, body: str) -> Optional[Dict]:
        """Extract devotional data from an already-parsed environment body."""
        # For sectiondevotional/atlasdevotional: \begin{env}{title}{scripture}
        # required_arg is the first {}, we need to also find the second {}
        title = required_arg or optional_arg or ""
        scripture = ""
        
        # Try to extract scripture from the start of body (second required arg)
        sc_match = re.match(r'\{([^}]*)\}', body.strip())
        if sc_match:
            scripture = sc_match.group(1)
            body = body[sc_match.end():]
        
        reflection_match = re.search(r'\\devotionalreflection\{([^}]*)\}', body)
        reflection = reflection_match.group(1) if reflection_match else None
        body = re.sub(r'\\devotionalreflection\{[^}]*\}', '', body)
        
        result = {
            "title": title,
            "scripture": scripture,
            "content": self._clean_latex_text(body).strip(),
        }
        if reflection:
            result["reflection"] = self._clean_latex_text(reflection)
        return result

    def _extract_objectives(self, content: str) -> List[str]:
        """Extract learning objectives."""
        objectives = []
        
        # Look for sectionobjectives or learningobjectives environment
        for env_name in ['sectionobjectives', 'learningobjectives']:
            match = re.search(
                rf'\\begin\{{{env_name}\}}(.*?)\\end\{{{env_name}\}}',
                content, re.DOTALL
            )
            if match:
                items = re.findall(r'\\item\s*(.*?)(?=\\item|$)', match.group(1), re.DOTALL)
                for item in items:
                    cleaned = self._clean_latex_text(item.strip())
                    if cleaned:
                        objectives.append(cleaned)
                break
        
        return objectives
    
    def _extract_margin_notes(self, content: str) -> List[Dict[str, str]]:
        """Extract margin scripture and quotes."""
        notes = []
        
        # Margin scripture
        for match in re.finditer(r'\\marginscripture\{([^}]*)\}\{([^}]*)\}', content):
            notes.append({
                "type": "scripture",
                "reference": match.group(1),
                "text": self._clean_latex_text(match.group(2)),
            })
        
        # Margin quotes
        for match in re.finditer(r'\\marginquote\{([^}]*)\}\{([^}]*)\}', content):
            notes.append({
                "type": "quote",
                "author": match.group(1),
                "text": self._clean_latex_text(match.group(2)),
            })
        
        return notes
    
    def _parse_content(self, content: str, chapter_num: int, section_num: int) -> List[ContentBlock]:
        """Parse the main content of a section."""
        blocks = []
        
        # Remove already-parsed elements
        content = re.sub(r'\\section\{[^}]+\}', '', content)
        # Note: don't strip \label globally — figures need them
        content = re.sub(r'\\scriptureepigraph\{[^}]*\}\{[^}]*\}(?:\{[^}]*\}\{[^}]*\})?', '', content)
        content = re.sub(r'\\begin\{(?:devotional|sectiondevotional|atlasdevotional)\}.*?\\end\{(?:devotional|sectiondevotional|atlasdevotional)\}', '', content, flags=re.DOTALL)
        content = re.sub(r'\\begin\{(?:section|learning)objectives\}.*?\\end\{(?:section|learning)objectives\}', '', content, flags=re.DOTALL)
        content = re.sub(r'\\marginscripture\{[^}]*\}\{[^}]*\}', '', content)
        content = re.sub(r'\\marginquote\{[^}]*\}\{[^}]*\}', '', content)
        content = re.sub(r'\\marginnote\{[^}]*\}', '', content)
        
        # Remove standalone exercise commands from the "already-parsed" cleanup
        # (they'll be parsed in the exercises section below)
        
        # Split exercises section from main content
        exercise_content = ""
        exercises_split = re.split(r'\\subsection\*\{(?:Review )?Exercises\}', content, maxsplit=1)
        if len(exercises_split) == 2:
            content = exercises_split[0]
            exercise_content = exercises_split[1]
        
        # Split into chunks (environments and text between them)
        chunks = self._split_into_chunks(content)
        
        for chunk_type, chunk_content in chunks:
            if chunk_type == 'environment':
                block = self._parse_environment(chunk_content, chapter_num, section_num)
                if block:
                    blocks.append(block)
            elif chunk_type == 'text':
                text_blocks = self._parse_text_chunk(chunk_content)
                blocks.extend(text_blocks)
        
        # Parse exercises
        if exercise_content:
            exercise_blocks = self._parse_exercises(exercise_content, chapter_num, section_num)
            blocks.extend(exercise_blocks)
        
        return blocks
    
    def _split_into_chunks(self, content: str) -> List[Tuple[str, str]]:
        """Split content into environment chunks and text chunks."""
        chunks = []
        pos = 0
        
        # Pattern for any \begin{...}
        env_pattern = re.compile(r'\\begin\{([^}]+)\}')
        
        while pos < len(content):
            match = env_pattern.search(content, pos)
            
            if not match:
                # No more environments, rest is text
                remaining = content[pos:].strip()
                if remaining:
                    chunks.append(('text', remaining))
                break
            
            # Text before environment
            before = content[pos:match.start()].strip()
            if before:
                chunks.append(('text', before))
            
            # Find matching \end{...}
            env_name = match.group(1)
            env_start = match.start()
            env_content, env_end = self._find_environment_end(content, env_start, env_name)
            
            if env_content:
                chunks.append(('environment', content[env_start:env_end]))
                pos = env_end
            else:
                # Malformed environment, skip
                pos = match.end()
        
        return chunks
    
    def _find_environment_end(self, content: str, start: int, env_name: str) -> Tuple[Optional[str], int]:
        """Find the end of an environment, handling nesting."""
        begin_pattern = re.compile(rf'\\begin\{{{re.escape(env_name)}\}}')
        end_pattern = re.compile(rf'\\end\{{{re.escape(env_name)}\}}')
        
        depth = 0
        pos = start
        
        while pos < len(content):
            begin_match = begin_pattern.search(content, pos)
            end_match = end_pattern.search(content, pos)
            
            if begin_match and (not end_match or begin_match.start() < end_match.start()):
                depth += 1
                pos = begin_match.end()
            elif end_match:
                depth -= 1
                if depth == 0:
                    return (content[start:end_match.end()], end_match.end())
                pos = end_match.end()
            else:
                break
        
        return (None, start + 1)
    
    def _parse_environment(self, env_content: str, chapter_num: int, section_num: int) -> Optional[ContentBlock]:
        """Parse a LaTeX environment into a content block."""
        
        # Extract environment name and args
        match = re.match(
            r'\\begin\{([^}]+)\}(?:\[([^\]]*)\])?(?:\{([^}]*)\})?',
            env_content
        )
        if not match:
            return None
        
        env_name = match.group(1)
        optional_arg = match.group(2) or ""
        required_arg = match.group(3) or ""
        
        # Get body content
        body_start = match.end()
        body_end = env_content.rfind(f'\\end{{{env_name}}}')
        if body_end == -1:
            body = ""
        else:
            body = env_content[body_start:body_end]
        
        # Handle unwrap environments (exerciseblock, multicols) — parse inner content
        if env_name in UNWRAP_ENVIRONMENTS:
            inner_blocks = self._parse_text_chunk(body)
            # Return first block or None; caller should handle multiple
            # Actually, we need to return a single block, so wrap as a group
            if inner_blocks:
                return inner_blocks[0] if len(inner_blocks) == 1 else ContentBlock('group', {'blocks': [b.to_dict() for b in inner_blocks]})
            return None
        
        # Handle Christian edition environments
        if env_name in CHRISTIAN_ENVIRONMENTS:
            # Parse like devotional but tag with edition
            dev = self._extract_devotional_from_body(env_name, optional_arg, required_arg, body)
            if dev:
                dev['edition'] = 'christian'
                return ContentBlock('devotional', dev)
            return None
        
        # Handle secularintro — pass through as paragraphs
        if env_name == 'secularintro':
            text_blocks = self._parse_text_chunk(body)
            if text_blocks:
                return text_blocks[0] if len(text_blocks) == 1 else ContentBlock('group', {'blocks': [b.to_dict() for b in text_blocks]})
            return None
        
        # Handle different environment types
        if env_name in ATLAS_ENVIRONMENTS:
            return self._parse_atlas_environment(
                env_name, optional_arg, required_arg, body, chapter_num, section_num
            )
        elif env_name == 'figure':
            return self._parse_figure(body)
        elif env_name in ('enumerate', 'itemize'):
            return self._parse_list(env_name, body)
        elif env_name == 'align' or env_name == 'align*':
            return ContentBlock('paragraph', {
                'text': f"$${body.strip()}$$"
            })
        elif env_name == 'tikzpicture':
            # Skip TikZ figures for now
            return None
        elif env_name == 'equation' or env_name == 'equation*':
            return ContentBlock('paragraph', {
                'text': f"$${body.strip()}$$"
            })
        elif env_name == 'center':
            # Check if center contains a table
            table_block = self._parse_center_for_table(body)
            if table_block:
                return table_block
            # Otherwise, treat as normal content (skip the wrapper)
            return None
        elif env_name == 'tabular':
            # Parse tabular directly
            return self._parse_tabular(body, optional_arg)
        
        return None
    
    def _parse_atlas_environment(self, env_name: str, optional_arg: str, 
                                  required_arg: str, body: str,
                                  chapter_num: int, section_num: int) -> ContentBlock:
        """Parse an Atlas theorem-style environment."""
        content_type = ATLAS_ENVIRONMENTS[env_name]
        
        # Get title
        title = required_arg or optional_arg or ""
        
        # Increment counter and generate ID
        base_type = content_type
        if base_type in self.counters:
            self.counters[base_type] += 1
            number = f"{chapter_num}.{self.counters[base_type]}"
            block_id = f"{content_type}-{chapter_num}.{self.counters[base_type]}"
        else:
            number = ""
            block_id = f"{content_type}-{chapter_num}.{section_num}"
        
        # Handle examples with solutions
        if content_type == 'example':
            problem, solution = self._extract_solution(body)
            # Extract any figures from within the example
            figures = self._extract_inline_figures(problem + "\n" + solution)
            
            data = {
                'id': block_id,
                'number': number,
                'title': title if title else None,
                'problem': self._convert_latex_to_text(problem),
                'solution': self._convert_latex_to_text(solution),
            }
            if figures:
                data['figures'] = [f.to_dict() for f in figures]
            return ContentBlock('example', data)
        
        # Handle proofs
        elif content_type == 'proof':
            return ContentBlock('proof', {
                'content': self._convert_latex_to_text(body),
            })
        
        # Handle theorems, definitions, etc.
        else:
            # Determine label for theorem-like environments
            label = None
            if content_type == 'theorem':
                label = 'Theorem'
            elif content_type == 'lemma':
                label = 'Lemma'
            elif content_type == 'corollary':
                label = 'Corollary'
            elif content_type == 'postulate':
                label = 'Postulate'
            
            data = {
                'id': block_id,
                'number': number if number else None,
                'title': title,
                'content': self._convert_latex_to_text(body),
            }
            if label:
                data['label'] = label
            
            return ContentBlock(content_type, data)
    
    def _extract_solution(self, body: str) -> Tuple[str, str]:
        """Extract solution from example body."""
        match = re.search(
            r'\\begin\{solution\}(.*?)\\end\{solution\}',
            body, re.DOTALL
        )
        if match:
            solution = match.group(1).strip()
            problem = body[:match.start()].strip()
            return (problem, solution)
        return (body.strip(), "")
    
    def _parse_figure(self, body: str) -> Optional[ContentBlock]:
        """Parse a figure environment (supports includegraphics and TikZ)."""
        # Extract caption (handle nested braces)
        caption = ""
        caption_match = re.search(r'\\caption\{', body)
        if caption_match:
            cap_content, _ = self._extract_braced_content(body, caption_match.end() - 1)
            if cap_content:
                caption = self._clean_latex_text(cap_content)
        
        # Extract Description (alt text)
        alt_text = caption  # default to caption
        desc_match = re.search(r'\\Description\{', body)
        if desc_match:
            desc_content, _ = self._extract_braced_content(body, desc_match.end() - 1)
            if desc_content:
                alt_text = self._clean_latex_text(desc_content)
        
        # Extract label for ID
        label_match = re.search(r'\\label\{([^}]+)\}', body)
        fig_id = label_match.group(1) if label_match else ""
        
        # Check for includegraphics
        img_match = re.search(r'\\includegraphics(?:\[[^\]]*\])?\{([^}]+)\}', body)
        if img_match:
            src = img_match.group(1)
            if not fig_id:
                fig_id = f"fig-{hash(src) % 10000}"
            return ContentBlock('figure', {
                'id': fig_id,
                'src': src,
                'caption': caption,
                'alt': alt_text,
            })
        
        # Check for TikZ or figure commands (\figXxx)
        has_tikz = '\\begin{tikzpicture}' in body
        fig_cmd_match = re.search(r'\\(fig[A-Z][a-zA-Z]*)', body)
        
        if has_tikz or fig_cmd_match:
            # Generate placeholder SVG path from label
            if fig_id:
                # e.g. fig:function-machine -> fig-function-machine.svg
                safe_name = fig_id.replace(':', '-').replace('fig-', 'fig-')
                src = f"/figures/precalculus/{safe_name}.svg"
            else:
                src = f"/figures/precalculus/fig-{hash(body) % 100000}.svg"
                fig_id = f"fig-{hash(body) % 100000}"
            
            data = {
                'id': fig_id,
                'src': src,
                'caption': caption,
                'alt': alt_text,
                'tikz': True,
            }
            if fig_cmd_match:
                data['figCommand'] = fig_cmd_match.group(1)
            
            return ContentBlock('figure', data)
        
        # No recognizable figure content
        if caption:
            return ContentBlock('figure', {
                'id': fig_id or f"fig-{hash(body) % 10000}",
                'src': '',
                'caption': caption,
                'alt': alt_text,
            })
        
        return None
    
    def _parse_list(self, env_name: str, body: str) -> ContentBlock:
        """Parse enumerate/itemize environment."""
        ordered = env_name == 'enumerate'
        items = []
        
        # Extract items
        item_pattern = re.compile(r'\\item(?:\[[^\]]*\])?\s*(.*?)(?=\\item|$)', re.DOTALL)
        for match in item_pattern.finditer(body):
            item_text = self._convert_latex_to_text(match.group(1).strip())
            if item_text:
                items.append(item_text)
        
        return ContentBlock('list', {
            'ordered': ordered,
            'items': items,
        })
    
    def _parse_center_for_table(self, body: str) -> Optional[ContentBlock]:
        """Check if a center environment contains a table and parse it."""
        # Look for tabular inside center
        # Use a more robust pattern that handles nested braces in column spec
        match = re.search(r'\\begin\{tabular\}\{', body)
        if match:
            # Find matching closing brace for column spec
            start = match.end()
            col_spec, end_pos = self._extract_braced_content(body, start - 1)
            if col_spec is not None:
                # Find the tabular body (everything until \end{tabular})
                body_start = end_pos
                body_end = body.find(r'\end{tabular}', body_start)
                if body_end != -1:
                    tabular_body = body[body_start:body_end]
                    return self._parse_tabular(tabular_body, col_spec)
        return None
    
    def _extract_braced_content(self, text: str, start: int) -> Tuple[Optional[str], int]:
        """Extract content between balanced braces starting at position start."""
        if start >= len(text) or text[start] != '{':
            return (None, start)
        
        depth = 0
        pos = start
        while pos < len(text):
            if text[pos] == '{':
                depth += 1
            elif text[pos] == '}':
                depth -= 1
                if depth == 0:
                    return (text[start + 1:pos], pos + 1)
            pos += 1
        return (None, start)
    
    def _parse_tabular(self, body: str, col_spec: str = "") -> ContentBlock:
        """Parse a LaTeX tabular environment into a table structure."""
        # Clean up the body
        body = body.strip()
        
        # Remove \toprule, \midrule, \bottomrule, \hline
        body = re.sub(r'\\(?:toprule|midrule|bottomrule|hline)\s*', '', body)
        
        # Remove \cline{...}
        body = re.sub(r'\\cline\{[^}]*\}\s*', '', body)
        
        # Split into rows by \\ (but not \\[ for spacing)
        # Handle both \\ and \\[6pt] style line breaks
        rows_raw = re.split(r'\\\\(?:\[[^\]]*\])?\s*', body)
        
        # Parse each row
        all_rows = []
        for row in rows_raw:
            row = row.strip()
            if not row:
                continue
            
            # Split by & to get cells
            cells = row.split('&')
            cells = [self._clean_table_cell(c.strip()) for c in cells]
            
            # Skip empty rows
            if all(c == '' for c in cells):
                continue
                
            all_rows.append(cells)
        
        if not all_rows:
            return ContentBlock('paragraph', {'text': ''})
        
        # Determine if first row is a header
        # Heuristic: if there was a \midrule or \hline after first row, 
        # or if first row looks like headers (no math, short text)
        # For now, treat first row as headers if there are at least 2 rows
        if len(all_rows) >= 2:
            headers = all_rows[0]
            data_rows = all_rows[1:]
        else:
            headers = []
            data_rows = all_rows
        
        return ContentBlock('table', {
            'headers': headers,
            'rows': data_rows,
            'alignment': self._parse_col_spec(col_spec),
        })
    
    def _clean_table_cell(self, cell: str) -> str:
        """Clean a table cell, converting LaTeX to readable text."""
        # Handle multicolumn
        multi_match = re.match(r'\\multicolumn\{\d+\}\{[^}]*\}\{([^}]*)\}', cell)
        if multi_match:
            cell = multi_match.group(1)
        
        # Convert LaTeX to text (preserving math)
        cell = self._convert_latex_to_text(cell)
        
        # Clean up extra whitespace
        cell = re.sub(r'\s+', ' ', cell).strip()
        
        return cell
    
    def _parse_col_spec(self, col_spec: str) -> List[str]:
        """Parse column alignment specification (l, c, r, |, etc.)"""
        alignments = []
        for char in col_spec:
            if char == 'l':
                alignments.append('left')
            elif char == 'c':
                alignments.append('center')
            elif char == 'r':
                alignments.append('right')
            # Ignore | and other characters
        return alignments
    
    def _parse_text_chunk(self, text: str) -> List[ContentBlock]:
        """Parse a text chunk into paragraphs and headings."""
        blocks = []
        
        # Split by subsection/paragraph commands
        parts = re.split(r'(\\subsection\*?\{[^}]+\})', text)
        
        for part in parts:
            part = part.strip()
            if not part:
                continue
            
            # Check for subsection
            subsec_match = re.match(r'\\subsection\*?\{([^}]+)\}', part)
            if subsec_match:
                blocks.append(ContentBlock('heading', {
                    'level': 2,
                    'text': self._clean_latex_text(subsec_match.group(1)),
                }))
                continue
            
            # Split into paragraphs (double newlines)
            paragraphs = re.split(r'\n\s*\n', part)
            
            for para in paragraphs:
                para = para.strip()
                if not para:
                    continue
                
                # Skip comments
                if para.startswith('%'):
                    continue
                
                # Skip certain commands
                if re.match(r'^\\(index|cref|ref|label|clearpage|pagebreak|vspace|hspace)\b', para):
                    continue
                
                # Convert to text
                text = self._convert_latex_to_text(para)
                if text and len(text) > 10:  # Skip very short fragments
                    blocks.append(ContentBlock('paragraph', {'text': text}))
        
        return blocks
    
    def _convert_latex_to_text(self, latex: str) -> str:
        """Convert LaTeX content to reader-compatible text with math preserved."""
        text = latex
        
        # First, protect math content by replacing with placeholders
        math_blocks = []
        
        def save_math(match):
            idx = len(math_blocks)
            math_blocks.append(match.group(0))
            return f"__MATH_BLOCK_{idx}__"
        
        # Protect display math $$...$$ and \[...\]
        text = re.sub(r'\$\$.*?\$\$', save_math, text, flags=re.DOTALL)
        text = re.sub(r'\\\[.*?\\\]', save_math, text, flags=re.DOTALL)
        
        # Protect inline math $...$
        text = re.sub(r'\$[^$]+?\$', save_math, text)
        
        # Protect align/equation environments (convert to display math)
        def convert_align(match):
            content = match.group(1)
            idx = len(math_blocks)
            math_blocks.append(f"$${content}$$")
            return f"__MATH_BLOCK_{idx}__"
        
        text = re.sub(r'\\begin\{align\*?\}(.*?)\\end\{align\*?\}', convert_align, text, flags=re.DOTALL)
        text = re.sub(r'\\begin\{equation\*?\}(.*?)\\end\{equation\*?\}', convert_align, text, flags=re.DOTALL)
        
        # Handle enumerate/itemize inside content (convert to markdown-style lists)
        def convert_list(match):
            list_content = match.group(2)
            is_ordered = match.group(1) == 'enumerate'
            items = re.findall(r'\\item(?:\[[^\]]*\])?\s*(.*?)(?=\\item|$)', list_content, re.DOTALL)
            
            result_lines = []
            for i, item in enumerate(items):
                item = item.strip()
                if item:
                    prefix = f"{i+1}." if is_ordered else "-"
                    result_lines.append(f"\n\n{prefix} {item}")
            
            return "\n".join(result_lines)
        
        text = re.sub(r'\\begin\{(enumerate|itemize)\}(?:\[[^\]]*\])?(.*?)\\end\{\1\}', 
                      convert_list, text, flags=re.DOTALL)
        
        # Handle tables inside text (center + tabular blocks)
        # Convert them to clean text representation
        def convert_table_to_text(match):
            table_content = match.group(0)
            # Extract just the tabular body - handle complex column specs with braces
            # Find \begin{tabular}{ and then find matching }
            tabular_start = re.search(r'\\begin\{tabular\}\{', table_content)
            if not tabular_start:
                return ""
            
            # Find matching brace for column spec
            pos = tabular_start.end()
            depth = 1
            while pos < len(table_content) and depth > 0:
                if table_content[pos] == '{':
                    depth += 1
                elif table_content[pos] == '}':
                    depth -= 1
                pos += 1
            
            # Find end of tabular
            end_match = re.search(r'\\end\{tabular\}', table_content[pos:])
            if not end_match:
                return ""
            
            body = table_content[pos:pos + end_match.start()].strip()
            # Remove rules
            body = re.sub(r'\\(?:toprule|midrule|bottomrule|hline)\s*', '', body)
            body = re.sub(r'\\cline\{[^}]*\}\s*', '', body)
            
            # Split into rows
            rows_raw = re.split(r'\\\\(?:\[[^\]]*\])?\s*', body)
            
            result_lines = ["\n"]
            for row in rows_raw:
                row = row.strip()
                if not row:
                    continue
                cells = [c.strip() for c in row.split('&')]
                # Clean each cell (basic cleanup, avoid recursive calls)
                # Handle multicolumn first: \multicolumn{n}{align}{content}
                cells = [re.sub(r'\\multicolumn\{\d+\}\{[^}]*\}\{([^}]*)\}', r'\1', c) for c in cells]
                # Then handle other LaTeX commands
                cells = [re.sub(r'\\[a-zA-Z]+\{([^}]*)\}', r'\1', c) for c in cells]
                cells = [c.strip() for c in cells if c.strip()]
                if cells:
                    result_lines.append("| " + " | ".join(cells) + " |")
            
            result_lines.append("")
            return "\n".join(result_lines)
        
        text = re.sub(r'\\begin\{center\}.*?\\begin\{tabular\}\{[^}]*\}.*?\\end\{tabular\}.*?\\end\{center\}',
                      convert_table_to_text, text, flags=re.DOTALL)
        text = re.sub(r'\\begin\{tabular\}\{[^}]*\}.*?\\end\{tabular\}',
                      convert_table_to_text, text, flags=re.DOTALL)
        
        # Clean up partially-stripped table remnants (from previous conversions)
        # These patterns catch the "leaking" LaTeX we see in the current output
        text = re.sub(r'center\s*\n*tabular\{[^}]*\}', '', text)
        text = re.sub(r'tabular\{[^}]*\}', '', text)
        text = re.sub(r'tabular\s*\n*center', '', text)
        text = re.sub(r'\n(?:center|tabular)\s*\n', '\n', text)
        # Remove lines that are just cell separators or row markers
        text = re.sub(r'^[&\\|]+\s*$', '', text, flags=re.MULTILINE)
        
        # Text formatting
        text = re.sub(r'\\textbf\{([^}]*)\}', r'**\1**', text)
        text = re.sub(r'\\textit\{([^}]*)\}', r'*\1*', text)
        text = re.sub(r'\\emph\{([^}]*)\}', r'*\1*', text)
        text = re.sub(r'\\textsc\{([^}]*)\}', r'\1', text)
        text = re.sub(r'\\textsf\{([^}]*)\}', r'\1', text)
        text = re.sub(r'\\texttt\{([^}]*)\}', r'`\1`', text)
        
        # References (convert to readable text for now)
        text = re.sub(r'\\cref\{([^}]*)\}', r'[\1]', text)
        text = re.sub(r'\\Cref\{([^}]*)\}', r'[\1]', text)
        text = re.sub(r'\\ref\{([^}]*)\}', r'[\1]', text)
        
        # Index entries (remove)
        text = re.sub(r'\\index\{[^}]*\}', '', text)
        
        # Remove labels
        text = re.sub(r'\\label\{[^}]*\}', '', text)
        
        # Handle common math symbols that might be outside $ $
        text = re.sub(r'\\R\b', 'ℝ', text)
        text = re.sub(r'\\N\b', 'ℕ', text)
        text = re.sub(r'\\Z\b', 'ℤ', text)
        text = re.sub(r'\\Q\b', 'ℚ', text)
        text = re.sub(r'\\C\b', 'ℂ', text)
        
        # Handle \abs{...} → |...|
        text = re.sub(r'\\abs\{([^}]*)\}', r'|\1|', text)
        
        # Handle \dfrac and \frac outside of math mode (wrap in $)
        def wrap_frac(match):
            idx = len(math_blocks)
            math_blocks.append(f"${match.group(0)}$")
            return f"__MATH_BLOCK_{idx}__"
        text = re.sub(r'\\d?frac\{[^}]*\}\{[^}]*\}', wrap_frac, text)
        
        # Handle \sqrt outside math mode
        def wrap_sqrt(match):
            idx = len(math_blocks)
            math_blocks.append(f"${match.group(0)}$")
            return f"__MATH_BLOCK_{idx}__"
        text = re.sub(r'\\sqrt(?:\[[^\]]*\])?\{[^}]*\}', wrap_sqrt, text)
        
        # Handle quotes
        text = re.sub(r"``", '"', text)
        text = re.sub(r"''", '"', text)
        
        # Handle dashes
        text = re.sub(r'---', '—', text)
        text = re.sub(r'--', '–', text)
        
        # Handle ellipsis
        text = re.sub(r'\\ldots', '…', text)
        text = re.sub(r'\\dots', '…', text)
        
        # Handle lettrine (drop cap) - just extract the text
        text = re.sub(r'\\lettrine(?:\[[^\]]*\])?\{[^}]*\}\{([^}]*)\}', r'\1', text)
        
        # Handle tilde for non-breaking space
        text = re.sub(r'~', ' ', text)
        
        # Remove remaining unknown commands (but preserve their arguments)
        text = re.sub(r'\\[a-zA-Z]+\*?(?:\[[^\]]*\])?\{([^}]*)\}', r'\1', text)
        
        # Remove standalone commands without arguments  
        text = re.sub(r'\\[a-zA-Z]+\*?(?:\[[^\]]*\])?(?=\s|[^a-zA-Z]|$)', '', text)
        
        # Restore math blocks (convert \[...\] to $$...$$ for KaTeX)
        for i, block in enumerate(math_blocks):
            # Convert \[...\] to $$...$$
            if block.startswith('\\[') and block.endswith('\\]'):
                block = '$$' + block[2:-2] + '$$'
            text = text.replace(f"__MATH_BLOCK_{i}__", block)
        
        # Clean up extra whitespace (but preserve paragraph breaks)
        text = re.sub(r'[ \t]+', ' ', text)
        text = re.sub(r'\n{3,}', '\n\n', text)
        text = text.strip()
        
        return text
    
    def _extract_inline_figures(self, content: str) -> List[ContentBlock]:
        """Extract figure environments embedded within other content."""
        figures = []
        for m in re.finditer(r'\\begin\{figure\}(?:\[[^\]]*\])?(.*?)\\end\{figure\}', content, re.DOTALL):
            fig = self._parse_figure(m.group(1))
            if fig:
                figures.append(fig)
        return figures

    def _parse_exercises(self, content: str, chapter_num: int, section_num: int) -> List[ContentBlock]:
        """Parse exercises section into exercise content blocks."""
        exercises = []
        exercise_num = 0
        
        # Strategy: find all exercise boundaries, then extract each one
        # Patterns:
        # 1. \begin{exercise}[optional]...\end{exercise}
        # 2. \exercisestar ... (standalone command, runs to next exercise/env/double-newline)
        # 3. \exerciseconceptual ...
        # 4. \exerciseerror ...
        # 5. \exercisetech ...
        
        # First, unwrap exerciseblock and multicols environments
        content = re.sub(r'\\begin\{exerciseblock\}(?:\{[^}]*\})?', '', content)
        content = re.sub(r'\\end\{exerciseblock\}', '', content)
        content = re.sub(r'\\begin\{multicols\}\{\d+\}', '', content)
        content = re.sub(r'\\end\{multicols\}', '', content)
        
        # Find all exercise starts
        # Pattern for \begin{exercise} environments
        env_pattern = r'\\begin\{exercise\}(?:\[([^\]]*)\])?(.*?)\\end\{exercise\}'
        # Pattern for standalone exercise commands
        cmd_pattern = r'\\(exercisestar|exerciseconceptual|exerciseerror|exercisetech)\s+(.*?)(?=\\begin\{exercise\}|\\exercise(?:star|conceptual|error|tech)\b|\\subsection|\\section|\Z)'
        
        # Combine: find all exercises in order by position
        all_exercises = []
        
        for m in re.finditer(env_pattern, content, re.DOTALL):
            optional = m.group(1) or ""
            body = m.group(2).strip()
            variant = "regular"
            if '$\\star$' in optional or r'\star' in optional:
                variant = "starred"
            elif optional.lower() in ('proof', 'show that'):
                variant = "proof"
            all_exercises.append((m.start(), variant, body, optional))
        
        for m in re.finditer(cmd_pattern, content, re.DOTALL):
            cmd = m.group(1)
            body = m.group(2).strip()
            variant_map = {
                "exercisestar": "starred",
                "exerciseconceptual": "conceptual",
                "exerciseerror": "error",
                "exercisetech": "tech",
            }
            variant = variant_map.get(cmd, "regular")
            all_exercises.append((m.start(), variant, body, ""))
        
        # Sort by position in source
        all_exercises.sort(key=lambda x: x[0])
        
        for _, variant, body, label in all_exercises:
            exercise_num += 1
            ex_id = f"ex-{chapter_num}.{section_num}-{exercise_num}"
            
            problem_text = self._convert_latex_to_text(body)
            if not problem_text.strip():
                continue
            
            data = {
                "id": ex_id,
                "number": str(exercise_num),
                "problem": problem_text,
                "variant": variant,
                "hint": None,
                "answer": None,
            }
            if label and label not in ('$\\star$', r'\star', 'Proof', 'Show That'):
                data["label"] = self._clean_latex_text(label)
            
            exercises.append(ContentBlock("exercise", data))
        
        return exercises

    def _clean_latex_text(self, text: str) -> str:
        """Clean LaTeX text for plain text output."""
        # Handle LaTeX accents first
        text = self._convert_accents(text)
        
        # First convert
        text = self._convert_latex_to_text(text)
        
        # Remove remaining math delimiters for plain text
        # (keep them in content blocks)
        
        return text.strip()
    
    def _convert_accents(self, text: str) -> str:
        """Convert LaTeX accent commands to Unicode."""
        accent_map = {
            # Circumflex
            (r"\^{o}", "ô"), (r"\^{O}", "Ô"),
            (r"\^{e}", "ê"), (r"\^{E}", "Ê"),
            (r"\^{a}", "â"), (r"\^{A}", "Â"),
            (r"\^{i}", "î"), (r"\^{I}", "Î"),
            (r"\^{u}", "û"), (r"\^{U}", "Û"),
            # Acute
            (r"\'{e}", "é"), (r"\'{E}", "É"),
            (r"\'{a}", "á"), (r"\'{A}", "Á"),
            (r"\'{o}", "ó"), (r"\'{O}", "Ó"),
            (r"\'{i}", "í"), (r"\'{I}", "Í"),
            (r"\'{u}", "ú"), (r"\'{U}", "Ú"),
            # Grave
            (r"\`{e}", "è"), (r"\`{E}", "È"),
            (r"\`{a}", "à"), (r"\`{A}", "À"),
            (r"\`{o}", "ò"), (r"\`{O}", "Ò"),
            # Umlaut
            (r'\"o', "ö"), (r'\"O', "Ö"),
            (r'\"u', "ü"), (r'\"U', "Ü"),
            (r'\"a', "ä"), (r'\"A', "Ä"),
            (r'\"e', "ë"), (r'\"E', "Ë"),
            # Cedilla
            (r"\c{c}", "ç"), (r"\c{C}", "Ç"),
            # Tilde
            (r"\~{n}", "ñ"), (r"\~{N}", "Ñ"),
            (r"\~{a}", "ã"), (r"\~{A}", "Ã"),
            (r"\~{o}", "õ"), (r"\~{O}", "Õ"),
        }
        
        for pattern, replacement in accent_map:
            text = text.replace(pattern, replacement)
        
        # Also handle shorthand accents without braces
        text = re.sub(r"\\'{([aeiouAEIOU])}", lambda m: {
            'a': 'á', 'e': 'é', 'i': 'í', 'o': 'ó', 'u': 'ú',
            'A': 'Á', 'E': 'É', 'I': 'Í', 'O': 'Ó', 'U': 'Ú'
        }.get(m.group(1), m.group(1)), text)
        
        text = re.sub(r"\\`{([aeiouAEIOU])}", lambda m: {
            'a': 'à', 'e': 'è', 'i': 'ì', 'o': 'ò', 'u': 'ù',
            'A': 'À', 'E': 'È', 'I': 'Ì', 'O': 'Ò', 'U': 'Ù'
        }.get(m.group(1), m.group(1)), text)
        
        text = re.sub(r'\\\^{([aeiouAEIOU])}', lambda m: {
            'a': 'â', 'e': 'ê', 'i': 'î', 'o': 'ô', 'u': 'û',
            'A': 'Â', 'E': 'Ê', 'I': 'Î', 'O': 'Ô', 'U': 'Û'
        }.get(m.group(1), m.group(1)), text)
        
        return text


# ═══════════════════════════════════════════════════════════════
# BOOK CONVERTER
# ═══════════════════════════════════════════════════════════════

class BookConverter:
    """Converts an entire textbook to JSON."""
    
    def __init__(self, christian_edition: bool = True):
        self.converter = LatexConverter(christian_edition)
    
    def convert_book(self, book_name: str, chapter_filter: Optional[int] = None) -> bool:
        """Convert a textbook to JSON."""
        book_path = TEXTBOOKS_DIR / book_name
        
        if not book_path.exists():
            logger.error(f"❌ Book not found: {book_path}")
            return False
        
        logger.info(f"📚 Converting: {book_name}")
        
        # Create output directory
        output_path = OUTPUT_DIR / book_name
        output_path.mkdir(parents=True, exist_ok=True)
        
        # Find all chapter directories
        chapter_dirs = self._find_chapter_dirs(book_path)
        
        if chapter_filter is not None:
            chapter_dirs = [
                d for d in chapter_dirs 
                if self._extract_chapter_num(d.name) == chapter_filter
            ]
        
        if not chapter_dirs:
            logger.warning(f"  ⚠️ No chapters found")
            return False
        
        # Build book manifest
        book_data = {
            "id": book_name,
            "title": BOOK_TITLES.get(book_name, book_name.replace("-", " ").title()),
            "subtitle": "",
            "author": "Atlas Classical Press",
            "chapters": []
        }
        
        for chapter_dir in chapter_dirs:
            chapter_num = self._extract_chapter_num(chapter_dir.name)
            if chapter_num is None:
                continue
            
            logger.info(f"  📖 Chapter {chapter_num}: {chapter_dir.name}")
            
            # Get chapter info
            chapter_info = self._parse_chapter_file(chapter_dir, chapter_num)
            
            # Create chapter output directory
            ch_output = output_path / f"ch{chapter_num:02d}"
            ch_output.mkdir(exist_ok=True)
            
            # Find and convert section files
            section_files = self._find_section_files(chapter_dir)
            sections_meta = []
            
            for sec_num, sec_file in enumerate(section_files, start=1):
                logger.info(f"    📄 Section {sec_num}: {sec_file.name}")
                
                try:
                    section = self.converter.parse_section_file(
                        sec_file, book_name, chapter_num, sec_num
                    )
                    
                    # Write section JSON
                    sec_output = ch_output / f"sec{sec_num:02d}.json"
                    with open(sec_output, 'w', encoding='utf-8') as f:
                        json.dump(section.to_dict(), f, indent=2, ensure_ascii=False)
                    
                    # Add to chapter metadata
                    slug = self._title_to_slug(section.title)
                    sections_meta.append({
                        "id": f"sec{sec_num:02d}",
                        "number": sec_num,
                        "title": section.title,
                        "slug": slug,
                    })
                    
                    logger.info(f"      ✅ {sec_output.name}")
                    
                except Exception as e:
                    logger.error(f"      ❌ Error: {e}")
                    import traceback
                    traceback.print_exc()
            
            # Add chapter to book manifest
            book_data["chapters"].append({
                "id": f"ch{chapter_num:02d}",
                "number": chapter_num,
                "title": chapter_info.get("title", f"Chapter {chapter_num}"),
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
        """Find all chapter directories in a book."""
        dirs = []
        for d in sorted(book_path.iterdir()):
            if d.is_dir() and (d.name.startswith('ch') or re.match(r'ch\d', d.name)):
                dirs.append(d)
        return dirs
    
    def _extract_chapter_num(self, dir_name: str) -> Optional[int]:
        """Extract chapter number from directory name."""
        match = re.search(r'ch(\d+)', dir_name)
        if match:
            return int(match.group(1))
        return None
    
    def _parse_chapter_file(self, chapter_dir: Path, chapter_num: int) -> Dict:
        """Parse chapter.tex for chapter-level info."""
        chapter_file = chapter_dir / "chapter.tex"
        
        info = {"title": f"Chapter {chapter_num}", "devotional": None}
        
        if not chapter_file.exists():
            return info
        
        try:
            with open(chapter_file, 'r', encoding='utf-8') as f:
                content = f.read()
            
            # Extract chapter title
            match = re.search(r'\\chapter\{([^}]+)\}', content)
            if match:
                info["title"] = self.converter._clean_latex_text(match.group(1))
        except Exception:
            pass
        
        return info
    
    def _find_section_files(self, chapter_dir: Path) -> List[Path]:
        """Find all section .tex files in a chapter directory."""
        files = []
        
        # First, try to find include order from chapter.tex
        chapter_file = chapter_dir / "chapter.tex"
        if chapter_file.exists():
            try:
                with open(chapter_file, 'r', encoding='utf-8') as f:
                    content = f.read()
                
                # Find \input commands
                for match in re.finditer(r'\\input\{([^}]+)\}', content):
                    input_path = match.group(1)
                    # Handle relative paths
                    if not input_path.endswith('.tex'):
                        input_path += '.tex'
                    
                    # The path might be relative to the book root
                    sec_file = chapter_dir / Path(input_path).name
                    if not sec_file.exists():
                        sec_file = chapter_dir.parent / input_path
                    if sec_file.exists():
                        file_name = sec_file.name.lower()
                        # Skip frontmatter and chapter.tex itself
                        if 'frontmatter' in file_name or file_name == 'chapter.tex':
                            continue
                        # Skip standalone devotional files (they're parsed via the section they belong to)
                        if file_name.startswith('devotional') and 'sec' not in file_name:
                            continue
                        files.append(sec_file)
            except Exception:
                pass
        
        # If no files found from chapter.tex, scan directory
        if not files:
            for f in sorted(chapter_dir.iterdir()):
                if f.is_file() and f.suffix == '.tex':
                    name = f.name.lower()
                    if name == 'chapter.tex' or 'frontmatter' in name:
                        continue
                    if 'sec' in name or 'exercises-additional' in name:
                        files.append(f)
        
        return files
    
    def _title_to_slug(self, title: str) -> str:
        """Convert a title to a URL slug."""
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
    parser.add_argument(
        "--book", "-b",
        help="Textbook to convert (e.g., vol1, college-algebra)"
    )
    parser.add_argument(
        "--chapter", "-c",
        type=int,
        help="Specific chapter number to convert"
    )
    parser.add_argument(
        "--all", "-a",
        action="store_true",
        help="Convert all textbooks"
    )
    parser.add_argument(
        "--list", "-l",
        action="store_true",
        help="List available textbooks"
    )
    parser.add_argument(
        "--secular",
        action="store_true",
        help="Generate secular edition (omit Christian content)"
    )
    
    args = parser.parse_args()
    
    if args.list:
        print("Available textbooks:")
        for d in sorted(TEXTBOOKS_DIR.iterdir()):
            if d.is_dir() and not d.name.startswith('.') and d.name not in ['shared', 'homework']:
                title = BOOK_TITLES.get(d.name, "")
                print(f"  - {d.name}" + (f" ({title})" if title else ""))
        return
    
    christian_edition = not args.secular
    converter = BookConverter(christian_edition)
    
    if args.all:
        books = [
            d.name for d in TEXTBOOKS_DIR.iterdir()
            if d.is_dir() and not d.name.startswith('.') 
            and d.name not in ['shared', 'homework']
        ]
        for book in sorted(books):
            converter.convert_book(book)
            print()
    elif args.book:
        converter.convert_book(args.book, args.chapter)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
