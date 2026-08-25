'use client'

import { useState } from 'react'
import { AppSidebar } from './AppSidebar'
import { AppHeader } from './AppHeader'
import { MobileNavBar } from '@/components/mobile/MobileNavBar'
import { AppRole } from '@/types'
import { X } from 'lucide-react'

interface AppShellProps {
  children: React.ReactNode
  role?: AppRole | string
  title: string
  breadcrumbs?: { label: string; href?: string }[]
  userName?: string
  userEmail?: string
  badgeNumber?: string | null
  showSearch?: boolean
  searchPlaceholder?: string
  onSearchChange?: (val: string) => void
  systemStatus?: 'HEALTHY' | 'ALERT' | 'TAMPER_DETECTED'
}

export function AppShell({
  children,
  role = 'SUPERVISOR',
  title,
  breadcrumbs = [],
  userName = 'Authorized Personnel',
  userEmail = 'personnel@forenza.gov',
  badgeNumber = null,
  showSearch = false,
  searchPlaceholder,
  onSearchChange,
  systemStatus = 'HEALTHY',
}: AppShellProps) {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

  return (
    <div className="min-h-screen flex bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Desktop Sidebar */}
      <div className="hidden lg:block shrink-0">
        <AppSidebar
          currentRole={role}
          userName={userName}
          userEmail={userEmail}
          badgeNumber={badgeNumber}
        />
      </div>

      {/* Mobile Drawer Backdrop */}
      {mobileMenuOpen && (
        <div
          className="lg:hidden fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-xs flex"
          onClick={() => setMobileMenuOpen(false)}
        >
          <div
            className="w-72 max-w-[80vw] h-full bg-white dark:bg-[#0F1523] shadow-2xl relative flex flex-col justify-between"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="absolute top-4 right-4">
              <button
                type="button"
                onClick={() => setMobileMenuOpen(false)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <AppSidebar
              currentRole={role}
              userName={userName}
              userEmail={userEmail}
              badgeNumber={badgeNumber}
            />
          </div>
        </div>
      )}

      {/* Main Container */}
      <div className="flex-1 flex flex-col min-w-0 pb-16 md:pb-0">
        <AppHeader
          title={title}
          breadcrumbs={breadcrumbs}
          onMenuToggle={() => setMobileMenuOpen(true)}
          showSearch={showSearch}
          searchPlaceholder={searchPlaceholder}
          onSearchChange={onSearchChange}
          systemStatus={systemStatus}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto animate-in fade-in duration-150">
          {children}
        </main>

        {/* Mobile Navigation Bar for Field Workflows */}
        <MobileNavBar role={role} />
      </div>
    </div>
  )
}
