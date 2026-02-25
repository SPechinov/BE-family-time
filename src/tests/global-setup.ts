/**
 * Jest global setup wrapper
 * Uses dynamic import to load setup with tsconfig-paths registered
 */
import tsConfigPaths from 'tsconfig-paths';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const rootDir = path.resolve(__dirname, '../..');

// Register tsconfig-paths to resolve @ aliases
tsConfigPaths.register({
  baseUrl: rootDir,
  paths: {
    '@/*': ['./src/*'],
  },
});

// Export setup and teardown functions
export default async function setup(): Promise<void> {
  const setupModule = await import('./setup.js');
  await setupModule.default();
}

export async function teardown(): Promise<void> {
  const setupModule = await import('./setup.js');
  await setupModule.teardown();
}
