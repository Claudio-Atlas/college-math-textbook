/**
 * MarginScripture component - scripture notes in the margin
 * Only renders on Atlas edition
 */
import { useBrand } from '../brand/BrandProvider';

interface MarginNote {
  type: 'scripture' | 'quote' | 'note';
  reference?: string;
  author?: string;
  text: string;
}

interface MarginScriptureProps {
  notes: MarginNote[] | null | undefined;
  className?: string;
}

export function MarginScripture({ notes, className = '' }: MarginScriptureProps) {
  const { brand } = useBrand();

  // Don't render if no notes or if edition doesn't show scripture
  if (!notes || notes.length === 0 || !brand.showScripture) {
    return null;
  }

  // Filter to only scripture and quotes (skip generic notes for now)
  const scriptureNotes = notes.filter(
    (note) => note.type === 'scripture' || note.type === 'quote'
  );

  if (scriptureNotes.length === 0) {
    return null;
  }

  return (
    <aside 
      className={`hidden xl:block absolute right-0 top-0 w-48 pr-4 ${className}`}
      aria-label="Margin notes"
    >
      <div className="space-y-6 text-sm text-gray-500 italic">
        {scriptureNotes.map((note, index) => (
          <div 
            key={index} 
            className="border-l-2 border-gray-200 pl-3"
          >
            <p className="leading-relaxed">"{note.text}"</p>
            <p className="mt-1 text-xs font-medium not-italic text-gray-400">
              {note.type === 'scripture' ? `— ${note.reference}` : `— ${note.author}`}
            </p>
          </div>
        ))}
      </div>
    </aside>
  );
}

/**
 * Wrapper component that provides relative positioning for margin notes
 */
interface MarginContainerProps {
  children: React.ReactNode;
  notes: MarginNote[] | null | undefined;
}

export function MarginContainer({ children, notes }: MarginContainerProps) {
  const { brand } = useBrand();
  
  // Only add margin space on Atlas edition with notes
  const hasMarginContent = brand.showScripture && notes && notes.length > 0;

  return (
    <div className={`relative ${hasMarginContent ? 'xl:mr-56' : ''}`}>
      {children}
      {hasMarginContent && <MarginScripture notes={notes} />}
    </div>
  );
}
