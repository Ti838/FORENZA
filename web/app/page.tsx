'use client'

import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import {
  Shield,
  ShieldCheck,
  Lock,
  ArrowRight,
  Fingerprint,
  Camera,
  Scale,
  FlaskConical,
  Building2,
  Users,
  History,
  CheckCircle2,
  Terminal,
  Activity,
  Cpu,
  Radio,
  Key,
  Layers,
  FileCheck,
  AlertTriangle,
  Zap,
  Globe,
  HardDrive,
  QrCode,
  MapPin,
  FileText,
} from 'lucide-react'
import Link from 'next/link'

export default function MasterPublicHomePage() {
  const lifecycleSteps = [
    { num: '01', title: 'AUTHENTICATE', desc: 'Authorized officer and bound hardware device authentication with MFA.', icon: Key },
    { num: '02', title: 'CAPTURE', desc: 'Evidence acquired under controlled viewfinder with real GPS & heading.', icon: Camera },
    { num: '03', title: 'HASH', desc: 'Raw media bytes & metadata canonicalized into deterministic SHA-256.', icon: Fingerprint },
    { num: '04', title: 'SECURE', desc: 'Encrypted into private cloud storage or local encrypted vault.', icon: Lock },
    { num: '05', title: 'CUSTODY', desc: 'Single-use 15-min QR token with dual-sign custody transfer.', icon: QrCode },
    { num: '06', title: 'TRANSIT', desc: 'Live GPS telemetry stream with defensive decoy coordinates.', icon: MapPin },
    { num: '07', title: 'LAB', desc: 'Scientific aliquot sample tracking & certified PDF analysis sealing.', icon: FlaskConical },
    { num: '08', title: 'VERIFY', desc: 'Append-only hash chain mathematically verified across all nodes.', icon: ShieldCheck },
    { num: '09', title: 'COURT', desc: 'Rule 902(14) self-authenticating Court Dossier PDF generated.', icon: Scale },
  ]

  const capabilities = [
    { title: 'Secure Evidence Capture', desc: 'Controlled device camera acquisition with mandatory GPS and UTC timestamping.', icon: Camera },
    { title: 'Chain of Custody', desc: 'Mathematical blockchain-style hash chaining preventing silent custody alterations.', icon: History },
    { title: 'Offline Emergency Capture', desc: 'Zero-internet 1-touch capture, local AES encryption, and safe scene departure.', icon: Zap },
    { title: 'Cryptographic Integrity', desc: 'Deterministic SHA-256 verification detecting even single-bit data modifications.', icon: ShieldCheck },
    { title: 'AI-Assisted Classification', desc: 'Assistive Google Gemini classification with qualitative uncertainty labels.', icon: Cpu },
    { title: 'Secure Evidence Vault', desc: 'Physical bin/shelf indexing, intake barcode scanning, and custodian tracking.', icon: Building2 },
    { title: 'Transit Monitoring', desc: 'Real-time vehicle telemetry tracking with defensive decoy protection.', icon: Radio },
    { title: 'Forensic Laboratory', desc: 'Aliquot sample depletion tracking and cross-report discrepancy detection.', icon: FlaskConical },
    { title: 'Judicial Audit', desc: 'Read-only court portal with chronological vertical evidence timeline.', icon: Scale },
    { title: 'Court Dossier', desc: 'One-click Rule 902(14) certified evidence PDF generation for trial review.', icon: FileText },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans selection:bg-blue-500 selection:text-white transition-colors">
      <PublicNavbar />

      {/* 1. HERO SECTION */}
      <section className="relative pt-16 pb-20 overflow-hidden border-b border-slate-200 dark:border-slate-800/80">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-blue-500/10 dark:bg-blue-600/10 rounded-full blur-3xl pointer-events-none" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 relative z-10 space-y-8 text-center">
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-700 dark:text-blue-300">
            <Shield className="w-3.5 h-3.5 text-blue-500" />
            <span>ENTERPRISE FORENSIC EVIDENCE & CHAIN OF CUSTODY PLATFORM</span>
          </div>

          <div className="max-w-4xl mx-auto space-y-4">
            <h1 className="text-4xl sm:text-6xl font-black tracking-tight leading-tight">
              Secure Evidence.{' '}
              <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-blue-400 bg-clip-text text-transparent">
                Verified Chain.
              </span>{' '}
              Defensible Truth.
            </h1>
            <p className="text-base sm:text-lg text-slate-600 dark:text-slate-300 max-w-3xl mx-auto leading-relaxed">
              FORENZA securely manages digital and physical evidence from crime-scene acquisition under verified GPS geofences through laboratory analysis to courtroom judicial review with mathematical SHA-256 chain-of-custody verification.
            </p>
          </div>

          {/* Primary & Secondary CTAs */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-2">
            <Link
              href="/login"
              className="w-full sm:w-auto px-8 py-4 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-sm font-mono tracking-wider shadow-lg shadow-blue-600/30 flex items-center justify-center gap-2 transition-all border border-blue-400/30"
            >
              <Key className="w-4 h-4" />
              <span>ACCESS FORENZA WORKSTATION</span>
              <ArrowRight className="w-4 h-4" />
            </Link>

            <Link
              href="#how-it-works"
              className="w-full sm:w-auto px-7 py-4 rounded-2xl bg-white dark:bg-slate-900 hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-800 dark:text-slate-200 font-bold text-sm border border-slate-200 dark:border-slate-700 shadow-sm transition-all"
            >
              Explore How It Works
            </Link>
          </div>

          {/* 2. HERO FORENSIC LIFECYCLE FLOW VISUAL */}
          <div className="pt-10 max-w-5xl mx-auto">
            <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 shadow-xl space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-slate-800 pb-3">
                <span className="text-xs font-mono font-bold text-slate-500 uppercase flex items-center gap-2">
                  <Activity className="w-4 h-4 text-blue-500" />
                  <span>END-TO-END EVIDENTIARY LIFECYCLE INTEGRITY</span>
                </span>
                <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400">
                  RULE 902(14) CERTIFIED ARCHITECTURE
                </span>
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3 text-center">
                {[
                  { title: 'Crime Scene', sub: 'GPS Geofence', icon: MapPin },
                  { title: 'Evidence Capture', sub: 'Direct Viewfinder', icon: Camera },
                  { title: 'SHA-256 Hash', sub: 'Master Seal', icon: Fingerprint },
                  { title: 'Secure Custody', sub: 'Single-Use QR', icon: QrCode },
                  { title: 'Transit Telemetry', sub: 'Decoy Defense', icon: Radio },
                  { title: 'Forensic Lab', sub: 'Sample Depletion', icon: FlaskConical },
                  { title: 'Judicial Chamber', sub: 'Court Dossier', icon: Scale },
                ].map((node, i) => {
                  const Icon = node.icon
                  return (
                    <div
                      key={node.title}
                      className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0F1523] border border-slate-200/80 dark:border-slate-800 flex flex-col items-center justify-center gap-2"
                    >
                      <div className="p-2 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                        <Icon className="w-4 h-4" />
                      </div>
                      <span className="font-bold text-xs text-slate-800 dark:text-slate-200">{node.title}</span>
                      <span className="text-[10px] font-mono text-slate-500">{node.sub}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. CORE CAPABILITIES SECTION */}
      <section className="py-20 max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
        <div className="text-center space-y-3 max-w-2xl mx-auto">
          <h2 className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
            CORE FORENSIC CAPABILITIES
          </h2>
          <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
            Built for High-Stakes Forensic Investigations
          </h3>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
            Eliminating evidence tampering, custody disputes, and chain-of-custody ambiguity through software-enforced cryptographic proofs.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {capabilities.map((cap) => {
            const Icon = cap.icon
            return (
              <div
                key={cap.title}
                className="p-6 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-sm hover:border-blue-500/50 transition-all space-y-3"
              >
                <div className="p-3 w-fit rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h4 className="font-bold text-base text-slate-900 dark:text-slate-100">{cap.title}</h4>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{cap.desc}</p>
              </div>
            )
          })}
        </div>
      </section>

      {/* 4. HOW IT WORKS (9-STEP LIFECYCLE) */}
      <section id="how-it-works" className="py-20 bg-slate-100/60 dark:bg-[#090D16] border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-12">
          <div className="text-center space-y-3 max-w-2xl mx-auto">
            <h2 className="text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest">
              LIFECYCLE METHODOLOGY
            </h2>
            <h3 className="text-2xl sm:text-3xl font-black tracking-tight text-slate-900 dark:text-white">
              How FORENZA Operates Across 9 Stages
            </h3>
            <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed">
              Every operation from scene capture to courtroom trial forms an append-only verifiable cryptographic ledger.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {lifecycleSteps.map((step) => {
              const Icon = step.icon
              return (
                <div
                  key={step.num}
                  className="p-6 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-sm relative overflow-hidden space-y-3"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-black font-mono text-blue-600/30 dark:text-blue-400/20">
                      {step.num}
                    </span>
                    <div className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                      <Icon className="w-4 h-4" />
                    </div>
                  </div>
                  <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">{step.title}</h4>
                  <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{step.desc}</p>
                </div>
              )
            })}
          </div>
        </div>
      </section>

      {/* 5. OFFLINE EMERGENCY CAPTURE (PROMINENT HIGHLIGHT) */}
      <section id="offline" className="py-20 max-w-7xl mx-auto px-4 sm:px-6">
        <div className="p-8 sm:p-12 rounded-3xl bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 border border-blue-800/40 text-white shadow-2xl space-y-8 relative overflow-hidden">
          <div className="max-w-2xl space-y-3 relative z-10">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/30 text-amber-300 text-xs font-mono font-bold">
              <Zap className="w-3.5 h-3.5" />
              <span>OFFLINE-FIRST EMERGENCY PROTOCOL</span>
            </div>
            <h2 className="text-2xl sm:text-4xl font-black tracking-tight">
              No Internet? FORENZA Captures & Secures Evidence Instantly.
            </h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              When working in remote areas or high-risk crime scenes with zero mobile connectivity, officer safety is paramount. FORENZA calculates raw SHA-256, encrypts media locally with AES-256, and permits the officer to depart immediately. Synchronization happens automatically when network returns.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 relative z-10">
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <h4 className="font-bold text-sm text-emerald-400">1. Instant Capture & Hash</h4>
              <p className="text-xs text-slate-300">Raw bytes hashed on-device before any compression or transfer.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <h4 className="font-bold text-sm text-blue-400">2. Local AES Encryption</h4>
              <p className="text-xs text-slate-300">Stored in private application vault; never accessible from gallery.</p>
            </div>
            <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-1.5">
              <h4 className="font-bold text-sm text-amber-400">3. Idempotent Sync</h4>
              <p className="text-xs text-slate-300">Dual timestamps preserved; network drops never duplicate evidence.</p>
            </div>
          </div>
        </div>
      </section>

      {/* 6. ETHICAL AI & UNCERTAINTY ASSURANCE */}
      <section className="py-16 bg-slate-100/60 dark:bg-[#090D16] border-y border-slate-200 dark:border-slate-800/80">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 space-y-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-2 max-w-2xl">
              <span className="text-xs font-mono font-bold text-purple-600 dark:text-purple-400 uppercase">
                HUMAN-IN-THE-LOOP AI ETHICS
              </span>
              <h3 className="text-2xl font-black text-slate-900 dark:text-white">
                AI is Strictly an Assistive Hypothesis Generator
              </h3>
              <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
                FORENZA uses Google Gemini 2.0 Flash to assist investigators with object classification and discrepancy detection. AI never determines criminal liability, guilt, innocence, or legal admissibility.
              </p>
            </div>

            <div className="p-5 rounded-2xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-800/50 space-y-2 shrink-0 max-w-md">
              <div className="flex items-center gap-2 font-bold text-xs text-purple-800 dark:text-purple-300 font-mono">
                <CheckCircle2 className="w-4 h-4 text-purple-500" />
                <span>QUALITATIVE CONFIDENCE ONLY</span>
              </div>
              <p className="text-[11px] text-slate-600 dark:text-slate-300">
                Fabricated decimal probabilities are strictly prohibited. Models output honest qualitative indicators: HIGH, MEDIUM, LOW, or UNCERTAIN.
              </p>
            </div>
          </div>
        </div>
      </section>

      <PublicFooter />
    </div>
  )
}
