/**
 * React context for brand/edition information
 */
import { createContext, useContext, useEffect, useState, type ReactNode } from 'react';
import { detectEdition, getBrandConfig, type BrandConfig, type Edition } from '../../lib/edition';
import { ThemeProvider } from './ThemeProvider';

interface BrandContextValue {
  brand: BrandConfig;
  edition: Edition;
  isAtlas: boolean;
  isMeridian: boolean;
}

const BrandContext = createContext<BrandContextValue | null>(null);

interface BrandProviderProps {
  children: ReactNode;
  /** Override edition detection (useful for SSR or testing) */
  forceEdition?: Edition;
}

export function BrandProvider({ children, forceEdition }: BrandProviderProps) {
  const [edition, setEdition] = useState<Edition>(forceEdition ?? 'atlas');

  useEffect(() => {
    if (!forceEdition && typeof window !== 'undefined') {
      const detected = detectEdition(window.location.hostname);
      setEdition(detected);
    }
  }, [forceEdition]);

  const brand = getBrandConfig(edition);

  const value: BrandContextValue = {
    brand,
    edition,
    isAtlas: edition === 'atlas',
    isMeridian: edition === 'meridian',
  };

  // Inject CSS custom properties for brand colors
  useEffect(() => {
    if (typeof document !== 'undefined') {
      const root = document.documentElement;
      root.style.setProperty('--brand-primary', brand.colors.primary);
      root.style.setProperty('--brand-primary-dark', brand.colors.primaryDark);
      root.style.setProperty('--brand-primary-light', brand.colors.primaryLight);
      root.style.setProperty('--brand-accent', brand.colors.accent);
    }
  }, [brand]);

  return (
    <BrandContext.Provider value={value}>
      <ThemeProvider>
        {children}
      </ThemeProvider>
    </BrandContext.Provider>
  );
}

export function useBrand(): BrandContextValue {
  const context = useContext(BrandContext);
  if (!context) {
    throw new Error('useBrand must be used within a BrandProvider');
  }
  return context;
}

/**
 * Hook to check if scripture/religious content should be shown
 */
export function useShowScripture(): boolean {
  const { brand } = useBrand();
  return brand.showScripture;
}
