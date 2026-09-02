'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { ForenzaLogo } from '@/components/brand/ForenzaLogo'
import {
  LayoutDashboard,
  FolderLock,
  Fingerprint,
  ShieldCheck,
  ShieldAlert,
  ArrowRightLeft,
  SlidersHorizontal,
  History,
  FileCheck,
  Building2,
  FlaskConical,
  Gavel,
  Users,
  Smartphone,
  Activity,
  LogOut,
  ChevronRight,
  Shield,
  FileText,
  ScanLine,
} from 'lucide-react'
import { AppRole } from '@/types'
import { toast } from 'sonner'

interface AppSidebarProps {
  currentRole?: AppRole | string
  userName?: string
  userEmail?: string
  badgeNumber?: string | null
}

interface NavLinkItem {
  label: string
  href: string
  icon: any
  badge?: string
  highlight?: boolean
}

export function AppSidebar({
  currentRole = 'SUPERVISOR',
  userName = 'Special Agent',
  userEmail = 'agent@forenza.gov',
  badgeNumber = '4028',
}: AppSidebarProps) {
  const pathname = usePathname()
  const router = useRouter()

  const handleLogout = async () => {
    try {
      await fetch('/api/auth/logout', { method: 'POST' })
      toast.success('Logged out securely')
      router.push('/login')
    } catch {
      router.push('/login')
    }
  }

  // Navigation schema per role
  const getNavLinks = (): NavLinkItem[] => {
    switch (currentRole) {
      case 'ADMIN':
        return [
          { label: 'Master Oversight', href: '/admin/dashboard', icon: LayoutDashboard },
          { label: 'Live Transit Radar', href: '/supervisor/transit', icon: Activity },
          { label: 'Users & Personnel', href: '/admin/users', icon: Users },
          { label: 'Role Permissions', href: '/admin/roles', icon: SlidersHorizontal },
          { label: 'Approved Devices', href: '/admin/devices', icon: Smartphone },
          { label: 'Case Registry', href: '/admin/cases', icon: FolderLock },
          { label: 'Security Audit & IP Logs', href: '/admin/audit', icon: History },
          { label: 'Standards Compliance', href: '/admin/compliance', icon: ShieldCheck },
        ]
      case 'SUPERVISOR':
        return [
          { label: 'Command Center', href: '/supervisor/dashboard', icon: LayoutDashboard },
          { label: 'Active Cases', href: '/supervisor/cases', icon: FolderLock },
          { label: 'Evidence Vault', href: '/supervisor/evidence', icon: Fingerprint },
          { label: 'Geofence Overrides', href: '/supervisor/overrides', icon: ShieldAlert, badge: 'Active' },
          { label: 'Custody Transfers', href: '/supervisor/custody', icon: ArrowRightLeft },
          { label: 'Audit Trail', href: '/supervisor/audit', icon: History },
        ]
      case 'INVESTIGATING_OFFICER':
        return [
          { label: 'Field Dashboard', href: '/officer/dashboard', icon: LayoutDashboard },
          { label: 'My Cases', href: '/officer/cases', icon: FolderLock },
          { label: 'Capture Evidence', href: '/officer/capture', icon: Fingerprint, highlight: true },
          { label: 'Custody Transfer', href: '/officer/transfer', icon: ArrowRightLeft },
          { label: 'Evidence Registry', href: '/officer/evidence', icon: FileCheck },
        ]
      case 'VAULT_CUSTODIAN':
        return [
          { label: 'Vault Dashboard', href: '/vault/dashboard', icon: LayoutDashboard },
          { label: 'Scan Evidence QR', href: '/vault/scan', icon: ScanLine, highlight: true },
          { label: 'Incoming Transfers', href: '/vault/incoming', icon: ArrowRightLeft },
          { label: 'Storage Inventory', href: '/vault/inventory', icon: Building2 },
          { label: 'Audit Ledger', href: '/vault/audit', icon: History },
        ]
      case 'LAB_ANALYST':
        return [
          { label: 'Lab Dashboard', href: '/lab/dashboard', icon: LayoutDashboard },
          { label: 'Incoming Samples', href: '/lab/incoming', icon: ArrowRightLeft },
          { label: 'Evidence Analysis', href: '/lab/analysis', icon: FlaskConical },
          { label: 'Sample Custody', href: '/lab/samples', icon: Fingerprint },
          { label: 'Certified Reports', href: '/lab/reports', icon: FileCheck },
        ]
      case 'JUDGE':
        return [
          { label: 'Judicial Overview', href: '/judge/dashboard', icon: LayoutDashboard },
          { label: 'Case Dossiers', href: '/judge/cases', icon: FolderLock },
          { label: 'Evidence Timelines', href: '/judge/evidence', icon: History },
          { label: 'Tamper Verification', href: '/judge/integrity', icon: ShieldCheck },
          { label: 'Court Dossiers', href: '/judge/dossier', icon: Gavel },
        ]
      case 'AUDITOR':
        return [
          { label: 'Auditor Overview', href: '/auditor/dashboard', icon: LayoutDashboard },
          { label: 'Master Audit Logs', href: '/auditor/logs', icon: History },
          { label: 'Custody Chains', href: '/auditor/custody', icon: ArrowRightLeft },
          { label: 'Integrity Audits', href: '/auditor/integrity', icon: ShieldCheck },
          { label: 'Security Breaches', href: '/auditor/security', icon: ShieldAlert, badge: 'Alerts' },
        ]
      default:
        return [
          { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
          { label: 'Cases', href: '/cases', icon: FolderLock },
          { label: 'Evidence', href: '/evidence', icon: Fingerprint },
        ]
    }
  }

  const navLinks = getNavLinks()

  return (
    <aside className="w-64 shrink-0 h-screen sticky top-0 flex flex-col justify-between bg-white dark:bg-[#0F1523] border-r border-slate-200 dark:border-slate-800 select-none z-30 transition-colors">
      {/* Top Section: Logo & Role */}
      <div>
        <div className="p-5 border-b border-slate-100 dark:border-slate-800/80">
          <ForenzaLogo size="md" showTagline={true} linkToDashboard={true} />

          {/* Role Badge */}
          <div className="mt-3.5 flex items-center justify-between p-2 rounded-lg bg-blue-50/70 dark:bg-blue-950/40 border border-blue-100 dark:border-blue-900/40">
            <div className="flex items-center gap-2">
              <Shield className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
              <span className="text-[11px] font-bold tracking-wide text-blue-700 dark:text-blue-300 uppercase">
                {currentRole.replace(/_/g, ' ')}
              </span>
            </div>
            {badgeNumber && (
              <span className="text-[10px] font-mono font-bold text-slate-500 dark:text-slate-400">
                #{badgeNumber}
              </span>
            )}
          </div>
        </div>

        {/* Navigation List */}
        <nav className="p-3 space-y-1">
          {navLinks.map((link) => {
            const Icon = link.icon
            const isActive = pathname === link.href || pathname?.startsWith(`${link.href}/`)

            return (
              <Link
                key={link.href}
                href={link.href}
                className={`flex items-center justify-between px-3 py-2.5 rounded-lg text-xs font-semibold transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white shadow-sm shadow-blue-600/30'
                    : 'text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  <Icon className={`w-4 h-4 ${isActive ? 'text-white' : 'text-slate-400'}`} />
                  <span>{link.label}</span>
                </div>

                {link.badge && (
                  <span
                    className={`text-[9px] font-extrabold uppercase px-1.5 py-0.5 rounded ${
                      isActive
                        ? 'bg-blue-800 text-blue-200'
                        : 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                    }`}
                  >
                    {link.badge}
                  </span>
                )}
              </Link>
            )
          })}
        </nav>
      </div>

      {/* Bottom Section: Profile & Logout */}
      <div className="p-4 border-t border-slate-100 dark:border-slate-800/80">
        {/* User Card */}
        <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5 truncate">
            <div className="w-8 h-8 rounded-full bg-blue-600 text-white font-bold flex items-center justify-center text-xs shrink-0 shadow-xs">
              {userName.slice(0, 2).toUpperCase()}
            </div>
            <div className="truncate">
              <p className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">{userName}</p>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono truncate">{userEmail}</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleLogout}
            className="p-1.5 rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </aside>
  )
}
