/**
 * Mock for DOMPurify - must be a function that returns the API
 */

const mockDOMPurify = {
  sanitize: (val: string) => val,
  addHook: () => {},
  isSupported: true,
};

// Export as default function that returns the mock API
export default function createDOMPurify() {
  return mockDOMPurify;
}
