import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor, act } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SubjectDetailPage from './page';
import React from 'react';

// Mock mocks
const mockPush = vi.fn();
const mockDispatch = vi.fn();
const mockUseAppSelector = vi.fn();

// Mock Imports
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
  }),
}));

vi.mock('@/lib/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: any) => mockUseAppSelector(selector),
}));

vi.mock('@/lib/store/slices/subjectsSlice', () => ({
  setCurrentSubject: vi.fn((data) => ({ type: 'subjects/setCurrentSubject', payload: data })),
  setCategories: vi.fn((data) => ({ type: 'subjects/setCategories', payload: data })),
  setLoading: vi.fn((data) => ({ type: 'subjects/setLoading', payload: data })),
  fetchSubjectStats: vi.fn((slug) => ({ type: 'subjects/fetchSubjectStats', payload: slug })),
  setError: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getSubjectBySlug: vi.fn(),
  getCategoriesBySubject: vi.fn(),
  subjectsApi: {
    importMockExam: vi.fn(),
  },
}));

// Mock Components
vi.mock('@/components/landing/Footer', () => ({
  Footer: () => <div data-testid="footer">Footer</div>,
}));

vi.mock('@/components/CyberpunkBackground', () => ({
  CyberpunkBackground: () => <div data-testid="cyberpunk-bg">Background</div>,
}));

vi.mock('@/components/TerminalWindow', () => ({
  TerminalWindow: ({ title, children }: any) => (
    <div data-testid="terminal-window">
      <div>{title}</div>
      {children}
    </div>
  ),
}));

vi.mock('@/components/AppNavbar', () => ({
  AppNavbar: () => <div data-testid="app-navbar">Navbar</div>,
}));

// Mock API implementations for tests
import { getSubjectBySlug, getCategoriesBySubject, subjectsApi } from '@/lib/api';

describe('SubjectDetailPage', () => {
  const mockSubject = {
    _id: 'sub123',
    slug: 'python',
    name: 'Python Programming',
  };

  const mockChapters = [
    { _id: 'c1', name: 'Chapter 1', slug: 'ch1', type: 'CHAPTER' },
    { _id: 'c2', name: 'Chapter 2', slug: 'ch2', type: undefined }, // Should be treated as chapter
  ];

  const mockExams = [
    { _id: 'e1', name: 'Exam 1', slug: 'ex1', type: 'EXAM', duration: 60 },
  ];

  const mockStats = {
    completedQuestions: 5,
    totalQuestions: 10,
  };

  const defaultState = {
    currentSubject: null,
    categories: [],
    loading: false,
    currentSubjectStats: null,
  };

  beforeEach(() => {
    vi.clearAllMocks();
    
    // Setup default Redux state
    mockUseAppSelector.mockImplementation((selector) => {
      return selector({
        subjects: defaultState
      });
    });

    // Setup success API responses
    (getSubjectBySlug as any).mockResolvedValue(mockSubject);
    (getCategoriesBySubject as any).mockResolvedValue([...mockChapters, ...mockExams]);
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  const renderPage = async () => {
    // Mock params strictly as a Promise
    const params = Promise.resolve({ slug: 'python' });
    
    let result;
    await act(async () => {
      result = render(<SubjectDetailPage params={params} />);
    });
    return result;
  };

  it.skip('renders loading state initially', async () => {
    // Override selector to show loading
    mockUseAppSelector.mockImplementation((selector) => 
      selector({ subjects: { ...defaultState, loading: true } })
    );

    // We need to render but we expect it to show loading
    // Note: The component triggers data fetch which sets loading=true, 
    // but if we start with loading=true in state, it should show loader.
    
    const params = Promise.resolve({ slug: 'python' });
    await act(async () => {
      render(<SubjectDetailPage params={params} />);
    });

    expect(screen.getByText('資料載入中...')).toBeInTheDocument();
  });

  it('fetches data and renders content', async () => {
    // After fetch, state will be populated.
    // For the test "fetches data", we simulate the effect calling dispatch
    // and then simulate the state update.
    
    // However, since we mock selectors, we need to mock the state "as if" it was loaded
    // to verify the RENDER part.
    mockUseAppSelector.mockImplementation((selector) => 
      selector({ 
        subjects: { 
          currentSubject: mockSubject,
          categories: [...mockChapters, ...mockExams],
          loading: false,
          currentSubjectStats: mockStats
        } 
      })
    );

    await renderPage();

    // Verify API calls
    expect(getSubjectBySlug).toHaveBeenCalledWith('python');
    expect(getCategoriesBySubject).toHaveBeenCalledWith('sub123');
    expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ type: 'subjects/fetchSubjectStats' }));

    // Verify Content
    expect(screen.getByRole('heading', { level: 1, name: 'Python Programming' })).toBeInTheDocument();

    // Chapters length is 2
    expect(screen.getByText('2')).toBeInTheDocument(); 
    // Exams length is 1
    expect(screen.getByText('1')).toBeInTheDocument(); 

    // Verify Chapter List is default
    expect(screen.getByText('Chapter 1')).toBeInTheDocument();
    expect(screen.getByText('Chapter 2')).toBeInTheDocument();
    expect(screen.queryByText('Exam 1')).not.toBeInTheDocument();
  });

  it('switches tabs to Exams', async () => {
     mockUseAppSelector.mockImplementation((selector) => 
      selector({ 
        subjects: { 
          currentSubject: mockSubject,
          categories: [...mockChapters, ...mockExams],
          loading: false,
          currentSubjectStats: mockStats
        } 
      })
    );

    const user = userEvent.setup();
    await renderPage();

    // Use specific selector for the tab button
    const examsTab = screen.getByRole('button', { name: /模擬試題/ });
    await user.click(examsTab);

    expect(screen.getByText('Exam 1')).toBeInTheDocument();
    expect(screen.queryByText('Chapter 1')).not.toBeInTheDocument();
  });

  it('opens import dialog', async () => {
     mockUseAppSelector.mockImplementation((selector) => 
      selector({ 
        subjects: { 
          currentSubject: mockSubject,
          categories: [...mockChapters, ...mockExams],
          loading: false,
          currentSubjectStats: mockStats
        } 
      })
    );

    const user = userEvent.setup();
    await renderPage();

    const importBtn = screen.getByText('匯入模組');
    await user.click(importBtn);

    expect(screen.getByText('IMPORT_MODULE.EXE')).toBeInTheDocument();
  });

  it('navigates to category on click', async () => {
    mockUseAppSelector.mockImplementation((selector) => 
      selector({ 
        subjects: { 
          currentSubject: mockSubject,
          categories: [...mockChapters, ...mockExams],
          loading: false,
          currentSubjectStats: mockStats
        } 
      })
    );

    const user = userEvent.setup();
    await renderPage();

    const chapterItem = screen.getByText('Chapter 1');
    await user.click(chapterItem);

    expect(mockPush).toHaveBeenCalledWith('/exam/python/ch1');
  });
});
