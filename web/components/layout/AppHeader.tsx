'use client'

import { useState } from 'react'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  Bell,
  Search,
  ShieldCheck,
  ShieldAlert,
  ChevronRight,
  Menu,
  X,
  Lock,
} from 'lucide-react'
import Link from 'next/link'

interface AppHeaderProps {
  title: string
  breadcrumbs?: { label: string; href?: string }[]
  onMenuToggle?: () => void
  showSearch?: boolean
  searchPlaceholder?: string
  onSearchChange?: (val: string) => void
  systemStatus?: 'HEALTHY' | 'ALERT' | 'TAMPER_DETECTED'
}

export function AppHeader({
  title,
  breadcrumbs = [],
  onMenuToggle,
  showSearch = false,
  searchPlaceholder = 'Search case ID, evidence ID, or officer...',
  onSearchChange,
  systemStatus = 'HEALTHY',
}: AppHeaderProps) {
  const [searchValue, setSearchValue] = useState('')

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value)
    onSearchChange?.(e.target.value)
  }

  return (
    <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-[#0F1523]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 flex items-center justify-between px-4 sm:px-6 transition-colors">
      {/* Left: Mobile Menu Trigger & Title / Breadcrumbs */}
      <div className="flex items-center gap-3">
        {onMenuToggle && (
          <button
            type="button"
            onClick={onMenuToggle}
            className="lg:hidden p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <Menu className="w-5 h-5" />
          </button>
        )}

        <div>
          {/* Breadcrumbs */}
          {breadcrumbs.length > 0 && (
            <nav className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
              {breadcrumbs.map((crumb, idx) => (
                <span key={idx} className="flex items-center gap-1">
                  {crumb.href ? (
                    <Link
                      href={crumb.href}
                      className="hover:text-blue-600 dark:hover:text-blue-400 font-medium transition-colors"
                    >
                      {crumb.label}
                    </Link>
                  ) : (
                    <span>{crumb.label}</span>
                  )}
                  {idx < breadcrumbs.length - 1 && <ChevronRight className="w-3 h-3 text-slate-400" />}
                </span>
              ))}
            </nav>
          )}

          <h1 className="text-base sm:text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight leading-none">
            {title}
          </h1>
        </div>
      </div>

      {/* Center: Search Bar (if enabled) */}
      {showSearch && (
        <div className="hidden md:flex items-center max-w-md w-full mx-4">
          <div className="relative w-full">
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={searchValue}
              onChange={handleSearch}
              placeholder={searchPlaceholder}
              className="w-full pl-9 pr-4 py-1.5 rounded-lg text-xs bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 transition-all font-mono"
            />
          </div>
        </div>
      )}

      {/* Right: Security Status & Controls */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* System Cryptographic Status Badge */}
        {systemStatus === 'HEALTHY' ? (
          <div className="hidden sm:inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-[11px] font-semibold">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500" />
            <span>CHAIN SECURED</span>
          </div>
        ) : (
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-50 dark:bg-red-950/60 border border-red-300 dark:border-red-800 text-red-700 dark:text-red-300 text-[11px] font-bold animate-pulse">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500" />
            <span>TAMPER ALERT</span>
          </div>
        )}

        <div className="hidden sm:block">
          <ThemeToggle />
        </div>

        {/* Security Notification Bell */}
        <button
          type="button"
          className="relative p-2 rounded-lg text-slate-500 hover:text-slate-900 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          title="Security Notifications"
        >
          <Bell className="w-4 h-4" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-blue-600" />
        </button>
      </div>
    </header>
  )
}
