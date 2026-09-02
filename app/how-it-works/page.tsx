import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import {
  Key,
  Camera,
  Fingerprint,
  Lock,
  QrCode,
  MapPin,
  FlaskConical,
  ShieldCheck,
  Scale,
  CheckCircle2,
  Activity,
  ArrowRight,
} from 'lucide-react'
import Link from 'next/link'

export default function HowItWorksPage() {
  const lifecycleSteps = [
    {
      num: '01',
      title: 'AUTHENTICATE & BIND',
      subtitle: 'Hardware Token & Biometric Verification',
      desc: 'The investigating officer authenticates via FIDO2 biometric login and hardware device token. The session is bound to an authorized station ID.',
      icon: Key,
      badge: 'Zero-Trust Auth',
    },
    {
      num: '02',
      title: 'CONTROLLED CAPTURE',
      subtitle: 'Native Camera Viewfinder & GPS Radar',
      desc: 'Evidence is acquired directly through the controlled viewfinder. Hardware GPS coordinates (±3m), heading, and UTC timestamp are captured.',
      icon: Camera,
      badge: 'Direct Acquisition',
    },
    {
      num: '03',
      title: 'CRYPTOGRAPHIC HASH',
      subtitle: 'Deterministic SHA-256 Master Seal',
      desc: 'Raw media bytes and canonical metadata are hashed into a deterministic Master Hash. The original bitstream is permanently frozen.',
      icon: Fingerprint,
      badge: 'Bitstream Freeze',
    },
    {
      num: '04',
      title: 'SECURE LOCAL / CLOUD VAULT',
      subtitle: 'AES-256 Encrypted Ingestion',
      desc: 'Evidence is encrypted locally with AES-256 if offline, or streamed directly to private object storage buckets with strict Row Level Security (RLS).',
      icon: Lock,
      badge: 'AES-256 Storage',
    },
    {
      num: '05',
      title: 'CUSTODY TRANSFER',
      subtitle: 'Single-Use 15-Minute Dynamic QR Token',
      desc: 'Transferring custody requires the sender to generate a signed QR token. The receiver scans and signs, appending an immutable custody block.',
      icon: QrCode,
      badge: 'Dual-Party Sign',
    },
    {
      num: '06',
      title: 'TRANSIT & DECOY DEFENSE',
      subtitle: 'Encrypted Telemetry with Decoy Protection',
      desc: 'Authorized in-transit evidence movement streams real GPS telemetry, while unauthorized eavesdroppers receive synthetic decoy coordinates.',
      icon: MapPin,
      badge: 'Honeypot Active',
    },
    {
      num: '07',
      title: 'LABORATORY ANALYSIS',
      subtitle: 'Aliquot Sample Depletion & Test Reports',
      desc: 'Forensic analysts record sample quantity intake, track consumed milligrams/milliliters, and seal scientific PDF findings with digital signatures.',
      icon: FlaskConical,
      badge: 'Sample Balance',
    },
    {
      num: '08',
      title: 'MATHEMATICAL INTEGRITY VERIFY',
      subtitle: 'Continuous Tamper-Evident Audit Scan',
      desc: 'The entire chain of custody is recursively verified from genesis to current holder. Any altered byte immediately triggers COMPROMISED status.',
      icon: ShieldCheck,
      badge: 'Tamper Detection',
    },
    {
      num: '09',
      title: 'JUDICIAL REVIEW & COURT DOSSIER',
      subtitle: 'Rule 902(14) Certified Evidence Package',
      desc: 'The court chamber accesses read-only vertical timelines and downloads a self-authenticating Court Dossier PDF with verified hash proofs.',
      icon: Scale,
      badge: 'Trial Ready',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <Activity className="w-3.5 h-3.5" />
            <span>9-STAGE EVIDENTIARY LIFECYCLE</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            How FORENZA Operates from Scene to Court
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every piece of physical and digital evidence follows a strict, mathematically verifiable 9-stage lifecycle ensuring absolute chain-of-custody integrity.
          </p>
        </div>

        {/* 9 Stages Visual Timeline */}
        <div className="space-y-6">
          {lifecycleSteps.map((step) => {
            const Icon = step.icon
            return (
              <div
                key={step.num}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-6 hover:border-blue-500/50 transition-all"
              >
                <div className="flex items-start gap-4">
                  <div className="p-3.5 rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400 shrink-0">
                    <Icon className="w-6 h-6" />
                  </div>
                  <div className="space-y-1">
                    <div className="flex items-center gap-2.5">
                      <span className="text-xs font-black font-mono text-blue-600 dark:text-blue-400">
                        STEP {step.num}
                      </span>
                      <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 font-bold uppercase">
                        {step.badge}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white">{step.title}</h3>
                    <p className="text-xs font-mono text-slate-500">{step.subtitle}</p>
                    <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed pt-1 max-w-2xl">
                      {step.desc}
                    </p>
                  </div>
                </div>
              </div>
            )
          })}
        </div>

        {/* Bottom CTA */}
        <div className="p-8 rounded-3xl bg-gradient-to-r from-blue-600 to-indigo-600 text-white text-center space-y-4">
          <h2 className="text-2xl font-bold">Ready to Access Your Authorized Workstation?</h2>
          <p className="text-xs sm:text-sm text-blue-100 max-w-xl mx-auto">
            Log in to your certified role desk or download the dedicated application for your operating system.
          </p>
          <div className="flex items-center justify-center gap-3 pt-2">
            <Link
              href="/login"
              className="px-6 py-3 rounded-xl bg-white text-blue-600 font-bold text-xs font-mono tracking-wider shadow-lg hover:bg-blue-50 transition-all"
            >
              SIGN IN TO FORENZA
            </Link>
            <Link
              href="/download"
              className="px-6 py-3 rounded-xl bg-white/20 hover:bg-white/30 text-white font-bold text-xs font-mono tracking-wider backdrop-blur-md transition-all"
            >
              DOWNLOAD CLIENTS
            </Link>
          </div>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
