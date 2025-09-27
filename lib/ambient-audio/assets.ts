// Audio asset loading and caching system
// Preloads and manages ambient sound files

import { getAudioContext } from './mixer';

interface AudioAsset {
  buffer: AudioBuffer;
  url: string;
  loadedAt: number;
}

const assetCache = new Map<string, AudioAsset>();
const loadingPromises = new Map<string, Promise<AudioBuffer>>();

export async function preloadAudioAsset(key: string, url: string): Promise<void> {
  // Return early if already cached
  if (assetCache.has(key)) {
    return;
  }

  // Return existing loading promise if already in progress
  if (loadingPromises.has(key)) {
    await loadingPromises.get(key);
    return;
  }

  // Start loading
  const loadingPromise = loadAudioBuffer(url);
  loadingPromises.set(key, loadingPromise);

  try {
    const buffer = await loadingPromise;
    assetCache.set(key, {
      buffer,
      url,
      loadedAt: Date.now()
    });
    console.log(`✅ Loaded audio asset: ${key} (${buffer.duration.toFixed(1)}s)`);
  } catch (error) {
    console.error(`❌ Failed to load audio asset ${key}:`, error);
    throw error;
  } finally {
    loadingPromises.delete(key);
  }
}

async function loadAudioBuffer(url: string): Promise<AudioBuffer> {
  const audioContext = await getAudioContext();
  
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`HTTP ${response.status}: ${response.statusText}`);
  }
  
  const arrayBuffer = await response.arrayBuffer();
  return await audioContext.decodeAudioData(arrayBuffer);
}

export function getAudioBuffer(key: string): AudioBuffer | null {
  const asset = assetCache.get(key);
  return asset?.buffer || null;
}

export function isAssetLoaded(key: string): boolean {
  return assetCache.has(key);
}

export function getLoadedAssetKeys(): string[] {
  return Array.from(assetCache.keys());
}

// Preload multiple assets in parallel
export async function preloadMultipleAssets(assets: Record<string, string>): Promise<void> {
  const loadPromises = Object.entries(assets).map(([key, url]) => 
    preloadAudioAsset(key, url)
  );
  
  await Promise.all(loadPromises);
  console.log(`✅ Preloaded ${Object.keys(assets).length} audio assets`);
}

// Clear cache (useful for memory management)
export function clearAssetCache(): void {
  assetCache.clear();
  loadingPromises.clear();
  console.log('🗑️ Cleared audio asset cache');
}

// Get cache statistics
export function getCacheStats(): {
  totalAssets: number;
  totalSizeEstimate: string;
  oldestAsset: string | null;
} {
  const assets = Array.from(assetCache.values());
  const totalAssets = assets.length;
  
  // Rough size estimate (duration * sample rate * channels * bytes per sample)
  const totalSizeEstimate = assets.reduce((total, asset) => {
    return total + (asset.buffer.duration * asset.buffer.sampleRate * asset.buffer.numberOfChannels * 2);
  }, 0);
  
  const oldestAsset = assets.length > 0 
    ? Array.from(assetCache.entries()).sort((a, b) => a[1].loadedAt - b[1].loadedAt)[0][0]
    : null;

  return {
    totalAssets,
    totalSizeEstimate: `${(totalSizeEstimate / 1024 / 1024).toFixed(1)} MB`,
    oldestAsset
  };
}
