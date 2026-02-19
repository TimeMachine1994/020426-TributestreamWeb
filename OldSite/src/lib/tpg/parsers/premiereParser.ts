/**
 * TPG Premiere Pro Transcript Parser
 * Parses both original and edited Premiere Pro transcripts
 */

import { timecodeToSeconds } from '../utils/timecode';

export interface PremiereBlock {
  id: string;                 // Unique identifier: "startTime-endTime"
  startTime: string;          // HH:MM:SS:FF
  endTime: string;            // HH:MM:SS:FF
  startSeconds: number;       // Calculated from startTime
  endSeconds: number;         // Calculated from endTime
  duration: number;           // endSeconds - startSeconds
  speaker: number;            // Speaker number (1, 2, 3, etc.)
  content: string;            // Actual spoken text
  rawContent: string[];       // Original lines before joining
}

/**
 * Parse Premiere Pro transcript (works for both original and edited)
 */
export function parsePremiereTranscript(text: string): PremiereBlock[] {
  const blocks: PremiereBlock[] = [];
  const lines = text.split('\n');
  
  let i = 0;
  while (i < lines.length) {
    const line = lines[i].trim();
    
    // Look for timecode line: "00:01:33:06 - 00:01:38:20"
    const timecodeMatch = line.match(/^(\d{2}:\d{2}:\d{2}:\d{2}) - (\d{2}:\d{2}:\d{2}:\d{2})$/);
    
    if (timecodeMatch) {
      const startTime = timecodeMatch[1];
      const endTime = timecodeMatch[2];
      
      // Next line should be speaker
      i++;
      if (i >= lines.length) break;
      
      const speakerMatch = lines[i].trim().match(/^Speaker (\d+)$/);
      if (!speakerMatch) {
        console.warn(`Expected speaker label at line ${i}, got: ${lines[i]}`);
        i++;
        continue;
      }
      
      const speaker = parseInt(speakerMatch[1]);
      
      // Collect content lines until blank line
      i++;
      const contentLines: string[] = [];
      while (i < lines.length && lines[i].trim() !== '') {
        contentLines.push(lines[i]);
        i++;
      }
      
      // Calculate timecode values
      const startSeconds = timecodeToSeconds(startTime);
      const endSeconds = timecodeToSeconds(endTime);
      
      blocks.push({
        id: `${startTime}-${endTime}`,
        startTime,
        endTime,
        startSeconds,
        endSeconds,
        duration: endSeconds - startSeconds,
        speaker,
        content: contentLines.join(' ').trim(),
        rawContent: contentLines
      });
    }
    
    i++;
  }
  
  return blocks;
}

/**
 * Parse original Premiere Pro transcript
 */
export function parseOriginalPremiere(text: string): PremiereBlock[] {
  return parsePremiereTranscript(text);
}

/**
 * Parse edited Premiere Pro transcript
 */
export function parseEditedPremiere(text: string): PremiereBlock[] {
  return parsePremiereTranscript(text);
}

/**
 * Get statistics about parsed blocks
 */
export function getPremiereStats(blocks: PremiereBlock[]) {
  if (blocks.length === 0) {
    return {
      totalBlocks: 0,
      totalDuration: 0,
      startTime: '',
      endTime: '',
      speakers: []
    };
  }
  
  const totalDuration = blocks.reduce((sum, block) => sum + block.duration, 0);
  const speakers = [...new Set(blocks.map(b => b.speaker))].sort();
  
  return {
    totalBlocks: blocks.length,
    totalDuration,
    startTime: blocks[0].startTime,
    endTime: blocks[blocks.length - 1].endTime,
    speakers
  };
}
