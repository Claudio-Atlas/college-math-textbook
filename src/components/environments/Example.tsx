import { useState, useRef, useEffect } from 'react';
import { RichText } from '../reader/RichText';

interface ExampleProps {
  id: string;
  number?: string;
  title?: string;
  problem: string;
  solution: string;
}

export function Example({ id, number, title, problem, solution }: ExampleProps) {
  const [showSolution, setShowSolution] = useState(false);
  const solutionRef = useRef<HTMLDivElement>(null);
  const [height, setHeight] = useState(0);

  useEffect(() => {
    if (solutionRef.current) {
      setHeight(solutionRef.current.scrollHeight);
    }
  }, [showSolution, solution]);

  return (
    <div id={id} className="env-box env-example">
      <div className="env-label">
        Example {number}
      </div>
      {title && (
        <div className="env-title">{title}</div>
      )}

      {/* Problem */}
      <div className="mb-4" style={{ color: 'var(--ax-text)' }}>
        <RichText text={problem} />
      </div>

      {/* Solution toggle */}
      {solution && (
        <>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className={`solution-toggle text-sm font-medium flex items-center gap-1 ${showSolution ? 'open' : ''}`}
            style={{ color: 'var(--ax-ex-accent)' }}
          >
            <span className="chevron text-lg">▶</span>
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </button>

          <div
            ref={solutionRef}
            style={{
              maxHeight: showSolution ? `${height}px` : '0px',
              overflow: 'hidden',
              transition: 'max-height 250ms ease-out',
            }}
          >
            <div className="mt-4 pt-4" style={{ borderTop: '1px solid var(--ax-border)' }}>
              <div className="text-sm font-semibold mb-2" style={{ color: 'var(--ax-ex-accent)' }}>Solution</div>
              <div style={{ color: 'var(--ax-text)' }}>
                <RichText text={solution} />
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
