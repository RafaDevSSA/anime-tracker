const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Required for expo-sqlite web: wa-sqlite uses WebAssembly
config.resolver.assetExts.push('wasm');

// Cross-origin isolation headers required for expo-sqlite on web.
// Without COOP/COEP, browsers do not release OPFS access handles when a
// Web Worker is replaced during hot reload, causing
// NoModificationAllowedError from AccessHandlePoolVFS.createSyncAccessHandle.
config.server = {
  ...config.server,
  enhanceMiddleware: (middleware) => {
    return (req, res, next) => {
      res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
      res.setHeader('Cross-Origin-Embedder-Policy', 'credentialless');
      middleware(req, res, next);
    };
  },
};

module.exports = config;
