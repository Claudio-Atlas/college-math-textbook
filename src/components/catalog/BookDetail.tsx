/**
 * Book detail page - Shows full description, TOC, and preview button
 */
import { BrandProvider, useBrand } from '../brand/BrandProvider';
import { Logo } from '../brand/Logo';

interface Section {
  id: string;
  number: number;
  title: string;
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
  subtitle?: string;
  description?: string;
  chapters: Chapter[];
}

interface BookDetailProps {
  book: Book;
  bookId: string;
}

function BookDetailContent({ book, bookId }: BookDetailProps) {
  const { brand } = useBrand();

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link for Accessibility */}
      <a 
        href="#main-content" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:bg-gray-900 focus:text-white focus:px-4 focus:py-2"
      >
        Skip to main content
      </a>

      {/* Header */}
      <header className="bg-white shadow-sm">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <a href="/">
              <Logo size="md" />
            </a>
            <a 
              href="/"
              className="text-gray-600 hover:text-gray-900 flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Catalog
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section 
          className="py-12 sm:py-16"
          style={{ backgroundColor: brand.colors.primaryLight }}
        >
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row gap-8 items-start">
            {/* Cover placeholder */}
            <div 
              className="w-full md:w-48 h-64 rounded-lg shadow-lg flex items-center justify-center flex-shrink-0"
              style={{ backgroundColor: brand.colors.primary }}
            >
              <svg 
                className="w-20 h-20 text-white opacity-50" 
                fill="none" 
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path 
                  strokeLinecap="round" 
                  strokeLinejoin="round" 
                  strokeWidth={1.5} 
                  d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
                />
              </svg>
            </div>

            {/* Book info */}
            <div className="flex-1">
              <h1 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-2">
                {book.title}
              </h1>
              <p className="text-lg text-gray-600 mb-6">
                {book.chapters.length} chapters · {
                  book.chapters.reduce((acc, ch) => acc + ch.sections.length, 0)
                } sections
              </p>
              
              <a
                href={`/${bookId}/ch01/sec01`}
                className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors"
                style={{ backgroundColor: brand.colors.primary }}
              >
                Start Reading
                <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </section>

      {/* Table of Contents */}
      <section className="py-12 sm:py-16">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-2xl font-bold text-gray-900 mb-8">Table of Contents</h2>
          
          <div className="space-y-6">
            {book.chapters.map((chapter) => (
              <div key={chapter.id} className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
                {/* Chapter header */}
                <div 
                  className="px-6 py-4 font-semibold text-white"
                  style={{ backgroundColor: brand.colors.primary }}
                >
                  Chapter {chapter.number}: {chapter.title}
                </div>
                
                {/* Sections */}
                <div className="divide-y divide-gray-100">
                  {chapter.sections.map((section) => (
                    <a
                      key={section.id}
                      href={`/${bookId}/${chapter.id}/${section.id}`}
                      className="flex items-center px-6 py-3 hover:bg-gray-50 transition-colors"
                    >
                      <span className="text-gray-400 font-mono text-sm w-12">
                        {chapter.number}.{section.number}
                      </span>
                      <span className="text-gray-700">{section.title}</span>
                      <svg 
                        className="ml-auto w-4 h-4 text-gray-400" 
                        fill="none" 
                        stroke="currentColor" 
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                      </svg>
                    </a>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-8">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center text-gray-400">
          © 2025 {brand.name}. All rights reserved.
        </div>
      </footer>
    </div>
  );
}

export function BookDetail({ book, bookId }: BookDetailProps) {
  return (
    <BrandProvider>
      <BookDetailContent book={book} bookId={bookId} />
    </BrandProvider>
  );
}
