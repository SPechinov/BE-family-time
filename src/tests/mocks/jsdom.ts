/**
 * Mock for JSDOM to avoid ES module issues in tests
 */

export class JSDOM {
  window: any;
  constructor() {
    this.window = {
      document: {
        documentElement: {},
      },
      navigator: {},
    };
  }
}

export default JSDOM;
