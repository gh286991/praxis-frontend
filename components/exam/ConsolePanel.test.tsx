import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { ConsolePanel } from './ConsolePanel';

describe('ConsolePanel', () => {
  const defaultProps = {
    output: '',
    height: 300,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render the Console tab button', () => {
      render(<ConsolePanel {...defaultProps} />);
      expect(screen.getByRole('button', { name: /console/i })).toBeInTheDocument();
    });

    it('should show "Ready to Run" status when no results', () => {
      render(<ConsolePanel {...defaultProps} />);
      expect(screen.getByText(/ready to run/i)).toBeInTheDocument();
    });

    it('should display output when provided', () => {
      render(<ConsolePanel {...defaultProps} output="Hello World" />);
      expect(screen.getByText('Hello World')).toBeInTheDocument();
    });

    it('should show waiting message when no output', () => {
      render(<ConsolePanel {...defaultProps} output="" />);
      expect(screen.getByText('等待執行...')).toBeInTheDocument();
    });
  });

  describe('with test results', () => {
    const resultsProps = {
      ...defaultProps,
      results: [
        { input: '5 10', output: '15', expected: '15', passed: true },
        { input: '1 2', output: '3', expected: '3', passed: true },
      ],
    };

    it('should show Test Cases tab when results are provided', () => {
      render(<ConsolePanel {...resultsProps} />);
      expect(screen.getByRole('button', { name: /test cases/i })).toBeInTheDocument();
    });

    it('should show result count in badge', () => {
      render(<ConsolePanel {...resultsProps} />);
      // 檢查 Test Cases tab 中包含數量
      const testCasesButton = screen.getByRole('button', { name: /test cases/i });
      expect(testCasesButton).toHaveTextContent('2');
    });

    it('should show "All Passed" when all tests pass', () => {
      render(<ConsolePanel {...resultsProps} />);
      expect(screen.getByText(/all passed/i)).toBeInTheDocument();
    });

    it('should switch to Test Cases tab when clicked', async () => {
      const user = userEvent.setup();
      render(<ConsolePanel {...resultsProps} />);
      
      await user.click(screen.getByRole('button', { name: /test cases/i }));
      
      // Should show test case content
      expect(screen.getByText(/test case 1/i)).toBeInTheDocument();
      expect(screen.getByText(/test case 2/i)).toBeInTheDocument();
    });
  });

  describe('with failed results', () => {
    const failedResultsProps = {
      ...defaultProps,
      results: [
        { input: '5 10', output: '14', expected: '15', passed: false },
        { input: '1 2', output: '3', expected: '3', passed: true },
      ],
    };

    it('should show failure count when tests fail', () => {
      render(<ConsolePanel {...failedResultsProps} />);
      expect(screen.getByText(/1 failed/i)).toBeInTheDocument();
    });
  });

  describe('with samples', () => {
    const samplesProps = {
      ...defaultProps,
      samples: [
        { input: '1 2', output: '3' },
        { input: '5 5', output: '10' },
      ],
    };

    it('should show Test Cases tab when samples are provided', () => {
      render(<ConsolePanel {...samplesProps} />);
      expect(screen.getByRole('button', { name: /test cases/i })).toBeInTheDocument();
    });

    it('should show pending status for samples without results', () => {
      render(<ConsolePanel {...samplesProps} />);
      expect(screen.getByText(/ready to run/i)).toBeInTheDocument();
    });

    it('should merge samples with results when both provided', () => {
      const mergedProps = {
        ...samplesProps,
        results: [
          { input: '1 2', output: '3', expected: '3', passed: true },
        ],
      };
      
      render(<ConsolePanel {...mergedProps} />);
      // First test case should show as passed
      expect(screen.getByText('PASS')).toBeInTheDocument();
    });
  });

  describe('tab switching', () => {
    const propsWithResults = {
      ...defaultProps,
      results: [
        { input: '1', output: '1', expected: '1', passed: true },
      ],
    };

    it('should switch between Console and Test Cases tabs', async () => {
      const user = userEvent.setup();
      render(<ConsolePanel {...propsWithResults} />);
      
      // Click Test Cases tab
      await user.click(screen.getByRole('button', { name: /test cases/i }));
      expect(screen.getByText(/test case 1/i)).toBeInTheDocument();
      
      // Switch back to Console
      await user.click(screen.getByRole('button', { name: /console/i }));
      expect(screen.getByText('INPUT')).toBeInTheDocument();
    });
  });

  describe('legacy props compatibility', () => {
    it('should handle input and expectedOutput props', () => {
      const legacyProps = {
        ...defaultProps,
        input: '5 10',
        expectedOutput: '15',
        output: '15',
        passed: true,
      };
      
      render(<ConsolePanel {...legacyProps} />);
      expect(screen.getByText('5 10')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty results array', () => {
      render(<ConsolePanel {...defaultProps} results={[]} />);
      expect(screen.getByText(/ready to run/i)).toBeInTheDocument();
    });

    it('should handle undefined samples', () => {
      render(<ConsolePanel {...defaultProps} samples={undefined} />);
      expect(screen.getByRole('button', { name: /console/i })).toBeInTheDocument();
    });
  });
});
