import { createSlice, PayloadAction } from '@reduxjs/toolkit';

export interface Tag {
  _id: string;
  name: string;
  slug: string;
  type: string;
  language?: string;
  description?: string;
}

export interface Question {
  _id: string;
  title: string;
  description: string;
  sampleInput: string;
  sampleOutput: string;
  samples: { input: string; output: string; explanation?: string; fileAssets?: Record<string, string> }[];
  testCases: { input: string; output: string; type?: string; description?: string; fileAssets?: Record<string, string> }[];
  tags: Tag[];
  difficulty?: 'easy' | 'medium' | 'hard';
  constraints?: string;
  fileAssets?: Record<string, string>;
}

export interface HistoryItem {
  questionId: string;
  title: string;
  isCorrect: boolean;
  attemptedAt: string;
  code?: string;
}

interface QuestionsState {
  currentQuestion: Question | null;
  history: HistoryItem[];
  code: string;
  output: string;
  loading: boolean;
  executing: boolean;
  hint: string | null;
  isHintOpen: boolean;
  isCompleted: boolean;
  submissionLoading: boolean;
  submissionResult: {
    isCorrect: boolean;
    testResult: { passed: boolean; results: any[] };
    semanticResult: { passed: boolean; feedback: string };
  } | null;
}

const initialState: QuestionsState = {
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

const questionsSlice = createSlice({
  name: 'questions',
  initialState,
  reducers: {
    setCurrentQuestion: (state, action: PayloadAction<Question>) => {
      state.currentQuestion = action.payload;
    },
    setHistory: (state, action: PayloadAction<HistoryItem[]>) => {
      state.history = action.payload;
    },
    setCode: (state, action: PayloadAction<string>) => {
      state.code = action.payload;
    },
    setOutput: (state, action: PayloadAction<string>) => {
      state.output = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setExecuting: (state, action: PayloadAction<boolean>) => {
      state.executing = action.payload;
    },
    setHint: (state, action: PayloadAction<string | null>) => {
      state.hint = action.payload;
    },
    setIsHintOpen: (state, action: PayloadAction<boolean>) => {
      state.isHintOpen = action.payload;
    },
    setIsCompleted: (state, action: PayloadAction<boolean>) => {
      state.isCompleted = action.payload;
    },
    resetQuestion: (state) => {
      state.currentQuestion = null;
      state.code = '# write your code here\nprint("Hello World")';
      state.output = '';
      state.hint = null;
      state.isHintOpen = false;
      state.isCompleted = false;
      state.submissionResult = null;
      state.submissionLoading = false;
    },
    setSubmissionLoading: (state, action: PayloadAction<boolean>) => {
      state.submissionLoading = action.payload;
    },
    setSubmissionResult: (state, action: PayloadAction<any>) => {
      state.submissionResult = action.payload;
    },
  },
});

export const {
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
} = questionsSlice.actions;

export default questionsSlice.reducer;
