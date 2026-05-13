/**
 * Edition stub — College Mathematics is single-edition. Kept for
 * API compatibility with the original Axiom reader code, which
 * accepted christian/secular and atlas/meridian. We always resolve
 * to the secular/meridian-style branch (no scripture, no devotional
 * margin notes).
 */
export type Edition = 'meridian';

export const DEFAULT_EDITION: Edition = 'meridian';
