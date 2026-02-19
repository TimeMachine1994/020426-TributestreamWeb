/**
 * TPG Text Matching Engine
 * Find matching text segments in official transcript
 */

import type { OfficialLine } from '../parsers/officialParser';
import { normalizeText } from './textNormalizer';
import { calculateSimilarity } from './similarity';

export interface TextMatch {
  startPage: number;
  startLine: number;
  endPage: number;
  endLine: number;
  startIndex: number;
  endIndex: number;
  confidence: number;
  matchedText: string;
}

/**
 * Find matching text in official transcript
 * Uses sliding window approach with multiple window sizes
 */
export function findTextInOfficial(
  searchText: string,
  officialLines: OfficialLine[],
  startPosition: number = 0,
  options: {
    maxSearchWindow?: number;
    minSimilarity?: number;
    maxWindowSize?: number;
  } = {}
): TextMatch | null {
  const maxSearchWindow = options.maxSearchWindow ?? 100;
  const minSimilarity = options.minSimilarity ?? 0.85;
  const maxWindowSize = options.maxWindowSize ?? 10;
  
  const normalizedSearch = normalizeText(searchText);
  
  // Don't search past this index
  const endPosition = Math.min(
    startPosition + maxSearchWindow,
    officialLines.length
  );
  
  let bestMatch: TextMatch | null = null;
  let highestSimilarity = 0;
  
  // Try different window sizes (content might span multiple lines)
  for (let windowSize = 1; windowSize <= maxWindowSize; windowSize++) {
    for (let i = startPosition; i < endPosition - windowSize; i++) {
      // Combine consecutive lines into window
      const windowLines = officialLines.slice(i, i + windowSize);
      const windowText = windowLines
        .map(line => line.content)
        .join(' ');
      
      const normalizedWindow = normalizeText(windowText);
      
      // Calculate similarity
      const similarity = calculateSimilarity(normalizedSearch, normalizedWindow);
      
      // Update best match if this is better and meets threshold
      if (similarity > highestSimilarity && similarity >= minSimilarity) {
        highestSimilarity = similarity;
        
        const firstLine = windowLines[0];
        const lastLine = windowLines[windowLines.length - 1];
        
        bestMatch = {
          startPage: firstLine.page,
          startLine: firstLine.lineNum,
          endPage: lastLine.page,
          endLine: lastLine.lineNum,
          startIndex: i,
          endIndex: i + windowSize - 1,
          confidence: similarity,
          matchedText: windowText
        };
      }
    }
  }
  
  return bestMatch;
}

/**
 * Find multiple matches (for validation)
 */
export function findAllMatches(
  searchText: string,
  officialLines: OfficialLine[],
  minSimilarity: number = 0.85
): TextMatch[] {
  const matches: TextMatch[] = [];
  let position = 0;
  
  while (position < officialLines.length) {
    const match = findTextInOfficial(searchText, officialLines, position, {
      minSimilarity,
      maxSearchWindow: officialLines.length - position
    });
    
    if (match) {
      matches.push(match);
      position = match.endIndex + 1;
    } else {
      break;
    }
  }
  
  return matches;
}
