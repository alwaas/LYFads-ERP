import type { ReactNode } from "react";

import QueryProvider from "./providers/QueryProvider";

interface AppProvidersProps {
  children: ReactNode;
}

function AppProviders({ children }: AppProvidersProps) {
  return <QueryProvider>{children}</QueryProvider>;
}

export default AppProviders;