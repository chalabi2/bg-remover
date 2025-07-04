"use client";

import { usePathname } from "next/navigation";
import { useSession } from "next-auth/react";
import { AuthButtons } from "@/components/AuthButtons";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="ml-4 p-2 rounded hover:bg-muted focus:outline-none focus:ring-2 focus:ring-ring"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  const { status } = useSession();
  
  // Hide header only on landing page (root path + unauthenticated)
  // Show header on all other pages and when authenticated (even on root)
  if (pathname === "/" && status === "unauthenticated") {
    return null;
  }
  
  return (
    <header className="w-full flex justify-between items-center px-6 py-4 bg-background border-b border-border">
      <div className="font-bold text-xl text-foreground">BG-Remover</div>
      <div className="flex items-center">
        <AuthButtons />
        <ThemeToggle />
      </div>
    </header>
  );
} 