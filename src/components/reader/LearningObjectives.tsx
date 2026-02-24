import { useState, useEffect } from 'react';

interface LearningObjectivesProps {
  objectives: string[];
  chapterNumber: number;
  sectionNumber: number;
}

function getStorageKey(ch: number, sec: number): string {
  return `ax-objectives-${ch}.${sec}`;
}

export function LearningObjectives({ objectives, chapterNumber, sectionNumber }: LearningObjectivesProps) {
  const [isOpen, setIsOpen] = useState(() => {
    if (typeof window === 'undefined') return true;
    const key = getStorageKey(chapterNumber, sectionNumber);
    const stored = localStorage.getItem(key);
    // Open by default on first visit, collapsed on return
    if (stored === null) return true;
    return stored === 'open';
  });

  useEffect(() => {
    const key = getStorageKey(chapterNumber, sectionNumber);
    localStorage.setItem(key, isOpen ? 'open' : 'closed');
  }, [isOpen, chapterNumber, sectionNumber]);

  if (!objectives || objectives.length === 0) return null;

  return (
    <div
      style={{
        background: 'var(--ax-elevated, #1C1D24)',
        border: '1px solid var(--ax-border, rgba(255,255,255,0.08))',
        borderTop: '2px solid #8B5CF6',
        borderRadius: 14,
        padding: 0,
        marginBottom: 32,
        backdropFilter: 'blur(12px)',
        boxShadow: '0 4px 16px rgba(0,0,0,0.15), inset 0 1px 0 rgba(255,255,255,0.04)',
        overflow: 'hidden',
      }}
    >
      {/* Header */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          width: '100%',
          padding: '16px 20px',
          border: 'none',
          background: 'transparent',
          cursor: 'pointer',
          fontFamily: 'Inter, system-ui, sans-serif',
        }}
      >
        <span style={{
          fontSize: 14,
          fontWeight: 700,
          color: 'var(--ax-text, #EDEDF0)',
          letterSpacing: '0.02em',
        }}>
          🎯 Learning Objectives
        </span>
        <span style={{
          fontSize: 12,
          color: 'var(--ax-text-muted, #5D5F6B)',
          transition: 'transform 200ms ease-out',
          display: 'inline-block',
        }}>
          {isOpen ? '▾' : '▸'}
        </span>
      </button>

      {/* Content */}
      {isOpen && (
        <div style={{ padding: '0 20px 16px' }}>
          <ol style={{
            margin: 0,
            paddingLeft: 0,
            listStyle: 'none',
            display: 'flex',
            flexDirection: 'column',
            gap: 8,
          }}>
            {objectives.map((obj, i) => (
              <li
                key={i}
                style={{
                  display: 'flex',
                  gap: 10,
                  fontSize: 14,
                  lineHeight: 1.6,
                  color: 'var(--ax-text, #EDEDF0)',
                  fontFamily: '"Source Serif 4", Georgia, serif',
                }}
              >
                <span style={{
                  color: 'var(--ax-text-muted, #5D5F6B)',
                  fontSize: 12,
                  fontWeight: 600,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  minWidth: 32,
                  paddingTop: 2,
                }}>
                  {chapterNumber}.{sectionNumber}.{i + 1}
                </span>
                <span>{obj}</span>
              </li>
            ))}
          </ol>
        </div>
      )}
    </div>
  );
}
