/**
 * Access control for gated textbook content.
 * This runs server-side only — never sent to client.
 * 
 * The key is embedded in the server bundle. It's not a secret
 * in the traditional sense — it's an access token embedded in
 * Canvas page HTML. But it prevents casual public access.
 */

// Access keys that unlock gated content
// Add more keys here for different institutions
const VALID_KEYS = new Set([
  'PH95VEGwytmm33pB9PEaxf0OQb-aBa7zVjerf64vxX8',  // Demo course (Canvas free tier)
]);

// Sections that are always free (marketing preview)
const FREE_SECTIONS = new Set([
  'ch01/sec01',  // Section 1.1 — Introduction to Functions
]);

export function isAccessGranted(
  chapterId: string, 
  sectionId: string, 
  key: string, 
  cookieKey: string,
  host: string
): boolean {
  // Free preview sections are always accessible
  if (FREE_SECTIONS.has(`${chapterId}/${sectionId}`)) return true;
  
  // Local development always has access
  if (host.includes('localhost') || host.includes('127.0.0.1')) return true;
  
  // Check access key from query param or cookie
  if (key && VALID_KEYS.has(key)) return true;
  if (cookieKey && VALID_KEYS.has(cookieKey)) return true;
  
  return false;
}
