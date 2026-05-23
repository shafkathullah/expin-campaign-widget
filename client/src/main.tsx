import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { NuqsAdapter } from 'nuqs/adapters/react';
import App from './App';
import { I18nProvider } from './i18n/I18nProvider';
import { AppToaster } from './components/AppToaster';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
      staleTime: 30_000,
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <NuqsAdapter>
      <QueryClientProvider client={queryClient}>
        <I18nProvider>
          <App />
          <AppToaster />
        </I18nProvider>
      </QueryClientProvider>
    </NuqsAdapter>
  </React.StrictMode>,
);
