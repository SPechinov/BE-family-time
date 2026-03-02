/**
 * Mock for DOMPurify to avoid jsdom dependency issues in tests
 */

const mockDOMPurify = {
  sanitize: (val: string) => val,
  addHook: () => {},
  isSupported: true,
};

export default mockDOMPurify;
