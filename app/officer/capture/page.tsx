'use client'

import { useState, useRef, useCallback, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import { AppShell } from '@/components/layout/AppShell'
import { QRCard } from '@/components/forensic/QRCard'
import { HashCard } from '@/components/forensic/HashCard'
import {
  Camera, Video, Sparkles, UserCheck, ShieldCheck, ShieldAlert,
  MapPin, Compass, Gauge, CheckCircle2, Lock, ArrowRightLeft,
  RotateCcw, Upload, Layers, FileEdit, Loader2, AlertCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Step = 'CAMERA' | 'UPLOADING' | 'AI_REVIEW' | 'MANUAL_EDIT' | 'SEALING' | 'SEALED'

interface GPSData {
  latitude: number
  longitude: number
  accuracy: number
  heading: number | null
  distanceMeters: number | null
  geofenceVerified: boolean | null
}

interface AIResult {
  available: boolean
  object?: string
  category?: string
  subcategory?: string
  confidence?: number
  model_version?: string
  message?: string
}

interface SealedData {
  evidenceId: string
  evidenceNumber: string
  caseId: string
  masterHash: string
  qrToken: string
  timestamp: string
}

const EVIDENCE_CATEGORIES = [
  'Weapon', 'Biological', 'Document', 'Electronics',
  'Substances / Chemical', 'Trace Evidence', 'Vehicle', 'Other',
]

function EvidenceCaptureContent() {
  const searchParams = useSearchParams()
  const caseId = searchParams.get('case_id') ?? ''
  const evidenceId = searchParams.get('evidence_id') ?? ''

  const [step, setStep] = useState<Step>('CAMERA')
  const [capturedFile, setCapturedFile] = useState<File | null>(null)
  const [capturedPreviewUrl, setCapturedPreviewUrl] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  // Real GPS state
  const [gpsData, setGpsData] = useState<GPSData | null>(null)
  const [gpsLoading, setGpsLoading] = useState(true)
  const [gpsError, setGpsError] = useState<string | null>(null)

  // Upload + AI state
  const [uploadedMedia, setUploadedMedia] = useState<{
    storage_path: string; file_sha256: string; file_size_bytes: number; media_type: string; mime_type: string
  } | null>(null)
  const [aiResult, setAiResult] = useState<AIResult | null>(null)

  // Form state
  const [formData, setFormData] = useState({
    finalCategory: '',
    finalObject: '',
    finalSubcategory: '',
    description: '',
    notes: '',
    classificationMethod: 'AI_CONFIRMED' as 'AI_CONFIRMED' | 'MANUAL_OVERRIDE',
  })

  const [sealedData, setSealedData] = useState<SealedData | null>(null)
  const [error, setError] = useState<string | null>(null)

  // Acquire real GPS on mount
  useEffect(() => {
    if (!navigator.geolocation) {
      setGpsError('Geolocation not available in this browser')
      setGpsLoading(false)
      return
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        setGpsData({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          heading: position.coords.heading,
          distanceMeters: null,  // Will be computed by server against crime scene
          geofenceVerified: null, // Server authoritative
        })
        setGpsLoading(false)
        setGpsError(null)
      },
      (err) => {
        setGpsError(`GPS error: ${err.message}`)
        setGpsLoading(false)
      },
      { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 }
    )

    return () => navigator.geolocation.clearWatch(watchId)
  }, [])

  // Handle file selection / camera capture
  const handleFileSelected = useCallback(async (file: File) => {
    setCapturedFile(file)
    setCapturedPreviewUrl(URL.createObjectURL(file))
    setError(null)

    if (!evidenceId) {
      setError('No evidence ID. Navigate from the cases page to register evidence first.')
      return
    }

    if (!gpsData) {
      setError('GPS signal not acquired. Wait for GPS lock before capturing evidence.')
      return
    }

    setStep('UPLOADING')
    toast.info('Uploading evidence media to secure server…')

    try {
      // Step 1: Upload to server (SHA-256 computed server-side)
      const fd = new FormData()
      fd.append('file', file)

      const uploadRes = await fetch(`/api/evidence/${evidenceId}/media`, {
        method: 'POST',
        body: fd,
      })
      const uploadData = await uploadRes.json()

      if (!uploadRes.ok) {
        throw new Error(uploadData.error ?? 'Upload failed')
      }

      setUploadedMedia(uploadData.data)
      toast.success('Media secured. Running AI classification…')

      // Step 2: Submit capture record with GPS
      const captureRes = await fetch(`/api/evidence/${evidenceId}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          timestamp_utc: new Date().toISOString(),
          latitude: gpsData.latitude,
          longitude: gpsData.longitude,
          gps_accuracy: gpsData.accuracy,
          compass_heading: gpsData.heading ?? undefined,
          media_type: uploadData.data.media_type,
          mime_type: uploadData.data.mime_type,
          file_size_bytes: uploadData.data.file_size_bytes,
          file_sha256: uploadData.data.file_sha256,
          storage_path: uploadData.data.storage_path,
          geofence_verified: false,  // Server validates authoritatively
          capture_distance_meters: 0,
        }),
      })
      const captureData = await captureRes.json()
      if (!captureRes.ok) {
        throw new Error(captureData.error ?? 'Capture registration failed')
      }

      // Step 3: Request AI analysis
      const aiRes = await fetch(`/api/evidence/${evidenceId}/analyze`, { method: 'POST' })
      const aiData = await aiRes.json()
      const result: AIResult = aiData.data ?? { available: false, message: 'AI unavailable' }
      setAiResult(result)

      if (result.available && result.category) {
        setFormData(prev => ({
          ...prev,
          finalCategory: result.category ?? '',
          finalObject: result.object ?? '',
          finalSubcategory: result.subcategory ?? '',
          classificationMethod: 'AI_CONFIRMED',
        }))
      }

      setStep('AI_REVIEW')
    } catch (err: any) {
      setError(err.message ?? 'Capture failed')
      setStep('CAMERA')
      toast.error(err.message ?? 'Capture failed')
    }
  }, [evidenceId, gpsData])

  const handleAcceptAI = () => {
    handleSealEvidence('AI_CONFIRMED')
  }

  const handleSealEvidence = async (method: 'AI_CONFIRMED' | 'MANUAL_OVERRIDE') => {
    setError(null)
    setStep('SEALING')
    toast.info('Applying cryptographic seal…')

    try {
      // 1. Confirm classification
      const classRes = await fetch(`/api/evidence/${evidenceId}/classify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ai_result: aiResult ?? undefined,
          final_object: formData.finalObject,
          final_category: formData.finalCategory,
          final_subcategory: formData.finalSubcategory || undefined,
          final_description: formData.description || undefined,
          final_notes: formData.notes || undefined,
          classification_method: method,
        }),
      })
      const classData = await classRes.json()
      if (!classRes.ok) throw new Error(classData.error ?? 'Classification failed')

      // 2. Seal evidence — compute master SHA-256 hash + generate QR token
      const sealRes = await fetch(`/api/evidence/${evidenceId}/seal`, { method: 'POST' })
      const sealData = await sealRes.json()
      if (!sealRes.ok) throw new Error(sealData.error ?? 'Sealing failed')

      setSealedData({
        evidenceId,
        evidenceNumber: sealData.data?.evidence_number ?? evidenceId,
        caseId: sealData.data?.case_id ?? caseId,
        masterHash: sealData.data?.master_hash,
        qrToken: sealData.data?.qr_token,
        timestamp: sealData.data?.sealed_at ?? new Date().toISOString(),
      })
      setStep('SEALED')
      toast.success('Evidence cryptographically sealed with SHA-256 master hash!')
    } catch (err: any) {
      setError(err.message ?? 'Sealing failed')
      setStep('AI_REVIEW')
      toast.error(err.message ?? 'Sealing failed')
    }
  }

  const geofenceColor = gpsData?.geofenceVerified === true ? 'emerald'
    : gpsData?.geofenceVerified === false ? 'red' : 'amber'

  return (
    <AppShell
      role="INVESTIGATING_OFFICER"
      title="Evidence Acquisition & Sealing"
      breadcrumbs={[{ label: 'Home' }, { label: 'Officer Desk', href: '/officer/dashboard' }, { label: 'Capture Evidence' }]}
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {error && (
          <div className="flex items-start gap-2.5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{error}</span>
          </div>
        )}

        {/* STEP 1: CAMERA & GPS VIEWFINDER */}
        {step === 'CAMERA' && (
          <div className="space-y-4">
            {/* Viewfinder */}
            <div className="relative h-[480px] sm:h-[520px] rounded-3xl bg-slate-950 overflow-hidden border-2 border-slate-800 shadow-2xl flex flex-col justify-between p-4">
              {/* Grid background */}
              <div className="absolute inset-0 opacity-15 pointer-events-none" style={{
                backgroundImage: 'linear-gradient(to right, #3B82F6 1px, transparent 1px), linear-gradient(to bottom, #3B82F6 1px, transparent 1px)',
                backgroundSize: '40px 40px',
              }} />

              {/* Camera preview if file selected */}
              {capturedPreviewUrl && (
                <img src={capturedPreviewUrl} alt="Preview" className="absolute inset-0 w-full h-full object-cover opacity-60" />
              )}

              {/* Crosshair */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border border-white/30 rounded-2xl relative">
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                </div>
              </div>

              {/* Geofence status */}
              <div className="relative z-10 flex items-center justify-between">
                {gpsLoading ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/50 text-amber-300 text-xs font-bold backdrop-blur-md">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>ACQUIRING GPS LOCK…</span>
                  </div>
                ) : gpsError ? (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-red-950/80 border border-red-500/50 text-red-300 text-xs font-bold backdrop-blur-md">
                    <ShieldAlert className="w-4 h-4" />
                    <span>GPS ERROR</span>
                  </div>
                ) : (
                  <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold backdrop-blur-md">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>GPS LOCKED • ±{gpsData?.accuracy?.toFixed(1)}m accuracy</span>
                  </div>
                )}
                {caseId && (
                  <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-mono text-white/80 border border-white/10">
                    {caseId}
                  </div>
                )}
              </div>

              {/* GPS HUD + Shutter */}
              <div className="relative z-10 space-y-3">
                <div className="p-3.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white font-mono text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">LATITUDE</span>
                    <span className="font-bold text-blue-300">{gpsData ? `${gpsData.latitude.toFixed(6)}°` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">LONGITUDE</span>
                    <span className="font-bold text-blue-300">{gpsData ? `${gpsData.longitude.toFixed(6)}°` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ACCURACY</span>
                    <span className="font-bold text-emerald-400">{gpsData ? `±${gpsData.accuracy.toFixed(1)}m` : '—'}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">HEADING</span>
                    <span className="font-bold text-white">{gpsData?.heading != null ? `${gpsData.heading.toFixed(0)}°` : 'N/A'}</span>
                  </div>
                </div>

                {/* Shutter row */}
                <div className="flex items-center justify-around pt-2">
                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex flex-col items-center gap-1">
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold">UPLOAD</span>
                  </button>

                  <button type="button"
                    disabled={gpsLoading || !!gpsError}
                    onClick={() => fileInputRef.current?.click()}
                    className="w-18 h-18 rounded-full bg-white p-1.5 shadow-2xl active:scale-95 transition-transform flex items-center justify-center disabled:opacity-50">
                    <div className="w-full h-full rounded-full border-2 border-slate-900 bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                      <Camera className="w-7 h-7" />
                    </div>
                  </button>

                  <button type="button" onClick={() => fileInputRef.current?.click()}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex flex-col items-center gap-1">
                    <Video className="w-5 h-5" />
                    <span className="text-[10px] font-bold">VIDEO</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Hidden file input */}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp,video/mp4,video/quicktime"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0]
                if (file) handleFileSelected(file)
              }}
            />

            {!evidenceId && (
              <div className="p-4 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>No evidence ID provided. Go to your case, register evidence, then return here to capture.</span>
              </div>
            )}
          </div>
        )}

        {/* UPLOADING */}
        {step === 'UPLOADING' && (
          <div className="forenza-card p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Securing Evidence Media…</h3>
            <p className="text-xs text-slate-500">Uploading to encrypted storage and computing SHA-256 hash. Running AI classification.</p>
          </div>
        )}

        {/* AI REVIEW */}
        {step === 'AI_REVIEW' && (
          <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6 animate-in fade-in">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    {aiResult?.available ? 'AI Forensic Classification Suggestion' : 'Manual Classification Required'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {aiResult?.available ? `EfficientNet-B0 Edge Forensic Model • ${aiResult.model_version ?? 'v1.x'}` : aiResult?.message ?? 'AI unavailable'}
                  </p>
                </div>
              </div>
              <span className="badge-verified">GPS CAPTURED</span>
            </div>

            {aiResult?.available && (
              <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">INFERRED OBJECT IDENTITY</span>
                  <span className="px-2.5 py-1 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-mono font-extrabold text-xs">
                    Confidence: {aiResult.confidence != null ? `${(aiResult.confidence * 100).toFixed(1)}%` : 'N/A'}
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                  <div>
                    <span className="text-xs text-slate-500 block">Object Name:</span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">{aiResult.object}</span>
                  </div>
                  <div>
                    <span className="text-xs text-slate-500 block">Category:</span>
                    <span className="text-base font-bold text-slate-900 dark:text-slate-100">{aiResult.category}</span>
                  </div>
                </div>
              </div>
            )}

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              {aiResult?.available && (
                <button type="button" onClick={handleAcceptAI}
                  className="py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2">
                  <CheckCircle2 className="w-4 h-4" />
                  <span>Accept AI Suggestion & Seal</span>
                </button>
              )}
              <button type="button" onClick={() => setStep('MANUAL_EDIT')}
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700">
                <FileEdit className="w-4 h-4" />
                <span>{aiResult?.available ? 'Classify Manually / Override' : 'Classify Manually'}</span>
              </button>
            </div>
          </div>
        )}

        {/* MANUAL CLASSIFICATION */}
        {step === 'MANUAL_EDIT' && (
          <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6 animate-in fade-in">
            {aiResult?.available && (
              <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                  <Sparkles className="w-4 h-4" />
                  <span>AI Inferred: <strong>{aiResult.category}</strong> ({aiResult.object}) • {aiResult.confidence != null ? `${(aiResult.confidence * 100).toFixed(1)}%` : 'N/A'}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">Reference Only</span>
              </div>
            )}

            <form onSubmit={(e) => { e.preventDefault(); handleSealEvidence('MANUAL_OVERRIDE') }} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Human Forensic Classification</h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Category *</label>
                  <select required value={formData.finalCategory}
                    onChange={(e) => setFormData({ ...formData, finalCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500">
                    <option value="">Select category…</option>
                    {EVIDENCE_CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Evidence Item Name *</label>
                  <input type="text" required value={formData.finalObject}
                    onChange={(e) => setFormData({ ...formData, finalObject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                    placeholder="e.g. Tactical Fixed Blade Knife" />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Physical Description</label>
                <textarea rows={2} value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">Officer Forensic Notes</label>
                <textarea rows={2} value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500" />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button type="button" onClick={() => setStep('AI_REVIEW')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
                  Back
                </button>
                <button type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center gap-2">
                  <Lock className="w-4 h-4" />
                  <span>Apply Cryptographic Seal & Generate QR</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* SEALING */}
        {step === 'SEALING' && (
          <div className="forenza-card p-12 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] text-center space-y-4">
            <Loader2 className="w-12 h-12 animate-spin text-blue-600 mx-auto" />
            <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">Applying Cryptographic Seal…</h3>
            <p className="text-xs text-slate-500">Computing SHA-256 master hash over GPS, timestamp, officer, and media bytes.</p>
          </div>
        )}

        {/* SEALED SUCCESS */}
        {step === 'SEALED' && sealedData && (
          <div className="space-y-6 animate-in zoom-in-95 duration-200">
            <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-[#111827] shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  EVIDENCE SECURED & SEALED
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  {sealedData.evidenceNumber} • {new Date(sealedData.timestamp).toUTCString()}
                </p>
              </div>

              <HashCard
                hash={sealedData.masterHash}
                title="SHA-256 EVIDENCE MASTER SEAL"
                subtitle="Calculated over GPS coordinates, timestamp, officer ID, and media bytes"
                status="VERIFIED"
              />

              <div className="pt-2">
                <QRCard
                  evidenceNumber={sealedData.evidenceNumber}
                  evidenceId={sealedData.evidenceId}
                  caseNumber={sealedData.caseId}
                  qrToken={sealedData.qrToken}
                  status="SEALED"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link href="/officer/dashboard"
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2">
                  Return to Field Desk
                </Link>
                <Link href={`/officer/transfer?evidence_id=${sealedData.evidenceId}`}
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-600/30 flex items-center justify-center gap-2">
                  <ArrowRightLeft className="w-4 h-4" />
                  Transfer Custody to Vault
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}

export default function EvidenceCapturePage() {
  return (
    <Suspense fallback={
      <AppShell role="INVESTIGATING_OFFICER" title="Evidence Acquisition" breadcrumbs={[{ label: 'Home' }, { label: 'Capture' }]}>
        <div className="p-12 text-center text-slate-500 flex flex-col items-center gap-2">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
          <span>Initializing capture viewfinder…</span>
        </div>
      </AppShell>
    }>
      <EvidenceCaptureContent />
    </Suspense>
  )
}
