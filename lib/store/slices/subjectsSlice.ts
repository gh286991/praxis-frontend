import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { getAllStats, getSubjectStats } from '../../api';

export interface Subject {
  _id: string;
  name: string;
  slug: string;
  description: string;
  language: string;
  icon: string;
  color: string;
  isActive: boolean;
}

export interface Category {
  _id: string;
  name: string;
  slug: string;
  description: string;
  order: number;
  subjectId: string;
}

export interface ProgressStats {
  totalQuestions: number;
  completedQuestions: number;
  passedQuestions: number;
  failedQuestions: number;
  completionRate: number;
  passRate: number;
}

export interface CategoryStats extends ProgressStats {
  categoryId: string;
  categoryName: string;
  categorySlug: string;
}

export interface SubjectStats extends ProgressStats {
  subjectId: string;
  subjectName: string;
  subjectSlug: string;
  categories: CategoryStats[];
}

interface SubjectsState {
  subjects: Subject[];
  currentSubject: Subject | null;
  categories: Category[];
  stats: SubjectStats[];
  currentSubjectStats: SubjectStats | null;
  loading: boolean;
  error: string | null;
}

const initialState: SubjectsState = {
  subjects: [],
  currentSubject: null,
  categories: [],
  stats: [],
  currentSubjectStats: null,
  loading: false,
  error: null,
};

export const fetchAllStats = createAsyncThunk(
  'subjects/fetchAllStats',
  async () => {
    const response = await getAllStats();
    return response;
  }
);

export const fetchSubjectStats = createAsyncThunk(
  'subjects/fetchSubjectStats',
  async (slug: string) => {
    const response = await getSubjectStats(slug);
    return response;
  }
);

const subjectsSlice = createSlice({
  name: 'subjects',
  initialState,
  reducers: {
    setSubjects: (state, action: PayloadAction<Subject[]>) => {
      state.subjects = action.payload;
    },
    setCurrentSubject: (state, action: PayloadAction<Subject>) => {
      state.currentSubject = action.payload;
    },
    setCategories: (state, action: PayloadAction<Category[]>) => {
      state.categories = action.payload;
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload;
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchAllStats.fulfilled, (state, action) => {
        state.stats = action.payload;
      })
      .addCase(fetchSubjectStats.fulfilled, (state, action) => {
        state.currentSubjectStats = action.payload;
      });
  },
});

export const { setSubjects, setCurrentSubject, setCategories, setLoading, setError } = subjectsSlice.actions;
export default subjectsSlice.reducer;

