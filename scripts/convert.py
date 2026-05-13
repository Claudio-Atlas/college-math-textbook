"""
One-shot converter — MAT-144 lesson dicts → Axiom-style JSON content.

Reads the lesson Python dicts from ../routers/public.py (the FastAPI
site is the source of truth) and emits per-section JSON files into
../content/college-math/.

This is the BOOTSTRAP converter. After the first run, the JSON files
in content/college-math/ become the textbook's source of truth and
are edited in place — re-running this script will overwrite them.

────────────────────────────────────────────────────────────────────
Level 1 conversion conventions
────────────────────────────────────────────────────────────────────

The site lesson dicts were authored for an active-learning surface
(cards, collapsible solutions, multiple-choice quick-checks). For
textbook reading we restructure each section:

  1. Hook paragraphs           → opening prose
  2. Big idea heading + lede   → heading + paragraph
  3. Big idea diagram (SVG)    → figure
  4. Primary definition        → inline prose (cm-prose-definition),
                                 NOT a boxed Definition card
  5. Worked example            → inline `cm-worked-example` block,
                                 solution expanded by default (no
                                 collapse), bypasses Example.tsx
  6. Sidebar block (optional)  → quiet callout (Axiom env-tip style)
  7. Application & connection  → closing paragraph(s) under a
                                 horizontal rule; no boxed summary
  8. End of section: Exercises → numbered self-check cards (try-it +
                                 quick-check problems combined),
                                 each with collapsible answer
  9. End of section: Glossary  → compact <dl> of vocab terms

Run from the Textbook/ folder:
    python3 scripts/convert.py
"""
from __future__ import annotations

import json
import sys
import types as _types
from pathlib import Path
from typing import Any

# Make the standalone repo importable so we can read TOPICS directly.
HERE = Path(__file__).resolve().parent
TEXTBOOK_ROOT = HERE.parent
STANDALONE_ROOT = TEXTBOOK_ROOT.parent
sys.path.insert(0, str(STANDALONE_ROOT))

# FastAPI isn't installed in this sandbox, and public.py imports from
# fastapi. Stub out the surface area we need so the import succeeds.
_fastapi = _types.ModuleType("fastapi")
class _APIRouter:
    def __init__(self, *a, **kw): pass
    def get(self, *a, **kw):
        def deco(fn): return fn
        return deco
class _Request: pass
class _HTTPException(Exception):
    def __init__(self, *a, **kw): pass
_fastapi.APIRouter = _APIRouter
_fastapi.Request = _Request
_fastapi.HTTPException = _HTTPException
sys.modules["fastapi"] = _fastapi

_responses = _types.ModuleType("fastapi.responses")
class _HTMLResponse:
    def __init__(self, *a, **kw): pass
class _RedirectResponse:
    def __init__(self, *a, **kw): pass
_responses.HTMLResponse = _HTMLResponse
_responses.RedirectResponse = _RedirectResponse
sys.modules["fastapi.responses"] = _responses

_templating = _types.ModuleType("fastapi.templating")
class _Jinja2Templates:
    def __init__(self, *a, **kw):
        class _Env:
            globals = {}
        self.env = _Env()
    def TemplateResponse(self, *a, **kw): return None
_templating.Jinja2Templates = _Jinja2Templates
sys.modules["fastapi.templating"] = _templating

import routers.public as pub  # noqa: E402


# ─── Helpers ─────────────────────────────────────────────────────────

def _block_id(prefix: str, chapter: int, section: int, n: int) -> str:
    return f"{prefix}-{chapter}.{section}-{n}"


# ─── Hook → opening prose ────────────────────────────────────────────

def _hook_paragraphs(hook: dict | None) -> list[dict]:
    if not hook:
        return []
    return [{"type": "paragraph", "text": p} for p in (hook.get("paragraphs") or [])]


# ─── Big idea → heading + lede + figure + inline definition ──────────

def _big_idea_blocks(bi: dict | None, ch: int, sec: int) -> list[dict]:
    if not bi:
        return []
    out: list[dict] = []
    if bi.get("heading"):
        out.append({"type": "heading", "level": 2, "text": bi["heading"]})
    if bi.get("lede"):
        out.append({"type": "paragraph", "text": bi["lede"]})
    if bi.get("diagram_svg"):
        out.append({
            "type": "figure",
            "id": _block_id("fig", ch, sec, 1),
            "svg": bi["diagram_svg"],
            "caption": bi.get("diagram_caption", ""),
        })
    # Primary definition flows as inline prose, not a boxed card.
    if bi.get("definition_html"):
        out.append({
            "type": "paragraph",
            "text": f'<div class="cm-prose-definition">{bi["definition_html"]}</div>',
        })
    return out


# ─── Worked example → inline cm-worked-example HTML block ────────────

def _worked_example_block(we: dict | None, ch: int, sec: int) -> list[dict]:
    if not we:
        return []
    parts: list[str] = []
    parts.append('<div class="cm-worked-example">')
    parts.append('<div class="cm-worked-example-label">Worked Example</div>')
    if we.get("heading"):
        parts.append(f'<div class="cm-worked-example-title">{we["heading"]}</div>')
    if we.get("lede"):
        parts.append(f'<p>{we["lede"]}</p>')
    if we.get("scenario"):
        parts.append(f'<div class="cm-worked-example-scenario">{we["scenario"]}</div>')
    for i, step in enumerate(we.get("steps") or [], start=1):
        parts.append('<div class="cm-worked-step">')
        parts.append(f'<div class="cm-worked-step-num">{i}</div>')
        parts.append('<div class="cm-worked-step-body">')
        if step.get("title"):
            parts.append(f'<h4>{step["title"]}</h4>')
        if step.get("body"):
            parts.append(step["body"])
        if step.get("math_block"):
            mb = step["math_block"].replace("\n", "<br>")
            parts.append(f'<div class="cm-worked-step-math">{mb}</div>')
        if step.get("annotation"):
            parts.append(f'<div class="cm-worked-step-annot">{step["annotation"]}</div>')
        parts.append('</div>')
        parts.append('</div>')
    parts.append('</div>')
    # Wrap as a single paragraph block (HTML is preserved by RichText).
    return [{"type": "paragraph", "text": "".join(parts)}]


# ─── Sidebar block (optional) → quiet callout ────────────────────────

def _sidebar_block(sb: dict | None, ch: int, sec: int) -> list[dict]:
    if not sb:
        return []
    body = sb.get("body_html") or ""
    if sb.get("math_block"):
        mb = sb["math_block"].replace("\n", "<br>")
        body += f'<div class="cm-worked-step-math">{mb}</div>'
    if sb.get("footnote"):
        body += f'<p style="margin-top:0.75rem;font-size:0.85rem;color:var(--ax-text-secondary);font-style:italic;border-top:1px solid var(--ax-border);padding-top:0.6rem;">{sb["footnote"]}</p>'
    return [{
        "type": "callout",
        "id": _block_id("call", ch, sec, 1),
        "label": sb.get("label", "From the real world"),
        "title": sb.get("heading", ""),
        "content": body,
    }]


# ─── Application & connection → closing prose, no boxed summary ──────

def _appconn_prose(ac: dict | None) -> list[dict]:
    if not ac or not ac.get("body"):
        return []
    body = ac["body"]
    kicker = ac.get("heading", "")
    inner = ""
    if kicker:
        inner += f'<span class="cm-appconn-kicker">{kicker}</span>'
    inner += body
    return [{
        "type": "paragraph",
        "text": f'<div class="cm-appconn-prose">{inner}</div>',
    }]


# ─── Exercises (try-it + quick-check, combined at section end) ───────

def _exercise_card_html(num_label: str, prompt_html: str, answer_html: str) -> str:
    """One numbered self-check exercise card with collapsible answer."""
    return (
        f'<div class="cm-self-check">'
        f'  <div class="cm-self-check-head">'
        f'    <span class="cm-self-check-num">{num_label}</span>'
        f'  </div>'
        f'  <div class="cm-self-check-prompt">{prompt_html}</div>'
        f'  <details>'
        f'    <summary></summary>'
        f'    <div class="cm-answer-body">{answer_html}</div>'
        f'  </details>'
        f'</div>'
    )


def _exercise_section(lesson: dict, ch: int, sec: int) -> list[dict]:
    """Combine try-it problems + quick-check questions into one
    sequentially numbered Exercises block at the end of the section."""
    items_html: list[str] = []
    counter = 1

    # Try-it problems
    for prob in (lesson.get("try_it") or {}).get("problems", []) or []:
        prompt = prob.get("prompt_html") or prob.get("prompt_html_block") or ""
        expected = prob.get("expected")
        success = prob.get("success_html", "")
        answer_parts: list[str] = []
        if expected is not None:
            answer_parts.append(f"<p><strong>Answer:</strong> {expected}</p>")
        if success:
            answer_parts.append(f'<div class="cm-explanation">{success}</div>')
        items_html.append(
            _exercise_card_html(str(counter), prompt, "".join(answer_parts))
        )
        counter += 1

    # Quick-check questions
    for q in (lesson.get("quick_check") or {}).get("questions", []) or []:
        prompt = q.get("prompt_html", "")
        opts = q.get("options") or []
        opt_parts: list[str] = ['<ol class="cm-options" type="A">']
        correct = ""
        for o in opts:
            letter = o.get("letter", "")
            text = o.get("text", "")
            if o.get("correct"):
                correct = letter
            opt_parts.append(f"<li>{text}</li>")
        opt_parts.append("</ol>")
        explanation = q.get("explanation_html", "")
        answer_parts = []
        if correct:
            answer_parts.append(f"<p><strong>Answer:</strong> {correct}</p>")
        if explanation:
            answer_parts.append(f'<div class="cm-explanation">{explanation}</div>')
        full_prompt = prompt + "".join(opt_parts)
        items_html.append(
            _exercise_card_html(str(counter), full_prompt, "".join(answer_parts))
        )
        counter += 1

    if not items_html:
        return []

    out: list[dict] = []
    out.append({"type": "heading", "level": 2, "text": "Exercises"})
    out.append({"type": "paragraph", "text": "".join(items_html)})
    return out


# ─── Glossary (end-of-section <dl>) ──────────────────────────────────

def _glossary_block(bi: dict | None) -> list[dict]:
    vocab = (bi or {}).get("vocab") or []
    if not vocab:
        return []
    parts: list[str] = ['<div class="cm-glossary-wrap">']
    parts.append(f'<div class="cm-glossary-heading">{(bi or {}).get("vocab_heading", "Glossary")}</div>')
    parts.append('<dl class="cm-glossary">')
    for v in vocab:
        term = v.get("term", "")
        definition = v.get("definition", "")
        parts.append(f'<dt>{term}</dt>')
        parts.append(f'<dd>{definition}</dd>')
    parts.append('</dl>')
    parts.append('</div>')
    return [{"type": "paragraph", "text": "".join(parts)}]


# ─── Section assembly ────────────────────────────────────────────────

def lesson_to_section_json(topic_num: int, lesson: dict) -> dict | None:
    """Convert one lesson dict into a section.json. Returns None for
    stub lessons (those without big_idea or worked_example)."""
    if not (lesson.get("big_idea") or lesson.get("worked_example")):
        return None

    sec_num = lesson.get("num", 0)
    blocks: list[dict] = []

    # 1. Hook (opening paragraphs)
    blocks.extend(_hook_paragraphs(lesson.get("hook")))

    # 2-4. Big idea heading + lede + figure + inline definition
    blocks.extend(_big_idea_blocks(lesson.get("big_idea"), topic_num, sec_num))

    # 5. Worked example (inline)
    blocks.extend(_worked_example_block(lesson.get("worked_example"), topic_num, sec_num))

    # 6. Optional sidebar block
    blocks.extend(_sidebar_block(lesson.get("sidebar_block"), topic_num, sec_num))

    # 7. Application & connection (closing prose)
    blocks.extend(_appconn_prose(lesson.get("appconn")))

    # 8. Exercises block (try-it + quick-check combined)
    blocks.extend(_exercise_section(lesson, topic_num, sec_num))

    # 9. Per-section glossary intentionally dropped — chapter-level
    # glossary on the chapter page is the canonical reference for
    # vocab terms. Keeping it here would just duplicate.

    return {
        "id": f"college-math-ch{topic_num:02d}-sec{sec_num:02d}",
        "title": lesson.get("title_text", ""),
        "chapter": topic_num,
        "section": sec_num,
        "book": "college-math",
        # Deck = 1-2 sentence section opener. Section.astro renders this
        # as an italic framing line directly under the hero.
        "deck": lesson.get("deck", ""),
        "objectives": [lesson.get("objective", "")] if lesson.get("objective") else [],
        "content": blocks,
    }


# ─── Top-level book builder ──────────────────────────────────────────

def _collect_chapter_glossary(topic: dict) -> list[dict]:
    """Combine vocab terms across all authored lessons in a chapter,
    deduplicated by term name, preserving the first definition seen."""
    seen: dict[str, str] = {}
    for lesson in topic.get("lessons") or []:
        for v in (lesson.get("big_idea") or {}).get("vocab") or []:
            term = (v.get("term") or "").strip()
            if term and term not in seen:
                seen[term] = v.get("definition") or ""
    return [{"term": t, "definition": d} for t, d in seen.items()]


def build_book_json() -> dict:
    chapters: list[dict] = []
    for topic in pub.TOPICS:
        topic_num = topic["num"]
        sections_meta: list[dict] = []
        for lesson in topic.get("lessons") or []:
            if not (lesson.get("big_idea") or lesson.get("worked_example")):
                continue
            sec_num = lesson.get("num", 0)
            sections_meta.append({
                "id": f"sec{sec_num:02d}",
                "number": sec_num,
                "title": lesson.get("title_text", ""),
                "slug": f"sec{sec_num:02d}",
                # Light section meta for chapter page link cards
                "objective": lesson.get("objective", ""),
                "deck": lesson.get("deck", ""),
            })
        if not sections_meta:
            continue
        chapters.append({
            "id": f"ch{topic_num:02d}",
            "number": topic_num,
            "title": topic.get("display_title", topic.get("title", "")),
            # Rich chapter metadata — drives the chapter-intro page.
            "desc": topic.get("desc", ""),
            "intro_html": topic.get("start_blurb", ""),
            "objectives": topic.get("objectives") or [],
            "glossary": _collect_chapter_glossary(topic),
            # Chapter summary / cheat sheet — formula reference card
            # pulled from the source topic's cheat_sheet HTML. Renders
            # on the chapter page as a "Chapter Summary" appendix.
            "summary_html": topic.get("cheat_sheet", ""),
            "sections": sections_meta,
        })
    return {
        "id": "college-math",
        "title": "College Mathematics",
        "subtitle": "A companion textbook",
        "author": "Clayton Ragsdale",
        "chapters": chapters,
    }


def main() -> int:
    out_root = TEXTBOOK_ROOT / "content" / "college-math"
    out_root.mkdir(parents=True, exist_ok=True)

    book = build_book_json()
    (out_root / "book.json").write_text(json.dumps(book, indent=2))
    print(f"  Wrote book.json with {len(book['chapters'])} chapter(s)")

    written = 0
    for topic in pub.TOPICS:
        topic_num = topic["num"]
        for lesson in topic.get("lessons") or []:
            section_json = lesson_to_section_json(topic_num, lesson)
            if section_json is None:
                continue
            sec_num = lesson.get("num", 0)
            ch_dir = out_root / f"ch{topic_num:02d}"
            ch_dir.mkdir(exist_ok=True)
            section_path = ch_dir / f"sec{sec_num:02d}.json"
            # Skip hand-edited (locked) section files. Once a section is
            # manually polished — e.g. Level 3 prose pass — we add
            # "_locked": true at the top of its JSON. The converter
            # honors that and leaves the file alone on subsequent runs.
            if section_path.exists():
                try:
                    existing = json.loads(section_path.read_text())
                    if existing.get("_locked"):
                        print(f"  Skipped ch{topic_num:02d}/sec{sec_num:02d}.json (locked)")
                        continue
                except Exception:
                    pass
            section_path.write_text(json.dumps(section_json, indent=2))
            written += 1
            print(f"  Wrote ch{topic_num:02d}/sec{sec_num:02d}.json ({lesson.get('title_text', '')[:50]}…)")

    print(f"\nDone. {written} sections written to {out_root}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
