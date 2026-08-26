import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import {
  ShieldCheck,
  Lock,
  KeyRound,
  Radio,
  EyeOff,
  Server,
  CheckCircle2,
  FileCode,
  Shield,
  Layers,
} from 'lucide-react'

export default function SecurityPage() {
  const securityPillars = [
    {
      title: 'Device Trust & Hardware Binding',
      desc: 'Cryptographic hardware device token binding. Sessions are authorized strictly on verified hardware; compromised devices are instantly revoked at the edge.',
      icon: KeyRound,
    },
    {
      title: 'Row Level Security (PostgreSQL RLS)',
      desc: 'Database-engine access policies strictly enforce that officers only query their assigned cases and judicial magistrates maintain immutable read-only access.',
      icon: Server,
    },
    {
      title: 'Private Storage & Ephemeral Signed URLs',
      desc: 'Raw evidence media is stored in private cloud object buckets, accessible strictly via short-lived (60-second TTL) cryptographically signed presigned URLs.',
      icon: Lock,
    },
    {
      title: 'Honeypot Decoy Telemetry & Anti-Surveillance',
      desc: 'Unauthorized requests attempting to track in-transit evidence receive synthetic multi-point decoy coordinates, preserving physical officer safety.',
      icon: Radio,
    },
    {
      title: 'Append-Only Cryptographic Audit Ledger',
      desc: 'Every login, upload, hash calculation, override, and custody handover is recorded into an immutable audit table governed by PostgreSQL engine triggers.',
      icon: ShieldCheck,
    },
    {
      title: 'Local AES-256 Offline Vault',
      desc: 'In field conditions without network connectivity, evidence media is encrypted with AES-256 before disk writing, preventing unauthorized gallery access.',
      icon: EyeOff,
    },
  ]

  const threatMitigations = [
    {
      threat: 'Retroactive Evidence Modification',
      mitigation: 'Deterministic SHA-256 master hashing over raw bytes and canonical metadata. Any altered byte fails hash recalculation.',
    },
    {
      threat: 'Repudiation of Custody Handover',
      mitigation: '15-minute dynamic single-use QR tokens combined with dual-signature biometric custody block chaining.',
    },
    {
      threat: 'Unauthorized In-Transit Surveillance',
      mitigation: 'Real-time honeypot decoy telemetry engine broadcasting multi-point synthetic scatter vectors to unauthenticated probes.',
    },
    {
      threat: 'Search Engine Indexing & Information Leakage',
      mitigation: 'Stealth robots.txt policy and token-gated institutional onboarding preventing public crawling and unauthorized self-registration.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-16">
        {/* Header */}
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CRYPTOGRAPHIC INTEGRITY & THREAT MODEL</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Defense-in-Depth Security Architecture
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            FORENZA employs a zero-trust, multi-layered security model ensuring that physical evidence and digital artifacts remain tamper-evident and untraceable across their entire judicial lifecycle.
          </p>
        </div>

        {/* 6 Security Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {securityPillars.map((p) => {
            const Icon = p.icon
            return (
              <div
                key={p.title}
                className="p-6 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="p-3 w-fit rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{p.title}</h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{p.desc}</p>
              </div>
            )
          })}
        </div>

        {/* Formal Threat Model & Mitigations Table */}
        <div className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E131F] border border-slate-200 dark:border-slate-800 shadow-sm space-y-6">
          <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
            <Layers className="w-4 h-4 text-blue-500" />
            <span>FORMAL THREAT MODEL & MITIGATION MATRIX</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {threatMitigations.map((item, idx) => (
              <div
                key={idx}
                className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200/80 dark:border-slate-800 space-y-1.5"
              >
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900 dark:text-slate-100">
                  <span className="w-2 h-2 rounded-full bg-blue-500" />
                  <span>{item.threat}</span>
                </div>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed pl-4">
                  {item.mitigation}
                </p>
              </div>
            ))}
          </div>
        </div>

        {/* Responsible Disclosure */}
        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-3">
          <h3 className="font-bold text-base font-mono uppercase text-blue-400">
            Responsible Disclosure & Security Boundaries
          </h3>
          <p className="text-xs text-slate-300 leading-relaxed">
            FORENZA does not claim mathematical impossibility of database modification by root database superusers. Instead, it implements mathematical hash chains, tamper-evident audit logs, and independent verification algorithms so that any unauthorized modification is instantly detected and flagged as <strong>COMPROMISED / TAMPERED</strong>.
          </p>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
