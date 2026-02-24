import { useState, useEffect, useRef, useCallback } from 'react';

export interface SearchSection {
  chapterNumber: number;
  chapterTitle: string;
  sectionNumber: number;
  sectionTitle: string;
  slug: string;
  bookId: string;
}

interface SearchModalProps {
  sections: SearchSection[];
  isOpen: boolean;
  onClose: () => void;
  onNavigate: (slug: string) => void;
}

function fuzzyMatch(query: string, text: string): boolean {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  let qi = 0;
  for (let ti = 0; ti < t.length && qi < q.length; ti++) {
    if (t[ti] === q[qi]) qi++;
  }
  return qi === q.length;
}

function scoreMatch(query: string, text: string): number {
  const q = query.toLowerCase();
  const t = text.toLowerCase();
  if (t.startsWith(q)) return 3;
  if (t.includes(q)) return 2;
  return 1; // fuzzy only
}

export function SearchModal({ sections, isOpen, onClose, onNavigate }: SearchModalProps) {
  const [query, setQuery] = useState('');
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  const results = query.trim()
    ? sections
        .filter(s => {
          const text = `${s.chapterNumber}.${s.sectionNumber} ${s.sectionTitle} ${s.chapterTitle}`;
          return fuzzyMatch(query.trim(), text);
        })
        .sort((a, b) => {
          const textA = `${a.chapterNumber}.${a.sectionNumber} ${a.sectionTitle}`;
          const textB = `${b.chapterNumber}.${b.sectionNumber} ${b.sectionTitle}`;
          return scoreMatch(query.trim(), textB) - scoreMatch(query.trim(), textA);
        })
        .slice(0, 12)
    : [];

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  useEffect(() => {
    if (isOpen) {
      setQuery('');
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [isOpen]);

  // Cmd+K / Ctrl+K global listener
  useEffect(() => {
    function handleGlobalKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        if (isOpen) onClose();
        // Parent handles opening via the same shortcut
      }
    }
    document.addEventListener('keydown', handleGlobalKey);
    return () => document.removeEventListener('keydown', handleGlobalKey);
  }, [isOpen, onClose]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    } else if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(i => Math.min(i + 1, results.length - 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(i => Math.max(i - 1, 0));
    } else if (e.key === 'Enter' && results[selectedIndex]) {
      onNavigate(results[selectedIndex].slug);
      onClose();
    }
  }, [results, selectedIndex, onClose, onNavigate]);

  if (!isOpen) return null;

  return (
    <div
      ref={backdropRef}
      onClick={(e) => { if (e.target === backdropRef.current) onClose(); }}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 100,
        display: 'flex',
        alignItems: 'flex-start',
        justifyContent: 'center',
        paddingTop: '20vh',
        backgroundColor: 'rgba(0, 0, 0, 0.5)',
        backdropFilter: 'blur(4px)',
        animation: 'ax-fade-in 180ms cubic-bezier(0.32, 0.72, 0, 1)',
      }}
    >
      <div
        style={{
          width: '100%',
          maxWidth: 480,
          margin: '0 1rem',
          background: 'var(--ax-glass, rgba(28, 29, 36, 0.85))',
          backdropFilter: 'blur(20px) saturate(180%)',
          border: '1px solid var(--ax-border, rgba(255,255,255,0.08))',
          borderRadius: 14,
          overflow: 'hidden',
          boxShadow: '0 24px 48px rgba(0,0,0,0.4)',
          animation: 'ax-slide-up 180ms cubic-bezier(0.32, 0.72, 0, 1)',
        }}
      >
        {/* Search input */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--ax-border, rgba(255,255,255,0.08))' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--ax-text-secondary, #9496A1)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="11" cy="11" r="8" /><line x1="21" y1="21" x2="16.65" y2="16.65" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Search sections..."
              style={{
                flex: 1,
                background: 'transparent',
                border: 'none',
                outline: 'none',
                color: 'var(--ax-text, #EDEDF0)',
                fontSize: 16,
                fontFamily: 'Inter, system-ui, sans-serif',
              }}
            />
            <kbd style={{
              padding: '2px 6px',
              borderRadius: 4,
              background: 'rgba(255,255,255,0.06)',
              border: '1px solid var(--ax-border, rgba(255,255,255,0.08))',
              color: 'var(--ax-text-muted, #5D5F6B)',
              fontSize: 11,
              fontFamily: 'Inter, system-ui, sans-serif',
            }}>ESC</kbd>
          </div>
        </div>

        {/* Results */}
        {results.length > 0 && (
          <div style={{ maxHeight: 360, overflowY: 'auto', padding: '8px 0' }}>
            {results.map((s, i) => (
              <button
                key={`${s.chapterNumber}.${s.sectionNumber}`}
                onClick={() => { onNavigate(s.slug); onClose(); }}
                onMouseEnter={() => setSelectedIndex(i)}
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  width: '100%',
                  padding: '10px 16px',
                  border: 'none',
                  background: i === selectedIndex ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 100ms ease-out',
                }}
              >
                <span style={{
                  color: i === selectedIndex ? '#8B5CF6' : 'var(--ax-text, #EDEDF0)',
                  fontSize: 14,
                  fontWeight: 500,
                  fontFamily: 'Inter, system-ui, sans-serif',
                }}>
                  §{s.chapterNumber}.{s.sectionNumber} {s.sectionTitle}
                </span>
                <span style={{
                  color: 'var(--ax-text-muted, #5D5F6B)',
                  fontSize: 12,
                  fontFamily: 'Inter, system-ui, sans-serif',
                  marginTop: 2,
                }}>
                  Chapter {s.chapterNumber}: {s.chapterTitle}
                </span>
              </button>
            ))}
          </div>
        )}

        {query.trim() && results.length === 0 && (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--ax-text-muted, #5D5F6B)',
            fontSize: 14,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            No sections found
          </div>
        )}

        {!query.trim() && (
          <div style={{
            padding: '24px 16px',
            textAlign: 'center',
            color: 'var(--ax-text-muted, #5D5F6B)',
            fontSize: 13,
            fontFamily: 'Inter, system-ui, sans-serif',
          }}>
            Type to search sections...
          </div>
        )}
      </div>

      <style>{`
        @keyframes ax-fade-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes ax-slide-up {
          from { opacity: 0; transform: translateY(-8px) scale(0.98); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
      `}</style>
    </div>
  );
}
