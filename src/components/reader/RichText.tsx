import { useEffect, useRef } from 'react';

interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with inline math and markdown-style formatting.
 * Math is rendered by MathJax (loaded globally).
 */
export function RichText({ text, className = '' }: RichTextProps) {
  const ref = useRef<HTMLSpanElement>(null);
  
  useEffect(() => {
    // Trigger MathJax typesetting when content changes
    if (ref.current && window.MathJax?.typesetPromise) {
      window.MathJax.typesetPromise([ref.current]).catch((err: Error) => 
        console.error('MathJax error:', err)
      );
    }
  }, [text]);
  
  // Convert markdown-style formatting to HTML
  const processText = (input: string): string => {
    let result = input;
    
    // Bold: **text** -> <strong>text</strong>
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');
    
    // Italic: *text* -> <em>text</em> (but not inside math)
    // Be careful not to match $...$ 
    result = result.replace(/(?<!\$)\*([^*$]+)\*(?!\$)/g, '<em>$1</em>');
    
    // Code: `text` -> <code>text</code>
    result = result.replace(/`([^`]+)`/g, '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>');
    
    // Line breaks: \n\n -> <br/><br/>
    result = result.replace(/\n\n/g, '<br/><br/>');
    
    return result;
  };
  
  return (
    <span 
      ref={ref}
      className={className}
      dangerouslySetInnerHTML={{ __html: processText(text) }}
    />
  );
}

// Type declaration for MathJax
declare global {
  interface Window {
    MathJax?: {
      typesetPromise?: (elements?: HTMLElement[]) => Promise<void>;
      startup?: {
        defaultPageReady: () => Promise<void>;
      };
    };
  }
}
