'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { QRCard } from '@/components/forensic/QRCard'
import {
  ArrowRightLeft,
  ShieldCheck,
  Clock,
  Key,
  QrCode,
  CheckCircle2,
  AlertTriangle,
  Fingerprint,
  Loader2,
  AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'

interface EvidenceOption {
  id: string
  evidence_number: string
  status: string
  case?: { case_number: string }
  classification?: { final_category?: string; final_object?: string }
}

function OfficerTransferContent() {
  const searchParams = useSearchParams()
  const initialEvidenceId = searchParams.get('evidence_id') ?? ''

  const [evidenceList, setEvidenceList] = useState<EvidenceOption[]>([])
  const [selectedEvidenceId, setSelectedEvidenceId] = useState(initialEvidenceId)
  const [handoverToken, setHandoverToken] = useState<string | null>(null)
  const [tokenExpiresAt, setTokenExpiresAt] = useState<string | null>(null)
  const [notes, setNotes] = useState('')
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const fetchHoldings = async () => {
      setLoading(true)
      try {
        const res = await fetch('/api/evidence?per_page=50')
        if (res.ok) {
          const json = await res.json()
          const items: EvidenceOption[] = (json.data ?? []).filter(
            (e: any) => ['SEALED', 'IN_TRANSIT', 'TRANSFERRED'].includes(e.status)
          )
          setEvidenceList(items)
          if (!selectedEvidenceId && items.length > 0) {
            setSelectedEvidenceId(items[0].id)
          }
        }
      } catch (err) {
        console.error('[FORENZA TRANSFER]', err)
      } finally {
        setLoading(false)
      }
    }
    fetchHoldings()
  }, [])

  const selectedEvidence = evidenceList.find((e) => e.id === selectedEvidenceId)

  const handleGenerateHandover = async () => {
    if (!selectedEvidenceId) {
      toast.error('Please select an evidence item first')
      return
    }

    setGenerating(true)
    setError(null)

    try {
      const res = await fetch(`/api/evidence/${selectedEvidenceId}/transfer`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes }),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to generate transfer token')
      }

      setHandoverToken(json.data.handover_token)
      setTokenExpiresAt(json.data.expires_at)
      toast.success('Single-use custody handover token generated. Valid for 15 minutes.')
    } catch (err: any) {
      setError(err.message ?? 'Token generation failed')
      toast.error(err.message ?? 'Transfer initiation failed')
    } finally {
      setGenerating(false)
    }
  }

  return (
    <AppShell
      role="INVESTIGATING_OFFICER"
      title="Custody Transfer & Handover"
      breadcrumbs={[{ label: 'Home' }, { label: 'Officer Desk', href: '/officer/dashboard' }, { label: 'Custody Handover' }]}
    >
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6">
          <div className="flex items-center gap-3 pb-4 border-b border-slate-100 dark:border-slate-800">
            <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
              <ArrowRightLeft className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Initiate Chain of Custody Transfer
              </h3>
              <p className="text-xs text-slate-500">
                Extend the tamper-evident hash chain to the receiving custodian
              </p>
            </div>
          </div>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <span>{error}</span>
            </div>
          )}

          {!handoverToken ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Select Evidence in Your Current Possession *
                </label>
                {loading ? (
                  <div className="p-3 text-xs text-slate-500 flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Loading available evidence items…</span>
                  </div>
                ) : evidenceList.length === 0 ? (
                  <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300">
                    No sealed evidence items currently available for transfer. Capture and seal evidence first.
                  </div>
                ) : (
                  <select
                    value={selectedEvidenceId}
                    onChange={(e) => setSelectedEvidenceId(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  >
                    {evidenceList.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.evidence_number} • {e.classification?.final_category ?? 'Item'} • {e.case?.case_number ?? 'Case'} ({e.status})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Transfer Notes & Exigency Metadata
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Handing over to Central Evidence Vault intake officer or Lab Analyst."
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="p-3.5 rounded-xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 flex items-start gap-2.5 text-xs text-blue-700 dark:text-blue-300">
                <ShieldCheck className="w-4 h-4 shrink-0 mt-0.5" />
                <span>
                  Generating a transfer token creates an atomic cryptographic event. The receiving custodian must scan your token within 15 minutes.
                </span>
              </div>

              <button
                type="button"
                disabled={generating || evidenceList.length === 0}
                onClick={handleGenerateHandover}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
              >
                {generating ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Key className="w-4 h-4" />
                )}
                <span>Generate Handover QR Token</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center animate-in zoom-in-95">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>SINGLE-USE HANDOVER TOKEN ACTIVE</span>
              </div>

              <QRCard
                evidenceNumber={selectedEvidence?.evidence_number ?? selectedEvidenceId}
                evidenceId={selectedEvidenceId}
                caseNumber={selectedEvidence?.case?.case_number ?? 'CASE'}
                qrToken={handoverToken}
                status="TRANSFERRED"
              />

              <p className="text-xs text-slate-500 max-w-sm mx-auto">
                Present this QR code to the receiving Vault Custodian or Lab Analyst to verify and complete custody handover.
              </p>

              <button
                type="button"
                onClick={() => setHandoverToken(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200"
              >
                Cancel / Select Another Item
              </button>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function OfficerTransferPage() {
  return (
    <Suspense fallback={
      <AppShell role="INVESTIGATING_OFFICER" title="Custody Transfer" breadcrumbs={[{ label: 'Home' }, { label: 'Transfer' }]}>
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Loading transfer holdings…</span>
        </div>
      </AppShell>
    }>
      <OfficerTransferContent />
    </Suspense>
  )
}
