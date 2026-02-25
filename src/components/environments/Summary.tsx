import { RichText } from '../reader/RichText';

interface SummaryProps {
  id?: string;
  title?: string;
  content: string;
}

export function Summary({ id, title, content }: SummaryProps) {
  return (
    <div id={id} className="env-box env-summary">
      <div className="env-label">📋 Summary</div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
