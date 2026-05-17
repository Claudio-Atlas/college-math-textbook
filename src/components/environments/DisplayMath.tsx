/**
 * DisplayMath
 *
 * Renders a single typeset display-math equation via MathJax. The block
 * is opt-in: the rest of the textbook's prose deliberately bypasses
 * MathJax because dollar signs in MAT-144 content are usually currency,
 * not math delimiters. DisplayMath blocks are reserved for the small set
 * of central formulas (slope, percent, amortization, compound interest,
 * sample SD, expected value, etc.) where proper typesetting noticeably
 * improves readability for a 100-level reader.
 *
 * The `latex` field carries the formula body without surrounding
 * delimiters — the component wraps it in \[ ... \] before handing to
 * MathJax, which is configured (see MathJaxProvider.tsx) to use \[...\]
 * for display math and \(...\) for inline math.
 *
 * An optional `label` renders as a small uppercase eyebrow above the
 * formula, useful for naming the formula ("Amortization formula",
 * "Future value of an annuity", etc.).
 */
import * as BetterReactMathJax from 'better-react-mathjax';
const { MathJax } = BetterReactMathJax;

interface DisplayMathProps {
  id?: string;
  latex: string;
  label?: string;
}

export function DisplayMath({ id, latex, label }: DisplayMathProps) {
  return (
    <div id={id} className="env-display-math my-6">
      {label && (
        <div
          className="env-display-math-label text-xs font-semibold tracking-widest uppercase mb-2"
          style={{ color: 'var(--ax-ex-accent)' }}
        >
          {label}
        </div>
      )}
      <div
        className="env-display-math-body py-3 px-4 rounded"
        style={{
          backgroundColor: 'var(--ax-surface)',
          borderLeft: '3px solid var(--ax-ex-accent)',
          color: 'var(--ax-text)',
          fontSize: '1.15rem',
          overflowX: 'auto',
        }}
      >
        <MathJax dynamic>{`\\[${latex}\\]`}</MathJax>
      </div>
    </div>
  );
}
