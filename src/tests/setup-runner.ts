import { default as setupFn, teardown as teardownFn } from './setup.js';

const action = process.argv[2];
if (action === 'teardown') {
  await teardownFn();
} else {
  await setupFn();
}
