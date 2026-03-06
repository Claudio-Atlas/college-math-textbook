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
  available?: boolean;
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
  name: 'Clayton Ragsdale',
  title: 'Mathematics Instructor & EdTech Founder',
  bio: `Clayton Ragsdale is a mathematician, textbook author, and education technology founder with over six years of experience teaching mathematics at both four-year universities and community colleges, online and on ground. He holds an MS in Mathematics from Grand Canyon University and dual bachelor's degrees in Mathematics and Economics from Chapman University. After years in the classroom seeing firsthand where students struggle, he founded Meridian Press to build the textbooks and tools he wished existed — clear, accessible, and designed to meet students where they are.`,
  credentials: [
    'MS Mathematics, Grand Canyon University',
    'BS Mathematics & BA Economics, Chapman University',
    'Member, Society of Actuaries',
    '6+ years teaching mathematics (university & community college)',
    'Founder, Meridian Press',
    '98,000+ math problems authored',
  ],
  funFact: 'He played basketball for over 20 years at the collegiate level and remains a huge basketball fan at all levels.',
};

// ─── Book Catalog ───────────────────────────────────────

export const BOOK_LANDINGS: Record<string, BookLanding> = {
  'pre-algebra': {
    id: 'pre-algebra',
    title: 'Pre-Algebra',
    subtitle: 'Building Mathematical Foundations',
    description: 'A comprehensive foundation from whole numbers through polynomials and graphing — everything students need to enter Algebra 1 with confidence.',
    longDescription: `Pre-Algebra is designed to build a rock-solid mathematical foundation for students preparing to enter Algebra 1. Written with clarity and accessibility at the forefront, every concept is broken down into manageable steps with real-world context that helps students see why math matters.

Starting with whole numbers and algebraic thinking, then progressing through integers, fractions, decimals, percents, equations, geometry, and all the way to introductory polynomials and graphing, this text meets students exactly where they are and gives them the confidence and skills to move forward. Every chapter features carefully scaffolded examples, practice exercises at every level, and chapter reviews to ensure mastery before moving on.`,
    coverSlug: 'pre-algebra',
    features: [
      'Step-by-step examples with clear explanations',
      'Algebraic thinking introduced early and reinforced throughout',
      'Real-world applications in every chapter',
      'Scaffolded exercises from basic to challenging',
      'Bridges directly to Algebra 1 with polynomials and graphing',
      'Designed to meet students where they are',
    ],
    author: CLAYTON,
    chapters: [
      { number: 1, title: 'Whole Numbers', sections: [
        { number: '1.1', title: 'Place Value and Number Sense' },
        { number: '1.2', title: 'Addition and Subtraction' },
        { number: '1.3', title: 'Multiplication and Division' },
        { number: '1.4', title: 'Order of Operations' },
        { number: '1.5', title: 'Rounding and Estimation' },
      ]},
      { number: 2, title: 'The Language of Algebra', sections: [
        { number: '2.1', title: 'Variables and Expressions' },
        { number: '2.2', title: 'Evaluating Expressions' },
        { number: '2.3', title: 'Translating Words to Math' },
        { number: '2.4', title: 'Factors, Multiples, and Primes' },
      ]},
      { number: 3, title: 'Integers', sections: [
        { number: '3.1', title: 'Introduction to Integers' },
        { number: '3.2', title: 'Adding and Subtracting Integers' },
        { number: '3.3', title: 'Multiplying and Dividing Integers' },
        { number: '3.4', title: 'Order of Operations with Integers' },
        { number: '3.5', title: 'Solving Equations with Integers' },
      ]},
      { number: 4, title: 'Fractions', sections: [
        { number: '4.1', title: 'Understanding Fractions' },
        { number: '4.2', title: 'Equivalent Fractions and Simplifying' },
        { number: '4.3', title: 'Multiplying and Dividing Fractions' },
        { number: '4.4', title: 'Adding and Subtracting Fractions' },
        { number: '4.5', title: 'Mixed Numbers and Complex Fractions' },
        { number: '4.6', title: 'Solving Equations with Fractions' },
      ]},
      { number: 5, title: 'Decimals', sections: [
        { number: '5.1', title: 'Decimal Concepts' },
        { number: '5.2', title: 'Operations with Decimals' },
        { number: '5.3', title: 'Decimals and Fractions' },
        { number: '5.4', title: 'Solving Equations with Decimals' },
        { number: '5.5', title: 'Square Roots' },
      ]},
      { number: 6, title: 'Ratios, Proportions, and Percents', sections: [
        { number: '6.1', title: 'Ratios and Rates' },
        { number: '6.2', title: 'Proportions' },
        { number: '6.3', title: 'Understanding Percents' },
        { number: '6.4', title: 'Percent Problems' },
        { number: '6.5', title: 'Sales Tax, Discounts, and Simple Interest' },
        { number: '6.6', title: 'Proportions and Percent Applications' },
      ]},
      { number: 7, title: 'Properties of Real Numbers', sections: [
        { number: '7.1', title: 'Rational and Irrational Numbers' },
        { number: '7.2', title: 'Commutative and Associative Properties' },
        { number: '7.3', title: 'The Distributive Property' },
        { number: '7.4', title: 'Properties of Identity, Inverses, and Zero' },
      ]},
      { number: 8, title: 'Solving Equations', sections: [
        { number: '8.1', title: 'One-Step Equations' },
        { number: '8.2', title: 'Two-Step Equations' },
        { number: '8.3', title: 'Multi-Step Equations' },
        { number: '8.4', title: 'Equations with Variables on Both Sides' },
        { number: '8.5', title: 'Equations with Fraction and Decimal Coefficients' },
      ]},
      { number: 9, title: 'Geometry and Measurement', sections: [
        { number: '9.1', title: 'Angles and Triangles' },
        { number: '9.2', title: 'The Pythagorean Theorem' },
        { number: '9.3', title: 'Perimeter and Area' },
        { number: '9.4', title: 'Circles' },
        { number: '9.5', title: 'Volume and Surface Area' },
        { number: '9.6', title: 'Solving Geometry Problems' },
      ]},
      { number: 10, title: 'Data and Statistics', sections: [
        { number: '10.1', title: 'Collecting and Organizing Data' },
        { number: '10.2', title: 'Mean, Median, and Mode' },
        { number: '10.3', title: 'Graphs and Data Displays' },
        { number: '10.4', title: 'Probability Basics' },
      ]},
      { number: 11, title: 'Introduction to Polynomials', sections: [
        { number: '11.1', title: 'Exponent Rules' },
        { number: '11.2', title: 'Adding and Subtracting Polynomials' },
        { number: '11.3', title: 'Multiplying Polynomials' },
        { number: '11.4', title: 'Scientific Notation' },
        { number: '11.5', title: 'Introduction to Factoring' },
      ]},
      { number: 12, title: 'Graphing', sections: [
        { number: '12.1', title: 'The Coordinate Plane' },
        { number: '12.2', title: 'Graphing Linear Equations' },
        { number: '12.3', title: 'Intercepts' },
        { number: '12.4', title: 'Introduction to Slope' },
      ]},
    ],
  },
  'algebra-1': {
    id: 'algebra-1',
    title: 'Algebra 1',
    subtitle: 'Core Algebraic Thinking',
    description: 'From real numbers through linear equations, inequalities, graphing, systems of equations, polynomials, factoring, quadratics, and an introduction to functions.',
    longDescription: `Algebra 1 is the gateway to all higher mathematics, and this textbook is designed to make that gateway as wide and welcoming as possible. Every topic is presented with clear explanations, step-by-step examples, and the kind of scaffolding that helps students build confidence as they build skills.

From the real number system through linear equations, graphing, systems, polynomials, factoring, and quadratics, students develop the algebraic thinking they need for Geometry, Algebra 2, and beyond. Written by an instructor who has seen firsthand where students struggle, every section is crafted to meet learners where they are.`,
    coverSlug: 'algebra-1',
    features: [
      'Clear, step-by-step approach to every concept',
      'Scaffolded exercises from skill-building to application',
      'Real-world contexts that make algebra meaningful',
      'Comprehensive chapter reviews',
      'Designed to build confidence and close gaps',
    ],
    author: CLAYTON,
    chapters: [
      { number: 1, title: 'Real Numbers', sections: [
        { number: '1.1', title: 'The Real Number System' },
        { number: '1.2', title: 'Operations and Properties' },
        { number: '1.3', title: 'Absolute Value' },
        { number: '1.4', title: 'Order of Operations' },
      ]},
      { number: 2, title: 'Expressions', sections: [
        { number: '2.1', title: 'Variables and Expressions' },
        { number: '2.2', title: 'Translating Verbal Expressions' },
        { number: '2.3', title: 'Evaluating Expressions' },
        { number: '2.4', title: 'Simplifying Expressions' },
      ]},
      { number: 3, title: 'Linear Equations', sections: [
        { number: '3.1', title: 'One-Step Equations' },
        { number: '3.2', title: 'Two-Step Equations' },
        { number: '3.3', title: 'Multi-Step Equations' },
        { number: '3.4', title: 'Equations with Variables on Both Sides' },
        { number: '3.5', title: 'Literal Equations' },
      ]},
      { number: 4, title: 'Inequalities', sections: [
        { number: '4.1', title: 'Writing Inequalities' },
        { number: '4.2', title: 'Solving One-Step Inequalities' },
        { number: '4.3', title: 'Solving Multi-Step Inequalities' },
        { number: '4.4', title: 'Compound Inequalities' },
        { number: '4.5', title: 'Absolute Value Inequalities' },
      ]},
      { number: 5, title: 'Graphing Linear Functions', sections: [
        { number: '5.1', title: 'The Coordinate Plane' },
        { number: '5.2', title: 'Graphing Equations' },
        { number: '5.3', title: 'Slope' },
        { number: '5.4', title: 'Slope-Intercept Form' },
        { number: '5.5', title: 'Point-Slope Form' },
        { number: '5.6', title: 'Parallel and Perpendicular Lines' },
      ]},
      { number: 6, title: 'Systems of Equations', sections: [
        { number: '6.1', title: 'Graphing Systems' },
        { number: '6.2', title: 'Substitution' },
        { number: '6.3', title: 'Elimination' },
        { number: '6.4', title: 'Special Systems' },
        { number: '6.5', title: 'Applications' },
      ]},
      { number: 7, title: 'Exponents and Polynomials', sections: [
        { number: '7.1', title: 'Exponent Rules' },
        { number: '7.2', title: 'Negative and Zero Exponents' },
        { number: '7.3', title: 'Scientific Notation' },
        { number: '7.4', title: 'Introduction to Polynomials' },
        { number: '7.5', title: 'Adding and Subtracting Polynomials' },
        { number: '7.6', title: 'Multiplying Polynomials' },
        { number: '7.7', title: 'Special Products' },
      ]},
      { number: 8, title: 'Factoring', sections: [
        { number: '8.1', title: 'Greatest Common Factor' },
        { number: '8.2', title: 'Factoring by Grouping' },
        { number: '8.3', title: 'Factoring Trinomials (a = 1)' },
        { number: '8.4', title: 'Factoring General Trinomials' },
        { number: '8.5', title: 'Special Factoring Patterns' },
        { number: '8.6', title: 'Factoring Strategy' },
      ]},
      { number: 9, title: 'Quadratic Equations', sections: [
        { number: '9.1', title: 'Solving by Factoring' },
        { number: '9.2', title: 'The Square Root Method' },
        { number: '9.3', title: 'Completing the Square' },
        { number: '9.4', title: 'The Quadratic Formula' },
        { number: '9.5', title: 'The Discriminant' },
        { number: '9.6', title: 'Applications' },
      ]},
      { number: 10, title: 'Introduction to Functions', sections: [
        { number: '10.1', title: 'Relations and Functions' },
        { number: '10.2', title: 'Function Notation' },
        { number: '10.3', title: 'Domain and Range' },
        { number: '10.4', title: 'Graphs of Functions' },
        { number: '10.5', title: 'Linear Functions' },
        { number: '10.6', title: 'Quadratic Functions' },
      ]},
      { number: 11, title: 'Introduction to Exponential Functions', sections: [
        { number: '11.1', title: 'Exponential Growth and Decay' },
        { number: '11.2', title: 'Graphing Exponential Functions' },
        { number: '11.3', title: 'Compound Interest' },
        { number: '11.4', title: 'Geometric Sequences' },
      ]},
      { number: 12, title: 'Statistics and Data Analysis', sections: [
        { number: '12.1', title: 'Scatter Plots and Correlation' },
        { number: '12.2', title: 'Line of Best Fit' },
        { number: '12.3', title: 'Two-Way Tables' },
        { number: '12.4', title: 'Interpreting Data in Context' },
      ]},
    ],
  },
  geometry: {
    id: 'geometry',
    title: 'Geometry',
    subtitle: 'Reasoning and Spatial Thinking',
    description: 'Foundations of proof, parallel and perpendicular lines, congruence, similarity, right triangle trigonometry, circles, area, volume, and transformations.',
    longDescription: `Geometry brings mathematics into the visual and spatial world, and this textbook makes that journey clear and engaging. From the foundations of logical reasoning and proof through triangles, quadrilaterals, circles, area, volume, and transformations, every concept is developed with careful explanations and rich visual support.

Students learn not just what is true in geometry, but why — developing the reasoning skills that serve them in every future math course. Written to be accessible to all learners, with scaffolded exercises that build from basic skills to real applications.`,
    coverSlug: 'geometry',
    features: [
      'Visual-first approach with clear diagrams',
      'Proof-writing developed gradually and naturally',
      'Real-world applications of geometric concepts',
      'Scaffolded exercises at every level',
      'Comprehensive coverage from foundations to transformations',
    ],
    author: CLAYTON,
    chapters: [
      { number: 1, title: 'Foundations of Geometry', sections: [
        { number: '1.1', title: 'Undefined Terms' },
        { number: '1.2', title: 'Segments and Rays' },
        { number: '1.3', title: 'Angles' },
        { number: '1.4', title: 'Angle Pairs' },
        { number: '1.5', title: 'Basic Constructions' },
      ]},
      { number: 2, title: 'Reasoning and Proof', sections: [
        { number: '2.1', title: 'Inductive Reasoning' },
        { number: '2.2', title: 'Conditional Statements' },
        { number: '2.3', title: 'Deductive Reasoning' },
        { number: '2.4', title: 'Two-Column Proofs' },
        { number: '2.5', title: 'Paragraph Proofs' },
      ]},
      { number: 3, title: 'Parallel and Perpendicular Lines', sections: [
        { number: '3.1', title: 'Parallel Lines' },
        { number: '3.2', title: 'Transversal Angles' },
        { number: '3.3', title: 'Proving Lines Parallel' },
        { number: '3.4', title: 'Perpendicular Lines' },
      ]},
      { number: 4, title: 'Congruent Triangles', sections: [
        { number: '4.1', title: 'Introduction to Triangles' },
        { number: '4.2', title: 'Congruence' },
        { number: '4.3', title: 'SSS and SAS' },
        { number: '4.4', title: 'ASA and AAS' },
        { number: '4.5', title: 'CPCTC' },
        { number: '4.6', title: 'Isosceles Triangles' },
      ]},
      { number: 5, title: 'Triangle Properties', sections: [
        { number: '5.1', title: 'Midsegments' },
        { number: '5.2', title: 'Perpendicular Bisectors' },
        { number: '5.3', title: 'Angle Bisectors' },
        { number: '5.4', title: 'Medians and Altitudes' },
        { number: '5.5', title: 'Triangle Inequalities' },
      ]},
      { number: 6, title: 'Quadrilaterals and Polygons', sections: [
        { number: '6.1', title: 'Polygon Angle Sums' },
        { number: '6.2', title: 'Parallelograms' },
        { number: '6.3', title: 'Proving Parallelograms' },
        { number: '6.4', title: 'Rectangles, Rhombi, and Squares' },
        { number: '6.5', title: 'Trapezoids and Kites' },
      ]},
      { number: 7, title: 'Similarity', sections: [
        { number: '7.1', title: 'Ratios and Proportions' },
        { number: '7.2', title: 'Similar Polygons' },
        { number: '7.3', title: 'AA Similarity' },
        { number: '7.4', title: 'SSS and SAS Similarity' },
        { number: '7.5', title: 'Proportions in Triangles' },
      ]},
      { number: 8, title: 'Right Triangles and Trigonometry', sections: [
        { number: '8.1', title: 'The Pythagorean Theorem' },
        { number: '8.2', title: 'Special Right Triangles' },
        { number: '8.3', title: 'Trigonometric Ratios' },
        { number: '8.4', title: 'Solving Right Triangles' },
        { number: '8.5', title: 'Angles of Elevation and Depression' },
      ]},
      { number: 9, title: 'Circles', sections: [
        { number: '9.1', title: 'Circle Basics' },
        { number: '9.2', title: 'Central and Inscribed Angles' },
        { number: '9.3', title: 'Arcs and Chords' },
        { number: '9.4', title: 'Tangent Lines' },
        { number: '9.5', title: 'Secants and Segments' },
      ]},
      { number: 10, title: 'Area and Perimeter', sections: [
        { number: '10.1', title: 'Rectangles and Parallelograms' },
        { number: '10.2', title: 'Triangles and Trapezoids' },
        { number: '10.3', title: 'Regular Polygons' },
        { number: '10.4', title: 'Circles' },
        { number: '10.5', title: 'Composite Figures' },
      ]},
      { number: 11, title: 'Surface Area and Volume', sections: [
        { number: '11.1', title: 'Prisms and Cylinders' },
        { number: '11.2', title: 'Pyramids and Cones' },
        { number: '11.3', title: 'Spheres' },
        { number: '11.4', title: 'Similar Solids' },
      ]},
      { number: 12, title: 'Transformations', sections: [
        { number: '12.1', title: 'Translations' },
        { number: '12.2', title: 'Reflections' },
        { number: '12.3', title: 'Rotations' },
        { number: '12.4', title: 'Dilations' },
        { number: '12.5', title: 'Compositions' },
      ]},
    ],
  },
  'algebra-2': {
    id: 'algebra-2',
    title: 'Algebra 2',
    subtitle: 'Advanced Algebraic Concepts',
    description: 'Equations, linear systems, quadratic and polynomial functions, radicals, exponentials, logarithms, rational functions, sequences, probability, trigonometry, and conics.',
    longDescription: `Algebra 2 builds on the foundation of Algebra 1 to prepare students for Precalculus and college-level mathematics. This textbook covers the full scope of advanced algebraic concepts — from linear systems and quadratic functions through exponentials, logarithms, rational functions, sequences, probability, introductory trigonometry, and conic sections.

Every topic is presented with clarity and purpose, connecting new ideas to what students already know. With carefully designed exercises that range from skill-building to real-world applications, this text helps students develop the mathematical maturity they need for success in higher mathematics.`,
    coverSlug: 'algebra-2',
    features: [
      'Builds naturally on Algebra 1 concepts',
      'Clear connections between topics',
      'Real-world applications throughout',
      'Exercises from skill-building to challenging',
      'Prepares students for Precalculus and beyond',
    ],
    author: CLAYTON,
    chapters: [
      { number: 1, title: 'Equations and Inequalities', sections: [
        { number: '1.1', title: 'Linear Equations' },
        { number: '1.2', title: 'Linear Inequalities' },
        { number: '1.3', title: 'Absolute Value Equations' },
        { number: '1.4', title: 'Absolute Value Inequalities' },
        { number: '1.5', title: 'Formulas and Literal Equations' },
      ]},
      { number: 2, title: 'Linear Systems', sections: [
        { number: '2.1', title: 'Solving by Graphing' },
        { number: '2.2', title: 'Substitution Method' },
        { number: '2.3', title: 'Elimination Method' },
        { number: '2.4', title: 'Systems of Three Variables' },
      ]},
      { number: 3, title: 'Quadratic Functions', sections: [
        { number: '3.1', title: 'Quadratic Graphs' },
        { number: '3.2', title: 'Solving Quadratics' },
        { number: '3.3', title: 'Completing the Square' },
        { number: '3.4', title: 'The Quadratic Formula' },
        { number: '3.5', title: 'Complex Numbers' },
        { number: '3.6', title: 'Quadratic Applications' },
      ]},
      { number: 4, title: 'Polynomial Functions', sections: [
        { number: '4.1', title: 'Polynomial Basics' },
        { number: '4.2', title: 'Factoring Polynomials' },
        { number: '4.3', title: 'Zeros and Roots' },
        { number: '4.4', title: 'Polynomial Division' },
        { number: '4.5', title: 'Graphing Polynomials' },
      ]},
      { number: 5, title: 'Radical Functions', sections: [
        { number: '5.1', title: 'Simplifying Radicals' },
        { number: '5.2', title: 'Operations with Radicals' },
        { number: '5.3', title: 'Rational Exponents' },
        { number: '5.4', title: 'Solving Radical Equations' },
        { number: '5.5', title: 'Graphing Radical Functions and Inverses' },
      ]},
      { number: 6, title: 'Exponential Functions', sections: [
        { number: '6.1', title: 'Exponential Functions' },
        { number: '6.2', title: 'The Natural Base' },
        { number: '6.3', title: 'Compound Interest' },
        { number: '6.4', title: 'Growth and Decay' },
      ]},
      { number: 7, title: 'Logarithmic Functions', sections: [
        { number: '7.1', title: 'Introduction to Logarithms' },
        { number: '7.2', title: 'Properties of Logarithms' },
        { number: '7.3', title: 'Logarithmic Equations' },
      ]},
      { number: 8, title: 'Rational Functions', sections: [
        { number: '8.1', title: 'Simplifying Rational Expressions' },
        { number: '8.2', title: 'Multiplying and Dividing Rational Expressions' },
        { number: '8.3', title: 'Adding and Subtracting Rational Expressions' },
        { number: '8.4', title: 'Solving Rational Equations' },
        { number: '8.5', title: 'Direct and Inverse Variation' },
      ]},
      { number: 9, title: 'Sequences and Series', sections: [
        { number: '9.1', title: 'Arithmetic Sequences' },
        { number: '9.2', title: 'Geometric Sequences' },
        { number: '9.3', title: 'Sigma Notation' },
      ]},
      { number: 10, title: 'Probability and Statistics', sections: [
        { number: '10.1', title: 'Counting and Permutations' },
        { number: '10.2', title: 'Combinations and the Binomial Theorem' },
        { number: '10.3', title: 'Probability Basics' },
      ]},
      { number: 11, title: 'Introduction to Trigonometry', sections: [
        { number: '11.1', title: 'Angles and Radians' },
        { number: '11.2', title: 'Trigonometric Identities' },
        { number: '11.3', title: 'The Unit Circle' },
      ]},
      { number: 12, title: 'Conic Sections', sections: [
        { number: '12.1', title: 'Circles' },
        { number: '12.2', title: 'Parabolas' },
        { number: '12.3', title: 'Ellipses' },
        { number: '12.4', title: 'Hyperbolas' },
        { number: '12.5', title: 'Identifying Conics' },
      ]},
    ],
  },
  precalculus: {
    id: 'precalculus',
    available: true,
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
