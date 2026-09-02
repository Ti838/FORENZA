'use client'

import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  ScanLine,
  Building2,
  ArrowRightLeft,
  ShieldCheck,
  FolderLock,
  Plus,
  QrCode,
  Package,
} from 'lucide-react'
import Link from 'next/link'

export default function VaultDashboard() {
  return (
    <AppShell
      role="VAULT_CUSTODIAN"
      title="Central Evidence Vault Control"
      breadcrumbs={[{ label: 'Home' }, { label: 'Vault Facility #1' }]}
      userName="Sgt. Marcus Rodriguez"
      userEmail="m.rodriguez@forenza.gov"
      badgeNumber="7104"
    >
      <div className="space-y-6">
        {/* Large Operational QR Scanner Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950 text-white border border-slate-800 shadow-xl relative overflow-hidden">
          <div className="max-w-md">
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-semibold mb-3">
              <Building2 className="w-3.5 h-3.5" />
              <span>Facility #1 • High Security Vault</span>
            </div>

            <h2 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              Evidence Intake & Storage
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 mt-1.5 leading-relaxed">
              Scan officer transfer QR codes to verify custody handovers, extend the hash chain, and index storage rack locations.
            </p>

            <div className="mt-6 flex items-center flex-wrap gap-3">
              <Link
                href="/vault/scan"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-sm shadow-lg shadow-blue-600/40 active:scale-95 transition-all"
              >
                <ScanLine className="w-5 h-5" />
                <span>SCAN EVIDENCE QR CODE</span>
              </Link>
            </div>
          </div>
        </div>

        {/* Vault Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Stored Items
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
              1,429
            </h3>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Received Today
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              8
            </h3>
          </div>

          <div className="col-span-2 sm:col-span-1 forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Storage Utilization
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
              64.2%
            </h3>
          </div>
        </div>

        {/* Recent Vault Storage Intake Items */}
        <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Package className="w-4 h-4 text-blue-500" />
              Recent Vault Storage Placements
            </h3>
            <span className="text-xs text-slate-500 font-mono">FACILITY #1</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Evidence ID</th>
                  <th className="p-3.5">Category</th>
                  <th className="p-3.5">Assigned Vault Location</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Stored At</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                <tr>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    EVD-2024-0089
                  </td>
                  <td className="p-3.5">Weapon (Knife)</td>
                  <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    VAULT-1 / RACK-B / SHELF-3 / BIN-14
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status="VAULT_STORED" size="sm" />
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">10:45 AM</td>
                </tr>

                <tr>
                  <td className="p-3.5 font-mono font-bold text-slate-900 dark:text-slate-100">
                    EVD-2024-0090
                  </td>
                  <td className="p-3.5">Biological (DNA Swab)</td>
                  <td className="p-3.5 font-mono font-bold text-blue-600 dark:text-blue-400">
                    COLD-VAULT / RACK-A / SHELF-1 / BIN-02
                  </td>
                  <td className="p-3.5">
                    <StatusBadge status="VAULT_STORED" size="sm" />
                  </td>
                  <td className="p-3.5 font-mono text-slate-500">09:15 AM</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
