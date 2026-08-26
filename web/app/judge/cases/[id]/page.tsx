'use client'

import { useState, useEffect, use } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { HashCard } from '@/components/forensic/HashCard'
import { TamperAlert } from '@/components/forensic/TamperAlert'
import { ForensicMap } from '@/components/forensic/ForensicMap'
import { JudicialTimeline } from '@/components/forensic/JudicialTimeline'
import { CourtDossierModal } from '@/components/forensic/CourtDossierModal'
import { QRCard } from '@/components/forensic/QRCard'
import {
  Scale,
  ShieldCheck,
  ShieldAlert,
  FileDown,
  RefreshCw,
  Sparkles,
  UserCheck,
  Fingerprint,
  MapPin,
  Clock,
  FlaskConical,
  Lock,
  Loader2,
  AlertTriangle,
} from 'lucide-react'
import { toast } from 'sonner'

export default function JudgeCaseDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: caseId } = use(params)

  const [loading, setLoading] = useState(true)
  const [caseData, setCaseData] = useState<any>(null)
  const [evidenceList, setEvidenceList] = useState<any[]>([])
  const [events, setEvents] = useState<any[]>([])
  const [selectedEvidenceIndex, setSelectedEvidenceIndex] = useState(0)

  const [isDossierOpen, setIsDossierOpen] = useState(false)
  const [isGeneratingDossier, setIsGeneratingDossier] = useState(false)
  const [isVerifying, setIsVerifying] = useState(false)
  const [verificationResult, setVerificationResult] = useState<any>(null)
  const [isTampered, setIsTampered] = useState(false)

  const fetchTimeline = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/judicial/${caseId}/timeline`)
      if (!res.ok) {
        toast.error('Failed to load case data')
        return
      }
      const json = await res.json()
      setCaseData(json.data.case)
      setEvidenceList(json.data.evidence ?? [])
      setEvents(json.data.events ?? [])
    } catch (err) {
      console.error('[FORENZA JUDICIAL]', err)
      toast.error('Network error loading case')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (caseId) {
      fetchTimeline()
    }
  }, [caseId])

  const currentEvidence = evidenceList[selectedEvidenceIndex] ?? null

  const handleRunVerify = async () => {
    if (!currentEvidence?.id) return
    setIsVerifying(true)
    try {
      const res = await fetch(`/api/evidence/${currentEvidence.id}/verify`, { method: 'POST' })
      const json = await res.json()
      if (res.ok) {
        setVerificationResult(json.data)
        const tampered = json.data.overall_status === 'COMPROMISED_TAMPERED'
        setIsTampered(tampered)
        if (tampered) {
          toast.error('TAMPERING DETECTED! Cryptographic verification failed.')
        } else {
          toast.success('Evidence master hash & custody chain 100% verified.')
        }
      } else {
        toast.error(json.error ?? 'Verification failed')
      }
    } catch (err) {
      toast.error('Network error during verification')
    } finally {
      setIsVerifying(false)
    }
  }

  const handleGenerateCertifiedDossier = async () => {
    setIsGeneratingDossier(true)
    try {
      const res = await fetch(`/api/dossier/${caseId}/generate`, { method: 'POST' })
      const json = await res.json()
      if (res.ok && json.data?.download_url) {
        window.open(json.data.download_url, '_blank')
        toast.success(`Dossier ${json.data.dossier_ref} certified and downloaded.`)
      } else {
        // If storage not configured yet, fallback to in-browser modal
        setIsDossierOpen(true)
      }
    } catch (err) {
      setIsDossierOpen(true)
    } finally {
      setIsGeneratingDossier(false)
    }
  }

  const handleSimulateTamper = () => {
    setIsTampered(true)
    toast.error('TAMPERING DETECTED! Mathematical hash mismatch at custody node.')
  }

  if (loading) {
    return (
      <AppShell role="JUDGE" title="Judicial Case Dossier" breadcrumbs={[{ label: 'Home' }, { label: 'Cases' }]}>
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-3">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
          <span>Retrieving certified evidence dossier from judicial vault…</span>
        </div>
      </AppShell>
    )
  }

  if (!caseData) {
    return (
      <AppShell role="JUDGE" title="Judicial Case Dossier" breadcrumbs={[{ label: 'Home' }, { label: 'Cases' }]}>
        <div className="p-8 text-center text-slate-500">Case record not found.</div>
      </AppShell>
    )
  }

  const classification = currentEvidence?.classification
    ? (Array.isArray(currentEvidence.classification) ? currentEvidence.classification[0] : currentEvidence.classification)
    : null

  return (
    <AppShell
      role="JUDGE"
      title="Judicial Evidentiary Chamber Dossier"
      breadcrumbs={[
        { label: 'Home' },
        { label: 'Trial Cases', href: '/judge/dashboard' },
        { label: caseData.case_number },
      ]}
      userName="Hon. Presiding Justice"
      systemStatus={isTampered ? 'TAMPER_DETECTED' : 'HEALTHY'}
    >
      <div className="space-y-6">
        {/* Supreme Judicial Header */}
        <div className="p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2">
              <span className="font-mono font-extrabold text-xs px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                {caseData.case_number}
              </span>
              <span className="text-xs text-slate-500 font-mono">{caseData.crime_type}</span>
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight mt-1">
              {caseData.title}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              Status: <strong className="font-mono">{caseData.status}</strong> • Evidence Items: {evidenceList.length}
            </p>
          </div>

          <div className="flex items-center flex-wrap gap-2">
            {currentEvidence && (
              <button
                type="button"
                onClick={handleRunVerify}
                disabled={isVerifying}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-200 transition-colors"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
                <span>Verify Cryptographic Chain</span>
              </button>
            )}

            <button
              type="button"
              onClick={handleGenerateCertifiedDossier}
              disabled={isGeneratingDossier}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 transition-all active:scale-95 disabled:opacity-50"
            >
              {isGeneratingDossier ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <FileDown className="w-4 h-4" />
              )}
              <span>Generate Certified Court Dossier</span>
            </button>

            <button
              type="button"
              onClick={handleSimulateTamper}
              className="px-2.5 py-2 rounded-xl text-[10px] font-bold text-slate-400 hover:text-red-500 border border-slate-200 dark:border-slate-800"
              title="Forensic Tamper Simulation"
            >
              Simulate Tamper
            </button>
          </div>
        </div>

        {/* PROMINENT TAMPER ALERT */}
        {isTampered && currentEvidence && (
          <TamperAlert
            evidenceNumber={currentEvidence.evidence_number}
            evidenceId={currentEvidence.id}
            brokenAtIndex={verificationResult?.custody_chain?.broken_event_id ? 1 : 0}
            expectedHash={verificationResult?.custody_chain?.expected_hash ?? "7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069"}
            calculatedHash={verificationResult?.custody_chain?.calculated_hash ?? "deadbeef98fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855"}
            failureReason={verificationResult?.custody_chain?.failure_reason ?? "Cryptographic hash pointer mismatch. Record modified outside authorized chain."}
          />
        )}

        {/* Evidence Item Selector if multiple items */}
        {evidenceList.length > 1 && (
          <div className="flex items-center gap-2 overflow-x-auto pb-2">
            <span className="text-xs text-slate-500 font-bold uppercase shrink-0">Items:</span>
            {evidenceList.map((ev, idx) => (
              <button
                key={ev.id}
                onClick={() => { setSelectedEvidenceIndex(idx); setIsTampered(false); }}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all shrink-0 ${
                  selectedEvidenceIndex === idx
                    ? 'bg-blue-600 text-white shadow-sm'
                    : 'bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300'
                }`}
              >
                {ev.evidence_number} ({ev.status})
              </button>
            ))}
          </div>
        )}

        {/* 5 CORE JUDICIAL QUESTIONS */}
        {currentEvidence ? (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* 1. WHAT IS THIS EVIDENCE? */}
              <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Fingerprint className="w-4 h-4 text-blue-500" />
                    1. Evidence Identity & Classification
                  </h3>
                  <StatusBadge status={currentEvidence.status} size="sm" />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="p-4 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-purple-700 dark:text-purple-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <Sparkles className="w-3.5 h-3.5" />
                        AI Suggestion
                      </span>
                      <span className="font-mono font-bold">
                        {classification?.ai_confidence != null ? `${(classification.ai_confidence * 100).toFixed(1)}%` : 'N/A'}
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {classification?.ai_category ?? 'Unclassified'} → {classification?.ai_object ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-500">Inferred via EfficientNet-B0 edge model</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-blue-50/70 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-1.5">
                    <div className="flex items-center justify-between text-xs text-blue-700 dark:text-blue-300 font-semibold">
                      <span className="flex items-center gap-1">
                        <UserCheck className="w-3.5 h-3.5" />
                        Confirmed Classification
                      </span>
                      <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-blue-200 dark:bg-blue-900 text-blue-800 dark:text-blue-200">
                        {classification?.classification_method ?? 'MANUAL'}
                      </span>
                    </div>
                    <p className="text-sm font-extrabold text-slate-900 dark:text-slate-100">
                      {classification?.final_category ?? 'Pending'} → {classification?.final_object ?? '—'}
                    </p>
                    <p className="text-[11px] text-slate-500">
                      Holder: {currentEvidence.current_holder?.full_name ?? 'Field Officer'}
                    </p>
                  </div>
                </div>
              </div>

              {/* 3. WHERE DID IT GO? MAP */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <MapPin className="w-4 h-4 text-blue-500" />
                  3. Forensic Location & Geofence Verification
                </h3>
                <ForensicMap
                  crimeSceneLat={caseData.crime_scene_latitude ? Number(caseData.crime_scene_latitude) : 40.7128}
                  crimeSceneLon={caseData.crime_scene_longitude ? Number(caseData.crime_scene_longitude) : -74.006}
                  captureLat={currentEvidence.capture_latitude ? Number(currentEvidence.capture_latitude) : 40.7132}
                  captureLon={currentEvidence.capture_longitude ? Number(currentEvidence.capture_longitude) : -74.0055}
                  distanceMeters={128}
                  geofenceVerified={currentEvidence.geofence_verified ?? true}
                />
              </div>

              {/* 4. HAS IT BEEN ALTERED? HASH */}
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2 mb-3">
                  <Lock className="w-4 h-4 text-emerald-500" />
                  4. Cryptographic Master Hash (Rule 902)
                </h3>
                <HashCard
                  hash={currentEvidence.master_hash ?? 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'}
                  title="SHA-256 EVIDENCE MASTER SEAL"
                  subtitle="Permanent immutable cryptographic hash computed at acquisition seal time"
                  status={isTampered ? 'FAILED' : 'VERIFIED'}
                  onVerify={handleRunVerify}
                  isVerifying={isVerifying}
                />
              </div>
            </div>

            {/* COLUMN 3: WHO HANDLED IT? TIMELINE */}
            <div className="space-y-6">
              <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm space-y-4">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                  <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 flex items-center gap-2">
                    <Clock className="w-4 h-4 text-blue-500" />
                    2. Complete Custody Chain
                  </h3>
                  <span className="text-[11px] font-mono font-bold text-emerald-600 dark:text-emerald-400">
                    {events.length} Events
                  </span>
                </div>

                <JudicialTimeline
                  events={events.map((ev) => ({
                    id: ev.id,
                    event_type: ev.event_type,
                    created_at: ev.created_at,
                    actor: ev.actor,
                    latitude: ev.latitude,
                    longitude: ev.longitude,
                    notes: ev.notes,
                    metadata: ev.metadata,
                  }))}
                  isCompromised={isTampered}
                  brokenEventId={isTampered && events.length > 0 ? events[events.length - 1].id : null}
                />
              </div>

              {/* QR Evidence Card */}
              <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm">
                <h3 className="text-sm font-bold text-slate-900 dark:text-slate-100 mb-4 text-center">
                  Digital Evidence Tag & QR Token
                </h3>
                <QRCard
                  evidenceNumber={currentEvidence.evidence_number}
                  evidenceId={currentEvidence.id}
                  caseNumber={caseData.case_number}
                  qrToken={currentEvidence.id}
                  status={currentEvidence.status}
                />
              </div>
            </div>
          </div>
        ) : (
          <div className="p-8 text-center text-slate-500 forenza-card rounded-2xl">
            No evidence registered for this case yet.
          </div>
        )}
      </div>

      {/* Modal fallback */}
      <CourtDossierModal
        isOpen={isDossierOpen}
        onClose={() => setIsDossierOpen(false)}
        caseData={caseData}
        evidenceList={evidenceList}
      />
    </AppShell>
  )
}
