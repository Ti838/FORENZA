'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'

export default function AuditorDashboard() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState('ALL')
  const [resultFilter, setResultFilter] = useState('ALL')

  const auditRecords = [
    {
      id: 'aud-001',
      timestamp: '2024-01-15T11:00:12.000Z',
      actor: 'Sgt. Marcus Rodriguez',
      role: 'VAULT_CUSTODIAN',
      action: 'VAULT_STORED',
      resource: 'EVD-2024-0089',
      category: 'VAULT_OPERATIONS',
      result: 'SUCCESS',
      integrity: 'VERIFIED',
      ip: '10.24.102.14',
    },
    {
      id: 'aud-002',
      timestamp: '2024-01-15T10:45:00.000Z',
      actor: 'Sgt. Marcus Rodriguez',
      role: 'VAULT_CUSTODIAN',
      action: 'CUSTODY_TRANSFERRED',
      resource: 'EVD-2024-0089',
      category: 'CUSTODY_TRANSFER',
      result: 'SUCCESS',
      integrity: 'VERIFIED',
      ip: '10.24.102.14',
    },
    {
      id: 'aud-003',
      timestamp: '2024-01-15T10:30:15.000Z',
      actor: 'Detective Marcus Vance',
      role: 'INVESTIGATING_OFFICER',
      action: 'TRANSFER_TOKEN_GENERATED',
      resource: 'EVD-2024-0089',
      category: 'CUSTODY_TRANSFER',
      result: 'SUCCESS',
      integrity: 'VERIFIED',
      ip: '172.16.4.88',
    },
    {
      id: 'aud-004',
      timestamp: '2024-01-15T09:17:00.000Z',
      actor: 'Detective Marcus Vance',
      role: 'INVESTIGATING_OFFICER',
      action: 'EVIDENCE_SEALED',
      resource: 'EVD-2024-0089',
      category: 'EVIDENCE_MANAGEMENT',
      result: 'SUCCESS',
      integrity: 'VERIFIED',
      ip: '172.16.4.88',
    },
    {
      id: 'aud-005',
      timestamp: '2024-01-15T09:16:04.000Z',
      actor: 'Detective Marcus Vance',
      role: 'INVESTIGATING_OFFICER',
      action: 'EVIDENCE_CLASSIFIED_AI_CONFIRMED',
      resource: 'EVD-2024-0089',
      category: 'EVIDENCE_MANAGEMENT',
      result: 'SUCCESS',
      integrity: 'VERIFIED',
      ip: '172.16.4.88',
    },
    {
      id: 'aud-006',
      timestamp: '2024-01-15T08:12:00.000Z',
      actor: 'Unknown (Unauthorized Device)',
      role: 'ANONYMOUS',
      action: 'UNAUTHORIZED_TELEMETRY_ATTEMPT',
      resource: 'EVD-2024-0077',
      category: 'SECURITY_EVENT',
      result: 'BLOCKED_DECOY_SENT',
      integrity: 'SUSPICIOUS',
      ip: '198.51.100.44',
    },
  ]

  const filtered = auditRecords.filter((rec) => {
    const matchesSearch =
      rec.actor.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
      rec.resource.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesCategory = categoryFilter === 'ALL' || rec.category === categoryFilter
    const matchesResult = resultFilter === 'ALL' || rec.result === resultFilter

    return matchesSearch && matchesCategory && matchesResult
  })

  return (
    <AppShell
      role="AUDITOR"
      title="Master Forensic Audit Ledger"
      breadcrumbs={[{ label: 'Home' }, { label: 'Forensic Audit Logs' }]}
      userName="Senior Auditor James Sterling"
      userEmail="j.sterling@forenza.gov"
      badgeNumber="AUD-09"
    >
      <div className="space-y-6">
        {/* Auditor Stats Header */}
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Immutable Events
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
              128,491
            </h3>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Custody Handovers
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
              4,812
            </h3>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Hash Integrity Pass Rate
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              100.0%
            </h3>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Security Interceptions
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-amber-600 dark:text-amber-400 mt-1">
              3
            </h3>
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
              <option value="CUSTODY_TRANSFER">Custody Transfers</option>
              <option value="EVIDENCE_MANAGEMENT">Evidence Management</option>
              <option value="VAULT_OPERATIONS">Vault Operations</option>
              <option value="SECURITY_EVENT">Security Events</option>
            </select>
          </div>

          <button
            type="button"
            onClick={() => toast.success('Audit log export compiled as signed JSONL')}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export Signed Audit JSONL</span>
          </button>
        </div>

        {/* High-density Audit Table */}
        <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Timestamp (UTC)</th>
                  <th className="p-3.5">Actor</th>
                  <th className="p-3.5">Role</th>
                  <th className="p-3.5">Action</th>
                  <th className="p-3.5">Resource Target</th>
                  <th className="p-3.5">Result</th>
                  <th className="p-3.5 text-right">Integrity</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                {filtered.map((rec) => (
                  <tr
                    key={rec.id}
                    className={`hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors ${
                      rec.category === 'SECURITY_EVENT'
                        ? 'bg-amber-50/40 dark:bg-amber-950/20'
                        : ''
                    }`}
                  >
                    <td className="p-3.5 font-mono text-slate-500">
                      {new Date(rec.timestamp).toLocaleString('en-US', {
                        dateStyle: 'short',
                        timeStyle: 'medium',
                      })}
                    </td>
                    <td className="p-3.5 font-bold text-slate-900 dark:text-slate-100">
                      {rec.actor}
                    </td>
                    <td className="p-3.5">
                      <span className="font-mono text-[11px] font-bold text-slate-500">
                        {rec.role}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                      {rec.action}
                    </td>
                    <td className="p-3.5 font-mono font-bold">{rec.resource}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          rec.result === 'SUCCESS'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {rec.result}
                      </span>
                    </td>
                    <td className="p-3.5 text-right">
                      {rec.integrity === 'VERIFIED' ? (
                        <span className="badge-verified">PASSED</span>
                      ) : (
                        <span className="badge-warning">FLAGGED</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
