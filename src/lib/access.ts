/**
 * Access control — College Mathematics is fully open. No gates.
 *
 * The function signature is preserved from the original Axiom
 * implementation so consumer pages don't need to change.
 */

export function isAccessGranted(
    _chapterId: string,
    _sectionId: string,
    _key: string,
    _cookieKey: string,
    _host: string,
): boolean {
    return true;
}
