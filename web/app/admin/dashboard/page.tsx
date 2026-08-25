'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  Users,
  Smartphone,
  FolderLock,
  Fingerprint,
  Activity,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Server,
  Database,
  HardDrive,
  Cpu,
  RefreshCw,
} from 'lucide-react'
import { toast } from 'sonner'

export default function AdminDashboard() {
  const [devices, setDevices] = useState([
    {
      id: 'dev-001',
      user: 'Detective Marcus Vance',
      badge: '4028',
      platform: 'iOS (iPhone 15 Pro)',
      identifier: 'web_9a4f8812c44e991b',
      status: 'APPROVED',
      lastSeen: '4 minutes ago',
    },
    {
      id: 'dev-002',
      user: 'Officer Sarah Chen',
      badge: '3910',
      platform: 'Android (Samsung Galaxy S24)',
      identifier: 'web_33bf1992019ab921',
      status: 'PENDING',
      lastSeen: '12 minutes ago',
    },
    {
      id: 'dev-003',
      user: 'Dr. Aris Thorne',
      badge: 'LAB-882',
      platform: 'Web Workstation (macOS)',
      identifier: 'web_88f01a882bb81944',
      status: 'APPROVED',
      lastSeen: '1 hour ago',
    },
  ])

  const handleApproveDevice = (id: string, user: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'APPROVED' } : d))
    )
    toast.success(`Device for ${user} approved. Authentication token activated.`)
  }

  const handleRevokeDevice = (id: string, user: string) => {
    setDevices((prev) =>
      prev.map((d) => (d.id === id ? { ...d, status: 'REVOKED' } : d))
    )
    toast.error(`Device for ${user} revoked. Session terminated immediately.`)
  }

  return (
    <AppShell
      role="ADMIN"
      title="System Administration & Security Infrastructure"
      breadcrumbs={[{ label: 'Home' }, { label: 'Admin Command' }]}
      userName="Chief Architect Admin"
      userEmail="admin@forenza.gov"
      badgeNumber="ADM-01"
    >
      <div className="space-y-6">
        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Total Personnel
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
              48
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">7 RBAC Role Profiles</p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Approved Devices
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-blue-600 dark:text-blue-400 mt-1">
              34
            </h3>
            <p className="text-[11px] text-amber-600 font-semibold mt-0.5">1 Pending Approval</p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
            <span className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Active Cases
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-1">
              24
            </h3>
            <p className="text-[11px] text-slate-500 mt-0.5">Under investigation</p>
          </div>

          <div className="forenza-card p-5 rounded-2xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/40 dark:bg-emerald-950/20">
            <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
              Database Uptime
            </span>
            <h3 className="text-2xl font-extrabold font-mono text-emerald-600 dark:text-emerald-400 mt-1">
              99.99%
            </h3>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-semibold mt-0.5">
              Append-only triggers active
            </p>
          </div>
        </div>

        {/* System Infrastructure Health Telemetry */}
        <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xs space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Activity className="w-4 h-4 text-blue-500" />
              Core Infrastructure Health Telemetry
            </h3>
            <span className="badge-verified">ALL SYSTEMS OPERATIONAL</span>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 text-xs">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <Server className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Core API</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  18ms latency
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <Database className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Supabase DB</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  Healthy • RLS
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <HardDrive className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Encrypted Vault</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  2.4 TB free
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <Cpu className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">AI Inference</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  ONNX Engine
                </span>
              </div>
            </div>

            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center gap-3">
              <ShieldCheck className="w-5 h-5 text-emerald-500 shrink-0" />
              <div>
                <span className="font-bold text-slate-900 dark:text-slate-100 block">Auto Backups</span>
                <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-mono">
                  Continuous
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Approved Device Binding Security Table */}
        <div className="forenza-card rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-xs">
          <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
            <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
              <Smartphone className="w-4 h-4 text-blue-500" />
              Device Binding & Hardware Token Management
            </h3>
            <span className="text-xs text-slate-500 font-mono">MANDATORY DEVICE BINDING</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 dark:bg-[#0B0F19] text-slate-700 dark:text-slate-300 font-bold border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5">Personnel</th>
                  <th className="p-3.5">Hardware Platform</th>
                  <th className="p-3.5">Device Identifier Token</th>
                  <th className="p-3.5">Status</th>
                  <th className="p-3.5">Last Active</th>
                  <th className="p-3.5 text-right">Security Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800 text-slate-800 dark:text-slate-200 font-medium">
                {devices.map((d) => (
                  <tr key={d.id} className="hover:bg-slate-50 dark:hover:bg-slate-800/40 transition-colors">
                    <td className="p-3.5">
                      <span className="font-bold text-slate-900 dark:text-slate-100 block">
                        {d.user}
                      </span>
                      <span className="text-[11px] font-mono text-slate-500">Badge #{d.badge}</span>
                    </td>
                    <td className="p-3.5">{d.platform}</td>
                    <td className="p-3.5 font-mono text-[11px] text-slate-500">{d.identifier}</td>
                    <td className="p-3.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold font-mono ${
                          d.status === 'APPROVED'
                            ? 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                            : d.status === 'PENDING'
                            ? 'bg-amber-100 dark:bg-amber-950 text-amber-700 dark:text-amber-300'
                            : 'bg-red-100 dark:bg-red-950 text-red-700 dark:text-red-300'
                        }`}
                      >
                        {d.status}
                      </span>
                    </td>
                    <td className="p-3.5 font-mono text-slate-500">{d.lastSeen}</td>
                    <td className="p-3.5 text-right">
                      {d.status === 'PENDING' ? (
                        <button
                          type="button"
                          onClick={() => handleApproveDevice(d.id, d.user)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          <span>Approve</span>
                        </button>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleRevokeDevice(d.id, d.user)}
                          className="inline-flex items-center gap-1 px-3 py-1 rounded-lg text-xs font-semibold text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40"
                        >
                          <XCircle className="w-3.5 h-3.5" />
                          <span>Revoke</span>
                        </button>
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
