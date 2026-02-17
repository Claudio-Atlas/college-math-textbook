"""
LaTeX Parser for Atlas Textbooks

Tokenizes LaTeX content into a stream of tokens for processing.
"""

import re
from dataclasses import dataclass
from typing import List, Optional, Tuple
from enum import Enum


class TokenType(Enum):
    TEXT = "text"
    COMMAND = "command"
    ENV_BEGIN = "env_begin"
    ENV_END = "env_end"
    MATH_INLINE = "math_inline"
    MATH_DISPLAY = "math_display"
    COMMENT = "comment"
    BRACE_OPEN = "brace_open"
    BRACE_CLOSE = "brace_close"
    BRACKET_OPEN = "bracket_open"
    BRACKET_CLOSE = "bracket_close"


@dataclass
class Token:
    type: TokenType
    value: str
    args: List[str] = None  # For commands with arguments
    optional: str = None    # For optional arguments [...]
    line: int = 0


class LatexParser:
    """
    Tokenizes LaTeX source into structured tokens.
    """
    
    # Patterns for tokenization
    PATTERNS = [
        # Comments (must come first)
        (r'%.*$', TokenType.COMMENT),
        # Environment begin
        (r'\\begin\{([^}]+)\}', TokenType.ENV_BEGIN),
        # Environment end
        (r'\\end\{([^}]+)\}', TokenType.ENV_END),
        # Display math $$...$$
        (r'\$\$(.+?)\$\$', TokenType.MATH_DISPLAY),
        # Display math \[...\]
        (r'\\\[(.+?)\\\]', TokenType.MATH_DISPLAY),
        # Inline math $...$
        (r'\$([^$]+?)\$', TokenType.MATH_INLINE),
        # Commands with arguments
        (r'\\([a-zA-Z]+)\*?', TokenType.COMMAND),
        # Braces
        (r'\{', TokenType.BRACE_OPEN),
        (r'\}', TokenType.BRACE_CLOSE),
        (r'\[', TokenType.BRACKET_OPEN),
        (r'\]', TokenType.BRACKET_CLOSE),
    ]
    
    def __init__(self):
        # Compile patterns
        self.compiled_patterns = [
            (re.compile(pattern, re.MULTILINE | re.DOTALL), token_type)
            for pattern, token_type in self.PATTERNS
        ]
    
    def tokenize(self, content: str) -> List[Token]:
        """
        Tokenize LaTeX content into a list of tokens.
        """
        tokens = []
        pos = 0
        line = 1
        
        while pos < len(content):
            # Track line numbers
            line += content[pos:pos+1].count('\n')
            
            # Skip whitespace (but preserve it in text tokens later)
            if content[pos].isspace():
                # Collect whitespace
                ws_start = pos
                while pos < len(content) and content[pos].isspace():
                    if content[pos] == '\n':
                        line += 1
                    pos += 1
                continue
            
            # Try to match patterns
            matched = False
            for pattern, token_type in self.compiled_patterns:
                match = pattern.match(content, pos)
                if match:
                    if token_type == TokenType.COMMENT:
                        # Skip comments
                        pos = match.end()
                        matched = True
                        break
                    elif token_type in (TokenType.ENV_BEGIN, TokenType.ENV_END):
                        # Extract environment name
                        env_name = match.group(1)
                        tokens.append(Token(
                            type=token_type,
                            value=env_name,
                            line=line
                        ))
                        pos = match.end()
                        
                        # Check for optional arguments after \begin{env}
                        if token_type == TokenType.ENV_BEGIN:
                            opt_match = re.match(r'\s*\[([^\]]*)\]', content[pos:])
                            if opt_match:
                                tokens[-1].optional = opt_match.group(1)
                                pos += opt_match.end()
                            
                            # Check for required arguments {arg}
                            args = []
                            while True:
                                arg_match = re.match(r'\s*\{([^}]*)\}', content[pos:])
                                if arg_match:
                                    args.append(arg_match.group(1))
                                    pos += arg_match.end()
                                else:
                                    break
                            if args:
                                tokens[-1].args = args
                        
                        matched = True
                        break
                    elif token_type == TokenType.COMMAND:
                        cmd_name = match.group(1)
                        tokens.append(Token(
                            type=token_type,
                            value=cmd_name,
                            line=line
                        ))
                        pos = match.end()
                        
                        # Check for optional arguments
                        opt_match = re.match(r'\s*\[([^\]]*)\]', content[pos:])
                        if opt_match:
                            tokens[-1].optional = opt_match.group(1)
                            pos += opt_match.end()
                        
                        # Check for required arguments
                        args = []
                        while True:
                            arg_match = re.match(r'\s*\{([^}]*)\}', content[pos:])
                            if arg_match:
                                args.append(arg_match.group(1))
                                pos += arg_match.end()
                            else:
                                break
                        if args:
                            tokens[-1].args = args
                        
                        matched = True
                        break
                    elif token_type in (TokenType.MATH_INLINE, TokenType.MATH_DISPLAY):
                        math_content = match.group(1) if match.lastindex else match.group(0)
                        tokens.append(Token(
                            type=token_type,
                            value=math_content,
                            line=line
                        ))
                        pos = match.end()
                        matched = True
                        break
                    else:
                        tokens.append(Token(
                            type=token_type,
                            value=match.group(0),
                            line=line
                        ))
                        pos = match.end()
                        matched = True
                        break
            
            if not matched:
                # Collect text until next special character
                text_start = pos
                while pos < len(content):
                    ch = content[pos]
                    if ch in '\\$%{}\n' or ch == '[' or ch == ']':
                        break
                    pos += 1
                
                if pos > text_start:
                    text = content[text_start:pos]
                    if text.strip():
                        tokens.append(Token(
                            type=TokenType.TEXT,
                            value=text,
                            line=line
                        ))
                elif pos < len(content):
                    # Single character we couldn't match
                    pos += 1
        
        return tokens
    
    def find_environment(self, tokens: List[Token], env_name: str, start: int = 0) -> Tuple[int, int, List[Token]]:
        """
        Find an environment and return its contents.
        Returns (start_idx, end_idx, content_tokens) or (-1, -1, []) if not found.
        """
        depth = 0
        env_start = -1
        
        for i in range(start, len(tokens)):
            token = tokens[i]
            
            if token.type == TokenType.ENV_BEGIN and token.value == env_name:
                if depth == 0:
                    env_start = i
                depth += 1
            elif token.type == TokenType.ENV_END and token.value == env_name:
                depth -= 1
                if depth == 0:
                    return (env_start, i, tokens[env_start+1:i])
        
        return (-1, -1, [])


# Simple test
if __name__ == "__main__":
    test_latex = r"""
\chapter{Test Chapter}

\begin{atlasdefinition}{Function}
A \textbf{function} $f$ is a rule that assigns...
\end{atlasdefinition}

\begin{atlasexample}[Finding f(3)]
Find $f(3)$ where $f(x) = 2x + 1$.
\begin{solution}
We substitute: $f(3) = 2(3) + 1 = 7$.
\end{solution}
\end{atlasexample}
"""
    
    parser = LatexParser()
    tokens = parser.tokenize(test_latex)
    
    for token in tokens:
        print(f"{token.type.value:15} | {token.value[:50]!r}")
