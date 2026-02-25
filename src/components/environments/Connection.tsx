import { RichText } from '../reader/RichText';

interface ConnectionProps {
  id?: string;
  title?: string;
  content: string;
}

export function Connection({ id, title, content }: ConnectionProps) {
  return (
    <div id={id} className="env-box env-connection">
      <div className="env-label">🔗 Connection</div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
