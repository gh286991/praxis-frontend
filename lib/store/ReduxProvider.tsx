'use client';
import { useEffect } from 'react';
import { Provider } from 'react-redux';
import { store, useAppDispatch, useAppSelector } from './index';
import { setUser, logout } from './slices/userSlice';

function AuthSync({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const user = useAppSelector((state) => state.user.profile);

  useEffect(() => {
    const token = localStorage.getItem('jwt_token');
    if (!token) return;

    if (!user) {
       fetch(`${process.env.NEXT_PUBLIC_BACKEND_URL || 'http://localhost:3001'}/users/profile`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
        .then((res) => {
          if (res.ok) return res.json();
          throw new Error('Unauthorized');
        })
        .then((data) => dispatch(setUser(data)))
        .catch(() => {
          localStorage.removeItem('jwt_token');
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
