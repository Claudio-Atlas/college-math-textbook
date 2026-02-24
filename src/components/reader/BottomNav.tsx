/**
 * BottomNav — Prev/Next navigation at bottom of content area.
 * Uma spec: both header AND bottom of content area on desktop.
 */

interface NavInfo {
  chapterId: string;
  sectionId: string;
  chapter: number;
  section: number;
  title: string;
}

interface BottomNavProps {
  bookId: string;
  prevSection?: NavInfo | null;
  nextSection?: NavInfo | null;
}

export function BottomNav({ bookId, prevSection, nextSection }: BottomNavProps) {
  if (!prevSection && !nextSection) return null;

  const prevUrl = prevSection ? `/${bookId}/${prevSection.chapterId}/${prevSection.sectionId}` : null;
  const nextUrl = nextSection ? `/${bookId}/${nextSection.chapterId}/${nextSection.sectionId}` : null;

  return (
    <nav
      className="flex items-center justify-between gap-4 mt-12 mb-8 mx-auto"
      style={{ maxWidth: 'var(--ax-content-max, 48rem)', padding: '0 var(--ax-content-px, 2.5rem)' }}
      aria-label="Section navigation"
    >
      {/* Prev */}
      {prevUrl ? (
        <a
          href={prevUrl}
          className="group flex items-center gap-3 rounded-xl px-4 py-3 no-underline"
          style={{
            background: 'var(--ax-card-bg, transparent)',
            border: '1px solid var(--ax-border)',
            borderRadius: 12,
            transition: 'border-color 150ms ease-out',
            flex: '1 1 0',
            maxWidth: '48%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ax-violet)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ax-border)'; }}
        >
          <svg
            className="w-4 h-4 shrink-0 group-hover:-translate-x-[2px] transition-transform duration-150"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ color: 'var(--ax-violet)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--ax-text-muted)', fontFamily: 'Inter, sans-serif' }}>
              Previous
            </div>
            <div className="text-sm font-medium truncate" style={{ color: 'var(--ax-text)', fontFamily: 'Inter, sans-serif' }}>
              {prevSection.chapter}.{prevSection.section} {prevSection.title}
            </div>
          </div>
        </a>
      ) : (
        <div style={{ flex: '1 1 0' }} />
      )}

      {/* Next */}
      {nextUrl ? (
        <a
          href={nextUrl}
          className="group flex items-center justify-end gap-3 rounded-xl px-4 py-3 no-underline text-right"
          style={{
            background: 'var(--ax-card-bg, transparent)',
            border: '1px solid var(--ax-border)',
            borderRadius: 12,
            transition: 'border-color 150ms ease-out',
            flex: '1 1 0',
            maxWidth: '48%',
          }}
          onMouseEnter={(e) => { e.currentTarget.style.borderColor = 'var(--ax-violet)'; }}
          onMouseLeave={(e) => { e.currentTarget.style.borderColor = 'var(--ax-border)'; }}
        >
          <div className="min-w-0">
            <div className="text-[11px] font-semibold uppercase tracking-wider mb-0.5" style={{ color: 'var(--ax-text-muted)', fontFamily: 'Inter, sans-serif' }}>
              Next
            </div>
            <div className="text-sm font-medium truncate" style={{ color: 'var(--ax-text)', fontFamily: 'Inter, sans-serif' }}>
              {nextSection.chapter}.{nextSection.section} {nextSection.title}
            </div>
          </div>
          <svg
            className="w-4 h-4 shrink-0 group-hover:translate-x-[2px] transition-transform duration-150"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
            style={{ color: 'var(--ax-violet)' }}
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </a>
      ) : (
        <div style={{ flex: '1 1 0' }} />
      )}
    </nav>
  );
}
