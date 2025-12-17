// Learn more https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Explicitly set project root to ensure proper module resolution
config.projectRoot = __dirname;
config.watchFolders = [__dirname];

// Ensure proper module resolution
config.resolver.sourceExts.push('cjs');
config.resolver.nodeModulesPaths = [
  path.resolve(__dirname, 'node_modules'),
];

module.exports = config;

