// Ambient sound effects for realism
export const ambientSounds = {
  dogBark: '/sounds/dog-bark-distant.mp3',
  kidNoise: '/sounds/kid-playing.mp3',
  doorbell: '/sounds/doorbell.mp3',
  tvBackground: '/sounds/tv-background.mp3',
  phoneRing: '/sounds/phone-ring.mp3',
} as const;

export type SoundEffect = keyof typeof ambientSounds;

// Scenario-specific sound mappings
export const scenarioSounds: Record<string, SoundEffect[]> = {
  dog_owner: ['dogBark'],
  nap_time: ['kidNoise'],
  busy_professional: ['phoneRing'],
  new_homeowner: ['tvBackground'],
  holiday_guests: ['doorbell', 'tvBackground'],
};

export function getRandomSoundForScenario(scenarioId: string): SoundEffect | null {
  const sounds = scenarioSounds[scenarioId];
  if (!sounds || sounds.length === 0) return null;
  
  // 25% chance to play a sound
  if (Math.random() > 0.25) return null;
  
  return sounds[Math.floor(Math.random() * sounds.length)];
}

export function playAmbientSound(sound: SoundEffect, volume: number = 0.15) {
  const audio = new Audio(ambientSounds[sound]);
  audio.volume = volume;
  audio.play().catch(err => console.log('Sound play failed:', err));
}
