import { RichText } from '../reader/RichText';

interface TheoremProps {
  id: string;
  number?: string;
  title: string;
  content: string;
  label?: string;
}

export function Theorem({ id, number, title, content, label = 'Theorem' }: TheoremProps) {
  return (
    <div id={id} className="env-box env-theorem">
      <div className="env-label">
        {label} {number}
      </div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
