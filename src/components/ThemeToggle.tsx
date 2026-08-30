"use client";

import { useTheme } from "@/components/ThemeProvider";
import { Sun, Moon } from "lucide-react";

interface ThemeToggleProps {
  className?: string;
  showLabel?: boolean;
}

export default function ThemeToggle({ className = "", showLabel = false }: ThemeToggleProps) {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      title={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      aria-label={isDark ? "Switch to Light Theme" : "Switch to Dark Theme"}
      className={`group relative flex items-center justify-center gap-1.5 rounded-xl border transition-all duration-200 active:scale-95 cursor-pointer select-none ${
        isDark
          ? "border-white/[0.08] bg-obsidian-900/80 text-amber-400 hover:bg-white/[0.08] hover:text-amber-300 shadow-2xs"
          : "border-zinc-200 bg-white text-zinc-700 hover:bg-zinc-100 hover:text-zinc-950 shadow-2xs"
      } ${showLabel ? "h-8 px-2.5 sm:px-3 text-xs font-semibold" : "h-8 w-8"} ${className}`}
    >
      <div className="relative flex items-center justify-center">
        {isDark ? (
          <Sun className="h-4 w-4 transition-transform duration-300 group-hover:rotate-45 text-amber-400" />
        ) : (
          <Moon className="h-4 w-4 transition-transform duration-300 group-hover:-rotate-12 text-zinc-700" />
        )}
      </div>
      {showLabel && (
        <span className="font-mono text-[11px] uppercase tracking-wider">
          {isDark ? "Dark" : "Light"}
        </span>
      )}
    </button>
  );
}
