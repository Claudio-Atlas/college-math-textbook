/**
 * Book Landing Page — marketing/info page for individual books.
 * Shows description, stats, TOC, features, and Meet the Author.
 */
import { BrandProvider, useBrand } from '../brand/BrandProvider';
import { Logo } from '../brand/Logo';
import { MarketingNav } from '../marketing/MarketingNav';
import type { BookLanding } from '../../lib/books';
type AuthorInfo = BookLanding['author'];

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
    <div className="min-h-screen bg-gray-50">
      {/* Skip Link */}
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
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
              </svg>
              Back to Catalog
            </a>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero Section */}
        <section
          className="py-12 sm:py-20"
          style={{ backgroundColor: brand.colors.primaryLight }}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex flex-col md:flex-row gap-10 items-center md:items-start">
              {/* Cover Image */}
              <div className="w-64 md:w-72 flex-shrink-0">
                <img
                  src={coverImage}
                  alt={`${book.title} cover`}
                  className="w-full rounded-lg shadow-2xl"
                />
              </div>

              {/* Book Info */}
              <div className="flex-1 text-center md:text-left">
                <h1 className="text-4xl sm:text-5xl font-bold text-gray-900 mb-2">
                  {book.title}
                </h1>
                {book.subtitle && (
                  <p className="text-xl text-gray-500 mb-4">{book.subtitle}</p>
                )}
                <p className="text-lg text-gray-600 mb-2">
                  by <span className="font-medium text-gray-800">{book.author.name}</span>
                </p>

                {/* Stats Row */}
                <div className="flex flex-wrap justify-center md:justify-start gap-6 mt-6 mb-8">
                  <Stat value={`${book.chapters.length}`} label="Chapters" />
                  <Stat value={`${totalSections}`} label="Sections" />
                  {book.pageCount && <Stat value={book.pageCount.toLocaleString()} label="Pages" />}
                  {book.exerciseCount && <Stat value={book.exerciseCount.toLocaleString()} label="Exercises" />}
                  {book.figureCount && <Stat value={`${book.figureCount}+`} label="Figures" />}
                </div>

                <p className="text-gray-600 leading-relaxed max-w-2xl">
                  {book.description}
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* About the Book */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-6">About This Book</h2>
            <div className="prose prose-lg text-gray-600 max-w-none">
              {book.longDescription.split('\n\n').map((paragraph, i) => (
                <p key={i} className="mb-4 leading-relaxed">{paragraph}</p>
              ))}
            </div>

            {/* Features */}
            {book.features.length > 0 && (
              <div className="mt-10">
                <h3 className="text-xl font-semibold text-gray-900 mb-4">Key Features</h3>
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
                      <span className="text-gray-600">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </section>

        {/* Table of Contents */}
        <section className="py-12 sm:py-16" style={{ backgroundColor: brand.colors.primaryLight }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Table of Contents</h2>

            <div className="space-y-4">
              {book.chapters.map((chapter) => (
                <ChapterAccordion key={chapter.number} chapter={chapter} brand={brand} />
              ))}
            </div>
          </div>
        </section>

        {/* Meet the Author */}
        <section className="py-12 sm:py-16 bg-white">
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-8">Meet the Author</h2>

            <div className="flex flex-col md:flex-row gap-8">
              {/* Author Avatar Placeholder */}
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
                <h3 className="text-2xl font-bold text-gray-900 mb-1">
                  {book.author.name}
                </h3>
                <p className="text-gray-500 mb-4">
                  {book.author.title}
                  {book.author.institution && ` — ${book.author.institution}`}
                </p>

                <div className="prose text-gray-600 max-w-none mb-6">
                  {book.author.bio.split('\n\n').map((paragraph, i) => (
                    <p key={i} className="mb-3 leading-relaxed">{paragraph}</p>
                  ))}
                </div>

                {/* Credentials */}
                <div className="mb-6">
                  <h4 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-3">
                    Credentials
                  </h4>
                  <ul className="space-y-2">
                    {book.author.credentials.map((cred, i) => (
                      <li key={i} className="flex items-start gap-2 text-gray-600">
                        <span style={{ color: brand.colors.primary }} className="mt-1">•</span>
                        {cred}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Fun Fact */}
                {book.author.funFact && (
                  <div
                    className="rounded-lg p-4 border"
                    style={{
                      backgroundColor: brand.colors.primaryLight,
                      borderColor: brand.colors.primary + '30',
                    }}
                  >
                    <p className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-1">
                      Beyond the Classroom
                    </p>
                    <p className="text-gray-600">{book.author.funFact}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-gray-400">
              © {new Date().getFullYear()} {brand.name}. All rights reserved.
            </div>
            <div className="flex gap-6 text-gray-400">
              <a href="#" className="hover:text-white">Contact</a>
              <a href="#" className="hover:text-white">Privacy</a>
              <a href="#" className="hover:text-white">Terms</a>
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
      <div className="text-2xl font-bold text-gray-900">{value}</div>
      <div className="text-sm text-gray-500">{label}</div>
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
    <div className="bg-white rounded-lg shadow-sm border border-gray-100 overflow-hidden">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-6 py-4 text-left hover:bg-gray-50 transition-colors"
      >
        <div className="flex items-center gap-4">
          <span
            className="w-10 h-10 rounded-lg flex items-center justify-center text-white font-bold text-sm flex-shrink-0"
            style={{ backgroundColor: brand.colors.primary }}
          >
            {chapter.number}
          </span>
          <span className="font-semibold text-gray-900">{chapter.title}</span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm text-gray-400 hidden sm:inline">
            {chapter.sections.length} sections
          </span>
          <svg
            className={`w-5 h-5 text-gray-400 transition-transform ${open ? 'rotate-180' : ''}`}
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
        <div className="border-t border-gray-100">
          {chapter.sections.map((section) => (
            <div
              key={section.number}
              className="flex items-center px-6 py-3 hover:bg-gray-50"
            >
              <span className="text-gray-400 font-mono text-sm w-14">{section.number}</span>
              <span className="text-gray-700">{section.title}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// Need React for useState in ChapterAccordion
import React from 'react';

export function BookLandingPage({ book }: BookLandingPageProps) {
  return (
    <BrandProvider>
      <BookLandingContent book={book} />
    </BrandProvider>
  );
}
