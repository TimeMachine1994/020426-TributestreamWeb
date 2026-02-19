/**
 * TPG (Transcript Processing for Graphics) Library
 * Main entry point - exports all public APIs
 */

// Utilities
export * from './utils/timecode';

// Parsers
export * from './parsers/premiereParser';
export * from './parsers/officialParser';

// Matching
export * from './matching/textNormalizer';
export * from './matching/similarity';
export * from './matching/textMatcher';

// Bridge
export * from './bridge/types';
export * from './bridge/bridgeBuilder';
export * from './bridge/bridgeStorage';

// Clip Report
export * from './clipReport/types';
export * from './clipReport/generator';

// Output
export * from './output/textFormatter';
export * from './output/csvFormatter';

// Workflows (high-level functions)
export * from './workflows';
