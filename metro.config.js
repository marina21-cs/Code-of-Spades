// Learn more: https://docs.expo.dev/guides/customizing-metro
const { getDefaultConfig } = require('expo/metro-config');

/** @type {import('expo/metro-config').MetroConfig} */
const config = getDefaultConfig(__dirname);

// --- expo-sqlite web support -------------------------------------------------
// On web, expo-sqlite runs on wa-sqlite (SQLite compiled to WebAssembly). Two
// things are required for the web bundle to build and run:
//   1. Metro must treat `.wasm` as a static asset so
//      `import wasmModule from './wa-sqlite/wa-sqlite.wasm'` resolves.
//   2. The dev server must send COOP/COEP headers so the SharedArrayBuffer the
//      wa-sqlite worker relies on is available in the browser.
// Native (Android/iOS) builds ignore this entirely and use the native SQLite.
config.resolver.assetExts.push('wasm');

config.server.enhanceMiddleware = (middleware) => {
  return (req, res, next) => {
    res.setHeader('Cross-Origin-Opener-Policy', 'same-origin');
    res.setHeader('Cross-Origin-Embedder-Policy', 'require-corp');
    return middleware(req, res, next);
  };
};

module.exports = config;
