import { useState, useEffect, useRef } from 'react';

interface NavInfo {
  chapterId: string;
  sectionId: string;
  chapter: number;
  section: number;
  title: string;
}

interface ReaderHeaderProps {
  bookId: string;
  currentChapter?: number;
  currentSection?: number;
  sectionTitle?: string;
  chapterTitle?: string;
  prevSection?: NavInfo | null;
  nextSection?: NavInfo | null;
}

export function ReaderHeader({
  bookId,
  currentChapter,
  currentSection,
  sectionTitle,
  chapterTitle,
  prevSection,
  nextSection,
}: ReaderHeaderProps) {
  const [scrolled, setScrolled] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  // IntersectionObserver for border appearance after 8px scroll
  useEffect(() => {
    const sentinel = document.createElement('div');
    sentinel.style.cssText = 'position:absolute;top:8px;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 1 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  // Listen for sidebar toggle
  const handleToggle = () => {
    window.dispatchEvent(new CustomEvent('toggle-sidebar'));
  };

  const handleSettings = () => {
    window.dispatchEvent(new CustomEvent('toggle-settings'));
  };

  const prevUrl = prevSection ? `/${bookId}/${prevSection.chapterId}/${prevSection.sectionId}` : null;
  const nextUrl = nextSection ? `/${bookId}/${nextSection.chapterId}/${nextSection.sectionId}` : null;

  return (
    <header
      className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-3 sm:px-4"
      style={{
        height: '48px',
        background: 'var(--ax-glass)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        borderBottom: scrolled ? '1px solid var(--ax-border)' : '1px solid transparent',
        transition: 'border-color 150ms ease-out',
      }}
    >
      {/* Left: TOC toggle */}
      <button
        onClick={handleToggle}
        className="flex items-center justify-center w-9 h-9 rounded-lg shrink-0"
        style={{ transition: 'background 150ms ease-out' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
        aria-label="Toggle table of contents"
      >
        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true" style={{ color: 'var(--ax-text-secondary)' }}>
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
        </svg>
      </button>

      {/* Center: Chapter · Section title */}
      <div className="flex-1 min-w-0 mx-3 text-center">
        <span className="text-sm font-medium truncate block" style={{ color: 'var(--ax-text)' }}>
          {currentChapter != null && (
            <>
              <span style={{ color: 'var(--ax-text-secondary)' }}>
                Ch {currentChapter}{chapterTitle ? `: ${chapterTitle}` : ''}
              </span>
              {sectionTitle && (
                <>
                  <span style={{ color: 'var(--ax-text-muted)', margin: '0 0.4em' }}>·</span>
                  <span>§{currentChapter}.{currentSection} {sectionTitle}</span>
                </>
              )}
            </>
          )}
        </span>
      </div>

      {/* Right: nav + settings */}
      <div className="flex items-center gap-1 shrink-0">
        {/* Prev */}
        {prevUrl ? (
          <a
            href={prevUrl}
            data-nav-prev
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: 'var(--ax-text-secondary)', transition: 'background 150ms ease-out' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label={`Previous: ${prevSection?.title}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </a>
        ) : (
          <span className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--ax-text-muted)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </span>
        )}

        {/* Next */}
        {nextUrl ? (
          <a
            href={nextUrl}
            data-nav-next
            className="flex items-center justify-center w-8 h-8 rounded-lg"
            style={{ color: 'var(--ax-text-secondary)', transition: 'background 150ms ease-out' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
            onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            aria-label={`Next: ${nextSection?.title}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        ) : (
          <span className="w-8 h-8 flex items-center justify-center" style={{ color: 'var(--ax-text-muted)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        )}

        {/* Settings (Aa) */}
        <button
          onClick={handleSettings}
          className="flex items-center justify-center w-8 h-8 rounded-lg ml-1"
          style={{ color: 'var(--ax-text-secondary)', transition: 'background 150ms ease-out' }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
          aria-label="Text settings"
        >
          <span className="text-sm font-semibold" style={{ fontFamily: 'Inter, sans-serif' }}>Aa</span>
        </button>
      </div>
    </header>
  );
}
