/**
 * TPG Official Transcript Parser
 * Parses legal transcripts with page:line numbering
 */

export interface OfficialLine {
  page: number;               // Page number (e.g., 6)
  lineNum: number;            // Line number on page (1-25)
  pageLineId: string;         // Formatted: "00006:01"
  content: string;            // Text content (trimmed)
  rawLine: string;            // Original line with formatting
  speakerLabel?: string;      // Q., A., or speaker name if detected
  isContent: boolean;         // True if has actual content
}

/**
 * Parse official legal transcript
 */
export function parseOfficialTranscript(text: string): OfficialLine[] {
  const lines: OfficialLine[] = [];
  const rawLines = text.split('\n');
  let currentPage = 0;
  
  for (let i = 0; i < rawLines.length; i++) {
    const rawLine = rawLines[i];
    
    // Match full page:line format: "  00006:01"
    const pageLineMatch = rawLine.match(/^  (\d{5}):(\d{2})/);
    
    // Match line-only format: "        02"
    const lineOnlyMatch = rawLine.match(/^        (\d{2})/);
    
    if (pageLineMatch) {
      // Full page:line number
      currentPage = parseInt(pageLineMatch[1]);
      const lineNum = parseInt(pageLineMatch[2]);
      const content = rawLine.substring(10).trim();
      
      lines.push({
        page: currentPage,
        lineNum,
        pageLineId: formatPageLine(currentPage, lineNum),
        content,
        rawLine,
        speakerLabel: extractSpeakerLabel(content),
        isContent: content.length > 0
      });
      
    } else if (lineOnlyMatch && currentPage > 0) {
      // Line number only (continuation of current page)
      const lineNum = parseInt(lineOnlyMatch[1]);
      const content = rawLine.substring(10).trim();
      
      lines.push({
        page: currentPage,
        lineNum,
        pageLineId: formatPageLine(currentPage, lineNum),
        content,
        rawLine,
        speakerLabel: extractSpeakerLabel(content),
        isContent: content.length > 0
      });
    }
  }
  
  return lines;
}

/**
 * Format page and line into standard ID
 */
function formatPageLine(page: number, line: number): string {
  return `${String(page).padStart(5, '0')}:${String(line).padStart(2, '0')}`;
}

/**
 * Extract speaker label from content (Q., A., MR. NAME:, etc.)
 */
function extractSpeakerLabel(content: string): string | undefined {
  // Check for Q. or A.
  if (content.startsWith('Q.')) return 'Q';
  if (content.startsWith('A.')) return 'A';
  
  // Check for named speaker: "MR. NAME:" or "MS. NAME:"
  const namedMatch = content.match(/^((?:MR|MS|MRS|DR|THE)\.\s+[A-Z\s]+):/);
  if (namedMatch) return namedMatch[1];
  
  return undefined;
}

/**
 * Get content from a range of lines
 */
export function getContentInRange(
  lines: OfficialLine[],
  startPage: number,
  startLine: number,
  endPage: number,
  endLine: number
): string {
  const inRange = lines.filter(line => {
    if (line.page < startPage || line.page > endPage) return false;
    if (line.page === startPage && line.lineNum < startLine) return false;
    if (line.page === endPage && line.lineNum > endLine) return false;
    return true;
  });
  
  return inRange.map(line => line.content).join(' ').trim();
}

/**
 * Find line index by page:line number
 */
export function findLineIndex(lines: OfficialLine[], page: number, lineNum: number): number {
  return lines.findIndex(line => line.page === page && line.lineNum === lineNum);
}

/**
 * Get statistics about parsed transcript
 */
export function getOfficialStats(lines: OfficialLine[]) {
  const contentLines = lines.filter(l => l.isContent);
  const pages = new Set(lines.map(l => l.page));
  
  return {
    totalLines: lines.length,
    contentLines: contentLines.length,
    totalPages: pages.size,
    firstPage: Math.min(...pages),
    lastPage: Math.max(...pages)
  };
}
