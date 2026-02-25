/**
 * Jest bootstrap file - runs before Jest starts
 * Registers tsconfig-paths for module resolution
 */

import tsConfigPaths from 'tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '..');

// Register tsconfig-paths to resolve @ aliases
tsConfigPaths.register({
  baseUrl: rootDir,
  paths: {
    '@/*': ['./src/*'],
  },
});
