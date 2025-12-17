# CRITICAL FIX: iOS Simulator Crash

## Root Cause
The crash is happening because:
1. **Version Mismatch**: `@expo/config-plugins` was v54 while Expo SDK is v53
2. **React Version Incompatibility**: React Native 0.76.5 requires React 18, but React 19 was installed
3. **Expo Go Limitations**: Expo Go doesn't fully support React Native 0.76.5
4. **Native Bridge Crash**: The crash happens at the C++ level before JavaScript can handle it

## Solution: Use Development Build Instead of Expo Go

Expo Go has limitations with newer React Native versions. You need to create a **development build**.

### Step 1: Fix Version Mismatches (Already Done)
The following have been fixed:
- `@expo/config-plugins`: v54 → v10.1.1 (matches Expo SDK 53)
- `react`: v19 → v18.2.0 (required by React Native 0.76.5)
- `react-dom`: v19 → v18.2.0 (required by React Native 0.76.5)
- Added `.npmrc` with `legacy-peer-deps=true` to handle peer dependency conflicts

### Step 2: Quick Setup (Recommended)
Use the automated setup script:

```bash
cd mobile
./scripts/setup-dev-build.sh
```

This will:
- Clean old build artifacts
- Install dependencies with correct versions
- Prebuild native iOS project
- Install CocoaPods dependencies

### Step 3: Build and Run
After setup completes:

```bash
# Option 1: Use Expo CLI (easiest)
npx expo run:ios

# Option 2: Use Xcode (more control)
open ios/DoorIQ.xcworkspace
# Then press ⌘R in Xcode to build and run
```

This will:
- Generate native iOS/Android projects
- Build a development version of your app
- Install it on the simulator
- Start Metro bundler

### Step 4: If Build Fails, Try This Alternative

If you get build errors, try:

```bash
cd mobile

# Clean everything
rm -rf ios android node_modules .expo
npm install

# Prebuild
npx expo prebuild

# Open in Xcode and build manually
open ios/DoorIQ.xcworkspace
```

Then in Xcode:
1. Select your simulator (iPhone 15 Pro, etc.)
2. Click Run (⌘R)
3. Wait for build to complete

## Why Development Build Instead of Expo Go?

- ✅ Full support for all React Native features
- ✅ No version limitations
- ✅ Better performance
- ✅ Can use custom native modules
- ✅ More stable with newer React Native versions

## Important Notes

- **React 18 Required**: React Native 0.76.5 requires React 18.2.0+, not React 19
- **Expo Go Limitation**: Even with correct versions, Expo Go may still have issues with React Native 0.76.5
- **Development Build Recommended**: For best compatibility, use a development build instead of Expo Go

## Quick Test After Fix

After running `npx expo run:ios`, the app should:
1. Build successfully
2. Install on simulator
3. Open automatically
4. Connect to Metro bundler
5. Run without crashing

## Still Having Issues?

1. **Check Xcode Version**: Make sure you have the latest Xcode
2. **Check iOS Simulator**: Try a different simulator (iPhone 14, iPhone 15, etc.)
3. **Check CocoaPods**: Run `cd ios && pod install` if needed
4. **Check System Requirements**: Ensure macOS and Xcode are up to date

## What Changed

- Fixed `@expo/config-plugins` version mismatch
- Added instructions for development build
- Provided alternative downgrade path

The development build approach is the recommended solution for React Native 0.76.5 + React 19 + Expo SDK 53.

