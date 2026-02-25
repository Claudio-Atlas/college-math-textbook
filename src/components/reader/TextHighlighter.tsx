import { useState, useEffect, useCallback, useRef } from 'react';

export interface Highlight {
  id: string;
  color: string;
  text: string;
  startOffset: number;
  endOffset: number;
  blockIndex: number;
  timestamp: number;
}

const COLORS = [
  { name: 'yellow', value: 'rgba(250, 204, 21, 0.35)', border: '#FACC15' },
  { name: 'green', value: 'rgba(74, 222, 128, 0.35)', border: '#4ADE80' },
  { name: 'blue', value: 'rgba(96, 165, 250, 0.35)', border: '#60A5FA' },
  { name: 'pink', value: 'rgba(244, 114, 182, 0.35)', border: '#F472B6' },
];

function storageKey(bookId: string, sectionId: string) {
  return `axiom:highlights:${bookId}:${sectionId}`;
}

export function getHighlights(bookId: string, sectionId: string): Highlight[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(storageKey(bookId, sectionId));
    return raw ? JSON.parse(raw) : [];
  } catch { return []; }
}

export function getAllHighlightsForBook(bookId: string): Record<string, Highlight[]> {
  if (typeof window === 'undefined') return {};
  const result: Record<string, Highlight[]> = {};
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key?.startsWith(`axiom:highlights:${bookId}:`)) {
      const sectionId = key.replace(`axiom:highlights:${bookId}:`, '');
      try {
        const highlights = JSON.parse(localStorage.getItem(key) || '[]');
        if (highlights.length > 0) result[sectionId] = highlights;
      } catch { /* skip */ }
    }
  }
  return result;
}

function saveHighlights(bookId: string, sectionId: string, highlights: Highlight[]) {
  localStorage.setItem(storageKey(bookId, sectionId), JSON.stringify(highlights));
}

interface TextHighlighterProps {
  bookId: string;
  sectionId: string;
}

export function TextHighlighter({ bookId, sectionId }: TextHighlighterProps) {
  const [highlights, setHighlights] = useState<Highlight[]>([]);
  const [toolbar, setToolbar] = useState<{ x: number; y: number; text: string; range: Range } | null>(null);
  const toolbarRef = useRef<HTMLDivElement>(null);

  // Load highlights on mount
  useEffect(() => {
    setHighlights(getHighlights(bookId, sectionId));
  }, [bookId, sectionId]);

  // Apply highlights to DOM
  useEffect(() => {
    // Remove old highlight marks
    document.querySelectorAll('mark[data-ax-highlight]').forEach(el => {
      const parent = el.parentNode;
      if (parent) {
        parent.replaceChild(document.createTextNode(el.textContent || ''), el);
        parent.normalize();
      }
    });

    // Apply current highlights
    const readerContent = document.querySelector('.reader-content');
    if (!readerContent) return;

    highlights.forEach(h => {
      try {
        const colorDef = COLORS.find(c => c.name === h.color) || COLORS[0];
        // Find the text in the content
        const walker = document.createTreeWalker(readerContent, NodeFilter.SHOW_TEXT);
        let charCount = 0;
        let node: Text | null;
        
        while ((node = walker.nextNode() as Text)) {
          const nodeLen = node.textContent?.length || 0;
          if (charCount + nodeLen > h.startOffset && charCount < h.endOffset) {
            const localStart = Math.max(0, h.startOffset - charCount);
            const localEnd = Math.min(nodeLen, h.endOffset - charCount);
            
            if (localStart < localEnd) {
              const range = document.createRange();
              range.setStart(node, localStart);
              range.setEnd(node, localEnd);
              
              const mark = document.createElement('mark');
              mark.setAttribute('data-ax-highlight', h.id);
              mark.style.background = colorDef.value;
              mark.style.borderRadius = '2px';
              mark.style.cursor = 'pointer';
              mark.style.padding = '1px 0';
              
              mark.addEventListener('click', () => {
                removeHighlight(h.id);
              });
              
              try {
                range.surroundContents(mark);
              } catch {
                // Range crosses element boundaries, skip
              }
            }
          }
          charCount += nodeLen;
        }
      } catch { /* skip invalid highlights */ }
    });
  }, [highlights]);

  const removeHighlight = useCallback((id: string) => {
    setHighlights(prev => {
      const next = prev.filter(h => h.id !== id);
      saveHighlights(bookId, sectionId, next);
      return next;
    });
  }, [bookId, sectionId]);

  const addHighlight = useCallback((color: string) => {
    if (!toolbar) return;
    
    const readerContent = document.querySelector('.reader-content');
    if (!readerContent) return;

    // Calculate offset from reader content start
    const walker = document.createTreeWalker(readerContent, NodeFilter.SHOW_TEXT);
    let charCount = 0;
    let startOffset = 0;
    let endOffset = 0;
    let node: Text | null;
    const range = toolbar.range;

    while ((node = walker.nextNode() as Text)) {
      if (node === range.startContainer) {
        startOffset = charCount + range.startOffset;
      }
      if (node === range.endContainer) {
        endOffset = charCount + range.endOffset;
        break;
      }
      charCount += node.textContent?.length || 0;
    }

    const highlight: Highlight = {
      id: `hl-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      color,
      text: toolbar.text,
      startOffset,
      endOffset,
      blockIndex: 0,
      timestamp: Date.now(),
    };

    setHighlights(prev => {
      const next = [...prev, highlight];
      saveHighlights(bookId, sectionId, next);
      return next;
    });
    
    window.getSelection()?.removeAllRanges();
    setToolbar(null);
  }, [toolbar, bookId, sectionId]);

  // Listen for text selection
  useEffect(() => {
    function handleMouseUp() {
      setTimeout(() => {
        const selection = window.getSelection();
        if (!selection || selection.isCollapsed || !selection.toString().trim()) {
          setToolbar(null);
          return;
        }

        // Only handle selections within reader content
        const readerContent = document.querySelector('.reader-content');
        if (!readerContent) return;
        
        const anchorNode = selection.anchorNode;
        if (!anchorNode || !readerContent.contains(anchorNode)) {
          setToolbar(null);
          return;
        }

        const range = selection.getRangeAt(0);
        const rect = range.getBoundingClientRect();
        
        setToolbar({
          x: rect.left + rect.width / 2,
          y: rect.top - 10,
          text: selection.toString(),
          range: range.cloneRange(),
        });
      }, 10);
    }

    document.addEventListener('mouseup', handleMouseUp);
    return () => document.removeEventListener('mouseup', handleMouseUp);
  }, []);

  // Close toolbar on scroll or click outside
  useEffect(() => {
    if (!toolbar) return;
    
    function handleScroll() { setToolbar(null); }
    function handleClick(e: MouseEvent) {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target as Node)) {
        // Don't close immediately, let mouseup handler run first
      }
    }
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, [toolbar]);

  if (!toolbar) return null;

  return (
    <div
      ref={toolbarRef}
      className="selection-toolbar toolbar-appear"
      style={{
        position: 'fixed',
        left: toolbar.x,
        top: toolbar.y,
        transform: 'translate(-50%, -100%)',
        zIndex: 100,
        display: 'flex',
        alignItems: 'center',
        gap: 4,
        padding: '6px 10px',
      }}
    >
      {COLORS.map(c => (
        <button
          key={c.name}
          onClick={() => addHighlight(c.name)}
          aria-label={`Highlight ${c.name}`}
          style={{
            width: 24,
            height: 24,
            borderRadius: '50%',
            border: `2px solid ${c.border}`,
            background: c.value,
            cursor: 'pointer',
            padding: 0,
            transition: 'transform 100ms ease-out',
          }}
          onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.2)')}
          onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
        />
      ))}
    </div>
  );
}
