/**
 * TPG Bridge Storage
 * Save and load bridge maps
 */

import { BridgeMap } from './types';

/**
 * Save bridge map to localStorage (browser)
 */
export function saveBridgeMapLocal(bridgeMap: BridgeMap, key: string): void {
  if (typeof window === 'undefined') {
    throw new Error('saveBridgeMapLocal only works in browser environment');
  }
  
  const json = JSON.stringify(bridgeMap.toJSON(), null, 2);
  localStorage.setItem(`tpg_bridge_${key}`, json);
}

/**
 * Load bridge map from localStorage (browser)
 */
export function loadBridgeMapLocal(key: string): BridgeMap | null {
  if (typeof window === 'undefined') {
    throw new Error('loadBridgeMapLocal only works in browser environment');
  }
  
  const json = localStorage.getItem(`tpg_bridge_${key}`);
  if (!json) return null;
  
  try {
    const data = JSON.parse(json);
    return BridgeMap.fromJSON(data);
  } catch (error) {
    console.error('Failed to load bridge map:', error);
    return null;
  }
}

/**
 * Export bridge map as downloadable JSON file (browser)
 */
export function downloadBridgeMap(bridgeMap: BridgeMap, filename: string): void {
  if (typeof window === 'undefined') {
    throw new Error('downloadBridgeMap only works in browser environment');
  }
  
  const json = JSON.stringify(bridgeMap.toJSON(), null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  
  const a = document.createElement('a');
  a.href = url;
  a.download = filename.endsWith('.json') ? filename : `${filename}.json`;
  a.click();
  
  URL.revokeObjectURL(url);
}

/**
 * Load bridge map from uploaded file
 */
export async function loadBridgeMapFromFile(file: File): Promise<BridgeMap> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (e) => {
      try {
        const json = e.target?.result as string;
        const data = JSON.parse(json);
        const bridgeMap = BridgeMap.fromJSON(data);
        resolve(bridgeMap);
      } catch (error) {
        reject(new Error('Failed to parse bridge map file'));
      }
    };
    
    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };
    
    reader.readAsText(file);
  });
}

/**
 * List all saved bridge maps in localStorage
 */
export function listSavedBridgeMaps(): string[] {
  if (typeof window === 'undefined') {
    return [];
  }
  
  const keys: string[] = [];
  for (let i = 0; i < localStorage.length; i++) {
    const key = localStorage.key(i);
    if (key && key.startsWith('tpg_bridge_')) {
      keys.push(key.replace('tpg_bridge_', ''));
    }
  }
  
  return keys;
}

/**
 * Delete saved bridge map from localStorage
 */
export function deleteBridgeMapLocal(key: string): void {
  if (typeof window === 'undefined') {
    return;
  }
  
  localStorage.removeItem(`tpg_bridge_${key}`);
}
