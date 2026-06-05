const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Permite que o Metro resolva arquivos .wasm (necessário para expo-sqlite na web)
config.resolver.assetExts.push('wasm');

module.exports = config;
