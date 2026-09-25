"use client";
import * as React from "react";
import { Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";

export function ThemeToggle() {
  const { theme, setTheme } = useTheme();

  return (
    <button
      onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
      className="inline-flex items-center justify-center p-1.5 bg-primary-600 hover:bg-primary-500 text-white rounded-md shadow-[inset_1.5px_1.5px_3px_rgba(255,255,255,0.3),inset_-1.5px_-1.5px_3px_rgba(var(--primary-rgb),0.8),2px_2px_5px_rgba(0,0,0,0.15)] hover:shadow-[inset_2px_2px_4px_rgba(255,255,255,0.4),inset_-2px_-2px_4px_rgba(var(--primary-rgb),0.9),3px_3px_8px_rgba(0,0,0,0.2)] active:shadow-[inset_0.5px_0.5px_1px_rgba(255,255,255,0.2),inset_-0.5px_-0.5px_1px_rgba(var(--primary-rgb),0.5),1px_1px_2px_rgba(0,0,0,0.05)] active:scale-95 transition-all duration-200"
    >
      <Sun className="h-3.5 w-3.5 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0 text-white" />
      <Moon className="absolute h-3.5 w-3.5 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100 text-white" />
      <span className="sr-only">Toggle theme</span>
    </button>
  );
}
