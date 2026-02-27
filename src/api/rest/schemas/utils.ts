import createDOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';

const window = new JSDOM('').window;
const DOMPurify = createDOMPurify(window);

export const isXss = (val: string): boolean => {
  const dangerousUriPatterns = [/javascript\s*:/i, /vbscript\s*:/i, /data\s*:/i];

  if (dangerousUriPatterns.some((pattern) => pattern.test(val))) {
    return false;
  }

  const sanitized = DOMPurify.sanitize(val, {
    ALLOWED_TAGS: [],
    ALLOWED_ATTR: [],
  });

  return val === sanitized;
};
