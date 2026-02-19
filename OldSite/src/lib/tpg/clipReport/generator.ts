/**
 * TPG Clip Report Generator
 * Generate clip reports from edited transcripts and bridge maps
 */

import type { PremiereBlock } from '../parsers/premiereParser';
import type { BridgeMap } from '../bridge/types';
import type { ClipReport, ClipSegment, ClipGap } from './types';
import { timecodeToSeconds } from '../utils/timecode';

/**
 * Generate clip report from edited Premiere transcript and bridge map
 */
export function generateClipReport(
  editedBlocks: PremiereBlock[],
  bridgeMap: BridgeMap,
  options: {
    verbose?: boolean;
  } = {}
): ClipReport {
  const { verbose = false } = options;
  
  const segments: ClipSegment[] = [];
  const missingBlocks: string[] = [];
  
  if (verbose) {
    console.log('Generating clip report...');
    console.log(`  Edited blocks: ${editedBlocks.length}`);
    console.log(`  Bridge map size: ${bridgeMap.size}`);
  }
  
  // Process each edited block
  for (let i = 0; i < editedBlocks.length; i++) {
    const block = editedBlocks[i];
    const mapping = bridgeMap.get(block.id);
    
    if (mapping) {
      segments.push({
        segmentNumber: i + 1,
        
        // Video info
        videoStart: block.startTime,
        videoEnd: block.endTime,
        videoDuration: block.duration,
        
        // Transcript info
        transcriptStart: mapping.pageLineStart,
        transcriptEnd: mapping.pageLineEnd,
        pageStart: mapping.pageStart,
        lineStart: mapping.lineStart,
        pageEnd: mapping.pageEnd,
        lineEnd: mapping.lineEnd,
        
        // Metadata
        speaker: block.speaker,
        confidence: mapping.confidence,
        contentPreview: block.content.substring(0, 100) + (block.content.length > 100 ? '...' : '')
      });
    } else {
      missingBlocks.push(block.id);
      
      if (verbose) {
        console.warn(`  ⚠ No mapping found for ${block.id}`);
      }
    }
  }
  
  // Detect gaps between segments
  const gaps = detectGaps(segments, bridgeMap);
  
  // Calculate summary statistics
  const totalVideoDuration = segments.reduce((sum, seg) => sum + seg.videoDuration, 0);
  const totalGapDuration = gaps.reduce((sum, gap) => sum + gap.gapDuration, 0);
  const coveragePercent = (totalVideoDuration / (totalVideoDuration + totalGapDuration)) * 100;
  
  const report: ClipReport = {
    metadata: {
      generatedAt: new Date().toISOString(),
      depositionInfo: bridgeMap.metadata.depositionInfo
    },
    
    summary: {
      totalSegments: segments.length,
      totalGaps: gaps.length,
      totalVideoDuration,
      totalGapDuration,
      coveragePercent
    },
    
    segments,
    gaps,
    missingBlocks
  };
  
  if (verbose) {
    console.log('\nClip report complete!');
    console.log(`  ✓ Segments: ${report.summary.totalSegments}`);
    console.log(`  ⚠ Gaps: ${report.summary.totalGaps}`);
    console.log(`  ✗ Missing blocks: ${missingBlocks.length}`);
    console.log(`  Coverage: ${coveragePercent.toFixed(1)}%`);
  }
  
  return report;
}

/**
 * Detect gaps between consecutive segments
 */
function detectGaps(segments: ClipSegment[], bridgeMap: BridgeMap): ClipGap[] {
  const gaps: ClipGap[] = [];
  
  for (let i = 0; i < segments.length - 1; i++) {
    const current = segments[i];
    const next = segments[i + 1];
    
    // Calculate time gap
    const currentEndSeconds = timecodeToSeconds(current.videoEnd);
    const nextStartSeconds = timecodeToSeconds(next.videoStart);
    const gapSeconds = nextStartSeconds - currentEndSeconds;
    
    // Only record significant gaps (> 1 second)
    if (gapSeconds > 1.0) {
      // Count how many blocks were in the gap
      const removedBlocks = countBlocksInTimeRange(
        bridgeMap,
        current.videoEnd,
        next.videoStart
      );
      
      gaps.push({
        gapNumber: gaps.length + 1,
        afterSegment: i + 1,
        beforeSegment: i + 2,
        
        gapStartTime: current.videoEnd,
        gapEndTime: next.videoStart,
        gapDuration: gapSeconds,
        
        gapStartPage: current.pageEnd,
        gapStartLine: current.lineEnd,
        gapEndPage: next.pageStart,
        gapEndLine: next.lineStart,
        estimatedPagesSkipped: next.pageStart - current.pageEnd,
        
        removedBlocks
      });
    }
  }
  
  return gaps;
}

/**
 * Count blocks in a time range (from bridge map)
 */
function countBlocksInTimeRange(
  bridgeMap: BridgeMap,
  startTime: string,
  endTime: string
): number {
  const startSeconds = timecodeToSeconds(startTime);
  const endSeconds = timecodeToSeconds(endTime);
  
  let count = 0;
  
  for (const [_, mapping] of bridgeMap.entries()) {
    if (mapping.startSeconds >= startSeconds && mapping.endSeconds <= endSeconds) {
      count++;
    }
  }
  
  return count;
}
