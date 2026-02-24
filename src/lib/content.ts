// Content loading utilities
import type { Book, Section } from './types';

// In development, we'll load from the content directory
// In production, this could be from an API or static imports

export async function getBook(bookId: string): Promise<Book | null> {
  try {
    // For now, we'll use dynamic imports
    // This works with Astro's static site generation
    const bookData = await import(`../../content/${bookId}/book.json`);
    return bookData.default as Book;
  } catch {
    console.error(`Failed to load book: ${bookId}`);
    return null;
  }
}

export async function getSection(
  bookId: string, 
  chapterId: string, 
  sectionId: string
): Promise<Section | null> {
  try {
    const sectionData = await import(
      `../../content/${bookId}/${chapterId}/${sectionId}.json`
    );
    return sectionData.default as Section;
  } catch {
    console.error(`Failed to load section: ${bookId}/${chapterId}/${sectionId}`);
    return null;
  }
}

export async function getAllBooks(): Promise<string[]> {
  // Return list of available books
  // In production, this could be dynamic
  return [
    'precalculus',
    'vol1',
    'vol2', 
    'vol3',
    'linear-algebra',
    'linear-algebra-proofs',
  ];
}

// Generate all section paths for static site generation
export async function getAllSectionPaths() {
  const books = await getAllBooks();
  const paths: { book: string; chapter: string; section: string }[] = [];
  
  for (const bookId of books) {
    const book = await getBook(bookId);
    if (!book) continue;
    
    for (const chapter of book.chapters) {
      for (const section of chapter.sections) {
        paths.push({
          book: bookId,
          chapter: chapter.id,
          section: section.id,
        });
      }
    }
  }
  
  return paths;
}
