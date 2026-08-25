'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  FlaskConical,
  Clock,
  CheckCircle2,
  FileCheck,
  ArrowRight,
  Fingerprint,
  Plus,
} from 'lucide-react'
import Link from 'next/link'

export default function LabDashboard() {
  return (
    <AppShell
      role="LAB_ANALYST"
      title="Forensic Laboratory Operations"
      breadcrumbs={[{ label: 'Home' }, { label: 'Forensic Lab Intake' }]}
      userName="Dr. Aris Thorne"
      userEmail="a.thorne@forenza.gov"
      badgeNumber="LAB-882"
    >
      <div className="space-y-6">
        {/* Lab Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Pending Lab Intake
              </span>
              <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                <Clock className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold font-mono text-purple-700 dark:text-purple-300 mt-2">
              4
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Awaiting scientific intake & registration</p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Active Analysis
              </span>
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <FlaskConical className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-2">
              6
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Spectrometry & DNA sequencing ongoing</p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
                Completed Reports
              </span>
              <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                <FileCheck className="w-5 h-5" />
              </div>
            </div>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-2">
              31
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Cryptographically sealed & court submitted</p>
          </div>
        </div>

        {/* Evidence Lab Queue Table */}
        <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <FlaskConical className="w-4 h-4 text-purple-500" />
              Laboratory Evidence Queue
            </h3>
            <Link
              href="/lab/analysis"
              className="text-xs font-semibold text-purple-600 dark:text-purple-400 hover:underline"
            >
              Open Active Analysis Workstation
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Evidence ID</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Intake Received</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                <tr>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    EVD-2024-0090
                  </td>
                  <td className="p-3.5">Biological (DNA Swab)</td>
                  <td className="p-3.5 font-mono text-slate-500">Today 09:30 AM</td>
                  <td className="p-3.5">
                    <StatusBadge status="UNDER_ANALYSIS" size="sm" />
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/lab/analysis"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
                    >
                      <span>Analyze</span>
                      <ArrowRight className="w-3 h-3" />
                    </Link>
                  </td>
                </tr>

                <tr>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    EVD-2024-0093
                  </td>
                  <td className="p-3.5">Substances (Chemical Residue)</td>
                  <td className="p-3.5 font-mono text-slate-500">Yesterday 04:15 PM</td>
                  <td className="p-3.5">
                    <StatusBadge status="LAB_RECEIVED" size="sm" />
                  </td>
                  <td className="p-3.5 text-right">
                    <Link
                      href="/lab/analysis"
                      className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-purple-50 hover:bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-300 border border-purple-200 dark:border-purple-800 transition-colors"
                    >
                      <span>Intake</span>
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
