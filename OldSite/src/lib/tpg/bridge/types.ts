/**
 * TPG Bridge Map Types
 * Data structures for timecode to page:line mappings
 */

export interface BridgeMapping {
  // Timecode information
  timecodeId: string;         // "00:01:33:06-00:01:38:20"
  startTime: string;          // "00:01:33:06"
  endTime: string;            // "00:01:38:20"
  startSeconds: number;       // 93.2
  endSeconds: number;         // 98.667
  duration: number;           // 5.467
  
  // Official transcript information
  pageStart: number;          // 6
  lineStart: number;          // 1
  pageEnd: number;            // 6
  lineEnd: number;            // 3
  pageLineStart: string;      // "00006:01"
  pageLineEnd: string;        // "00006:03"
  
  // Metadata
  speaker: number;            // 3
  content: string;            // Original content
  confidence: number;         // 0.95
  officialLineIndices: {
    start: number;
    end: number;
  };
}

export interface BridgeMapMetadata {
  createdAt: string;
  totalMappings: number;
  depositionInfo?: {
    case: string;
    witness: string;
    date: string;
  };
  originalStats: {
    totalBlocks: number;
    totalDuration: number;
    speakers: number[];
  };
  officialStats: {
    totalLines: number;
    totalPages: number;
  };
  version: string;
}

export class BridgeMap {
  private mappings: Map<string, BridgeMapping>;
  metadata: BridgeMapMetadata;
  
  constructor() {
    this.mappings = new Map();
    this.metadata = {
      createdAt: new Date().toISOString(),
      totalMappings: 0,
      originalStats: { totalBlocks: 0, totalDuration: 0, speakers: [] },
      officialStats: { totalLines: 0, totalPages: 0 },
      version: '1.0'
    };
  }
  
  set(timecodeId: string, mapping: BridgeMapping): void {
    this.mappings.set(timecodeId, mapping);
    this.metadata.totalMappings = this.mappings.size;
  }
  
  get(timecodeId: string): BridgeMapping | undefined {
    return this.mappings.get(timecodeId);
  }
  
  has(timecodeId: string): boolean {
    return this.mappings.has(timecodeId);
  }
  
  entries(): IterableIterator<[string, BridgeMapping]> {
    return this.mappings.entries();
  }
  
  get size(): number {
    return this.mappings.size;
  }
  
  toJSON(): object {
    return {
      metadata: this.metadata,
      mappings: Array.from(this.mappings.entries()).map(([key, value]) => ({
        timecodeId: key,
        ...value
      }))
    };
  }
  
  static fromJSON(data: any): BridgeMap {
    const map = new BridgeMap();
    map.metadata = data.metadata;
    
    data.mappings.forEach((mapping: any) => {
      const { timecodeId, ...rest } = mapping;
      map.set(timecodeId, rest);
    });
    
    return map;
  }
}
