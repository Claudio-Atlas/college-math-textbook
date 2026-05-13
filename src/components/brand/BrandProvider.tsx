/**
 * BrandProvider — single-brand for the College Mathematics reader.
 *
 * The original Axiom reader supported a dual-edition pattern (Atlas
 * Classical Press / Meridian Press, christian/secular). For College
 * Mathematics we collapse to one brand. The exported API
 * (BrandProvider, useBrand) is preserved so existing reader
 * components don't need changes.
 */
import { createContext, useContext, type ReactNode } from 'react';

export interface BrandColors {
    primary: string;
    accent: string;
}

export interface Brand {
    name: string;
    fullName: string;
    /** Whether to render scripture margin notes. Always false for College Math. */
    showScripture: boolean;
    /** Whether to render section-opening epigraphs. Optional decoration. */
    showEpigraphs: boolean;
    colors: BrandColors;
}

export const COLLEGE_MATH_BRAND: Brand = {
    name: 'College Mathematics',
    fullName: 'College Mathematics',
    showScripture: false,
    showEpigraphs: false,
    colors: {
        primary: '#8B5CF6',
        accent: '#A78BFA',
    },
};

const BrandContext = createContext<{ brand: Brand; isAtlas: boolean; isMeridian: boolean }>({
    brand: COLLEGE_MATH_BRAND,
    isAtlas: false,
    isMeridian: true,
});

interface BrandProviderProps {
    children: ReactNode;
    /** Kept for backwards-compat. Ignored — College Math is single-brand. */
    forceEdition?: string;
}

export function BrandProvider({ children }: BrandProviderProps) {
    return (
        <BrandContext.Provider value={{ brand: COLLEGE_MATH_BRAND, isAtlas: false, isMeridian: true }}>
            {children}
        </BrandContext.Provider>
    );
}

export function useBrand() {
    return useContext(BrandContext);
}
