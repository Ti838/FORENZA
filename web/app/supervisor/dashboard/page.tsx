'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  FolderLock,
  Fingerprint,
  ShieldAlert,
  ArrowRightLeft,
  CheckCircle2,
  XCircle,
  MapPin,
  Clock,
  ChevronRight,
  Plus,
  ShieldCheck,
  Search,
  ExternalLink,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface OverrideRequest {
  id: string
  evidenceNumber: string
  caseNumber: string
  officerName: string
  badgeNumber: string
  distanceMeters: number
  allowedRadiusMeters: number
  reason: string
  requestedAt: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
}

export default function SupervisorDashboard() {
  const [overrides, setOverrides] = useState<OverrideRequest[]>([
    {
      id: 'ov-001',
      evidenceNumber: 'EVD-2024-0089',
      caseNumber: 'CASE-2024-041',
      officerName: 'Detective Marcus Vance',
      badgeNumber: '4028',
      distanceMeters: 742,
      allowedRadiusMeters: 500,
      reason: 'Fleeing suspect discarded weapon across perimeter highway boundary into drainage ditch.',
      requestedAt: '12 minutes ago',
      status: 'PENDING',
    },
    {
      id: 'ov-002',
      evidenceNumber: 'EVD-2024-0092',
      caseNumber: 'CASE-2024-044',
      officerName: 'Officer Sarah Chen',
      badgeNumber: '3910',
      distanceMeters: 620,
      allowedRadiusMeters: 500,
      reason: 'Secondary acquisition site: vehicle pursuit terminal point.',
      requestedAt: '34 minutes ago',
      status: 'PENDING',
    },
  ])

  const handleApproveOverride = (id: string, evidenceNumber: string) => {
    setOverrides((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'APPROVED' } : o))
    )
    toast.success(`Geofence override approved for evidence ${evidenceNumber}. Audit log recorded.`)
  }

  const handleRejectOverride = (id: string, evidenceNumber: string) => {
    setOverrides((prev) =>
      prev.map((o) => (o.id === id ? { ...o, status: 'REJECTED' } : o))
    )
    toast.error(`Geofence override rejected for ${evidenceNumber}. Field acquisition restricted.`)
  }

  return (
    <AppShell
      role="SUPERVISOR"
      title="Supervisor Command Center"
      breadcrumbs={[{ label: 'Home' }, { label: 'Supervisor Dashboard' }]}
      userName="Lt. Commander Elena Sterling"
      userEmail="e.sterling@forenza.gov"
      badgeNumber="9012"
      showSearch={true}
      searchPlaceholder="Search active cases, evidence ID, or officer badge..."
    >
      <div className="space-y-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1 */}
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Active Cases
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FolderLock className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                24
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                +3 cases assigned this week
              </p>
            </div>
          </div>

          {/* Card 2 */}
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Evidence Acquired Today
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Fingerprint className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                18
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                All 18 items SHA-256 sealed
              </p>
            </div>
          </div>

          {/* Card 3: Pending Overrides */}
          <div className="forenza-card p-5 rounded-2xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Pending Overrides
              </span>
              <div className="p-2 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-300">
                <ShieldAlert className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold font-mono text-amber-800 dark:text-amber-200">
                {overrides.filter((o) => o.status === 'PENDING').length}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                Action required on geofence exceptions
              </p>
            </div>
          </div>

          {/* Card 4 */}
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pending Transfers
              </span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <ArrowRightLeft className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                7
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                In-transit telemetry active
              </p>
            </div>
          </div>
        </div>

        {/* Geofence Override Requests Review Section */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <ShieldAlert className="w-5 h-5 text-amber-500" />
              <h2 className="text-base font-bold text-slate-900 dark:text-slate-100">
                Geofence Perimeter Override Requests
              </h2>
            </div>
            <span className="text-xs text-slate-500 dark:text-slate-400">
              Rule 4.2 Mandatory Supervisor Review
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {overrides.map((req) => (
              <div
                key={req.id}
                className={`p-5 rounded-2xl border transition-all ${
                  req.status === 'APPROVED'
                    ? 'bg-emerald-50/60 dark:bg-emerald-950/20 border-emerald-300 dark:border-emerald-800'
                    : req.status === 'REJECTED'
                    ? 'bg-red-50/60 dark:bg-red-950/20 border-red-300 dark:border-red-800 opacity-70'
                    : 'bg-white dark:bg-[#111827] border-amber-200 dark:border-amber-900/60 shadow-md'
                }`}
              >
                {/* Top details */}
                <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                        {req.evidenceNumber}
                      </span>
                      <span className="text-xs font-mono text-slate-500">({req.caseNumber})</span>
                    </div>
                    <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                      Requesting Officer: <strong>{req.officerName}</strong> (Badge #{req.badgeNumber})
                    </p>
                  </div>

                  {req.status === 'PENDING' ? (
                    <span className="badge-warning">REVIEW PENDING</span>
                  ) : req.status === 'APPROVED' ? (
                    <span className="badge-verified">OVERRIDE APPROVED</span>
                  ) : (
                    <span className="badge-compromised">REJECTED</span>
                  )}
                </div>

                {/* Distance & Geofence metrics */}
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 mb-3">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500 flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 text-amber-500" />
                      Acquisition Distance:
                    </span>
                    <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                      {req.distanceMeters}m (Limit: {req.allowedRadiusMeters}m)
                    </span>
                  </div>

                  <div>
                    <span className="text-slate-500 block mb-0.5">Officer Exigency Reason:</span>
                    <p className="text-slate-800 dark:text-slate-200 italic">&ldquo;{req.reason}&rdquo;</p>
                  </div>
                </div>

                {/* Actions */}
                {req.status === 'PENDING' ? (
                  <div className="flex items-center justify-between gap-3 pt-2">
                    <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      {req.requestedAt}
                    </span>

                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        onClick={() => handleRejectOverride(req.id, req.evidenceNumber)}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/60 dark:hover:bg-red-900/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 transition-colors"
                      >
                        <XCircle className="w-3.5 h-3.5" />
                        <span>Reject</span>
                      </button>

                      <button
                        type="button"
                        onClick={() => handleApproveOverride(req.id, req.evidenceNumber)}
                        className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        <span>Approve Override</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="text-xs text-slate-500 dark:text-slate-400 font-mono text-right">
                    DECISION LOGGED IN FORENZA AUDIT LEDGER
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Recent Active Evidence Stream */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              Real-time Evidence Stream
            </h2>
            <Link
              href="/supervisor/evidence"
              className="text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1"
            >
              View Full Evidence Vault
              <ChevronRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Evidence ID</th>
                    <th className="p-3.5">Case Number</th>
                    <th className="p-3.5">Classification</th>
                    <th className="p-3.5">Current Holder</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5">Integrity Hash Seal</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                      EVD-2024-0087
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">CASE-2024-039</td>
                    <td className="p-3.5 font-medium">Weapon → Semi-auto Pistol</td>
                    <td className="p-3.5">Special Agent Davis (#389)</td>
                    <td className="p-3.5">
                      <StatusBadge status="SEALED" size="sm" />
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      7f83b1657ff1fc53...
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href="/judge/cases/CASE-2024-039"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                      EVD-2024-0088
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">CASE-2024-040</td>
                    <td className="p-3.5 font-medium">Electronics → Encrypted Smartphone</td>
                    <td className="p-3.5">Lab Analyst Dr. Wong</td>
                    <td className="p-3.5">
                      <StatusBadge status="LAB_RECEIVED" size="sm" />
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      a94a8fe5ccb19ba6...
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href="/lab/analysis"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>

                  <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                      EVD-2024-0090
                    </td>
                    <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">CASE-2024-041</td>
                    <td className="p-3.5 font-medium">Biological → DNA Swab</td>
                    <td className="p-3.5">Central Vault Storage</td>
                    <td className="p-3.5">
                      <StatusBadge status="VAULT_STORED" size="sm" />
                    </td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">
                      e3b0c44298fc1c14...
                    </td>
                    <td className="p-3.5 text-right">
                      <Link
                        href="/vault/inventory"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                      >
                        Inspect
                        <ExternalLink className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
