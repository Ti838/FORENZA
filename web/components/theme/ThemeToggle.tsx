'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon, Laptop } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <div
      className={`inline-flex items-center p-1 rounded-lg bg-slate-200/70 dark:bg-slate-800/80 border border-slate-300/50 dark:border-slate-700/50 text-slate-600 dark:text-slate-300 text-xs font-medium ${className}`}
    >
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          theme === 'light'
            ? 'bg-white text-blue-600 dark:bg-slate-700 shadow-xs font-semibold'
            : 'hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Light Mode"
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 text-blue-400 dark:bg-slate-900/90 shadow-xs font-semibold'
            : 'hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Dark Mode"
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all ${
          theme === 'system'
            ? 'bg-blue-600 text-white shadow-xs font-semibold'
            : 'hover:text-slate-900 dark:hover:text-white'
        }`}
        title="System Preference"
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="hidden md:inline">Auto</span>
      </button>
    </div>
  )
}
