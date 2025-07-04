'use client'

import { ThemeProvider } from 'next-themes'
import { SessionProvider } from "next-auth/react"
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { ReactQueryDevtools } from '@tanstack/react-query-devtools'
import { Toaster } from "@/components/ui/toaster"
import { useState } from 'react'

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 60 * 1000, // 1 minute
        retry: 1,
      },
    },
  }))

  return (
    <QueryClientProvider client={queryClient}>
      <SessionProvider basePath="/api/auth">
        <ThemeProvider attribute="class" defaultTheme="system" enableSystem>
          {children}
          <Toaster />
          <ReactQueryDevtools initialIsOpen={false} />
        </ThemeProvider>
      </SessionProvider>
    </QueryClientProvider>
  )
}