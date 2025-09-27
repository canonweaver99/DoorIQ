# Ambient Audio System

This directory contains sound files for the intelligent ambient audio system that adds realistic background sounds to conversations with Austin.

## System Overview

The ambient audio system automatically:
- 🎵 Plays looping background ambience (suburban neighborhood sounds)
- 🐕 Schedules random sound effects (dog barks, distant activity) using smart timing
- 🔇 Ducks SFX volume automatically when Austin is speaking (voice activity detection)
- 🎛️ Routes all audio through separate buses for precise control

## Current Files

- `knock.mp3` - Door knock sound when starting conversation
- `door_open.mp3` - Door opening sound effect

## Recommended Additional Files

### Background Ambience (Looping)
- `kids-background.mp3` - Kids playing outside (loopable)
- `suburban-ambience.mp3` - Base suburban neighborhood loop (birds, distant traffic, slight wind)
- `suburban-quiet.mp3` - Very quiet suburban background for sensitive conversations

### Random SFX (Scheduled automatically)
- `dog-bark-distant-1.mp3` - Distant dog bark variation 1
- `dog-bark-distant-2.mp3` - Distant dog bark variation 2  
- `dog-bark-distant-3.mp3` - Distant dog bark variation 3
- `lawn-mower-distant.mp3` - Distant lawn mower passing
- `car-passing.mp3` - Car driving by on street
- `kids-playing-distant.mp3` - Distant children playing
- `wind-light.mp3` - Light wind through trees

### Household Context SFX
- `tv-murmur.mp3` - Muffled TV sounds from inside house
- `phone-ring-inside.mp3` - Phone ringing inside the house
- `doorbell-faint.mp3` - Doorbell from another house
- `door_close.mp3` - Standard door closing
- `door_slam.mp3` - Door slamming
- `door_open_alt.mp3` - Alternate door opening

## Audio Requirements

- **Format**: MP3 for broad browser compatibility
- **Duration**: 
  - Ambience: 30-60+ seconds (seamless loops)
  - SFX: 1-5 seconds (natural one-shots)
- **Volume**: Recorded at moderate levels (system handles volume control)
- **Quality**: 44.1kHz/16-bit or higher
- **Licensing**: Royalty-free or properly licensed

## Integration

Files are automatically loaded by the `useAmbientAudio` hook:

```typescript
const [ambientState, ambientControls] = useAmbientAudio({
  assets: {
    ambience: {
      suburban: '/sounds/suburban-ambience.mp3'
    },
    sfx: {
      dogBark1: '/sounds/dog-bark-distant-1.mp3',
      dogBark2: '/sounds/dog-bark-distant-2.mp3',
      lawnMower: '/sounds/lawn-mower-distant.mp3'
    }
  },
  // ... other config
});
```

The system automatically handles:
- ✅ Asset preloading and caching
- ✅ Smart scheduling based on conversation context
- ✅ Voice activity detection to avoid interrupting speech
- ✅ Smooth volume ducking and crossfades
