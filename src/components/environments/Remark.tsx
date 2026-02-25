import { RichText } from '../reader/RichText';

interface RemarkProps {
  id?: string;
  title?: string;
  content: string;
}

export function Remark({ id, title, content }: RemarkProps) {
  return (
    <div id={id} className="env-box env-remark">
      <div className="env-label">💭 Remark</div>
      {title && (
        <div className="env-title">{title}</div>
      )}
      <div style={{ color: 'var(--ax-text)' }}>
        <RichText text={content} />
      </div>
    </div>
  );
}
