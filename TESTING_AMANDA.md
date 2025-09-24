# Amanda Testing Guide

## Quick Testing Commands

To test Amanda's new natural behavior, run:

```bash
npm run dev
# Navigate to /trainer?autostart=1
```

## Testing Checklist

### ✅ Core Behavior Tests

1. **Interrupt Amanda mid-word** → TTS stops immediately; she yields with "Oh—sorry, you go ahead."
2. **Amanda never talks >2 sentences** → Responses are snappy and neighborly (5-12 words typically)
3. **Rapport comes before business every time** → She asks about you before letting you pitch
4. **Rep friendliness response** → If rep is friendly, Amanda warms up; if pushy, she becomes cautious (shorter replies)
5. **No company/pricing/scheduling** → Amanda never mentions these unless the rep brings them up first

### ✅ Technical Tests

6. **Zero overlapping audio** → When you start speaking, Amanda's audio stops instantly
7. **Natural fillers** → At least one "uh," "honestly," "you know," "really?" every 3-5 turns
8. **Barge-in responsiveness** → Test interrupting during different parts of her speech
9. **VAD sensitivity** → Adjust `silence_duration_ms` in session settings if needed

## VAD Tuning Notes

If Amanda still barges in or doesn't respond properly:

**Current VAD Settings:**
- `threshold: 0.62` (higher = less sensitive)
- `prefix_padding_ms: 180` (capture before speech starts)  
- `silence_duration_ms: 320` (how long to wait for silence)

**Adjustments:**
- **Amanda interrupts too much** → Increase `silence_duration_ms` to 360-400
- **Amanda doesn't respond** → Decrease `threshold` to 0.55-0.60
- **Delayed responses** → Decrease `silence_duration_ms` to 280-300

## Character Consistency Tests

### ✅ Personality Checks

- **Greeting Phase:** "Hi there—can I help you?" (friendly but uncertain)
- **Rapport Building:** Asks about weather, neighborhood, rep's day before business
- **Small Life Details:** May mention kids, dog, errands naturally
- **Business Transition:** Only after rapport is established
- **Natural Reactions:** "Oh wow," "Really?" "Gotcha," "Honestly"

### ✅ Boundary Tests

- Never pitches services herself
- Never acts like a professional
- Asks clarifying questions instead of making assumptions
- References previous conversation details appropriately

## Response Quality Tests

### ✅ Turn Length Validation

- Average response: 6-10 words
- Maximum: 2 sentences
- Natural punctuation added automatically
- Trailing spaces removed

### ✅ Context Memory

- References rep's name if shared
- Recalls area/neighborhood mentions  
- Light callbacks to kids/dog mentions
- No excessive memory dumping

## Troubleshooting

### Amanda talks too long
- Check `max_response_output_tokens: 80` in session settings
- Verify `tidyForTTS()` is limiting to 2 sentences

### Barge-in not working
- Check `stopTTS()` is called on `input_audio_transcription.partial`
- Verify `playTTS()`/`stopTTS()` global audio element setup
- Test with different `silence_duration_ms` values

### Apology system too aggressive
- Adjust timing window in `maybeYieldLine()` (currently 1.2 seconds)
- Check `markSpoke()` is called when Amanda starts speaking

### Personality inconsistency
- Verify `scenarioInstructions` import in useRealtimeSession.ts
- Check session.update payload includes new instructions
- Ensure temperature is 0.65 for consistent personality

## Development Commands

```bash
# Start development server
npm run dev

# Auto-start trainer session
open http://localhost:3000/trainer?autostart=1

# Check console for TTS/VAD events
# Look for: "User started speaking", "Audio playback started", "Interruption detected"
```

---

**Target Metrics:**
- Response time: <500ms after user stops speaking
- Interruption response: <200ms to stop TTS
- Average turn length: 6-10 words  
- Natural filler frequency: ~20% of turns
- Apology accuracy: Only when actually interrupted within 1.2s

