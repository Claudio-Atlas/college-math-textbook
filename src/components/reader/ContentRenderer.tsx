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
  // Filter content based on edition
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
      
    case 'heading':
      const HeadingTag = `h${block.level}` as 'h2' | 'h3' | 'h4';
      const headingClasses = {
        2: 'text-2xl font-bold mt-8 mb-4 text-atlas-deep',
        3: 'text-xl font-semibold mt-6 mb-3 text-atlas-deep',
        4: 'text-lg font-medium mt-4 mb-2 text-atlas-deep',
      };
      return (
        <HeadingTag className={headingClasses[block.level]}>
          {block.text}
        </HeadingTag>
      );
      
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
            className="mx-auto max-w-full rounded-lg shadow-sm"
          />
          {block.caption && (
            <figcaption className="text-center text-sm text-atlas-secondary mt-2">
              <RichText text={block.caption} />
            </figcaption>
          )}
        </figure>
      );
      
    case 'exercise':
      return (
        <div className="my-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
          <div className="flex items-start gap-3">
            <span className="text-sm font-semibold text-blue-600 whitespace-nowrap">
              Exercise {block.number}
            </span>
            <div className="flex-1">
              <div className="text-atlas-text">
                <RichText text={block.problem || block.content || ''} />
              </div>
              {block.solution && (
                <details className="mt-4">
                  <summary className="cursor-pointer text-sm font-medium text-blue-600 hover:text-blue-800">
                    Show Solution
                  </summary>
                  <div className="mt-2 pt-2 border-t border-blue-200">
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
        <div className="my-6 p-4 bg-amber-50 border-l-4 border-amber-500 rounded-r-lg">
          <div className="flex items-start gap-3">
            <span className="text-amber-600 text-xl">⚠️</span>
            <div className="flex-1">
              <div className="text-sm font-semibold text-amber-800 mb-1">Caution</div>
              <div className="text-amber-900">
                <RichText text={block.content || block.text || ''} />
              </div>
            </div>
          </div>
        </div>
      );
      
    case 'list':
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
    
    case 'table':
      return (
        <div className="my-6 overflow-x-auto">
          <table className="w-full border-collapse">
            {block.headers && block.headers.length > 0 && (
              <thead>
                <tr className="border-b-2 border-atlas-border">
                  {block.headers.map((header, i) => (
                    <th 
                      key={i} 
                      className="px-4 py-2 text-left font-semibold text-atlas-deep"
                      style={{ textAlign: block.alignment?.[i] || 'left' }}
                    >
                      <RichText text={header} />
                    </th>
                  ))}
                </tr>
              </thead>
            )}
            <tbody>
              {block.rows.map((row, i) => (
                <tr key={i} className="border-b border-atlas-border">
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
            <p className="text-center text-sm text-atlas-secondary mt-2">
              {block.caption}
            </p>
          )}
        </div>
      );
      
    case 'warning':
    case 'important':
      return (
        <div className="env-box env-warning">
          <div className="env-label text-atlas-rose">
            {block.type === 'warning' ? '⚠️ Warning' : '❗ Important'}
          </div>
          {block.title && (
            <div className="env-title text-atlas-deep">{block.title}</div>
          )}
          <div className="text-atlas-text">
            <RichText text={block.content} />
          </div>
        </div>
      );
      
    case 'historical':
    case 'historical_note':
      return (
        <div className="my-6 p-4 bg-amber-50 border border-amber-200 rounded-lg">
          <div className="text-sm font-semibold text-amber-800 mb-2">
            📜 Historical Note
          </div>
          <div className="text-amber-900">
            <RichText text={block.content || block.text || ''} />
          </div>
        </div>
      );
      
    case 'keyconcept':
    case 'context':
    case 'strategy':
      const labels = {
        keyconcept: '💡 Key Concept',
        context: '🌍 Math in Context',
        strategy: '🎯 Strategy',
      };
      return (
        <div className="my-6 p-4 bg-atlas-teal-light border border-atlas-teal rounded-lg">
          <div className="text-sm font-semibold text-atlas-teal-dark mb-2">
            {labels[block.type]}
          </div>
          {block.title && (
            <div className="font-medium text-atlas-deep mb-2">{block.title}</div>
          )}
          <div className="text-atlas-text">
            <RichText text={block.content} />
          </div>
        </div>
      );
      
    default:
      // Log unknown types in development
      console.warn('Unknown content block type:', (block as { type: string }).type);
      return null;
  }
}
