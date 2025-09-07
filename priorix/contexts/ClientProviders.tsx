"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { SessionProvider } from "next-auth/react";
import ToastProvider from "@/components/providers/ToastProvider";

interface ClientProvidersProps {
  children: React.ReactNode;
}

export default function ClientProviders({ children }: ClientProvidersProps) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 5 * 60 * 1000, // Cache data for 5 minutes
            gcTime: 10 * 60 * 1000, // Keep cache for 10 minutes after component unmounts
          },
        },
      })
  );

  return (
    <QueryClientProvider client={queryClient}>
      <ToastProvider />
      <SessionProvider>{children}</SessionProvider>
    </QueryClientProvider>
  );
}
