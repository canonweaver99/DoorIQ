# Extract Tina Closing Door Video

## Video Files Found
- Source: `/Users/canonweaver/Downloads/Tina saying goodbye.mp4`
- Loop video: `/Users/canonweaver/Downloads/Tina loop.mp4` (already copied to public/)

## Extract 3.7 Seconds

To extract 3.7 seconds from the goodbye video, you need to install ffmpeg first (if not already installed):

```bash
brew install ffmpeg
```

Then run the extraction script:

```bash
cd /Users/canonweaver/DoorIQ
./scripts/extract-tina-goodbye.sh "/Users/canonweaver/Downloads/Tina saying goodbye.mp4" 0 public/think-about-it-tina-closing-door.mp4
```

Or manually with ffmpeg:

```bash
ffmpeg -i "/Users/canonweaver/Downloads/Tina saying goodbye.mp4" -ss 0 -t 3.7 -c:v libx264 -c:a aac -y public/think-about-it-tina-closing-door.mp4
```

**Note:** Adjust the `-ss 0` parameter if you want to start from a different time in the video. For example:
- `-ss 0` starts from the beginning
- `-ss 2` starts 2 seconds into the video
- `-ss 5` starts 5 seconds into the video

The `-t 3.7` parameter extracts exactly 3.7 seconds from the start time.

## Code Integration

The code has been updated to support Tina's closing door animation:
- ✅ Added Tina to `agentHasVideos()` function
- ✅ Added Tina's video paths to `getAgentVideoPaths()` function
- ✅ Loop video copied to `public/think-about-it-tina-loop.mp4`

Once you extract the closing door video, it will automatically be used when a session ends with Tina.

