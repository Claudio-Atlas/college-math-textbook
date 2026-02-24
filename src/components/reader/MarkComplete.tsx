/**
 * MarkComplete — Button at section end to mark as completed.
 * Saves to localStorage, integrates with sidebar progress dots.
 */
import { useState, useEffect } from 'react';

interface MarkCompleteProps {
  bookId: string;
  chapterId: string;
  sectionId: string;
  sectionTitle: string;
}

function getStorageKey(bookId: string) {
  return `ax-progress-${bookId}`;
}

function getCompleted(bookId: string): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const data = localStorage.getItem(getStorageKey(bookId));
    return data ? JSON.parse(data) : [];
  } catch { return []; }
}

function setCompleted(bookId: string, sections: string[]) {
  localStorage.setItem(getStorageKey(bookId), JSON.stringify(sections));
}

export function MarkComplete({ bookId, chapterId, sectionId, sectionTitle }: MarkCompleteProps) {
  const key = `${chapterId}/${sectionId}`;
  const [done, setDone] = useState(false);
  const [animating, setAnimating] = useState(false);

  useEffect(() => {
    setDone(getCompleted(bookId).includes(key));
  }, [bookId, key]);

  const toggle = () => {
    const current = getCompleted(bookId);
    let updated: string[];
    if (done) {
      updated = current.filter(k => k !== key);
    } else {
      updated = [...current, key];
      setAnimating(true);
      setTimeout(() => setAnimating(false), 600);
    }
    setCompleted(bookId, updated);
    setDone(!done);
    // Dispatch event for sidebar to pick up
    window.dispatchEvent(new CustomEvent('progress-updated'));
  };

  return (
    <div className="flex justify-center my-8">
      <button
        onClick={toggle}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          padding: '12px 24px',
          borderRadius: 12,
          border: `1px solid ${done ? 'var(--ax-thm-accent)' : 'var(--ax-border)'}`,
          background: done ? 'rgba(52, 211, 153, 0.08)' : 'var(--ax-card-bg, transparent)',
          backdropFilter: 'blur(8px)',
          color: done ? 'var(--ax-thm-accent)' : 'var(--ax-text-secondary)',
          cursor: 'pointer',
          fontFamily: 'Inter, sans-serif',
          fontSize: 14,
          fontWeight: 600,
          transition: 'all 200ms ease-out',
          transform: animating ? 'scale(1.05)' : 'scale(1)',
        }}
      >
        <span style={{
          width: 22,
          height: 22,
          borderRadius: '50%',
          border: `2px solid ${done ? 'var(--ax-thm-accent)' : 'var(--ax-text-muted)'}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'all 200ms ease-out',
          background: done ? 'var(--ax-thm-accent)' : 'transparent',
        }}>
          {done && (
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
              <path d="M20 6L9 17l-5-5" />
            </svg>
          )}
        </span>
        {done ? 'Section Complete' : 'Mark as Complete'}
      </button>
    </div>
  );
}
