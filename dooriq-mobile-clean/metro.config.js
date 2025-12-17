// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

// Set EXPO_ROUTER_APP_ROOT environment variable
process.env.EXPO_ROUTER_APP_ROOT = path.resolve(__dirname, './app');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for React 19 compatibility with Metro bundler
// Disables Metro's handling of package exports to avoid useRef/useState export issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
