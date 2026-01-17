// Backward compatibility - export all the old API functions
// This allows existing code to continue working while we migrate

import { questionsApi, executionApi, subjectsApi, statsApi } from './api';

// Re-export individual functions for backward compatibility
export const getNextQuestion = questionsApi.getNext;
export const submitAnswer = questionsApi.submitAnswer;
export const getHint = questionsApi.getHint;
export const getHistory = questionsApi.getHistory;

export const runCode = executionApi.run;
export const evaluateSubmission = executionApi.submit;

export const getSubjects = subjectsApi.getAll;
export const getSubjectBySlug = subjectsApi.getBySlug;

export const getAllStats = statsApi.getAll;
export const getSubjectStats = statsApi.getSubject;
export const getPlatformStats = statsApi.getPlatform;

// Also export the new modular API
export * from './api';
