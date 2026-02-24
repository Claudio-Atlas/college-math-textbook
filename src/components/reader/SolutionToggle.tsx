import { useState, useRef, useEffect, type ReactNode } from 'react';

interface SolutionToggleProps {
  children: ReactNode;
}

export function SolutionToggle({ children }: SolutionToggleProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [height, setHeight] = useState(0);
  const contentRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (contentRef.current) {
      setHeight(contentRef.current.scrollHeight);
    }
  }, [children, isOpen]);

  const expandDuration = 250;
  const collapseDuration = 200;
  const materialCurve = 'cubic-bezier(0.4, 0, 0.2, 1)';

  return (
    <div style={{ marginTop: 16 }}>
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 8,
          padding: '8px 0',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif',
          color: 'var(--ax-text-secondary, #9496A1)',
          transition: 'color 150ms ease-out',
        }}
        className="ax-solution-toggle-btn"
        aria-expanded={isOpen}
      >
        <span
          style={{
            display: 'inline-block',
            fontSize: 10,
            transition: `transform 200ms ease-out`,
            transform: isOpen ? 'rotate(90deg)' : 'rotate(0deg)',
          }}
          className="ax-solution-chevron"
        >
          ▶
        </span>
        {isOpen ? 'Hide Solution' : 'Show Solution'}
      </button>

      <div
        style={{
          overflow: 'hidden',
          transition: `height ${isOpen ? expandDuration : collapseDuration}ms ${materialCurve}`,
          height: isOpen ? height : 0,
        }}
      >
        <div
          ref={contentRef}
          style={{
            opacity: isOpen ? 1 : 0,
            transition: isOpen
              ? `opacity 180ms ease-out ${80}ms`
              : `opacity 100ms ease-out`,
            paddingTop: 4,
            paddingBottom: 8,
          }}
        >
          {children}
        </div>
      </div>

      <style>{`
        .ax-solution-toggle-btn:hover {
          color: #8B5CF6 !important;
        }
        .ax-solution-toggle-btn:hover .ax-solution-chevron {
          transform: ${isOpen ? 'rotate(90deg)' : 'rotate(0deg) translateX(2px)'} !important;
        }
      `}</style>
    </div>
  );
}
