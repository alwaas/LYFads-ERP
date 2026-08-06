import React from 'react';
import ReactDOM from 'react-dom/client';

import App from './App';
import './styles/globals.css';
import { Toaster } from "react-hot-toast";
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes tak data fresh rahega, baar-baar API hit nahi hogi
      refetchOnWindowFocus: false, // Tab switch karne par unnecessary API call nahi maregi
    },
  },
});

ReactDOM.createRoot(document.getElementById('root')!).render(
    <React.StrictMode>
      <QueryClientProvider client={queryClient}>
        <App />
        <Toaster
          position="top-right"
          reverseOrder={false}
          toastOptions={{
            duration: 3000,
          }}
        />
    </QueryClientProvider>
  </React.StrictMode>,
);