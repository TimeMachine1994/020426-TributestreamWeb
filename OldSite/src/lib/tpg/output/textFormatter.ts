/**
 * TPG Text Formatters
 * Format clip reports as readable text
 */

import type { ClipReport } from '../clipReport/types';

/**
 * Format clip report as detailed text
 */
export function formatDetailed(report: ClipReport): string {
  const lines: string[] = [];
  
  // Header
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('        VIDEO CLIP REPORT WITH PAGE:LINE REFERENCES');
  lines.push('═══════════════════════════════════════════════════════');
  lines.push('');
  lines.push(`Generated: ${new Date(report.metadata.generatedAt).toLocaleString()}`);
  lines.push('');
  
  // Summary
  lines.push('SUMMARY');
  lines.push('─────────────────────────────────────────────────────────');
  lines.push(`Total Segments: ${report.summary.totalSegments}`);
  lines.push(`Total Gaps: ${report.summary.totalGaps}`);
  lines.push(`Video Duration: ${formatDuration(report.summary.totalVideoDuration)}`);
  lines.push(`Gap Duration: ${formatDuration(report.summary.totalGapDuration)}`);
  lines.push(`Coverage: ${report.summary.coveragePercent.toFixed(1)}%`);
  lines.push('');
  lines.push('');
  
  // Segments and gaps
  let gapIndex = 0;
  
  for (const segment of report.segments) {
    lines.push(`─────────────────────────────────────────────────────────`);
    lines.push(`SEGMENT ${segment.segmentNumber}`);
    lines.push(`─────────────────────────────────────────────────────────`);
    lines.push(`Video Time:     ${segment.videoStart} → ${segment.videoEnd}`);
    lines.push(`Duration:       ${segment.videoDuration.toFixed(2)} seconds`);
    lines.push(`Transcript:     Page ${segment.pageStart}, Line ${segment.lineStart} → Page ${segment.pageEnd}, Line ${segment.lineEnd}`);
    lines.push(`Page:Line:      ${segment.transcriptStart} → ${segment.transcriptEnd}`);
    lines.push(`Speaker:        Speaker ${segment.speaker}`);
    lines.push(`Confidence:     ${(segment.confidence * 100).toFixed(1)}%`);
    lines.push(`Content:        ${segment.contentPreview}`);
    lines.push('');
    
    // Check for gap after this segment
    if (gapIndex < report.gaps.length && 
        report.gaps[gapIndex].afterSegment === segment.segmentNumber) {
      const gap = report.gaps[gapIndex];
      
      lines.push(`┌─── GAP DETECTED ─────────────────────────────────────┐`);
      lines.push(`│ Content Removed in Edit                              │`);
      lines.push(`├───────────────────────────────────────────────────────┤`);
      lines.push(`│ Gap Duration:    ${formatDuration(gap.gapDuration).padEnd(38)} │`);
      lines.push(`│ Timecode Range:  ${gap.gapStartTime} → ${gap.gapEndTime}  │`);
      lines.push(`│ Pages Skipped:   ~${gap.estimatedPagesSkipped} pages${' '.repeat(37 - gap.estimatedPagesSkipped.toString().length)}│`);
      lines.push(`│ Blocks Removed:  ${gap.removedBlocks} blocks${' '.repeat(36 - gap.removedBlocks.toString().length)}│`);
      lines.push(`└───────────────────────────────────────────────────────┘`);
      lines.push('');
      
      gapIndex++;
    }
  }
  
  // Missing blocks warning
  if (report.missingBlocks.length > 0) {
    lines.push('');
    lines.push('⚠ WARNING: Missing Mappings');
    lines.push('─────────────────────────────────────────────────────────');
    lines.push(`${report.missingBlocks.length} blocks could not be mapped:`);
    report.missingBlocks.forEach(id => {
      lines.push(`  - ${id}`);
    });
  }
  
  return lines.join('\n');
}

/**
 * Format clip report as simple list
 */
export function formatSimple(report: ClipReport): string {
  const lines: string[] = [];
  
  lines.push('VIDEO CLIP REPORT');
  lines.push('=================\n');
  
  report.segments.forEach((seg, i) => {
    lines.push(
      `Clip ${seg.segmentNumber}: Page ${seg.pageStart}:${seg.lineStart} - ${seg.pageEnd}:${seg.lineEnd} ` +
      `(${seg.videoStart} - ${seg.videoEnd}, ${seg.videoDuration.toFixed(1)}s)`
    );
  });
  
  if (report.gaps.length > 0) {
    lines.push('\n\nGAPS (Content Removed):');
    report.gaps.forEach(gap => {
      lines.push(
        `Gap ${gap.gapNumber}: ${formatDuration(gap.gapDuration)} removed ` +
        `(${gap.gapStartTime} - ${gap.gapEndTime}), ~${gap.estimatedPagesSkipped} pages skipped`
      );
    });
  }
  
  return lines.join('\n');
}

/**
 * Format duration in readable format
 */
function formatDuration(seconds: number): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  
  if (hours > 0) {
    return `${hours}h ${minutes}m ${secs}s`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}
