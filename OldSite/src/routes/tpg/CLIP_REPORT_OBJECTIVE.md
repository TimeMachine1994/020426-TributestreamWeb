# TPG Clip Report Generator - Objective

## Purpose
Create a JavaScript program that generates a **"Clip Report"** showing the page and line number ranges for video segments that are **included in the edited video**. This allows lawyers to follow along with the official transcript as the edited video plays.

---

## Problem Statement

When a deposition video is edited in Premiere Pro:
- **Video segments are removed** (cuts made to shorten the deposition)
- The **edited video** only contains certain portions of the original testimony
- Lawyers need to know **which pages and lines** correspond to what's **actually in the video**
- They want to **follow along** with the official transcript while the edited video plays

---

## Inputs

### 1. Edited Premiere Pro Transcript (`editprem.txt`)
- Contains **only the segments that were kept** in the edited video
- Has timecode ranges (HH:MM:SS:FF - HH:MM:SS:FF)
- Has speaker labels (Speaker 1, 2, 3)
- Has the actual spoken text content

**Example**:
```
00:01:33:06 - 00:01:38:20
Speaker 3
Sure. Doctor. M Christopher McLaren, D.O., fellow American Academy of Orthopedic Surgeons.

00:01:38:22 - 00:01:41:02
Speaker 2
And what type of doctor are you?
```

### 2. Original Official Transcript (`officialtxt.txt`)
- Contains **all testimony** from the full deposition
- Has page:line formatting (00001:01, 00001:02, etc.)
- Has speaker labels (Q., A., MR. NAME:, etc.)
- Has legal formatting with proper indentation

**Example**:
```
  00006:01  Fellow of American Academy of Orthopaedic Surgeons.
        02      Q.   And what type of doctor are you?
        03      A.   So I am a dual-board-certified orthopedic
        04  surgeon.  I have a certification in orthopedic surgery
```

---

## Output: Clip Report

### What It Shows
A **sequential list of page:line ranges** that correspond to the segments **in the edited video**.

### Format
```
CLIP REPORT - Video Segments with Page:Line References
=====================================================

Segment 1:
  Video Timecode: 00:01:33:06 - 00:01:38:20
  Transcript Range: Page 00006, Line 01 - Page 00006, Line 03
  Duration: 5.47 seconds
  
Segment 2:
  Video Timecode: 00:01:38:22 - 00:01:41:02
  Transcript Range: Page 00006, Line 02 - Page 00006, Line 04
  Duration: 2.67 seconds

[GAP - Content Removed]
  Removed Timecode: 00:01:41:02 - 00:05:00:00
  Estimated Pages Skipped: Pages 00006-00010
  
Segment 3:
  Video Timecode: 00:05:00:00 - 00:05:30:00
  Transcript Range: Page 00010, Line 15 - Page 00011, Line 08
  Duration: 30 seconds
```

---

## Use Case Example

### Scenario
A 2-hour deposition is edited down to 45 minutes:
- **Original**: Pages 1-150 (full deposition)
- **Edited video**: Contains only specific testimony

### Lawyer's Workflow
1. Lawyer opens the **edited video** in video player
2. Lawyer opens the **official transcript** (paper or PDF)
3. Lawyer opens the **clip report**
4. As video plays, lawyer uses clip report to know which pages to read

### Example During Video Playback
```
[Video plays from 00:05:00 - 00:08:30]

Lawyer looks at clip report:
  "Segment 4: Pages 00012, Line 05 - Page 00018, Line 22"

Lawyer turns to page 12, line 5 in official transcript
Lawyer follows along, reading lines 5-25 on page 12, 
  then pages 13-17, then lines 1-22 on page 18
  
[Video jumps to next segment at 00:15:00]

Lawyer looks at clip report:
  "Segment 5: Pages 00035, Line 10 - Page 00038, Line 05"
  
Lawyer jumps to page 35, line 10 and continues following
```

---

## Technical Requirements

### Step 1: Parse Edited Premiere Pro Transcript
```javascript
const editedBlocks = parsePremiereProTranscript(editprem.txt);
// Extract: timecodes, speaker numbers, text content
```

### Step 2: Parse Official Transcript
```javascript
const officialLines = parseOfficialTranscript(officialtxt.txt);
// Extract: page:line numbers, speaker labels, text content
```

### Step 3: Match Content
For each block in edited Premiere Pro transcript:
```javascript
1. Extract the text content
2. Search for matching text in official transcript
3. Record the page:line number where match is found
4. Record the page:line number where match ends
5. Create a segment entry with:
   - Video timecode range
   - Transcript page:line range
   - Duration
```

### Step 4: Detect Gaps
```javascript
1. Compare consecutive segments in edited transcript
2. Calculate timecode gap between segments
3. If gap > threshold (e.g., 5 seconds):
   - Mark as removed content
   - Estimate page range that was skipped
   - Add gap entry to clip report
```

### Step 5: Generate Clip Report
```javascript
Output sequential list of:
  - Segments (what's IN the video)
  - Gaps (what was REMOVED)
  - Page:line mappings for each segment
```

---

## Key Matching Logic

### Text Similarity Matching
Since Premiere Pro and Official transcripts may have slight differences:
- Use fuzzy text matching (e.g., 90% similarity threshold)
- Normalize text (remove extra spaces, lowercase)
- Handle variations in punctuation

### Sequential Tracking
- Process edited blocks in chronological order
- Track current position in official transcript
- Assume forward progression (content doesn't move backwards)

### Page:Line Calculation
```javascript
// When match found in official transcript
startPageLine = foundLine.pageNumber + ":" + foundLine.lineNumber;

// Calculate end by counting lines in matched content
endPageLine = calculateEndPageLine(startPageLine, contentLength);
```

---

## Example Output Format Options

### Option 1: Simple List
```
Clip 1: Page 6, Lines 1-3 (00:01:33:06 - 00:01:38:20)
Clip 2: Page 6, Lines 2-4 (00:01:38:22 - 00:01:41:02)
[GAP]
Clip 3: Page 10, Lines 15 - Page 11, Line 8 (00:05:00:00 - 00:05:30:00)
```

### Option 2: Detailed Report
```
VIDEO CLIP REPORT
=================
Deposition: Brandon Page vs Circle K Stores
Witness: Dr. Christopher McLaren
Original Duration: 1:02:56
Edited Duration: 0:51:22
Total Segments: 45

SEGMENT 1
---------
Video Time: 00:01:33:06 - 00:01:38:20
Duration: 5.47 seconds
Transcript: Page 6, Line 1 - Page 6, Line 3
Content Preview: "Sure. Doctor. M Christopher McLaren..."

SEGMENT 2
---------
Video Time: 00:01:38:22 - 00:01:41:02
Duration: 2.67 seconds
Transcript: Page 6, Line 2 - Page 6, Line 4
Content Preview: "And what type of doctor are you?"
```

### Option 3: CSV Export
```csv
Segment,Start_Timecode,End_Timecode,Start_Page,Start_Line,End_Page,End_Line,Duration_Seconds
1,00:01:33:06,00:01:38:20,6,1,6,3,5.47
2,00:01:38:22,00:01:41:02,6,2,6,4,2.67
GAP,00:01:41:02,00:05:00:00,6,4,10,15,198.93
3,00:05:00:00,00:05:30:00,10,15,11,8,30.00
```

---

## Benefits

### For Lawyers
1. **Easy navigation** - Know exactly which pages correspond to video
2. **Quick reference** - Jump to specific testimony in transcript
3. **Court presentation** - Can cite specific page/line numbers while showing video
4. **Verification** - Confirm edited video matches official record

### For Legal Teams
1. **Quality control** - Verify edits match intended testimony
2. **Documentation** - Clear record of what's in the video
3. **Efficiency** - No need to manually track page numbers while watching

### For Court Proceedings
1. **Accuracy** - Official transcript page/line citations
2. **Transparency** - Clear documentation of edited segments
3. **Reference** - Judge/jury can follow along with transcript

---

## Algorithm Summary

```javascript
function generateClipReport(editedPremierePro, officialTranscript) {
  // 1. Parse both inputs
  const editedBlocks = parseEdited(editedPremierePro);
  const officialLines = parseOfficial(officialTranscript);
  
  // 2. Match content and build segments
  const segments = [];
  let currentOfficialPosition = 0;
  
  for (const block of editedBlocks) {
    // Find matching text in official transcript
    const match = findMatchingText(
      block.content, 
      officialLines, 
      currentOfficialPosition
    );
    
    if (match) {
      segments.push({
        videoStart: block.startTime,
        videoEnd: block.endTime,
        pageStart: match.startPage,
        lineStart: match.startLine,
        pageEnd: match.endPage,
        lineEnd: match.endLine,
        duration: calculateDuration(block.startTime, block.endTime)
      });
      
      currentOfficialPosition = match.endPosition;
    }
  }
  
  // 3. Detect gaps between segments
  const gaps = detectGaps(segments);
  
  // 4. Generate formatted report
  return formatClipReport(segments, gaps);
}
```

---

## Success Criteria

The program successfully:
1. ✅ Parses edited Premiere Pro transcript
2. ✅ Parses official transcript with page:line numbers
3. ✅ Matches content between the two formats
4. ✅ Generates sequential list of video segments
5. ✅ Maps each segment to correct page:line ranges
6. ✅ Identifies gaps where content was removed
7. ✅ Outputs clear, readable clip report
8. ✅ Allows lawyer to follow video using official transcript

---

## Next Steps

1. **Design data structures** for parsed transcripts
2. **Implement parsing functions** for both formats
3. **Create text matching algorithm** (fuzzy matching)
4. **Build segment mapping logic**
5. **Design clip report output format**
6. **Test with sample data** (editprem.txt + officialtxt.txt)
7. **Refine matching accuracy**
8. **Add user interface** for uploading files and generating report

---

*Document Created*: December 5, 2024  
*Purpose*: Define objective for TPG Clip Report Generator  
*Goal*: Enable lawyers to follow official transcript while watching edited video
