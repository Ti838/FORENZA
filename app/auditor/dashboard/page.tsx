'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  History,
  ShieldCheck,
  ShieldAlert,
  Search,
  Filter,
  Download,
  Calendar,
  User,
  Fingerprint,
  RefreshCw,
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

interface AuditEntry {
  id: string
  created_at: string
  actor_email: string | null
  actor_role: string | null
  action: string
  category: string
  evidence_id: string | null
  case_id: string | null
  success: boolean
  ip_address: string | null
  metadata: Record<string, unknown>
}

export default function AuditorDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [resultFilter, setResultFilter] = useState('ALL')
  const [records, setRecords] = useState<AuditEntry[]>([])
  const [totalCount, setTotalCount] = useState(0)
  const [loading, setLoading] = useState(true)

  const fetchAuditLogs = async () => {
    setLoading(true)
    try {
      let url = '/api/audit?per_page=100'
      if (categoryFilter !== 'ALL') url += `&category=${categoryFilter}`
      if (resultFilter !== 'ALL') url += `&success=${resultFilter === 'SUCCESS'}`

      const res = await fetch(url)
      if (res.ok) {
        const json = await res.json()
        setRecords(json.data ?? [])
        setTotalCount(json.total ?? 0)
      } else {
        toast.error('Failed to load audit records')
      }
    } catch (err) {
      console.error('[FORENZA AUDIT]', err)
      toast.error('Network error loading audit trail')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchAuditLogs()
  }, [categoryFilter, resultFilter])

  const filtered = records.filter((rec) => {
    const actor = rec.actor_email ?? 'System'
    const action = rec.action ?? ''
    const resource = rec.evidence_id ?? rec.case_id ?? ''
    const ip = rec.ip_address ?? ''

    return (
      actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      resource.toLowerCase().includes(searchTerm.toLowerCase()) ||
      ip.includes(searchTerm)
    )
  })

  const handleExportJsonl = () => {
    window.open('/api/audit?format=jsonl', '_blank')
    toast.success('Audit log export compiled as signed JSONL')
  }

  const successRate = totalCount > 0
    ? ((records.filter((r) => r.success).length / Math.max(records.length, 1)) * 100).toFixed(1)
    : '100.0'

  return (
    <AppShell
      role="AUDITOR"
      title="Master Forensic Audit Ledger"
      breadcrumbs={[{ label: 'Home' }, { label: 'Forensic Audit Logs' }]}
      userName="Independent Forensic Auditor"
    >
      <div className="space-y-6">
        {/* Auditor Stats Header */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Immutable Events
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin inline text-slate-400" /> : totalCount}
            </h3>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Records In View
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
              {loading ? <Loader2 className="w-5 h-5 animate-spin inline text-blue-400" /> : records.length}
            </h3>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Operation Pass Rate
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              {successRate}%
            </h3>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Database Immutability
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              ACTIVE
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Triggers prevent DELETE/UPDATE</p>
          </div>
        </div>

        {/* Filter Controls Bar */}
        <div className="forenza-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col sm:flex-row items-center justify-between gap-3 text-xs">
          <div className="flex items-center gap-2 w-full sm:w-auto flex-1">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search actor, action, resource ID, or IP..."
                className="w-full pl-9 pr-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>

            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="px-3 py-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-200 font-semibold outline-none"
            >
              <option value="ALL">All Categories</option>
              <option value="AUTHENTICATION">Authentication</option>
              <option value="CASE_MANAGEMENT">Case Management</option>
              <option value="CUSTODY_TRANSFER">Custody Transfers</option>
              <option value="EVIDENCE_MANAGEMENT">Evidence Management</option>
              <option value="VAULT_OPERATIONS">Vault Operations</option>
              <option value="LAB_OPERATIONS">Lab Operations</option>
              <option value="SECURITY_EVENT">Security Events</option>
              <option value="INTEGRITY_CHECK">Integrity Checks</option>
            </select>

            <button
              type="button"
              onClick={fetchAuditLogs}
              className="p-2 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300"
              title="Refresh logs"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <button
            type="button"
            onClick={handleExportJsonl}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Signed Audit JSONL</span>
          </button>
        </div>

        {/* High-density Audit Table */}
        <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          {loading ? (
            <div className="p-8 text-center text-slate-500 text-sm">Loading audit ledger records...</div>
          ) : filtered.length === 0 ? (
            <div className="p-8 text-center text-slate-500 text-sm">No audit records match the current criteria.</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                  <tr>
                    <th className="p-3.5">Timestamp (UTC)</th>
                    <th className="p-3.5">Actor</th>
                    <th className="p-3.5">Action</th>
                    <th className="p-3.5">Category</th>
                    <th className="p-3.5">Target</th>
                    <th className="p-3.5">Result</th>
                    <th className="p-3.5 text-right">Integrity</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                  {filtered.map((rec) => (
                    <tr
                      key={rec.id}
                      className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                        rec.category === 'SECURITY_EVENT' || !rec.success
                          ? 'bg-amber-50/40 dark:bg-amber-950/20'
                          : ''
                      }`}
                    >
                      <td className="p-3.5 font-mono text-slate-500">
                        {new Date(rec.created_at).toLocaleString('en-US', {
                          dateStyle: 'short',
                          timeStyle: 'medium',
                        })}
                      </td>
                      <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                        {rec.actor_email ?? 'System Engine'}
                      </td>
                      <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                        {rec.action}
                      </td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">{rec.category}</td>
                      <td className="p-3.5 font-mono text-[11px] text-slate-500">
                        {rec.evidence_id ? rec.evidence_id.substring(0, 8) + '…' : rec.case_id ? rec.case_id.substring(0, 8) + '…' : '—'}
                      </td>
                      <td className="p-3.5">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                            rec.success
                              ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                              : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                          }`}
                        >
                          {rec.success ? 'SUCCESS' : 'FAILED'}
                        </span>
                      </td>
                      <td className="p-3.5 text-right">
                        <span className="badge-verified">APPEND-ONLY</span>
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
