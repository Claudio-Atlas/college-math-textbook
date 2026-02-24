import { useState, useRef, useEffect } from 'react';

const SIZES = [
  { label: 'Small', value: 0.9, lineHeight: 1.7 },
  { label: 'Default', value: 1.05, lineHeight: 1.8 },
  { label: 'Large', value: 1.2, lineHeight: 1.85 },
  { label: 'X-Large', value: 1.35, lineHeight: 1.9 },
];

export function TextSizeControl() {
  const [isOpen, setIsOpen] = useState(false);
  const [sizeIndex, setSizeIndex] = useState(1); // Default
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  // Close on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (
        panelRef.current && !panelRef.current.contains(e.target as Node) &&
        buttonRef.current && !buttonRef.current.contains(e.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    if (isOpen) document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen]);

  // Apply size to CSS custom properties
  useEffect(() => {
    const size = SIZES[sizeIndex];
    document.documentElement.style.setProperty('--reader-font-size', `${size.value}rem`);
    document.documentElement.style.setProperty('--reader-line-height', `${size.lineHeight}`);
  }, [sizeIndex]);

  const size = SIZES[sizeIndex];

  return (
    <div className="relative">
      <button
        ref={buttonRef}
        onClick={() => setIsOpen(!isOpen)}
        className={`
          flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-sm font-medium transition-all
          ${isOpen 
            ? 'bg-violet-600 text-white' 
            : 'text-gray-400 hover:text-white hover:bg-white/10'
          }
        `}
        aria-label="Text size settings"
        aria-expanded={isOpen}
      >
        <span className="text-xs font-bold">A</span>
        <span className="text-base font-bold">A</span>
      </button>

      {isOpen && (
        <div 
          ref={panelRef}
          className="absolute right-0 top-full mt-2 w-64 bg-white rounded-xl shadow-xl border border-gray-100 p-5 animate-fade-in z-50"
        >
          {/* Arrow */}
          <div className="absolute -top-2 right-4 w-4 h-4 bg-white border-l border-t border-gray-100 rotate-45" />
          
          <label className="block text-sm font-semibold text-gray-900 mb-3">
            Text size
          </label>
          
          {/* Slider row */}
          <div className="flex items-center gap-3">
            <span className="text-xs text-gray-400 font-medium select-none">A</span>
            <input
              type="range"
              min={0}
              max={SIZES.length - 1}
              step={1}
              value={sizeIndex}
              onChange={(e) => setSizeIndex(Number(e.target.value))}
              className="flex-1 h-1.5 appearance-none rounded-full bg-gray-200 cursor-pointer accent-violet-600
                [&::-webkit-slider-thumb]:appearance-none [&::-webkit-slider-thumb]:w-4 [&::-webkit-slider-thumb]:h-4 
                [&::-webkit-slider-thumb]:rounded-full [&::-webkit-slider-thumb]:bg-violet-600 
                [&::-webkit-slider-thumb]:shadow-md [&::-webkit-slider-thumb]:cursor-pointer
                [&::-webkit-slider-thumb]:border-2 [&::-webkit-slider-thumb]:border-white"
              aria-label="Adjust text size"
            />
            <span className="text-lg text-gray-400 font-medium select-none">A</span>
          </div>
          
          {/* Current size label */}
          <p className="text-xs text-gray-400 text-center mt-2">{size.label}</p>
        </div>
      )}
    </div>
  );
}
