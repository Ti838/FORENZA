'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
  LayoutDashboard,
  Camera,
  ArrowRightLeft,
  ScanLine,
  FolderLock,
  User,
} from 'lucide-react'
import { AppRole } from '@/types'

interface MobileNavBarProps {
  role?: AppRole | string
}

export function MobileNavBar({ role = 'INVESTIGATING_OFFICER' }: MobileNavBarProps) {
  const pathname = usePathname()

  if (role === 'INVESTIGATING_OFFICER') {
    const tabs = [
      { label: 'Dashboard', href: '/officer/dashboard', icon: LayoutDashboard },
      { label: 'Cases', href: '/officer/cases', icon: FolderLock },
      { label: 'Capture', href: '/officer/capture', icon: Camera, primary: true },
      { label: 'Transfer', href: '/officer/transfer', icon: ArrowRightLeft },
      { label: 'Profile', href: '/officer/profile', icon: User },
    ]

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F1523]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe px-2 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href

            if (tab.primary) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center -top-4 relative group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 group-active:scale-95 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {tab.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    )
  }

  if (role === 'VAULT_CUSTODIAN') {
    const tabs = [
      { label: 'Vault', href: '/vault/dashboard', icon: LayoutDashboard },
      { label: 'Scan QR', href: '/vault/scan', icon: ScanLine, primary: true },
      { label: 'Inventory', href: '/vault/inventory', icon: FolderLock },
    ]

    return (
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-[#0F1523]/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 pb-safe px-4 py-1 shadow-lg">
        <div className="flex items-center justify-around">
          {tabs.map((tab) => {
            const Icon = tab.icon
            const isActive = pathname === tab.href

            if (tab.primary) {
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className="flex flex-col items-center -top-4 relative group"
                >
                  <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 text-white flex items-center justify-center shadow-lg shadow-blue-600/40 group-active:scale-95 transition-transform">
                    <Icon className="w-6 h-6" />
                  </div>
                  <span className="text-[10px] font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {tab.label}
                  </span>
                </Link>
              )
            }

            return (
              <Link
                key={tab.href}
                href={tab.href}
                className={`flex flex-col items-center p-2 rounded-lg transition-colors ${
                  isActive
                    ? 'text-blue-600 dark:text-blue-400 font-bold'
                    : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-5 h-5" />
                <span className="text-[10px] mt-0.5">{tab.label}</span>
              </Link>
            )
          })}
        </div>
      </nav>
    )
  }

  return null
}
