/**
 * ReaderContent — main content area for a section.
 *
 * Wraps ContentRenderer with brand provider + math provider, plus
 * the section-level study tools (highlighter, figure lightbox, deep
 * linking) and the learning-objectives panel.
 *
 * Stripped from the original Axiom implementation:
 *   - No edition prop (College Math is single-brand)
 *   - No MarginScripture rendering (Atlas-only feature)
 */
import { BrandProvider } from '../brand/BrandProvider';
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
    marginNotes?: MarginNote[] | null;  // kept for API compat; unused in single-brand
    chapter: number;
    section: number;
    objectives?: string[];
    bookId?: string;
}

function ReaderContentInner({
    content,
    epigraph,
    chapter,
    section,
    objectives,
    bookId = 'college-math',
}: ReaderContentProps) {
    const sectionId = `${chapter}-${section}`;
    const figures = content.filter((b: any) => b.type === 'figure') as FigureBlock[];

    // Mark first paragraph for the drop-cap treatment
    let firstParagraphSeen = false;
    const annotatedContent = content.map((block) => {
        const isFirstParagraph = !firstParagraphSeen && block.type === 'paragraph';
        if (isFirstParagraph) firstParagraphSeen = true;
        return isFirstParagraph ? { ...block, _firstParagraph: true } : block;
    });

    return (
        <div>
            {/* Study tools */}
            <TextHighlighter bookId={bookId} sectionId={sectionId} />
            <FigureLightbox figures={figures} />
            <DeepLink />

            {/* Optional epigraph above the section body */}
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
                                <span
                                    className="font-semibold whitespace-nowrap"
                                    style={{ color: 'var(--ax-thm-accent)' }}
                                >
                                    {chapter}.{section}.{i + 1}
                                </span>
                                <span style={{ color: 'var(--ax-text)' }}>{obj}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}

            <div className="relative">
                <ContentRenderer
                    content={annotatedContent}
                    bookId={bookId}
                    chapterSection={`${chapter}.${section}`}
                />
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
