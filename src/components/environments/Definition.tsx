import { RichText } from '../reader/RichText';

interface DefinitionProps {
  id: string;
  number?: string;
  title: string;
  content: string;
}

export function Definition({ id, number, title, content }: DefinitionProps) {
  return (
    <div id={id} className="env-box env-definition">
      <div className="env-label">Definition {number}</div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
