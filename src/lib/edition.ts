/**
 * Edition detection and brand configuration
 * 
 * Determines whether to show Atlas Classical Press (Christian)
 * or Meridian Press (Secular) based on hostname.
 */

export type Edition = 'atlas' | 'meridian';

export interface BrandConfig {
  edition: Edition;
  name: string;
  tagline: string;
  showScripture: boolean;
  showEpigraphs: boolean;
  colors: {
    primary: string;
    primaryDark: string;
    primaryLight: string;
    accent: string;
  };
}

const ATLAS_CONFIG: BrandConfig = {
  edition: 'atlas',
  name: 'Atlas Classical Press',
  tagline: 'Rigorous. Beautiful. True.',
  showScripture: true,
  showEpigraphs: true,
  colors: {
    primary: '#5BA4A4',      // Teal
    primaryDark: '#4A8F8F',
    primaryLight: '#E8F4F4',
    accent: '#D4A853',       // Warm gold
  },
};

const MERIDIAN_CONFIG: BrandConfig = {
  edition: 'meridian',
  name: 'Meridian Press',
  tagline: 'Rigorous. Clear. Professional.',
  showScripture: false,
  showEpigraphs: false,
  colors: {
    primary: '#8B5CF6',      // Violet (Axiom signature)
    primaryDark: '#7C3AED',
    primaryLight: '#F5F3FF',
    accent: '#34D399',       // Emerald
  },
};

/**
 * Detect edition from hostname
 */
export function detectEdition(hostname: string): Edition {
  const lower = hostname.toLowerCase();
  
  if (lower.includes('meridian')) {
    return 'meridian';
  }
  
  // Default to Atlas (includes localhost, atlasclassicalpress.com, etc.)
  return 'atlas';
}

/**
 * Get full brand configuration
 */
export function getBrandConfig(edition: Edition): BrandConfig {
  return edition === 'meridian' ? MERIDIAN_CONFIG : ATLAS_CONFIG;
}

/**
 * Get brand config from hostname (convenience function)
 */
export function getBrandFromHostname(hostname: string): BrandConfig {
  const edition = detectEdition(hostname);
  return getBrandConfig(edition);
}
