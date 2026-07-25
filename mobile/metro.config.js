const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the shared package as well
config.watchFolders = [path.resolve(__dirname, '../packages')];

// Let Metro resolve symlinks
config.resolver.disableHierarchicalLookup = true;

module.exports = config;
