'use client'

import { useState, useEffect } from 'react'
import { ForenzaLogo } from '@/components/brand/ForenzaLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  CheckCircle2,
  Terminal,
  Zap,
  Radio,
  Layers,
  Globe,
  ShieldCheck,
  ArrowRight,
  HelpCircle,
  Sparkles,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type DetectedOS = 'Windows' | 'macOS' | 'Android' | 'iOS' | 'Linux' | 'Unknown'

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<DetectedOS>('Windows')
  const [arch, setArch] = useState<string>('x64 (64-bit)')
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return

    const ua = navigator.userAgent || ''
    const platform = (navigator as any).userAgentData?.platform || navigator.platform || ''

    if (/Win/i.test(platform) || /Windows/i.test(ua)) {
      setDetectedOS('Windows')
      setArch(/x64|Win64|WOW64|x86_64/i.test(ua) ? 'x64 (64-bit Intel/AMD)' : 'ARM64')
    } else if (/Mac/i.test(platform) || /Macintosh|Mac OS X/i.test(ua)) {
      setDetectedOS('macOS')
      setArch('Apple Silicon / Intel Universal')
    } else if (/Android/i.test(ua)) {
      setDetectedOS('Android')
      setArch('ARM64-v8a Mobile')
    } else if (/iPhone|iPad|iPod/i.test(ua)) {
      setDetectedOS('iOS')
      setArch('Apple A-Series / M-Series')
    } else if (/Linux/i.test(platform) || /Linux/i.test(ua)) {
      setDetectedOS('Linux')
      setArch('x86_64 Desktop')
    } else {
      setDetectedOS('Windows')
    }

    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  const handle1ClickInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        toast.success('FORENZA Client successfully installed to your Desktop!')
      }
      setDeferredPrompt(null)
      setIsInstallable(false)
    } else {
      // Direct Windows Desktop Shortcut / Standalone prompt
      toast.info(
        'Installing FORENZA Native Desktop Client... Use the Install icon on top right of your browser or download the package below!'
      )
      window.location.href = `/api/download/windows`
    }
  }

  const handleDownload = (platform: string, label: string) => {
    toast.info(`Downloading official FORENZA installer for ${label}...`)
    window.location.href = `/api/download/${platform}`
  }

  const comparisonRows = [
    { capability: 'Authentication & MFA', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Role-Based Access (7 RBAC Tiers)', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Case Management & Search', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Evidence Metadata & Verification', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Native Camera Viewfinder Capture', web: 'SUPPORTED', android: 'FULL (Hardware)', windows: 'SUPPORTED', macos: 'SUPPORTED', linux: 'SUPPORTED' },
    { capability: 'Hardware GPS Location & Geofence', web: 'SUPPORTED', android: 'FULL (Hardware)', windows: 'PLATFORM-DEP', macos: 'PLATFORM-DEP', linux: 'PLATFORM-DEP' },
    { capability: 'Offline Emergency Evidence Capture', web: 'PLATFORM-DEP', android: 'FULL (AES Vault)', windows: 'SUPPORTED', macos: 'SUPPORTED', linux: 'SUPPORTED' },
    { capability: 'AI-Assisted Classification', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Single-Use QR Handover Tokens', web: 'FULL', android: 'FULL (Scanner)', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Dual-Party Chain of Custody', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'In-Transit Telemetry & Decoy Defense', web: 'FULL (HUD)', android: 'FULL (Broadcast)', windows: 'FULL (HUD)', macos: 'FULL (HUD)', linux: 'FULL (HUD)' },
    { capability: 'Physical Vault Inventory & Indexing', web: 'FULL', android: 'FULL (Scan)', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Forensic Laboratory & Aliquot Tracking', web: 'FULL', android: 'SUPPORTED', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Append-Only Audit Ledger', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Mathematical Integrity Verification', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Judicial Timeline & Dossier Export', web: 'FULL (jsPDF)', android: 'SUPPORTED', windows: 'FULL (jsPDF)', macos: 'FULL (jsPDF)', linux: 'FULL (jsPDF)' },
    { capability: 'Multi-Mode Theme (Light/Dark/Auto)', web: 'FULL', android: 'FULL', windows: 'FULL', macos: 'FULL', linux: 'FULL' },
    { capability: 'Local Encrypted Sandbox Storage', web: 'NOT APPLICABLE', android: 'FULL (AES-256)', windows: 'FULL (Encrypted)', macos: 'FULL (Encrypted)', linux: 'FULL (Encrypted)' },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 transition-colors font-sans">
      {/* Top Header */}
      <header className="sticky top-0 z-20 h-16 bg-white/90 dark:bg-[#0F1523]/90 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
        <ForenzaLogo size="md" showTagline={true} linkToDashboard={true} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/"
            className="px-3.5 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white transition-colors"
          >
            Portal Directory
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-xs transition-colors"
          >
            Personnel Sign In
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Unified Architecture Header Banner with Direct 1-Click Install */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="relative z-10 max-w-3xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-mono font-bold">
              <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>DETECTED ENVIRONMENT: {detectedOS.toUpperCase()} ({arch})</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              ONE SECURE EVIDENCE PLATFORM.<br />MULTIPLE AUTHORIZED CLIENTS.
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              Install FORENZA directly onto your {detectedOS} device with 1-click. No terminal command prompt required.
            </p>

            <div className="flex items-center flex-wrap gap-3 pt-2">
              {/* Primary 1-Click Direct Install Button */}
              <button
                type="button"
                onClick={handle1ClickInstall}
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-blue-600 font-extrabold text-sm shadow-lg shadow-black/10 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
              >
                <Sparkles className="w-5 h-5 text-blue-600" />
                <span>1-CLICK DIRECT INSTALL FOR {detectedOS.toUpperCase()}</span>
              </button>

              <Link
                href="/login"
                className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-extrabold text-sm backdrop-blur-md transition-all"
              >
                <Globe className="w-5 h-5" />
                <span>Open in Web Browser</span>
              </Link>
            </div>
          </div>
        </div>

        {/* 5 Authorized Client Cards Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <Layers className="w-4 h-4 text-blue-500" />
                <span>AUTHORIZED FORENZA CLIENTS</span>
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Every client provides full role-based access to the authoritative forensic core.
              </p>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
              UNIFIED FORENZA CORE
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card 1: Web Platform */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Globe className="w-5 h-5" />
                  </div>
                  <span className="text-[10px] font-mono font-bold text-slate-500 uppercase px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800">
                    Zero Install
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">FORENZA Web Platform</h3>
                  <p className="text-xs text-slate-500 font-mono">Secure browser-based FORENZA workspace</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Case Management</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Evidence Management & Hashes</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Chain of Custody & Audit</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Laboratory Workflow</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Judicial Review & Court Dossier</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Full System Administration</span></div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <Link
                  href="/login"
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all"
                >
                  <ArrowRight className="w-3.5 h-3.5" />
                  <span>OPEN WEB PLATFORM</span>
                </Link>
              </div>
            </div>

            {/* Card 2: Android */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="w-5 h-5" />
                  </div>
                  {detectedOS === 'Android' && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                      Your OS
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">FORENZA Android</h3>
                  <p className="text-xs text-slate-500 font-mono">Field-optimized FORENZA application</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Full Role-Based FORENZA Access</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Native Camera & Hardware GPS</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Offline Evidence Capture (AES-256)</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Single-Use QR Scanner & Handovers</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Authorized Transit Telemetry</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Idempotent Background Sync</span></div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleDownload('android', 'Android')}
                  className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD ANDROID APK</span>
                </button>
              </div>
            </div>

            {/* Card 3: Windows */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Monitor className="w-5 h-5" />
                  </div>
                  {detectedOS === 'Windows' && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300">
                      Your OS
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">FORENZA for Windows</h3>
                  <p className="text-xs text-slate-500 font-mono">Full desktop FORENZA application</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Case & Evidence Management</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Chain of Custody & Vault Indexing</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Laboratory Workflow & Aliquots</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Audit, Integrity & Security Center</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Judicial Review & Court Dossier</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Zero-CMD Silent Desktop Installation</span></div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleDownload('windows', 'Windows')}
                  className="w-full py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>INSTALL FOR WINDOWS (NO CMD)</span>
                </button>
              </div>
            </div>

            {/* Card 4: macOS */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <Apple className="w-5 h-5" />
                  </div>
                  {detectedOS === 'macOS' && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200">
                      Your OS
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">FORENZA for macOS</h3>
                  <p className="text-xs text-slate-500 font-mono">Full desktop FORENZA application</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Case & Evidence Management</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Chain of Custody & Vault Indexing</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Laboratory Workflow & Aliquots</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Audit, Integrity & Security Center</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Judicial Review & Court Dossier</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Apple Silicon & Intel Universal Binary</span></div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleDownload('macos', 'macOS')}
                  className="w-full py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD FOR macOS</span>
                </button>
              </div>
            </div>

            {/* Card 5: Linux */}
            <div className="p-6 rounded-3xl bg-white dark:bg-[#111827] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col justify-between">
              <div className="space-y-3">
                <div className="flex items-start justify-between gap-2">
                  <div className="p-2.5 rounded-2xl bg-purple-50 dark:bg-purple-950 text-purple-600 dark:text-purple-400">
                    <Terminal className="w-5 h-5" />
                  </div>
                  {detectedOS === 'Linux' && (
                    <span className="text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-950 text-purple-700 dark:text-purple-300">
                      Your OS
                    </span>
                  )}
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900 dark:text-white">FORENZA for Linux</h3>
                  <p className="text-xs text-slate-500 font-mono">Full desktop FORENZA application</p>
                </div>
                <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Case & Evidence Management</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Chain of Custody & Vault Indexing</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Laboratory Workflow & Aliquots</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Audit, Integrity & Security Center</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Judicial Review & Court Dossier</span></div>
                  <div className="flex items-center gap-1.5"><CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" /><span>Standalone Portable .AppImage</span></div>
                </div>
              </div>
              <div className="mt-6 pt-3 border-t border-slate-100 dark:border-slate-800/80">
                <button
                  type="button"
                  onClick={() => handleDownload('linux', 'Linux')}
                  className="w-full py-2.5 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-bold text-xs flex items-center justify-center gap-1.5 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>DOWNLOAD FOR LINUX</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Platform Capability Comparison Matrix */}
        <div className="space-y-4 pt-6">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h3 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-blue-500" />
                <span>CROSS-PLATFORM CAPABILITY COMPARISON</span>
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Capabilities depend on hardware sensors and operating environment, sharing the same cryptographic backend.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0F1523]">
            <table className="w-full text-xs text-left">
              <thead className="bg-slate-50 dark:bg-[#0B0F19] text-[11px] font-mono text-slate-500 border-b border-slate-200 dark:border-slate-800">
                <tr>
                  <th className="p-3.5 font-bold">CAPABILITY</th>
                  <th className="p-3.5 font-bold">WEB</th>
                  <th className="p-3.5 font-bold">ANDROID</th>
                  <th className="p-3.5 font-bold">WINDOWS</th>
                  <th className="p-3.5 font-bold">macOS</th>
                  <th className="p-3.5 font-bold">LINUX</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60 font-mono">
                {comparisonRows.map((row) => (
                  <tr key={row.capability} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/30">
                    <td className="p-3.5 font-sans font-semibold text-slate-800 dark:text-slate-200">{row.capability}</td>
                    <td className="p-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.web.includes('FULL') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{row.web}</span></td>
                    <td className="p-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.android.includes('FULL') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{row.android}</span></td>
                    <td className="p-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.windows.includes('FULL') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{row.windows}</span></td>
                    <td className="p-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.macos.includes('FULL') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{row.macos}</span></td>
                    <td className="p-3.5"><span className={`px-2 py-0.5 rounded text-[10px] font-bold ${row.linux.includes('FULL') ? 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>{row.linux}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  )
}
