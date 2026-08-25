'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { EvidenceCard } from '@/components/forensic/EvidenceCard'
import {
  Camera,
  FolderLock,
  ArrowRightLeft,
  Fingerprint,
  Plus,
  Compass,
  MapPin,
  Clock,
  ShieldCheck,
} from 'lucide-react'
import Link from 'next/link'

export default function OfficerDashboard() {
  return (
    <AppShell
      role="INVESTIGATING_OFFICER"
      title="Field Evidence Dashboard"
      breadcrumbs={[{ label: 'Home' }, { label: 'Officer Field Desk' }]}
      userName="Detective Marcus Vance"
      userEmail="m.vance@forenza.gov"
      badgeNumber="4028"
    >
      <div className="space-y-6">
        {/* Welcome & Primary Field CTA Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-700 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          {/* Subtle Background Shield Pattern */}
          <div className="absolute right-0 top-0 bottom-0 opacity-10 flex items-center pr-6 pointer-events-none">
            <Fingerprint className="w-64 h-64" />
          </div>

          <div className="relative z-10 max-w-xl">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-semibold mb-3">
              <Compass className="w-3.5 h-3.5 text-blue-200" />
              <span>GPS Geofence Tracking Active • Zone #4</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Good Morning, Officer Vance
            </h2>
            <p className="text-xs sm:text-sm text-blue-100 mt-1.5 leading-relaxed">
              You are currently checked into crime scene perimeter{' '}
              <strong className="underline">CASE-2024-041</strong>. Ready to register and seal forensic evidence items.
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
              3
            </span>
          </div>

          <div className="forenza-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs text-slate-500 font-medium block">Items Acquired Today</span>
            <span className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1 block">
              5
            </span>
          </div>

          <div className="col-span-2 sm:col-span-1 forenza-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs text-slate-500 font-medium block">Pending Custody Transfers</span>
            <span className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1 block">
              1
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

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <EvidenceCard
              evidence={{
                evidence_number: 'EVD-2024-0089',
                status: 'SEALED',
                master_hash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
                case: { case_number: 'CASE-2024-041' },
                current_holder: { full_name: 'Detective Marcus Vance' },
                classification: {
                  ai_object: 'Semi-automatic Pistol 9mm',
                  ai_category: 'Weapon',
                  ai_confidence: 0.942,
                  final_category: 'Weapon',
                  final_object: 'Semi-automatic Pistol',
                  classification_method: 'AI_CONFIRMED',
                },
              }}
              href="/judge/cases/CASE-2024-041"
            />

            <EvidenceCard
              evidence={{
                evidence_number: 'EVD-2024-0091',
                status: 'SEALED',
                master_hash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
                case: { case_number: 'CASE-2024-041' },
                current_holder: { full_name: 'Detective Marcus Vance' },
                classification: {
                  ai_object: 'Paper Document / Ledger',
                  ai_category: 'Document',
                  ai_confidence: 0.887,
                  final_category: 'Document',
                  final_object: 'Financial Transaction Records',
                  classification_method: 'AI_CONFIRMED',
                },
              }}
              href="/judge/cases/CASE-2024-041"
            />
          </div>
        </div>
      </div>
    </AppShell>
  )
}
