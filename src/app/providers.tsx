'use client';

import { Provider } from 'react-redux';
import { store } from '@/store';
import { LocalDataProvider } from '@/lib/local-data';

export function Providers({ children }: { children: React.ReactNode }) {
  return (
    <Provider store={store}>
      <LocalDataProvider>{children}</LocalDataProvider>
    </Provider>
  );
}
