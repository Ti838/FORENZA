import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import { ShieldCheck, Lock, KeyRound, Radio, EyeOff, Server, CheckCircle2 } from 'lucide-react'

export default function SecurityPage() {
  const securityPillars = [
    {
      title: 'Device Trust & Binding',
      desc: 'Hardware device ID binding approved by administrators. Compromised devices can be revoked instantly, blocking remote synchronization.',
      icon: KeyRound,
    },
    {
      title: 'Row Level Security (RLS)',
      desc: 'PostgreSQL database-level access rules strictly enforce that officers only query their assigned cases and judges maintain read-only access.',
      icon: Server,
    },
    {
      title: 'Private Storage & Signed URLs',
      desc: 'Evidence files are stored in private object storage buckets. Media is accessed only via short-lived (60-second TTL) cryptographically signed URLs.',
      icon: Lock,
    },
    {
      title: 'Honeypot Decoy Telemetry',
      desc: 'Unauthorized requests attempting to track in-transit evidence receive synthetic decoy coordinates while alerting security personnel.',
      icon: Radio,
    },
    {
      title: 'Append-Only Audit Ledger',
      desc: 'Every login, upload, hash calculation, override, and custody handover is recorded into an immutable audit table that cannot be silently modified.',
      icon: ShieldCheck,
    },
    {
      title: 'Local AES-256 Offline Vault',
      desc: 'When offline, evidence media is encrypted with AES-256 before disk writing. Lost phones cannot leak raw evidence to device galleries.',
      icon: EyeOff,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>CRYPTOGRAPHIC INTEGRITY & THREAT MODEL</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Defense-in-Depth Security Architecture
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            FORENZA employs a zero-trust, multi-layered security model ensuring that physical evidence and digital artifacts remain tamper-evident across their entire judicial lifecycle.
          </p>
        </div>

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

        <div className="p-6 sm:p-8 rounded-3xl bg-slate-900 text-white border border-slate-800 space-y-4">
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
