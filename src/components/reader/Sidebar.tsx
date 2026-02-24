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
  
  const [expandedChapters, setExpandedChapters] = useState<Set<number>>(() => {
    const initial = new Set<number>();
    if (currentChapter) initial.add(currentChapter);
    return initial;
  });

  const toggleChapter = (chapterNum: number) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterNum)) next.delete(chapterNum);
      else next.add(chapterNum);
      return next;
    });
  };

  const togglePanel = (panel: Panel) => {
    setActivePanel(prev => prev === panel ? null : panel);
  };

  return (
    <div className="flex h-full">
      {/* Icon Rail — dark */}
      <div className="w-14 flex-shrink-0 flex flex-col items-center py-4 gap-1"
           style={{ background: '#0F0F14', borderRight: '1px solid #2A2A3A' }}>
        
        {/* Contents */}
        <button
          onClick={() => togglePanel('contents')}
          className={`
            flex flex-col items-center justify-center w-11 h-14 rounded-lg
            text-[11px] font-medium transition-all
            ${activePanel === 'contents' 
              ? 'bg-violet-600/20 text-violet-400' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }
          `}
          aria-expanded={activePanel === 'contents'}
          aria-controls="contents-panel"
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M4 6h16M4 10h16M4 14h16M4 18h16" />
          </svg>
          <span>Contents</span>
        </button>

        {/* Highlights */}
        <button
          onClick={() => togglePanel('highlights')}
          className={`
            flex flex-col items-center justify-center w-11 h-14 rounded-lg
            text-[11px] font-medium transition-all
            ${activePanel === 'highlights' 
              ? 'bg-violet-600/20 text-violet-400' 
              : 'text-gray-500 hover:text-gray-300 hover:bg-white/5'
            }
          `}
          aria-expanded={activePanel === 'highlights'}
          aria-controls="highlights-panel"
        >
          <svg className="w-5 h-5 mb-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
              d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
          </svg>
          <span>Notes</span>
        </button>
      </div>

      {/* Expandable Panel — dark */}
      <div 
        className={`
          overflow-hidden transition-all duration-300 ease-in-out
          ${activePanel ? 'w-72' : 'w-0'}
        `}
        style={{ background: '#0F0F14', borderRight: activePanel ? '1px solid #2A2A3A' : 'none' }}
      >
        {/* Contents Panel */}
        <div 
          id="contents-panel"
          className={`h-full flex flex-col ${activePanel === 'contents' ? '' : 'hidden'}`}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2A2A3A' }}>
            <h2 className="font-semibold text-white text-sm">Table of Contents</h2>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 text-gray-500 hover:text-white rounded transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <nav className="flex-1 overflow-y-auto py-2" aria-label="Table of Contents">
            <ul>
              {book.chapters.map((chapter) => {
                const isExpanded = expandedChapters.has(chapter.number);
                const isCurrentChapter = chapter.number === currentChapter;

                return (
                  <li key={chapter.id}>
                    <button
                      onClick={() => toggleChapter(chapter.number)}
                      className={`
                        w-full text-left px-4 py-2 flex items-start gap-2
                        transition-colors text-sm
                        ${isCurrentChapter 
                          ? 'bg-violet-600/10' 
                          : 'hover:bg-white/5'
                        }
                      `}
                      aria-expanded={isExpanded}
                    >
                      <span className="mt-0.5 text-gray-600 flex-shrink-0">
                        <svg 
                          className={`w-3 h-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                          fill="currentColor" 
                          viewBox="0 0 20 20"
                          aria-hidden="true"
                        >
                          <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                        </svg>
                      </span>
                      <span className="flex-1 min-w-0">
                        <span className={`font-semibold ${isCurrentChapter ? 'text-violet-400' : 'text-gray-300'}`}>
                          {chapter.number}
                        </span>
                        <span className="ml-2 text-gray-400">
                          {chapter.title}
                        </span>
                      </span>
                    </button>

                    <ul className={`overflow-hidden transition-all duration-200 ${isExpanded ? 'max-h-[1000px]' : 'max-h-0'}`}>
                      <li>
                        <a
                          href={`/${book.id}/${chapter.id}`}
                          className="block pl-9 pr-4 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
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
                                block pl-9 pr-4 py-1.5 text-sm transition-colors
                                ${isCurrent 
                                  ? 'bg-violet-600 text-white font-medium rounded-r-lg mr-2' 
                                  : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
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
                      
                      <li>
                        <a
                          href={`/${book.id}/${chapter.id}/review`}
                          className="block pl-9 pr-4 py-1.5 text-sm text-gray-500 hover:text-gray-300 hover:bg-white/5 transition-colors"
                        >
                          Chapter Review
                        </a>
                      </li>
                    </ul>
                  </li>
                );
              })}
            </ul>
          </nav>
        </div>

        {/* Highlights/Notes Panel */}
        <div 
          id="highlights-panel"
          className={`h-full flex flex-col ${activePanel === 'highlights' ? '' : 'hidden'}`}
        >
          <div className="flex items-center justify-between px-4 py-3" style={{ borderBottom: '1px solid #2A2A3A' }}>
            <h2 className="font-semibold text-white text-sm">Notes & Highlights</h2>
            <button
              onClick={() => setActivePanel(null)}
              className="p-1 text-gray-500 hover:text-white rounded transition-colors"
              aria-label="Close"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="flex-1 flex items-center justify-center p-6 text-center">
            <div>
              <div className="w-12 h-12 mx-auto mb-3 rounded-full bg-violet-600/10 flex items-center justify-center">
                <svg className="w-6 h-6 text-violet-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} 
                    d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
              </div>
              <p className="text-sm text-gray-400">No highlights yet</p>
              <p className="text-xs mt-1 text-gray-600">Select text to highlight</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
