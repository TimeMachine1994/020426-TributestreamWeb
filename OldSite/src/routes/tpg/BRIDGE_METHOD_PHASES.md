# Bridge Method Implementation - Discrete Phases

## Overview

The Bridge Method uses the **original Premiere Pro transcript** as a bridge to map timecodes from the **edited video** to **official transcript page:line numbers**.

**Three Documents**:
1. Original Premiere Pro → Full deposition with timecodes
2. Official Transcript → Full deposition with page:line numbers  
3. Edited Premiere Pro → Final video with timecodes

**Flow**: Edited Timecode → Original Timecode → Official Page:Line

---

## Phase 1: Utilities & Parsing (2-4 hours)

**Goal**: Create helper functions and parsers

### 1.1 Timecode Utilities (`src/lib/tpg/utils/timecode.ts`)
- `timecodeToSeconds()` - Convert HH:MM:SS:FF to seconds
- `secondsToTimecode()` - Convert seconds to HH:MM:SS:FF
- `calculateDuration()` - Get duration between timecodes
- `isValidTimecode()` - Validate format

### 1.2 Premiere Parser (`src/lib/tpg/parsers/premiereParser.ts`)
```typescript
interface PremiereBlock {
  id: string;
  startTime: string;
  endTime: string;
  startSeconds: number;
  endSeconds: number;
  duration: number;
  speaker: number;
  content: string;
}

function parsePremiereTranscript(text: string): PremiereBlock[]
```

### 1.3 Official Parser (`src/lib/tpg/parsers/officialParser.ts`)
```typescript
interface OfficialLine {
  page: number;
  lineNum: number;
  pageLineId: string;
  content: string;
  speakerLabel?: string;
}

function parseOfficialTranscript(text: string): OfficialLine[]
```

**Test**: Parse all three sample files successfully

---

## Phase 2: Text Matching (3-5 hours)

**Goal**: Match content between documents

### 2.1 Normalization (`src/lib/tpg/matching/textNormalizer.ts`)
- `normalizeText()` - Remove punctuation, lowercase, trim
- `extractWords()` - Split into word array
- `generateNGrams()` - For fuzzy matching

### 2.2 Similarity (`src/lib/tpg/matching/similarity.ts`)
- `jaccardSimilarity()` - Word overlap score (0-1)
- `levenshteinDistance()` - Edit distance
- `calculateSimilarity()` - Combined score

### 2.3 Matcher (`src/lib/tpg/matching/textMatcher.ts`)
```typescript
interface TextMatch {
  startPage: number;
  startLine: number;
  endPage: number;
  endLine: number;
  confidence: number;
}

function findTextInOfficial(
  searchText: string,
  officialLines: OfficialLine[],
  startPosition: number
): TextMatch | null
```

**Test**: Match sample content with >85% accuracy

---

## Phase 3: Bridge Building (2-3 hours)

**Goal**: Create reusable timecode → page:line map

### 3.1 Types (`src/lib/tpg/bridge/types.ts`)
```typescript
interface BridgeMapping {
  timecodeId: string;
  startTime: string;
  endTime: string;
  pageStart: number;
  lineStart: number;
  pageEnd: number;
  lineEnd: number;
  confidence: number;
}

class BridgeMap {
  set(id: string, mapping: BridgeMapping): void
  get(id: string): BridgeMapping | undefined
  toJSON(): object
  static fromJSON(data: any): BridgeMap
}
```

### 3.2 Builder (`src/lib/tpg/bridge/bridgeBuilder.ts`)
```typescript
function buildBridgeMap(
  originalBlocks: PremiereBlock[],
  officialLines: OfficialLine[]
): BridgeMap
```

**Process**:
1. For each original Premiere block
2. Find matching content in official transcript
3. Store mapping: timecode → page:line
4. Return BridgeMap

### 3.3 Storage (`src/lib/tpg/bridge/bridgeStorage.ts`)
- `saveBridgeMap()` - Save to JSON
- `loadBridgeMap()` - Load from JSON
- `downloadBridgeMap()` - Browser download

**Test**: Build bridge, save, reload, verify mappings

---

## Phase 4: Report Generation (2-3 hours)

**Goal**: Use bridge to generate clip reports

### 4.1 Types (`src/lib/tpg/clipReport/types.ts`)
```typescript
interface ClipSegment {
  segmentNumber: number;
  videoStart: string;
  videoEnd: string;
  videoDuration: number;
  pageStart: number;
  lineStart: number;
  pageEnd: number;
  lineEnd: number;
}

interface ClipGap {
  gapNumber: number;
  gapStartTime: string;
  gapEndTime: string;
  gapDuration: number;
  estimatedPagesSkipped: number;
}

interface ClipReport {
  segments: ClipSegment[];
  gaps: ClipGap[];
  summary: { totalSegments, totalGaps, etc. }
}
```

### 4.2 Generator (`src/lib/tpg/clipReport/generator.ts`)
```typescript
function generateClipReport(
  editedBlocks: PremiereBlock[],
  bridgeMap: BridgeMap
): ClipReport
```

**Process**:
1. For each edited block
2. Look up timecode in bridge map (O(1))
3. Get page:line numbers
4. Detect gaps between segments
5. Return ClipReport

**Test**: Generate report from edited transcript

---

## Phase 5: Output Formatting (2-3 hours)

**Goal**: Create readable output formats

### 5.1 Text Formatter (`src/lib/tpg/output/textFormatter.ts`)
- `formatDetailed()` - Full report with boxes
- `formatSimple()` - Concise list format

### 5.2 CSV Formatter (`src/lib/tpg/output/csvFormatter.ts`)
- `formatCSV()` - Spreadsheet format
- `formatGapsCSV()` - Separate gaps file

**Example Output**:
```
═══════════════════════════════════════
  VIDEO CLIP REPORT
═══════════════════════════════════════

SEGMENT 1
Video Time:   00:01:33:06 → 00:01:38:20
Duration:     5.47 seconds
Transcript:   Page 6, Line 1 → Page 6, Line 3

[GAP: 198s removed, ~4 pages skipped]

SEGMENT 2
Video Time:   00:05:00:00 → 00:05:30:00
...
```

**Test**: Format report in all three styles

---

## Phase 6: Integration (3-5 hours)

**Goal**: Connect to UI and enable file operations

### 6.1 Workflows (`src/lib/tpg/workflows.ts`)
```typescript
// ONE-TIME SETUP
async function buildBridge(
  premiereTxt: string,
  officialTxt: string
): Promise<BridgeMap>

// REPEATED USE
async function generateReport(
  editedPremiereTxt: string,
  bridgeMap: BridgeMap
): Promise<ClipReport>

// COMPLETE WORKFLOW
async function completeWorkflow(...): Promise<{
  bridgeMap, report, formatted
}>
```

### 6.2 UI Integration (`+page.svelte`)
1. Add file upload inputs
2. Add "Build Bridge" button → Phase 1
3. Add "Generate Report" button → Phase 2
4. Display results in textboxes
5. Add download buttons

### 6.3 Testing
- Test with sample files
- Verify accuracy
- Performance benchmarks

---

## Complete Usage Example

```typescript
import { completeWorkflow } from '$lib/tpg';

// Load files
const premiereTxt = await readFile('premtxt.txt');
const editedTxt = await readFile('editprem.txt');
const officialTxt = await readFile('officialtxt.txt');

// Run workflow
const result = await completeWorkflow(
  premiereTxt,
  editedTxt,
  officialTxt,
  {
    bridgeSaveAs: 'bridge-map.json',
    reportSaveAs: 'clip-report.txt',
    reportFormat: 'detailed'
  }
);

console.log(result.formatted);
```

---

## Benefits of Bridge Method

✅ **Fast**: O(1) lookups after bridge is built  
✅ **Accurate**: Exact timecode matching  
✅ **Reusable**: One bridge serves unlimited edits  
✅ **Scalable**: Works with any deposition length  

**Total Time**: 14-23 hours for complete implementation
