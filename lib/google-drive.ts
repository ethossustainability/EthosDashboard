/**
 * lib/google-drive.ts
 * Google Drive utilities.
 */

/**
 * Parses a Drive share URL into its file ID.
 * Supports /d/[id] and ?id=[id] formats.
 */
export function extractFileIdFromUrl(driveUrl: string): string | null {
  try {
    // Match /d/FILE_ID or /file/d/FILE_ID
    const pathMatch = driveUrl.match(/\/d\/([a-zA-Z0-9_-]+)/);
    if (pathMatch && pathMatch[1]) {
      return pathMatch[1];
    }
    
    // Match ?id=FILE_ID
    const urlParams = new URLSearchParams(new URL(driveUrl).search);
    const queryId = urlParams.get('id');
    if (queryId) {
      return queryId;
    }

    return null;
  } catch (e) {
    return null;
  }
}
