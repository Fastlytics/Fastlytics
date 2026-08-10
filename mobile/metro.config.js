const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

const config = getDefaultConfig(__dirname);

// Watch the shared package as well
config.watchFolders = [path.resolve(__dirname, '../packages')];

// NOTE: disableHierarchicalLookup was previously set to true here, but that
// breaks resolution of nested node_modules deps (e.g.
// react-native-reanimated/node_modules/semver, pulled in by victory-native's
// web bundle) since Metro no longer walks up node_modules directories.
// config.resolver.disableHierarchicalLookup = true;

module.exports = config;
