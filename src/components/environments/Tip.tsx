import { RichText } from '../reader/RichText';

interface TipProps {
  id?: string;
  title?: string;
  content: string;
}

export function Tip({ id, title, content }: TipProps) {
  return (
    <div id={id} className="env-box env-tip">
      <div className="env-label">💡 Tip</div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
