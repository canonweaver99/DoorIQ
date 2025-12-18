# Using Expo Go on iOS Simulator

## Quick Start

```bash
cd mobile
npx expo start --ios
```

This will:
1. Start Metro bundler
2. Automatically open iOS Simulator
3. Install/launch Expo Go if needed
4. Load your app

## If Simulator Doesn't Open Automatically

1. Open iOS Simulator manually: `open -a Simulator`
2. Start Expo: `npx expo start`
3. Press `i` in the terminal to open on iOS simulator

## If Expo Go Crashes

### Option 1: Reset Simulator
```bash
xcrun simctl shutdown all
xcrun simctl erase all
```

Then restart:
```bash
npx expo start --ios
```

### Option 2: Clear Expo Cache
```bash
cd mobile
rm -rf .expo
npx expo start --clear --ios
```

### Option 3: Reinstall Expo Go
In the simulator:
1. Delete Expo Go app
2. Run `npx expo start --ios` again (it will reinstall)

## Troubleshooting

**If you see "Unable to connect to Metro":**
- Make sure Metro bundler is running
- Check that your computer and simulator are on the same network
- Try restarting Metro: `npx expo start --clear`

**If app crashes on launch:**
- Check React Native version compatibility
- Try clearing cache: `rm -rf .expo node_modules/.cache`
- Restart simulator: `xcrun simctl shutdown all && xcrun simctl boot "iPhone 15 Pro"`

## That's It!

Expo Go should work fine with your current setup. The crash was likely just a cache issue.


