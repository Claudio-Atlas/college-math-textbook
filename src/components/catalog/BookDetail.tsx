/**
 * Book detail page - Fallback for books with reader preview but no landing page.
 * Uses --ax-* design tokens for dark/light mode support.
 */
import { BrandProvider, useBrand } from '../brand/BrandProvider';
import { MarketingNav } from '../marketing/MarketingNav';

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
    <div className="min-h-screen" style={{ background: 'var(--ax-bg)', color: 'var(--ax-text)' }}>
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2"
        style={{ background: 'var(--ax-violet)', color: '#fff' }}
      >
        Skip to main content
      </a>

      <MarketingNav backHref="/" backLabel="Back to Catalog" />

      <main id="main-content">
        {/* Hero */}
        <section className="py-12 sm:py-16" style={{ background: 'var(--ax-elevated)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-8 items-start">
              <div
                className="w-full md:w-48 h-64 rounded-lg shadow-lg flex items-center justify-center flex-shrink-0"
                style={{ backgroundColor: brand.colors.primary }}
              >
                <svg className="w-20 h-20 text-white opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                </svg>
              </div>

              <div className="flex-1">
                <h1 className="text-3xl sm:text-4xl font-bold mb-2" style={{ color: 'var(--ax-text)' }}>
                  {book.title}
                </h1>
                <p className="text-lg mb-6" style={{ color: 'var(--ax-text-secondary)' }}>
                  {book.chapters.length} chapters · {book.chapters.reduce((acc, ch) => acc + ch.sections.length, 0)} sections
                </p>

                <a
                  href={`/${bookId}/ch01/sec01`}
                  className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-transform active:scale-[0.96]"
                  style={{ backgroundColor: brand.colors.primary }}
                >
                  Start Reading
                  <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
            <h2 className="text-2xl font-bold mb-8" style={{ color: 'var(--ax-text)' }}>Table of Contents</h2>

            <div className="space-y-4">
              {book.chapters.map((chapter) => (
                <div
                  key={chapter.id}
                  style={{
                    background: 'var(--ax-surface)',
                    borderRadius: 'var(--ax-card-radius)',
                    border: '1px solid var(--ax-border)',
                    overflow: 'hidden',
                  }}
                >
                  <div
                    className="px-6 py-4 font-semibold text-white"
                    style={{ backgroundColor: brand.colors.primary }}
                  >
                    Chapter {chapter.number}: {chapter.title}
                  </div>

                  <div>
                    {chapter.sections.map((section) => (
                      <a
                        key={section.id}
                        href={`/${bookId}/${chapter.id}/${section.id}`}
                        className="flex items-center px-6 py-3 transition-colors"
                        style={{ borderTop: '1px solid var(--ax-border)', transition: 'background 150ms ease-out' }}
                        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.04)')}
                        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                      >
                        <span className="font-mono text-sm w-12" style={{ color: 'var(--ax-text-muted)' }}>
                          {chapter.number}.{section.number}
                        </span>
                        <span style={{ color: 'var(--ax-text-secondary)' }}>{section.title}</span>
                        <svg className="ml-auto w-4 h-4" style={{ color: 'var(--ax-text-muted)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
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
      <footer style={{ background: 'var(--ax-surface)', borderTop: '1px solid var(--ax-border)' }} className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center" style={{ color: 'var(--ax-text-muted)' }}>
          © {new Date().getFullYear()} {brand.name}. All rights reserved.
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
