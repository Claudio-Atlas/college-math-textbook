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
}

type Panel = 'contents' | 'highlights' | null;

export function Sidebar({ book, currentChapter, currentSection }: SidebarProps) {
  const [activePanel, setActivePanel] = useState<Panel>(null);
  
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

  const togglePanel = (panel: Panel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className="flex h-full">
      {/* Icon Rail - always visible */}
      <div className="w-14 flex-shrink-0 bg-white border-r border-atlas-border flex flex-col items-center py-4 gap-1">
        {/* Contents Button */}
        <button
          onClick={() => togglePanel('contents')}
          className={`
            flex flex-col items-center justify-center w-12 h-14 rounded-lg
            text-xs font-medium transition-colors
            ${activePanel === 'contents' 
              ? 'bg-atlas-teal-light text-atlas-teal-dark' 
              : 'text-atlas-secondary hover:bg-atlas-cream hover:text-atlas-deep'
            }
          `}
          aria-expanded={activePanel === 'contents'}
          aria-controls="contents-panel"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span>Contents</span>
        </button>

        {/* Highlights Button */}
        <button
          onClick={() => togglePanel('highlights')}
          className={`
            flex flex-col items-center justify-center w-12 h-14 rounded-lg
            text-xs font-medium transition-colors
            ${activePanel === 'highlights' 
              ? 'bg-atlas-teal-light text-atlas-teal-dark' 
              : 'text-atlas-secondary hover:bg-atlas-cream hover:text-atlas-deep'
            }
          `}
          aria-expanded={activePanel === 'highlights'}
          aria-controls="highlights-panel"
        >
          <svg className="w-5 h-5 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Highlights</span>
        </button>
      </div>

      {/* Expandable Panel */}
      <div 
        className={`
          bg-white border-r border-atlas-border overflow-hidden
          transition-all duration-300 ease-in-out
          ${activePanel ? 'w-72' : 'w-0'}
        `}
      >
        {/* Contents Panel */}
        <div 
          id="contents-panel"
          className={`h-full flex flex-col ${activePanel === 'contents' ? '' : 'hidden'}`}
        >
          {/* Header with X */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-atlas-border">
            <h2 className="font-semibold text-atlas-deep">Table of contents</h2>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 text-atlas-secondary hover:text-atlas-deep rounded"
              aria-label="Close table of contents"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Chapter List */}
          <nav className="flex-1 overflow-y-auto" aria-label="Table of Contents">
            <ul className="py-2">
              {book.chapters.map((chapter) => {
                const isExpanded = expandedChapters.has(chapter.number);
                const isCurrentChapter = chapter.number === currentChapter;

                return (
                  <li key={chapter.id}>
                    {/* Chapter Header */}
                    <button
                      onClick={() => toggleChapter(chapter.number)}
                      className={`
                        w-full text-left px-4 py-2 flex items-start gap-2
                        hover:bg-atlas-cream transition-colors text-sm
                        ${isCurrentChapter ? 'bg-atlas-teal-light/50' : ''}
                      `}
                      aria-expanded={isExpanded}
                    >
                      {/* Expand/Collapse Icon */}
                      <span className="mt-0.5 text-atlas-secondary flex-shrink-0">
                        <svg 
                          className={`w-3 h-3 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                        >
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>

                      {/* Chapter Number & Title */}
                      <span className="flex-1 min-w-0">
                        <span className={`font-medium ${isCurrentChapter ? 'text-atlas-teal-dark' : 'text-atlas-deep'}`}>
                          {chapter.number}
                        </span>
                        <span className="ml-2 text-atlas-text">
                          {chapter.title}
                        </span>
                      </span>
                    </button>

                    {/* Section List (collapsible) */}
                    <ul
                      className={`
                        overflow-hidden transition-all duration-200
                        ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}
                      `}
                    >
                      {/* Chapter Introduction (if exists) */}
                      <li>
                        <a
                          href={`/${book.id}/${chapter.id}`}
                          className="block pl-9 pr-4 py-1.5 text-sm text-atlas-secondary hover:bg-atlas-cream hover:text-atlas-deep"
                        >
                          Introduction
                        </a>
                      </li>
                      
                      {chapter.sections.map((section) => {
                        const isCurrent = chapter.number === currentChapter && section.number === currentSection;
                        const sectionUrl = `/${book.id}/${chapter.id}/${section.id}`;

                        return (
                          <li key={section.id}>
                            <a
                              href={sectionUrl}
                              className={`
                                block pl-9 pr-4 py-1.5 text-sm
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
                      
                      {/* Chapter Review */}
                      <li>
                        <a
                          href={`/${book.id}/${chapter.id}/review`}
                          className="block pl-9 pr-4 py-1.5 text-sm text-atlas-secondary hover:bg-atlas-cream hover:text-atlas-deep"
                        >
                          <span className="mr-1">▸</span> Chapter Review
                        </a>
                      </li>
                    </ul>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Highlights Panel */}
        <div 
          id="highlights-panel"
          className={`h-full flex flex-col ${activePanel === 'highlights' ? '' : 'hidden'}`}
        >
          {/* Header with X */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-atlas-border">
            <h2 className="font-semibold text-atlas-deep">Highlights</h2>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 text-atlas-secondary hover:text-atlas-deep rounded"
              aria-label="Close highlights"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Empty State */}
          <div className="flex-1 flex items-center justify-center p-6 text-center text-atlas-secondary">
            <div>
              <svg className="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <p className="text-sm">No highlights yet</p>
              <p className="text-xs mt-1">Select text to highlight</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
