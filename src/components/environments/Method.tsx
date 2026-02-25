import { RichText } from '../reader/RichText';

interface MethodProps {
  id?: string;
  title?: string;
  content: string;
}

export function Method({ id, title, content }: MethodProps) {
  return (
    <div id={id} className="env-box env-method">
      <div className="env-label">🔧 Method</div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
