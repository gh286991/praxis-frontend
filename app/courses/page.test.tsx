import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import CoursesPage from './page';
import { useRouter } from 'next/navigation';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser } from '@/lib/store/slices/userSlice';

// Mock dependencies
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

vi.mock('@/lib/store', () => ({
  useAppDispatch: vi.fn(),
  useAppSelector: vi.fn(),
}));

vi.mock('@/lib/store/slices/userSlice', () => ({
  setUser: vi.fn(),
  logout: vi.fn(),
}));

vi.mock('@/lib/store/slices/subjectsSlice', () => ({
  setSubjects: vi.fn(),
  setLoading: vi.fn(),
  fetchAllStats: vi.fn(),
}));

vi.mock('@/lib/api', () => ({
  getSubjects: vi.fn().mockResolvedValue([]),
}));

// Mock child components
vi.mock('@/components/AppNavbar', () => ({ AppNavbar: () => <div>MockNavbar</div> }));
vi.mock('@/components/landing/Footer', () => ({ Footer: () => <div>MockFooter</div> }));
vi.mock('@/components/CyberpunkBackground', () => ({ CyberpunkBackground: () => <div>MockBg</div> }));
vi.mock('@/components/ProgressStats', () => ({ ProgressStats: () => <div>MockStats</div> }));

// Mock fetch
global.fetch = vi.fn();

describe('CoursesPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };
  const mockDispatch = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
    (useAppDispatch as any).mockReturnValue(mockDispatch);
    
    // Default selector mock: no user, no subjects
    (useAppSelector as any).mockImplementation((selector: any) => {
        // user selector
        if (selector.toString().includes('state.user.profile')) return null;
        // subjects selector
        return { subjects: [], loading: false, stats: [] };
    });
  });

  it('fetches user profile with credentials: include when user is missing', async () => {
    // Mock fetch response for profile
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ name: 'Test User' }),
    });

    render(<CoursesPage />);

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/users/profile'),
            expect.objectContaining({
                credentials: 'include', // Verify this important flag
            })
        );
    });

    await waitFor(() => {
        expect(setUser).toHaveBeenCalledWith({ name: 'Test User' });
        expect(mockDispatch).toHaveBeenCalled();
    });
  });
  it('navigates to subject page when card is clicked', async () => {
    // Mock user present
    (useAppSelector as any).mockImplementation((selector: any) => {
        if (selector.toString().includes('state.user.profile')) return { name: 'Test User' };
        return { 
            subjects: [{ _id: '1', name: 'Python', slug: 'python', icon: '🐍' }], 
            loading: false, 
            stats: [] 
        };
    });

    render(<CoursesPage />);
    
    // Find button and click
    const button = screen.getByText('ACCESS MODULE');
    // fireEvent.click(button); 
    // Button is inside a button, just click the text or the button role
    const accessButton = screen.getByRole('button', { name: /ACCESS MODULE/i });
    accessButton.click();

    await waitFor(() => {
        expect(mockRouter.push).toHaveBeenCalledWith('/subject/python');
    });
  });
});
