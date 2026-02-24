/**
 * MiniToc — Floating subsection tracker on the right edge.
 * Shows h2 headings with active tracking as you scroll.
 * Hidden on mobile, fades in after scrolling past hero.
 */
import { useState, useEffect, useRef } from 'react';

interface Heading {
  id: string;
  text: string;
}

export function MiniToc() {
  const [headings, setHeadings] = useState<Heading[]>([]);
  const [activeIndex, setActiveIndex] = useState(-1);
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  // Collect h2 headings after hydration
  useEffect(() => {
    const timer = setTimeout(() => {
      const h2s = document.querySelectorAll('.reader-content h2');
      const collected: Heading[] = [];
      h2s.forEach((h2, i) => {
        const id = h2.id || `section-heading-${i}`;
        if (!h2.id) h2.id = id;
        collected.push({ id, text: h2.textContent || '' });
      });
      setHeadings(collected);
    }, 500);
    return () => clearTimeout(timer);
  }, []);

  // Track active heading via IntersectionObserver
  useEffect(() => {
    if (headings.length === 0) return;

    const callback: IntersectionObserverCallback = (entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const idx = headings.findIndex(h => h.id === entry.target.id);
          if (idx !== -1) setActiveIndex(idx);
        }
      });
    };

    observerRef.current = new IntersectionObserver(callback, {
      rootMargin: '-80px 0px -60% 0px',
      threshold: 0,
    });

    headings.forEach(h => {
      const el = document.getElementById(h.id);
      if (el) observerRef.current!.observe(el);
    });

    return () => observerRef.current?.disconnect();
  }, [headings]);

  // Show/hide based on scroll position
  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 300);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  if (headings.length < 2) return null;

  return (
    <nav
      className="hidden xl:block fixed right-6 top-1/2 -translate-y-1/2 z-40"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateX(0) translateY(-50%)' : 'translateX(8px) translateY(-50%)',
        transition: 'opacity 300ms ease-out, transform 300ms ease-out',
        pointerEvents: visible ? 'auto' : 'none',
      }}
      aria-label="Section outline"
    >
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          gap: 2,
          padding: '8px 0',
        }}
      >
        {headings.map((h, i) => (
          <a
            key={h.id}
            href={`#${h.id}`}
            onClick={(e) => {
              e.preventDefault();
              document.getElementById(h.id)?.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }}
            title={h.text}
            style={{
              display: 'block',
              width: i === activeIndex ? 24 : 12,
              height: 3,
              borderRadius: 2,
              background: i === activeIndex ? 'var(--ax-violet)' : 'var(--ax-text-muted)',
              opacity: i === activeIndex ? 1 : 0.3,
              transition: 'all 200ms ease-out',
              cursor: 'pointer',
            }}
            aria-label={h.text}
            aria-current={i === activeIndex ? 'true' : undefined}
          />
        ))}
      </div>
    </nav>
  );
}
