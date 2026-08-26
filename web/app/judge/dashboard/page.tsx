'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  Gavel,
  ShieldCheck,
  FolderLock,
  ArrowRight,
  Fingerprint,
  Scale,
  FileCheck,
  ShieldAlert,
  Loader2,
  RefreshCw,
} from 'lucide-react'
import Link from 'next/link'

interface CaseItem {
  id: string
  case_number: string
  title: string
  crime_type: string
  status: string
  created_at: string
  assigned_officer?: {
    full_name: string
    badge_number: string | null
  }
}

export default function JudgeDashboard() {
  const [cases, setCases] = useState<CaseItem[]>([])
  const [loading, setLoading] = useState(true)
  const [totalEvidence, setTotalEvidence] = useState(0)

  const fetchCases = async () => {
    setLoading(true)
    try {
      const [casesRes, evidenceRes] = await Promise.all([
        fetch('/api/cases?per_page=50'),
        fetch('/api/evidence?per_page=1'),
      ])

      if (casesRes.ok) {
        const cData = await casesRes.json()
        setCases(cData.data ?? [])
      }

      if (evidenceRes.ok) {
        const eData = await evidenceRes.json()
        setTotalEvidence(eData.total ?? 0)
      }
    } catch (err) {
      console.error('[FORENZA JUDGE DASHBOARD]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  return (
    <AppShell
      role="JUDGE"
      title="Judicial Evidence Chamber"
      breadcrumbs={[{ label: 'Home' }, { label: 'Judicial Overview' }]}
      userName="Judicial Review Chamber"
    >
      <div className="space-y-6">
        {/* Supreme Judicial Status Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>CRYPTOGRAPHIC CHAIN VERIFICATION ACTIVE</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Courtroom Evidence Oversight
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Examine tamper-evident evidence chains, verify cryptographic SHA-256 hashes, review forensic lab reports, and generate self-authenticating Court Dossiers under Rule 902(14).
            </p>
          </div>
        </div>

        {/* Judicial KPI Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Trial Cases
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-slate-400 inline" /> : cases.length}
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Assigned to Judicial Chamber</p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Tracked Evidence Items
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin text-emerald-400 inline" /> : totalEvidence}
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Across all trial cases
            </p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Judicial Admissibility Standard
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
              Rule 902(14)
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Certified digital records</p>
          </div>
        </div>

        {/* Active Judicial Cases Ready for Review */}
        <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-500" />
              Trial Cases & Evidentiary Dossiers
            </h3>
            <button
              type="button"
              onClick={fetchCases}
              className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-500"
              title="Refresh"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading judicial cases...</div>
          ) : cases.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No cases currently active.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Case Number</th>
                    <th className="p-3.5">Case Title</th>
                    <th className="p-3.5">Lead Officer</th>
                    <th className="p-3.5">Status</th>
                    <th className="p-3.5 text-right">Judicial Review</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {cases.map((c) => (
                    <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                      <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                        {c.case_number}
                      </td>
                      <td className="p-3.5 font-semibold">{c.title}</td>
                      <td className="p-3.5">
                        {c.assigned_officer ? `${c.assigned_officer.full_name} (${c.assigned_officer.badge_number ?? 'N/A'})` : 'Unassigned'}
                      </td>
                      <td className="p-3.5">
                        <StatusBadge status={c.status} size="sm" />
                      </td>
                      <td className="p-3.5 text-right">
                        <Link
                          href={`/judge/cases/${c.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                        >
                          <span>Open Chamber Dossier</span>
                          <ArrowRight className="w-3 h-3" />
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
