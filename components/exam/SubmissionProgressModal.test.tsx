import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SubmissionProgressModal } from './SubmissionProgressModal';

describe('SubmissionProgressModal', () => {
  const defaultProps = {
    isOpen: true,
    messages: [] as string[],
    isLoading: true,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<SubmissionProgressModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText(/processing submission/i)).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<SubmissionProgressModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText(/processing submission/i)).toBeInTheDocument();
    });
  });

  describe('header display', () => {
    it('should show header title', () => {
      render(<SubmissionProgressModal {...defaultProps} />);
      expect(screen.getByText(/processing submission/i)).toBeInTheDocument();
    });

    it('should show waiting message', () => {
      render(<SubmissionProgressModal {...defaultProps} />);
      expect(screen.getByText(/please wait while we evaluate your code/i)).toBeInTheDocument();
    });
  });

  describe('loading states', () => {
    it('should show "Processing..." when isLoading is true', () => {
      render(<SubmissionProgressModal {...defaultProps} isLoading={true} />);
      expect(screen.getByText(/processing\.\.\./i)).toBeInTheDocument();
    });

    it('should show "Completed" when isLoading is false', () => {
      render(<SubmissionProgressModal {...defaultProps} isLoading={false} />);
      expect(screen.getByText(/completed/i)).toBeInTheDocument();
    });
  });

  describe('messages display', () => {
    it('should show initializing message when no messages', () => {
      render(<SubmissionProgressModal {...defaultProps} messages={[]} />);
      expect(screen.getByText(/initializing submission/i)).toBeInTheDocument();
    });

    it('should display messages when provided', () => {
      const messages = ['[System] Evaluating code...', '[System] Test case 1 running'];
      render(<SubmissionProgressModal {...defaultProps} messages={messages} />);
      
      expect(screen.getByText(/evaluating code/i)).toBeInTheDocument();
      expect(screen.getByText(/test case 1 running/i)).toBeInTheDocument();
    });

    it('should show message count', () => {
      const messages = ['Message 1', 'Message 2', 'Message 3'];
      render(<SubmissionProgressModal {...defaultProps} messages={messages} />);
      
      expect(screen.getByText(/3 updates/i)).toBeInTheDocument();
    });

    it('should show singular "update" for one message', () => {
      render(<SubmissionProgressModal {...defaultProps} messages={['Single message']} />);
      expect(screen.getByText(/1 update$/i)).toBeInTheDocument();
    });
  });

  describe('message type styling', () => {
    it('should style error messages differently', () => {
      render(<SubmissionProgressModal {...defaultProps} messages={['Error occurred']} />);
      const message = screen.getByText(/error occurred/i);
      // Error messages have rose styling
      expect(message.className).toContain('text-rose-300');
    });

    it('should style complete/passed messages differently', () => {
      render(<SubmissionProgressModal {...defaultProps} messages={['All tests passed']} />);
      const message = screen.getByText(/all tests passed/i);
      // Success messages have emerald styling
      expect(message.className).toContain('text-emerald-300');
    });

    it('should style test case messages differently', () => {
      render(<SubmissionProgressModal {...defaultProps} messages={['Test case 1 running']} />);
      const message = screen.getByText(/test case 1 running/i);
      // Test case messages have cyan styling
      expect(message.className).toContain('text-cyan-300');
    });
  });

  describe('edge cases', () => {
    it('should handle many messages', () => {
      const manyMessages = Array.from({ length: 20 }, (_, i) => `Message ${i + 1}`);
      render(<SubmissionProgressModal {...defaultProps} messages={manyMessages} />);
      expect(screen.getByText(/20 updates/i)).toBeInTheDocument();
    });

    it('should strip [System] prefix from messages', () => {
      render(<SubmissionProgressModal {...defaultProps} messages={['[System] Test message']} />);
      // The message should be displayed without [System]
      const messageElement = screen.getByText(/test message/i);
      expect(messageElement.textContent).not.toContain('[System]');
    });
  });
});
