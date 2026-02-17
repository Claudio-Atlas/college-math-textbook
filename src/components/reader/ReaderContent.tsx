/**
 * ReaderContent - Main content area with brand-aware rendering
 * Wraps ContentRenderer with BrandProvider and handles epigraphs/margins
 */
import { BrandProvider } from '../brand/BrandProvider';
import { MathJaxProvider } from '../MathJaxProvider';
import { ContentRenderer } from './ContentRenderer';
import { Epigraph } from './Epigraph';
import { MarginContainer } from './MarginScripture';

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
}

export function ReaderContent({ 
  content, 
  epigraph, 
  marginNotes,
  chapter,
  section,
  objectives 
}: ReaderContentProps) {
  return (
    <BrandProvider>
      <MathJaxProvider>
        <div className="reader-content">
          {/* Epigraph - only shows on Atlas edition */}
          <Epigraph epigraph={epigraph} />
          
          {/* Learning Objectives */}
          {objectives && objectives.length > 0 && (
            <div className="my-8 p-4 sm:p-6 bg-emerald-50 rounded-lg border border-emerald-200">
              <h2 className="text-lg font-semibold text-emerald-700 mb-4">
                Learning Objectives
              </h2>
              <ul className="space-y-2">
                {objectives.map((obj, i) => (
                  <li key={i} className="flex items-start gap-2 text-sm sm:text-base">
                    <span className="text-emerald-600 font-semibold whitespace-nowrap">
                      {chapter}.{section}.{i + 1}
                    </span>
                    <span>{obj}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
          
          {/* Main content with margin notes */}
          <MarginContainer notes={marginNotes}>
            <ContentRenderer content={content} />
          </MarginContainer>
        </div>
      </MathJaxProvider>
    </BrandProvider>
  );
}
