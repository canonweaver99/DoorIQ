# Quick Fix for Expo Go

If Expo Go was working before and now it's crashing, try these simple steps:

## 1. Clear Cache and Restart

```bash
cd mobile
rm -rf .expo
npx expo start --clear
```

## 2. Reset iOS Simulator

```bash
xcrun simctl shutdown all
xcrun simctl erase all
```

Then restart Expo Go in the simulator.

## 3. If Still Crashing

The crash might be from React Native 0.76.5 + React 19 compatibility. Try:

```bash
cd mobile
npm install react@18.3.1 react-dom@18.3.1 --legacy-peer-deps
npx expo start --clear
```

That's it. No need for development builds or complex setup.


