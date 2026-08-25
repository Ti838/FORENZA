'use client'

import { useState, useRef } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { QRCard } from '@/components/forensic/QRCard'
import { HashCard } from '@/components/forensic/HashCard'
import {
  Camera,
  Video,
  Sparkles,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  MapPin,
  Compass,
  Gauge,
  CheckCircle2,
  Lock,
  ArrowRight,
  ArrowRightLeft,
  RotateCcw,
  Upload,
  Layers,
  FileEdit,
} from 'lucide-react'
import { toast } from 'sonner'
import Link from 'next/link'

type Step = 'CAMERA' | 'AI_REVIEW' | 'MANUAL_EDIT' | 'SEALED'

export default function EvidenceCapturePage() {
  const [step, setStep] = useState<Step>('CAMERA')
  const [capturedImage, setCapturedImage] = useState<string | null>(null)
  const [mediaType, setMediaType] = useState<'PHOTO' | 'VIDEO'>('PHOTO')

  // Live GPS Telemetry state
  const [gpsData] = useState({
    latitude: 40.7128,
    longitude: -74.006,
    accuracy: 3.4,
    distanceMeters: 128,
    geofenceVerified: true,
    heading: 184,
  })

  // AI Classification state
  const [aiResult] = useState({
    object: 'Fixed Blade Tactical Knife',
    category: 'Weapon',
    subcategory: 'Sharp Blade / Cutting Instrument',
    confidence: 0.942,
  })

  // Final Human Form state
  const [formData, setFormData] = useState({
    evidenceNumber: `EVD-${Math.floor(1000 + Math.random() * 9000)}`,
    caseNumber: 'CASE-2024-041',
    finalCategory: 'Weapon',
    finalObject: 'Fixed Blade Tactical Knife',
    description: 'Found discarded in perimeter grass under shrubbery.',
    notes: 'Visible red substance on blade edge. Preserved for DNA testing.',
    classificationMethod: 'AI_CONFIRMED' as 'AI_CONFIRMED' | 'MANUAL_OVERRIDE',
  })

  // Sealed cryptographic output state
  const [sealedData, setSealedData] = useState<{
    masterHash: string
    qrToken: string
    timestamp: string
  } | null>(null)

  const handleCapturePhoto = () => {
    // Simulate real high-res field photo capture
    setCapturedImage('/sample-knife.jpg')
    setMediaType('PHOTO')
    setStep('AI_REVIEW')
    toast.success('Evidence photo acquired with GPS geotag.')
  }

  const handleAcceptAI = () => {
    setFormData((prev) => ({
      ...prev,
      finalCategory: aiResult.category,
      finalObject: aiResult.object,
      classificationMethod: 'AI_CONFIRMED',
    }))
    handleSealEvidence('AI_CONFIRMED')
  }

  const handleOpenManual = () => {
    setStep('MANUAL_EDIT')
  }

  const handleSaveManualAndSeal = (e: React.FormEvent) => {
    e.preventDefault()
    handleSealEvidence('MANUAL_OVERRIDE')
  }

  const handleSealEvidence = (method: 'AI_CONFIRMED' | 'MANUAL_OVERRIDE') => {
    // Generate deterministic SHA-256 seal & JWT token for MVP demonstration
    const fakeHash = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855'
    const fakeJwt = `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI1NTBlODQwMC1lMjliLTQxZDQtYTcxNi00NDY2NTU0NDAwMDAiLCJqdGkiOiJ0b2tlbi0xMjMiLCJ0eXBlIjoiRVZJREVORVNfUVIiLCJpYXQiOjE3MDYwMDAwMDAsImV4cCI6MTcwNjA4NjQwMH0.signature`

    setSealedData({
      masterHash: fakeHash,
      qrToken: fakeJwt,
      timestamp: new Date().toISOString(),
    })
    setStep('SEALED')
    toast.success('Evidence cryptographically sealed with SHA-256 master hash!')
  }

  return (
    <AppShell
      role="INVESTIGATING_OFFICER"
      title="Evidence Acquisition & Sealing"
      breadcrumbs={[{ label: 'Home' }, { label: 'Officer Desk', href: '/officer/dashboard' }, { label: 'Capture Evidence' }]}
      userName="Detective Marcus Vance"
      badgeNumber="4028"
    >
      <div className="max-w-3xl mx-auto space-y-6">
        {/* STEP 1: CAMERA & GPS VIEWFINDER */}
        {step === 'CAMERA' && (
          <div className="space-y-4">
            {/* Viewfinder Frame */}
            <div className="relative h-[480px] sm:h-[520px] rounded-3xl bg-slate-950 overflow-hidden border-2 border-slate-800 shadow-2xl flex flex-col justify-between p-4 select-none">
              {/* Camera Simulation Grid Background */}
              <div
                className="absolute inset-0 opacity-15 pointer-events-none"
                style={{
                  backgroundImage: `
                    linear-gradient(to right, #3B82F6 1px, transparent 1px),
                    linear-gradient(to bottom, #3B82F6 1px, transparent 1px)
                  `,
                  backgroundSize: '40px 40px',
                }}
              />

              {/* Viewfinder Crosshairs Center */}
              <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                <div className="w-48 h-48 border border-white/30 rounded-2xl relative">
                  <div className="absolute -top-2 -left-2 w-4 h-4 border-t-2 border-l-2 border-blue-400" />
                  <div className="absolute -top-2 -right-2 w-4 h-4 border-t-2 border-r-2 border-blue-400" />
                  <div className="absolute -bottom-2 -left-2 w-4 h-4 border-b-2 border-l-2 border-blue-400" />
                  <div className="absolute -bottom-2 -right-2 w-4 h-4 border-b-2 border-r-2 border-blue-400" />
                </div>
              </div>

              {/* Top Bar: Geofence Status Pill */}
              <div className="relative z-10 flex items-center justify-between">
                <div className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-950/80 border border-emerald-500/50 text-emerald-300 text-xs font-bold shadow-lg backdrop-blur-md">
                  <ShieldCheck className="w-4 h-4 text-emerald-400" />
                  <span>PERIMETER VERIFIED • {gpsData.distanceMeters}m from authorized scene</span>
                </div>

                <div className="px-2.5 py-1 rounded-md bg-black/60 backdrop-blur-md text-[11px] font-mono text-white/80 border border-white/10">
                  CASE: {formData.caseNumber}
                </div>
              </div>

              {/* Bottom HUD: Live GPS Telemetry Readout */}
              <div className="relative z-10 space-y-3">
                <div className="p-3.5 rounded-2xl bg-black/70 backdrop-blur-md border border-white/10 text-white font-mono text-xs grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <div>
                    <span className="text-[10px] text-slate-400 block">LATITUDE</span>
                    <span className="font-bold text-blue-300">{gpsData.latitude.toFixed(6)}° N</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">LONGITUDE</span>
                    <span className="font-bold text-blue-300">{gpsData.longitude.toFixed(6)}° W</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">ACCURACY</span>
                    <span className="font-bold text-emerald-400">±{gpsData.accuracy}m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">COMPASS</span>
                    <span className="font-bold text-white">{gpsData.heading}° SSW</span>
                  </div>
                </div>

                {/* Shutter Button Controls */}
                <div className="flex items-center justify-around pt-2">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaType('VIDEO')
                      handleCapturePhoto()
                    }}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex flex-col items-center gap-1"
                  >
                    <Video className="w-5 h-5" />
                    <span className="text-[10px] font-bold">VIDEO</span>
                  </button>

                  {/* Primary Shutter Button */}
                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="w-18 h-18 rounded-full bg-white p-1.5 shadow-2xl active:scale-95 transition-transform flex items-center justify-center group"
                  >
                    <div className="w-full h-full rounded-full border-2 border-slate-900 bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white">
                      <Camera className="w-7 h-7" />
                    </div>
                  </button>

                  <button
                    type="button"
                    onClick={handleCapturePhoto}
                    className="p-3 rounded-full bg-white/10 text-white hover:bg-white/20 transition-colors flex flex-col items-center gap-1"
                  >
                    <Upload className="w-5 h-5" />
                    <span className="text-[10px] font-bold">UPLOAD</span>
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* STEP 2: AI INFERENCE SUGGESTION REVIEW */}
        {step === 'AI_REVIEW' && (
          <div className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6 animate-in fade-in">
            {/* Header */}
            <div className="flex items-center justify-between pb-4 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
                  <Sparkles className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                    AI Forensic Classification Suggestion
                  </h3>
                  <p className="text-xs text-slate-500">EfficientNet-B0 Edge Forensic Model v1.2</p>
                </div>
              </div>

              <span className="badge-verified">GEOFENCE SECURED</span>
            </div>

            {/* AI Suggestion Card */}
            <div className="p-5 rounded-2xl bg-purple-50/70 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-purple-700 dark:text-purple-300">
                  INFERRED OBJECT IDENTITY
                </span>
                <span className="px-2.5 py-1 rounded-full bg-purple-200 dark:bg-purple-900 text-purple-800 dark:text-purple-200 font-mono font-extrabold text-xs">
                  Confidence: {(aiResult.confidence * 100).toFixed(1)}%
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <span className="text-xs text-slate-500 block">Object Name:</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {aiResult.object}
                  </span>
                </div>
                <div>
                  <span className="text-xs text-slate-500 block">Category:</span>
                  <span className="text-base font-bold text-slate-900 dark:text-slate-100">
                    {aiResult.category}
                  </span>
                </div>
              </div>
            </div>

            {/* Two Equal Primary Options */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                type="button"
                onClick={handleAcceptAI}
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Accept AI Suggestion & Seal</span>
              </button>

              <button
                type="button"
                onClick={handleOpenManual}
                className="py-3.5 px-4 rounded-xl font-bold text-sm bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-800 dark:text-slate-100 transition-colors flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-700"
              >
                <FileEdit className="w-4 h-4" />
                <span>Classify Manually / Override</span>
              </button>
            </div>
          </div>
        )}

        {/* STEP 3: MANUAL CLASSIFICATION FORM */}
        {step === 'MANUAL_EDIT' && (
          <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-6 animate-in fade-in">
            {/* AI Reference Banner at top (never forced) */}
            <div className="p-3.5 rounded-xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-900/50 flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 font-medium">
                <Sparkles className="w-4 h-4" />
                <span>AI Inferred: <strong>{aiResult.category}</strong> ({aiResult.object}) • 94.2%</span>
              </div>
              <span className="text-[10px] uppercase font-bold text-purple-600 dark:text-purple-400">
                Reference Only
              </span>
            </div>

            <form onSubmit={handleSaveManualAndSeal} className="space-y-4">
              <h3 className="text-lg font-bold text-slate-900 dark:text-slate-100">
                Human Forensic Classification (Manual Override)
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Category *
                  </label>
                  <select
                    value={formData.finalCategory}
                    onChange={(e) => setFormData({ ...formData, finalCategory: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                  >
                    <option value="Weapon">Weapon</option>
                    <option value="Biological">Biological</option>
                    <option value="Document">Document</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Substances">Substances / Chemical</option>
                    <option value="Trace">Trace Evidence</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                    Evidence Item Name *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.finalObject}
                    onChange={(e) => setFormData({ ...formData, finalObject: e.target.value })}
                    className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 font-medium text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                    placeholder="e.g. Tactical Fixed Blade Knife"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Physical Description
                </label>
                <textarea
                  rows={2}
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5">
                  Officer Forensic Notes
                </label>
                <textarea
                  rows={2}
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full px-3.5 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setStep('AI_REVIEW')}
                  className="px-4 py-2.5 rounded-xl text-xs font-semibold bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300"
                >
                  Back
                </button>

                <button
                  type="submit"
                  className="px-6 py-2.5 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center gap-2"
                >
                  <Lock className="w-4 h-4" />
                  <span>Apply Cryptographic Seal & Generate QR</span>
                </button>
              </div>
            </form>
          </div>
        )}

        {/* STEP 4: EVIDENCE SEALED SUCCESS & QR BADGE DISPLAY */}
        {step === 'SEALED' && sealedData && (
          <div className="space-y-6 animate-in zoom-in-95 duration-200">
            {/* Large Shield Verification Visual */}
            <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-emerald-300 dark:border-emerald-800/80 bg-white dark:bg-[#111827] shadow-2xl text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 mx-auto flex items-center justify-center shadow-lg shadow-emerald-500/20">
                <ShieldCheck className="w-10 h-10" />
              </div>

              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
                  EVIDENCE SECURED & SEALED
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 font-mono">
                  ITEM {formData.evidenceNumber} • CASE {formData.caseNumber}
                </p>
              </div>

              {/* Cryptographic SHA-256 Hash Card */}
              <HashCard
                hash={sealedData.masterHash}
                title="SHA-256 EVIDENCE MASTER SEAL"
                subtitle="Calculated over GPS coordinates, timestamp, officer ID, and media bytes"
                status="VERIFIED"
              />

              {/* QR Evidence Card */}
              <div className="pt-2">
                <QRCard
                  evidenceNumber={formData.evidenceNumber}
                  evidenceId="550e8400-e29b-41d4-a716-446655440000"
                  caseNumber={formData.caseNumber}
                  qrToken={sealedData.qrToken}
                  status="SEALED"
                />
              </div>

              {/* Action Buttons */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
                <Link
                  href="/officer/dashboard"
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors flex items-center justify-center gap-2"
                >
                  <span>Return to Field Desk</span>
                </Link>

                <Link
                  href="/officer/transfer"
                  className="py-3 px-4 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-md shadow-blue-600/30 flex items-center justify-center gap-2"
                >
                  <ArrowRightLeft className="w-4 h-4" />
                  <span>Transfer Custody to Vault</span>
                </Link>
              </div>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  )
}
