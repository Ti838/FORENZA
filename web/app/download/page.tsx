'use client'

import { useState } from 'react'
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
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

interface ReleasePackage {
  platform: string
  version: string
  filename: string
  fileSize: string
  releaseDate: string
  sha256: string
  icon: any
  badge: string
  badgeColor: string
  requirements: string
  features: string[]
  downloadUrl: string
}

export default function DownloadPage() {
  const [copiedHash, setCopiedHash] = useState<string | null>(null)

  const releases: ReleasePackage[] = [
    {
      platform: 'Windows PC Desktop',
      version: 'v1.4.0-prod',
      filename: 'Forenza-Forensic-Setup-x64.exe',
      fileSize: '48.2 MB',
      releaseDate: 'August 2026',
      sha256: '9a4f8812c44e991be3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934c',
      icon: Monitor,
      badge: 'Recommended for Workstations',
      badgeColor: 'bg-blue-100 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border-blue-300 dark:border-blue-800',
      requirements: 'Windows 10 / 11 (64-bit), 4GB RAM',
      features: [
        'Hardware Security Token & TPM 2.0 Binding',
        'Direct DSLR / Lab Microscope Device Link',
        'Offline Cryptographic SHA-256 Sealing',
        'Multi-monitor Judicial & Vault Indexing',
      ],
      downloadUrl: '#download-windows',
    },
    {
      platform: 'Android Mobile Field Client',
      version: 'v1.4.0-prod',
      filename: 'forenza-field-arm64-v8a.apk',
      fileSize: '26.8 MB',
      releaseDate: 'August 2026',
      sha256: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      icon: Smartphone,
      badge: 'Official Field APK',
      badgeColor: 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border-emerald-300 dark:border-emerald-800',
      requirements: 'Android 10.0+ (API Level 29+), Camera & High-Accuracy GPS',
      features: [
        'Live Haversine GPS Geofence Radar HUD (±3m)',
        'Edge AI Object Classifier (Knife, Weapon, Bio)',
        'High-Speed QR Scanner & Single-Use Handover Tokens',
        'Encrypted Offline Evidence Vault Buffer',
      ],
      downloadUrl: '#download-android',
    },
    {
      platform: 'macOS Forensic Client',
      version: 'v1.4.0-prod',
      filename: 'Forenza-Universal-AppleSilicon.dmg',
      fileSize: '52.1 MB',
      releaseDate: 'August 2026',
      sha256: '7f83b1657ff1fc53b92dc18148a1d65dfc2d4b1fa3d677284addd200126d9069',
      icon: Apple,
      badge: 'Universal Binary',
      badgeColor: 'bg-slate-200 dark:bg-slate-800 text-slate-800 dark:text-slate-200 border-slate-300 dark:border-slate-700',
      requirements: 'macOS 12.0 Monterey or newer (M1/M2/M3 & Intel)',
      features: [
        'Apple Silicon Metal Neural Engine Acceleration',
        'Secure Enclave Hardware Key Management',
        'Direct jsPDF Rule 902 Dossier Compilation',
        'Dark & Light Mode System Synchronization',
      ],
      downloadUrl: '#download-macos',
    },
  ]

  const handleCopyHash = (hash: string) => {
    navigator.clipboard.writeText(hash)
    setCopiedHash(hash)
    toast.success('Binary SHA-256 checksum copied to clipboard')
    setTimeout(() => setCopiedHash(null), 2000)
  }

  const handleDownload = (pkg: ReleasePackage) => {
    toast.info(`Preparing cryptographic package: ${pkg.filename}...`)
    // Create simulated file download
    const dummyContent = `FORENZA Official Cryptographic Binary Package\nPlatform: ${pkg.platform}\nVersion: ${pkg.version}\nSHA-256: ${pkg.sha256}\nCertified Rule 902(14) Forensic Client.`
    const blob = new Blob([dummyContent], { type: 'application/octet-stream' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = pkg.filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
    toast.success(`Download started: ${pkg.filename}`)
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
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 space-y-12">
        {/* Header Hero */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
            <Download className="w-4 h-4" />
            <span>OFFICIAL CROSS-PLATFORM CLIENT RELEASES</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Download the FORENZA Client Application
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Deploy the certified FORENZA application to your <strong>Windows PC</strong>, <strong>Android Field Smartphone</strong>, or <strong>macOS</strong> workstation. Maintain hardware-bound cryptographic evidence sealing in offline and connected field environments.
          </p>
        </div>

        {/* Release Packages Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {releases.map((pkg) => {
            const Icon = pkg.icon
            return (
              <div
                key={pkg.platform}
                className="forenza-card p-6 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm flex flex-col justify-between hover:border-blue-500/60 dark:hover:border-blue-500/60 transition-all"
              >
                <div>
                  {/* Top Platform Header */}
                  <div className="flex items-start justify-between gap-3 mb-4">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span
                      className={`text-[10px] font-extrabold font-mono uppercase px-2.5 py-1 rounded-full border ${pkg.badgeColor}`}
                    >
                      {pkg.badge}
                    </span>
                  </div>

                  <h3 className="text-xl font-extrabold text-slate-900 dark:text-white">
                    {pkg.platform}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                    {pkg.filename} • {pkg.fileSize}
                  </p>

                  <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-3">
                    <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                      Core Capabilities:
                    </span>
                    <ul className="space-y-2">
                      {pkg.features.map((feat, idx) => (
                        <li
                          key={idx}
                          className="flex items-start gap-2 text-xs text-slate-700 dark:text-slate-300"
                        >
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0 mt-0.5" />
                          <span>{feat}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Bottom Actions & Checksum */}
                <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800/80 space-y-4">
                  <div>
                    <span className="text-[10px] font-mono text-slate-400 block mb-1">
                      SHA-256 BINARY CHECKSUM:
                    </span>
                    <div className="flex items-center justify-between p-2 rounded-lg bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-[10px] font-mono text-slate-600 dark:text-slate-300 break-all select-all">
                      <span className="truncate mr-2">{pkg.sha256.slice(0, 24)}...</span>
                      <button
                        type="button"
                        onClick={() => handleCopyHash(pkg.sha256)}
                        className="p-1 text-slate-400 hover:text-blue-500"
                        title="Copy Full Checksum"
                      >
                        <Copy className="w-3 h-3" />
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => handleDownload(pkg)}
                    className="w-full h-12 rounded-xl bg-blue-600 hover:bg-blue-700 active:scale-98 text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-blue-600/20 transition-all cursor-pointer"
                  >
                    <Download className="w-4 h-4" />
                    <span>Download for {pkg.platform.split(' ')[0]}</span>
                  </button>
                </div>
              </div>
            )
          })}
        </div>

        {/* CLI / Developer Quick Install Section */}
        <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
              <Terminal className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-slate-900 dark:text-white">
                Run Directly from Source via Flutter CLI
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                You can also run the complete client codebase located in the <code>/mobile</code> repository.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 font-mono text-xs">
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1"># Windows PC Desktop App</span>
              <p className="text-blue-600 dark:text-blue-400 font-bold">flutter run -d windows</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1"># Android Smartphone</span>
              <p className="text-emerald-600 dark:text-emerald-400 font-bold">flutter run -d android</p>
            </div>
            <div className="p-3 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800">
              <span className="text-slate-400 text-[10px] block mb-1"># Web Client</span>
              <p className="text-purple-600 dark:text-purple-400 font-bold">flutter run -d chrome</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
