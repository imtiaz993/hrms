'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { useAppDispatch } from '@/store/hooks';
import { setUser, setLoading } from '@/store/authSlice';
import { Employee } from '@/types';

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const dispatch = useAppDispatch();
  const router = useRouter();

  useEffect(() => {
    const initAuth = async () => {
      dispatch(setLoading(true));

      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (employee) {
          dispatch(setUser(employee as Employee));
        }
      }

      dispatch(setLoading(false));
    };

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'SIGNED_IN' && session?.user) {
        const { data: employee } = await supabase
          .from('employees')
          .select('*')
          .eq('id', session.user.id)
          .single();

        if (employee) {
          dispatch(setUser(employee as Employee));
        }
      } else if (event === 'SIGNED_OUT') {
        dispatch(setUser(null));
        router.push('/login');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [dispatch, router]);

  return <>{children}</>;
}
