import '@testing-library/jest-dom';

// Polyfill: react-three-fiber / react-use-measure dependen de ResizeObserver.
// En JSDOM no existe por defecto.
if (typeof (globalThis as any).ResizeObserver === "undefined") {
  class ResizeObserver {
    observe() {}
    unobserve() {}
    disconnect() {}
  }
  (globalThis as any).ResizeObserver = ResizeObserver;
}
