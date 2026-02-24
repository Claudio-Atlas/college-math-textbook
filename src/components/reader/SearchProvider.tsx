/**
 * SearchProvider — Wraps SearchModal with Cmd+K listener and section data.
 * Renders the search modal overlay; mounts once in ReaderLayout.
 */
import { useState, useEffect, useCallback } from 'react';
import { SearchModal, type SearchSection } from './SearchModal';

interface Chapter {
  id: string;
  number: number;
  title: string;
  sections: { id: string; number: number; title: string; slug: string }[];
}

interface Book {
  id: string;
  title: string;
  chapters: Chapter[];
}

interface SearchProviderProps {
  book: Book;
  bookId: string;
}

export function SearchProvider({ book, bookId }: SearchProviderProps) {
  const [isOpen, setIsOpen] = useState(false);

  // Build flat sections list
  const sections: SearchSection[] = book.chapters.flatMap(ch =>
    ch.sections.map(sec => ({
      chapterNumber: ch.number,
      chapterTitle: ch.title,
      sectionNumber: sec.number,
      sectionTitle: sec.title,
      slug: `/${bookId}/${ch.id}/${sec.id}`,
      bookId,
    }))
  );

  // Cmd+K / Ctrl+K global listener
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
    }
    document.addEventListener('keydown', handleKey);
    return () => document.removeEventListener('keydown', handleKey);
  }, []);

  // Also listen for custom event from header search button
  useEffect(() => {
    function handleToggle() {
      setIsOpen(prev => !prev);
    }
    window.addEventListener('toggle-search', handleToggle);
    return () => window.removeEventListener('toggle-search', handleToggle);
  }, []);

  const handleNavigate = useCallback((slug: string) => {
    window.location.href = slug;
  }, []);

  return (
    <SearchModal
      sections={sections}
      isOpen={isOpen}
      onClose={() => setIsOpen(false)}
      onNavigate={handleNavigate}
    />
  );
}
