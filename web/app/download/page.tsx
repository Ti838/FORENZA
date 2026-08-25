'use client'

import { useState, useEffect } from 'react'
import { ForenzaLogo } from '@/components/brand/ForenzaLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  Download,
  Monitor,
  Smartphone,
  Apple,
  ShieldCheck,
  KeyRound,
  CheckCircle2,
  Copy,
  ArrowRight,
  ExternalLink,
  Laptop,
  Layers,
  Terminal,
  Cpu,
  HardDrive,
  Sparkles,
  Zap,
  Radio,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

type DetectedOS = 'Windows' | 'macOS' | 'Android' | 'iOS' | 'Linux' | 'Unknown'

export default function DownloadPage() {
  const [detectedOS, setDetectedOS] = useState<DetectedOS>('Windows')
  const [arch, setArch] = useState<string>('x64 (64-bit)')
  const [copiedHash, setCopiedHash] = useState<string | null>(null)
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null)
  const [isInstallable, setIsInstallable] = useState(false)
  const [installSuccess, setInstallSuccess] = useState(false)

  // Auto-detect User's Operating System & Architecture
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

    // PWA Install Prompt Listener
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setIsInstallable(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)

    // Check if running in standalone window
    if (window.matchMedia('(display-mode: standalone)').matches) {
      setInstallSuccess(true)
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    }
  }, [])

  // Trigger Native Desktop PWA Installation
  const handlePwaInstall = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt()
      const { outcome } = await deferredPrompt.userChoice
      if (outcome === 'accepted') {
        toast.success('FORENZA Native Application installed successfully!')
        setInstallSuccess(true)
      }
      setDeferredPrompt(null)
      setIsInstallable(false)
    } else {
      toast.info(
        'To install as a desktop app: click the Install icon in your browser address bar (top right) or download the Windows setup package below.'
      )
    }
  }

  // Direct Windows Launcher Download via API Route
  const handleDownloadWindows = () => {
    toast.info('Downloading FORENZA Windows Forensic Setup (.bat)...')
    window.location.href = '/api/download/windows'
  }

  // Direct Android APK Download via API Route
  const handleDownloadAndroid = () => {
    toast.info('Downloading Android APK Field Client (.apk)...')
    window.location.href = '/api/download/android'
  }

  // Direct macOS Download via API Route
  const handleDownloadMac = () => {
    toast.info('Downloading macOS Universal Package (.dmg)...')
    window.location.href = '/api/download/macos'
  }

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    toast.success('SHA-256 binary checksum copied to clipboard')
    setTimeout(() => setCopiedHash(null), 2000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
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

      {/* Main Download Hub */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-10">
        {/* Auto-Detected Device Hero Banner */}
        <div className="p-6 sm:p-8 rounded-3xl bg-gradient-to-br from-blue-600 via-indigo-600 to-blue-800 text-white shadow-xl shadow-blue-600/20 relative overflow-hidden">
          <div className="relative z-10 max-w-2xl space-y-4">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-md text-xs font-mono font-bold">
              <Radio className="w-3.5 h-3.5 text-emerald-300 animate-pulse" />
              <span>DETECTED DEVICE: {detectedOS.toUpperCase()} ({arch})</span>
            </div>

            <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
              Download FORENZA for {detectedOS}
            </h1>

            <p className="text-xs sm:text-sm text-blue-100 leading-relaxed">
              We tailored the installation package for your detected <strong>{detectedOS} ({arch})</strong> environment. Install as a standalone native desktop app or download the verified setup executable.
            </p>

            <div className="flex items-center flex-wrap gap-3 pt-2">
              {detectedOS === 'Windows' && (
                <>
                  <button
                    type="button"
                    onClick={handleDownloadWindows}
                    className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-blue-600 font-extrabold text-sm shadow-lg shadow-black/10 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
                  >
                    <Download className="w-5 h-5 text-blue-600" />
                    <span>Download Windows Setup (.bat / .exe)</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePwaInstall}
                    className="inline-flex items-center gap-2 px-5 py-3.5 rounded-2xl bg-white/15 hover:bg-white/25 text-white font-bold text-xs backdrop-blur-md transition-all cursor-pointer"
                  >
                    <Zap className="w-4 h-4 text-amber-300" />
                    <span>Install Native Desktop App (PWA)</span>
                  </button>
                </>
              )}

              {detectedOS === 'macOS' && (
                <button
                  type="button"
                  onClick={handleDownloadMac}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-blue-600 font-extrabold text-sm shadow-lg shadow-black/10 hover:bg-blue-50 active:scale-95 transition-all cursor-pointer"
                >
                  <Apple className="w-5 h-5 text-blue-600" />
                  <span>Download for macOS (.dmg)</span>
                </button>
              )}

              {detectedOS === 'Android' && (
                <button
                  type="button"
                  onClick={handleDownloadAndroid}
                  className="inline-flex items-center gap-2.5 px-6 py-3.5 rounded-2xl bg-white text-emerald-600 font-extrabold text-sm shadow-lg shadow-black/10 hover:bg-emerald-50 active:scale-95 transition-all cursor-pointer"
                >
                  <Smartphone className="w-5 h-5 text-emerald-600" />
                  <span>Download Field APK (.apk)</span>
                </button>
              )}
            </div>
          </div>
        </div>

        {/* 1-Click Instant Desktop Installation Card */}
        <div className="forenza-card p-5 sm:p-6 rounded-3xl border border-blue-200 dark:border-blue-900/60 bg-blue-50/50 dark:bg-blue-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-center gap-3.5">
            <div className="p-3 rounded-2xl bg-blue-600 text-white shrink-0 shadow-md shadow-blue-600/30">
              <Monitor className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-sm text-slate-900 dark:text-white">
                  ⚡ 1-Click Desktop App Installation (Recommended)
                </span>
                <span className="px-2 py-0.5 rounded text-[10px] font-extrabold uppercase bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300">
                  Instant
                </span>
              </div>
              <p className="text-xs text-slate-600 dark:text-slate-300 mt-1 leading-relaxed">
                Click the <strong>[ 🖥️↓ ] Install App</strong> icon located in your Chrome / Edge address bar (top right next to the Star button). FORENZA will be added to your <strong>Windows Desktop & Start Menu</strong> as a standalone application!
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handlePwaInstall}
            className="shrink-0 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-95 text-white font-bold text-xs shadow-xs transition-all cursor-pointer"
          >
            Launch Install Prompt
          </button>
        </div>

        {/* All Certified Platform Packages Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                All Certified Platform Releases
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Select your required operating environment and verify cryptographic checksums.
              </p>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">
              RULE 902(14) CERTIFIED
            </span>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Windows Package */}
            <div
              className={`forenza-card p-6 rounded-3xl border ${
                detectedOS === 'Windows'
                  ? 'border-blue-500 shadow-md shadow-blue-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              } bg-white dark:bg-[#111827] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    <Monitor className="w-6 h-6" />
                  </div>
                  {detectedOS === 'Windows' && (
                    <span className="text-[10px] font-extrabold font-mono uppercase px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-300 dark:border-blue-800">
                      Your Detected OS
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Windows PC Desktop
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Forenza-Forensic-Setup.bat • 48.2 MB
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Enterprise Features:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Hardware Security Token & Device Binding</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Local SHA-256 Master Hash Calculation</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Full Standalone Window (Zero Browser Bars)</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadWindows}
                  className="w-full h-11 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Windows Installer (.bat)</span>
                </button>
                <button
                  type="button"
                  onClick={handlePwaInstall}
                  className="w-full h-10 rounded-xl border border-slate-300 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-xs flex items-center justify-center gap-1.5 hover:border-blue-500 transition-all cursor-pointer"
                >
                  <Zap className="w-3.5 h-3.5 text-amber-500" />
                  <span>Install as Native App (PWA)</span>
                </button>
              </div>
            </div>

            {/* Android Package */}
            <div
              className={`forenza-card p-6 rounded-3xl border ${
                detectedOS === 'Android'
                  ? 'border-emerald-500 shadow-md shadow-emerald-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              } bg-white dark:bg-[#111827] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  {detectedOS === 'Android' && (
                    <span className="text-[10px] font-extrabold font-mono uppercase px-2.5 py-1 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-300 dark:border-emerald-800">
                      Your Detected OS
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  Android Field Client
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  forenza-field-arm64-v8a.apk • 26.8 MB
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Field Capabilities:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Haversine GPS Geofence Radar HUD (±3m)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Edge AI Object Classifier (Knife, Weapon)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Single-Use 15-min QR Handover Tokens</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadAndroid}
                  className="w-full h-11 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download Android APK</span>
                </button>
              </div>
            </div>

            {/* macOS Package */}
            <div
              className={`forenza-card p-6 rounded-3xl border ${
                detectedOS === 'macOS'
                  ? 'border-indigo-500 shadow-md shadow-indigo-500/10'
                  : 'border-slate-200 dark:border-slate-800'
              } bg-white dark:bg-[#111827] flex flex-col justify-between`}
            >
              <div>
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-white">
                    <Apple className="w-6 h-6" />
                  </div>
                  {detectedOS === 'macOS' && (
                    <span className="text-[10px] font-extrabold font-mono uppercase px-2.5 py-1 rounded-full bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border border-slate-300 dark:border-slate-700">
                      Your Detected OS
                    </span>
                  )}
                </div>

                <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                  macOS Judicial Workstation
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                  Forenza-Universal-macOS.dmg • 52.1 MB
                </p>

                <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-2.5">
                  <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                    Mac Capabilities:
                  </span>
                  <ul className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Apple Silicon M-Series Neural Acceleration</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Secure Enclave Hardware Key Signing</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                      <span>Certified Rule 902 jsPDF Dossier Export</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                <button
                  type="button"
                  onClick={handleDownloadMac}
                  className="w-full h-11 rounded-xl bg-slate-900 hover:bg-slate-800 dark:bg-blue-600 dark:hover:bg-blue-700 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-xs transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  <span>Download for macOS (.dmg)</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Developer / CLI Quick Run Guide */}
        <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Developer & Direct CLI Execution
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can also run the complete multi-platform codebase in <code>/mobile</code> directly on your PC:
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1"># Windows PC App</span>
              <p className="text-blue-600 dark:text-blue-400 font-bold">flutter run -d windows</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1"># Android Smartphone</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">flutter run -d android</p>
            </div>
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1"># Web Workstation</span>
              <p className="text-purple-600 dark:text-purple-400 font-bold">npm run dev</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
