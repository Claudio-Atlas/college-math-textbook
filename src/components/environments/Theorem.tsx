import { RichText } from '../reader/RichText';

interface TheoremProps {
  id: string;
  number?: string;
  title: string;
  content: string;
  label?: string; // "Theorem", "Lemma", "Corollary", etc.
}

export function Theorem({ id, number, title, content, label = 'Theorem' }: TheoremProps) {
  return (
    <div id={id} className="env-box env-theorem">
      <div className="env-label text-atlas-sage">
        {label} {number}
      </div>
      {title && (
        <div className="env-title text-atlas-deep">{title}</div>
      )}
      <div className="text-atlas-text">
        <RichText text={content} />
      </div>
    </div>
  );
}
