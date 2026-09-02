'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { EvidenceCard } from '@/components/forensic/EvidenceCard'
import {
  Camera,
  FolderLock,
  ArrowRightLeft,
  Fingerprint,
  Compass,
  Loader2,
} from 'lucide-react'
import Link from 'next/link'

interface SessionUser {
  id: string
  full_name: string
  email: string
  badge_number: string | null
  roles: string[]
}

interface EvidenceItem {
  id: string
  evidence_number: string
  status: string
  master_hash: string | null
  case?: { case_number: string }
  current_holder?: { full_name: string }
  classification?: {
    ai_object?: string
    ai_category?: string
    ai_confidence?: number
    final_category?: string
    final_object?: string
    classification_method?: string
  }
}

interface DashboardStats {
  active_cases: number
  evidence_captured_today: number
  pending_transfers: number
  recent_evidence: EvidenceItem[]
}

export default function OfficerDashboard() {
  const [session, setSession] = useState<SessionUser | null>(null)
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const loadDashboard = async () => {
      try {
        // Fetch session
        const sessionRes = await fetch('/api/auth/session')
        if (sessionRes.ok) {
          const s = await sessionRes.json()
          if (s.authenticated) setSession(s.user)
        }

        // Fetch assigned cases count
        const casesRes = await fetch('/api/cases?status=ACTIVE&per_page=100')
        const evidenceRes = await fetch('/api/evidence?per_page=10&sort=created_at_desc')

        let activeCases = 0
        let recentEvidence: EvidenceItem[] = []

        if (casesRes.ok) {
          const cData = await casesRes.json()
          activeCases = cData.total ?? 0
        }

        if (evidenceRes.ok) {
          const eData = await evidenceRes.json()
          recentEvidence = eData.data ?? []
        }

        setStats({
          active_cases: activeCases,
          evidence_captured_today: recentEvidence.filter((e: EvidenceItem) => {
            const created = new Date((e as any).created_at ?? '')
            const today = new Date()
            return created.toDateString() === today.toDateString()
          }).length,
          pending_transfers: recentEvidence.filter((e: EvidenceItem) => e.status === 'SEALED').length,
          recent_evidence: recentEvidence.slice(0, 4),
        })
      } catch (err) {
        console.error('[FORENZA OFFICER DASHBOARD]', err)
      } finally {
        setLoading(false)
      }
    }

    loadDashboard()
  }, [])

  const displayName = session
    ? session.full_name.split(' ').slice(-1)[0] // Last name
    : 'Officer'

  const greeting = (() => {
    const h = new Date().getHours()
    if (h < 12) return 'Good Morning'
    if (h < 17) return 'Good Afternoon'
    return 'Good Evening'
  })()

  return (
    <AppShell
      role="INVESTIGATING_OFFICER"
      title="Field Evidence Dashboard"
      breadcrumbs={[{ label: 'Home' }, { label: 'Officer Field Desk' }]}
      userName={session?.full_name ?? 'Loading…'}
      userEmail={session?.email}
      badgeNumber={session?.badge_number ?? undefined}
    >
      <div className="space-y-6">
        {/* Welcome & Primary Field CTA Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
            <Fingerprint className="w-64 h-64" />
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5 text-blue-200" />
              <span>GPS Geofence Tracking Active</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              {greeting}, Officer {displayName}
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1.5 leading-relaxed">
              You have <strong>{loading ? '…' : stats?.active_cases ?? 0}</strong> active assigned case(s).
              Ready to register and seal forensic evidence items.
            </p>

            <div className="mt-6 flex items-center flex-wrap gap-3">
              <Link
                href="/officer/capture"
                className="inline-flex items-center gap-2 px-6 py-3.5 rounded-2xl bg-white text-blue-600 font-extrabold text-sm shadow-lg shadow-black/10 hover:bg-blue-50 active:scale-95 transition-all"
              >
                <Camera className="w-5 h-5 text-blue-600" />
                <span>CAPTURE EVIDENCE NOW</span>
              </Link>

              <Link
                href="/officer/cases"
                className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/10 hover:bg-white/20 text-white font-bold text-sm backdrop-blur-md transition-colors"
              >
                <FolderLock className="w-4 h-4" />
                <span>View Assigned Cases</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 sm:gap-4">
          <div className="forenza-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs text-slate-500 font-medium block">Active Assigned Cases</span>
            <span className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1 block">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" /> : stats?.active_cases ?? 0}
            </span>
          </div>

          <div className="forenza-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs text-slate-500 font-medium block">Items Acquired Today</span>
            <span className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" /> : stats?.evidence_captured_today ?? 0}
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 forenza-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs text-slate-500 font-medium block">Pending Custody Transfers</span>
            <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" /> : stats?.pending_transfers ?? 0}
            </span>
          </div>
        </div>

        {/* Recent Field Evidence Items */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              Recently Acquired Evidence Items
            </h3>
            <Link
              href="/officer/transfer"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              <ArrowRightLeft className="w-3.5 h-3.5" />
              Initiate Handover
            </Link>
          </div>

          {loading ? (
            <div className="text-center p-8 text-slate-500 text-sm">Loading evidence…</div>
          ) : (stats?.recent_evidence?.length ?? 0) === 0 ? (
            <div className="text-center p-8 text-slate-500 text-sm rounded-2xl border border-dashed border-slate-200 dark:border-slate-700">
              No evidence acquired yet. Use the CAPTURE button above to begin.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {stats?.recent_evidence.map((ev) => (
                <EvidenceCard
                  key={ev.id}
                  evidence={ev as any}
                  href={`/officer/evidence/${ev.id}`}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
