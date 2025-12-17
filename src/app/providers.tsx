'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { LocalDataProvider } from '@/lib/local-data';
import { ToastProvider } from '@/components/ui/toast';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <LocalDataProvider>
        <ToastProvider>
          {children}
        </ToastProvider>
      </LocalDataProvider>
    </Provider>
  );
}
