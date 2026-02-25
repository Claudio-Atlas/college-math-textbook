import { RichText } from '../reader/RichText';

interface AlgorithmProps {
  id?: string;
  number?: string;
  title?: string;
  content: string;
}

export function Algorithm({ id, number, title, content }: AlgorithmProps) {
  return (
    <div id={id} className="env-box env-algorithm">
      <div className="env-label">⚙️ Algorithm {number}</div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
