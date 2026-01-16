import { createSlice, PayloadAction } from '@reduxjs/toolkit';

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

interface SubjectsState {
  subjects: Subject[];
  currentSubject: Subject | null;
  categories: Category[];
  loading: boolean;
  error: string | null;
}

const initialState: SubjectsState = {
  subjects: [],
  currentSubject: null,
  categories: [],
  loading: false,
  error: null,
};

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
});

export const { setSubjects, setCurrentSubject, setCategories, setLoading, setError } = subjectsSlice.actions;
export default subjectsSlice.reducer;
