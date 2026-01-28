import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import SubjectPageClient from './SubjectPageClient';

// Mock IntersectionObserver
class IntersectionObserverMock {
  observe = vi.fn();
  unobserve = vi.fn();
  disconnect = vi.fn();
}
vi.stubGlobal('IntersectionObserver', IntersectionObserverMock);

// Mock mocks
const mockPush = vi.fn();
const mockDispatch = vi.fn();
const mockUseAppSelector = vi.fn();

// Mock Imports
vi.mock('next/navigation', () => ({
  useRouter: () => ({
    push: mockPush,
    refresh: vi.fn(),
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

vi.mock('@/components/AppNavbar', () => ({
  AppNavbar: () => <div data-testid="app-navbar">Navbar</div>,
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

// Mock API for ImportDialog
vi.mock('@/lib/api', () => ({
  subjectsApi: {
    importMockExam: vi.fn().mockResolvedValue({}),
  },
  getCategoriesBySubject: vi.fn().mockResolvedValue([
    { _id: 'cat1', name: 'Chapter 1', type: 'CHAPTER', slug: 'cat1' },
    { _id: 'cat2', name: 'Chapter 2', type: 'CHAPTER', slug: 'cat2' },
    { _id: 'exam1', name: 'Exam 1', type: 'EXAM', slug: 'exam1' }, // Added new exam
  ]),
}));

const mockSubject = {
  _id: 'sub1',
  name: 'Python Programming',
  slug: 'python',
  description: 'Learn Python',
  language: 'python',
  icon: 'python',
  color: 'blue',
  isActive: true,
};

const mockCategories = [
  { _id: 'cat1', name: 'Chapter 1', type: 'CHAPTER', slug: 'cat1', subjectId: 'sub1', description: 'desc', order: 1 },
  { _id: 'cat2', name: 'Chapter 2', type: 'CHAPTER', slug: 'cat2', subjectId: 'sub1', description: 'desc', order: 2 },
  { _id: 'exam1', name: 'Exam 1', type: 'EXAM', slug: 'exam1', subjectId: 'sub1', description: 'desc', order: 3 },
];

const mockStats = {
  totalQuestions: 10,
  completedQuestions: 5,
  passedQuestions: 4,
  failedQuestions: 1,
  completionRate: 50,
  passRate: 80,
  subjectId: 'sub1',
  subjectName: 'Python',
  subjectSlug: 'python',
  categories: [],
};

describe('SubjectPageClient', () => {
  const renderComponent = () => {
    return render(
      <SubjectPageClient
        slug="python"
        initialSubject={mockSubject}
        initialCategories={mockCategories}
        initialStats={mockStats}
      />
    );
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders content with initial props', () => {
    renderComponent();

    expect(screen.getByRole('heading', { level: 1, name: 'Python Programming' })).toBeInTheDocument();
    
    // Check chapters count (2 chapters)
    expect(screen.getByText('2')).toBeInTheDocument();
  });

  it('switches tabs to Exams', async () => {
    renderComponent();

    const examsTab = screen.getByRole('button', { name: /模擬試題/ });
    fireEvent.click(examsTab);

    // Should demonstrate exam content
    await waitFor(() => {
      expect(screen.getByText('Exam 1')).toBeInTheDocument();
    });
  });

  it('opens import dialog', async () => {
    renderComponent();

    const importButton = screen.getByRole('button', { name: /匯入模組/ });
    fireEvent.click(importButton);

    expect(screen.getByText('IMPORT_MODULE.EXE')).toBeInTheDocument();
  });
});
