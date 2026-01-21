import { useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/store';
import { setUser, logout as logoutAction } from '@/lib/store/slices/userSlice';

export function useAuth() {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.profile);
  const isAuthenticated = useAppSelector((state) => state.user.isAuthenticated);
  const hasCheckedAuth = useRef(false);

  const checkAuth = useCallback(async () => {
    // If already checked, return current auth state from Redux
    // This prevents returning undefined when called multiple times
    if (hasCheckedAuth.current) {
      return isAuthenticated;
    }
    hasCheckedAuth.current = true;

    try {
      const res = await fetch('/api/users/profile', {
        credentials: 'include',
      });

      if (res.ok) {
        const data = await res.json();
        dispatch(setUser(data));
        return true;
      } else {
        // Token exists but is invalid, clear it
        await logout();
        return false;
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      await logout();
      return false;
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [dispatch, isAuthenticated]); // logout is defined below, so we disable the warning

  /**
   * Logout user and clear all authentication state
   */
  const logout = useCallback(async () => {
    try {
      // Call backend to clear cookie
      await fetch('/api/auth/logout', { 
        method: 'POST',
        credentials: 'include',
      });
    } catch (error) {
      console.error('Logout API failed:', error);
    } finally {
      // Always clear Redux state, even if API fails
      dispatch(logoutAction());
      hasCheckedAuth.current = false;
    }
  }, [dispatch]);

  /**
   * Login with credentials
   */
  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/dev/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ email, password }),
      });

      if (res.ok) {
        const data = await res.json();
        dispatch(setUser(data));
        return { success: true };
      } else {
        return { success: false, error: 'Invalid credentials' };
      }
    } catch (error) {
      console.error('Login failed:', error);
      return { success: false, error: 'Connection error' };
    }
  }, [dispatch]);

  return {
    user,
    isAuthenticated,
    checkAuth,
    logout,
    login,
  };
}
