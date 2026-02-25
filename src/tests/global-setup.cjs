/**
 * Jest global setup wrapper - uses tsx for ESM TypeScript support
 * Registers tsconfig-paths before running actual setup
 */

const path = require('path');
const { register } = require('tsconfig-paths');

const rootDir = path.resolve(__dirname, '../..');

// Register tsconfig-paths to resolve @ aliases
register({
  baseUrl: rootDir,
  paths: {
    '@/*': ['./src/*'],
  },
});

// Setup function using tsx to transpile TypeScript
module.exports = async function setup() {
  // Use tsx/esm loader via NODE_OPTIONS
  const { execSync } = require('child_process');
  
  // Run setup using tsx
  const setupScript = path.join(__dirname, 'setup-runner.ts');
  const fs = require('fs');
  
  // Create a temporary setup runner script
  const runnerCode = `
    import { default as setupFn, teardown as teardownFn } from './setup.ts';
    
    const action = process.argv[2];
    if (action === 'teardown') {
      await teardownFn();
    } else {
      await setupFn();
    }
  `;
  
  fs.writeFileSync(setupScript, runnerCode);
  
  try {
    execSync(`npx tsx ${setupScript}`, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--import tsx/esm' }
    });
  } finally {
    fs.unlinkSync(setupScript);
  }
};

module.exports.teardown = async function teardown() {
  const { execSync } = require('child_process');
  const path = require('path');
  
  const setupScript = path.join(__dirname, 'setup-runner.ts');
  const fs = require('fs');
  
  const runnerCode = `
    import { default as setupFn, teardown as teardownFn } from './setup.ts';
    await teardownFn();
  `;
  
  fs.writeFileSync(setupScript, runnerCode);
  
  try {
    execSync(`npx tsx ${setupScript} teardown`, { 
      stdio: 'inherit',
      env: { ...process.env, NODE_OPTIONS: '--import tsx/esm' }
    });
  } finally {
    fs.unlinkSync(setupScript);
  }
};
