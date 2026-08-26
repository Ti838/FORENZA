import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import { ShieldCheck, Target, HeartHandshake, Eye, Award, CheckCircle2 } from 'lucide-react'

export default function AboutPage() {
  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <Target className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL MISSION & PHILOSOPHY</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Restoring Trust in the Chain of Evidence
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            FORENZA was engineered to solve the global challenge of evidence tampering, broken custody chains, and judicial delays through mathematical certainty and transparent auditability.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-blue-500" />
              <span>The Problem</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Traditional paper logbooks and unencrypted digital storage leave evidence vulnerable to retroactive alteration, lost custody timestamps, and disputed crime-scene coordinates.
            </p>
          </div>

          <div className="p-6 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 space-y-3">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white flex items-center gap-2">
              <Eye className="w-5 h-5 text-emerald-500" />
              <span>The FORENZA Solution</span>
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">
              Every item acquired is instantly hashed with SHA-256 at the crime scene, anchored into an append-only custody chain, and verified using cryptographic proofs at trial.
            </p>
          </div>
        </div>

        <div className="p-8 rounded-3xl bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-900/50 space-y-4">
          <h3 className="font-bold text-base text-slate-900 dark:text-white font-mono uppercase">
            Four Core Tenets of FORENZA Governance
          </h3>
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs text-slate-700 dark:text-slate-300">
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Immutable Originals:</strong> Raw evidence bytes are never overwritten or modified.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Human-Controlled AI:</strong> AI suggestions remain strictly assistive and require human sign-off.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Officer Safety First:</strong> Fast offline emergency capture ensures officers can exit dangerous locations safely.</span>
            </li>
            <li className="flex items-start gap-2">
              <CheckCircle2 className="w-4 h-4 text-blue-500 shrink-0 mt-0.5" />
              <span><strong>Judicial Transparency:</strong> Read-only access for judges with mathematical integrity proofs.</span>
            </li>
          </ul>
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
