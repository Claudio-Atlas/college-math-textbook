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
import type { FigureBlock } from '../../lib/types';

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
          let firstParagraphSeen = false;
          return content.map((block, index) => {
            const marginNote = marginPositions.get(index);
            const isFirstParagraph = !firstParagraphSeen && block.type === 'paragraph';
            if (isFirstParagraph) firstParagraphSeen = true;
          
            return (
              <div key={index} className="relative">
                {/* Margin note - floats to right margin on wide screens */}
                {marginNote && (
                  <aside 
                    className="hidden 2xl:block float-right clear-right w-52 -mr-60 ml-6 mb-4"
                    aria-label="Margin note"
                  >
                    <div className="text-sm italic pl-3" style={{ color: 'var(--ax-text-muted)', borderLeft: '2px solid var(--ax-border)' }}>
                      <p className="leading-relaxed">"{marginNote.text.replace(/\n/g, ' ')}"</p>
                      <p className="mt-1 text-xs font-medium not-italic" style={{ color: 'var(--ax-text-muted)' }}>
                        — {marginNote.type === 'scripture' ? marginNote.reference : marginNote.author}
                      </p>
                    </div>
                  </aside>
                )}
              
                {/* Content block */}
                {isFirstParagraph ? (
                  <ContentRenderer content={[{...block, _firstParagraph: true}]} />
                ) : (
                  <ContentRenderer content={[block]} />
                )}
              </div>
            );
          });
        })()}
      </div>
    </div>
  );
}

export function ReaderContent(props: ReaderContentProps) {
  return (
    <BrandProvider>
      <MathJaxProvider>
        <ReaderContentInner {...props} />
      </MathJaxProvider>
    </BrandProvider>
  );
}
