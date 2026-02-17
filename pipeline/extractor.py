"""
Content Extractor for Atlas Textbooks

Extracts structured content from parsed LaTeX tokens.
"""

import re
from typing import List, Dict, Any, Optional
from dataclasses import dataclass, field, asdict
from parser import Token, TokenType, LatexParser


@dataclass
class ContentBlock:
    """A block of content (definition, theorem, example, etc.)"""
    type: str
    id: str = ""
    title: str = ""
    body: str = ""
    solution: str = ""  # For examples
    number: int = 0
    
    def to_dict(self) -> Dict:
        d = asdict(self)
        # Remove empty fields
        return {k: v for k, v in d.items() if v}


@dataclass 
class Section:
    """A section within a chapter"""
    number: int
    title: str
    objectives: List[str] = field(default_factory=list)
    devotional: Optional[Dict] = None
    epigraph: Optional[Dict] = None
    content: List[ContentBlock] = field(default_factory=list)
    margin_notes: List[Dict] = field(default_factory=list)
    
    def to_dict(self) -> Dict:
        return {
            "number": self.number,
            "title": self.title,
            "objectives": self.objectives,
            "devotional": self.devotional,
            "epigraph": self.epigraph,
            "content": [c.to_dict() for c in self.content],
            "marginNotes": self.margin_notes
        }


class ContentExtractor:
    """
    Extracts structured content from LaTeX tokens.
    """
    
    # Map LaTeX environments to content types
    ENV_TYPES = {
        "atlasdefinition": "definition",
        "atlastheorem": "theorem",
        "atlasexample": "example",
        "atlaswarning": "warning",
        "atlascaution": "warning",
        "atlasimportant": "important",
        "atlaslemma": "lemma",
        "atlascorollary": "corollary",
        "atlaspostulate": "postulate",
        "atlasremark": "remark",
        "atlasstrategy": "strategy",
        "proof": "proof",
        "myproof": "proof",
        "keyconcept": "keyconcept",
        "mathincontext": "context",
    }
    
    def __init__(self):
        self.parser = LatexParser()
        self.counters = {}  # For numbering
    
    def extract_chapter(self, tokens: List[Token], chapter_num: int) -> Dict:
        """
        Extract a full chapter's content.
        """
        self.counters = {"definition": 0, "theorem": 0, "example": 0}
        
        chapter_data = {
            "number": chapter_num,
            "title": "",
            "devotional": None,
            "sections": []
        }
        
        # Find chapter title
        for token in tokens:
            if token.type == TokenType.COMMAND and token.value == "chapter":
                if token.args:
                    chapter_data["title"] = token.args[0]
                break
        
        # Find chapter-level devotional (before first section)
        chapter_data["devotional"] = self._extract_devotional(tokens)
        
        # Split into sections
        sections = self._split_into_sections(tokens, chapter_num)
        chapter_data["sections"] = [s.to_dict() for s in sections]
        
        return chapter_data
    
    def _split_into_sections(self, tokens: List[Token], chapter_num: int) -> List[Section]:
        """
        Split tokens into sections based on \section commands.
        """
        sections = []
        current_section = None
        section_num = 0
        current_tokens = []
        
        for i, token in enumerate(tokens):
            if token.type == TokenType.COMMAND and token.value == "section":
                # Save previous section
                if current_section is not None:
                    self._process_section_content(current_section, current_tokens)
                    sections.append(current_section)
                
                # Start new section
                section_num += 1
                title = token.args[0] if token.args else f"Section {section_num}"
                current_section = Section(
                    number=section_num,
                    title=title
                )
                current_tokens = []
            elif current_section is not None:
                current_tokens.append(token)
        
        # Don't forget the last section
        if current_section is not None:
            self._process_section_content(current_section, current_tokens)
            sections.append(current_section)
        
        return sections
    
    def _process_section_content(self, section: Section, tokens: List[Token]):
        """
        Process tokens within a section to extract content blocks.
        """
        i = 0
        while i < len(tokens):
            token = tokens[i]
            
            # Learning objectives
            if token.type == TokenType.ENV_BEGIN and token.value == "learningobjectives":
                objectives = self._extract_objectives(tokens, i)
                section.objectives = objectives
                # Skip to end of environment
                while i < len(tokens) and not (tokens[i].type == TokenType.ENV_END and tokens[i].value == "learningobjectives"):
                    i += 1
            
            # Devotional
            elif token.type == TokenType.ENV_BEGIN and token.value == "devotional":
                devotional = self._extract_devotional_env(tokens, i)
                if devotional:
                    section.devotional = devotional
                while i < len(tokens) and not (tokens[i].type == TokenType.ENV_END and tokens[i].value == "devotional"):
                    i += 1
            
            # Scripture epigraph
            elif token.type == TokenType.COMMAND and token.value == "scriptureepigraph":
                if token.args and len(token.args) >= 2:
                    section.epigraph = {
                        "text": token.args[0],
                        "reference": token.args[1]
                    }
            
            # Margin scripture
            elif token.type == TokenType.COMMAND and token.value == "marginscripture":
                if token.args and len(token.args) >= 2:
                    section.margin_notes.append({
                        "text": token.args[0],
                        "reference": token.args[1]
                    })
            
            # Content environments (definition, theorem, example, etc.)
            elif token.type == TokenType.ENV_BEGIN and token.value in self.ENV_TYPES:
                content_type = self.ENV_TYPES[token.value]
                block = self._extract_content_block(tokens, i, token.value, content_type)
                if block:
                    section.content.append(block)
                # Skip to end of environment
                depth = 1
                while i < len(tokens) and depth > 0:
                    i += 1
                    if i < len(tokens):
                        if tokens[i].type == TokenType.ENV_BEGIN and tokens[i].value == token.value:
                            depth += 1
                        elif tokens[i].type == TokenType.ENV_END and tokens[i].value == token.value:
                            depth -= 1
            
            i += 1
    
    def _extract_objectives(self, tokens: List[Token], start: int) -> List[str]:
        """
        Extract learning objectives from tokens.
        """
        objectives = []
        i = start + 1
        current_objective = []
        
        while i < len(tokens):
            token = tokens[i]
            
            if token.type == TokenType.ENV_END and token.value == "learningobjectives":
                # Save last objective
                if current_objective:
                    objectives.append(" ".join(current_objective).strip())
                break
            elif token.type == TokenType.COMMAND and token.value == "item":
                # Save previous objective and start new one
                if current_objective:
                    objectives.append(" ".join(current_objective).strip())
                current_objective = []
            elif token.type == TokenType.TEXT:
                current_objective.append(token.value)
            elif token.type in (TokenType.MATH_INLINE, TokenType.MATH_DISPLAY):
                current_objective.append(f"${token.value}$")
            
            i += 1
        
        return objectives
    
    def _extract_devotional(self, tokens: List[Token]) -> Optional[Dict]:
        """
        Extract chapter-level devotional (before first section).
        """
        for i, token in enumerate(tokens):
            if token.type == TokenType.COMMAND and token.value == "section":
                break  # Stop at first section
            if token.type == TokenType.ENV_BEGIN and token.value == "devotional":
                return self._extract_devotional_env(tokens, i)
        return None
    
    def _extract_devotional_env(self, tokens: List[Token], start: int) -> Optional[Dict]:
        """
        Extract devotional environment content.
        """
        token = tokens[start]
        title = token.args[0] if token.args else ""
        scripture = token.args[1] if token.args and len(token.args) > 1 else ""
        
        # Collect body text
        body_parts = []
        i = start + 1
        while i < len(tokens):
            t = tokens[i]
            if t.type == TokenType.ENV_END and t.value == "devotional":
                break
            if t.type == TokenType.TEXT:
                body_parts.append(t.value)
            elif t.type in (TokenType.MATH_INLINE, TokenType.MATH_DISPLAY):
                body_parts.append(f"${t.value}$")
            i += 1
        
        return {
            "title": title,
            "scripture": scripture,
            "content": " ".join(body_parts).strip()
        }
    
    def _extract_content_block(self, tokens: List[Token], start: int, env_name: str, content_type: str) -> Optional[ContentBlock]:
        """
        Extract a content block (definition, theorem, example, etc.)
        """
        token = tokens[start]
        
        # Get title from args or optional
        title = ""
        if token.args:
            title = token.args[0]
        elif token.optional:
            title = token.optional
        
        # Generate ID
        self.counters[content_type] = self.counters.get(content_type, 0) + 1
        block_id = f"{content_type}-{self.counters[content_type]}"
        
        # Collect body text
        body_parts = []
        solution_parts = []
        in_solution = False
        i = start + 1
        depth = 1
        
        while i < len(tokens) and depth > 0:
            t = tokens[i]
            
            if t.type == TokenType.ENV_BEGIN:
                if t.value == env_name:
                    depth += 1
                elif t.value == "solution":
                    in_solution = True
            elif t.type == TokenType.ENV_END:
                if t.value == env_name:
                    depth -= 1
                elif t.value == "solution":
                    in_solution = False
            elif depth > 0:
                text = ""
                if t.type == TokenType.TEXT:
                    text = t.value
                elif t.type == TokenType.MATH_INLINE:
                    text = f"${t.value}$"
                elif t.type == TokenType.MATH_DISPLAY:
                    text = f"$${t.value}$$"
                elif t.type == TokenType.COMMAND:
                    # Handle some common commands
                    if t.value == "textbf" and t.args:
                        text = f"**{t.args[0]}**"
                    elif t.value == "emph" and t.args:
                        text = f"*{t.args[0]}*"
                    elif t.value == "frac" and t.args and len(t.args) >= 2:
                        text = f"$\\frac{{{t.args[0]}}}{{{t.args[1]}}}$"
                
                if text:
                    if in_solution:
                        solution_parts.append(text)
                    else:
                        body_parts.append(text)
            
            i += 1
        
        return ContentBlock(
            type=content_type,
            id=block_id,
            title=title,
            body=" ".join(body_parts).strip(),
            solution=" ".join(solution_parts).strip() if solution_parts else "",
            number=self.counters[content_type]
        )


# Test
if __name__ == "__main__":
    test_latex = r"""
\chapter{Functions and Graphs}

\ifchristian
\begin{devotional}{The Grammar of Creation}{Genesis 1:1}
In the beginning, God created order...
\end{devotional}
\fi

\section{Review of Functions}

\begin{learningobjectives}
\item Use functional notation to evaluate a function
\item Determine the domain and range
\end{learningobjectives}

\marginscripture{The heavens declare the glory of God}{Psalm 19:1}

\begin{atlasdefinition}{Function}
A \textbf{function} $f$ is a rule that assigns each input to exactly one output.
\end{atlasdefinition}

\begin{atlasexample}[Evaluating a Function]
Find $f(3)$ where $f(x) = 2x + 1$.
\begin{solution}
We substitute $x = 3$: $f(3) = 2(3) + 1 = 7$.
\end{solution}
\end{atlasexample}

\section{Domain and Range}

\begin{atlasdefinition}{Domain}
The \textbf{domain} is the set of all valid inputs.
\end{atlasdefinition}
"""
    
    parser = LatexParser()
    extractor = ContentExtractor()
    
    tokens = parser.tokenize(test_latex)
    chapter = extractor.extract_chapter(tokens, 1)
    
    import json
    print(json.dumps(chapter, indent=2))
