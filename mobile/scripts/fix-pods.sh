#!/bin/bash

# Script to fix CocoaPods issues with ReactAppDependencyProvider

set -e

echo "🔧 Fixing CocoaPods dependencies..."
echo ""

cd "$(dirname "$0")/.."

# Step 1: Update CocoaPods repo
echo "📦 Step 1: Updating CocoaPods repository..."
pod repo update
echo "✅ CocoaPods repo updated"
echo ""

# Step 2: Clean iOS build artifacts
if [ -d "ios" ]; then
  echo "🧹 Step 2: Cleaning iOS build artifacts..."
  cd ios
  rm -rf Pods
  rm -rf Podfile.lock
  rm -rf build
  rm -rf ~/Library/Developer/Xcode/DerivedData/*
  echo "✅ Clean complete"
  echo ""
  cd ..
fi

# Step 3: Reinstall pods with repo update
if [ -d "ios" ]; then
  echo "🍎 Step 3: Installing CocoaPods dependencies..."
  cd ios
  pod install --repo-update
  echo "✅ Pods installed"
  echo ""
  cd ..
fi

echo "✅ CocoaPods fix complete!"
echo ""
echo "If you still see errors, try:"
echo "1. cd ios && pod deintegrate && pod install --repo-update"
echo "2. Or run: npx expo prebuild --clean"
echo ""

