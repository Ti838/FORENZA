'use client'

import { useTheme } from './ThemeProvider'
import { Sun, Moon, Laptop } from 'lucide-react'

export function ThemeToggle({ className = '', variant = 'compact' }: { className?: string; variant?: 'compact' | 'pill' }) {
  const { theme, setTheme, resolvedTheme } = useTheme()

  const cycleTheme = () => {
    if (theme === 'light') {
      setTheme('dark')
    } else if (theme === 'dark') {
      setTheme('system')
    } else {
      setTheme('light')
    }
  }

  if (variant === 'pill') {
    return (
      <div
        className={`inline-flex items-center p-1 rounded-xl bg-slate-200/80 dark:bg-slate-800/90 border border-slate-300/60 dark:border-slate-700/60 text-slate-600 dark:text-slate-300 text-xs font-semibold shadow-xs ${className}`}
      >
        <button
          type="button"
          onClick={() => setTheme('light')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
            theme === 'light' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Force Light Theme"
        >
          <Sun className="w-3.5 h-3.5" />
          <span>Light</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('dark')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
            theme === 'dark'
              ? 'bg-slate-900 text-blue-400 dark:bg-[#0B0F19] dark:text-blue-400 shadow-xs border border-slate-700/50'
              : 'hover:text-slate-900 dark:hover:text-white'
          }`}
          title="Force Dark Theme"
        >
          <Moon className="w-3.5 h-3.5" />
          <span>Dark</span>
        </button>

        <button
          type="button"
          onClick={() => setTheme('system')}
          className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg transition-all ${
            theme === 'system' ? 'bg-blue-600 text-white shadow-xs' : 'hover:text-slate-900 dark:hover:text-white'
          }`}
          title={`Follow System OS Theme (${resolvedTheme.toUpperCase()})`}
        >
          <Laptop className="w-3.5 h-3.5" />
          <span>Auto</span>
        </button>
      </div>
    )
  }

  // Modern sleek 1-button cycle toggle (Light -> Dark -> Auto)
  return (
    <button
      type="button"
      onClick={cycleTheme}
      className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-100 dark:bg-slate-800/80 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-semibold border border-slate-200 dark:border-slate-700/80 shadow-xs transition-all cursor-pointer ${className}`}
      title={`Theme: ${theme.toUpperCase()} (Click to toggle Light / Dark / Auto)`}
    >
      {theme === 'light' && (
        <>
          <Sun className="w-4 h-4 text-amber-500" />
          <span className="text-[11px] font-mono font-bold">Light</span>
        </>
      )}
      {theme === 'dark' && (
        <>
          <Moon className="w-4 h-4 text-blue-400" />
          <span className="text-[11px] font-mono font-bold">Dark</span>
        </>
      )}
      {theme === 'system' && (
        <>
          <Laptop className="w-4 h-4 text-emerald-500" />
          <span className="text-[11px] font-mono font-bold">Auto</span>
        </>
      )}
    </button>
  )
}
