/**
 * Window interface extensions for global functions
 */

declare global {
  interface Window {
    loadDatabaseBuffer?: (buffer: ArrayBuffer) => Promise<void>;
  }
}

export {};
