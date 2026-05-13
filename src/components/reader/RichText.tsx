interface RichTextProps {
  text: string;
  className?: string;
}

/**
 * Renders inline HTML content for the College Mathematics reader.
 *
 * MAT-144 content uses plain-text formulas in monospaced blocks
 * (e.g. "M = P(r/12) / (1 - (1+r/12)^(-12t))") and NEVER LaTeX
 * math delimiters. Dollar signs in the text are *currency*
 * ("$15/hour", "$90"), not math markers. So this component
 * deliberately does NOT route through MathJax — that produced
 * mangled output where MathJax italicized every word between two
 * currency `$` signs.
 *
 * If we ever need real math rendering on a College Math section,
 * we can detect explicit math delimiters (e.g. `$$...$$`) here and
 * route only those snippets through MathJax.
 */
export function RichText({ text, className = '' }: RichTextProps) {
  // Convert markdown-style formatting to HTML.
  const processText = (input: string): string => {
    let result = input;

    // Bold: **text** -> <strong>text</strong>
    result = result.replace(/\*\*([^*]+)\*\*/g, '<strong>$1</strong>');

    // Italic: *text* -> <em>text</em>
    // Constrained: only when both delimiters are word-adjacent so we
    // don't catch unmatched markdown stars in code spans.
    result = result.replace(/(^|[^*])\*([^*\n]+)\*(?!\*)/g, '$1<em>$2</em>');

    // Code: `text` -> <code>text</code>
    result = result.replace(
      /`([^`]+)`/g,
      '<code class="bg-gray-100 px-1 rounded text-sm">$1</code>'
    );

    // Paragraph line breaks: \n\n -> <br><br>
    result = result.replace(/\n\n/g, '<br/><br/>');

    return result;
  };

  return (
    <span
      className={className}
      dangerouslySetInnerHTML={{ __html: processText(text) }}
    />
  );
}
