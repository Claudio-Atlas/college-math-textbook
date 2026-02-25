import { useState, useEffect } from 'react';
import { getAllHighlightsForBook, type Highlight } from './TextHighlighter';
import type { Book } from '../../lib/types';

interface HighlightsReviewProps {
  bookId: string;
  book: Book;
}

const COLOR_MAP: Record<string, string> = {
  yellow: 'rgba(250, 204, 21, 0.35)',
  green: 'rgba(74, 222, 128, 0.35)',
  blue: 'rgba(96, 165, 250, 0.35)',
  pink: 'rgba(244, 114, 182, 0.35)',
};

export function HighlightsReview({ bookId, book }: HighlightsReviewProps) {
  const [allHighlights, setAllHighlights] = useState<Record<string, Highlight[]>>({});
  const [showConfirm, setShowConfirm] = useState(false);

  useEffect(() => {
    setAllHighlights(getAllHighlightsForBook(bookId));
  }, [bookId]);

  const totalCount = Object.values(allHighlights).reduce((sum, arr) => sum + arr.length, 0);

  function clearAll() {
    Object.keys(allHighlights).forEach(sectionId => {
      localStorage.removeItem(`axiom:highlights:${bookId}:${sectionId}`);
    });
    setAllHighlights({});
    setShowConfirm(false);
  }

  // Group by chapter
  const grouped: Record<string, { chapterTitle: string; sections: { sectionId: string; sectionTitle: string; chapterId: string; highlights: Highlight[] }[] }> = {};

  for (const [sectionKey, highlights] of Object.entries(allHighlights)) {
    // sectionKey is "chapter-section" like "1-2"
    const [chNum, secNum] = sectionKey.split('-');
    const chapter = book.chapters.find(c => c.number === Number(chNum));
    const section = chapter?.sections.find(s => s.number === Number(secNum));
    
    const chKey = chNum;
    if (!grouped[chKey]) {
      grouped[chKey] = {
        chapterTitle: chapter ? `Chapter ${chapter.number}: ${chapter.title}` : `Chapter ${chNum}`,
        sections: [],
      };
    }
    grouped[chKey].sections.push({
      sectionId: sectionKey,
      sectionTitle: section ? `${chNum}.${secNum} ${section.title}` : `Section ${chNum}.${secNum}`,
      chapterId: chapter?.id || `ch${chNum}`,
      highlights: highlights.sort((a, b) => a.timestamp - b.timestamp),
    });
  }

  return (
    <div style={{
      maxWidth: '48rem',
      margin: '0 auto',
      padding: '2rem 1.5rem',
      fontFamily: 'var(--ax-font-sans)',
      color: 'var(--ax-text)',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '2rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: 'var(--ax-violet)', margin: 0 }}>
            Your Highlights
          </h1>
          <p style={{ fontSize: '0.875rem', color: 'var(--ax-text-secondary)', marginTop: 4 }}>
            {totalCount} highlight{totalCount !== 1 ? 's' : ''} in {book.title}
          </p>
        </div>
        {totalCount > 0 && !showConfirm && (
          <button
            onClick={() => setShowConfirm(true)}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid var(--ax-warn-accent)',
              background: 'transparent',
              color: 'var(--ax-warn-accent)',
              cursor: 'pointer',
              fontSize: 13,
              fontWeight: 600,
            }}
          >
            Clear All
          </button>
        )}
        {showConfirm && (
          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={clearAll}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: 'none',
                background: 'var(--ax-warn-accent)',
                color: '#fff',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 600,
              }}
            >
              Confirm Delete
            </button>
            <button
              onClick={() => setShowConfirm(false)}
              style={{
                padding: '8px 16px',
                borderRadius: 8,
                border: '1px solid var(--ax-border)',
                background: 'transparent',
                color: 'var(--ax-text-secondary)',
                cursor: 'pointer',
                fontSize: 13,
              }}
            >
              Cancel
            </button>
          </div>
        )}
      </div>

      {totalCount === 0 ? (
        <div style={{
          textAlign: 'center',
          padding: '4rem 2rem',
          color: 'var(--ax-text-muted)',
        }}>
          <p style={{ fontSize: '2rem', marginBottom: 12 }}>📚</p>
          <p style={{ fontSize: '1rem', fontWeight: 500 }}>No highlights yet.</p>
          <p style={{ fontSize: '0.875rem', marginTop: 4 }}>
            Select text while reading to highlight it.
          </p>
        </div>
      ) : (
        Object.entries(grouped)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([chKey, { chapterTitle, sections }]) => (
            <div key={chKey} style={{ marginBottom: '2rem' }}>
              <h2 style={{
                fontSize: '1.1rem',
                fontWeight: 700,
                color: 'var(--ax-text)',
                borderBottom: '2px solid var(--ax-border)',
                paddingBottom: 8,
                marginBottom: 12,
              }}>
                {chapterTitle}
              </h2>
              {sections.map(({ sectionId, sectionTitle, chapterId, highlights }) => (
                <div key={sectionId} style={{ marginBottom: 16, marginLeft: 8 }}>
                  <h3 style={{
                    fontSize: '0.95rem',
                    fontWeight: 600,
                    color: 'var(--ax-text-secondary)',
                    marginBottom: 8,
                  }}>
                    {sectionTitle}
                  </h3>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                    {highlights.map(h => {
                      const [ch, sec] = sectionId.split('-');
                      const sectionSlug = `sec${sec}`;
                      return (
                        <a
                          key={h.id}
                          href={`/${bookId}/${chapterId}/${sectionSlug}`}
                          style={{
                            display: 'block',
                            padding: '10px 14px',
                            borderRadius: 10,
                            borderLeft: `4px solid ${COLOR_MAP[h.color] || COLOR_MAP.yellow}`,
                            background: 'var(--ax-card-bg)',
                            textDecoration: 'none',
                            color: 'var(--ax-text)',
                            transition: 'border-color 150ms ease-out',
                          }}
                        >
                          <p style={{
                            fontSize: '0.9rem',
                            lineHeight: 1.5,
                            margin: 0,
                            background: COLOR_MAP[h.color] || COLOR_MAP.yellow,
                            borderRadius: 2,
                            padding: '1px 4px',
                            display: 'inline',
                          }}>
                            {h.text.length > 120 ? h.text.slice(0, 120) + '…' : h.text}
                          </p>
                          <p style={{
                            fontSize: '0.75rem',
                            color: 'var(--ax-text-muted)',
                            marginTop: 6,
                            margin: '6px 0 0',
                          }}>
                            {new Date(h.timestamp).toLocaleDateString(undefined, {
                              month: 'short', day: 'numeric', year: 'numeric',
                              hour: '2-digit', minute: '2-digit',
                            })}
                          </p>
                        </a>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          ))
      )}
    </div>
  );
}
