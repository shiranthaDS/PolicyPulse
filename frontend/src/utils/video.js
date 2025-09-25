// Utility functions for handling YouTube video URLs.
// Accepted patterns (converted to embed form):
//   - https://www.youtube.com/watch?v=VIDEOID
//   - https://youtu.be/VIDEOID
//   - https://www.youtube.com/shorts/VIDEOID
//   - https://www.youtube.com/embed/VIDEOID (returned as‑is)
// Returns null for unrecognized inputs so callers can gracefully fallback.

/**
 * Normalize a raw YouTube URL into an embeddable https://www.youtube.com/embed/VIDEOID form.
 * @param {string} url Raw user provided URL.
 * @returns {string|null} Normalized embed URL or null if not recognized.
 */

export function normalizeYouTubeUrl(url) {
  if (!url) return null;
  try {
    const trimmed = url.trim();
    // If already embed format
    if (trimmed.includes('/embed/')) return trimmed;

    // Match patterns
    // Standard: https://www.youtube.com/watch?v=VIDEOID
    const standardMatch = trimmed.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
    if (standardMatch) {
      return `https://www.youtube.com/embed/${standardMatch[1]}`;
    }

    // Short: https://youtu.be/VIDEOID
    const shortMatch = trimmed.match(/youtu\.be\/([a-zA-Z0-9_-]{11})/);
    if (shortMatch) {
      return `https://www.youtube.com/embed/${shortMatch[1]}`;
    }

    // Shorts: https://www.youtube.com/shorts/VIDEOID
    const shortsMatch = trimmed.match(/youtube\.com\/shorts\/([a-zA-Z0-9_-]{11})/);
    if (shortsMatch) {
      return `https://www.youtube.com/embed/${shortsMatch[1]}`;
    }

    return null; // Not recognized
  } catch (e) {
    return null;
  }
}

/**
 * Validate a YouTube URL by attempting normalization.
 * @param {string} url
 * @returns {boolean}
 */
export function isValidYouTubeUrl(url) {
  return !!normalizeYouTubeUrl(url);
}
