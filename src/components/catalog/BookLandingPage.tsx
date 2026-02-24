/**
 * Book Landing Page — marketing/info page for individual books.
 * Uses --ax-* tokens for dark/light mode support.
 * Env box previews use top-accent card style with 14px radius.
 */
import { BrandProvider, useBrand } from '../brand/BrandProvider';
import { MarketingNav } from '../marketing/MarketingNav';
import type { BookLanding } from '../../lib/books';
import React from 'react';

interface BookLandingPageProps {
  book: BookLanding;
}

function BookLandingContent({ book }: BookLandingPageProps) {
  const { brand, isAtlas } = useBrand();
  const editionFolder = isAtlas ? 'atlas' : 'meridian';
  const coverImage = `/covers/${editionFolder}/${book.coverSlug}.png`;

  const totalSections = book.chapters.reduce(
    (acc, ch) => acc + ch.sections.length,
    0
  );

  return (
    <div className="min-h-screen" style={{ background: 'var(--ax-bg)', color: 'var(--ax-text)' }}>
      {/* Skip Link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:top-0 focus:left-0 focus:z-50 focus:px-4 focus:py-2"
        style={{ background: 'var(--ax-violet)', color: '#fff' }}
      >
        Skip to main content
      </a>

      {/* Header — shared MarketingNav component */}
      <MarketingNav backHref="/" backLabel="Back to Catalog" />

      <main id="main-content">
        {/* Hero Section */}
        <section className="py-12 sm:py-20" style={{ background: 'var(--ax-elevated)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
              {/* Cover Image */}
              <div className="w-64 md:w-72 flex-shrink-0">
                <img
                  src={coverImage}
                  alt={`${book.title} cover`}
                  className="w-full shadow-2xl"
                  style={{ borderRadius: 'var(--ax-card-radius)' }}
                />
              </div>

              {/* Book Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl sm:text-5xl font-bold mb-2" style={{ color: 'var(--ax-text)' }}>
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-xl mb-4" style={{ color: 'var(--ax-text-muted)' }}>{book.subtitle}</p>
                )}
                <p className="text-lg mb-2" style={{ color: 'var(--ax-text-secondary)' }}>
                  by <span className="font-medium" style={{ color: 'var(--ax-text)' }}>{book.author.name}</span>
                </p>

                {/* Stats Row */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6 mb-8">
                  <Stat value={`${book.chapters.length}`} label="Chapters" />
                  <Stat value={`${totalSections}`} label="Sections" />
                  {book.pageCount && <Stat value={book.pageCount.toLocaleString()} label="Pages" />}
                  {book.exerciseCount && <Stat value={book.exerciseCount.toLocaleString()} label="Exercises" />}
                  {book.figureCount && <Stat value={`${book.figureCount}+`} label="Figures" />}
                </div>

                <p className="leading-relaxed max-w-2xl mb-8" style={{ color: 'var(--ax-text-secondary)' }}>
                  {book.description}
                </p>

                {/* Preview Section CTA */}
                {book.chapters[0]?.sections[0] && (() => {
                  const ch = book.chapters[0];
                  const sec = ch.sections[0];
                  const chId = `ch${String(ch.number).padStart(2, '0')}`;
                  // Section number may be "1.1" — extract the part after the dot for the URL
                  const secNum = String(sec.number).includes('.') ? String(sec.number).split('.')[1] : String(sec.number);
                  const secId = `sec${secNum.padStart(2, '0')}`;
                  return (
                    <a
                      href={`/${book.id}/${chId}/${secId}`}
                      className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg text-white text-sm font-medium transition-transform active:scale-[0.96]"
                      style={{ backgroundColor: brand.colors.primary }}
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                      </svg>
                      Try Chapter {sec.number}
                    </a>
                  );
                })()}
              </div>
            </div>
          </div>
        </section>

        {/* About the Book */}
        <section className="py-12 sm:py-16" style={{ background: 'var(--ax-surface)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--ax-text)' }}>About This Book</h2>
            <div className="max-w-none">
              {book.longDescription.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-4 leading-relaxed text-lg" style={{ color: 'var(--ax-text-secondary)' }}>{paragraph}</p>
              ))}
            </div>

            {/* Features — top-accent cards */}
            {book.features.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-semibold mb-4" style={{ color: 'var(--ax-text)' }}>Key Features</h3>
                <ul className="grid sm:grid-cols-2 gap-3">
                  {book.features.map((feature, i) => (
                    <li key={i} className="flex items-start gap-3">
                      <svg
                        className="w-5 h-5 mt-0.5 flex-shrink-0"
                        style={{ color: brand.colors.primary }}
                        fill="currentColor"
                        viewBox="0 0 20 20"
                        aria-hidden="true"
                      >
                        <path
                          fillRule="evenodd"
                          d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                          clipRule="evenodd"
                        />
                      </svg>
                      <span style={{ color: 'var(--ax-text-secondary)' }}>{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-12 sm:py-16" style={{ background: 'var(--ax-elevated)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--ax-text)' }}>Table of Contents</h2>

            <div className="space-y-4">
              {book.chapters.map((chapter) => (
                <ChapterAccordion key={chapter.number} chapter={chapter} brand={brand} />
              ))}
            </div>
          </div>
        </section>

        {/* Practice Problems Placeholder */}
        <section className="py-10 sm:py-12" style={{ background: 'var(--ax-surface)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <div
              className="inline-flex flex-col items-center gap-3 px-6 sm:px-8 py-6"
              style={{
                background: 'var(--ax-elevated)',
                borderRadius: 'var(--ax-card-radius)',
                border: '1px solid var(--ax-border)',
              }}
            >
              <div className="flex items-center gap-2">
                <svg className="w-5 h-5" style={{ color: brand.colors.accent }} fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
                <span className="font-semibold" style={{ color: 'var(--ax-text)' }}>Question Bank</span>
              </div>
              <p className="text-sm" style={{ color: 'var(--ax-text-muted)' }}>
                Practice problems with instant feedback — coming soon
              </p>
            </div>
          </div>
        </section>

        {/* Meet the Author */}
        <section className="py-12 sm:py-16" style={{ background: 'var(--ax-surface)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-8" style={{ color: 'var(--ax-text)' }}>Meet the Author</h2>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Author Avatar */}
              <div className="flex-shrink-0 mx-auto md:mx-0">
                <div
                  className="w-32 h-32 rounded-full flex items-center justify-center text-white text-4xl font-bold shadow-lg"
                  style={{ backgroundColor: brand.colors.primary }}
                >
                  {book.author.name
                    .split(' ')
                    .filter(w => w[0] === w[0].toUpperCase() && w !== 'Professor')
                    .map(w => w[0])
                    .join('')}
                </div>
              </div>

              {/* Author Info */}
              <div className="flex-1">
                <h3 className="text-2xl font-bold mb-1" style={{ color: 'var(--ax-text)' }}>
                  {book.author.name}
                </h3>
                <p className="mb-4" style={{ color: 'var(--ax-text-muted)' }}>
                  {book.author.title}
                  {book.author.institution && ` — ${book.author.institution}`}
                </p>

                {/* Fun Fact — hero callout card */}
                {book.author.funFact && (
                  <div
                    className="p-5 mb-6 flex items-start gap-4"
                    style={{
                      background: 'var(--ax-elevated)',
                      borderRadius: 'var(--ax-card-radius)',
                      border: '1px solid var(--ax-border)',
                      borderLeft: `4px solid ${brand.colors.accent}`,
                    }}
                  >
                    <span className="text-3xl flex-shrink-0" aria-hidden="true">🏁</span>
                    <div>
                      <p className="font-bold text-base mb-1" style={{ color: 'var(--ax-text)' }}>
                        Not your average professor
                      </p>
                      <p className="leading-relaxed" style={{ color: 'var(--ax-text-secondary)' }}>
                        {book.author.funFact}
                      </p>
                    </div>
                  </div>
                )}

                <div className="max-w-none mb-6">
                  {book.author.bio.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-3 leading-relaxed" style={{ color: 'var(--ax-text-secondary)' }}>{paragraph}</p>
                  ))}
                </div>

                {/* Credentials */}
                <div>
                  <h4 className="text-sm font-semibold uppercase tracking-wide mb-3" style={{ color: 'var(--ax-text-muted)' }}>
                    Credentials
                  </h4>
                  <ul className="space-y-2">
                    {book.author.credentials.map((cred, i) => (
                      <li key={i} className="flex items-start gap-2" style={{ color: 'var(--ax-text-secondary)' }}>
                        <span style={{ color: brand.colors.primary }} className="mt-1">•</span>
                        {cred}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--ax-surface)', borderTop: '1px solid var(--ax-border)' }} className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div style={{ color: 'var(--ax-text-muted)' }}>
              © {new Date().getFullYear()} {brand.name}. All rights reserved.
            </div>
            <div className="flex gap-6">
              {['Contact', 'Privacy', 'Terms'].map((label) => (
                <a
                  key={label}
                  href="#"
                  className="text-sm transition-colors"
                  style={{ color: 'var(--ax-text-muted)' }}
                  onMouseEnter={(e) => (e.currentTarget.style.color = 'var(--ax-violet)')}
                  onMouseLeave={(e) => (e.currentTarget.style.color = 'var(--ax-text-muted)')}
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}

// ─── Sub-components ─────────────────────────────────────

function Stat({ value, label }: { value: string; label: string }) {
  return (
    <div className="text-center">
      <div className="text-2xl font-bold" style={{ color: 'var(--ax-text)' }}>{value}</div>
      <div className="text-sm" style={{ color: 'var(--ax-text-muted)' }}>{label}</div>
    </div>
  );
}

interface ChapterAccordionProps {
  chapter: { number: number; title: string; sections: { number: string; title: string }[] };
  brand: ReturnType<typeof useBrand>['brand'];
}

function ChapterAccordion({ chapter, brand }: ChapterAccordionProps) {
  const [open, setOpen] = React.useState(false);

  return (
    <div style={{
      background: 'var(--ax-surface)',
      borderRadius: 'var(--ax-card-radius)',
      border: '1px solid var(--ax-border)',
      overflow: 'hidden',
    }}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left transition-colors"
        style={{ transition: 'background 150ms ease-out' }}
        onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.06)')}
        onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
      >
        <div className="flex items-center gap-4">
          <span
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {chapter.number}
          </span>
          <span className="font-semibold" style={{ color: 'var(--ax-text)' }}>{chapter.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm hidden sm:inline" style={{ color: 'var(--ax-text-muted)' }}>
            {chapter.sections.length} sections
          </span>
          <svg
            className={`w-5 h-5 transition-transform ${open ? 'rotate-180' : ''}`}
            style={{ color: 'var(--ax-text-muted)' }}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>

      {open && (
        <div style={{ borderTop: '1px solid var(--ax-border)' }}>
          {chapter.sections.map((section) => (
            <div
              key={section.number}
              className="flex items-center px-6 py-3 chapter-toc-item transition-colors"
              style={{ transition: 'background 150ms ease-out' }}
              onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(139, 92, 246, 0.04)')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              <span className="font-mono text-sm w-14" style={{ color: 'var(--ax-text-muted)' }}>{section.number}</span>
              <span style={{ color: 'var(--ax-text-secondary)' }}>{section.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export function BookLandingPage({ book }: BookLandingPageProps) {
  return (
    <BrandProvider>
      <BookLandingContent book={book} />
    </BrandProvider>
  );
}
