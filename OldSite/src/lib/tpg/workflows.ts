/**
 * TPG Workflows
 * High-level workflow functions for TPG operations
 */

import { 
  parseOriginalPremiere, 
  parseEditedPremiere 
} from './parsers/premiereParser';
import { parseOfficialTranscript } from './parsers/officialParser';
import { buildBridgeMap, validateBridgeMap } from './bridge/bridgeBuilder';
import { saveBridgeMapLocal, downloadBridgeMap } from './bridge/bridgeStorage';
import { generateClipReport } from './clipReport/generator';
import { formatDetailed, formatSimple } from './output/textFormatter';
import { formatCSV } from './output/csvFormatter';
import type { BridgeMap } from './bridge/types';
import type { ClipReport } from './clipReport/types';

/**
 * PHASE 1: Build bridge map (one-time setup)
 */
export async function buildBridge(
  premiereTxt: string,
  officialTxt: string,
  options: {
    saveAs?: string;
    download?: boolean;
    verbose?: boolean;
    onProgress?: (current: number, total: number, percent: number) => void;
  } = {}
): Promise<{
  bridgeMap: BridgeMap;
  validation: ReturnType<typeof validateBridgeMap>;
}> {
  const { saveAs, download = false, verbose = true, onProgress } = options;
  
  if (verbose) console.log('Phase 1: Building bridge map...\n');
  
  // Parse inputs
  const originalBlocks = parseOriginalPremiere(premiereTxt);
  const officialLines = parseOfficialTranscript(officialTxt);
  
  if (verbose) {
    console.log(`  Original Premiere blocks: ${originalBlocks.length}`);
    console.log(`  Official transcript lines: ${officialLines.length}\n`);
  }
  
  // Build bridge
  const bridgeMap = await buildBridgeMap(originalBlocks, officialLines, { 
    verbose,
    onProgress 
  });
  
  // Validate
  const validation = validateBridgeMap(bridgeMap);
  
  if (verbose) {
    console.log('\nValidation:');
    console.log(`  Valid: ${validation.isValid}`);
    console.log(`  Avg confidence: ${(validation.stats.avgConfidence * 100).toFixed(1)}%`);
    console.log(`  Coverage: ${validation.stats.coveragePercent.toFixed(1)}%`);
    
    if (validation.warnings.length > 0) {
      console.log('\n  Warnings:');
      validation.warnings.forEach(w => console.log(`    - ${w}`));
    }
    
    if (validation.errors.length > 0) {
      console.log('\n  Errors:');
      validation.errors.forEach(e => console.log(`    - ${e}`));
    }
  }
  
  // Save if requested
  if (saveAs) {
    if (download) {
      downloadBridgeMap(bridgeMap, saveAs);
      if (verbose) console.log(`\n✓ Bridge map downloaded as: ${saveAs}`);
    } else {
      saveBridgeMapLocal(bridgeMap, saveAs);
      if (verbose) console.log(`\n✓ Bridge map saved to localStorage: ${saveAs}`);
    }
  }
  
  return { bridgeMap, validation };
}

/**
 * PHASE 2: Generate clip report (use anytime)
 */
export async function generateReport(
  editedPremiereTxt: string,
  bridgeMap: BridgeMap,
  options: {
    format?: 'detailed' | 'simple' | 'csv';
    verbose?: boolean;
  } = {}
): Promise<{
  report: ClipReport;
  formatted: string;
}> {
  const { format = 'detailed', verbose = true } = options;
  
  if (verbose) console.log('Phase 2: Generating clip report...\n');
  
  if (verbose) {
    console.log(`  Bridge map loaded: ${bridgeMap.size} mappings`);
  }
  
  // Parse edited transcript
  const editedBlocks = parseEditedPremiere(editedPremiereTxt);
  
  if (verbose) {
    console.log(`  Edited blocks: ${editedBlocks.length}\n`);
  }
  
  // Generate report
  const report = generateClipReport(editedBlocks, bridgeMap, { verbose });
  
  // Format output
  let formatted: string;
  switch (format) {
    case 'simple':
      formatted = formatSimple(report);
      break;
    case 'csv':
      formatted = formatCSV(report);
      break;
    case 'detailed':
    default:
      formatted = formatDetailed(report);
  }
  
  if (verbose) {
    console.log(`\n✓ Report formatted as: ${format}`);
  }
  
  return { report, formatted };
}

/**
 * Complete workflow: Build bridge and generate report
 */
export async function completeWorkflow(
  premiereTxt: string,
  editedPremiereTxt: string,
  officialTxt: string,
  options: {
    bridgeSaveAs?: string;
    bridgeDownload?: boolean;
    reportFormat?: 'detailed' | 'simple' | 'csv';
    verbose?: boolean;
    onBridgeProgress?: (current: number, total: number, percent: number) => void;
  } = {}
): Promise<{
  bridgeMap: BridgeMap;
  report: ClipReport;
  formatted: string;
}> {
  const { verbose = true, onBridgeProgress } = options;
  
  if (verbose) {
    console.log('═══════════════════════════════════════');
    console.log('  TPG COMPLETE WORKFLOW');
    console.log('═══════════════════════════════════════\n');
  }
  
  // Phase 1: Build bridge
  const { bridgeMap } = await buildBridge(premiereTxt, officialTxt, {
    saveAs: options.bridgeSaveAs,
    download: options.bridgeDownload,
    verbose,
    onProgress: onBridgeProgress
  });
  
  if (verbose) console.log('\n');
  
  // Phase 2: Generate report
  const { report, formatted } = await generateReport(editedPremiereTxt, bridgeMap, {
    format: options.reportFormat,
    verbose
  });
  
  if (verbose) {
    console.log('\n═══════════════════════════════════════');
    console.log('  WORKFLOW COMPLETE!');
    console.log('═══════════════════════════════════════');
  }
  
  return { bridgeMap, report, formatted };
}

/**
 * Download formatted report as text file
 */
export function downloadReport(content: string, filename: string): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadReport only works in browser environment');
  }
  
  const blob = new Blob([content], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  a.click();
  
  URL.revokeObjectURL(url);
}
