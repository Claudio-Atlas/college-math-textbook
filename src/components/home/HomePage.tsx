/**
 * Homepage component - Book catalog showroom
 * Uses --ax-* design tokens for dark/light mode support.
 */
import { BrandProvider, useBrand } from '../brand/BrandProvider';
import { MarketingNav } from '../marketing/MarketingNav';
import { NeuralNetHero, DescriptionSection } from './NeuralNetHero';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverSlug?: string;
  chapters: number;
  available: boolean;
}

const CATALOG: Book[] = [
  {
    id: 'pre-algebra',
    title: 'Pre-Algebra',
    subtitle: 'Building Mathematical Foundations',
    description: 'A comprehensive foundation from whole numbers through polynomials and graphing — everything students need to enter Algebra 1 with confidence.',
    coverSlug: 'pre-algebra',
    chapters: 12,
    available: false,
  },
  {
    id: 'algebra-1',
    title: 'Algebra 1',
    subtitle: 'Core Algebraic Thinking',
    description: 'From real numbers through linear equations, inequalities, graphing, systems of equations, polynomials, factoring, quadratics, functions, exponentials, and statistics.',
    coverSlug: 'algebra-1',
    chapters: 12,
    available: false,
  },
  {
    id: 'geometry',
    title: 'Geometry',
    subtitle: 'Reasoning and Spatial Thinking',
    description: 'Foundations of proof, parallel and perpendicular lines, congruence, similarity, right triangle trigonometry, circles, area, volume, and transformations.',
    coverSlug: 'geometry',
    chapters: 12,
    available: false,
  },
  {
    id: 'algebra-2',
    title: 'Algebra 2',
    subtitle: 'Advanced Algebraic Concepts',
    description: 'Equations, linear systems, quadratic and polynomial functions, radicals, exponentials, logarithms, rational functions, sequences, probability, trigonometry, and conics.',
    coverSlug: 'algebra-2',
    chapters: 12,
    available: false,
  },
  {
    id: 'precalculus',
    title: 'Precalculus',
    subtitle: 'With Applications',
    description: 'A comprehensive bridge from algebra to calculus, covering functions, trigonometry, and analytical foundations. Build genuine understanding and prepare for success in calculus.',
    coverSlug: 'precalculus',
    chapters: 11,
    available: true,
  },
  {
    id: 'vol1',
    title: 'Calculus Volume 1',
    subtitle: 'Differential Calculus',
    description: 'A rigorous yet accessible introduction to differential calculus, covering limits, continuity, derivatives, and their applications.',
    coverSlug: 'calculus-vol1',
    chapters: 6,
    available: false,
  },
  {
    id: 'vol2',
    title: 'Calculus Volume 2',
    subtitle: 'Integral Calculus',
    description: 'Integral calculus, techniques of integration, applications of integrals, and an introduction to infinite series.',
    coverSlug: 'calculus-vol2',
    chapters: 5,
    available: false,
  },
  {
    id: 'vol3',
    title: 'Calculus Volume 3',
    subtitle: 'Multivariable Calculus',
    description: 'Multivariable functions, partial derivatives, multiple integrals, and vector calculus.',
    coverSlug: 'calculus-vol3',
    chapters: 6,
    available: false,
  },
  {
    id: 'diff-eq',
    title: 'Elementary Differential Equations',
    subtitle: 'With Applications',
    description: 'A comprehensive introduction to ordinary differential equations, covering first-order equations, linear systems, series solutions, and real-world applications in physics and engineering.',
    coverSlug: 'diff-eq',
    chapters: 8,
    available: false,
  },
  {
    id: 'college-algebra',
    title: 'College Algebra',
    subtitle: 'With Applications',
    description: 'A thorough foundation in algebraic concepts including functions, polynomials, exponentials, logarithms, and systems of equations. Prepares students for calculus and beyond.',
    coverSlug: 'college-algebra',
    chapters: 10,
    available: false,
  },
];

function HomeContent() {
  const { brand, isAtlas } = useBrand();

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
      <MarketingNav
        links={[
          { href: '#catalog', label: 'Catalog' },
          { href: '#about', label: 'About' },
        ]}
      />

      <main id="main-content">
        {/* Hero — 3D Neural Network Visualization */}
        <NeuralNetHero brand={brand} isAtlas={isAtlas} />

        {/* Description — below hero */}
        <DescriptionSection isAtlas={isAtlas} brandColor={brand.colors.primary} />

        {/* Book Catalog */}
        <section id="catalog" className="py-16" style={{ background: 'var(--ax-surface)' }}>
          <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
            <h2 className="text-3xl font-bold mb-2" style={{ color: 'var(--ax-text)' }}>Our Catalog</h2>
            <p className="mb-12" style={{ color: 'var(--ax-text-secondary)' }}>
              {isAtlas 
                ? 'Textbooks crafted with care for the classical educator.'
                : 'Complete math programs with digital textbooks, video lessons, practice problems, and AI tutoring.'
              }
            </p>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {CATALOG.map((book) => (
                <BookCard key={book.id} book={book} brand={brand} isAtlas={isAtlas} />
              ))}
            </div>
          </div>
        </section>

        {/* About Section */}
        <section id="about" className="py-16" style={{ background: 'var(--ax-elevated)' }}>
          <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
            <h2 className="text-3xl font-bold mb-6" style={{ color: 'var(--ax-text)' }}>About {brand.name}</h2>
            <p className="text-lg leading-relaxed" style={{ color: 'var(--ax-text-secondary)' }}>
              {isAtlas ? (
                <>We believe mathematics is one of the great languages through which we 
                understand God's creation. Our textbooks combine rigorous mathematical 
                content with the beauty and wonder that drew the great mathematicians 
                of history to their life's work. Each chapter weaves together clear 
                exposition, thoughtful problems, and reflections on the deeper meaning 
                of mathematical truth.</>
              ) : (
                <>Meridian Math provides complete mathematics programs, not just textbooks. 
                Each course includes a digital textbook, video walkthroughs, thousands of 
                auto-graded practice problems, and a personal AI tutor that adapts to every 
                student. Built by educators with real classroom experience, our programs are 
                designed to meet students where they are and give teachers the real-time data 
                they need to help every learner succeed.</>
              )}
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer style={{ background: 'var(--ax-surface)', borderTop: '1px solid var(--ax-border)' }} className="py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div style={{ color: 'var(--ax-text-muted)' }}>
              © 2026 {brand.name}. All rights reserved.
            </div>
            <div className="flex gap-6">
              {[
                { label: 'Contact', href: 'mailto:contact@onyxenterprises.org' },
                { label: 'Privacy', href: '/privacy' },
                { label: 'Terms', href: '/terms' },
              ].map(({ label, href }) => (
                <a
                  key={label}
                  href={href}
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

interface BookCardProps {
  book: Book;
  brand: ReturnType<typeof useBrand>['brand'];
  isAtlas: boolean;
}

function BookCard({ book, brand, isAtlas }: BookCardProps) {
  const editionFolder = isAtlas ? 'atlas' : 'meridian';
  const coverImage = book.coverSlug ? `/covers/${editionFolder}/${book.coverSlug}.png` : null;
  
  const getMeridianCropPosition = () => {
    if (book.id === 'pre-algebra') return 'center 40%';
    if (book.id === 'algebra-1') return 'center 40%';
    if (book.id === 'geometry') return 'center 48%';
    if (book.id === 'algebra-2') return 'center 55%';
    if (book.id === 'college-algebra') return 'center 50%';
    if (book.id === 'calculus-vol3') return 'center 57%';
    return 'center 60%';
  };

  const getAtlasCropPosition = () => {
    if (book.id === 'college-algebra') return 'center 56%';
    if (book.id === 'diff-eq') return 'center 56%';
    return 'center 50%';
  };

  return (
    <a 
      href={`/catalog/${book.id}`} 
      className="block overflow-hidden transition-all"
      style={{ 
        background: 'var(--ax-surface)', 
        borderRadius: 'var(--ax-card-radius)',
        border: '1px solid var(--ax-border)',
        transition: 'border-color 150ms ease-out, box-shadow 150ms ease-out',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = 'var(--ax-violet)';
        e.currentTarget.style.boxShadow = '0 4px 16px rgba(139, 92, 246, 0.1)';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = 'var(--ax-border)';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Cover Image */}
      <div className="h-48 flex items-center justify-center" style={{ background: 'var(--ax-elevated)' }}>
        {coverImage ? (
          <img 
            src={coverImage} 
            alt={`${book.title} cover`}
            className="w-full h-full object-cover"
            style={{ objectPosition: isAtlas ? getAtlasCropPosition() : getMeridianCropPosition() }}
          />
        ) : (
          <div className="text-center p-4">
            <svg 
              className="w-16 h-16 mx-auto mb-2" 
              fill="none" 
              stroke={brand.colors.primary}
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path 
                strokeLinecap="round" 
                strokeLinejoin="round" 
                strokeWidth={1.5} 
                d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" 
              />
            </svg>
            <span className="text-sm" style={{ color: 'var(--ax-text-muted)' }}>Cover coming soon</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold" style={{ color: 'var(--ax-text)' }}>{book.title}</h3>
          {!book.available && (
            <span className="text-xs px-2 py-1 rounded-full" style={{ 
              background: 'var(--ax-ex-bg)', 
              color: 'var(--ax-ex-accent)' 
            }}>
              Coming Soon
            </span>
          )}
        </div>
        
        {book.subtitle && (
          <p className="text-sm font-medium mb-3" style={{ color: 'var(--ax-text-muted)' }}>{book.subtitle}</p>
        )}
        
        <p className="text-sm mb-4 line-clamp-3" style={{ color: 'var(--ax-text-secondary)' }}>
          {book.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm" style={{ color: 'var(--ax-text-muted)' }}>
            {book.chapters} chapters
          </span>
          
          <span
            className="inline-flex items-center px-4 py-2 rounded-full text-white text-sm font-medium transition-all"
            style={{
              background: 'rgba(139,92,246,0.15)',
              border: '1px solid rgba(139,92,246,0.4)',
              backdropFilter: 'blur(4px)',
              letterSpacing: '0.03em',
            }}
          >
            Learn More
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </div>
    </a>
  );
}

interface HomePageProps {
  /** Override edition: 'atlas' or 'meridian' */
  forceEdition?: 'atlas' | 'meridian';
}

export function HomePage({ forceEdition }: HomePageProps) {
  return (
    <BrandProvider forceEdition={forceEdition}>
      <HomeContent />
    </BrandProvider>
  );
}
