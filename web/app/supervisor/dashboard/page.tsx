'use client'

import { useState, useEffect } from 'react'
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
  ShieldCheck,
  Loader2,
  ExternalLink,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface OverrideItem {
  id: string
  evidence_id: string
  case_id: string
  distance_meters: number
  reason: string
  status: 'PENDING' | 'APPROVED' | 'REJECTED'
  created_at: string
  officer?: { full_name: string; badge_number: string | null }
  evidence?: { id: string; evidence_number: string; status: string }
  case?: { id: string; case_number: string; title: string }
}

interface EvidenceStreamItem {
  id: string
  evidence_number: string
  status: string
  master_hash: string | null
  created_at: string
  case?: { case_number: string }
  current_holder?: { full_name: string }
  classification?: { final_category?: string; final_object?: string }
}

export default function SupervisorDashboard() {
  const [overrides, setOverrides] = useState<OverrideItem[]>([])
  const [evidenceStream, setEvidenceStream] = useState<EvidenceStreamItem[]>([])
  const [activeCasesCount, setActiveCasesCount] = useState(0)
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)

  const fetchData = async () => {
    setLoading(true)
    try {
      const [overridesRes, casesRes, evidenceRes] = await Promise.all([
        fetch('/api/overrides'),
        fetch('/api/cases?status=ACTIVE&per_page=1'),
        fetch('/api/evidence?per_page=10'),
      ])

      if (overridesRes.ok) {
        const oData = await overridesRes.json()
        setOverrides(oData.data ?? [])
      }

      if (casesRes.ok) {
        const cData = await casesRes.json()
        setActiveCasesCount(cData.total ?? 0)
      }

      if (evidenceRes.ok) {
        const eData = await evidenceRes.json()
        setEvidenceStream(eData.data ?? [])
      }
    } catch (err) {
      console.error('[FORENZA SUPERVISOR]', err)
      toast.error('Failed to load supervisor dashboard')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchData()
  }, [])

  const handleDecision = async (id: string, status: 'APPROVED' | 'REJECTED', evNumber: string) => {
    setActionLoading(id)
    try {
      const res = await fetch(`/api/overrides/${id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      })
      const json = await res.json()
      if (!res.ok) {
        toast.error(json.error ?? 'Action failed')
        return
      }

      setOverrides((prev) =>
        prev.map((o) => (o.id === id ? { ...o, status } : o))
      )

      if (status === 'APPROVED') {
        toast.success(`Override approved for ${evNumber}. Geofence seal verified.`)
      } else {
        toast.error(`Override rejected for ${evNumber}. Acquisition restricted.`)
      }
    } catch (err) {
      toast.error('Network error processing decision')
    } finally {
      setActionLoading(null)
    }
  }

  const pendingCount = overrides.filter((o) => o.status === 'PENDING').length

  return (
    <AppShell
      role="SUPERVISOR"
      title="Supervisor Command Center"
      breadcrumbs={[{ label: 'Home' }, { label: 'Supervisor Dashboard' }]}
      userName="Supervisor Command Desk"
    >
      <div className="space-y-6">
        {/* KPI Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /> : activeCasesCount}
              </h3>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-0.5">
                Active investigation perimeter
              </p>
            </div>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Evidence In Stream
              </span>
              <div className="p-2 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
                <Fingerprint className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100">
                {loading ? <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /> : evidenceStream.length}
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Acquired items under management
              </p>
            </div>
          </div>

          {/* Pending Overrides */}
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
                {loading ? <Loader2 className="w-5 h-5 animate-spin inline text-amber-600" /> : pendingCount}
              </h3>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold mt-0.5">
                {pendingCount > 0 ? 'Action required on perimeter exceptions' : 'All perimeter exceptions cleared'}
              </p>
            </div>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Integrity Oversight
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <ShieldCheck className="w-5 h-5" />
              </div>
            </div>
            <div className="mt-3">
              <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400">
                SHA-256
              </h3>
              <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                Immutable cryptographic ledger
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
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={fetchData}
                className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
                title="Refresh"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
              </button>
            </div>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading perimeter requests...</div>
          ) : overrides.length === 0 ? (
            <div className="p-6 text-center text-slate-500 text-xs forenza-card rounded-2xl">
              No active geofence override requests.
            </div>
          ) : (
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
                  <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100">
                          {req.evidence?.evidence_number ?? req.evidence_id.substring(0, 8)}
                        </span>
                        <span className="text-xs font-mono text-slate-500">
                          ({req.case?.case_number ?? 'CASE'})
                        </span>
                      </div>
                      <p className="text-xs text-slate-600 dark:text-slate-400 mt-0.5">
                        Officer: <strong>{req.officer?.full_name ?? 'Field Officer'}</strong> (Badge #{req.officer?.badge_number ?? 'N/A'})
                      </p>
                    </div>

                    {req.status === 'PENDING' ? (
                      <span className="badge-warning">REVIEW PENDING</span>
                    ) : req.status === 'APPROVED' ? (
                      <span className="badge-verified">APPROVED</span>
                    ) : (
                      <span className="badge-compromised">REJECTED</span>
                    )}
                  </div>

                  <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 text-xs space-y-2 mb-3">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500 flex items-center gap-1">
                        <MapPin className="w-3.5 h-3.5 text-amber-500" />
                        Acquisition Distance:
                      </span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400">
                        {Math.round(req.distance_meters)}m from Scene
                      </span>
                    </div>

                    <div>
                      <span className="text-slate-500 block mb-0.5">Officer Exigency Reason:</span>
                      <p className="text-slate-800 dark:text-slate-200 italic">&ldquo;{req.reason}&rdquo;</p>
                    </div>
                  </div>

                  {req.status === 'PENDING' ? (
                    <div className="flex items-center justify-between gap-3 pt-2">
                      <span className="text-[11px] text-slate-400 flex items-center gap-1 font-mono">
                        <Clock className="w-3.5 h-3.5" />
                        {new Date(req.created_at).toLocaleTimeString()}
                      </span>

                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleDecision(req.id, 'REJECTED', req.evidence?.evidence_number ?? req.evidence_id)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-red-50 hover:bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-300 border border-red-200 dark:border-red-800 transition-colors disabled:opacity-50"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Reject</span>
                        </button>

                        <button
                          type="button"
                          disabled={actionLoading === req.id}
                          onClick={() => handleDecision(req.id, 'APPROVED', req.evidence?.evidence_number ?? req.evidence_id)}
                          className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50"
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
          )}
        </div>

        {/* Recent Active Evidence Stream */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-base font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Fingerprint className="w-5 h-5 text-blue-500" />
              Real-time Evidence Stream
            </h2>
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
                    <th className="p-3.5">Master Hash Seal</th>
                    <th className="p-3.5 text-right">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200">
                  {evidenceStream.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="p-6 text-center text-slate-500">No evidence items recorded yet.</td>
                    </tr>
                  ) : (
                    evidenceStream.map((ev) => (
                      <tr key={ev.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                        <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                          {ev.evidence_number}
                        </td>
                        <td className="p-3.5 font-mono text-slate-600 dark:text-slate-400">
                          {ev.case?.case_number ?? '—'}
                        </td>
                        <td className="p-3.5 font-medium">
                          {ev.classification?.final_category ?? 'Pending'} → {ev.classification?.final_object ?? '—'}
                        </td>
                        <td className="p-3.5">{ev.current_holder?.full_name ?? 'Field Officer'}</td>
                        <td className="p-3.5">
                          <StatusBadge status={ev.status} size="sm" />
                        </td>
                        <td className="p-3.5 font-mono text-[11px] text-slate-500">
                          {ev.master_hash ? `${ev.master_hash.substring(0, 16)}…` : 'Unsealed'}
                        </td>
                        <td className="p-3.5 text-right">
                          <Link
                            href={`/judge/cases/${ev.id}`}
                            className="inline-flex items-center gap-1 text-xs font-semibold text-blue-600 dark:text-blue-400 hover:underline"
                          >
                            Inspect
                            <ExternalLink className="w-3 h-3" />
                          </Link>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
