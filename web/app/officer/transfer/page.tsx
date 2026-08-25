'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import { toast } from 'sonner'

export default function OfficerTransferPage() {
  const [selectedEvidence, setSelectedEvidence] = useState('EVD-2024-0089')
  const [handoverToken, setHandoverToken] = useState<string | null>(null)
  const [notes, setNotes] = useState('')

  const handleGenerateHandover = () => {
    // Generate signed handover token for custody transfer
    const fakeToken = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJqdGkiOiJoYW5kb3Zlci04ODkiLCJzZW5kZXIiOiJ1c2VyLTQwMjgiLCJ0eXBlIjoiQ1VTVE9EWV9IQU5ET1ZFUiIsImlhdCI6MTcwNjAwMDAwMCwiZXhwIjoxNzA2MDAwOTAwfQ.transfer_signature`
    setHandoverToken(fakeToken)
    toast.success('Single-use custody handover token generated. Valid for 15 minutes.')
  }

  return (
    <AppShell
      role="INVESTIGATING_OFFICER"
      title="Custody Transfer & Handover"
      breadcrumbs={[{ label: 'Home' }, { label: 'Officer Desk', href: '/officer/dashboard' }, { label: 'Custody Handover' }]}
      userName="Detective Marcus Vance"
      badgeNumber="4028"
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

          {!handoverToken ? (
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Select Evidence in Your Current Possession *
                </label>
                <select
                  value={selectedEvidence}
                  onChange={(e) => setSelectedEvidence(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                >
                  <option value="EVD-2024-0089">EVD-2024-0089 • Weapon (Tactical Knife) • CASE-2024-041</option>
                  <option value="EVD-2024-0091">EVD-2024-0091 • Document (Financial Ledger) • CASE-2024-041</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Transfer Notes & Exigency Metadata
                </label>
                <textarea
                  rows={2}
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="e.g. Handing over to Central Evidence Vault intake officer Sgt. Rodriguez."
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
                onClick={handleGenerateHandover}
                className="w-full py-3.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <Key className="w-4 h-4" />
                <span>Generate Handover QR Token</span>
              </button>
            </div>
          ) : (
            <div className="space-y-6 text-center animate-in zoom-in-95">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 text-xs font-bold font-mono">
                <Clock className="w-3.5 h-3.5" />
                <span>HANDOVER TOKEN EXPIRES IN 14:48</span>
              </div>

              <QRCard
                evidenceNumber={selectedEvidence}
                evidenceId="550e8400-e29b-41d4-a716-446655440000"
                caseNumber="CASE-2024-041"
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
