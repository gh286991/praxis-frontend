import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import GenerationModal from './GenerationModal';

describe('GenerationModal', () => {
  const defaultProps = {
    isOpen: true,
    status: 'progress' as const,
    messages: [] as string[],
    onClose: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('visibility', () => {
    it('should not render when isOpen is false', () => {
      render(<GenerationModal {...defaultProps} isOpen={false} />);
      expect(screen.queryByText(/ai 題目生成系統/i)).not.toBeInTheDocument();
    });

    it('should render when isOpen is true', () => {
      render(<GenerationModal {...defaultProps} isOpen={true} />);
      expect(screen.getByText(/ai 題目生成系統/i)).toBeInTheDocument();
    });
  });

  describe('status states', () => {
    it('should show progress state correctly', () => {
      render(<GenerationModal {...defaultProps} status="progress" />);
      expect(screen.getByText(/執行中.*正在生成題目/i)).toBeInTheDocument();
      expect(screen.getByText(/ai 正在為您打造專屬挑戰/i)).toBeInTheDocument();
    });

    it('should show success state correctly', () => {
      render(<GenerationModal {...defaultProps} status="success" />);
      expect(screen.getByText(/完成.*生成成功/i)).toBeInTheDocument();
      expect(screen.getByText(/您的挑戰已準備就緒/i)).toBeInTheDocument();
    });

    it('should show error state correctly', () => {
      render(<GenerationModal {...defaultProps} status="error" />);
      expect(screen.getByText(/錯誤.*生成失敗/i)).toBeInTheDocument();
      expect(screen.getByText(/發生錯誤，請重試/i)).toBeInTheDocument();
    });
  });

  describe('messages display', () => {
    it('should display messages in terminal', () => {
      const messages = ['開始生成題目...', '正在檢查格式...', '測試案例通過'];
      render(<GenerationModal {...defaultProps} messages={messages} />);
      
      expect(screen.getByText(/開始生成題目/)).toBeInTheDocument();
      expect(screen.getByText(/正在檢查格式/)).toBeInTheDocument();
      expect(screen.getByText(/測試案例通過/)).toBeInTheDocument();
    });

    it('should handle empty messages array', () => {
      render(<GenerationModal {...defaultProps} messages={[]} />);
      expect(screen.getByText(/ai 題目生成系統/i)).toBeInTheDocument();
    });
  });

  describe('close button', () => {
    it('should call onClose when red button is clicked', async () => {
      const user = userEvent.setup();
      render(<GenerationModal {...defaultProps} />);
      
      // Find the red close button by its title
      const closeButton = screen.getByTitle('關閉');
      await user.click(closeButton);
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1);
    });
  });

  describe('terminal input', () => {
    it('should show input field when status is progress', () => {
      render(<GenerationModal {...defaultProps} status="progress" />);
      expect(screen.getByPlaceholderText(/輸入.*stop.*中斷/i)).toBeInTheDocument();
    });

    it('should not show input field when status is not progress', () => {
      render(<GenerationModal {...defaultProps} status="success" />);
      expect(screen.queryByPlaceholderText(/輸入.*stop.*中斷/i)).not.toBeInTheDocument();
    });

    it('should call onClose when "stop" is typed and Enter is pressed', async () => {
      const user = userEvent.setup();
      render(<GenerationModal {...defaultProps} status="progress" />);
      
      const input = screen.getByPlaceholderText(/輸入.*stop.*中斷/i);
      await user.type(input, 'stop{Enter}');
      
      expect(defaultProps.onClose).toHaveBeenCalled();
    });

    it('should not call onClose for other commands', async () => {
      const user = userEvent.setup();
      render(<GenerationModal {...defaultProps} status="progress" />);
      
      const input = screen.getByPlaceholderText(/輸入.*stop.*中斷/i);
      await user.type(input, 'hello{Enter}');
      
      expect(defaultProps.onClose).not.toHaveBeenCalled();
    });
  });

  describe('message styling', () => {
    it('should apply error styling for error messages', () => {
      render(<GenerationModal {...defaultProps} messages={['發生錯誤 ABC123']} />);
      const messages = screen.getAllByText(/發生錯誤 ABC123/);
      const messageInTerminal = messages.find(el => el.tagName === 'SPAN');
      expect(messageInTerminal?.className).toContain('text-rose-400');
    });

    it('should apply success styling for success messages', () => {
      render(<GenerationModal {...defaultProps} messages={['已完成 XYZ789']} />);
      const messages = screen.getAllByText(/已完成 XYZ789/);
      const messageInTerminal = messages.find(el => el.tagName === 'SPAN');
      expect(messageInTerminal?.className).toContain('text-emerald-400');
    });

    it('should apply cyan styling for generation messages', () => {
      render(<GenerationModal {...defaultProps} messages={['正在生成 DEF456']} />);
      const messages = screen.getAllByText(/正在生成 DEF456/);
      const messageInTerminal = messages.find(el => el.tagName === 'SPAN');
      expect(messageInTerminal?.className).toContain('text-cyan-400');
    });
  });
});
