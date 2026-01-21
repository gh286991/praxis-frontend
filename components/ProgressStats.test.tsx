import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ProgressStats } from './ProgressStats';
import { ProgressStats as IProgressStats } from '../lib/store/slices/subjectsSlice';

describe('ProgressStats', () => {
  const mockStats: IProgressStats = {
    totalQuestions: 100,
    completedQuestions: 50,
    passedQuestions: 40,
    failedQuestions: 10,
    completionRate: 50,
    passRate: 80,
  };

  describe('loading state', () => {
    it('should show loading skeleton when loading is true', () => {
      const { container } = render(
        <ProgressStats stats={null} loading={true} />
      );
      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('null state', () => {
    it('should return null when stats is null and not loading', () => {
      const { container } = render(
        <ProgressStats stats={null} loading={false} />
      );
      expect(container.firstChild).toBeNull();
    });
  });

  describe('with stats data', () => {
    it('should display title', () => {
      render(<ProgressStats stats={mockStats} title="學習概況" />);
      expect(screen.getByText('學習概況')).toBeInTheDocument();
    });

    it('should display completed questions count', () => {
      render(<ProgressStats stats={mockStats} />);
      expect(screen.getByText('50')).toBeInTheDocument();
      expect(screen.getByText('總答題數')).toBeInTheDocument();
    });

    it('should display passed questions count', () => {
      render(<ProgressStats stats={mockStats} />);
      expect(screen.getByText('40')).toBeInTheDocument();
      expect(screen.getByText('答對題數')).toBeInTheDocument();
    });

    it('should display failed questions count', () => {
      render(<ProgressStats stats={mockStats} />);
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getByText('待加強')).toBeInTheDocument();
    });

    it('should display pass rate percentage', () => {
      render(<ProgressStats stats={mockStats} />);
      expect(screen.getByText('80%')).toBeInTheDocument();
      // 通過率 appears in both card label and progress bar legend
      const labels = screen.getAllByText('通過率');
      expect(labels.length).toBeGreaterThanOrEqual(1);
    });

    it('should render progress bar with correct width', () => {
      const { container } = render(<ProgressStats stats={mockStats} />);
      const progressBar = container.querySelector('[style*="width"]');
      expect(progressBar).toHaveStyle({ width: '80%' });
    });
  });

  describe('custom props', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ProgressStats stats={mockStats} className="custom-class" />
      );
      expect(container.firstChild).toHaveClass('custom-class');
    });

    it('should not render title when not provided', () => {
      render(<ProgressStats stats={mockStats} title="" />);
      expect(screen.queryByRole('heading', { level: 3 })).not.toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle zero stats correctly', () => {
      const zeroStats: IProgressStats = {
        totalQuestions: 0,
        completedQuestions: 0,
        passedQuestions: 0,
        failedQuestions: 0,
        completionRate: 0,
        passRate: 0,
      };
      render(<ProgressStats stats={zeroStats} />);
      // 0% appears in progress bar label
      const percentages = screen.getAllByText('0%');
      expect(percentages.length).toBeGreaterThanOrEqual(1);
    });

    it('should handle 100% pass rate', () => {
      const perfectStats: IProgressStats = {
        totalQuestions: 100,
        completedQuestions: 100,
        passedQuestions: 100,
        failedQuestions: 0,
        completionRate: 100,
        passRate: 100,
      };
      render(<ProgressStats stats={perfectStats} />);
      // 100% appears in both the pass rate card and progress bar label area
      const percentages = screen.getAllByText('100%');
      expect(percentages.length).toBeGreaterThanOrEqual(1);
    });
  });
});
