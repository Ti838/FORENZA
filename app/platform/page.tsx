import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import { Monitor, Smartphone, Terminal, Apple, Globe, CheckCircle2, ArrowRight, Layers, ShieldCheck } from 'lucide-react'
import Link from 'next/link'

export default function PlatformPage() {
  const clients = [
    {
      id: 'web',
      name: 'FORENZA Web Platform',
      subtitle: 'Secure browser-based FORENZA workspace',
      tech: 'Next.js 16 • React 19 • TypeScript',
      desc: 'Centralized access for all authorized roles. Case management, evidence registry, vertical timeline, real-time satellite telemetry viewer, and jsPDF court dossier export.',
      icon: Globe,
      capabilities: [
        'Case Management & Evidence Indexing',
        'Chain of Custody & Master Hash Verification',
        'Forensic Laboratory & Aliquot Balance Control',
        'Judicial Review & Court Dossier Export',
        'Zero-Install Universal Browser Access',
      ],
    },
    {
      id: 'android',
      name: 'FORENZA Android',
      subtitle: 'Field-optimized FORENZA application',
      tech: 'Flutter 3.x • Pure Dart Crypto • SQLite Vault',
      desc: 'Optimized for crime-scene operations and evidence custody transfers. Features native camera acquisition, GPS geofence radar, offline AES-256 local vault, and fast QR token handovers.',
      icon: Smartphone,
      capabilities: [
        'Full Role-Based FORENZA Access',
        'Native Camera Viewfinder Capture',
        'Hardware GPS Location & 500m Geofence',
        'Offline Emergency Capture with Local AES-256',
        'Single-Use QR Token Custody Handovers',
        'Idempotent Background Synchronization',
      ],
    },
    {
      id: 'windows',
      name: 'FORENZA for Windows',
      subtitle: 'Full desktop FORENZA application',
      tech: 'Tauri 2.x • Rust Core • WebView2',
      desc: 'Complete standalone desktop workstation for forensic laboratories, command desks, and case management with large multi-column tables and local secure storage.',
      icon: Monitor,
      capabilities: [
        'Full Role-Based FORENZA Access',
        'Case, Evidence & Vault Inventory Management',
        'Scientific Laboratory & Sample Depletion Tracking',
        'Append-Only Audit Ledger & Security Center',
        'Judicial Review & Rule 902(14) Dossier Export',
        'Standalone Zero-Browser Desktop Window',
      ],
    },
    {
      id: 'macos',
      name: 'FORENZA for macOS',
      subtitle: 'Full desktop FORENZA application',
      tech: 'Tauri 2.x • Universal Binary (Apple Silicon & Intel)',
      desc: 'Native macOS desktop application providing the complete forensic suite for investigators, supervisors, analysts, and judicial chambers.',
      icon: Apple,
      capabilities: [
        'Full Role-Based FORENZA Access',
        'Case, Evidence & Vault Inventory Management',
        'Scientific Laboratory & Sample Depletion Tracking',
        'Append-Only Audit Ledger & Security Center',
        'Judicial Review & Rule 902(14) Dossier Export',
        'Universal Binary for Apple Silicon & Intel',
      ],
    },
    {
      id: 'linux',
      name: 'FORENZA for Linux',
      subtitle: 'Full desktop FORENZA application',
      tech: 'Tauri 2.x • AppImage • Debian (.deb)',
      desc: 'Dedicated desktop application for Ubuntu, Kali Linux, and Debian environments, providing sandboxed memory execution and complete forensic evidence management.',
      icon: Terminal,
      capabilities: [
        'Full Role-Based FORENZA Access',
        'Case, Evidence & Vault Inventory Management',
        'Scientific Laboratory & Sample Depletion Tracking',
        'Append-Only Audit Ledger & Security Center',
        'Judicial Review & Rule 902(14) Dossier Export',
        'Self-Contained Portable .AppImage Binary',
      ],
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <Layers className="w-3.5 h-3.5" />
            <span>UNIFIED PLATFORM ARCHITECTURE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            One Forensic Core. Multiple Authorized Clients.
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            FORENZA is a single unified evidence platform. Web, Android, Windows, macOS, and Linux are authorized clients of the same secure core—sharing the same authentication, database, SHA-256 evidence ledger, and Row Level Security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {clients.map((c) => {
            const Icon = c.icon
            return (
              <div
                key={c.id}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-sm space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <div className="p-3 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Icon className="w-6 h-6" />
                    </div>
                    <span className="text-[10px] font-mono font-bold text-slate-500">{c.tech}</span>
                  </div>

                  <div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{c.name}</h3>
                    <p className="text-xs text-slate-500 font-mono">{c.subtitle}</p>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{c.desc}</p>

                  <div className="pt-3 border-t border-slate-100 dark:border-slate-800/80 space-y-2 text-xs text-slate-700 dark:text-slate-300">
                    {c.capabilities.map((cap) => (
                      <div key={cap} className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>{cap}</span>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 dark:border-slate-800/80">
                  <Link
                    href="/download"
                    className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                  >
                    <span>Get {c.name.split(' ')[1] || c.name} Client &rarr;</span>
                  </Link>
                </div>
              </div>
            )
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
