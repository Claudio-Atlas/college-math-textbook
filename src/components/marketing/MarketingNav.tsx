/**
 * MarketingNav — Frosted glass navigation for marketing pages.
 * Matches Axiom Reader's frost treatment with scroll-aware border.
 * Single source of truth for all marketing page headers.
 * 
 * Phase 1: Kai (Design Engineer) — frost + scroll-aware border.
 * Phase 2: Zara (Frontend Lead) — ThemeToggle, mobile hamburger, consistent 48-56px height.
 */
import { useState, useEffect } from 'react';
import { useBrand } from '../brand/BrandProvider';
import { Logo } from '../brand/Logo';
import { ThemeToggle } from '../brand/ThemeToggle';

interface MarketingNavProps {
  /** Optional back link (e.g., "Back to Catalog" on book landing pages) */
  backHref?: string;
  backLabel?: string;
  /** Nav links for the right side */
  links?: Array<{ href: string; label: string }>;
  /** Show ThemeToggle (default: true) */
  showThemeToggle?: boolean;
}

export function MarketingNav({ backHref, backLabel, links, showThemeToggle = true }: MarketingNavProps) {
  const { brand } = useBrand();
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

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
        height: '52px',
        background: 'var(--ax-glass)',
        backdropFilter: 'var(--ax-frost)',
        WebkitBackdropFilter: 'var(--ax-frost)',
        borderBottom: scrolled
          ? '1px solid var(--ax-border)'
          : '1px solid transparent',
        transition: 'border-color 200ms ease-out',
      }}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 h-full">
        <div className="flex items-center justify-between h-full">
          {/* Left: Logo or back link */}
          {backHref ? (
            <a href={backHref} className="flex items-center gap-2">
              <Logo size="md" />
            </a>
          ) : (
            <Logo size="lg" />
          )}

          {/* Right: nav links + theme toggle */}
          <div className="flex items-center gap-1">
            {/* Back link (book landing pages) */}
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

            {/* Desktop nav links */}
            <nav className="hidden sm:flex items-center gap-1">
              {links?.map((link) => (
                <a
                  key={link.href}
                  href={link.href}
                  className="px-3 py-2 rounded-lg text-sm font-medium"
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

            {showThemeToggle && <ThemeToggle />}

            {/* Mobile hamburger — TOC-style icon, not full menu. Matches Axiom Reader's approach. */}
            {links && links.length > 0 && (
              <div className="sm:hidden relative">
                <button
                  onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
                  className="flex items-center justify-center w-9 h-9 rounded-lg"
                  style={{ color: 'var(--ax-text-secondary)', transition: 'background 150ms ease-out' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                  aria-label="Toggle navigation menu"
                  aria-expanded={mobileMenuOpen}
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    {mobileMenuOpen ? (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M6 18L18 6M6 6l12 12" />
                    ) : (
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25h16.5" />
                    )}
                  </svg>
                </button>

                {/* Mobile dropdown */}
                {mobileMenuOpen && (
                  <div
                    className="absolute right-0 top-full mt-1 py-2 rounded-lg min-w-[160px]"
                    style={{
                      background: 'var(--ax-glass)',
                      backdropFilter: 'var(--ax-frost)',
                      WebkitBackdropFilter: 'var(--ax-frost)',
                      border: '1px solid var(--ax-border)',
                    }}
                  >
                    {links.map((link) => (
                      <a
                        key={link.href}
                        href={link.href}
                        className="block px-4 py-2 text-sm"
                        style={{ color: 'var(--ax-text-secondary)' }}
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        {link.label}
                      </a>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
