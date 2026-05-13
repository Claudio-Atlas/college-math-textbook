#!/usr/bin/env python3
"""
One-shot maintenance script.

The Pass 1 rewrites in content/college-math/ch01 and ch02 ship Exercises
with the answer rendered inline as a <p class="cm-tx-answer"> paragraph.
That reveals the answer before the student has tried the question.

This script walks every locked section JSON and wraps each
<p class="cm-tx-answer"> ... </p> in a click-to-reveal <details> block:

    <details class="cm-tx-answer-details">
      <summary>Show answer</summary>
      <p class="cm-tx-answer">...</p>
    </details>

Idempotent — already-wrapped answers are skipped.
"""
from __future__ import annotations

import json
import re
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
CONTENT = ROOT / "content" / "college-math"

ANSWER_OPEN = '<p class="cm-tx-answer">'
WRAP_OPEN = '<details class="cm-tx-answer-details"><summary>Show answer</summary>'
WRAP_CLOSE = '</details>'


def wrap_answers(html: str) -> tuple[str, int]:
    """Wrap every <p class="cm-tx-answer">...</p> in a <details> block.

    Returns (new_html, count_wrapped). Skips paragraphs already inside
    a cm-tx-answer-details block.
    """
    count = 0
    out = []
    i = 0
    while i < len(html):
        # Skip ranges that are already wrapped
        idx = html.find(ANSWER_OPEN, i)
        if idx < 0:
            out.append(html[i:])
            break

        # If the immediately-preceding text already opens our wrapper,
        # this answer is already wrapped — leave it.
        preceding = html[max(0, idx - len(WRAP_OPEN)) : idx]
        if preceding.endswith(WRAP_OPEN):
            out.append(html[i : idx + len(ANSWER_OPEN)])
            i = idx + len(ANSWER_OPEN)
            continue

        # Find the closing </p>. Answers are short single-paragraph blocks.
        end = html.find("</p>", idx)
        if end < 0:
            # malformed — give up cleanly
            out.append(html[i:])
            break
        end += len("</p>")

        out.append(html[i:idx])
        out.append(WRAP_OPEN)
        out.append(html[idx:end])
        out.append(WRAP_CLOSE)
        count += 1
        i = end
    return "".join(out), count


def process_file(path: Path) -> int:
    data = json.loads(path.read_text())
    if not data.get("_locked"):
        return 0
    total = 0
    for block in data.get("content", []):
        text = block.get("text")
        if not isinstance(text, str):
            continue
        if ANSWER_OPEN not in text:
            continue
        new_text, n = wrap_answers(text)
        if n:
            block["text"] = new_text
            total += n
    if total:
        path.write_text(json.dumps(data, indent=2, ensure_ascii=False) + "\n")
    return total


def main() -> int:
    total = 0
    files = sorted(CONTENT.glob("ch*/sec*.json"))
    for p in files:
        n = process_file(p)
        rel = p.relative_to(ROOT)
        if n:
            print(f"  {rel}: wrapped {n} answers")
            total += n
        else:
            print(f"  {rel}: (no change)")
    print(f"\nTotal answers wrapped: {total}")
    return 0


if __name__ == "__main__":
    sys.exit(main())
