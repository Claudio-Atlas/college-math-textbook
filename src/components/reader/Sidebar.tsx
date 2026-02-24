import { useState, useEffect, useRef, useCallback } from 'react';

interface Section {
  id: string;
  number: number;
  title: string;
  slug: string;
}

interface Chapter {
  id: string;
  number: number;
  title: string;
  sections: Section[];
}

interface Book {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface SidebarProps {
  book: Book;
  bookId: string;
  currentChapter?: number;
  currentSection?: number;
}

type CompletionStatus = 'done' | 'reading' | 'not-started';

function getCompletionKey(bookId: string, chapterId: string, sectionId: string) {
  return `ax-progress:${bookId}:${chapterId}:${sectionId}`;
}

function getCompletion(bookId: string, chapterId: string, sectionId: string): CompletionStatus {
  try {
    const val = localStorage.getItem(getCompletionKey(bookId, chapterId, sectionId));
    if (val === 'done' || val === 'reading') return val;
  } catch {}
  return 'not-started';
}

function CompletionDot({ status }: { status: CompletionStatus }) {
  if (status === 'done') return <span style={{ color: 'var(--ax-violet, #8B5CF6)' }} title="Completed">●</span>;
  if (status === 'reading') return <span style={{ color: 'var(--ax-violet, #8B5CF6)' }} title="In progress">◐</span>;
  return <span style={{ color: 'var(--ax-text-muted, #5D5F6B)' }} title="Not started">○</span>;
}

const SPRING_CURVE = 'cubic-bezier(0.32, 0.72, 0, 1)';

export function Sidebar({ book, bookId, currentChapter, currentSection }: SidebarProps) {
  const [open, setOpen] = useState(false);
  const [closing, setClosing] = useState(false);
  const panelRef = useRef<HTMLDivElement>(null);

  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (currentChapter) initial.add(currentChapter);
    return initial;
  });

  // Mark current section as "reading" on mount
  useEffect(() => {
    if (!currentChapter || !currentSection) return;
    const ch = book.chapters.find(c => c.number === currentChapter);
    if (!ch) return;
    const sec = ch.sections.find(s => s.number === currentSection);
    if (!sec) return;
    const key = getCompletionKey(bookId, ch.id, sec.id);
    try {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, 'reading');
      }
    } catch {}
  }, [bookId, currentChapter, currentSection, book.chapters]);

  const doClose = useCallback(() => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setClosing(false);
    }, 220);
  }, []);

  // Toggle listener from header
  useEffect(() => {
    const handler = () => {
      if (open) doClose();
      else setOpen(true);
    };
    window.addEventListener('toggle-sidebar', handler);
    return () => window.removeEventListener('toggle-sidebar', handler);
  }, [open, doClose]);

  // Escape key
  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') doClose();
    };
    document.addEventListener('keydown', handler);
    return () => document.removeEventListener('keydown', handler);
  }, [open, doClose]);

  const toggleChapter = (num: number) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(num)) next.delete(num);
      else next.add(num);
      return next;
    });
  };

  if (!open && !closing) return null;

  const isClosing = closing;

  return (
    <div className="fixed inset-0 z-[60]" aria-modal="true" role="dialog">
      {/* Backdrop */}
      <div
        onClick={doClose}
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.4)',
          opacity: isClosing ? 0 : 1,
          transition: `opacity ${isClosing ? '220ms' : '280ms'} ${SPRING_CURVE}`,
        }}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          bottom: 0,
          width: '280px',
          maxWidth: '85vw',
          background: 'var(--ax-glass, rgba(28,29,36,0.7))',
          backdropFilter: 'blur(20px) saturate(180%)',
          WebkitBackdropFilter: 'blur(20px) saturate(180%)',
          borderRight: '1px solid var(--ax-border)',
          transform: isClosing ? 'translateX(-100%)' : 'translateX(0)',
          transition: `transform ${isClosing ? '220ms' : '280ms'} ${SPRING_CURVE}`,
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4" style={{ height: '48px', borderBottom: '1px solid var(--ax-border)' }}>
          <h2 className="font-semibold text-sm" style={{ color: 'var(--ax-text)', fontFamily: 'Inter, sans-serif' }}>
            Contents
          </h2>
          <button
            onClick={doClose}
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: 'var(--ax-text-secondary)', transition: 'background 150ms ease-out' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label="Close sidebar"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* TOC */}
        <nav className="flex-1 overflow-y-auto py-2" aria-label="Table of Contents">
          <ul>
            {book.chapters.map((chapter, ci) => {
              const isExpanded = expandedChapters.has(chapter.number);
              const isCurrentChapter = chapter.number === currentChapter;

              return (
                <li key={chapter.id}>
                  <button
                    onClick={() => toggleChapter(chapter.number)}
                    className="w-full text-left px-4 py-2 flex items-center gap-2 text-sm"
                    style={{
                      background: isCurrentChapter ? 'rgba(139,92,246,0.08)' : 'transparent',
                      transition: 'background 150ms ease-out',
                    }}
                    onMouseEnter={(e) => {
                      if (!isCurrentChapter) e.currentTarget.style.background = 'rgba(255,255,255,0.04)';
                    }}
                    onMouseLeave={(e) => {
                      if (!isCurrentChapter) e.currentTarget.style.background = 'transparent';
                    }}
                    aria-expanded={isExpanded}
                  >
                    <svg
                      className="w-3 h-3 shrink-0"
                      fill="currentColor"
                      viewBox="0 0 20 20"
                      aria-hidden="true"
                      style={{
                        color: 'var(--ax-text-muted)',
                        transform: isExpanded ? 'rotate(90deg)' : 'rotate(0)',
                        transition: 'transform 200ms ease-out',
                      }}
                    >
                      <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                    </svg>
                    <span style={{ color: isCurrentChapter ? 'var(--ax-violet, #8B5CF6)' : 'var(--ax-text-secondary)' }}>
                      <span className="font-semibold">{chapter.number}</span>
                      <span className="ml-1.5" style={{ color: 'var(--ax-text-secondary)' }}>{chapter.title}</span>
                    </span>
                  </button>

                  <ul
                    style={{
                      overflow: 'hidden',
                      maxHeight: isExpanded ? `${chapter.sections.length * 40 + 20}px` : '0',
                      transition: 'max-height 200ms ease-out',
                    }}
                  >
                    {chapter.sections.map((section, si) => {
                      const isCurrent = chapter.number === currentChapter && section.number === currentSection;
                      const sectionUrl = `/${bookId}/${chapter.id}/${section.id}`;
                      const completion = getCompletion(bookId, chapter.id, section.id);

                      return (
                        <li key={section.id}>
                          <a
                            href={sectionUrl}
                            className="flex items-center gap-2 pl-9 pr-4 py-1.5 text-sm"
                            style={{
                              color: isCurrent ? 'var(--ax-violet, #8B5CF6)' : 'var(--ax-text-secondary)',
                              background: isCurrent ? 'rgba(139,92,246,0.12)' : 'transparent',
                              borderLeft: isCurrent ? '2px solid var(--ax-violet, #8B5CF6)' : '2px solid transparent',
                              fontWeight: isCurrent ? 600 : 400,
                              transition: 'all 150ms ease-out',
                            }}
                            onMouseEnter={(e) => {
                              if (!isCurrent) {
                                e.currentTarget.style.background = 'rgba(139,92,246,0.08)';
                                e.currentTarget.style.color = 'var(--ax-text)';
                              }
                            }}
                            onMouseLeave={(e) => {
                              if (!isCurrent) {
                                e.currentTarget.style.background = 'transparent';
                                e.currentTarget.style.color = 'var(--ax-text-secondary)';
                              }
                            }}
                            aria-current={isCurrent ? 'page' : undefined}
                          >
                            <span className="text-xs shrink-0"><CompletionDot status={completion} /></span>
                            <span className="truncate">
                              <span className="font-medium">{chapter.number}.{section.number}</span>
                              {' '}{section.title}
                            </span>
                          </a>
                        </li>
                      );
                    })}
                  </ul>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </div>
  );
}
