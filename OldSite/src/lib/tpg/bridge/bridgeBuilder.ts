/**
 * TPG Bridge Builder
 * Build timecode to page:line mappings
 */

import type { PremiereBlock } from '../parsers/premiereParser';
import type { OfficialLine } from '../parsers/officialParser';
import { BridgeMap, type BridgeMapping } from './types';
import { findTextInOfficial } from '../matching/textMatcher';

export interface BuildOptions {
  minSimilarity?: number;
  maxSearchWindow?: number;
  maxWindowSize?: number;
  verbose?: boolean;
  onProgress?: (current: number, total: number, percent: number) => void;
}

/**
 * Build bridge map from original Premiere and official transcripts
 */
export async function buildBridgeMap(
  originalBlocks: PremiereBlock[],
  officialLines: OfficialLine[],
  options: BuildOptions = {}
): Promise<BridgeMap> {
  const {
    minSimilarity = 0.85,
    maxSearchWindow = 100,
    maxWindowSize = 10,
    verbose = false,
    onProgress
  } = options;
  
  const bridgeMap = new BridgeMap();
  let officialPosition = 0;
  let successCount = 0;
  let failCount = 0;
  
  if (verbose) {
    console.log(`Building bridge map...`);
    console.log(`  Original blocks: ${originalBlocks.length}`);
    console.log(`  Official lines: ${officialLines.length}`);
    console.log(`  Min similarity: ${minSimilarity}`);
  }
  
  for (let i = 0; i < originalBlocks.length; i++) {
    const block = originalBlocks[i];
    
    const percentComplete = ((i / originalBlocks.length) * 100);
    
    if (verbose && i % 10 === 0) {
      console.log(`  Processing block ${i + 1}/${originalBlocks.length}... (${percentComplete.toFixed(1)}%)`);
    }
    
    // Report progress to callback
    if (onProgress && i % 5 === 0) {
      onProgress(i, originalBlocks.length, percentComplete);
    }
    
    // Yield to event loop every 5 blocks to prevent UI freeze
    if (i % 5 === 0) {
      await new Promise(resolve => setTimeout(resolve, 0));
    }
    
    // Find matching content in official transcript
    const match = findTextInOfficial(
      block.content,
      officialLines,
      officialPosition,
      {
        minSimilarity,
        maxSearchWindow,
        maxWindowSize
      }
    );
    
    // Debug: Log first few attempts
    if (verbose && i < 5) {
      console.log(`\n  Block ${i} content preview: "${block.content.substring(0, 100)}..."`);
      if (match) {
        console.log(`  ✓ MATCHED with confidence ${(match.confidence * 100).toFixed(1)}%`);
        console.log(`  Official text: "${match.matchedText.substring(0, 100)}..."`);
      } else {
        console.log(`  ✗ NO MATCH FOUND (similarity < ${minSimilarity})`);
        console.log(`  Searching from official line ${officialPosition}/${officialLines.length}`);
      }
    }
    
    if (match) {
      // Create bridge mapping
      const mapping: BridgeMapping = {
        timecodeId: block.id,
        startTime: block.startTime,
        endTime: block.endTime,
        startSeconds: block.startSeconds,
        endSeconds: block.endSeconds,
        duration: block.duration,
        pageStart: match.startPage,
        lineStart: match.startLine,
        pageEnd: match.endPage,
        lineEnd: match.endLine,
        pageLineStart: `${String(match.startPage).padStart(5, '0')}:${String(match.startLine).padStart(2, '0')}`,
        pageLineEnd: `${String(match.endPage).padStart(5, '0')}:${String(match.endLine).padStart(2, '0')}`,
        speaker: block.speaker,
        content: block.content,
        confidence: match.confidence,
        officialLineIndices: {
          start: match.startIndex,
          end: match.endIndex
        }
      };
      
      bridgeMap.set(block.id, mapping);
      
      // Move position forward
      officialPosition = match.endIndex + 1;
      successCount++;
      
    } else {
      failCount++;
      
      if (verbose) {
        console.warn(`  ⚠ No match found for block ${block.id}`);
        console.warn(`    Content preview: ${block.content.substring(0, 80)}...`);
      }
    }
  }
  
  // Update metadata
  bridgeMap.metadata.originalStats = {
    totalBlocks: originalBlocks.length,
    totalDuration: originalBlocks.reduce((sum, b) => sum + b.duration, 0),
    speakers: [...new Set(originalBlocks.map(b => b.speaker))].sort()
  };
  
  bridgeMap.metadata.officialStats = {
    totalLines: officialLines.length,
    totalPages: new Set(officialLines.map(l => l.page)).size
  };
  
  if (verbose) {
    console.log(`\nBridge map complete!`);
    console.log(`  ✓ Successful mappings: ${successCount}`);
    console.log(`  ✗ Failed mappings: ${failCount}`);
    console.log(`  Success rate: ${((successCount / originalBlocks.length) * 100).toFixed(1)}%`);
  }
  
  return bridgeMap;
}

/**
 * Validate bridge map quality
 */
export function validateBridgeMap(bridgeMap: BridgeMap): {
  isValid: boolean;
  errors: string[];
  warnings: string[];
  stats: {
    avgConfidence: number;
    lowConfidenceCount: number;
    coveragePercent: number;
  };
} {
  const errors: string[] = [];
  const warnings: string[] = [];
  
  // Check if map has mappings
  if (bridgeMap.size === 0) {
    errors.push('Bridge map is empty');
    return {
      isValid: false,
      errors,
      warnings,
      stats: { avgConfidence: 0, lowConfidenceCount: 0, coveragePercent: 0 }
    };
  }
  
  // Calculate statistics
  const mappings = Array.from(bridgeMap.entries()).map(([_, m]) => m);
  const avgConfidence = mappings.reduce((sum, m) => sum + m.confidence, 0) / mappings.length;
  const lowConfidenceCount = mappings.filter(m => m.confidence < 0.80).length;
  const coveragePercent = (bridgeMap.size / bridgeMap.metadata.originalStats.totalBlocks) * 100;
  
  // Validate confidence scores
  if (avgConfidence < 0.85) {
    warnings.push(`Average confidence is low: ${(avgConfidence * 100).toFixed(1)}%`);
  }
  
  if (lowConfidenceCount > bridgeMap.size * 0.1) {
    warnings.push(`${lowConfidenceCount} mappings have confidence < 80%`);
  }
  
  // Validate coverage
  if (coveragePercent < 95) {
    warnings.push(`Coverage is ${coveragePercent.toFixed(1)}% (should be >95%)`);
  }
  
  return {
    isValid: errors.length === 0,
    errors,
    warnings,
    stats: {
      avgConfidence,
      lowConfidenceCount,
      coveragePercent
    }
  };
}
