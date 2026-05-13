/**
 * Book registry — single-book reader.
 *
 * Stripped from the original Axiom multi-book catalog. College
 * Mathematics is the only entry. Author bio, TOC, and feature list
 * are retained in the structure for completeness; the routing layer
 * only reads {id, title, chapters}.
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

const CLAYTON: Author = {
    name: 'Clayton Ragsdale',
    title: 'Mathematics Instructor',
    institution: 'Grand Canyon University',
    bio: `A companion textbook authored alongside the MAT-144 College Mathematics course site, distilling the topic lessons, worked examples, and cheat sheets into a sequential reading experience.`,
    credentials: [],
};

export const BOOK_LANDINGS: Record<string, BookLanding> = {
    'college-math': {
        id: 'college-math',
        title: 'College Mathematics',
        subtitle: 'A companion textbook',
        description: 'A companion textbook to the MAT-144 College Mathematics course.',
        longDescription: 'Seven topics: linear functions, conversions and budgeting, savings, loans, statistics, probability, and taxes & stocks. Each chapter walks you through the big ideas, the worked examples, and the formulas — designed to be read alongside the course site.',
        coverSlug: 'college-math',
        chapters: [],  // populated at content load time from content/college-math/book.json
        author: CLAYTON,
        features: [
            'Worked examples with full step-by-step solutions',
            'Try-it problems with answers',
            'End-of-chapter cheat sheets and formula reference',
            'Mobile-friendly, dark + light themes',
            'In-book search and highlighting',
        ],
        available: true,
    },
};
