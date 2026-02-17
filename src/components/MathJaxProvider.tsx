import { MathJaxContext } from 'better-react-mathjax';
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
      abs: ['\\left|#1\\right|', 1],
      R: '\\mathbb{R}',
      N: '\\mathbb{N}',
      Z: '\\mathbb{Z}',
      Q: '\\mathbb{Q}',
      C: '\\mathbb{C}',
      vec: ['\\mathbf{#1}', 1],
      dd: ['\\,\\mathrm{d}#1', 1],
      dv: ['\\frac{\\mathrm{d}#1}{\\mathrm{d}#2}', 2],
      pdv: ['\\frac{\\partial #1}{\\partial #2}', 2],
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
