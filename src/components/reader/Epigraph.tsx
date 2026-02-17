/**
 * Epigraph component - scripture quote at section start
 * Only renders on Atlas edition
 */
import { useBrand } from '../brand/BrandProvider';

interface EpigraphData {
  text: string;
  reference: string;
}

interface EpigraphProps {
  epigraph: EpigraphData | null | undefined;
}

export function Epigraph({ epigraph }: EpigraphProps) {
  const { brand } = useBrand();

  // Don't render if no epigraph data or if edition doesn't show epigraphs
  if (!epigraph || !brand.showEpigraphs) {
    return null;
  }

  return (
    <blockquote 
      className="my-8 mx-auto max-w-2xl text-center"
      role="figure"
      aria-label="Section epigraph"
    >
      <p className="text-lg italic text-gray-600 leading-relaxed">
        "{epigraph.text}"
      </p>
      <footer className="mt-3 text-sm font-medium text-gray-500">
        — {epigraph.reference}
      </footer>
    </blockquote>
  );
}
