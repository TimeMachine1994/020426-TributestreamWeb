# Premiere Pro Transcript Format - Syntax Analysis

## Document Overview
This document provides a comprehensive analysis of the Adobe Premiere Pro transcript export format. This format represents the **edited** video content with timecodes, showing exactly what content was kept in the final edit.

---

## 1. Basic Block Structure

### Standard Pattern
Every content block follows this exact structure:

```
[TIMECODE LINE]
[SPEAKER LINE]
[CONTENT LINES - can be single or multiple lines]
[BLANK LINE]
```

### Real Example
```
00:00:03:20 - 00:00:31:20
Speaker 1
Good afternoon. We are on the record. The time is 100 8 p.m. on November 13th of 2025.

00:00:31:22 - 00:00:49:24
Speaker 1
For anyone who does not want the witnesses video to take up a large part of your screen, you may click the Gallery View button in the upper right corner.

00:00:49:24 - 00:01:08:04
Speaker 1
I'm the videographer on behalf of U.S. Legal Support.
```

---

## 2. Timecode Format

### Syntax
```
HH:MM:SS:FF - HH:MM:SS:FF
```

### Components
- **HH**: Hours (2 digits, zero-padded: 00-99)
- **MM**: Minutes (2 digits, zero-padded: 00-59)
- **SS**: Seconds (2 digits, zero-padded: 00-59)
- **FF**: Frames (2 digits, zero-padded: 00-29 for 30fps, 00-23 for 24fps)
- **Separator**: Single hyphen with spaces on both sides (` - `)

### Examples
```
00:00:03:20 - 00:00:31:20    [Start: 3 sec, 20 frames | End: 31 sec, 20 frames]
00:01:08:06 - 00:01:11:14    [Start: 1 min, 8 sec, 6 frames | End: 1 min, 11 sec, 14 frames]
01:02:50:19 - 01:02:56:24    [Start: 1 hour, 2 min, 50 sec, 19 frames | End: 1 hour, 2 min, 56 sec, 24 frames]
```

### Key Characteristics
1. **Always first line** of each block
2. **No leading/trailing whitespace**
3. **Start time always before end time** (chronological)
4. **Frame-accurate** for precise video editing

---

## 3. Speaker Identification

### Syntax
```
Speaker [Number]
```

### Format Rules
- **Label**: Literal text "Speaker" (capital S)
- **Space**: Single space between "Speaker" and number
- **Number**: Positive integer (1, 2, 3, 4, etc.)
- **No punctuation**: No colon, period, or other marks

### Examples
```
Speaker 1
Speaker 2
Speaker 3
```

### Speaker Mapping (from sample)
- **Speaker 1**: Videographer/Court Reporter
- **Speaker 2**: Plaintiff's Attorney
- **Speaker 3**: Witness/Doctor

### Key Characteristics
1. **Always second line** of each block
2. **Consistent numbering** - same speaker = same number throughout
3. **No speaker names** - only generic numbers
4. **Sequential appearance** - usually 1, 2, 3 in order of first appearance

---

## 4. Content Text

### Format
- **Natural paragraph format** - no artificial line breaks
- **Multiple lines allowed** - content can span multiple lines
- **Proper punctuation** - standard English punctuation maintained
- **Capitalization** - follows normal writing rules
- **No special markers** - no Q./A. prefixes like official transcript

### Single-Line Example
```
00:01:33:06 - 00:01:38:20
Speaker 3
Sure. Doctor. M Christopher McLaren, D.O., fellow American Academy of Orthopedic Surgeons.
```

### Multi-Line Example
```
00:00:03:20 - 00:00:31:20
Speaker 1
Good afternoon. We are on the record. The time is 100 8 p.m. on November 13th of 2025. Private conversations and or attorney client interactions should be held outside the presence of the remote interface. For the purpose of creating a witness only video recording, the witness is being spotlighted or locked on all video screens. While in speaker view, we ask that the witness not remove the spotlight setting during deposition, as it may cause other participants to appear on the final video rather than just the witness.
```

### Key Characteristics
1. **No indentation** - content starts at column 1
2. **Natural flow** - reads like regular text
3. **Preserves spoken style** - includes fillers, repetitions, natural speech patterns
4. **Variable length** - can be single sentence or multiple paragraphs

---

## 5. Block Separation

### Rule
Blocks are separated by **exactly one blank line**

### Example
```
00:01:08:06 - 00:01:11:14
Speaker 2
Kelly Beatty, on behalf of the plaintiff, Brandon Page.
[BLANK LINE HERE]
00:01:11:16 - 00:01:28:18
Speaker 1
Katherine Verona, on behalf of the defendant, circle K stores. Wanted to review hand. We saw the testimony about potentially the truth, the whole truth, and nothing about this incident because I knew.
```

### Important
- **Not optional** - blank line is required separator
- **Exactly one** - not two, not zero, exactly one
- **Critical for parsing** - defines block boundaries

---

## 6. Sequential Timecode Flow

### Chronological Order
Timecodes progress chronologically through the document:

```
00:00:03:20 - 00:00:31:20   [Segment 1]
00:00:31:22 - 00:00:49:24   [Segment 2 - starts 2 frames after previous ends]
00:00:49:24 - 00:01:08:04   [Segment 3 - starts same frame previous ends]
00:01:08:06 - 00:01:11:14   [Segment 4 - 2 frame gap from previous]
```

### Gap Detection

#### Small Gaps (< 1 second)
Usually represent **simple edit points** or frame trimming:
```
00:01:08:04 [END]
00:01:08:06 [START] 
Gap = 2 frames (negligible)
```

#### Large Gaps (> 1 second)
Indicate **content was removed** in edit:
```
00:10:30:15 [END]
00:15:45:20 [START]
Gap = ~5 minutes, 15 seconds (significant cut)
```

---

## 7. Parsing Regular Expressions

### Timecode Line
```regex
^(\d{2}:\d{2}:\d{2}:\d{2}) - (\d{2}:\d{2}:\d{2}:\d{2})$
```
**Captures**:
- Group 1: Start timecode
- Group 2: End timecode

### Speaker Line
```regex
^Speaker (\d+)$
```
**Captures**:
- Group 1: Speaker number

### Complete Block
```regex
^(\d{2}:\d{2}:\d{2}:\d{2}) - (\d{2}:\d{2}:\d{2}:\d{2})\nSpeaker (\d+)\n([\s\S]+?)(?=\n\n|\n*$)
```
**Captures**:
- Group 1: Start timecode
- Group 2: End timecode
- Group 3: Speaker number
- Group 4: Content text

---

## 8. Sample Data Structure (for parsing)

### Parsed Block Object
```typescript
interface PremierProBlock {
  startTime: string;        // "00:00:03:20"
  endTime: string;          // "00:00:31:20"
  speaker: number;          // 1
  content: string;          // "Good afternoon. We are..."
  startSeconds: number;     // 3.667 (calculated)
  endSeconds: number;       // 31.667 (calculated)
}
```

### Timecode to Seconds Conversion
```typescript
function timecodeToSeconds(timecode: string, fps: number = 30): number {
  const [hh, mm, ss, ff] = timecode.split(':').map(Number);
  return (hh * 3600) + (mm * 60) + ss + (ff / fps);
}
```

---

## 9. What This Format Tells Us

### 1. Edited Content Segments
Each block represents content **kept in the edited video**

### 2. Edit Points
Gaps between end time and next start time show where cuts occurred

### 3. Speaker Attribution
Speaker numbers correlate to actual people (need to map to names from official transcript)

### 4. Duration Information
Each segment's duration = End time - Start time

### Example Analysis
```
00:02:04:11 - 00:02:11:19
Speaker 3
I do not do spine or hand surgery. Okay. So.

Duration: ~7 seconds
Speaker: Witness (Speaker 3)
Content: Brief statement
```

---

## 10. Format Validation Checklist

### Valid Premiere Pro Transcript Must Have:
- ✅ Timecode on line 1 of each block
- ✅ Speaker on line 2 of each block
- ✅ Content starting on line 3
- ✅ Blank line after each block
- ✅ Chronological timecode progression
- ✅ Timecode format: `HH:MM:SS:FF - HH:MM:SS:FF`
- ✅ Speaker format: `Speaker [Number]`

### Invalid Patterns:
- ❌ Missing timecode
- ❌ Missing speaker line
- ❌ No blank line separator
- ❌ Timecodes out of order
- ❌ Invalid timecode format
- ❌ Empty content

---

## 11. Comparison with Official TXT

| Feature | Premiere Pro | Official TXT |
|---------|-------------|--------------|
| **Primary Index** | Timecode (HH:MM:SS:FF) | Page:Line (00001:01) |
| **Speaker Format** | Speaker [Number] | Q./A./MR. NAME: |
| **Structure** | Simple blocks | Complex indentation |
| **Line Wrapping** | Natural paragraphs | Fixed line breaks |
| **Page Breaks** | None | Every 25 lines |
| **Timestamps** | Every segment | None |
| **Legal Format** | No | Yes |
| **Edit Markers** | Yes (timecodes) | No |

---

## 12. Key Insights for TPG Tool

### What We Know
1. **Premiere Pro shows what was KEPT** in edit
2. **Gaps between timecodes = REMOVED content**
3. **Text content needs to be matched** with official transcript
4. **Speaker numbers need to be mapped** to official names/roles

### Processing Strategy
1. Parse Premiere Pro blocks → extract text + timecodes
2. Match text content with official transcript → find page:line references
3. Identify gaps in timecodes → insert timestamp headers
4. Reconstruct official format → maintain page:line structure

---

## 13. Example Processing Flow

### Input: Two Premiere Pro Blocks
```
00:05:00:00 - 00:05:15:00
Speaker 2
And what type of doctor are you?

00:05:15:05 - 00:05:30:10
Speaker 3
I am a board certified orthopedic surgeon.
```

### Output: Official Format (Reconstructed)
```
  00023:15      Q.   And what type of doctor are you?
        16      A.   I am a board certified orthopedic surgeon.
```

### If Content Was Cut Between
```
00:05:15:00 [END]
00:10:30:00 [START - 5 minute gap]
```

### Insert Timestamp Header
```
  00023:15      Q.   And what type of doctor are you?
        16      A.   I am a board certified orthopedic surgeon.

[TIMESTAMP: 00:05:15:00 - 00:10:30:00 - CONTENT REMOVED IN EDIT]

  00031:08      Q.   [Next question after cut]
```

---

## 14. Document Statistics (from sample)

- **Total Blocks**: ~460 blocks
- **Total Duration**: ~1 hour, 3 minutes
- **Average Block Duration**: ~8-15 seconds
- **Speaker Count**: 3 speakers
- **Longest Block**: ~28 seconds
- **Shortest Block**: ~3 seconds
- **Total File Size**: ~52KB

---

## Conclusion

The Premiere Pro transcript format is **straightforward and parsable**:
- **Consistent structure** (timecode, speaker, content, blank line)
- **Frame-accurate timecodes** for precise edit identification
- **Simple text format** with no complex formatting
- **Edit decision list** built into the structure via timecode gaps

**For TPG Tool**: This serves as the **edit guide** to determine which parts of the official transcript to keep and where to insert timestamp markers for removed sections.

---

*Document Created*: December 5, 2024  
*Purpose*: TPG Transcript Processing Tool Development  
*Based On*: `premtxt.txt` - Premiere Pro export sample  
*Deposition*: Brandon Page vs Circle K Stores - Dr. Christopher McLaren testimony
