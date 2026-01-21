import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { TerminalWindow } from './TerminalWindow';

describe('TerminalWindow', () => {
  describe('rendering', () => {
    it('should render with default title', () => {
      render(<TerminalWindow>Content</TerminalWindow>);
      expect(screen.getByText('Terminal')).toBeInTheDocument();
    });

    it('should render with custom title', () => {
      render(<TerminalWindow title="Custom Title">Content</TerminalWindow>);
      expect(screen.getByText('Custom Title')).toBeInTheDocument();
    });

    it('should render children content', () => {
      render(<TerminalWindow>Test Content</TerminalWindow>);
      expect(screen.getByText('Test Content')).toBeInTheDocument();
    });

    it('should apply custom className', () => {
      const { container } = render(
        <TerminalWindow className="custom-class">Content</TerminalWindow>
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });
  });

  describe('terminal controls', () => {
    it('should render three window control buttons', () => {
      const { container } = render(<TerminalWindow>Content</TerminalWindow>);
      const controlButtons = container.querySelectorAll('.rounded-full');
      expect(controlButtons.length).toBe(3);
    });
  });
});
