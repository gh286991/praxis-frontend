import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { vi, describe, it, expect, beforeEach } from 'vitest';
import LoginPage from './page';
import { useRouter } from 'next/navigation';

// Mock useRouter
vi.mock('next/navigation', () => ({
  useRouter: vi.fn(),
}));

// Mock next/link
vi.mock('next/link', () => ({
  default: ({ children }: { children: React.ReactNode }) => children,
}));

// Mock child components
vi.mock('@/components/PraxisLogo', () => ({ PraxisLogo: () => <div>MockLogo</div> }));
vi.mock('@/components/TerminalWindow', () => ({ TerminalWindow: ({ children }: any) => <div>{children}</div> }));
vi.mock('@/components/landing/Footer', () => ({ Footer: () => <div>MockFooter</div> }));
vi.mock('@/components/CyberpunkBackground', () => ({ CyberpunkBackground: () => <div>MockBg</div> }));

// Mock fetch
global.fetch = vi.fn();

describe('LoginPage', () => {
  const mockRouter = {
    push: vi.fn(),
  };

  beforeEach(() => {
    vi.clearAllMocks();
    (useRouter as any).mockReturnValue(mockRouter);
  });

  it('submits login form with credentials: include', async () => {
    render(<LoginPage />);

    // Fill in form
    const emailInput = screen.getByPlaceholderText('dev@example.com');
    // Password input doesn't have a placeholder in the source, let's check or use validation
    // Checking source: it currently relies on state. 
    // Let's add placeholder to the component or find by type? 
    // Testing library recommends accessible queries. 
    // Let's check if I can add aria-label to Input in the code or just use placeholder if it exists.
    // The previous view_file showed password input only has type="password".
    // I will add a placeholder to the password input in the actual code first to make it better UX and testable.
    const passwordInput = screen.getByPlaceholderText('Password');
    
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    // Mock successful response
    (global.fetch as any).mockResolvedValueOnce({
      ok: true,
      json: async () => ({ success: true }),
    });

    // Submit form
    const submitButton = screen.getByRole('button', { name: /GRANT ACCESS/i });
    fireEvent.click(submitButton);

    await waitFor(() => {
        expect(global.fetch).toHaveBeenCalledWith(
            expect.stringContaining('/auth/dev/login'),
            expect.objectContaining({
                method: 'POST',
                credentials: 'include', // Verify this important flag
                body: JSON.stringify({ email: 'test@example.com', password: 'password123' }),
            })
        );
    });

    // Verify redirect
    expect(mockRouter.push).toHaveBeenCalledWith('/courses');
  });
});
