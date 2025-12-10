'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAppDispatch } from '@/store/hooks';
import { setUser, setLoading } from '@/store/authSlice';
import { Employee } from '@/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
      dispatch(setLoading(true));
    const storedUser = typeof window !== 'undefined' ? localStorage.getItem('hrmsCurrentUser') : null;
    if (storedUser) {
      const parsed = JSON.parse(storedUser) as Employee;
      dispatch(setUser(parsed));
    } else {
      dispatch(setUser(null));
        }
      dispatch(setLoading(false));
  }, [dispatch, router]);

  return <>{children}</>;
}
