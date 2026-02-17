import { useState } from 'react';
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
  
  return (
    <div id={id} className="env-box env-example">
      <div className="env-label text-atlas-warm">
        Example {number}
      </div>
      {title && (
        <div className="env-title text-atlas-deep">{title}</div>
      )}
      
      {/* Problem */}
      <div className="text-atlas-text mb-4">
        <RichText text={problem} />
      </div>
      
      {/* Solution toggle */}
      {solution && (
        <>
          <button
            onClick={() => setShowSolution(!showSolution)}
            className="text-sm font-medium text-atlas-warm hover:text-atlas-warm/80 flex items-center gap-1"
          >
            <span className="text-lg">{showSolution ? '▼' : '▶'}</span>
            {showSolution ? 'Hide Solution' : 'Show Solution'}
          </button>
          
          {showSolution && (
            <div className="mt-4 pt-4 border-t border-atlas-warm/20">
              <div className="text-sm font-semibold text-atlas-warm mb-2">Solution</div>
              <div className="text-atlas-text">
                <RichText text={solution} />
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}
