'use client';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './index';
import { setUser, logout } from './slices/userSlice';

function AuthSync({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.profile);

  useEffect(() => {
    if (!user) {
       // Use relative path to go through Next.js proxy for proper cookie handling
       fetch('/api/users/profile', {
        credentials: 'include',
      })
        .then((res) => {
          if (res.ok) return res.json();
          // If valid user fetch fails (e.g. 401), just return null, don't throw to avoid noise
          // unless we want to ensure logout
          throw new Error('Unauthorized');
        })
        .then((data) => dispatch(setUser(data)))
        .catch(() => {
          // Just ensure state is clean, do not remove token as it is cookie based now
          // and we don't have access to clear HttpOnly cookies here anyway.
          dispatch(logout());
        });
    }
  }, [dispatch, user]);

  return <>{children}</>;
}

export function ReduxProvider({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <AuthSync>{children}</AuthSync>
    </Provider>
  );
}
