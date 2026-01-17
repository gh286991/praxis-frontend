/**
 * API Module - Main Entry Point
 * 
 * This file re-exports everything from lib/api/index.ts
 * 
 * Usage:
 * 
 * Old way (still works):
 * import { getNextQuestion, runCode } from '@/lib/api';
 * 
 * New way (recommended):
 * import { questionsApi, executionApi } from '@/lib/api';
 * await questionsApi.getNext('category1');
 * await executionApi.run(code, input);
 */

// Re-export everything from the api/index.ts
export * from './api/index';

// Also export the apiClient if needed directly
export { default as apiClient } from './apiClient';

