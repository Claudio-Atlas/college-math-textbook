#!/usr/bin/env python3
"""
Axiom LaTeX → JSON Pipeline

Converts Atlas LaTeX textbooks to JSON format for the Axiom Web Reader.
"""

import argparse
import json
import os
import re
from pathlib import Path
from typing import Optional
from dataclasses import dataclass, asdict
from parser import LatexParser
from extractor import ContentExtractor

# Paths
TEXTBOOKS_DIR = Path.home() / "Desktop" / "Atlas-Textbooks" / "source"
OUTPUT_DIR = Path.home() / "Desktop" / "axiom-reader" / "content"


def convert_book(book_name: str, chapter: Optional[int] = None):
    """Convert a textbook (or single chapter) to JSON."""
    book_path = TEXTBOOKS_DIR / book_name
    
    if not book_path.exists():
        print(f"❌ Book not found: {book_path}")
        return False
    
    print(f"📚 Converting: {book_name}")
    
    # Create output directory
    output_path = OUTPUT_DIR / book_name
    output_path.mkdir(parents=True, exist_ok=True)
    
    # Find all chapter directories
    chapter_dirs = sorted([
        d for d in book_path.iterdir() 
        if d.is_dir() and d.name.startswith('ch')
    ])
    
    if chapter is not None:
        # Filter to single chapter
        chapter_dirs = [d for d in chapter_dirs if f"ch{chapter:02d}" in d.name or f"ch{chapter}" in d.name]
    
    book_toc = {
        "id": book_name,
        "title": book_name.replace("-", " ").title(),
        "chapters": []
    }
    
    parser = LatexParser()
    extractor = ContentExtractor()
    
    for chapter_dir in chapter_dirs:
        print(f"  📖 Processing: {chapter_dir.name}")
        
        # Find chapter.tex or main file
        chapter_file = chapter_dir / "chapter.tex"
        if not chapter_file.exists():
            # Try alternative names
            tex_files = list(chapter_dir.glob("*.tex"))
            if tex_files:
                chapter_file = tex_files[0]
            else:
                print(f"    ⚠️ No .tex file found in {chapter_dir.name}")
                continue
        
        # Parse the chapter
        with open(chapter_file, 'r', encoding='utf-8') as f:
            latex_content = f.read()
        
        # Extract chapter number from directory name
        ch_match = re.search(r'ch(\d+)', chapter_dir.name)
        ch_num = int(ch_match.group(1)) if ch_match else 0
        
        # Parse and extract content
        tokens = parser.tokenize(latex_content)
        chapter_data = extractor.extract_chapter(tokens, ch_num)
        
        # Write chapter JSON
        ch_output_dir = output_path / f"ch{ch_num:02d}"
        ch_output_dir.mkdir(exist_ok=True)
        
        # Write each section as separate file
        for section in chapter_data.get("sections", []):
            sec_num = section.get("number", 0)
            sec_file = ch_output_dir / f"sec{sec_num:02d}.json"
            with open(sec_file, 'w', encoding='utf-8') as f:
                json.dump(section, f, indent=2, ensure_ascii=False)
            print(f"    ✅ Wrote: {sec_file.name}")
        
        # Add to TOC
        book_toc["chapters"].append({
            "number": ch_num,
            "title": chapter_data.get("title", f"Chapter {ch_num}"),
            "sections": [
                {"number": s["number"], "title": s["title"]} 
                for s in chapter_data.get("sections", [])
            ]
        })
    
    # Write book manifest
    manifest_file = output_path / "book.json"
    with open(manifest_file, 'w', encoding='utf-8') as f:
        json.dump(book_toc, f, indent=2, ensure_ascii=False)
    print(f"  📋 Wrote manifest: {manifest_file}")
    
    print(f"✅ Done: {book_name}")
    return True


def convert_all():
    """Convert all textbooks."""
    books = [
        d.name for d in TEXTBOOKS_DIR.iterdir() 
        if d.is_dir() and not d.name.startswith('.')
        and d.name not in ['shared', 'homework']
    ]
    
    print(f"Found {len(books)} textbooks to convert\n")
    
    for book in sorted(books):
        convert_book(book)
        print()


def main():
    parser = argparse.ArgumentParser(
        description="Convert Atlas LaTeX textbooks to JSON for Axiom Web Reader"
    )
    parser.add_argument(
        "--book", "-b",
        help="Textbook to convert (e.g., college-algebra)"
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
    
    args = parser.parse_args()
    
    if args.list:
        print("Available textbooks:")
        for d in sorted(TEXTBOOKS_DIR.iterdir()):
            if d.is_dir() and not d.name.startswith('.'):
                print(f"  - {d.name}")
        return
    
    if args.all:
        convert_all()
    elif args.book:
        convert_book(args.book, args.chapter)
    else:
        parser.print_help()


if __name__ == "__main__":
    main()
