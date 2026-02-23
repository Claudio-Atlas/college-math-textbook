/**
 * Book catalog data — landing page info, TOC, and author bios.
 * This is the single source of truth for book detail pages.
 */

export interface Author {
  name: string;
  title: string;
  institution?: string;
  bio: string;
  credentials: string[];
  funFact?: string;
}

export interface SectionInfo {
  number: string;
  title: string;
}

export interface ChapterInfo {
  number: number;
  title: string;
  sections: SectionInfo[];
}

export interface BookLanding {
  id: string;
  title: string;
  subtitle?: string;
  description: string;
  longDescription: string;
  coverSlug: string;
  chapters: ChapterInfo[];
  author: Author;
  features: string[];
  pageCount?: number;
  exerciseCount?: number;
  figureCount?: number;
}

// ─── Authors ────────────────────────────────────────────

const VINCE_FRAZIER: Author = {
  name: 'Professor Vince Frazier',
  title: 'Assistant Professor of Mathematics',
  institution: 'Grand Canyon University',
  bio: `Professor Vince Frazier is an Assistant Professor of Mathematics at Grand Canyon University and the founder of Higher Level Thinking, Inc. He holds Bachelor's degrees in Chemistry, Physics, and Mathematics from Athens State University, and Master's degrees in Mathematics, Chemistry, Materials Science, and Missile Systems Engineering from the University of Alabama in Huntsville — both with Awards & Honors.

With over 330 college credits — including 120+ graduate credits across six disciplines — Professor Frazier has taught 900+ course sections both online and on ground. Before GCU, he taught Math Modeling & Simulation to rocket scientists in Huntsville, Alabama, bringing actual model rockets to class to connect theory with real-world engineering.

His students consistently praise his ability to make complex topics approachable, his engaging teaching style, and his genuine care for their success.`,
  credentials: [
    '3 Bachelor\'s degrees (Chemistry, Physics, Mathematics)',
    '4 Master\'s degrees (Mathematics, Chemistry, Materials Science, Missile Systems Engineering)',
    '900+ course sections taught across 6 disciplines',
    'Published textbook author',
  ],
  funFact: 'When he\'s not teaching, Professor Frazier builds cars for drag racing — he owns 28 cars and trucks, most producing over 1,000 horsepower, with a couple pushing past 2,000 HP.',
};

const CLAYTON: Author = {
  name: 'Clayton Atlas',
  title: 'Mathematics Instructor',
  bio: 'Clayton Atlas is a mathematics instructor and education entrepreneur dedicated to creating rigorous, beautifully designed textbooks that make advanced mathematics accessible to every student.',
  credentials: [
    'Mathematics instructor',
    'Founder, Atlas Classical Press & Meridian Press',
    'Published textbook author',
  ],
};

// ─── Book Catalog ───────────────────────────────────────

export const BOOK_LANDINGS: Record<string, BookLanding> = {
  precalculus: {
    id: 'precalculus',
    title: 'Precalculus',
    subtitle: 'With Applications',
    description: 'A comprehensive bridge from algebra to calculus, covering functions, trigonometry, and analytical foundations.',
    longDescription: `This comprehensive Precalculus textbook is designed to make the transition from algebra to calculus clear, intuitive, and achievable for every student. Built from years of classroom experience, it reflects a core teaching philosophy: meet students where they are, break down complex ideas into manageable steps, and build genuine understanding — not just memorization.

Covering functions, polynomial and rational analysis, exponential and logarithmic behavior, trigonometry in depth, analytic geometry, and sequences and series, this text prepares students thoroughly for success in Calculus and beyond. Every chapter features carefully crafted examples, rich exercise sets ranging from skill-building drills to challenging applications, and clear visual explanations.`,
    coverSlug: 'precalculus',
    pageCount: 1476,
    exerciseCount: 3839,
    figureCount: 212,
    features: [
      'Over 3,800 exercises across all difficulty levels',
      '212 figures and graphs for visual learning',
      'Real-world applications in every chapter',
      'Chapter reviews with comprehensive practice',
      'Designed for both classroom and self-study',
    ],
    author: VINCE_FRAZIER,
    chapters: [
      {
        number: 1,
        title: 'Functions and Graphs',
        sections: [
          { number: '1.1', title: 'Introduction to Functions' },
          { number: '1.2', title: 'Domain and Range' },
          { number: '1.3', title: 'Graphs of Functions' },
          { number: '1.4', title: 'Transformations of Functions' },
          { number: '1.5', title: 'Combining Functions' },
          { number: '1.6', title: 'Inverse Functions' },
        ],
      },
      {
        number: 2,
        title: 'Polynomial Functions',
        sections: [
          { number: '2.1', title: 'Quadratic Functions' },
          { number: '2.2', title: 'Graphs of Polynomial Functions' },
          { number: '2.3', title: 'Polynomial Division' },
          { number: '2.4', title: 'Zeros of Polynomial Functions' },
        ],
      },
      {
        number: 3,
        title: 'Rational Functions',
        sections: [
          { number: '3.1', title: 'Rational Functions and Their Domains' },
          { number: '3.2', title: 'Asymptotes' },
          { number: '3.3', title: 'Graphing Rational Functions' },
          { number: '3.4', title: 'Partial Fraction Decomposition' },
        ],
      },
      {
        number: 4,
        title: 'Exponential Functions',
        sections: [
          { number: '4.1', title: 'Exponential Functions' },
          { number: '4.2', title: 'The Natural Exponential Function' },
          { number: '4.3', title: 'Applications of Exponential Functions' },
        ],
      },
      {
        number: 5,
        title: 'Logarithmic Functions',
        sections: [
          { number: '5.1', title: 'Logarithmic Functions' },
          { number: '5.2', title: 'Properties of Logarithms' },
          { number: '5.3', title: 'Exponential and Logarithmic Equations' },
        ],
      },
      {
        number: 6,
        title: 'Trigonometric Functions',
        sections: [
          { number: '6.1', title: 'Angles and Their Measure' },
          { number: '6.2', title: 'The Unit Circle' },
          { number: '6.3', title: 'Trigonometric Functions of Any Angle' },
          { number: '6.4', title: 'Graphs of Trigonometric Functions' },
          { number: '6.5', title: 'Inverse Trigonometric Functions' },
        ],
      },
      {
        number: 7,
        title: 'Trigonometric Identities and Equations',
        sections: [
          { number: '7.1', title: 'Verifying Trigonometric Identities' },
          { number: '7.2', title: 'Sum and Difference Formulas' },
          { number: '7.3', title: 'Double-Angle and Half-Angle Formulas' },
          { number: '7.4', title: 'Trigonometric Equations' },
        ],
      },
      {
        number: 8,
        title: 'Applications of Trigonometry',
        sections: [
          { number: '8.1', title: 'Law of Sines' },
          { number: '8.2', title: 'Law of Cosines' },
          { number: '8.3', title: 'Vectors' },
          { number: '8.4', title: 'Polar Coordinates and Parametric Equations' },
          { number: '8.5', title: 'Trigonometric Form of Complex Numbers' },
        ],
      },
      {
        number: 9,
        title: 'Systems of Equations and Matrices',
        sections: [
          { number: '9.1', title: 'Systems of Linear Equations' },
          { number: '9.2', title: 'Introduction to Matrices' },
          { number: '9.3', title: 'Matrix Operations' },
          { number: '9.4', title: 'Systems of Inequalities' },
          { number: '9.5', title: 'Linear Programming' },
        ],
      },
      {
        number: 10,
        title: 'Conic Sections',
        sections: [
          { number: '10.1', title: 'The Parabola' },
          { number: '10.2', title: 'The Ellipse' },
          { number: '10.3', title: 'The Hyperbola' },
          { number: '10.4', title: 'Rotation of Conics' },
          { number: '10.5', title: 'Polar Equations of Conics' },
        ],
      },
      {
        number: 11,
        title: 'Sequences and Series',
        sections: [
          { number: '11.1', title: 'Sequences' },
          { number: '11.2', title: 'Series and Summation Notation' },
          { number: '11.3', title: 'Arithmetic and Geometric Series' },
          { number: '11.4', title: 'Mathematical Induction' },
          { number: '11.5', title: 'The Binomial Theorem' },
        ],
      },
    ],
  },
};

export function getBookLanding(bookId: string): BookLanding | undefined {
  return BOOK_LANDINGS[bookId];
}
