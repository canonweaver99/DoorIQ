// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Fix for React 19 compatibility with Metro bundler
// Disables Metro's handling of package exports to avoid useRef/useState export issues
config.resolver.unstable_enablePackageExports = false;

module.exports = config;
