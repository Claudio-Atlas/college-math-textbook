/**
 * MarketingNav — Frosted glass navigation for marketing pages.
 * Matches Axiom Reader's frost treatment with scroll-aware border.
 * 
 * Phase 1: Kai (Design Engineer) — replaces solid bg-white headers.
 */
import { useState, useEffect } from 'react';
import { useBrand } from '../brand/BrandProvider';
import { Logo } from '../brand/Logo';

interface MarketingNavProps {
  /** Optional back link (e.g., "Back to Catalog" on book landing pages) */
  backHref?: string;
  backLabel?: string;
  /** Nav links for the right side */
  links?: Array<{ href: string; label: string }>;
}

export function MarketingNav({ backHref, backLabel, links }: MarketingNavProps) {
  const { brand } = useBrand();
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // Sentinel element at 8px from top — same pattern as ReaderHeader
    const sentinel = document.createElement('div');
    sentinel.style.cssText =
      'position:absolute;top:8px;left:0;width:1px;height:1px;pointer-events:none;';
    document.body.prepend(sentinel);

    const observer = new IntersectionObserver(
      ([entry]) => setScrolled(!entry.isIntersecting),
      { threshold: 1 }
    );
    observer.observe(sentinel);

    return () => {
      observer.disconnect();
      sentinel.remove();
    };
  }, []);

  return (
    <header
      className="sticky top-0 z-50"
      style={{
        background: 'var(--ax-glass)',
        backdropFilter: 'var(--ax-frost)',
        WebkitBackdropFilter: 'var(--ax-frost)',
        borderBottom: scrolled
          ? '1px solid var(--ax-border)'
          : '1px solid transparent',
        transition: 'border-color 200ms ease-out',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex items-center justify-between">
          {/* Left: Logo or back link */}
          {backHref ? (
            <a href={backHref} className="flex items-center gap-2">
              <Logo size="md" />
            </a>
          ) : (
            <Logo size="lg" />
          )}

          {/* Right: nav links or back button */}
          <nav className="flex items-center gap-1">
            {backHref && backLabel && (
              <a
                href={backHref}
                className="ax-nav-link flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: 'var(--ax-text-secondary)',
                  transition: 'color 150ms ease-out, background 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--ax-text)';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--ax-text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                <svg
                  className="w-4 h-4"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M15 19l-7-7 7-7"
                  />
                </svg>
                {backLabel}
              </a>
            )}

            {links?.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="hidden sm:inline-flex px-3 py-2 rounded-lg text-sm font-medium"
                style={{
                  color: 'var(--ax-text-secondary)',
                  transition: 'color 150ms ease-out, background 150ms ease-out',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.color = 'var(--ax-text)';
                  e.currentTarget.style.background = 'rgba(139, 92, 246, 0.08)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.color = 'var(--ax-text-secondary)';
                  e.currentTarget.style.background = 'transparent';
                }}
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>
      </div>
    </header>
  );
}
