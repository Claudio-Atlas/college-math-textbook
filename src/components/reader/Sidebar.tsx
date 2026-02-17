import { useState } from 'react';

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
  currentChapter?: number;
  currentSection?: number;
  onClose?: () => void;
}

export function Sidebar({ book, currentChapter, currentSection, onClose }: SidebarProps) {
  // Initialize with current chapter expanded
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (currentChapter) initial.add(currentChapter);
    return initial;
  });

  const toggleChapter = (chapterNum: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterNum)) {
        next.delete(chapterNum);
      } else {
        next.add(chapterNum);
      }
      return next;
    });
  };

  return (
    <nav 
      className="h-full bg-white border-r border-atlas-border overflow-y-auto"
      aria-label="Table of Contents"
    >
      {/* Book Title */}
      <div className="sticky top-0 bg-white border-b border-atlas-border p-4 z-10">
        <h2 className="font-semibold text-atlas-deep text-lg leading-tight">
          {book.title}
        </h2>
        {onClose && (
          <button
            onClick={onClose}
            className="absolute top-3 right-3 p-2 text-atlas-secondary hover:text-atlas-deep lg:hidden"
            aria-label="Close menu"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}
      </div>

      {/* Chapter List */}
      <ul className="py-2">
        {book.chapters.map((chapter) => {
          const isExpanded = expandedChapters.has(chapter.number);
          const isCurrentChapter = chapter.number === currentChapter;

          return (
            <li key={chapter.id} className="border-b border-atlas-border/50 last:border-b-0">
              {/* Chapter Header */}
              <button
                onClick={() => toggleChapter(chapter.number)}
                className={`
                  w-full text-left px-4 py-3 flex items-start gap-2
                  hover:bg-atlas-cream transition-colors
                  ${isCurrentChapter ? 'bg-atlas-teal-light' : ''}
                `}
                aria-expanded={isExpanded}
                aria-controls={`chapter-${chapter.number}-sections`}
              >
                {/* Expand/Collapse Icon */}
                <span className="mt-0.5 text-atlas-secondary flex-shrink-0">
                  <svg 
                    className={`w-4 h-4 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none" 
                    stroke="currentColor" 
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </span>

                {/* Chapter Number & Title */}
                <span className="flex-1 min-w-0">
                  <span className={`
                    block text-sm font-semibold
                    ${isCurrentChapter ? 'text-atlas-teal-dark' : 'text-atlas-deep'}
                  `}>
                    Chapter {chapter.number}
                  </span>
                  <span className="block text-sm text-atlas-secondary leading-tight mt-0.5">
                    {chapter.title}
                  </span>
                </span>
              </button>

              {/* Section List (collapsible) */}
              <ul
                id={`chapter-${chapter.number}-sections`}
                className={`
                  overflow-hidden transition-all duration-200
                  ${isExpanded ? 'max-h-[1000px] opacity-100' : 'max-h-0 opacity-0'}
                `}
              >
                {chapter.sections.map((section) => {
                  const isCurrent = chapter.number === currentChapter && section.number === currentSection;
                  const sectionUrl = `/${book.id}/${chapter.id}/${section.id}`;

                  return (
                    <li key={section.id}>
                      <a
                        href={sectionUrl}
                        className={`
                          block pl-10 pr-4 py-2 text-sm
                          hover:bg-atlas-cream transition-colors
                          ${isCurrent 
                            ? 'bg-atlas-teal text-white font-medium hover:bg-atlas-teal-dark' 
                            : 'text-atlas-text hover:text-atlas-deep'
                          }
                        `}
                        aria-current={isCurrent ? 'page' : undefined}
                      >
                        <span className="font-medium">{chapter.number}.{section.number}</span>
                        {' '}
                        {section.title}
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
  );
}
