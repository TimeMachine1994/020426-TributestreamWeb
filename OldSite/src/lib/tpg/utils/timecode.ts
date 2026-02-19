/**
 * TPG Timecode Utilities
 * Convert between timecode strings (HH:MM:SS:FF) and seconds
 */

/**
 * Convert timecode string to seconds
 * @param timecode - Format: HH:MM:SS:FF
 * @param fps - Frames per second (default 30)
 * @returns Total seconds as decimal
 */
export function timecodeToSeconds(timecode: string, fps: number = 30): number {
  const [hh, mm, ss, ff] = timecode.split(':').map(Number);
  
  if (isNaN(hh) || isNaN(mm) || isNaN(ss) || isNaN(ff)) {
    throw new Error(`Invalid timecode format: ${timecode}`);
  }
  
  const hours = hh * 3600;
  const minutes = mm * 60;
  const seconds = ss;
  const frames = ff / fps;
  
  return hours + minutes + seconds + frames;
}

/**
 * Convert seconds to timecode string
 * @param seconds - Total seconds as decimal
 * @param fps - Frames per second (default 30)
 * @returns Timecode string in HH:MM:SS:FF format
 */
export function secondsToTimecode(seconds: number, fps: number = 30): string {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = Math.floor(seconds % 60);
  const frames = Math.round((seconds % 1) * fps);
  
  return [
    String(hours).padStart(2, '0'),
    String(minutes).padStart(2, '0'),
    String(secs).padStart(2, '0'),
    String(frames).padStart(2, '0')
  ].join(':');
}

/**
 * Calculate duration between two timecodes
 */
export function calculateDuration(start: string, end: string, fps: number = 30): number {
  return timecodeToSeconds(end, fps) - timecodeToSeconds(start, fps);
}

/**
 * Validate timecode format
 */
export function isValidTimecode(timecode: string): boolean {
  const pattern = /^\d{2}:\d{2}:\d{2}:\d{2}$/;
  return pattern.test(timecode);
}
