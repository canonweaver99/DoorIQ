# Voice Quality Troubleshooting Guide

## 🎙️ If Agent Voice Sounds Robotic or Distorted

The ElevenLabs agent voice quality can be affected by several factors. Here's how to fix it:

### 1. **Check ElevenLabs Agent Settings** (Most Important)

The voice quality is primarily controlled in the ElevenLabs dashboard:

1. Go to: https://elevenlabs.io/app/conversational-ai
2. Find your agent (Austin, Derek, Sarah, etc.)
3. Click **Edit Agent**
4. Go to **Voice Settings**:
   - **Voice Model**: Use `Eleven Turbo v2.5` or `Eleven Multilingual v2` (NOT v1)
   - **Stability**: 0.5-0.7 (too high = robotic, too low = variable)
   - **Similarity**: 0.75-0.85 (higher = more natural)
   - **Style Exaggeration**: 0.0-0.3 (lower = more natural)
   - **Speaker Boost**: ON (improves clarity)
5. **Save** changes

### 2. **Audio Quality in Code**

We've already optimized the code with:
```typescript
audio: {
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  sampleRate: 48000, // High quality
}
```

### 3. **Browser Settings**

**Chrome/Edge** (Recommended):
1. Go to `chrome://settings/content/microphone`
2. Ensure your microphone is allowed
3. Check "Automatic gain control" is enabled
4. Go to `chrome://flags/#automatic-tab-discarding`
5. Set to "Disabled" (prevents audio interruption)

**Firefox**:
1. Go to `about:preferences#privacy`
2. Under Permissions → Microphone, allow access
3. Firefox can have issues with WebRTC - Chrome is recommended

**Safari**:
- Safari has known WebRTC issues
- **Strongly recommend using Chrome instead**

### 4. **Network Issues**

Poor network can cause robotic voice:
- **Check your internet speed**: Need at least 5 Mbps download, 2 Mbps upload
- **Close other tabs/apps** using bandwidth
- **Use ethernet** instead of WiFi if possible
- **Disable VPN** temporarily (can cause latency)

### 5. **Microphone Quality**

Bad microphone = bad response quality:
- **Use a headset/headphones** with mic (prevents echo)
- **Don't use laptop built-in mic** if possible
- **Test your mic**: Visit https://webcammictest.com/
- Position mic 6-12 inches from mouth

### 6. **ElevenLabs Account Settings**

Check your ElevenLabs account:
1. Go to https://elevenlabs.io/app/settings
2. **Subscription**: Free tier has lower quality - consider upgrading
3. **API Quota**: If exceeded, quality degrades
4. **Latency Settings**: In agent config, set "Latency Optimized" mode

### 7. **Common Issues & Fixes**

| Issue | Cause | Fix |
|-------|-------|-----|
| Robotic/metallic | Voice stability too high | Reduce stability to 0.5-0.6 |
| Choppy/cutting out | Network issues | Check internet speed, close other apps |
| Echoey | No echo cancellation | Use headphones, enable echo cancellation |
| Very fast speech | Wrong voice model | Switch to Turbo v2.5 |
| Monotone | Similarity too low | Increase similarity to 0.8+ |
| Distorted | Microphone clipping | Lower mic input volume in system settings |

### 8. **Test Voice Quality**

After making changes:
1. **Test in ElevenLabs first**: Use the "Test" button in agent settings
2. **Then test in DoorIQ**: If it sounds good in ElevenLabs but bad in app, it's a code/network issue
3. **Compare browsers**: Try Chrome vs Firefox vs Safari

### 9. **Advanced: Check Console Logs**

Open browser console (F12) and look for:
```
❌ Bad signs:
- "WebRTC error"
- "Audio stream error"
- "Network connectivity issues"
- Latency > 200ms

✅ Good signs:
- "Connected to ElevenLabs"
- "Audio quality: high"
- Latency < 100ms
```

### 10. **Best Practices**

For optimal voice quality:
- ✅ Use **Chrome** browser
- ✅ Use **wired headphones** with mic
- ✅ **Close unnecessary tabs/apps**
- ✅ Use **stable internet** (ethernet preferred)
- ✅ Set ElevenLabs voice to **Turbo v2.5**
- ✅ Keep **stability at 0.5-0.6**
- ✅ Enable **speaker boost**
- ✅ Test in **quiet environment**

### 11. **If Nothing Works**

1. **Contact ElevenLabs support**: They can check if there's an issue with your specific agent
2. **Try a different agent**: Create a test agent with same voice to isolate issue
3. **Check ElevenLabs status**: https://status.elevenlabs.io/

---

## 🔧 Quick Fix Checklist

Run through this checklist:
- [ ] ElevenLabs voice model is **Turbo v2.5** or newer
- [ ] Stability is **0.5-0.7**
- [ ] Similarity is **0.75-0.85**
- [ ] Speaker boost is **ON**
- [ ] Using **Chrome** browser
- [ ] Using **headphones** (not speakers)
- [ ] Internet speed > **5 Mbps**
- [ ] No VPN active
- [ ] Microphone quality tested
- [ ] Other tabs/apps closed

---

## 📞 Still Having Issues?

If you've tried everything above and voice is still robotic:

1. **Check if it's the agent or the platform**:
   - Test the agent directly in ElevenLabs dashboard
   - If good there but bad in app → code/network issue
   - If bad in both → agent settings issue

2. **Share console logs**:
   - Open browser console (F12)
   - Record a short session
   - Copy any error messages
   - Share with support

3. **Try a different voice**:
   - Some voices work better than others
   - Recommended voices: Rachel, Josh, Adam, Bella
   - Avoid: Older v1 models

The most common fix is adjusting the **stability slider** in ElevenLabs to 0.5-0.6!
