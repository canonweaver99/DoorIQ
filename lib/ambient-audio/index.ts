// Ambient Audio System - Main exports
export { createAudioBuses, getAudioContext, isVoiceActive, smoothVolumeTransition } from './mixer';
export type { AudioBuses } from './mixer';

export { preloadAudioAsset, preloadMultipleAssets, getAudioBuffer, isAssetLoaded, getLoadedAssetKeys, clearAssetCache, getCacheStats } from './assets';

export { EnhancedVAD, createSimpleVAD } from './vad';
export type { VADOptions } from './vad';

export { playOneShot, playLoop, playSequence, crossfade, stopAllOnBus } from './playback';
export type { PlaybackOptions, PlaybackControl } from './playback';

export { AudioDucker, startSimpleDucking } from './duck';
export type { DuckingOptions } from './duck';

export { SmartSfxScheduler, createDoorToDoorScheduler } from './scheduler';
export type { SchedulerOptions, ConversationPhase } from './scheduler';

export { createElevenLabsIntegration, ElevenLabsWebRTCAudioHook, ElevenLabsAudioElementHook } from './elevenlabs-integration';
export type { ElevenLabsIntegration } from './elevenlabs-integration';
