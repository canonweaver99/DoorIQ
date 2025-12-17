#!/bin/bash

# Script to clear all caches and reset the iOS development environment
# Run this when experiencing React Native bridge crashes or other issues

echo "🧹 Clearing all caches and resetting environment..."

cd "$(dirname "$0")/.."

# Clear Expo cache
echo "📦 Clearing Expo cache..."
rm -rf .expo
rm -rf node_modules/.cache

# Clear Metro bundler cache
echo "🚇 Clearing Metro bundler cache..."
rm -rf $TMPDIR/metro-*
rm -rf $TMPDIR/haste-*

# Clear iOS build artifacts (if exists)
if [ -d "ios" ]; then
  echo "🍎 Clearing iOS build artifacts..."
  rm -rf ios/build
  rm -rf ios/Pods
  rm -rf ios/Podfile.lock
  rm -rf ios/*.xcworkspace/xcuserdata
  rm -rf ios/*.xcodeproj/xcuserdata
fi

# Clear watchman cache (if installed)
if command -v watchman &> /dev/null; then
  echo "👀 Clearing Watchman cache..."
  watchman watch-del-all 2>/dev/null || true
fi

# Clear npm cache
echo "📚 Clearing npm cache..."
npm cache clean --force 2>/dev/null || true

echo ""
echo "✅ Cache clearing complete!"
echo ""
echo "Next steps:"
echo "1. Run: npm install"
echo "2. Run: npx expo start --clear"
echo "3. If using iOS Simulator, reset it: xcrun simctl erase all"
echo ""

