import type { ContentBlock, Edition } from '../../lib/types';
import { RichText } from './RichText';
import { Definition } from '../environments/Definition';
import { Theorem } from '../environments/Theorem';
import { Example } from '../environments/Example';
import { Proof } from '../environments/Proof';
import { MathJaxProvider } from '../MathJaxProvider';

interface ContentRendererProps {
  content: ContentBlock[];
  edition?: Edition;
}

export function ContentRenderer({ content, edition = 'christian' }: ContentRendererProps) {
  const filteredContent = content.filter((block) => {
    if ('edition' in block && block.edition === 'christian' && edition === 'secular') {
      return false;
    }
    return true;
  });
  
  return (
    <MathJaxProvider>
      <div className="reader-content">
        {filteredContent.map((block, index) => (
          <BlockRenderer key={index} block={block} />
        ))}
      </div>
    </MathJaxProvider>
  );
}

function BlockRenderer({ block }: { block: ContentBlock }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className="mb-4 leading-relaxed">
          <RichText text={block.text} />
        </p>
      );
      
    case 'heading': {
      const HeadingTag = `h${block.level}` as 'h2' | 'h3' | 'h4';
      const sizeClasses = {
        2: 'text-2xl font-bold mt-8 mb-4',
        3: 'text-xl font-semibold mt-6 mb-3',
        4: 'text-lg font-medium mt-4 mb-2',
      };
      return (
        <HeadingTag className={sizeClasses[block.level]} style={{ color: 'var(--ax-text)' }}>
          {block.text}
        </HeadingTag>
      );
    }
      
    case 'definition':
      return (
        <Definition
          id={block.id}
          number={block.number}
          title={block.title}
          content={block.content}
        />
      );
      
    case 'theorem':
    case 'lemma':
    case 'corollary':
    case 'postulate':
      return (
        <Theorem
          id={block.id}
          number={block.number}
          title={block.title}
          content={block.content}
          label={block.label || block.type.charAt(0).toUpperCase() + block.type.slice(1)}
        />
      );
      
    case 'example':
      return (
        <Example
          id={block.id}
          number={block.number}
          title={block.title}
          problem={block.problem}
          solution={block.solution}
        />
      );
      
    case 'proof':
      return <Proof content={block.content} />;
      
    case 'figure':
      return (
        <figure id={block.id} className="my-6">
          <img 
            src={block.src} 
            alt={block.alt || block.caption}
            className="mx-auto max-w-full rounded-lg"
            style={{ boxShadow: 'var(--ax-card-shadow)' }}
          />
          {block.caption && (
            <figcaption className="text-center text-sm mt-2" style={{ color: 'var(--ax-text-secondary)' }}>
              <RichText text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
      
    case 'exercise':
      return (
        <div className="env-box env-proof">
          <div className="flex items-start gap-3">
            <span className="env-label whitespace-nowrap">
              Exercise {block.number}
            </span>
            <div className="flex-1">
              <div style={{ color: 'var(--ax-text)' }}>
                <RichText text={block.problem || block.content || ''} />
              </div>
              {block.solution && (
                <details className="mt-4">
                  <summary
                    className="cursor-pointer text-sm font-medium"
                    style={{ color: 'var(--ax-proof-accent)' }}
                  >
                    Show Solution
                  </summary>
                  <div className="mt-2 pt-2" style={{ borderTop: '1px solid var(--ax-border)' }}>
                    <RichText text={block.solution} />
                  </div>
                </details>
              )}
            </div>
          </div>
        </div>
      );
      
    case 'caution':
      return (
        <div className="env-box env-warning">
          <div className="flex items-start gap-3">
            <span className="text-xl">⚠️</span>
            <div className="flex-1">
              <div className="env-label">Caution</div>
              <div style={{ color: 'var(--ax-text)' }}>
                <RichText text={block.content || block.text || ''} />
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'list': {
      const ListTag = block.ordered ? 'ol' : 'ul';
      return (
        <ListTag className={`my-4 ml-6 ${block.ordered ? 'list-decimal' : 'list-disc'}`}>
          {block.items.map((item, i) => (
            <li key={i} className="mb-2">
              <RichText text={item} />
            </li>
          ))}
        </ListTag>
      );
    }
    
    case 'table':
      return (
        <div className="my-6 overflow-x-auto">
          <table className="w-full border-collapse">
            {block.headers && block.headers.length > 0 && (
              <thead>
                <tr style={{ borderBottom: '2px solid var(--ax-border)' }}>
                  {block.headers.map((header, i) => (
                    <th 
                      key={i} 
                      className="px-4 py-2 text-left font-semibold"
                      style={{ textAlign: block.alignment?.[i] || 'left', color: 'var(--ax-text)' }}
                    >
                      <RichText text={header} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} style={{ borderBottom: '1px solid var(--ax-border)' }}>
                  {row.map((cell, j) => (
                    <td 
                      key={j} 
                      className="px-4 py-2"
                      style={{ textAlign: block.alignment?.[j] || 'left' }}
                    >
                      <RichText text={cell} />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
          {block.caption && (
            <p className="text-center text-sm mt-2" style={{ color: 'var(--ax-text-secondary)' }}>
              {block.caption}
            </p>
          )}
        </div>
      );
      
    case 'warning':
    case 'important':
      return (
        <div className="env-box env-warning">
          <div className="env-label">
            {block.type === 'warning' ? '⚠️ Warning' : '❗ Important'}
          </div>
          {block.title && (
            <div className="env-title">{block.title}</div>
          )}
          <div style={{ color: 'var(--ax-text)' }}>
            <RichText text={block.content} />
          </div>
        </div>
      );
      
    case 'historical':
    case 'historical_note':
      return (
        <div className="env-box" style={{ borderTopColor: 'var(--ax-ex-accent)', backgroundColor: 'var(--ax-ex-bg)' }}>
          <div className="env-label" style={{ color: 'var(--ax-ex-accent)' }}>
            📜 Historical Note
          </div>
          <div style={{ color: 'var(--ax-text)' }}>
            <RichText text={block.content || block.text || ''} />
          </div>
        </div>
      );
      
    case 'keyconcept':
    case 'context':
    case 'strategy': {
      const labels = {
        keyconcept: '💡 Key Concept',
        context: '🌍 Math in Context',
        strategy: '🎯 Strategy',
      };
      return (
        <div className="env-box env-definition">
          <div className="env-label">
            {labels[block.type]}
          </div>
          {block.title && (
            <div className="env-title">{block.title}</div>
          )}
          <div style={{ color: 'var(--ax-text)' }}>
            <RichText text={block.content} />
          </div>
        </div>
      );
    }
      
    default:
      console.warn('Unknown content block type:', (block as { type: string }).type);
      return null;
  }
}
