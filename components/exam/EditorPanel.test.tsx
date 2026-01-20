import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EditorPanel } from './EditorPanel';

// Mock Monaco Editor with data-testid for stable selection
vi.mock('@monaco-editor/react', () => ({
  default: ({ value, onChange }: { value: string; onChange: (value: string | undefined) => void }) => (
    <textarea
      data-testid="code-editor"
      aria-label="程式碼編輯器"
      value={value}
      onChange={(e) => onChange(e.target.value)}
    />
  ),
}));

describe('EditorPanel', () => {
  const defaultProps = {
    code: 'print("Hello World")',
    onChange: vi.fn(),
    onRun: vi.fn(),
    isExecuting: false,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should display the file name', () => {
      render(<EditorPanel {...defaultProps} />);
      expect(screen.getByText('solution.py')).toBeInTheDocument();
    });

    it('should display the run button with accessible name', () => {
      render(<EditorPanel {...defaultProps} />);
      // 使用 getByRole 更穩定
      expect(screen.getByRole('button', { name: /執行程式碼/i })).toBeInTheDocument();
    });

    it('should render the editor with the provided code', () => {
      render(<EditorPanel {...defaultProps} />);
      const editor = screen.getByTestId('code-editor');
      expect(editor).toHaveValue('print("Hello World")');
    });
  });

  describe('run button interactions', () => {
    it('should call onRun when clicked', async () => {
      const user = userEvent.setup();
      render(<EditorPanel {...defaultProps} />);
      
      const runButton = screen.getByRole('button', { name: /執行程式碼/i });
      await user.click(runButton);
      
      expect(defaultProps.onRun).toHaveBeenCalledTimes(1);
    });

    it('should be disabled when isExecuting is true', () => {
      render(<EditorPanel {...defaultProps} isExecuting={true} />);
      
      const runButton = screen.getByRole('button', { name: /執行程式碼/i });
      expect(runButton).toBeDisabled();
    });

    it('should be enabled when isExecuting is false', () => {
      render(<EditorPanel {...defaultProps} isExecuting={false} />);
      
      const runButton = screen.getByRole('button', { name: /執行程式碼/i });
      expect(runButton).toBeEnabled();
    });

    it('should not call onRun when button is disabled', async () => {
      const user = userEvent.setup();
      render(<EditorPanel {...defaultProps} isExecuting={true} />);
      
      const runButton = screen.getByRole('button', { name: /執行程式碼/i });
      await user.click(runButton);
      
      // Disabled buttons don't trigger click events
      expect(defaultProps.onRun).not.toHaveBeenCalled();
    });
  });

  describe('code editing', () => {
    it('should call onChange when editor content changes', async () => {
      const user = userEvent.setup();
      render(<EditorPanel {...defaultProps} />);
      
      const editor = screen.getByTestId('code-editor');
      await user.clear(editor);
      await user.type(editor, 'print("New")');
      
      // onChange is called for each character typed
      expect(defaultProps.onChange).toHaveBeenCalled();
    });
  });

  describe('loading state visual feedback', () => {
    it('should visually indicate loading state on button', () => {
      render(<EditorPanel {...defaultProps} isExecuting={true} />);
      
      const runButton = screen.getByRole('button', { name: /執行程式碼/i });
      // 按鈕應該被禁用，這是最可靠的檢查方式
      expect(runButton).toBeDisabled();
    });
  });
});
