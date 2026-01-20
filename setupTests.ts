import '@testing-library/jest-dom';
import { vi, beforeEach, afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// ============================================
// Mock localStorage
// ============================================
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};
Object.defineProperty(window, 'localStorage', { value: localStorageMock });

// ============================================
// Mock matchMedia
// ============================================
Object.defineProperty(window, 'matchMedia', {
  writable: true,
  value: vi.fn().mockImplementation((query) => ({
    matches: false,
    media: query,
    onchange: null,
    addListener: vi.fn(),
    removeListener: vi.fn(),
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
    dispatchEvent: vi.fn(),
  })),
});

// ============================================
// Mock ResizeObserver
// ============================================
global.ResizeObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ============================================
// Mock IntersectionObserver
// ============================================
global.IntersectionObserver = vi.fn().mockImplementation(() => ({
  observe: vi.fn(),
  unobserve: vi.fn(),
  disconnect: vi.fn(),
}));

// ============================================
// Mock fetch
// ============================================
global.fetch = vi.fn();

// ============================================
// Mock scrollIntoView (used by StreamingSubmissionModal)
// ============================================
Element.prototype.scrollIntoView = vi.fn();

// ============================================
// Global test lifecycle hooks
// ============================================

// Reset all mocks before each test to ensure isolation
beforeEach(() => {
  vi.clearAllMocks();
  localStorageMock.getItem.mockReturnValue(null);
});

// Cleanup React Testing Library after each test
afterEach(() => {
  cleanup();
});

// ============================================
// Suppress console warnings/errors in tests (optional)
// ============================================
// Uncomment if you want to suppress console noise during tests
// const originalError = console.error;
// beforeAll(() => {
//   console.error = (...args) => {
//     if (args[0]?.includes?.('Warning:')) return;
//     originalError.call(console, ...args);
//   };
// });
// afterAll(() => {
//   console.error = originalError;
// });
