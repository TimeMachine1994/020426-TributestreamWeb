# Official TXT Transcript Format - Detailed Analysis

## Document Overview
This document provides a comprehensive analysis of the official legal deposition transcript format used in the TPG (Transcript Processing Tool) project. The format follows standard court reporter conventions for legal depositions.

---

## 1. Page and Line Number System

### Primary Structure
The transcript uses a dual-component identification system:

**Format Pattern:** `00001:01`
- **Page Number**: 5-digit zero-padded integer (00001, 00002, 00003, etc.)
- **Separator**: Single colon character `:`
- **Line Number**: 2-digit zero-padded integer (01-25)

### Page Number Behavior
- **First Line of Each Page**: Full page:line format appears
  ```
  00001:01  [CONTENT]
  00002:01  [CONTENT]
  00003:01  [CONTENT]
  ```

- **Subsequent Lines**: Only the line number with leading whitespace
  ```
  00001:01  [CONTENT]
        02  [CONTENT]
        03  [CONTENT]
        ...
        25  [CONTENT]
  ```

### Whitespace Pattern
- **Full Page:Line (Line 01)**: No leading whitespace before page number
- **Line Numbers Only (Lines 02-25)**: 8 spaces of indentation before line number
  - Pattern: `        02` (8 spaces + 2-digit line number)
  - Consistent across all pages

---

## 2. Lines Per Page Standard

### Court Reporter Convention
- **Standard**: 25 lines per page
- **Consistent throughout document**: Each page increments through lines 01-25
- **Page breaks**: Occur after line 25, next page starts at 01

### Example Page Transition
```
  00010:24  [content from page 10, line 24]
        25  [content from page 10, line 25]
  00011:01  [content from page 11, line 1]
        02  [content from page 11, line 2]
```

---

## 3. Header and Metadata Sections

### Document Opening Structure
The transcript begins with standard legal deposition headers:

1. **Case Information Block** (Lines 01-10 approximately)
   - State identification
   - Court information
   - Case number
   - Case title with parties

2. **Deposition Details** (Lines 11-15 approximately)
   - Deposition subject name
   - Date taken
   - Volume number (if applicable)

3. **Appearances Section** (Lines 16+ approximately)
   - "APPEARANCES:" header
   - Attorney listings with:
     - Attorney name (e.g., "MR. KENNETH A. BEATTIE")
     - Law firm/organization
     - Address (multi-line)
     - Phone number
     - Email address
     - Role identifier (e.g., "Attorney for the Plaintiff")

### Blank Lines in Headers
- Empty lines use the full line number format but contain no text after the number
- Example: `        14` (with no following content)

---

## 4. Content Formatting

### Speaker Identification Patterns

#### Question-Answer Format
```
        02      Q.   [Question text]
        03      A.   [Answer text]
```

- **Q.**: Indicates questions from examining attorney
- **A.**: Indicates answers from deponent/witness
- Followed by 3 spaces before content

#### Named Speaker Format
```
        16      MR. BEATTIE:  [Statement text]
        22      MS. VERONA:  [Statement text]
        18      THE WITNESS:  [Statement text]
```

- Speaker name in all caps
- Followed by colon and two spaces
- Used for:
  - Attorney statements/objections
  - Witness clarifications
  - Court reporter notes

### Text Wrapping and Continuation

#### Multi-Line Responses
When answers or statements span multiple lines, text flows naturally across line numbers:

```
        03      A.   So I am a dual-board-certified orthopedic
        04  surgeon.  I have a certification in orthopedic surgery
        05  where I did a military Army trauma postgraduate
```

**Key Observations:**
- First line has speaker label (Q. or A.)
- Continuation lines have **2 spaces** of indentation after line number
- No speaker label on continuation lines
- Text flows naturally with proper word breaks

#### Long Questions
```
        04      Q.   And so aside from your education -- now we're
        05  in your work life.
        06           Who do you currently work for and -- and for
        07  how long?
```

**Pattern:**
- Multi-sentence questions can span multiple line entries
- Each line number gets its own entry
- Indentation preserved for readability (additional 11 spaces for continuation thought)

---

## 5. Indentation Hierarchy

### Standard Indentation Levels

1. **Page:Line Identifier (Line 01)**: Column 1 (no indentation)
   ```
   00001:01
   ```

2. **Line Number Only (Lines 02-25)**: 8 spaces + line number
   ```
           02
   ```

3. **Speaker Label**: 6 spaces after line number
   ```
   00001:01      Q.
           02      A.
   ```

4. **Content Start**: 3 spaces after speaker label
   ```
   00001:01      Q.   What is your name?
           02      A.   My name is John Doe.
   ```

5. **Wrapped Content**: 2 spaces after line number (no speaker label)
   ```
   00001:03      A.   This is the first line of my answer
           04  and this is the continuation of that answer.
   ```

6. **Sub-Indentation**: 11 additional spaces for continued thoughts
   ```
   00001:06           Who do you currently work for and -- and for
           07  how long?
   ```

### Visual Spacing Map
```
|←Page:Line→|←6sp→|←Label→|←3sp→|←Content→
|  00001:01 |      |   Q.  |     | What is your name?
|        02 |      |   A.  |     | My name is John.
|        03 |  [content continuation - 2 spaces]
|        04 |      |   Q.  |     | Thank you.
```

---

## 6. Special Characters and Punctuation

### Legal Transcript Conventions

- **Double Hyphens** (`--`): Indicate verbal pauses or interruptions
  ```
        04      Q.   And so aside from your education -- now we're
  ```

- **Parenthetical Notes**: Indicate actions or clarifications
  ```
        24  (The witness reviewed the document.)
  ```

- **Ellipsis**: Not commonly used; hyphens preferred for pauses

- **Question Mark**: Always follows questions from Q. lines

- **Period**: Ends statements, including speaker identification
  ```
        16      MR. BEATTIE:  I object to that question.
  ```

---

## 7. Line Content Characteristics

### Empty Lines
- Can appear in header sections
- Show line number but no content
- Pattern: `        14` (just whitespace + line number)

### Full Lines
- Maximum character width varies but typically wraps naturally
- Court reporters aim for readability
- Text breaks at word boundaries

### Partial Lines
- Common at end of responses before next question
- Line number present even if only 1-2 words of content

---

## 8. Parsing Considerations for TPG Tool

### Regular Expression Patterns

#### Detect Page Start
```regex
^  \d{5}:\d{2}
```
Matches: `  00001:01`

#### Detect Line Number Only
```regex
^        \d{2}
```
Matches: `        02` (8 spaces + 2 digits)

#### Detect Speaker Label
```regex
^.*\d{2}      [QA]\.   
```
Matches: `      Q.   ` or `      A.   ` (6 spaces + label + 3 spaces)

#### Detect Named Speaker
```regex
^.*\d{2}      [A-Z\s\.]+:  
```
Matches: `      MR. BEATTIE:  ` or `      THE WITNESS:  `

### Key Parsing Logic

1. **Extract Page Number**: From lines matching `00XXX:01`
2. **Extract Line Number**: Always present in first 10 characters
3. **Identify Content Start**: After speaker label or after line number + 2 spaces
4. **Preserve Indentation**: Critical for readability and context
5. **Handle Continuations**: Lines without speaker labels continue previous speaker

---

## 9. Example Annotated Section

```
Legend:
[P:L] = Page:Line identifier
[SP] = Speaker label
[CT] = Content
[CN] = Continuation

[P:L]
  00006:01  [CT] Fellow of American Academy of Orthopaedic Surgeons.
      [L]   [SP]        [CT]
        02      Q.   And what type of doctor are you?
      [L]   [SP]        [CT]
        03      A.   So I am a dual-board-certified orthopedic
      [L]   [CN]
        04  surgeon.  I have a certification in orthopedic surgery
      [L]   [CN]
        05  where I did a military Army trauma postgraduate
```

---

## 10. Critical Format Rules Summary

### Must Preserve
1. ✅ Page:Line numbering (00XXX:YY format)
2. ✅ 25 lines per page maximum
3. ✅ Speaker labels (Q., A., MR. NAME:, etc.)
4. ✅ Indentation hierarchy
5. ✅ Line continuation patterns

### Must Handle
1. ✅ Page transitions (XX:25 → XX+1:01)
2. ✅ Multi-line responses
3. ✅ Named speakers vs. Q/A format
4. ✅ Empty lines in headers
5. ✅ Special characters (hyphens, parentheticals)

### TPG Tool Requirements
When processing edited Premiere Pro transcripts:
- **Maintain exact page:line references** for kept content
- **Insert timestamp headers** for cut sections
- **Preserve original formatting** including all indentation
- **Handle speaker attribution** consistently
- **Respect line wrapping** patterns

---

## 11. Document Statistics (Based on Sample)

- **Total Pages Analyzed**: ~15 pages
- **Lines Per Page**: Consistently 25
- **Average Content Line Length**: ~55-65 characters
- **Header Section**: ~30-40 lines
- **Speaker Changes**: ~5-10 per page
- **Multi-line Responses**: ~60% of all answers

---

## Conclusion

This official transcript format is highly structured and follows strict court reporter standards. The TPG tool must maintain this exact formatting while allowing for edited content based on Premiere Pro timecodes. Any deviation from this format could invalidate the legal document for court proceedings.

**Next Step**: Analyze Premiere Pro export format to understand how to map timecoded edits back to page:line references.

---

*Document Created*: December 4, 2024  
*Purpose*: TPG Transcript Processing Tool Development  
*Based On*: `officialtxt.txt` sample deposition transcript
