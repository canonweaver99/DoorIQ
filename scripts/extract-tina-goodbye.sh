#!/bin/bash

# Script to extract 3.7 seconds from Tina saying goodbye video
# Usage: ./extract-tina-goodbye.sh <input_video> [start_time] [output_file]

INPUT_VIDEO="${1:-}"
START_TIME="${2:-0}"
OUTPUT_FILE="${3:-public/think-about-it-tina-closing-door.mp4}"

if [ -z "$INPUT_VIDEO" ]; then
    echo "Usage: $0 <input_video> [start_time] [output_file]"
    echo "Example: $0 'Tina saying goodbye.mp4' 0 public/think-about-it-tina-closing-door.mp4"
    echo ""
    echo "This script extracts 3.7 seconds from the input video starting at the specified time."
    exit 1
fi

if [ ! -f "$INPUT_VIDEO" ]; then
    echo "Error: Input video file not found: $INPUT_VIDEO"
    exit 1
fi

# Check if ffmpeg is installed
if ! command -v ffmpeg &> /dev/null; then
    echo "Error: ffmpeg is not installed."
    echo "Install it with: brew install ffmpeg"
    exit 1
fi

echo "Extracting 3.7 seconds from: $INPUT_VIDEO"
echo "Starting at: ${START_TIME}s"
echo "Output file: $OUTPUT_FILE"

# Extract 3.7 seconds of video
ffmpeg -i "$INPUT_VIDEO" -ss "$START_TIME" -t 3.7 -c:v libx264 -c:a aac -y "$OUTPUT_FILE"

if [ $? -eq 0 ]; then
    echo "✅ Successfully created: $OUTPUT_FILE"
else
    echo "❌ Error extracting video"
    exit 1
fi

