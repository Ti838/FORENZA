'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { HashCard } from '@/components/forensic/HashCard'
import {
  FlaskConical,
  ShieldCheck,
  FileCheck,
  Scale,
  Plus,
  Lock,
  Upload,
  AlertCircle,
  CheckCircle2,
} from 'lucide-react'
import { toast } from 'sonner'

export default function LabAnalysisPage() {
  const [sample, setSample] = useState({
    id: 'SMP-2024-001',
    evidenceNumber: 'EVD-2024-0090',
    caseNumber: 'CASE-2024-041',
    category: 'Biological (Blood Swab)',
    initialQuantity: 10.0,
    consumedQuantity: 2.5,
    unit: 'mg',
    masterHash: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
  })

  const [consumptionInput, setConsumptionInput] = useState<number>(1.5)
  const [purpose, setPurpose] = useState('PCR DNA amplification sequencing')
  const [reportTitle, setReportTitle] = useState('DNA Profile Matching Report #882')
  const [reportUploaded, setReportUploaded] = useState(false)

  const remainingQuantity = sample.initialQuantity - sample.consumedQuantity

  const handleConsumeSample = (e: React.FormEvent) => {
    e.preventDefault()
    if (consumptionInput <= 0) {
      toast.error('Consumption amount must be greater than 0.')
      return
    }

    if (sample.consumedQuantity + consumptionInput > sample.initialQuantity) {
      toast.error(
        `Consumption exceeds sample initial quantity! Available: ${remainingQuantity.toFixed(
          2
        )} ${sample.unit}`
      )
      return
    }

    setSample((prev) => ({
      ...prev,
      consumedQuantity: prev.consumedQuantity + consumptionInput,
    }))
    toast.success(
      `Sample consumption of ${consumptionInput} ${sample.unit} logged in forensic audit ledger.`
    )
    setConsumptionInput(0.5)
  }

  const handleSealReport = (e: React.FormEvent) => {
    e.preventDefault()
    setReportUploaded(true)
    toast.success('Certified Forensic Laboratory Report sealed with SHA-256 hash!')
  }

  return (
    <AppShell
      role="LAB_ANALYST"
      title="Forensic Scientific Analysis Workstation"
      breadcrumbs={[{ label: 'Home' }, { label: 'Lab Desk', href: '/lab/dashboard' }, { label: 'Analysis' }]}
      userName="Dr. Aris Thorne"
      badgeNumber="LAB-882"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Evidence Header Card */}
        <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
          <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
            <div>
              <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                LAB SAMPLE UNDER INVESTIGATION
              </span>
              <h2 className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                {sample.evidenceNumber} • {sample.category}
              </h2>
              <p className="text-xs text-slate-500 font-mono">CASE: {sample.caseNumber}</p>
            </div>

            <StatusBadge status="UNDER_ANALYSIS" size="md" />
          </div>

          {/* Master Hash Seal Check */}
          <HashCard
            hash={sample.masterHash}
            title="SHA-256 INTAKE HASH SEAL"
            subtitle="Verified at laboratory intake from Vault Facility #1"
            status="VERIFIED"
          />
        </div>

        {/* Sample Consumption & Depletion Guard */}
        <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Scale className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Sample Quantity & Depletion Control
            </h3>
          </div>

          {/* Quantity Balance Cards */}
          <div className="grid grid-cols-3 gap-3 text-center">
            <div className="p-3 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800">
              <span className="text-[11px] text-slate-500 font-bold block">Initial Quantity</span>
              <span className="text-lg font-mono font-extrabold text-slate-900 dark:text-slate-100 mt-1 block">
                {sample.initialQuantity.toFixed(2)} {sample.unit}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-purple-50/60 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50">
              <span className="text-[11px] text-purple-700 dark:text-purple-300 font-bold block">
                Total Consumed
              </span>
              <span className="text-lg font-mono font-extrabold text-purple-600 dark:text-purple-400 mt-1 block">
                {sample.consumedQuantity.toFixed(2)} {sample.unit}
              </span>
            </div>

            <div className="p-3 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200 dark:border-emerald-900/50">
              <span className="text-[11px] text-emerald-700 dark:text-emerald-300 font-bold block">
                Remaining Balance
              </span>
              <span className="text-lg font-mono font-extrabold text-emerald-600 dark:text-emerald-400 mt-1 block">
                {remainingQuantity.toFixed(2)} {sample.unit}
              </span>
            </div>
          </div>

          {/* Log Sample Consumption Form */}
          <form onSubmit={handleConsumeSample} className="pt-2 flex flex-col sm:flex-row gap-3">
            <div className="w-full sm:w-48">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Consume Amount ({sample.unit}) *
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                max={remainingQuantity}
                value={consumptionInput}
                onChange={(e) => setConsumptionInput(parseFloat(e.target.value) || 0)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
              />
            </div>

            <div className="flex-1">
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Analytical Purpose / Test Description *
              </label>
              <input
                type="text"
                required
                value={purpose}
                onChange={(e) => setPurpose(e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
              />
            </div>

            <div className="sm:self-end">
              <button
                type="submit"
                className="w-full sm:w-auto px-4 py-2 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm"
              >
                Log Consumption
              </button>
            </div>
          </form>
        </div>

        {/* Certified Forensic Lab Report Upload & Sealing */}
        <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <FileCheck className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Certified Forensic Laboratory Report
            </h3>
          </div>

          {!reportUploaded ? (
            <form onSubmit={handleSealReport} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Report Title / Scientific Finding Summary *
                </label>
                <input
                  type="text"
                  required
                  value={reportTitle}
                  onChange={(e) => setReportTitle(e.target.value)}
                  className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              {/* Upload Dropzone */}
              <div className="border-2 border-dashed border-slate-300 dark:border-slate-800 rounded-2xl p-6 text-center text-xs text-slate-500 space-y-2 bg-slate-50 dark:bg-[#0B0F19]">
                <Upload className="w-8 h-8 text-blue-500 mx-auto" />
                <p className="font-semibold text-slate-700 dark:text-slate-300">
                  Select Certified PDF Lab Report (e.g. DNA_Profile_Match.pdf)
                </p>
                <p className="text-[11px] text-slate-400">
                  SHA-256 hash will be computed automatically upon upload and sealed into the custody chain.
                </p>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Seal Certified Lab Report & Submit to Court</span>
                </button>
              </div>
            </form>
          ) : (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  {reportTitle} (Version 1.0 - FINAL)
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  SHA-256 SEAL: 8f498a7d...391a (Verified) • Analyst: Dr. Aris Thorne
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}
