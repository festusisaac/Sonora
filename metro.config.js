const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// Escape special regex characters
const escapeRegExp = (str) => str.replace(/[-\[\]{}()*+?.,\\^$|#\s]/g, '\\$&');

// Anchor precisely to root-level non-app directories so Metro's file watcher on Windows
// does not crawl thousands of files in android build caches, backend node_modules, or git history,
// while ensuring node_modules inside dependencies (e.g. memoize-one/dist) are NEVER blocked.
const rootParts = path.resolve(__dirname).split(path.sep);
const rootPattern = rootParts.map(escapeRegExp).join('[\\\\/]');
const rootDirs = ['android', 'sonora-ai-gateway', 'dist', 'docs', '\\.git'];

const rootBlockPattern = new RegExp(
  '^(?:' + rootDirs.map((d) => rootPattern + '[\\\\/]' + d + '(?:[\\\\/].*)?').join('|') + ')$'
);

config.resolver.blockList = [
  ...(Array.isArray(config.resolver.blockList) ? config.resolver.blockList : []),
  rootBlockPattern,
];

module.exports = config;
