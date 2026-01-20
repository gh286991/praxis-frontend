import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { QuestionPanel } from './QuestionPanel';
import { Question } from '@/lib/store/slices/questionsSlice';

// Mock ReactMarkdown to avoid complex rendering issues
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-content">{children}</div>,
}));

vi.mock('remark-gfm', () => ({
  default: () => {},
}));

vi.mock('rehype-highlight', () => ({
  default: () => {},
}));

describe('QuestionPanel', () => {
  const mockQuestion: Question = {
    _id: 'q1',
    title: 'Add Two Numbers',
    description: 'Write a program to add two numbers.',
    sampleInput: '5 10',
    sampleOutput: '15',
    samples: [{ input: '5 10', output: '15' }],
    testCases: [{ input: '5 10', output: '15' }],
    tags: [
      { _id: 't1', name: 'Math', slug: 'math', type: 'concept' },
      { _id: 't2', name: 'Python Basics', slug: 'python-basics', type: 'language_feature' },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('loading state', () => {
    it('should show loading indicator when loading is true', () => {
      render(<QuestionPanel question={null} loading={true} />);
      expect(screen.getByText(/載入題目中/i)).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty prompt when no question is provided', () => {
      render(<QuestionPanel question={null} loading={false} />);
      expect(screen.getByText(/準備開始練習/i)).toBeInTheDocument();
      expect(screen.getByText(/請選擇題目類別/i)).toBeInTheDocument();
    });

    it('should show empty state when question is null and loading is undefined', () => {
      render(<QuestionPanel question={null} />);
      expect(screen.getByText(/準備開始練習/i)).toBeInTheDocument();
    });
  });

  describe('question display', () => {
    it('should display the question title as heading', () => {
      render(<QuestionPanel question={mockQuestion} />);
      expect(screen.getByRole('heading', { name: 'Add Two Numbers' })).toBeInTheDocument();
    });

    it('should display the question description', () => {
      render(<QuestionPanel question={mockQuestion} />);
      expect(screen.getByTestId('markdown-content')).toHaveTextContent('Write a program to add two numbers.');
    });

    it('should display sample input section', () => {
      render(<QuestionPanel question={mockQuestion} />);
      expect(screen.getByText(/範例輸入/i)).toBeInTheDocument();
      expect(screen.getByText('5 10')).toBeInTheDocument();
    });

    it('should display sample output section', () => {
      render(<QuestionPanel question={mockQuestion} />);
      expect(screen.getByText(/範例輸出/i)).toBeInTheDocument();
      expect(screen.getByText('15')).toBeInTheDocument();
    });

    it('should display all tags', () => {
      render(<QuestionPanel question={mockQuestion} />);
      expect(screen.getByText('Math')).toBeInTheDocument();
      expect(screen.getByText('Python Basics')).toBeInTheDocument();
    });

    it('should show question badge', () => {
      render(<QuestionPanel question={mockQuestion} />);
      expect(screen.getByText('題目')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle question without tags', () => {
      const questionWithoutTags: Question = {
        ...mockQuestion,
        tags: [],
      };
      render(<QuestionPanel question={questionWithoutTags} />);
      expect(screen.getByRole('heading', { name: 'Add Two Numbers' })).toBeInTheDocument();
    });

    it('should handle question with empty sample input', () => {
      const questionNoInput: Question = {
        ...mockQuestion,
        sampleInput: '',
      };
      render(<QuestionPanel question={questionNoInput} />);
      expect(screen.getByText(/無需輸入/i)).toBeInTheDocument();
    });

    it('should not throw when tags is undefined', () => {
      const questionUndefinedTags = {
        ...mockQuestion,
        tags: undefined,
      } as unknown as Question;
      
      expect(() => render(<QuestionPanel question={questionUndefinedTags} />)).not.toThrow();
    });
  });
});
