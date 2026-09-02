'use client'

import { useState, useEffect } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  FolderLock,
  Camera,
  Plus,
  ArrowRight,
  MapPin,
  Clock,
  Loader2,
  AlertCircle,
  FilePlus2,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

interface CaseRow {
  id: string
  case_number: string
  title: string
  crime_type: string
  status: string
  crime_scene_latitude: number | null
  crime_scene_longitude: number | null
  created_at: string
}

export default function OfficerCasesPage() {
  const [cases, setCases] = useState<CaseRow[]>([])
  const [loading, setLoading] = useState(true)
  const [registeringCaseId, setRegisteringCaseId] = useState<string | null>(null)
  const [evidenceNumber, setEvidenceNumber] = useState('')
  const [submitting, setSubmitting] = useState(false)

  const fetchCases = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/cases?status=ACTIVE&per_page=50')
      if (res.ok) {
        const json = await res.json()
        setCases(json.data ?? [])
      }
    } catch (err) {
      console.error('[FORENZA CASES]', err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCases()
  }, [])

  const handleRegisterAndCapture = async (caseId: string) => {
    if (!evidenceNumber.trim()) {
      toast.error('Please specify an evidence identifier (e.g. EVD-2024-0099)')
      return
    }

    setSubmitting(true)
    try {
      const res = await fetch('/api/evidence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          case_id: caseId,
          evidence_number: evidenceNumber.trim().toUpperCase(),
        }),
      })
      const json = await res.json()

      if (!res.ok) {
        throw new Error(json.error ?? 'Failed to register evidence item')
      }

      toast.success(`Evidence ${json.data.evidence_number} registered. Opening capture viewfinder…`)
      window.location.href = `/officer/capture?case_id=${caseId}&evidence_id=${json.data.id}`
    } catch (err: any) {
      toast.error(err.message ?? 'Registration failed')
      setSubmitting(false)
    }
  }

  return (
    <AppShell
      role="INVESTIGATING_OFFICER"
      title="Assigned Investigation Cases"
      breadcrumbs={[{ label: 'Home' }, { label: 'Officer Desk', href: '/officer/dashboard' }, { label: 'Cases' }]}
    >
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
              Assigned Investigation Perimeters
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Select a case perimeter to register and capture geotagged physical evidence
            </p>
          </div>
        </div>

        {loading ? (
          <div className="p-12 text-center text-slate-500 text-sm flex flex-col items-center gap-2">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span>Loading active case perimeters…</span>
          </div>
        ) : cases.length === 0 ? (
          <div className="p-8 text-center text-slate-500 text-xs forenza-card rounded-2xl">
            No active cases currently assigned.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {cases.map((c) => (
              <div
                key={c.id}
                className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between gap-4"
              >
                <div>
                  <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800">
                    <div className="flex items-center gap-2">
                      <FolderLock className="w-4 h-4 text-blue-500" />
                      <span className="font-mono font-bold text-xs text-slate-900 dark:text-slate-100">
                        {c.case_number}
                      </span>
                    </div>
                    <StatusBadge status={c.status} size="sm" />
                  </div>

                  <h3 className="text-base font-extrabold text-slate-900 dark:text-slate-100">
                    {c.title}
                  </h3>
                  <p className="text-xs text-slate-500 mt-1">{c.crime_type}</p>

                  {c.crime_scene_latitude && c.crime_scene_longitude && (
                    <div className="mt-3 inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-slate-50 dark:bg-[#0B0F19] text-[11px] font-mono text-slate-600 dark:text-slate-400 border border-slate-200/80 dark:border-slate-800">
                      <MapPin className="w-3.5 h-3.5 text-blue-500" />
                      <span>Scene: {Number(c.crime_scene_latitude).toFixed(4)}°, {Number(c.crime_scene_longitude).toFixed(4)}° (500m Geofence)</span>
                    </div>
                  )}
                </div>

                {registeringCaseId === c.id ? (
                  <div className="p-3 rounded-2xl bg-blue-50/60 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-2">
                    <label className="block text-[11px] font-bold text-blue-900 dark:text-blue-200">
                      New Evidence Item Number *
                    </label>
                    <input
                      type="text"
                      value={evidenceNumber}
                      onChange={(e) => setEvidenceNumber(e.target.value)}
                      placeholder="e.g. EVD-2024-0101"
                      className="w-full px-3 py-1.5 rounded-xl text-xs bg-white dark:bg-[#0B0F19] border border-blue-300 dark:border-blue-800 font-mono text-slate-900 dark:text-slate-100 outline-none"
                    />
                    <div className="flex items-center justify-end gap-2 pt-1">
                      <button
                        type="button"
                        onClick={() => setRegisteringCaseId(null)}
                        className="px-3 py-1 text-xs text-slate-500"
                      >
                        Cancel
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={() => handleRegisterAndCapture(c.id)}
                        className="px-4 py-1.5 rounded-xl text-xs font-bold bg-blue-600 text-white flex items-center gap-1 shadow-sm disabled:opacity-50"
                      >
                        {submitting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Camera className="w-3.5 h-3.5" />}
                        <span>Register & Launch Camera</span>
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        setRegisteringCaseId(c.id)
                        setEvidenceNumber(`EVD-${new Date().getFullYear()}-${Math.floor(1000 + Math.random() * 9000)}`)
                      }}
                      className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Acquire New Evidence</span>
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  )
}
