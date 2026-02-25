import { useEffect, useState, useCallback } from 'react';

/**
 * DeepLink — handles URL hash navigation and copy-link buttons for env blocks.
 * Also handles figure cross-reference clicks and flash animations.
 */
export function DeepLink() {
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Flash animation for a target element
  const flashElement = useCallback((el: HTMLElement) => {
    el.classList.add('ax-flash');
    setTimeout(() => el.classList.remove('ax-flash'), 1200);
  }, []);

  // Scroll to hash on load
  useEffect(() => {
    const hash = window.location.hash.slice(1);
    if (!hash) return;

    // Small delay for content to render
    const timer = setTimeout(() => {
      const el = document.getElementById(hash);
      if (el) {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        flashElement(el);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [flashElement]);

  // Add copy-link buttons to env boxes
  useEffect(() => {
    const envBoxes = document.querySelectorAll('.env-box[id]');
    const buttons: HTMLButtonElement[] = [];

    envBoxes.forEach(box => {
      const id = box.getAttribute('id');
      if (!id) return;

      // Check if button already exists
      if (box.querySelector('.ax-copy-link')) return;

      const btn = document.createElement('button');
      btn.className = 'ax-copy-link';
      btn.setAttribute('aria-label', 'Copy link to this block');
      btn.innerHTML = '🔗';
      btn.style.cssText = `
        position: absolute;
        top: 8px;
        right: 8px;
        background: none;
        border: none;
        cursor: pointer;
        opacity: 0;
        transition: opacity 150ms ease-out;
        font-size: 14px;
        padding: 4px;
        z-index: 5;
      `;

      // Make env-box position relative for absolute button
      (box as HTMLElement).style.position = 'relative';

      btn.addEventListener('click', (e) => {
        e.stopPropagation();
        const url = `${window.location.origin}${window.location.pathname}#${id}`;
        navigator.clipboard.writeText(url).then(() => {
          setCopiedId(id);
          setTimeout(() => setCopiedId(null), 2000);
        });
      });

      box.appendChild(btn);
      buttons.push(btn);

      // Show on hover
      box.addEventListener('mouseenter', () => { btn.style.opacity = '1'; });
      box.addEventListener('mouseleave', () => { btn.style.opacity = '0'; });
    });

    return () => {
      buttons.forEach(btn => btn.remove());
    };
  }, []);

  // Handle figure cross-reference clicks
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      const target = e.target as HTMLElement;
      const link = target.closest('a[data-figure-ref]');
      if (!link) return;

      e.preventDefault();
      const figId = link.getAttribute('data-figure-ref');
      if (!figId) return;

      // Store return position
      const returnY = window.scrollY;

      const figEl = document.getElementById(figId);
      if (figEl) {
        figEl.scrollIntoView({ behavior: 'smooth', block: 'center' });
        flashElement(figEl);

        // Add "↑ Back" link if not already present
        if (!figEl.querySelector('.ax-back-link')) {
          const backLink = document.createElement('a');
          backLink.className = 'ax-back-link';
          backLink.href = '#';
          backLink.textContent = '↑ Back';
          backLink.style.cssText = `
            display: inline-block;
            margin-top: 6px;
            font-size: 12px;
            font-family: var(--ax-font-sans);
            color: var(--ax-violet);
            text-decoration: none;
            cursor: pointer;
          `;
          backLink.addEventListener('click', (ev) => {
            ev.preventDefault();
            window.scrollTo({ top: returnY, behavior: 'smooth' });
            backLink.remove();
          });
          figEl.appendChild(backLink);
        }
      }
    }

    document.addEventListener('click', handleClick);
    return () => document.removeEventListener('click', handleClick);
  }, [flashElement]);

  return (
    <>
      {copiedId && (
        <div style={{
          position: 'fixed',
          bottom: 20,
          left: '50%',
          transform: 'translateX(-50%)',
          background: 'var(--ax-glass)',
          backdropFilter: 'blur(16px)',
          border: '1px solid var(--ax-border)',
          borderRadius: 20,
          padding: '8px 16px',
          fontSize: 13,
          color: 'var(--ax-text)',
          zIndex: 150,
          fontFamily: 'var(--ax-font-sans)',
          animation: 'toolbar-appear 150ms ease-out forwards',
        }}>
          ✓ Link copied
        </div>
      )}
      <style>{`
        @keyframes ax-flash-glow {
          0% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0.4); }
          50% { box-shadow: 0 0 0 6px rgba(139, 92, 246, 0.2); }
          100% { box-shadow: 0 0 0 0 rgba(139, 92, 246, 0); }
        }
        .ax-flash {
          animation: ax-flash-glow 1s ease-out !important;
          border-color: var(--ax-violet) !important;
          transition: border-color 300ms ease-out;
        }
        @media (prefers-reduced-motion: reduce) {
          .ax-flash {
            animation: none !important;
            border-color: var(--ax-violet) !important;
          }
        }
      `}</style>
    </>
  );
}
