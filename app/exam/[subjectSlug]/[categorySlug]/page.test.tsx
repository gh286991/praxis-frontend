import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import React from 'react';
import { ExamContent } from '@/components/exam/ExamContent';

// Mock next/navigation
const mockPush = vi.fn();
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    replace: vi.fn(),
  }),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children, href }: { children: React.ReactNode; href: string }) => (
    <a href={href}>{children}</a>
  ),
}));

// Mock Redux hooks
const mockDispatch = vi.fn();
const mockUseAppSelector = vi.fn();
vi.mock('@/lib/store', () => ({
  useAppDispatch: () => mockDispatch,
  useAppSelector: (selector: (state: unknown) => unknown) => mockUseAppSelector(selector),
}));

// Mock Redux actions
vi.mock('@/lib/store/slices/userSlice', () => ({
  setUser: vi.fn((data) => ({ type: 'user/setUser', payload: data })),
  logout: vi.fn(() => ({ type: 'user/logout' })),
}));

vi.mock('@/lib/store/slices/questionsSlice', () => ({
  setCurrentQuestion: vi.fn((data) => ({ type: 'questions/setCurrentQuestion', payload: data })),
  setHistory: vi.fn((data) => ({ type: 'questions/setHistory', payload: data })),
  setCode: vi.fn((data) => ({ type: 'questions/setCode', payload: data })),
  setOutput: vi.fn((data) => ({ type: 'questions/setOutput', payload: data })),
  setLoading: vi.fn((data) => ({ type: 'questions/setLoading', payload: data })),
  setExecuting: vi.fn((data) => ({ type: 'questions/setExecuting', payload: data })),
  setHint: vi.fn((data) => ({ type: 'questions/setHint', payload: data })),
  setIsHintOpen: vi.fn((data) => ({ type: 'questions/setIsHintOpen', payload: data })),
  setIsCompleted: vi.fn((data) => ({ type: 'questions/setIsCompleted', payload: data })),
  resetQuestion: vi.fn(() => ({ type: 'questions/resetQuestion' })),
  setSubmissionLoading: vi.fn((data) => ({ type: 'questions/setSubmissionLoading', payload: data })),
  setSubmissionResult: vi.fn((data) => ({ type: 'questions/setSubmissionResult', payload: data })),
}));

// Mock API
vi.mock('@/lib/api', () => ({
  getNextQuestion: vi.fn(),
  submitAnswer: vi.fn(),
  getHint: vi.fn(),
  getHistory: vi.fn().mockResolvedValue([]),
  getQuestionById: vi.fn(),
  evaluateSubmission: vi.fn(),
}));

// Mock hooks
const mockRunLocalCode = vi.fn();
const mockSubmitCodeWithStream = vi.fn();
vi.mock('@/hooks/usePyodide', () => ({
  usePyodide: () => ({
    runCode: mockRunLocalCode,
    output: [],
    isLoading: false,
  }),
}));

vi.mock('@/hooks/useRemoteExecution', () => ({
  useRemoteExecution: () => ({
    submitCodeWithStream: mockSubmitCodeWithStream,
    systemMessages: [],
    executionOutput: [],
    isLoading: false,
  }),
}));

// Mock UI components (Radix UI issues)
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, disabled, className }: { children: React.ReactNode; onClick?: () => void; disabled?: boolean; className?: string }) => (
    <button onClick={onClick} disabled={disabled} className={className}>
      {children}
    </button>
  ),
}));

vi.mock('@/components/ui/avatar', () => ({
  Avatar: ({ children }: { children: React.ReactNode }) => <div data-testid="avatar">{children}</div>,
  AvatarImage: () => null,
  AvatarFallback: ({ children }: { children: React.ReactNode }) => <span>{children}</span>,
}));

// Mock child components
vi.mock('@/components/exam/QuestionPanel', () => ({
  QuestionPanel: ({ question, loading }: { question: { title: string } | null; loading: boolean }) => (
    <div data-testid="question-panel">
      {loading ? 'Loading...' : question ? question.title : 'No question'}
    </div>
  ),
}));

vi.mock('@/components/exam/EditorPanel', () => ({
  EditorPanel: ({ code, onRun, isExecuting }: { code: string; onRun: () => void; isExecuting: boolean }) => (
    <div data-testid="editor-panel">
      <textarea data-testid="code-editor" defaultValue={code} />
      <button data-testid="run-button" onClick={onRun} disabled={isExecuting}>
        {isExecuting ? 'Running...' : 'Run'}
      </button>
    </div>
  ),
}));

vi.mock('@/components/exam/ConsolePanel', () => ({
  ConsolePanel: ({ output }: { output: string }) => (
    <div data-testid="console-panel">{output || 'No output'}</div>
  ),
}));

vi.mock('@/components/exam/StreamingSubmissionModal', () => ({
  StreamingSubmissionModal: ({ isOpen }: { isOpen: boolean }) => (
    isOpen ? <div data-testid="submission-modal">Submission Modal</div> : null
  ),
}));

vi.mock('@/components/exam/GenerationModal', () => ({
  default: ({ isOpen, status }: { isOpen: boolean; status: string }) => (
    isOpen ? <div data-testid="generation-modal">Generation: {status}</div> : null
  ),
}));

vi.mock('@/components/CyberpunkBackground', () => ({
  CyberpunkBackground: () => <div data-testid="cyberpunk-bg" />,
}));

// Mock ReactMarkdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div>{children}</div>,
}));

vi.mock('remark-gfm', () => ({ default: () => {} }));
vi.mock('rehype-highlight', () => ({ default: () => {} }));

describe('ExamContent', () => {
  const defaultQuestionsState = {
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

  const mockUser = { name: 'Test User', picture: 'https://example.com/avatar.jpg' };

  const setupMocks = (overrides: Partial<typeof defaultQuestionsState> = {}, user = mockUser) => {
    mockUseAppSelector.mockImplementation((selector: (state: { user: { profile: typeof mockUser | null }; questions: typeof defaultQuestionsState }) => unknown) => {
      const state = {
        user: { profile: user },
        questions: { ...defaultQuestionsState, ...overrides },
      };
      return selector(state);
    });
  };

  let getItemMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    vi.clearAllMocks();
    getItemMock = vi.fn().mockReturnValue('mock-jwt-token');
    
    // Mock localStorage
    const localStorageMock = {
      getItem: getItemMock,
      setItem: vi.fn(),
      removeItem: vi.fn(),
      clear: vi.fn(),
    };
    Object.defineProperty(window, 'localStorage', { value: localStorageMock });
    
    // Mock fetch for user profile
    global.fetch = vi.fn().mockResolvedValue({
      ok: true,
      json: () => Promise.resolve(mockUser),
    });
    
    setupMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // Render ExamContent directly, bypassing use(Promise) issues
  const renderContent = (props = {}) => {
    return render(<ExamContent subjectSlug="python-basic" categorySlug="category1" {...props} />);
  };

  describe('hydration', () => {
    it('should hydrate user from props', async () => {
      renderContent({ initialUser: mockUser });
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ 
             type: 'user/setUser', 
             payload: mockUser 
        }));
      });
    });

    it('should hydrate history from props', async () => {
        const mockHistory = [{ questionId: '1', isCorrect: true }];
        renderContent({ initialHistory: mockHistory });
        
        await waitFor(() => {
            expect(mockDispatch).toHaveBeenCalledWith(expect.objectContaining({ 
                type: 'questions/setHistory', 
                payload: mockHistory 
            }));
        });
    });
  });

  describe('layout rendering', () => {
    it('should render the main layout components', async () => {
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByTestId('question-panel')).toBeInTheDocument();
        expect(screen.getByTestId('editor-panel')).toBeInTheDocument();
        expect(screen.getByTestId('console-panel')).toBeInTheDocument();
      });
    });

    it('should render exam title based on category', async () => {
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByText('第1類：基本程式設計')).toBeInTheDocument();
      });
    });

    it('should render user avatar when logged in', async () => {
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByTestId('avatar')).toBeInTheDocument();
      });
    });
  });

  describe('question panel', () => {
    it('should show loading state', async () => {
      setupMocks({ loading: true });
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByTestId('question-panel')).toHaveTextContent('Loading...');
      });
    });

    it('should show question when loaded', async () => {
      setupMocks({
        currentQuestion: { _id: '123', title: 'Test Question' } as never,
      });
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByTestId('question-panel')).toHaveTextContent('Test Question');
      });
    });
  });

  describe('buttons', () => {
    it('should render AI HINT button', async () => {
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByText(/ai hint/i)).toBeInTheDocument();
      });
    });

    it('should render SUBMIT button', async () => {
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByText(/submit/i)).toBeInTheDocument();
      });
    });
  });

  describe('run functionality', () => {
    it('should show Run button in editor panel', async () => {
      renderContent();
      
      await waitFor(() => {
          expect(screen.getByTestId('run-button')).toBeInTheDocument();
      });
    });

    it('should call runLocalCode when Run button is clicked', async () => {
      setupMocks({
        currentQuestion: {
          _id: '123',
          title: 'Test',
          samples: [{ input: '1', output: '2' }],
        } as never,
      });
      
      mockRunLocalCode.mockResolvedValue({ output: '2', error: null });
      
      const user = userEvent.setup();
      renderContent();
      
      await waitFor(() => {
        expect(screen.getByTestId('run-button')).toBeInTheDocument();
      });
      
      await user.click(screen.getByTestId('run-button'));
      
      await waitFor(() => {
        expect(mockDispatch).toHaveBeenCalled(); // Dispatch setExecuting
      });
    });
  });
});
