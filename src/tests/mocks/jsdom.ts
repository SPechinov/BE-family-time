/**
 * Mock for jsdom to avoid ES module issues in tests
 */

// Mock JSDOM class
export class JSDOM {
  window = {
    document: {
      documentElement: {},
    },
    navigator: {},
  };

  constructor() {}
}

export default JSDOM;
