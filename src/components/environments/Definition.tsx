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
      <div className="env-label text-atlas-teal-dark">Definition {number}</div>
      {title && (
        <div className="env-title text-atlas-deep">{title}</div>
      )}
      <div className="text-atlas-text">
        <RichText text={content} />
      </div>
    </div>
  );
}
