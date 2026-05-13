import { useState } from 'react';
import type { ContentBlock, ExerciseBlock } from '../../lib/types';
import { RichText } from './RichText';
import { Definition } from '../environments/Definition';
import { Theorem } from '../environments/Theorem';
import { Example } from '../environments/Example';
import { Proof } from '../environments/Proof';
import { Summary } from '../environments/Summary';
import { Remark } from '../environments/Remark';
import { Algorithm } from '../environments/Algorithm';
import { Method } from '../environments/Method';
import { Connection } from '../environments/Connection';
import { Tip } from '../environments/Tip';
import { Exercise } from '../environments/Exercise';
import { ExerciseSection } from '../environments/ExerciseSection';
import { MathJaxProvider } from '../MathJaxProvider';

interface ContentRendererProps {
  content: ContentBlock[];
  bookId?: string;
  chapterSection?: string;
}

export function ContentRenderer({ content, bookId, chapterSection }: ContentRendererProps) {
  // No edition filtering — College Math is single-brand. All blocks render.
  const filteredContent = content;

  // Group consecutive exercises into ExerciseSections
  const grouped: (ContentBlock | { type: '__exerciseGroup'; exercises: ExerciseBlock[] })[] = [];
  for (const block of filteredContent) {
    if (block.type === 'exercise') {
      const last = grouped[grouped.length - 1];
      if (last && (last as any).type === '__exerciseGroup') {
        (last as any).exercises.push(block);
      } else {
        grouped.push({ type: '__exerciseGroup', exercises: [block as ExerciseBlock] });
      }
    } else {
      grouped.push(block);
    }
  }
  
  return (
    <MathJaxProvider>
      <div>
        {grouped.map((item, index) => {
          if ((item as any).type === '__exerciseGroup') {
            return (
              <ExerciseSection
                key={`exgroup-${index}`}
                exercises={(item as any).exercises}
                bookId={bookId}
                chapterSection={chapterSection}
              />
            );
          }
          const block = item as ContentBlock;
          return (
            <BlockRenderer key={index} block={block} isFirstParagraph={!!(block as any)._firstParagraph} />
          );
        })}
      </div>
    </MathJaxProvider>
  );
}

function BlockRenderer({ block, isFirstParagraph = false }: { block: ContentBlock; isFirstParagraph?: boolean }) {
  switch (block.type) {
    case 'paragraph':
      return (
        <p className={`leading-relaxed${isFirstParagraph ? ' section-first-paragraph' : ''}`}>
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
        <FigureBlock key={block.id || index} block={block} />
      );
      
    case 'exercise':
      // Exercises are grouped by ContentRenderer into ExerciseSections
      // This fallback handles any strays
      return (
        <Exercise
          id={block.id}
          number={block.number}
          problem={block.problem}
          content={block.content}
          hint={block.hint}
          variant={block.variant}
          challenging={block.challenging}
        />
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
      
    case 'summary':
      return (
        <Summary
          id={block.id}
          title={block.title}
          content={block.content}
        />
      );

    case 'remark':
      return (
        <Remark
          id={block.id}
          title={block.title}
          content={block.content}
        />
      );

    case 'algorithm':
      return (
        <Algorithm
          id={block.id}
          number={block.number}
          title={block.title}
          content={block.content}
        />
      );

    case 'method':
      return (
        <Method
          id={block.id}
          title={block.title}
          content={block.content}
        />
      );

    case 'connection':
      return (
        <Connection
          id={block.id}
          title={block.title}
          content={block.content}
        />
      );

    case 'tip':
      return (
        <Tip
          id={block.id}
          title={block.title}
          content={block.content}
        />
      );

    default:
      console.warn('Unknown content block type:', (block as { type: string }).type);
      return null;
  }
}

function FigureBlock({ block }: { block: any }) {
  const [failed, setFailed] = useState(false);

  // Inline-SVG variant (used by the College Math converter — figures
  // come over from MAT-144 lesson dicts as embedded <svg> markup).
  if (block.svg) {
    return (
      <figure id={block.id} className="my-6">
        <div
          className="figure-svg-wrap mx-auto"
          style={{ maxWidth: '100%', textAlign: 'center' }}
          dangerouslySetInnerHTML={{ __html: block.svg }}
        />
        {block.caption && (
          <figcaption className="text-center text-sm mt-2" style={{ color: 'var(--ax-text-secondary)' }}>
            <RichText text={block.caption} />
          </figcaption>
        )}
      </figure>
    );
  }

  if (failed) {
    return (
      <figure id={block.id} className="my-6">
        <div className="figure-fallback">
          <span className="figure-fallback-icon">🖼️</span>
          <span>Figure not available</span>
          {block.caption && (
            <span className="figure-fallback-caption">
              {block.caption.replace(/\$[^$]*\$/g, '[math]')}
            </span>
          )}
        </div>
        {block.caption && (
          <figcaption className="text-center text-sm mt-2" style={{ color: 'var(--ax-text-secondary)' }}>
            <RichText text={block.caption} />
          </figcaption>
        )}
      </figure>
    );
  }

  return (
    <figure id={block.id} className="my-6">
      <img
        src={block.src}
        alt={block.alt || block.caption}
        className="mx-auto max-w-full rounded-lg"
        style={{ boxShadow: 'var(--ax-card-shadow)', cursor: 'zoom-in' }}
        onError={() => setFailed(true)}
        onClick={() => {
          window.dispatchEvent(new CustomEvent('ax:lightbox-open', { detail: { figureId: block.id } }));
        }}
      />
      {block.caption && (
        <figcaption className="text-center text-sm mt-2" style={{ color: 'var(--ax-text-secondary)' }}>
          <RichText text={block.caption} />
        </figcaption>
      )}
    </figure>
  );
}
