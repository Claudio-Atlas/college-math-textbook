import { useState } from 'react';
import { RichText } from '../reader/RichText';

interface ExerciseProps {
  id?: string;
  number?: string;
  problem?: string;
  content?: string;
  hint?: string;
  variant?: 'regular' | 'starred' | 'conceptual' | 'error';
  challenging?: boolean;
  bookId?: string;
  chapterSection?: string; // e.g. "1.1"
}

export function Exercise({
  id,
  number,
  problem,
  content,
  hint,
  variant = 'regular',
  challenging = false,
  bookId,
  chapterSection,
}: ExerciseProps) {
  const [hintOpen, setHintOpen] = useState(false);
  const text = problem || content || '';
  const num = parseInt(number || '0', 10);
  const isOdd = num % 2 === 1;

  // Heuristic: span both columns for long exercises (word problems, multi-part)
  const isLong = text.length > 200 || text.includes('\\begin{') || (text.match(/\([a-z]\)/g)?.length ?? 0) >= 2;

  return (
    <div id={id} className={`exercise-card${isLong ? ' exercise-card-wide' : ''}`}>
      <div className="exercise-card-inner">
        <span className="exercise-badge">{number || '?'}</span>
        <div className="exercise-body">
          <div className="exercise-tags">
            {(challenging || variant === 'starred') && (
              <span className="exercise-tag exercise-tag-starred">⭐ Challenge</span>
            )}
            {variant === 'conceptual' && (
              <span className="exercise-tag exercise-tag-conceptual">💭 Conceptual</span>
            )}
            {variant === 'error' && (
              <span className="exercise-tag exercise-tag-error">🔍 Find the Error</span>
            )}
          </div>
          <div className="exercise-problem">
            <RichText text={text} />
          </div>
          {hint && (
            <div className="exercise-hint">
              <button
                className="exercise-hint-toggle"
                onClick={() => setHintOpen(!hintOpen)}
                aria-expanded={hintOpen}
              >
                {hintOpen ? '▾ Hide Hint' : '▸ Show Hint'}
              </button>
              {hintOpen && (
                <div className="exercise-hint-content">
                  <RichText text={hint} />
                </div>
              )}
            </div>
          )}
          {isOdd && chapterSection && (
            <a
              href={`/${bookId || 'precalculus'}/answers#ans-${chapterSection}-${number}`}
              className="exercise-answer-link"
            >
              See Answer →
            </a>
          )}
        </div>
      </div>
    </div>
  );
}
