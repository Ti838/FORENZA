'use client'

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
} from 'lucide-react'
import Link from 'next/link'

export default function JudgeDashboard() {
  return (
    <AppShell
      role="JUDGE"
      title="Judicial Evidence Chamber"
      breadcrumbs={[{ label: 'Home' }, { label: 'Judicial Overview' }]}
      userName="Hon. Justice Sarah Vance"
      userEmail="s.vance@forenza.gov"
      badgeNumber="JDG-104"
      systemStatus="HEALTHY"
    >
      <div className="space-y-6">
        {/* Supreme Judicial Status Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-white border border-slate-800 shadow-2xl relative overflow-hidden">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/20 border border-emerald-400/40 text-emerald-300 text-xs font-bold font-mono mb-3">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              <span>OVERALL SYSTEM INTEGRITY: 100% VERIFIED</span>
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
              8
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Assigned to Part 34 Commercial & Criminal</p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Cryptographically Verified Items
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              42 / 42
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Zero chain tampering detected
            </p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Certified Court Dossiers
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
              14
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Ready for evidentiary admission</p>
          </div>
        </div>

        {/* Active Judicial Cases Ready for Review */}
        <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Scale className="w-4 h-4 text-blue-500" />
              Trial Cases & Evidentiary Dossiers
            </h3>
            <span className="text-xs text-slate-500 font-mono">SUPREME COURT PART 34</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Case Number</th>
                  <th className="p-3.5">Case Title</th>
                  <th className="p-3.5">Lead Investigating Officer</th>
                  <th className="p-3.5">Evidence Items</th>
                  <th className="p-3.5">Chain Integrity</th>
                  <th className="p-3.5 text-right">Judicial Review</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    CASE-2024-041
                  </td>
                  <td className="p-3.5 font-semibold">State v. Alexander Thorne (Armed Robbery)</td>
                  <td className="p-3.5">Detective Marcus Vance (#4028)</td>
                  <td className="p-3.5 font-mono">3 Items Sealed</td>
                  <td className="p-3.5">
                    <span className="badge-verified">100% INTACT</span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/judge/cases/CASE-2024-041"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                    >
                      <span>Open Chamber Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>

                <tr className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    CASE-2024-039
                  </td>
                  <td className="p-3.5 font-semibold">State v. Gregory Ross (Narcotics Distribution)</td>
                  <td className="p-3.5">Special Agent Davis (#389)</td>
                  <td className="p-3.5 font-mono">5 Items Sealed</td>
                  <td className="p-3.5">
                    <span className="badge-verified">100% INTACT</span>
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/judge/cases/CASE-2024-041"
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
                    >
                      <span>Open Chamber Dossier</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
