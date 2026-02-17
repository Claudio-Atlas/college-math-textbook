#!/usr/bin/env python3
"""
Inject figure blocks into Ch01 JSON files.
Maps the existing SVGs to their sections based on naming convention.
"""

import json
import os
from pathlib import Path

# Ch01 figure mapping: SVG filename -> (section, figure_id, caption, alt)
FIGURE_DATA = {
    "sec01-mapping-diagram.svg": {
        "section": 1,
        "id": "fig-1.1.1",
        "caption": "A mapping diagram showing a function. Each element in the domain has exactly one arrow pointing to an element in the codomain.",
        "alt": "A mapping diagram with two ovals. The left oval labeled 'Domain' contains elements a, b, c. The right oval labeled 'Codomain' contains elements 1, 2, 3. Arrows connect each domain element to exactly one codomain element, illustrating that every input maps to exactly one output."
    },
    "sec01-absolute-value.svg": {
        "section": 1,
        "id": "fig-1.1.2", 
        "caption": "The graph of the absolute value function $f(x) = |x|$.",
        "alt": "A V-shaped graph of the absolute value function. The graph has a vertex at the origin, with the left branch going up and to the left with slope -1, and the right branch going up and to the right with slope 1."
    },
    "sec01-vertical-line-test.svg": {
        "section": 1,
        "id": "fig-1.1.3",
        "caption": "The vertical line test. A curve represents a function if and only if every vertical line intersects it at most once.",
        "alt": "Two graphs side by side. The left graph shows a curve that passes the vertical line test - a dashed vertical line crosses it only once. The right graph shows a circle that fails the test - a vertical line crosses it twice."
    },
    "sec02-linear-functions.svg": {
        "section": 2,
        "id": "fig-1.2.1",
        "caption": "Linear functions with different slopes.",
        "alt": "A coordinate plane showing several straight lines passing through different points. Each line has a different slope, demonstrating positive, negative, zero, and undefined slopes."
    },
    "sec02-polynomials.svg": {
        "section": 2,
        "id": "fig-1.2.2",
        "caption": "Polynomial functions of various degrees.",
        "alt": "A coordinate plane showing polynomial curves. A quadratic (parabola) opens upward, a cubic has an S-shape, and higher degree polynomials show increasingly complex wave-like behavior."
    },
    "sec02-rational-function.svg": {
        "section": 2,
        "id": "fig-1.2.3",
        "caption": "A rational function with vertical and horizontal asymptotes.",
        "alt": "A graph of a rational function showing two branches. Dashed vertical lines indicate vertical asymptotes where the function is undefined. A dashed horizontal line shows the horizontal asymptote that the function approaches as x goes to infinity."
    },
    "sec02-exponential-functions.svg": {
        "section": 2,
        "id": "fig-1.2.4",
        "caption": "Exponential functions $f(x) = a^x$ for various bases $a$.",
        "alt": "A coordinate plane showing several exponential curves. All pass through the point (0,1). Curves with base greater than 1 increase rapidly to the right, while curves with base between 0 and 1 decrease."
    },
    "sec02-power-functions.svg": {
        "section": 2,
        "id": "fig-1.2.5",
        "caption": "Power functions $f(x) = x^n$ for different values of $n$.",
        "alt": "A coordinate plane showing power functions with different exponents. Even powers produce U-shaped curves symmetric about the y-axis. Odd powers produce S-shaped curves passing through the origin."
    },
    "sec02-trig-preview.svg": {
        "section": 2,
        "id": "fig-1.2.6",
        "caption": "Preview of trigonometric functions.",
        "alt": "A coordinate plane showing the sine and cosine waves oscillating between -1 and 1. The sine curve starts at origin, the cosine curve starts at its maximum value of 1."
    },
    "sec02-log-functions.svg": {
        "section": 2,
        "id": "fig-1.2.7",
        "caption": "Logarithmic functions for various bases.",
        "alt": "A coordinate plane showing logarithm curves. All pass through (1,0). The curves increase slowly, with a vertical asymptote at x=0. Different bases produce curves with different rates of growth."
    },
    "sec03-shifts.svg": {
        "section": 3,
        "id": "fig-1.3.1",
        "caption": "Horizontal and vertical shifts of a function.",
        "alt": "A coordinate plane showing an original function curve and its translations. Arrows indicate how adding to x shifts the graph left, subtracting shifts right, adding to y shifts up, and subtracting shifts down."
    },
    "sec03-combined-transformations.svg": {
        "section": 3,
        "id": "fig-1.3.2",
        "caption": "Combined transformations: shifts, reflections, and stretches.",
        "alt": "A coordinate plane showing a base function and several transformed versions. Transformations include vertical stretch, horizontal compression, reflection across axes, and combinations of shifts."
    },
    "sec04-horizontal-line-test.svg": {
        "section": 4,
        "id": "fig-1.4.1",
        "caption": "The horizontal line test determines whether a function is one-to-one.",
        "alt": "Two graphs. The left shows an increasing function that passes the horizontal line test - each horizontal line crosses it at most once. The right shows a parabola that fails - horizontal lines cross it twice."
    },
    "sec04-inverse-graph.svg": {
        "section": 4,
        "id": "fig-1.4.2",
        "caption": "A function and its inverse are reflections across the line $y = x$.",
        "alt": "A coordinate plane showing a function curve and its inverse. The dashed line y=x is the axis of symmetry. Each point (a,b) on the original function corresponds to point (b,a) on the inverse."
    },
    "sec05-unit-circle.svg": {
        "section": 5,
        "id": "fig-1.5.1",
        "caption": "The unit circle with key angles marked.",
        "alt": "A unit circle centered at the origin with radius 1. Key angles are marked at 0, 30, 45, 60, 90 degrees and their radian equivalents. Coordinates for special points are labeled."
    },
    "sec05-reference-triangles.svg": {
        "section": 5,
        "id": "fig-1.5.2",
        "caption": "Reference triangles for common angles.",
        "alt": "Three right triangles showing the special angle relationships. A 30-60-90 triangle with sides 1, sqrt(3), 2. A 45-45-90 triangle with sides 1, 1, sqrt(2). Angles and side ratios are labeled."
    },
    "sec05-sin-cos-graphs.svg": {
        "section": 5,
        "id": "fig-1.5.3",
        "caption": "Graphs of sine and cosine functions.",
        "alt": "Two wave curves on the same coordinate plane. The sine function starts at origin and oscillates between -1 and 1 with period 2π. The cosine function starts at 1 and has the same amplitude and period, shifted left by π/2."
    },
    "sec05-tan-graph.svg": {
        "section": 5,
        "id": "fig-1.5.4",
        "caption": "Graph of the tangent function.",
        "alt": "The tangent function graphed over several periods. Vertical asymptotes occur at odd multiples of π/2. Between asymptotes, the function increases from negative infinity to positive infinity, passing through zero at multiples of π."
    },
}

def inject_figures():
    """Inject figure blocks into Ch01 JSON files."""
    content_dir = Path.home() / "Desktop/Axiom-Reader/src-content/calculus-vol1/ch01"
    
    # Group figures by section
    sections = {}
    for svg_name, data in FIGURE_DATA.items():
        sec_num = data["section"]
        if sec_num not in sections:
            sections[sec_num] = []
        sections[sec_num].append({
            "svg": svg_name,
            **data
        })
    
    # Process each section
    for sec_num, figures in sections.items():
        json_path = content_dir / f"sec{sec_num:02d}.json"
        if not json_path.exists():
            print(f"⚠️ {json_path} not found, skipping")
            continue
            
        with open(json_path, 'r') as f:
            data = json.load(f)
        
        # Check if figures already exist
        existing_figs = [b for b in data.get("content", []) if b.get("type") == "figure"]
        if existing_figs:
            print(f"⚠️ sec{sec_num:02d}.json already has {len(existing_figs)} figures, skipping")
            continue
        
        # Create figure blocks
        fig_blocks = []
        for fig in figures:
            fig_blocks.append({
                "type": "figure",
                "id": fig["id"],
                "src": f"/figures/vol1/ch01/{fig['svg']}",
                "caption": fig["caption"],
                "alt": fig["alt"]
            })
        
        # Append figures to end of content (they'll be placed properly by reference later)
        data["content"].extend(fig_blocks)
        
        # Write back
        with open(json_path, 'w') as f:
            json.dump(data, f, indent=2)
        
        print(f"✅ sec{sec_num:02d}.json: Added {len(fig_blocks)} figures")
    
    print("\n✅ Done! Ch01 figures injected.")

if __name__ == "__main__":
    inject_figures()
