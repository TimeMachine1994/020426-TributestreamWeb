# Premiere Pro Edit Detection - Theoretical Framework

## Document Purpose
This document explains the **universal principles** for detecting edits between an original Premiere Pro transcript and an edited version. These concepts apply to ANY transcript pair, not just specific examples.

---

## 1. Fundamental Concept: Timecode as Edit Marker

### Core Principle
Premiere Pro transcripts use **timecode ranges** to represent video segments. When video is edited:
- **Kept segments** → Appear in edited transcript
- **Removed segments** → Disappear from edited transcript
- **Timecode gaps** → Indicate removed content

### Mathematical Representation
```
Original Transcript = [Block₁, Block₂, Block₃, Block₄, Block₅]
Edited Transcript   = [Block₁, Block₂, Block₅]
Removed Content     = [Block₃, Block₄]
```

---

## 2. Types of Edits

### A. Complete Block Removal
**Definition**: Entire timecode segments are removed from the timeline.

**Original**:
```
00:10:00:00 - 00:10:30:00
Speaker 1
Content that was removed

00:10:30:05 - 00:11:00:00
Speaker 2
Content that was kept
```

**Edited**:
```
00:10:30:05 - 00:11:00:00
Speaker 2
Content that was kept
```

**Detection Logic**:
- Block at `00:10:00:00 - 00:10:30:00` exists in original
- Block does NOT exist in edited version
- **Conclusion**: 30 seconds removed

---

### B. Timecode Gap Analysis
**Definition**: Missing timecode ranges between consecutive blocks indicate cuts.

**Original Flow**:
```
Block A: 00:05:00:00 - 00:05:30:00
Block B: 00:05:30:05 - 00:06:00:00  [5 frame gap - normal edit point]
Block C: 00:06:00:00 - 00:06:30:00
Block D: 00:06:30:10 - 00:07:00:00
```

**Edited Flow**:
```
Block A: 00:05:00:00 - 00:05:30:00
Block D: 00:06:30:10 - 00:07:00:00  [LARGE GAP = content removed]
```

**Gap Calculation**:
- Block A ends at: `00:05:30:00`
- Block D starts at: `00:06:30:10`
- **Gap**: 1 minute, 0 seconds, 10 frames
- **Conclusion**: Blocks B and C were removed

---

### C. Trim Edits
**Definition**: Start or end times of segments are adjusted.

**Original**:
```
00:15:00:00 - 00:15:45:00
Speaker 2
This is the full segment with all content included here.
```

**Edited**:
```
00:15:10:00 - 00:15:40:00
Speaker 2
This is the full segment with all content included here.
```

**Detection Logic**:
- Same content text
- Different start time (10 seconds trimmed from beginning)
- Different end time (5 seconds trimmed from end)
- **Conclusion**: Head and tail trimmed, 15 seconds total removed

---

## 3. Detection Algorithms

### Algorithm 1: Block-by-Block Comparison

```typescript
function detectRemovedBlocks(original: Block[], edited: Block[]): RemovedBlock[] {
  const removedBlocks: RemovedBlock[] = [];
  
  for (const originalBlock of original) {
    const existsInEdited = edited.some(block => 
      block.startTime === originalBlock.startTime &&
      block.endTime === originalBlock.endTime
    );
    
    if (!existsInEdited) {
      removedBlocks.push({
        startTime: originalBlock.startTime,
        endTime: originalBlock.endTime,
        content: originalBlock.content,
        duration: calculateDuration(originalBlock)
      });
    }
  }
  
  return removedBlocks;
}
```

**Use Case**: Finding blocks completely removed from timeline

---

### Algorithm 2: Sequential Gap Detection

```typescript
function detectTimecodeGaps(edited: Block[]): Gap[] {
  const gaps: Gap[] = [];
  
  for (let i = 0; i < edited.length - 1; i++) {
    const currentEnd = edited[i].endTime;
    const nextStart = edited[i + 1].startTime;
    
    const gapDuration = calculateTimeDifference(currentEnd, nextStart);
    
    // If gap is larger than typical edit point (e.g., 1 second)
    if (gapDuration > EDIT_THRESHOLD) {
      gaps.push({
        startTime: currentEnd,
        endTime: nextStart,
        duration: gapDuration
      });
    }
  }
  
  return gaps;
}
```

**Use Case**: Finding where content was cut based on timeline discontinuities

---

### Algorithm 3: Content Matching

```typescript
function matchContentBetweenVersions(
  original: Block[], 
  edited: Block[]
): ContentMapping {
  const mapping = {
    kept: [],
    removed: []
  };
  
  for (const origBlock of original) {
    // Try to find matching content in edited version
    const match = edited.find(editBlock => 
      contentSimilarity(origBlock.content, editBlock.content) > 0.9
    );
    
    if (match) {
      mapping.kept.push({
        originalTimecode: origBlock.startTime,
        editedTimecode: match.startTime,
        content: origBlock.content
      });
    } else {
      mapping.removed.push({
        timecode: origBlock.startTime,
        content: origBlock.content
      });
    }
  }
  
  return mapping;
}
```

**Use Case**: Matching text content regardless of timecode changes

---

## 4. Timecode Mathematics

### A. Converting Timecode to Seconds

```typescript
function timecodeToSeconds(timecode: string, fps: number = 30): number {
  const [hh, mm, ss, ff] = timecode.split(':').map(Number);
  
  const hours = hh * 3600;
  const minutes = mm * 60;
  const seconds = ss;
  const frames = ff / fps;
  
  return hours + minutes + seconds + frames;
}
```

**Example**:
- `00:15:30:15` at 30fps
- = (0 × 3600) + (15 × 60) + 30 + (15 / 30)
- = 0 + 900 + 30 + 0.5
- = **930.5 seconds**

---

### B. Calculating Duration Between Timecodes

```typescript
function calculateDuration(start: string, end: string, fps: number = 30): number {
  const startSeconds = timecodeToSeconds(start, fps);
  const endSeconds = timecodeToSeconds(end, fps);
  
  return endSeconds - startSeconds;
}
```

**Example**:
- Start: `00:10:00:00` → 600 seconds
- End: `00:10:45:15` → 645.5 seconds
- **Duration**: 45.5 seconds

---

### C. Identifying Gap Size

```typescript
function calculateGap(blockAEnd: string, blockBStart: string, fps: number = 30): number {
  const endSeconds = timecodeToSeconds(blockAEnd, fps);
  const startSeconds = timecodeToSeconds(blockBStart, fps);
  
  return startSeconds - endSeconds;
}
```

**Example**:
- Block A ends: `00:05:30:00` → 330 seconds
- Block B starts: `00:08:15:20` → 495.667 seconds
- **Gap**: 165.667 seconds (2 minutes, 45 seconds, 20 frames)

---

## 5. Edit Detection Thresholds

### Small Gaps: Normal Edit Points
**Range**: 0 - 1 second (0 - 30 frames at 30fps)

**Interpretation**: Standard video editing transition point
- Frame-accurate cuts
- Natural edit boundaries
- **NOT considered removed content**

### Medium Gaps: Intentional Cuts
**Range**: 1 second - 10 seconds

**Interpretation**: Brief sections removed
- Pauses or "ums" removed
- Attorney objections cut
- Brief tangents eliminated
- **Likely intentional edit**

### Large Gaps: Major Content Removal
**Range**: 10+ seconds

**Interpretation**: Significant content removal
- Entire question/answer sequences cut
- Multiple exchanges removed
- Long testimony sections eliminated
- **Definitely intentional major edit**

---

## 6. Practical Detection Workflow

### Step 1: Parse Both Transcripts
```
1. Load original Premiere Pro transcript
2. Load edited Premiere Pro transcript
3. Parse into block structures:
   - Timecode start/end
   - Speaker number
   - Content text
```

### Step 2: Create Timecode Index
```
For original transcript:
  - Build array of all timecode ranges
  - Sort chronologically
  - Calculate total duration

For edited transcript:
  - Build array of all timecode ranges
  - Sort chronologically
  - Calculate total duration
```

### Step 3: Compare Timecode Ranges
```
For each block in original:
  Check if block exists in edited (by timecode)
  
  If exists → Mark as KEPT
  If missing → Mark as REMOVED
```

### Step 4: Detect Sequential Gaps
```
For each consecutive pair in edited:
  Calculate gap between block[i].end and block[i+1].start
  
  If gap > threshold:
    Identify removed content from original
    Record gap details (start, end, duration)
```

### Step 5: Generate Edit Report
```
Output:
  - Total original duration
  - Total edited duration
  - Total removed duration
  - List of removed segments with timecodes
  - List of gaps with start/end times
```

---

## 7. Edge Cases and Considerations

### A. Identical Text, Different Timecodes
**Scenario**: Same content, but timecode shifted due to earlier edits

**Original**:
```
00:10:00:00 - 00:10:30:00
Speaker 1
This is the content.
```

**Edited** (after removing earlier content):
```
00:08:00:00 - 00:08:30:00
Speaker 1
This is the content.
```

**Detection Strategy**:
- Cannot rely on timecode matching alone
- Must use content text matching
- Track cumulative time shifts

---

### B. Split Blocks
**Scenario**: One block in original becomes multiple blocks in edited

**Original**:
```
00:15:00:00 - 00:15:45:00
Speaker 2
First part. Middle part. Last part.
```

**Edited**:
```
00:15:00:00 - 00:15:15:00
Speaker 2
First part. Last part.
```

**Detection Strategy**:
- Content text is subset of original
- Timecode is truncated
- **Conclusion**: Middle section removed

---

### C. Reordering (Rare)
**Scenario**: Segments appear in different order

**Original**:
```
Block A: 00:05:00 - 00:06:00
Block B: 00:06:00 - 00:07:00
```

**Edited**:
```
Block B: 00:06:00 - 00:07:00
Block A: 00:05:00 - 00:06:00
```

**Detection Strategy**:
- Cannot assume chronological order
- Must track by content hash or unique identifiers
- **Note**: Very rare in legal depositions

---

## 8. Integration with Official Transcript

### Challenge
Premiere Pro transcript has:
- Timecodes (HH:MM:SS:FF)
- Speaker numbers (Speaker 1, 2, 3)
- Natural text flow

Official transcript has:
- Page:Line numbers (00001:01)
- Speaker labels (Q./A./MR. NAME:)
- Legal formatting

### Solution: Content Mapping
```
1. Extract text from Premiere Pro blocks (ignore timecodes)
2. Search for matching text in official transcript
3. When found, record page:line reference
4. When missing (gap detected), insert timestamp header at corresponding page:line
```

### Example Mapping
**Premiere Pro** (edited, shows gap):
```
00:10:00:00 - 00:10:30:00
Speaker 2
What type of doctor are you?

[GAP: 00:10:30:00 - 00:15:00:00 REMOVED]

00:15:00:00 - 00:15:20:00
Speaker 3
I am a board certified surgeon.
```

**Official Transcript** (reconstructed):
```
  00045:12      Q.   What type of doctor are you?

[TIMESTAMP: 00:10:30:00 - 00:15:00:00 - CONTENT REMOVED IN EDIT]

  00052:08      A.   I am a board certified surgeon.
```

---

## 9. Performance Considerations

### Time Complexity
- **Block Comparison**: O(n × m) where n = original blocks, m = edited blocks
- **Gap Detection**: O(n) where n = edited blocks
- **Content Matching**: O(n × m × k) where k = average text length

### Optimization Strategies
1. **Hash Content**: Create hash of text content for faster matching
2. **Binary Search**: Use sorted timecode arrays for faster lookups
3. **Cache Results**: Store calculated durations and gaps
4. **Parallel Processing**: Compare blocks in parallel threads

---

## 10. Output Format for TPG Tool

### Edit Detection Report Structure
```typescript
interface EditReport {
  original: {
    totalBlocks: number;
    totalDuration: number;
    startTime: string;
    endTime: string;
  };
  
  edited: {
    totalBlocks: number;
    totalDuration: number;
    startTime: string;
    endTime: string;
  };
  
  removed: {
    totalDuration: number;
    percentage: number;
    segments: RemovedSegment[];
  };
  
  gaps: Gap[];
}

interface RemovedSegment {
  startTime: string;
  endTime: string;
  duration: number;
  speaker: number;
  content: string;
}

interface Gap {
  afterBlock: number;
  beforeBlock: number;
  startTime: string;
  endTime: string;
  duration: number;
}
```

---

## 11. Validation Rules

### Edited Transcript Must:
- ✅ Have fewer or equal blocks than original (never more)
- ✅ Have shorter or equal duration than original (never longer)
- ✅ Maintain chronological timecode order
- ✅ All edited content exists in original (no new content)

### Invalid Scenarios:
- ❌ Edited version longer than original
- ❌ Content in edited not found in original
- ❌ Timecodes going backwards
- ❌ Overlapping timecode ranges

---

## 12. Summary: The Universal Algorithm

```
INPUT: Original Premiere Pro Transcript, Edited Premiere Pro Transcript

STEP 1: Parse both transcripts into structured blocks
  - Extract timecodes, speakers, content
  
STEP 2: Build timecode indexes
  - Convert all timecodes to seconds for math
  
STEP 3: Identify kept vs removed blocks
  - Compare original blocks against edited blocks
  
STEP 4: Detect timecode gaps
  - Calculate gaps between consecutive edited blocks
  - Flag gaps larger than threshold
  
STEP 5: Match removed content to official transcript
  - Search for removed text in official transcript
  - Record page:line references
  
STEP 6: Generate timestamp headers
  - Insert headers at gap locations in official transcript
  - Include timecode range of removed content
  
OUTPUT: Reconstructed official transcript with:
  - Original page:line formatting preserved
  - Kept content maintained
  - Timestamp headers for removed sections
```

---

## Conclusion

**Key Principle**: Edits in Premiere Pro transcripts are detected by analyzing **timecode discontinuities** and **missing content blocks**.

The TPG tool uses these principles to:
1. Identify what was removed from the video edit
2. Map that back to the official legal transcript
3. Generate a new official transcript that reflects the edit
4. Insert timestamp markers where content was cut

This approach works **universally** for any pair of Premiere Pro transcripts (original vs edited), regardless of content, duration, or complexity.

---

*Document Created*: December 5, 2024  
*Purpose*: TPG Transcript Processing Tool - Edit Detection Theory  
*Application*: Universal principles for ANY Premiere Pro transcript comparison
