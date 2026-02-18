import * as BetterReactMathJax from 'better-react-mathjax';
const { MathJaxContext } = BetterReactMathJax;
import type { ReactNode } from 'react';

interface MathJaxProviderProps {
  children: ReactNode;
}

// MathJax configuration optimized for textbook content
const mathJaxConfig = {
  loader: { 
    load: ['[tex]/ams', '[tex]/newcommand', '[tex]/mathtools'] 
  },
  tex: {
    packages: { '[+]': ['ams', 'newcommand', 'mathtools'] },
    inlineMath: [['$', '$']],
    displayMath: [['$$', '$$']],
    processEscapes: true,
    processEnvironments: true,
    // Custom macros for Atlas textbooks
    macros: {
      // Common sets
      R: '\\mathbb{R}',
      N: '\\mathbb{N}',
      Z: '\\mathbb{Z}',
      Q: '\\mathbb{Q}',
      C: '\\mathbb{C}',
      // Absolute value
      abs: ['\\left|#1\\right|', 1],
      // Vectors
      vec: ['\\mathbf{#1}', 1],
      // Differentials (used 385+ times in Vol 1)
      dx: '\\,\\mathrm{d}x',
      dt: '\\,\\mathrm{d}t',
      du: '\\,\\mathrm{d}u',
      dv: '\\,\\mathrm{d}v',
      dy: '\\,\\mathrm{d}y',
      dd: ['\\,\\mathrm{d}#1', 1],
      // Derivative notation (used 35+ times)
      deriv: ['\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}', 2],
      // Definite integral shorthand (used 34+ times)
      defint: ['\\int_{#1}^{#2}', 2],
      // Partial derivatives
      pdv: ['\\frac{\\partial #1}{\\partial #2}', 2],
      // Limits (used 34+ times for limto, 24+ for limtozero)
      limto: ['\\lim_{#1}', 1],
      limtozero: ['\\lim_{#1 \\to 0}', 1],
      limtoinf: '\\lim_{n\\to\\infty}',
      // Evaluation bar (e.g., F(x)|_a^b)
      eval: ['\\bigg\\rvert_{#1}', 1],
    },
  },
  svg: {
    fontCache: 'global',
  },
  options: {
    enableMenu: true,
    menuOptions: {
      settings: {
        assistiveMml: true,  // Accessibility
        collapsible: true,
        explorer: true,      // Math explorer for a11y
      },
    },
  },
};

export function MathJaxProvider({ children }: MathJaxProviderProps) {
  return (
    <MathJaxContext config={mathJaxConfig} version={3}>
      {children}
    </MathJaxContext>
  );
}
