'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { HashCard } from '@/components/forensic/HashCard'
import {
  ScanLine,
  Building2,
  CheckCircle2,
  ShieldCheck,
  Package,
  Layers,
  ArrowRight,
  RotateCcw,
  Sparkles,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type ScanStep = 'SCANNING' | 'VERIFIED_PREVIEW' | 'STORED_SUCCESS'

export default function VaultScanPage() {
  const [step, setStep] = useState<ScanStep>('SCANNING')
  const [locationForm, setLocationForm] = useState({
    vaultId: 'VAULT-01',
    rack: 'RACK-B',
    shelf: 'SHELF-04',
    bin: 'BIN-12',
    notes: 'Stored in secure evidence locker.',
  })

  const handleSimulateScan = () => {
    setStep('VERIFIED_PREVIEW')
    toast.success('QR Handover Token verified. Cryptographic signature validated.')
  }

  const handleConfirmStorage = (e: React.FormEvent) => {
    e.preventDefault()
    setStep('STORED_SUCCESS')
    toast.success('Evidence received into vault custody and physical location indexed.')
  }

  return (
    <AppShell
      role="VAULT_CUSTODIAN"
      title="Evidence Intake & Location Indexing"
      breadcrumbs={[{ label: 'Home' }, { label: 'Vault Facility', href: '/vault/dashboard' }, { label: 'Scan QR' }]}
      userName="Sgt. Marcus Rodriguez"
      badgeNumber="7104"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {/* STEP 1: SCANNER VIEWFINDER */}
        {step === 'SCANNING' && (
          <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl text-center space-y-6">
            <div>
              <h3 className="text-xl font-extrabold text-slate-900 dark:text-slate-100">
                Scan Evidence Handover QR
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Point your scanner or device camera at the officer&apos;s digital handover token
              </p>
            </div>

            {/* Scanner Graphic */}
            <div className="relative w-64 h-64 mx-auto rounded-3xl bg-slate-950 border-2 border-blue-500/50 shadow-2xl flex items-center justify-center overflow-hidden">
              {/* Scan Laser Animation */}
              <div className="absolute left-0 right-0 h-0.5 bg-blue-400 shadow-lg shadow-blue-500/80 animate-bounce" />

              <div className="w-44 h-44 border border-dashed border-white/40 rounded-2xl flex items-center justify-center">
                <ScanLine className="w-16 h-16 text-blue-400 animate-pulse" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleSimulateScan}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md shadow-blue-600/30 transition-all active:scale-95"
            >
              Simulate Successful QR Scan
            </button>
          </div>
        )}

        {/* STEP 2: SCANNED ITEM REVIEW & LOCATION ASSIGNMENT */}
        {step === 'VERIFIED_PREVIEW' && (
          <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6 animate-in fade-in">
            {/* Scanned Verification Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    Handover Token Verified
                  </h3>
                  <p className="text-xs font-mono text-slate-500">ITEM: EVD-2024-0089 • CASE-2024-041</p>
                </div>
              </div>

              <StatusBadge status="TRANSFERRED" size="sm" />
            </div>

            {/* Evidence Metadata Overview */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 text-xs space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <span className="text-slate-500 block">Category:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Weapon (Tactical Knife)
                  </span>
                </div>
                <div>
                  <span className="text-slate-500 block">Handover Officer:</span>
                  <span className="font-bold text-slate-900 dark:text-slate-100">
                    Detective Marcus Vance (#4028)
                  </span>
                </div>
              </div>

              <div className="pt-2 border-t border-slate-200/60 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                <span className="text-slate-500">Cryptographic Seal:</span>
                <span className="text-emerald-600 dark:text-emerald-400 font-bold">
                  e3b0c442...852b855 (Verified)
                </span>
              </div>
            </div>

            {/* Storage Indexing Form */}
            <form onSubmit={handleConfirmStorage} className="space-y-4">
              <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-1.5">
                <Building2 className="w-4 h-4 text-blue-500" />
                Assign Physical Vault Storage Location
              </h4>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Vault ID *
                  </label>
                  <input
                    type="text"
                    required
                    value={locationForm.vaultId}
                    onChange={(e) => setLocationForm({ ...locationForm, vaultId: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Rack
                  </label>
                  <input
                    type="text"
                    value={locationForm.rack}
                    onChange={(e) => setLocationForm({ ...locationForm, rack: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Shelf
                  </label>
                  <input
                    type="text"
                    value={locationForm.shelf}
                    onChange={(e) => setLocationForm({ ...locationForm, shelf: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Bin
                  </label>
                  <input
                    type="text"
                    value={locationForm.bin}
                    onChange={(e) => setLocationForm({ ...locationForm, bin: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Intake Custodian Notes
                </label>
                <textarea
                  rows={2}
                  value={locationForm.notes}
                  onChange={(e) => setLocationForm({ ...locationForm, notes: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={() => setStep('SCANNING')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Rescan
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Confirm Custody & Store in Vault</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 3: STORED SUCCESS CONFIRMATION */}
        {step === 'STORED_SUCCESS' && (
          <div className="forenza-card p-8 rounded-3xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-[#111827] shadow-xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                VAULT INTAKE COMPLETED
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                ITEM EVD-2024-0089 SECURED IN VAULT-01 / RACK-B / SHELF-04 / BIN-12
              </p>
            </div>

            <p className="text-xs text-slate-600 dark:text-slate-300 max-w-md mx-auto">
              The custody hash chain has been extended to Vault Custodian Sgt. Rodriguez. GPS transit telemetry has been automatically concluded.
            </p>

            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => setStep('SCANNING')}
                className="px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30"
              >
                Scan Next Evidence Item
              </button>

              <Link
                href="/vault/dashboard"
                className="px-5 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
              >
                Vault Dashboard
              </Link>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
