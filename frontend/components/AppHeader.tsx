"use client";

import { usePathname } from "next/navigation";
import { AuthButtons } from "@/components/AuthButtons";
import { useTheme } from "next-themes";
import { Sun, Moon } from "lucide-react";

function ThemeToggle() {
  const { theme, setTheme } = useTheme();
  return (
    <button
      aria-label="Toggle theme"
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="ml-4 p-2 rounded hover:bg-gray-200 dark:hover:bg-gray-700"
    >
      {theme === "dark" ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
    </button>
  );
}

export function AppHeader() {
  const pathname = usePathname();
  if (pathname === "/") return null;
  return (
    <header className="w-full flex justify-between items-center px-6 py-4 bg-background border-b border-gray-200">
      <div className="font-bold text-xl">BG-Remover</div>
      <div className="flex items-center">
        <AuthButtons />
        <ThemeToggle />
      </div>
    </header>
  );
} 