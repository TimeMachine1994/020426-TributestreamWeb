/**
 * TPG CSV Formatters
 * Format clip reports as CSV for spreadsheets
 */

import type { ClipReport } from '../clipReport/types';

/**
 * Format clip report as CSV
 */
export function formatCSV(report: ClipReport): string {
  const rows: string[] = [];
  
  // Header
  rows.push([
    'Segment',
    'Video_Start',
    'Video_End',
    'Duration_Sec',
    'Page_Start',
    'Line_Start',
    'Page_End',
    'Line_End',
    'Speaker',
    'Confidence_%',
    'Content_Preview'
  ].join(','));
  
  // Data rows
  report.segments.forEach(seg => {
    rows.push([
      seg.segmentNumber,
      seg.videoStart,
      seg.videoEnd,
      seg.videoDuration.toFixed(2),
      seg.pageStart,
      seg.lineStart,
      seg.pageEnd,
      seg.lineEnd,
      seg.speaker,
      (seg.confidence * 100).toFixed(1),
      `"${seg.contentPreview.replace(/"/g, '""')}"` // Escape quotes
    ].join(','));
  });
  
  return rows.join('\n');
}

/**
 * Format gaps as CSV
 */
export function formatGapsCSV(report: ClipReport): string {
  const rows: string[] = [];
  
  // Header
  rows.push([
    'Gap',
    'After_Segment',
    'Gap_Start_Time',
    'Gap_End_Time',
    'Gap_Duration_Sec',
    'Gap_Start_Page',
    'Gap_End_Page',
    'Pages_Skipped',
    'Blocks_Removed'
  ].join(','));
  
  // Data rows
  report.gaps.forEach(gap => {
    rows.push([
      gap.gapNumber,
      gap.afterSegment,
      gap.gapStartTime,
      gap.gapEndTime,
      gap.gapDuration.toFixed(2),
      gap.gapStartPage,
      gap.gapEndPage,
      gap.estimatedPagesSkipped,
      gap.removedBlocks
    ].join(','));
  });
  
  return rows.join('\n');
}
