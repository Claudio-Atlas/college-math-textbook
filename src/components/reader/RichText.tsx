import * as BetterReactMathJax from 'better-react-mathjax';
const { MathJax } = BetterReactMathJax;

interface RichTextProps {
  text: string;
  className?: string;
}

// Type the MathJax component props
type MathJaxProps = ComponentProps<typeof MathJax>;

/**
 * Renders text with inline math and markdown-style formatting.
 * Uses better-react-mathjax for proper SSR hydration.
 */
export function RichText({ text, className = '' }: RichTextProps) {
  // Convert markdown-style formatting to HTML
  const processText = (input: string): string => {
    let result = input;
    
    // Bold: **text** -> <strong>text</strong>
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* -> <em>text</em> (but not inside math)
    result = result.replace(/(?<!\$)\*([^*$]+)\*(?!\$)/g, '<em>$1</em>');
    
    // Code: `text` -> <code>text</code>
    result = result.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
    
    // Line breaks: \n\n -> <br/><br/>
    result = result.replace(/\n\n/g, '<br/><br/>');
    
    return result;
  };
  
  const processedText = processText(text);
  
  // Check if text contains math ($ or $$)
  const hasMath = /\$/.test(text);
  
  if (hasMath) {
    // For MathJax, we need to render as HTML first, then let MathJax process
    return (
      <MathJax
        dynamic
        hideUntilTypeset="first"
      >
        <span 
          className={className}
          dangerouslySetInnerHTML={{ __html: processedText }}
        />
      </MathJax>
    );
  }
  
  // No math, just render as span
  return (
    <span 
      className={className}
      dangerouslySetInnerHTML={{ __html: processedText }}
    />
  );
}
