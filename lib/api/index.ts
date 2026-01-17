/**
 * API Module - Organized by Feature
 * 
 * This is the main entry point for all API calls.
 * Each feature is organized in its own file for better maintainability.
 * 
 * Structure:
 * - lib/apiClient.ts - Base axios instance with interceptors
 * - lib/api/questions.ts - Question-related APIs
 * - lib/api/execution.ts - Code execution APIs
 * - lib/api/subjects.ts - Subject and category APIs
 * - lib/api/stats.ts - Statistics APIs
 * - lib/api/users.ts - User profile APIs
 * - lib/api/index.ts - This file, exports everything
 */

// Import all API modules
import { questionsApi } from './questions';
import { executionApi } from './execution';
import { subjectsApi, categoriesApi } from './subjects';
import { statsApi } from './stats';
import { usersApi } from './users';

// Export all API modules
export { questionsApi } from './questions';
export { executionApi } from './execution';
export { subjectsApi, categoriesApi } from './subjects';
export { statsApi } from './stats';
export { usersApi } from './users';

// ====================
// Backward Compatibility Exports
// ====================
// These allow existing code to continue working without changes

// Questions
export const getNextQuestion = questionsApi.getNext;
export const submitAnswer = questionsApi.submitAnswer;
export const getHint = questionsApi.getHint;
export const getHistory = questionsApi.getHistory;
export const getQuestionById = questionsApi.getById;

// Execution
export const runCode = executionApi.run;
export const evaluateSubmission = executionApi.submit;

// Subjects
export const getSubjects = subjectsApi.getAll;
export const getSubjectBySlug = subjectsApi.getBySlug;
export const getCategoriesBySubject = categoriesApi.getBySubject;

// Stats
export const getAllStats = statsApi.getAll;
export const getSubjectStats = statsApi.getSubject;
export const getPlatformStats = statsApi.getPlatform;

// ====================
// New Recommended Usage
// ====================
// For new code, use the modular API objects:
//
// import { questionsApi, executionApi, statsApi } from '@/lib/api';
//
// const question = await questionsApi.getNext('category1');
// const result = await executionApi.run(code, input);
// const stats = await statsApi.getAll();

