/**
 * TPG Clip Report Types
 * Data structures for clip reports
 */

export interface ClipSegment {
  segmentNumber: number;
  
  // Video information
  videoStart: string;         // "00:01:33:06"
  videoEnd: string;           // "00:01:38:20"
  videoDuration: number;      // 5.467 seconds
  
  // Transcript information
  transcriptStart: string;    // "00006:01"
  transcriptEnd: string;      // "00006:03"
  pageStart: number;          // 6
  lineStart: number;          // 1
  pageEnd: number;            // 6
  lineEnd: number;            // 3
  
  // Metadata
  speaker: number;            // 3
  confidence: number;         // 0.95
  contentPreview: string;     // First 100 chars
}

export interface ClipGap {
  gapNumber: number;
  afterSegment: number;
  beforeSegment: number;
  
  // Video gap info
  gapStartTime: string;       // "00:01:41:02"
  gapEndTime: string;         // "00:05:00:00"
  gapDuration: number;        // 198.93 seconds
  
  // Transcript gap info
  gapStartPage: number;       // 6
  gapStartLine: number;       // 4
  gapEndPage: number;         // 10
  gapEndLine: number;         // 15
  estimatedPagesSkipped: number; // 4
  
  // What was removed
  removedBlocks: number;      // How many blocks removed
}

export interface ClipReport {
  metadata: {
    generatedAt: string;
    depositionInfo?: {
      case: string;
      witness: string;
      date: string;
    };
  };
  
  summary: {
    totalSegments: number;
    totalGaps: number;
    totalVideoDuration: number;
    totalGapDuration: number;
    coveragePercent: number;
  };
  
  segments: ClipSegment[];
  gaps: ClipGap[];
  missingBlocks: string[];    // Timecode IDs that couldn't be mapped
}
