"use client";

import { useSession } from "next-auth/react";
import { LandingPage } from "@/components/LandingPage";

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const { status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background text-foreground">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <span className="ml-4 text-lg">Checking authentication…</span>
      </div>
    );
  }

  if (status === "unauthenticated") {
    return <LandingPage />;
  }

  return <>{children}</>;
} 