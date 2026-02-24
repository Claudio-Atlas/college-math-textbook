import { useState, useEffect, useRef } from 'react';

interface NavInfo {
  chapterId: string;
  sectionId: string;
  chapter: number;
  section: number;
  title: string;
}

interface UpNextCardProps {
  bookId: string;
  nextSection: NavInfo;
}

export function UpNextCard({ bookId, nextSection }: UpNextCardProps) {
  const [visible, setVisible] = useState(false);
  const observerRef = useRef<IntersectionObserver | null>(null);

  useEffect(() => {
    // Observe the last major content element in <main>
    const main = document.getElementById('main-content');
    if (!main) return;

    const findTarget = () => {
      // Look for the last article child or last significant block
      const articles = main.querySelectorAll('article');
      if (articles.length) return articles[articles.length - 1];
      const children = main.children;
      return children.length ? children[children.length - 1] as HTMLElement : null;
    };

    const target = findTarget();
    if (!target) return;

    observerRef.current = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) setVisible(true);
      },
      { threshold: 0.5 }
    );

    observerRef.current.observe(target);
    return () => observerRef.current?.disconnect();
  }, []);

  const url = `/${bookId}/${nextSection.chapterId}/${nextSection.sectionId}`;

  return (
    <div
      className="flex justify-center px-4 pb-12"
      style={{
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(24px)',
        transition: `opacity 350ms cubic-bezier(0.32, 0.72, 0, 1) 150ms, transform 350ms cubic-bezier(0.32, 0.72, 0, 1) 150ms`,
        pointerEvents: visible ? 'auto' : 'none',
      }}
    >
      <a
        href={url}
        className="group block w-full max-w-lg rounded-2xl p-5 no-underline"
        style={{
          background: 'var(--ax-glass, rgba(28,29,36,0.7))',
          backdropFilter: 'blur(12px)',
          WebkitBackdropFilter: 'blur(12px)',
          border: '1px solid var(--ax-border)',
          boxShadow: 'inset 0 1px 0 rgba(255,255,255,0.04)',
          transition: 'border-color 200ms ease-out',
        }}
        onMouseEnter={(e) => {
          e.currentTarget.style.borderColor = 'rgba(255,255,255,0.14)';
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.borderColor = 'var(--ax-border)';
        }}
      >
        <div className="text-xs font-semibold uppercase tracking-wider mb-2" style={{ color: 'var(--ax-text-muted)', fontFamily: 'Inter, sans-serif', letterSpacing: '0.08em' }}>
          Up Next
        </div>
        <div className="flex items-center justify-between gap-3">
          <div>
            <span className="text-base font-semibold" style={{ color: 'var(--ax-text)' }}>
              {nextSection.chapter}.{nextSection.section} {nextSection.title}
            </span>
          </div>
          <span
            className="shrink-0 text-lg"
            style={{
              color: 'var(--ax-violet, #8B5CF6)',
              transition: 'transform 200ms ease-out',
              display: 'inline-block',
            }}
          >
            <svg className="w-5 h-5 group-hover:translate-x-[3px] transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
            </svg>
          </span>
        </div>
      </a>
    </div>
  );
}
