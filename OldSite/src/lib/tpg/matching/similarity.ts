/**
 * TPG Text Similarity Algorithms
 * Calculate similarity scores between text strings
 */

import { normalizeText, extractWords } from './textNormalizer';

/**
 * Calculate Jaccard similarity (word overlap)
 * Returns value between 0 (no overlap) and 1 (identical)
 */
export function jaccardSimilarity(text1: string, text2: string): number {
  const words1 = new Set(extractWords(text1));
  const words2 = new Set(extractWords(text2));
  
  if (words1.size === 0 && words2.size === 0) return 1.0;
  if (words1.size === 0 || words2.size === 0) return 0.0;
  
  const intersection = new Set([...words1].filter(word => words2.has(word)));
  const union = new Set([...words1, ...words2]);
  
  return intersection.size / union.size;
}

/**
 * Calculate Levenshtein distance (edit distance)
 * Returns number of edits needed to transform text1 into text2
 */
export function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length;
  const n = str2.length;
  const dp: number[][] = [];
  
  // Initialize matrix
  for (let i = 0; i <= m; i++) {
    dp[i] = [i];
  }
  for (let j = 0; j <= n; j++) {
    dp[0][j] = j;
  }
  
  // Fill matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1];
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j - 1] + 1,  // substitution
          dp[i][j - 1] + 1,      // insertion
          dp[i - 1][j] + 1       // deletion
        );
      }
    }
  }
  
  return dp[m][n];
}

/**
 * Calculate Levenshtein similarity (0 to 1)
 */
export function levenshteinSimilarity(text1: string, text2: string): number {
  const distance = levenshteinDistance(text1, text2);
  const maxLen = Math.max(text1.length, text2.length);
  
  if (maxLen === 0) return 1.0;
  
  return 1 - (distance / maxLen);
}

/**
 * Calculate combined similarity score
 * Uses weighted average of multiple algorithms
 */
export function calculateSimilarity(
  text1: string,
  text2: string,
  options: {
    jaccardWeight?: number;
    levenshteinWeight?: number;
  } = {}
): number {
  const jaccardWeight = options.jaccardWeight ?? 0.7;
  const levenshteinWeight = options.levenshteinWeight ?? 0.3;
  
  const norm1 = normalizeText(text1);
  const norm2 = normalizeText(text2);
  
  const jaccard = jaccardSimilarity(norm1, norm2);
  const levenshtein = levenshteinSimilarity(norm1, norm2);
  
  return (jaccard * jaccardWeight) + (levenshtein * levenshteinWeight);
}

/**
 * Check if similarity meets threshold
 */
export function isSimilar(
  text1: string,
  text2: string,
  threshold: number = 0.85
): boolean {
  return calculateSimilarity(text1, text2) >= threshold;
}
