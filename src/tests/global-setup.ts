import setupFn, { teardown } from './setup.js';

export default async function setupGlobal(): Promise<void> {
  await setupFn();
}

export async function teardownGlobal(): Promise<void> {
  await teardown();
}
