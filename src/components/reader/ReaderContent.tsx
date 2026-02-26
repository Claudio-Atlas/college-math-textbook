/**
 * ReaderContent - Main content area with brand-aware rendering
 * Wraps ContentRenderer with BrandProvider and handles epigraphs/positioned margins
 */
import { BrandProvider, useBrand } from '../brand/BrandProvider';
import { MathJaxProvider } from '../MathJaxProvider';
import { ContentRenderer } from './ContentRenderer';
import { Epigraph } from './Epigraph';
import { TextHighlighter } from './TextHighlighter';
import { FigureLightbox } from './FigureLightbox';
import { DeepLink } from './DeepLink';
import type { FigureBlock, Edition } from '../../lib/types';
import type { Edition as BrandEdition } from '../../lib/edition';

interface EpigraphData {
  text: string;
  reference: string;
}

interface MarginNote {
  type: 'scripture' | 'quote' | 'note';
  reference?: string;
  author?: string;
  text: string;
}

interface ReaderContentProps {
  content: any[];
  epigraph?: EpigraphData | null;
  marginNotes?: MarginNote[] | null;
  chapter: number;
  section: number;
  objectives?: string[];
  bookId?: string;
  /** Content edition: 'christian' or 'secular'. Mapped from hostname. */
  edition?: Edition;
}

/**
 * Distributes margin notes throughout content blocks
 * Returns a map of contentIndex -> marginNote
 */
function distributeMarginNotes(
  contentLength: number, 
  notes: MarginNote[] | null | undefined
): Map<number, MarginNote> {
  const distribution = new Map<number, MarginNote>();
  
  if (!notes || notes.length === 0 || contentLength === 0) {
    return distribution;
  }

  // Filter to scripture and quotes only
  const validNotes = notes.filter(n => n.type === 'scripture' || n.type === 'quote');
  if (validNotes.length === 0) return distribution;

  // Distribute evenly, starting after first few blocks
  const startOffset = 2; // Skip title area
  const availableSlots = contentLength - startOffset;
  const spacing = Math.max(3, Math.floor(availableSlots / validNotes.length));

  validNotes.forEach((note, i) => {
    const position = startOffset + (i * spacing);
    if (position < contentLength) {
      distribution.set(position, note);
    }
  });

  return distribution;
}

function ReaderContentInner({ 
  content, 
  epigraph, 
  marginNotes,
  chapter,
  section,
  objectives,
  bookId = 'unknown',
  edition = 'christian',
}: ReaderContentProps) {
  const { brand } = useBrand();
  const showMargins = brand.showScripture && marginNotes && marginNotes.length > 0;
  const sectionId = `${chapter}-${section}`;
  const figures = content.filter((b: any) => b.type === 'figure') as FigureBlock[];
  
  // Distribute margin notes to positions
  const marginPositions = showMargins 
    ? distributeMarginNotes(content.length, marginNotes)
    : new Map();

  return (
    <div>
      {/* Study tools */}
      <TextHighlighter bookId={bookId} sectionId={sectionId} />
      <FigureLightbox figures={figures} />
      <DeepLink />

      {/* Epigraph - only shows on Atlas edition */}
      <Epigraph epigraph={epigraph} />
      
      {/* Learning Objectives */}
      {objectives && objectives.length > 0 && (
        <div className="env-box env-theorem my-6">
          <div className="env-label" style={{ color: 'var(--ax-thm-accent)' }}>
            Learning Objectives
          </div>
          <ul className="space-y-2">
            {objectives.map((obj, i) => (
              <li key={i} className="flex items-start gap-2 text-sm sm:text-base">
                <span className="font-semibold whitespace-nowrap" style={{ color: 'var(--ax-thm-accent)' }}>
                  {chapter}.{section}.{i + 1}
                </span>
                <span style={{ color: 'var(--ax-text)' }}>{obj}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
      
      {/* Main content with positioned margin notes */}
      <div className="relative">
        {(() => {
          // Mark first paragraph for drop cap, then pass ALL content to ContentRenderer
          // so it can group consecutive exercises into ExerciseSections
          let firstParagraphSeen = false;
          const annotatedContent = content.map((block, index) => {
            const isFirstParagraph = !firstParagraphSeen && block.type === 'paragraph';
            if (isFirstParagraph) firstParagraphSeen = true;
            return isFirstParagraph ? { ...block, _firstParagraph: true } : block;
          });

          // Render margin notes as standalone asides at their positions
          const marginNoteElements = Array.from(marginPositions.entries()).map(([position, note]) => (
            <aside
              key={`margin-${position}`}
              className="hidden 2xl:block float-right clear-right w-52 -mr-60 ml-6 mb-4"
              aria-label="Margin note"
              style={{ order: position }}
            >
              <div className="text-sm italic pl-3" style={{ color: 'var(--ax-text-muted)', borderLeft: '2px solid var(--ax-border)' }}>
                <p className="leading-relaxed">"{note.text.replace(/\n/g, ' ')}"</p>
                <p className="mt-1 text-xs font-medium not-italic" style={{ color: 'var(--ax-text-muted)' }}>
                  — {note.type === 'scripture' ? note.reference : note.author}
                </p>
              </div>
            </aside>
          ));

          return (
            <>
              {marginNoteElements}
              <ContentRenderer content={annotatedContent} edition={edition} bookId={bookId} chapterSection={`${chapter}.${section}`} />
            </>
          );
        })()}
      </div>
    </div>
  );
}

/** Map content edition to brand edition */
function toBrandEdition(edition?: Edition): BrandEdition {
  return edition === 'secular' ? 'meridian' : 'atlas';
}

export function ReaderContent(props: ReaderContentProps) {
  return (
    <BrandProvider forceEdition={toBrandEdition(props.edition)}>
      <MathJaxProvider>
        <ReaderContentInner {...props} />
      </MathJaxProvider>
    </BrandProvider>
  );
}
