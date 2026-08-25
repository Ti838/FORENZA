'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon, Laptop } from 'lucide-react'

export function ThemeToggle({ className = '' }: { className?: string }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  return (
    <div
      className={`inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-xs ${className}`}
    >
      {/* Light Mode Button */}
      <button
        type="button"
        onClick={() => setTheme('light')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
          theme === 'light'
            ? 'bg-white text-blue-600 shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Force Light Theme"
      >
        <Sun className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Light</span>
      </button>

      {/* Dark Mode Button */}
      <button
        type="button"
        onClick={() => setTheme('dark')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
          theme === 'dark'
            ? 'bg-slate-900 text-blue-400 dark:bg-[#0B0F19] dark:text-blue-400 shadow-xs border border-slate-700/50'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title="Force Dark Theme"
      >
        <Moon className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Dark</span>
      </button>

      {/* Auto / System Preference Button */}
      <button
        type="button"
        onClick={() => setTheme('system')}
        className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
          theme === 'system'
            ? 'bg-blue-600 text-white shadow-xs'
            : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
        }`}
        title={`Follow System OS Theme (Currently: ${resolvedTheme.toUpperCase()})`}
      >
        <Laptop className="w-3.5 h-3.5" />
        <span className="hidden sm:inline">Auto</span>
      </button>
    </div>
  )
}
