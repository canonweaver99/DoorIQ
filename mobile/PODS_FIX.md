# Fixing ReactAppDependencyProvider CocoaPods Error

## Problem
CocoaPods can't find `ReactAppDependencyProvider` which is required by Expo SDK 53.

## Quick Fix

Run this command in the `mobile` directory:

```bash
cd mobile
./scripts/fix-pods.sh
```

Or manually:

```bash
cd mobile/ios

# Update CocoaPods repo
pod repo update

# Clean old pods
rm -rf Pods Podfile.lock

# Reinstall with repo update
pod install --repo-update
```

## If That Doesn't Work

### Option 1: Rebuild from Scratch
```bash
cd mobile

# Remove iOS folder completely
rm -rf ios

# Rebuild native project
npx expo prebuild --platform ios --clean

# Install pods
cd ios
pod install --repo-update
```

### Option 2: Check Expo Version
Make sure you're using the correct Expo SDK version:

```bash
cd mobile
npx expo --version
# Should show SDK 53.x.x
```

### Option 3: Update CocoaPods
```bash
sudo gem install cocoapods
pod --version
# Should be 1.15.0 or later
```

### Option 4: Clear Derived Data
```bash
# Clear Xcode derived data
rm -rf ~/Library/Developer/Xcode/DerivedData/*

# Then try pod install again
cd mobile/ios
pod install --repo-update
```

## Why This Happens

`ReactAppDependencyProvider` is a new dependency in React Native 0.76+ and Expo SDK 53. If your CocoaPods repo is out of date, it won't find the specification for this pod.

The `--repo-update` flag ensures CocoaPods fetches the latest pod specifications from the repository.

## Still Having Issues?

1. Check that `node_modules` is properly installed
2. Verify `package.json` has correct versions
3. Try `npx expo prebuild --clean` to regenerate native projects
4. Check Expo GitHub issues for known problems

