import { ForenzaLogo } from '@/components/brand/ForenzaLogo'
import { ShieldCheck, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

export function PublicFooter() {
  return (
    <footer className="border-t border-slate-200 dark:border-slate-800 bg-white dark:bg-[#070A12] text-slate-600 dark:text-slate-400 text-xs transition-colors">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* Brand Column */}
        <div className="space-y-3 md:col-span-1">
          <ForenzaLogo size="md" showTagline={true} linkToDashboard={false} />
          <p className="text-xs text-slate-500 leading-relaxed">
            Enterprise forensic evidence chain-of-custody, cryptographic verification, and judicial review platform.
          </p>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-md bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 text-[11px] font-mono text-blue-600 dark:text-blue-400">
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>ISO/IEC 27037 & NIST SP 800-86</span>
          </div>
        </div>

        {/* Platform & Engine Column */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-wider uppercase font-mono">
            Platform & Engine
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/platform" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                Supported Platforms (Web, Desktop, Android)
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                9-Step Evidence Lifecycle
              </Link>
            </li>
            <li>
              <Link href="/technology" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                Technology Architecture
              </Link>
            </li>
            <li>
              <Link href="/download" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                Download Client Packages
              </Link>
            </li>
          </ul>
        </div>

        {/* Security & Governance Column */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-wider uppercase font-mono">
            Security & Governance
          </h4>
          <ul className="space-y-2 text-xs">
            <li>
              <Link href="/security" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                Cryptographic Integrity & Threat Model
              </Link>
            </li>
            <li>
              <Link href="/how-it-works" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                Offline-First Emergency Protocol
              </Link>
            </li>
            <li>
              <Link href="/about" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                Institutional Mission & Ethics
              </Link>
            </li>
            <li>
              <Link href="/faq" className="hover:text-blue-600 dark:hover:text-blue-400 hover:underline transition-colors block py-0.5">
                Frequently Asked Questions
              </Link>
            </li>
          </ul>
        </div>

        {/* Institutional Contact Column */}
        <div className="space-y-2.5">
          <h4 className="font-bold text-slate-900 dark:text-slate-100 text-xs tracking-wider uppercase font-mono">
            Institutional Access
          </h4>
          <p className="text-xs text-slate-500 leading-relaxed">
            For court certifications, law-enforcement integration, or deployment audits:
          </p>
          <Link
            href="/contact"
            className="inline-flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline pt-1"
          >
            <span>Contact Forensic Solutions Team</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      </div>

      <div className="border-t border-slate-200 dark:border-slate-800/80 max-w-7xl mx-auto px-4 sm:px-6 py-4 flex flex-col sm:flex-row items-center justify-between gap-2 text-[11px] font-mono text-slate-500">
        <div>
          &copy; {new Date().getFullYear()} FORENZA Enterprise Forensics v1.0.0. All rights reserved.
        </div>
        <div>
          <span>Tamper-evident records. Legal admissibility determined by competent authority.</span>
        </div>
      </div>
    </footer>
  )
}
