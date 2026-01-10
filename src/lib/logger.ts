export const logger = {
  info: (...args: unknown[]) => {
    if (__DEV__) {
      console.log('[Keepster]', ...args);
    }
  },
  warn: (...args: unknown[]) => {
    if (__DEV__) {
      console.warn('[Keepster]', ...args);
    }
  },
  error: (...args: unknown[]) => {
    if (__DEV__) {
      console.error('[Keepster]', ...args);
    }
  },
};
