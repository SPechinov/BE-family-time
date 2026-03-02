/**
 * Mock for DOMPurify to avoid jsdom dependency issues in tests
 */

export default {
  sanitize: (val: string) => val,
  addHook: () => {},
  isSupported: true,
};
