import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { StreamingSubmissionModal } from './StreamingSubmissionModal';

// Mock the Button component with accessible button
vi.mock('@/components/ui/button', () => ({
  Button: ({ children, onClick, className, disabled, variant }: any) => (
    <button 
      onClick={onClick} 
      className={className} 
      disabled={disabled} 
      data-variant={variant}
      type="button"
    >
      {children}
    </button>
  ),
}));

describe('StreamingSubmissionModal', () => {
  const defaultProps = {
    isOpen: true,
    isLoading: false,
    messages: [] as string[],
    submissionResult: null as any,
    onClose: vi.fn(),
    onNextChallenge: vi.fn(),
    initialTestCases: [] as { input: string; output: string }[],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Use fake timers for animation queue
    vi.useFakeTimers({ shouldAdvanceTime: true });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<StreamingSubmissionModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText(/evaluating submission/i)).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<StreamingSubmissionModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText(/evaluating submission/i)).toBeInTheDocument();
    });
  });

  describe('loading state', () => {
    it('should show loading text when evaluating', () => {
      render(<StreamingSubmissionModal {...defaultProps} isLoading={true} />);
      expect(screen.getByText(/evaluating submission/i)).toBeInTheDocument();
      expect(screen.getByText(/running test cases/i)).toBeInTheDocument();
    });

    it('should disable close button while loading', () => {
      render(<StreamingSubmissionModal {...defaultProps} isLoading={true} />);
      // Find all buttons and check if the close button is disabled
      const buttons = screen.getAllByRole('button');
      const closeButton = buttons.find(btn => btn.querySelector('.lucide-x'));
      expect(closeButton).toBeDisabled();
    });
  });

  describe('with initial test cases', () => {
    const propsWithTestCases = {
      ...defaultProps,
      initialTestCases: [
        { input: '1 2', output: '3' },
        { input: '5 5', output: '10' },
      ],
    };

    it('should display test case labels', () => {
      render(<StreamingSubmissionModal {...propsWithTestCases} />);
      expect(screen.getByText(/test case #1/i)).toBeInTheDocument();
      expect(screen.getByText(/test case #2/i)).toBeInTheDocument();
    });

    it('should show input values', () => {
      render(<StreamingSubmissionModal {...propsWithTestCases} />);
      expect(screen.getByText('1 2')).toBeInTheDocument();
      expect(screen.getByText('5 5')).toBeInTheDocument();
    });

    it('should show expected output values', () => {
      render(<StreamingSubmissionModal {...propsWithTestCases} />);
      expect(screen.getByText('3')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
    });
  });

  describe('completion states', () => {
    const successProps = {
      ...defaultProps,
      isLoading: false,
      submissionResult: {
        isCorrect: true,
        testResult: {
          passed: true,
          results: [
            { input: '1 2', expected: '3', actual: '3', passed: true },
          ],
        },
      },
      initialTestCases: [{ input: '1 2', output: '3' }],
    };

    it('should show success state when all tests pass', async () => {
      render(<StreamingSubmissionModal {...successProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/challenge completed/i)).toBeInTheDocument();
      });
    });

    it('should show failure state when tests fail', async () => {
      const failureProps = {
        ...successProps,
        submissionResult: {
          isCorrect: false,
          testResult: {
            passed: false,
            results: [
              { input: '1 2', expected: '3', actual: '2', passed: false },
            ],
          },
        },
      };
      
      render(<StreamingSubmissionModal {...failureProps} />);
      
      await waitFor(() => {
        expect(screen.getByText(/submission failed/i)).toBeInTheDocument();
      });
    });
  });

  describe('footer buttons', () => {
    const completedProps = {
      ...defaultProps,
      isLoading: false,
      submissionResult: {
        isCorrect: true,
        testResult: { passed: true, results: [] },
      },
    };

    it('should show Close Report button when complete', async () => {
      render(<StreamingSubmissionModal {...completedProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /close report/i })).toBeInTheDocument();
      });
    });

    it('should call onClose when Close Report is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<StreamingSubmissionModal {...completedProps} />);
      
      await waitFor(async () => {
        const closeButton = screen.getByRole('button', { name: /close report/i });
        await user.click(closeButton);
      });
      
      expect(completedProps.onClose).toHaveBeenCalled();
    });

    it('should show Next Challenge button when correct', async () => {
      render(<StreamingSubmissionModal {...completedProps} />);
      
      await waitFor(() => {
        expect(screen.getByRole('button', { name: /next challenge/i })).toBeInTheDocument();
      });
    });

    it('should call onNextChallenge when Next Challenge is clicked', async () => {
      const user = userEvent.setup({ advanceTimers: vi.advanceTimersByTime });
      render(<StreamingSubmissionModal {...completedProps} />);
      
      await waitFor(async () => {
        const nextButton = screen.getByRole('button', { name: /next challenge/i });
        await user.click(nextButton);
      });
      
      expect(completedProps.onNextChallenge).toHaveBeenCalled();
    });

    it('should not show Next Challenge button when failed', async () => {
      const failedProps = {
        ...completedProps,
        submissionResult: {
          isCorrect: false,
          testResult: { passed: false, results: [] },
        },
      };
      
      render(<StreamingSubmissionModal {...failedProps} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /next challenge/i })).not.toBeInTheDocument();
      });
    });
  });

  describe('message processing', () => {
    it('should handle messages array', () => {
      const propsWithMessages = {
        ...defaultProps,
        messages: ['[Test #1] PASSED'],
        initialTestCases: [{ input: '1', output: '1' }],
      };
      
      render(<StreamingSubmissionModal {...propsWithMessages} />);
      
      expect(screen.getByText(/test case #1/i)).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty initialTestCases', () => {
      render(<StreamingSubmissionModal {...defaultProps} initialTestCases={[]} />);
      expect(screen.getByText(/evaluating submission/i)).toBeInTheDocument();
    });

    it('should handle missing onNextChallenge callback', async () => {
      const propsWithoutNextChallenge = {
        ...defaultProps,
        isLoading: false,
        onNextChallenge: undefined,
        submissionResult: {
          isCorrect: true,
          testResult: { passed: true, results: [] },
        },
      };
      
      render(<StreamingSubmissionModal {...propsWithoutNextChallenge} />);
      
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /next challenge/i })).not.toBeInTheDocument();
      });
    });
  });
});
