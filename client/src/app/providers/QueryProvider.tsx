import {
  QueryClient,
  QueryClientProvider,
} from "@tanstack/react-query";

import type { ReactNode } from "react";

interface QueryProviderProps {
  children: ReactNode;
}

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 minutes

      gcTime: 1000 * 60 * 30, // 30 minutes

      retry: 1,

      refetchOnWindowFocus: false,

      refetchOnReconnect: false,
    },

    mutations: {
      retry: false,
    },
  },
});

function QueryProvider({
  children,
}: QueryProviderProps) {
  return (
    <QueryClientProvider client={queryClient}>
      {children}
    </QueryClientProvider>
  );
}

export default QueryProvider;