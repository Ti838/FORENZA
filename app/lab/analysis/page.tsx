'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
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
  Loader2,
} from 'lucide-react'
import { toast } from 'sonner'

function LabAnalysisContent() {
  const searchParams = useSearchParams()
  const initialEvidenceId = searchParams.get('evidence_id') ?? ''

  const [evidenceId, setEvidenceId] = useState(initialEvidenceId)
  const [evidence, setEvidence] = useState<any>(null)
  const [samples, setSamples] = useState<any[]>([])

  // Register new sample state
  const [sampleNumber, setSampleNumber] = useState('SMP-001')
  const [sampleDesc, setSampleDesc] = useState('Biological DNA extraction aliquot')
  const [quantityUnit, setQuantityUnit] = useState('mg')
  const [initialQuantity, setInitialQuantity] = useState(10.0)

  // Report upload state
  const [reportTitle, setReportTitle] = useState('DNA Profile Matching Report')
  const [reportFile, setReportFile] = useState<File | null>(null)
  const [isFinalReport, setIsFinalReport] = useState(true)
  const [reportNotes, setReportNotes] = useState('')

  const [loading, setLoading] = useState(false)
  const [submittingSample, setSubmittingSample] = useState(false)
  const [uploadingReport, setUploadingReport] = useState(false)
  const [uploadedReportData, setUploadedReportData] = useState<any>(null)

  const fetchEvidenceData = async (id: string) => {
    if (!id) return
    setLoading(true)
    try {
      const [evRes, sampleRes] = await Promise.all([
        fetch(`/api/evidence/${id}`),
        fetch(`/api/lab/${id}/sample`),
      ])

      if (evRes.ok) {
        const evJson = await evRes.json()
        setEvidence(evJson.data)
      }
      if (sampleRes.ok) {
        const sJson = await sampleRes.json()
        setSamples(sJson.data ?? [])
      }
    } catch (err) {
      console.error('[FORENZA LAB]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialEvidenceId) {
      fetchEvidenceData(initialEvidenceId)
    }
  }, [initialEvidenceId])

  const handleRegisterSample = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evidenceId.trim()) {
      toast.error('Please specify an evidence ID')
      return
    }

    setSubmittingSample(true)
    try {
      const res = await fetch(`/api/lab/${evidenceId.trim()}/sample`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          sample_number: sampleNumber,
          description: sampleDesc,
          quantity_unit: quantityUnit,
          initial_quantity: initialQuantity,
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to register sample')
      }

      toast.success(`Sample ${sampleNumber} registered and forensic state updated to UNDER_ANALYSIS.`)
      fetchEvidenceData(evidenceId.trim())
    } catch (err: any) {
      toast.error(err.message ?? 'Sample registration failed')
    } finally {
      setSubmittingSample(false)
    }
  }

  const handleUploadReport = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!evidenceId.trim() || !reportFile) {
      toast.error('Evidence ID and PDF report file are required')
      return
    }

    setUploadingReport(true)
    try {
      const fd = new FormData()
      fd.append('file', reportFile)
      fd.append('title', reportTitle)
      fd.append('is_final', isFinalReport ? 'true' : 'false')
      if (reportNotes) fd.append('notes', reportNotes)

      const res = await fetch(`/api/lab/${evidenceId.trim()}/report`, {
        method: 'POST',
        body: fd,
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Report upload failed')
      }

      setUploadedReportData(json.data)
      toast.success('Certified Forensic Laboratory Report sealed with SHA-256 hash!')
      fetchEvidenceData(evidenceId.trim())
    } catch (err: any) {
      toast.error(err.message ?? 'Report sealing failed')
    } finally {
      setUploadingReport(false)
    }
  }

  return (
    <AppShell
      role="LAB_ANALYST"
      title="Forensic Scientific Analysis Workstation"
      breadcrumbs={[{ label: 'Home' }, { label: 'Lab Desk', href: '/lab/dashboard' }, { label: 'Analysis' }]}
      userName="Forensic Lab Analyst"
    >
      <div className="max-w-4xl mx-auto space-y-6">
        {/* Evidence Selection Bar */}
        <div className="forenza-card p-4 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] flex flex-col sm:flex-row items-center gap-3">
          <div className="flex-1 w-full">
            <label className="block text-[11px] font-bold text-slate-500 uppercase mb-1">
              Active Evidence UUID
            </label>
            <input
              type="text"
              value={evidenceId}
              onChange={(e) => setEvidenceId(e.target.value)}
              placeholder="Enter evidence UUID to inspect or analyze"
              className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
            />
          </div>
          <button
            type="button"
            onClick={() => fetchEvidenceData(evidenceId.trim())}
            disabled={loading || !evidenceId.trim()}
            className="sm:self-end px-4 py-2 rounded-xl text-xs font-bold bg-purple-600 hover:bg-purple-700 text-white transition-colors disabled:opacity-50"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Load Evidence'}
          </button>
        </div>

        {evidence && (
          <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
            <div className="flex items-start justify-between gap-3 pb-4 mb-4 border-b border-slate-100 dark:border-slate-800">
              <div>
                <span className="text-[11px] font-mono font-bold text-purple-600 dark:text-purple-400 uppercase tracking-wider block">
                  LAB EVIDENCE UNDER INVESTIGATION
                </span>
                <h2 className="text-xl font-extrabold font-mono text-slate-900 dark:text-slate-100 mt-0.5">
                  {evidence.evidence_number}
                </h2>
              </div>

              <StatusBadge status={evidence.status} size="md" />
            </div>

            {evidence.master_hash && (
              <HashCard
                hash={evidence.master_hash}
                title="SHA-256 MASTER EVIDENCE HASH"
                subtitle="Verified intake from chain of custody"
                status="VERIFIED"
              />
            )}
          </div>
        )}

        {/* Sample Registration */}
        <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-purple-600 dark:text-purple-400">
            <Scale className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Register Physical Laboratory Sub-Sample
            </h3>
          </div>

          <form onSubmit={handleRegisterSample} className="space-y-3">
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Sample ID *
                </label>
                <input
                  type="text"
                  required
                  value={sampleNumber}
                  onChange={(e) => setSampleNumber(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Initial Quantity *
                </label>
                <input
                  type="number"
                  step="0.01"
                  min="0.01"
                  required
                  value={initialQuantity}
                  onChange={(e) => setInitialQuantity(parseFloat(e.target.value) || 0)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Unit *
                </label>
                <input
                  type="text"
                  required
                  value={quantityUnit}
                  onChange={(e) => setQuantityUnit(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-mono font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Description *
                </label>
                <input
                  type="text"
                  required
                  value={sampleDesc}
                  onChange={(e) => setSampleDesc(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-purple-500"
                />
              </div>
            </div>

            <div className="flex justify-end pt-1">
              <button
                type="submit"
                disabled={submittingSample || !evidenceId.trim()}
                className="px-5 py-2 rounded-xl font-bold text-xs bg-purple-600 hover:bg-purple-700 text-white transition-colors shadow-sm disabled:opacity-50 flex items-center gap-1.5"
              >
                {submittingSample ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                <span>Register Sample Aliquot</span>
              </button>
            </div>
          </form>

          {/* Registered Samples List */}
          {samples.length > 0 && (
            <div className="pt-3 border-t border-slate-100 dark:border-slate-800">
              <span className="text-[11px] font-bold text-slate-500 uppercase block mb-2">Registered Aliquots</span>
              <div className="space-y-2">
                {samples.map((s) => (
                  <div key={s.id} className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between text-xs font-mono">
                    <div>
                      <span className="font-bold text-slate-900 dark:text-slate-100">{s.sample_number}</span>
                      <span className="text-slate-500 ml-2">({s.description})</span>
                    </div>
                    <span className="font-bold text-purple-600 dark:text-purple-400">
                      {s.initial_quantity} {s.quantity_unit}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Certified Forensic Lab Report Upload & Sealing */}
        <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-4">
          <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400">
            <FileCheck className="w-5 h-5" />
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              Upload Certified Laboratory Report (PDF)
            </h3>
          </div>

          <form onSubmit={handleUploadReport} className="space-y-4">
            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Report Title / Finding Summary *
              </label>
              <input
                type="text"
                required
                value={reportTitle}
                onChange={(e) => setReportTitle(e.target.value)}
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-bold text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
              />
            </div>

            <div>
              <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                Attach Forensic PDF Document *
              </label>
              <input
                type="file"
                required
                accept="application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                onChange={(e) => setReportFile(e.target.files?.[0] ?? null)}
                className="w-full text-xs text-slate-600 file:mr-4 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={uploadingReport || !reportFile || !evidenceId.trim()}
                className="px-6 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center gap-2 disabled:opacity-50"
              >
                {uploadingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <Lock className="w-4 h-4" />}
                <span>Seal Certified Lab Report & Submit to Court</span>
              </button>
            </div>
          </form>

          {uploadedReportData && (
            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-300 dark:border-emerald-800 flex items-start gap-3 animate-in zoom-in-95">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
              <div>
                <h4 className="font-bold text-sm text-emerald-900 dark:text-emerald-200">
                  {uploadedReportData.title} (v{uploadedReportData.version})
                </h4>
                <p className="text-xs text-emerald-700 dark:text-emerald-300 font-mono mt-0.5">
                  SHA-256 SEAL: {uploadedReportData.file_sha256}
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </AppShell>
  )
}

export default function LabAnalysisPage() {
  return (
    <Suspense fallback={
      <AppShell role="LAB_ANALYST" title="Forensic Lab Analysis" breadcrumbs={[{ label: 'Home' }, { label: 'Analysis' }]}>
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-purple-600" />
          <span>Loading analysis workstation…</span>
        </div>
      </AppShell>
    }>
      <LabAnalysisContent />
    </Suspense>
  )
}
