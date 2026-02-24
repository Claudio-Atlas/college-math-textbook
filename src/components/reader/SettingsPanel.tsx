import { useState, useRef, useEffect, useCallback } from 'react';

const MIN_SIZE = 14;
const MAX_SIZE = 22;
const DEFAULT_SIZE = 18;
const STORAGE_KEY_SIZE = 'ax-text-size';
const STORAGE_KEY_THEME = 'ax-theme';
const STORAGE_KEY_FONT = 'ax-font';

function getInitialSize(): number {
  if (typeof window === 'undefined') return DEFAULT_SIZE;
  const stored = localStorage.getItem(STORAGE_KEY_SIZE);
  if (stored) {
    const n = parseInt(stored, 10);
    if (n >= MIN_SIZE && n <= MAX_SIZE) return n;
  }
  return DEFAULT_SIZE;
}

function getInitialTheme(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark';
  const stored = localStorage.getItem(STORAGE_KEY_THEME);
  if (stored === 'light' || stored === 'dark') return stored;
  return 'dark';
}

function getInitialFont(): 'serif' | 'sans' {
  if (typeof window === 'undefined') return 'serif';
  const stored = localStorage.getItem(STORAGE_KEY_FONT);
  if (stored === 'serif' || stored === 'sans') return stored;
  return 'serif';
}

export function SettingsPanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [size, setSize] = useState(getInitialSize);
  const [theme, setTheme] = useState<'dark' | 'light'>(getInitialTheme);
  const [font, setFont] = useState<'serif' | 'sans'>(getInitialFont);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Apply text size
  useEffect(() => {
    document.documentElement.style.setProperty('--ax-font-size', `${size}px`);
    localStorage.setItem(STORAGE_KEY_SIZE, String(size));
  }, [size]);

  // Apply theme
  useEffect(() => {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(STORAGE_KEY_THEME, theme);
  }, [theme]);

  // Apply font
  useEffect(() => {
    const fontFamily = font === 'serif' ? 'var(--ax-font-serif)' : 'var(--ax-font-sans)';
    document.documentElement.style.setProperty('--ax-body-font', fontFamily);
    localStorage.setItem(STORAGE_KEY_FONT, font);
  }, [font]);

  const toggleTheme = useCallback(() => {
    setTheme(t => t === 'dark' ? 'light' : 'dark');
  }, []);

  return (
    <div style={{ position: 'relative' }}>
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 2,
          padding: '6px 10px',
          borderRadius: 8,
          border: 'none',
          cursor: 'pointer',
          fontSize: 14,
          fontWeight: 600,
          fontFamily: 'Inter, system-ui, sans-serif',
          background: isOpen ? '#8B5CF6' : 'transparent',
          color: isOpen ? '#fff' : 'var(--ax-text-secondary, #9496A1)',
          transition: 'all 150ms ease-out',
        }}
        aria-label="Settings"
        aria-expanded={isOpen}
      >
        <span style={{ fontSize: 12, fontWeight: 700 }}>A</span>
        <span style={{ fontSize: 16, fontWeight: 700 }}>a</span>
      </button>

      {isOpen && (
        <div
          ref={panelRef}
          style={{
            position: 'absolute',
            right: 0,
            top: 'calc(100% + 8px)',
            width: 260,
            background: 'var(--ax-glass, rgba(28, 29, 36, 0.85))',
            backdropFilter: 'blur(20px) saturate(180%)',
            border: '1px solid var(--ax-border, rgba(255,255,255,0.08))',
            borderRadius: 14,
            padding: 20,
            zIndex: 50,
            boxShadow: '0 16px 32px rgba(0,0,0,0.3), inset 0 1px 0 rgba(255,255,255,0.04)',
            animation: 'ax-panel-in 180ms cubic-bezier(0.32, 0.72, 0, 1)',
          }}
        >
          {/* Arrow */}
          <div style={{
            position: 'absolute',
            top: -6,
            right: 16,
            width: 12,
            height: 12,
            background: 'var(--ax-glass, rgba(28, 29, 36, 0.85))',
            border: '1px solid var(--ax-border, rgba(255,255,255,0.08))',
            borderBottom: 'none',
            borderRight: 'none',
            transform: 'rotate(45deg)',
          }} />

          {/* Text Size */}
          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ax-text-secondary, #9496A1)',
            fontFamily: 'Inter, system-ui, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}>
            Text Size
          </label>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <span style={{ fontSize: 12, color: 'var(--ax-text-muted, #5D5F6B)', fontWeight: 600 }}>A</span>
            <input
              type="range"
              min={MIN_SIZE}
              max={MAX_SIZE}
              step={1}
              value={size}
              onChange={(e) => setSize(Number(e.target.value))}
              style={{ flex: 1, accentColor: '#8B5CF6', cursor: 'pointer' }}
              aria-label="Text size"
            />
            <span style={{ fontSize: 18, color: 'var(--ax-text-muted, #5D5F6B)', fontWeight: 600 }}>A</span>
          </div>

          <div style={{
            textAlign: 'center',
            fontSize: 12,
            color: 'var(--ax-text-muted, #5D5F6B)',
            fontFamily: 'Inter, system-ui, sans-serif',
            marginTop: 4,
            marginBottom: 20,
          }}>
            {size}px
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: 'var(--ax-border, rgba(255,255,255,0.08))',
            marginBottom: 16,
          }} />

          {/* Theme Toggle */}
          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ax-text-secondary, #9496A1)',
            fontFamily: 'Inter, system-ui, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}>
            Appearance
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setTheme('light')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: `1px solid ${theme === 'light' ? '#8B5CF6' : 'var(--ax-border, rgba(255,255,255,0.08))'}`,
                background: theme === 'light' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                color: theme === 'light' ? '#8B5CF6' : 'var(--ax-text-secondary, #9496A1)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'all 150ms ease-out',
              }}
            >
              ☀️ Light
            </button>
            <button
              onClick={() => setTheme('dark')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: `1px solid ${theme === 'dark' ? '#8B5CF6' : 'var(--ax-border, rgba(255,255,255,0.08))'}`,
                background: theme === 'dark' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                color: theme === 'dark' ? '#8B5CF6' : 'var(--ax-text-secondary, #9496A1)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: 'Inter, system-ui, sans-serif',
                transition: 'all 150ms ease-out',
              }}
            >
              🌙 Dark
            </button>
          </div>

          {/* Divider */}
          <div style={{
            height: 1,
            background: 'var(--ax-border, rgba(255,255,255,0.08))',
            margin: '16px 0',
          }} />

          {/* Font Toggle */}
          <label style={{
            display: 'block',
            fontSize: 12,
            fontWeight: 600,
            color: 'var(--ax-text-secondary, #9496A1)',
            fontFamily: 'Inter, system-ui, sans-serif',
            textTransform: 'uppercase',
            letterSpacing: '0.08em',
            marginBottom: 12,
          }}>
            Body Font
          </label>

          <div style={{ display: 'flex', gap: 8 }}>
            <button
              onClick={() => setFont('serif')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: `1px solid ${font === 'serif' ? '#8B5CF6' : 'var(--ax-border, rgba(255,255,255,0.08))'}`,
                background: font === 'serif' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                color: font === 'serif' ? '#8B5CF6' : 'var(--ax-text-secondary, #9496A1)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "'Source Serif 4', Georgia, serif",
                transition: 'all 150ms ease-out',
              }}
            >
              Serif
            </button>
            <button
              onClick={() => setFont('sans')}
              style={{
                flex: 1,
                padding: '8px 0',
                borderRadius: 8,
                border: `1px solid ${font === 'sans' ? '#8B5CF6' : 'var(--ax-border, rgba(255,255,255,0.08))'}`,
                background: font === 'sans' ? 'rgba(139, 92, 246, 0.12)' : 'transparent',
                color: font === 'sans' ? '#8B5CF6' : 'var(--ax-text-secondary, #9496A1)',
                cursor: 'pointer',
                fontSize: 13,
                fontWeight: 500,
                fontFamily: "Inter, system-ui, sans-serif",
                transition: 'all 150ms ease-out',
              }}
            >
              Sans
            </button>
          </div>
        </div>
      )}

      <style>{`
        @keyframes ax-panel-in {
          from { opacity: 0; transform: translateY(-8px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
