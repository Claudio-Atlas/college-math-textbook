import { useState, useEffect, useCallback } from 'react';
import type { FigureBlock } from '../../lib/types';

interface FigureLightboxProps {
  figures: FigureBlock[];
}

export function FigureLightbox({ figures }: FigureLightboxProps) {
  const [currentIndex, setCurrentIndex] = useState(-1);
  const isOpen = currentIndex >= 0;
  const figure = isOpen ? figures[currentIndex] : null;

  // Listen for lightbox open events from figure clicks
  useEffect(() => {
    function handleOpen(e: Event) {
      const detail = (e as CustomEvent).detail;
      const idx = figures.findIndex(f => f.id === detail.figureId);
      if (idx >= 0) setCurrentIndex(idx);
    }
    window.addEventListener('ax:lightbox-open', handleOpen);
    return () => window.removeEventListener('ax:lightbox-open', handleOpen);
  }, [figures]);

  const close = useCallback(() => setCurrentIndex(-1), []);
  const prev = useCallback(() => setCurrentIndex(i => Math.max(0, i - 1)), []);
  const next = useCallback(() => setCurrentIndex(i => Math.min(figures.length - 1, i + 1)), [figures.length]);

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;
    function handleKey(e: KeyboardEvent) {
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft') prev();
      if (e.key === 'ArrowRight') next();
    }
    document.addEventListener('keydown', handleKey);
    document.body.style.overflow = 'hidden';
    return () => {
      document.removeEventListener('keydown', handleKey);
      document.body.style.overflow = '';
    };
  }, [isOpen, close, prev, next]);

  if (!isOpen || !figure) return null;

  return (
    <div
      className="lightbox-backdrop"
      onClick={close}
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 200,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'rgba(0, 0, 0, 0.85)',
        backdropFilter: 'blur(20px) saturate(180%)',
        WebkitBackdropFilter: 'blur(20px) saturate(180%)',
        animation: 'lightbox-in 250ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        padding: '2rem',
      }}
      role="dialog"
      aria-label="Figure lightbox"
    >
      {/* Close button */}
      <button
        onClick={close}
        style={{
          position: 'absolute',
          top: 16,
          right: 16,
          background: 'rgba(255,255,255,0.1)',
          border: 'none',
          borderRadius: '50%',
          width: 40,
          height: 40,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          color: '#fff',
          fontSize: 20,
          zIndex: 201,
        }}
        aria-label="Close lightbox"
      >
        ✕
      </button>

      {/* Prev arrow */}
      {currentIndex > 0 && (
        <button
          onClick={(e) => { e.stopPropagation(); prev(); }}
          style={{
            position: 'absolute',
            left: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 22,
            zIndex: 201,
          }}
          aria-label="Previous figure"
        >
          ‹
        </button>
      )}

      {/* Next arrow */}
      {currentIndex < figures.length - 1 && (
        <button
          onClick={(e) => { e.stopPropagation(); next(); }}
          style={{
            position: 'absolute',
            right: 16,
            top: '50%',
            transform: 'translateY(-50%)',
            background: 'rgba(255,255,255,0.1)',
            border: 'none',
            borderRadius: '50%',
            width: 44,
            height: 44,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: 'pointer',
            color: '#fff',
            fontSize: 22,
            zIndex: 201,
          }}
          aria-label="Next figure"
        >
          ›
        </button>
      )}

      {/* Image + caption */}
      <div
        onClick={(e) => e.stopPropagation()}
        style={{
          maxWidth: '90vw',
          maxHeight: '85vh',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          animation: 'lightbox-content-in 250ms cubic-bezier(0.32, 0.72, 0, 1) forwards',
        }}
      >
        <img
          src={figure.src}
          alt={figure.alt || figure.caption}
          style={{
            maxWidth: '100%',
            maxHeight: '75vh',
            objectFit: 'contain',
            borderRadius: 8,
          }}
        />
        {figure.caption && (
          <p style={{
            color: 'rgba(255,255,255,0.7)',
            fontSize: 14,
            textAlign: 'center',
            marginTop: 12,
            maxWidth: 600,
            lineHeight: 1.5,
          }}>
            {figure.caption}
          </p>
        )}
        {figures.length > 1 && (
          <p style={{
            color: 'rgba(255,255,255,0.4)',
            fontSize: 12,
            marginTop: 8,
          }}>
            {currentIndex + 1} / {figures.length}
          </p>
        )}
      </div>

      <style>{`
        @keyframes lightbox-in {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes lightbox-content-in {
          from { opacity: 0; transform: scale(0.95); }
          to { opacity: 1; transform: scale(1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .lightbox-backdrop, .lightbox-backdrop * {
            animation-duration: 0.01ms !important;
          }
        }
      `}</style>
    </div>
  );
}
