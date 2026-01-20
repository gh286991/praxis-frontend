import { describe, it, expect } from 'vitest';
import questionsReducer, {
  setCurrentQuestion,
  setHistory,
  setCode,
  setOutput,
  setLoading,
  setExecuting,
  setHint,
  setIsHintOpen,
  setIsCompleted,
  resetQuestion,
  setSubmissionLoading,
  setSubmissionResult,
  Question,
  HistoryItem,
} from './questionsSlice';

describe('questionsSlice', () => {
  const initialState = {
    currentQuestion: null,
    history: [],
    code: '# write your code here\nprint("Hello World")',
    output: '',
    loading: false,
    executing: false,
    hint: null,
    isHintOpen: false,
    isCompleted: false,
    submissionLoading: false,
    submissionResult: null,
  };

  const mockQuestion: Question = {
    _id: 'q1',
    title: 'Test Question',
    description: 'Test description',
    sampleInput: '1 2',
    sampleOutput: '3',
    samples: [{ input: '1 2', output: '3' }],
    testCases: [{ input: '1 2', output: '3' }],
    tags: [],
  };

  const mockHistoryItem: HistoryItem = {
    questionId: 'q1',
    title: 'Test Question',
    isCorrect: true,
    attemptedAt: '2024-01-01',
  };

  describe('initial state', () => {
    it('should return the initial state', () => {
      const state = questionsReducer(undefined, { type: 'unknown' });
      expect(state).toEqual(initialState);
    });
  });

  describe('setCurrentQuestion', () => {
    it('should set the current question', () => {
      const state = questionsReducer(initialState, setCurrentQuestion(mockQuestion));
      expect(state.currentQuestion).toEqual(mockQuestion);
    });
  });

  describe('setHistory', () => {
    it('should set the history array', () => {
      const history = [mockHistoryItem];
      const state = questionsReducer(initialState, setHistory(history));
      expect(state.history).toEqual(history);
    });
  });

  describe('setCode', () => {
    it('should set the code', () => {
      const code = 'print("test")';
      const state = questionsReducer(initialState, setCode(code));
      expect(state.code).toBe(code);
    });
  });

  describe('setOutput', () => {
    it('should set the output', () => {
      const output = 'test output';
      const state = questionsReducer(initialState, setOutput(output));
      expect(state.output).toBe(output);
    });
  });

  describe('setLoading', () => {
    it('should set loading to true', () => {
      const state = questionsReducer(initialState, setLoading(true));
      expect(state.loading).toBe(true);
    });

    it('should set loading to false', () => {
      const loadingState = { ...initialState, loading: true };
      const state = questionsReducer(loadingState, setLoading(false));
      expect(state.loading).toBe(false);
    });
  });

  describe('setExecuting', () => {
    it('should set executing state', () => {
      const state = questionsReducer(initialState, setExecuting(true));
      expect(state.executing).toBe(true);
    });
  });

  describe('setHint', () => {
    it('should set hint text', () => {
      const hint = 'Try using a loop';
      const state = questionsReducer(initialState, setHint(hint));
      expect(state.hint).toBe(hint);
    });

    it('should clear hint when set to null', () => {
      const hintState = { ...initialState, hint: 'some hint' };
      const state = questionsReducer(hintState, setHint(null));
      expect(state.hint).toBeNull();
    });
  });

  describe('setIsHintOpen', () => {
    it('should set isHintOpen state', () => {
      const state = questionsReducer(initialState, setIsHintOpen(true));
      expect(state.isHintOpen).toBe(true);
    });
  });

  describe('setIsCompleted', () => {
    it('should set isCompleted state', () => {
      const state = questionsReducer(initialState, setIsCompleted(true));
      expect(state.isCompleted).toBe(true);
    });
  });

  describe('setSubmissionLoading', () => {
    it('should set submissionLoading state', () => {
      const state = questionsReducer(initialState, setSubmissionLoading(true));
      expect(state.submissionLoading).toBe(true);
    });
  });

  describe('setSubmissionResult', () => {
    it('should set submission result', () => {
      const result = {
        isCorrect: true,
        testResult: { passed: true, results: [] },
        semanticResult: { passed: true, feedback: 'Good job!' },
      };
      const state = questionsReducer(initialState, setSubmissionResult(result));
      expect(state.submissionResult).toEqual(result);
    });
  });

  describe('resetQuestion', () => {
    it('should reset question state to initial values', () => {
      const modifiedState = {
        ...initialState,
        currentQuestion: mockQuestion,
        code: 'print("modified")',
        output: 'some output',
        hint: 'a hint',
        isHintOpen: true,
        isCompleted: true,
        submissionResult: { isCorrect: true, testResult: { passed: true, results: [] }, semanticResult: { passed: true, feedback: '' } },
        submissionLoading: true,
      };
      
      const state = questionsReducer(modifiedState, resetQuestion());
      
      expect(state.currentQuestion).toBeNull();
      expect(state.code).toBe('# write your code here\nprint("Hello World")');
      expect(state.output).toBe('');
      expect(state.hint).toBeNull();
      expect(state.isHintOpen).toBe(false);
      expect(state.isCompleted).toBe(false);
      expect(state.submissionResult).toBeNull();
      expect(state.submissionLoading).toBe(false);
    });

    it('should preserve history when resetting', () => {
      const stateWithHistory = {
        ...initialState,
        history: [mockHistoryItem],
        currentQuestion: mockQuestion,
      };
      
      const state = questionsReducer(stateWithHistory, resetQuestion());
      expect(state.history).toEqual([mockHistoryItem]);
    });
  });
});
