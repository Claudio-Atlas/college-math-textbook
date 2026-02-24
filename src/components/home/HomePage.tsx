/**
 * Homepage component - Book catalog showroom
 */
import { BrandProvider, useBrand } from '../brand/BrandProvider';
import { Logo } from '../brand/Logo';

interface Book {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  coverSlug?: string; // e.g., 'calculus-vol1' - will be prefixed with edition path
  chapters: number;
  available: boolean;
}

const CATALOG: Book[] = [
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
];

function HomeContent() {
  const { brand, isAtlas } = useBrand();

  return (
    <div className="min-h-screen" style={{ backgroundColor: brand.colors.primaryLight }}>
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
            <Logo size="lg" />
            <nav className="hidden sm:flex items-center gap-6">
              <a href="#catalog" className="text-gray-600 hover:text-gray-900">Catalog</a>
              <a href="#about" className="text-gray-600 hover:text-gray-900">About</a>
            </nav>
          </div>
        </div>
      </header>

      <main id="main-content">
        {/* Hero */}
        <section className="py-16 sm:py-24">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6">
            {brand.tagline}
          </h1>
          <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
            {isAtlas ? (
              <>Mathematics textbooks that honor both truth and beauty. 
              Rigorous content presented with clarity, rooted in the classical tradition.</>
            ) : (
              <>Professional mathematics textbooks designed for clarity and rigor. 
              Clean, accessible content for modern learners.</>
            )}
          </p>
          <a 
            href="#catalog"
            className="inline-flex items-center px-6 py-3 rounded-lg text-white font-medium transition-colors"
            style={{ backgroundColor: brand.colors.primary }}
          >
            Browse Catalog
            <svg className="ml-2 w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </a>
        </div>
      </section>

      {/* Book Catalog */}
      <section id="catalog" className="py-16 bg-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-2">Our Catalog</h2>
          <p className="text-gray-600 mb-12">
            {isAtlas 
              ? 'Textbooks crafted with care for the classical educator.'
              : 'Professional textbooks for modern mathematics education.'
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
      <section id="about" className="py-16" style={{ backgroundColor: brand.colors.primaryLight }}>
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl font-bold text-gray-900 mb-6">About {brand.name}</h2>
          <p className="text-lg text-gray-600 leading-relaxed">
            {isAtlas ? (
              <>We believe mathematics is one of the great languages through which we 
              understand God's creation. Our textbooks combine rigorous mathematical 
              content with the beauty and wonder that drew the great mathematicians 
              of history to their life's work. Each chapter weaves together clear 
              exposition, thoughtful problems, and reflections on the deeper meaning 
              of mathematical truth.</>
            ) : (
              <>We produce high-quality mathematics textbooks focused on clarity, 
              rigor, and accessibility. Our content is designed to meet the needs 
              of diverse learners and institutions, with careful attention to 
              modern pedagogical standards and accessibility requirements. Every 
              textbook undergoes rigorous review to ensure accuracy and effectiveness.</>
            )}
          </p>
        </div>
      </section>
      </main>

      {/* Footer */}
      <footer className="bg-gray-900 text-white py-12">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="text-gray-400">
              © 2025 {brand.name}. All rights reserved.
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

interface BookCardProps {
  book: Book;
  brand: ReturnType<typeof useBrand>['brand'];
  isAtlas: boolean;
}

function BookCard({ book, brand, isAtlas }: BookCardProps) {
  // Construct edition-aware cover path
  const editionFolder = isAtlas ? 'atlas' : 'meridian';
  const coverImage = book.coverSlug ? `/covers/${editionFolder}/${book.coverSlug}.png` : null;
  
  // Per-book thumbnail crop position for Meridian
  const getMeridianCropPosition = () => {
    if (book.id === 'college-algebra') return 'center 50%';
    if (book.id === 'calculus-vol3') return 'center 57%';
    return 'center 60%';
  };

  // Per-book thumbnail crop position for Atlas
  const getAtlasCropPosition = () => {
    if (book.id === 'college-algebra') return 'center 56%';
    if (book.id === 'diff-eq') return 'center 56%';
    return 'center 50%';
  };

  return (
    <a href={`/catalog/${book.id}`} className="block bg-white rounded-xl shadow-md overflow-hidden border border-gray-100 hover:shadow-lg transition-shadow">
      {/* Cover Image Placeholder */}
      <div 
        className="h-48 flex items-center justify-center"
        style={{ backgroundColor: brand.colors.primaryLight }}
      >
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
            <span className="text-sm text-gray-500">Cover coming soon</span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="p-6">
        <div className="flex items-start justify-between mb-2">
          <h3 className="text-xl font-bold text-gray-900">{book.title}</h3>
          {!book.available && (
            <span className="text-xs bg-amber-100 text-amber-700 px-2 py-1 rounded-full">
              Coming Soon
            </span>
          )}
        </div>
        
        {book.subtitle && (
          <p className="text-sm font-medium text-gray-500 mb-3">{book.subtitle}</p>
        )}
        
        <p className="text-gray-600 text-sm mb-4 line-clamp-3">
          {book.description}
        </p>

        <div className="flex items-center justify-between">
          <span className="text-sm text-gray-500">
            {book.chapters} chapters
          </span>
          
          <a
            href={`/catalog/${book.id}`}
            className="inline-flex items-center px-4 py-2 rounded-lg text-white text-sm font-medium transition-colors"
            style={{ backgroundColor: brand.colors.primary }}
          >
            Learn More
            <svg className="ml-1 w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>
      </div>
    </a>
  );
}

export function HomePage() {
  return (
    <BrandProvider>
      <HomeContent />
    </BrandProvider>
  );
}
