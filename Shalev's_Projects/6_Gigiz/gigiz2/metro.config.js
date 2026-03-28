const { getDefaultConfig } = require('expo/metro-config');
const path = require('path');
const fs = require('fs');

const config = getDefaultConfig(__dirname);
const root = __dirname;

// Fix @/ path alias
const originalResolveRequest = config.resolver.resolveRequest;
config.resolver.resolveRequest = (context, moduleName, platform) => {
  if (moduleName.startsWith('@/')) {
    const relativePath = moduleName.replace('@/', '');
    const extensions = ['ts', 'tsx', 'js', 'jsx'];
    for (const ext of extensions) {
      const fullPath = path.resolve(root, `${relativePath}.${ext}`);
      if (fs.existsSync(fullPath)) {
        return { filePath: fullPath, type: 'sourceFile' };
      }
    }
    for (const ext of extensions) {
      const fullPath = path.resolve(root, relativePath, `index.${ext}`);
      if (fs.existsSync(fullPath)) {
        return { filePath: fullPath, type: 'sourceFile' };
      }
    }
  }
  if (originalResolveRequest) {
    return originalResolveRequest(context, moduleName, platform);
  }
  return context.resolveRequest(context, moduleName, platform);
};

module.exports = config;
