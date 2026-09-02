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
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type ScanStep = 'INPUT_TOKEN' | 'STORED_SUCCESS'

export default function VaultScanPage() {
  const [step, setStep] = useState<ScanStep>('INPUT_TOKEN')
  const [tokenInput, setTokenInput] = useState('')
  const [evidenceId, setEvidenceId] = useState('')
  const [locationForm, setLocationForm] = useState({
    vaultId: 'VAULT-01',
    rack: 'RACK-B',
    shelf: 'SHELF-04',
    bin: 'BIN-12',
    notes: 'Stored in secure evidence locker.',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [receiptResult, setReceiptResult] = useState<any>(null)

  const handleReceiveAndStore = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!tokenInput.trim() || !evidenceId.trim()) {
      toast.error('Evidence ID and Handover Token are required')
      return
    }

    setLoading(true)
    setError(null)

    try {
      // Step 1: Receive custody transfer via token
      const receiveRes = await fetch(`/api/evidence/${evidenceId.trim()}/receive`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handover_token: tokenInput.trim(),
          notes: locationForm.notes,
        }),
      })
      const receiveJson = await receiveRes.json()

      if (!receiveRes.ok) {
        throw new Error(receiveJson.error ?? 'Custody transfer failed')
      }

      // Step 2: Record vault physical location
      const vaultRes = await fetch(`/api/evidence/${evidenceId.trim()}/vault`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          handover_token: tokenInput.trim(),
          vault_id: locationForm.vaultId,
          rack: locationForm.rack || undefined,
          shelf: locationForm.shelf || undefined,
          bin: locationForm.bin || undefined,
          notes: locationForm.notes || undefined,
        }),
      })
      const vaultJson = await vaultRes.json()

      setReceiptResult({
        evidence_id: evidenceId,
        custody_hash: receiveJson.data?.custody_hash,
        location: vaultJson.data?.location_label ?? `${locationForm.vaultId} / ${locationForm.rack} / ${locationForm.shelf} / ${locationForm.bin}`,
      })

      setStep('STORED_SUCCESS')
      toast.success('Evidence received into vault custody and physical location indexed.')
    } catch (err: any) {
      setError(err.message ?? 'Vault intake failed')
      toast.error(err.message ?? 'Vault intake failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <AppShell
      role="VAULT_CUSTODIAN"
      title="Evidence Intake & Location Indexing"
      breadcrumbs={[{ label: 'Home' }, { label: 'Vault Facility', href: '/vault/dashboard' }, { label: 'Scan QR' }]}
      userName="Vault Custodian"
    >
      <div className="max-w-2xl mx-auto space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: TOKEN / SCAN INPUT & STORAGE FORM */}
        {step === 'INPUT_TOKEN' && (
          <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6">
            <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
                <ScanLine className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                  Vault Custody Intake & Storage Assignment
                </h3>
                <p className="text-xs text-slate-500">
                  Verify digital handover token, extend the hash chain, and record vault coordinates
                </p>
              </div>
            </div>

            <form onSubmit={handleReceiveAndStore} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Evidence UUID *
                  </label>
                  <input
                    type="text"
                    required
                    value={evidenceId}
                    onChange={(e) => setEvidenceId(e.target.value)}
                    placeholder="e.g. 550e8400-e29b-41d4-a716-446655440000"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Handover Token (JWT or Scanned QR) *
                  </label>
                  <input
                    type="text"
                    required
                    value={tokenInput}
                    onChange={(e) => setTokenInput(e.target.value)}
                    placeholder="Paste or scan handover JWT token"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="pt-2 border-t border-slate-100 dark:border-slate-800">
                <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5 mb-3">
                  <Building2 className="w-4 h-4 text-blue-500" />
                  Physical Vault Location Coordinates
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

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {loading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <CheckCircle2 className="w-4 h-4" />
                )}
                <span>Verify Token & Confirm Vault Storage</span>
              </button>
            </form>
          </div>
        )}

        {/* STEP 2: STORED SUCCESS CONFIRMATION */}
        {step === 'STORED_SUCCESS' && receiptResult && (
          <div className="forenza-card p-8 rounded-3xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-[#111827] shadow-xl text-center space-y-4 animate-in zoom-in-95">
            <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <CheckCircle2 className="w-10 h-10" />
            </div>

            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100">
                VAULT INTAKE COMPLETED
              </h3>
              <p className="text-xs text-slate-500 mt-1 font-mono">
                LOCATION: {receiptResult.location}
              </p>
            </div>

            {receiptResult.custody_hash && (
              <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 text-xs font-mono text-emerald-600 dark:text-emerald-400">
                <span className="text-[10px] text-slate-400 block">NEW CUSTODY HASH</span>
                <span>{receiptResult.custody_hash}</span>
              </div>
            )}

            <div className="pt-4 flex justify-center gap-3">
              <button
                type="button"
                onClick={() => { setStep('INPUT_TOKEN'); setTokenInput(''); setEvidenceId(''); }}
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
