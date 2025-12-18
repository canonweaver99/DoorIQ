# iOS Simulator Crash Fix Guide

## Problem
The app crashes with `RCTFatal` error related to `RCTJSThreadManager` and `RCTMessageThread`. This is a React Native bridge initialization error.

## Quick Fix Steps

### 1. Clear All Caches
Run these commands in the `mobile` directory:

```bash
cd mobile

# Clear Expo cache
npx expo start --clear

# Or if that doesn't work, clear everything:
rm -rf node_modules
rm -rf .expo
rm -rf ios/build
rm -rf ios/Pods
rm -rf ios/Podfile.lock
npm install
```

### 2. Reset iOS Simulator
```bash
# Reset the simulator
xcrun simctl erase all

# Or reset specific simulator
xcrun simctl erase "iPhone 15 Pro"
```

### 3. Clean Build in Xcode (if using development build)
```bash
# Open Xcode
open ios/DoorIQ.xcworkspace

# In Xcode: Product > Clean Build Folder (Shift+Cmd+K)
# Then rebuild: Product > Build (Cmd+B)
```

### 4. Restart Metro Bundler
```bash
# Kill any running Metro processes
killall node

# Start fresh
cd mobile
npx expo start --clear
```

### 5. Reinstall Expo Go App
- Delete Expo Go from your iOS Simulator
- Reinstall from App Store or via `expo start` (it will prompt to install)

## If Still Not Working

### Check React Native Version Compatibility
The app uses:
- React Native 0.76.5 (very new)
- React 19.0.0 (very new)
- Expo SDK 53

These versions are cutting-edge and may have compatibility issues. Consider:

1. **Downgrade React** (if issues persist):
```bash
npm install react@18.3.1 react-dom@18.3.1
```

2. **Use Development Build Instead of Expo Go**:
   - Expo Go has limitations with newer React Native versions
   - Create a development build: `npx expo run:ios`

### Alternative: Use Development Build
```bash
cd mobile
npx expo prebuild
npx expo run:ios
```

This creates a native build that's more stable than Expo Go.

## What We Fixed

1. **Added SafeInitWrapper** - Prevents bridge crashes during initialization
2. **Enhanced ErrorBoundary** - Better handling of bridge errors
3. **Global Error Handler** - Catches and recovers from bridge errors

## Prevention

The code now includes:
- Safe initialization wrapper (`lib/safeInit.tsx`)
- Bridge error detection and recovery
- Better error logging

If crashes persist, the app will now show an error screen instead of completely crashing.

## Still Having Issues?

1. Check Expo Go version matches your Expo SDK version
2. Try a different iOS Simulator (iPhone 14, iPhone 15, etc.)
3. Update Xcode to latest version
4. Check for macOS/iOS compatibility issues


