/**
 * TPG Text Normalization Utilities
 * Prepare text for comparison and matching
 */

/**
 * Normalize text for comparison
 * Removes punctuation, converts to lowercase, normalizes whitespace
 */
export function normalizeText(text: string): string {
  return text
    .toLowerCase()                    // Convert to lowercase
    .replace(/[^\w\s]/g, '')         // Remove punctuation
    .replace(/\s+/g, ' ')            // Normalize whitespace
    .trim();                         // Trim edges
}

/**
 * Extract words from text
 */
export function extractWords(text: string): string[] {
  return normalizeText(text).split(' ').filter(word => word.length > 0);
}

/**
 * Create n-grams from text for fuzzy matching
 */
export function generateNGrams(text: string, n: number = 3): string[] {
  const normalized = normalizeText(text);
  const ngrams: string[] = [];
  
  for (let i = 0; i <= normalized.length - n; i++) {
    ngrams.push(normalized.substring(i, i + n));
  }
  
  return ngrams;
}

/**
 * Remove common legal filler words
 */
export function removeFillerWords(text: string): string {
  const fillers = ['um', 'uh', 'you know', 'like', 'so', 'well', 'i mean'];
  let result = text.toLowerCase();
  
  fillers.forEach(filler => {
    result = result.replace(new RegExp(`\\b${filler}\\b`, 'g'), '');
  });
  
  return normalizeText(result);
}
