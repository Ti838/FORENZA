'use client'

import { ForenzaLogo } from '@/components/brand/ForenzaLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
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
} from 'lucide-react'
import Link from 'next/link'

export default function HomePage() {
  const rolePortals = [
    {
      role: 'Investigating Officer (Field)',
      href: '/officer/dashboard',
      desc: 'GPS-geofenced camera acquisition, AI classification, SHA-256 master sealing & QR generation.',
      icon: Camera,
      badge: 'Field Mobile',
      color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60',
    },
    {
      role: 'Supervisor Command',
      href: '/supervisor/dashboard',
      desc: 'Case assignments, real-time evidence oversight & geofence perimeter override approvals.',
      icon: ShieldCheck,
      badge: 'Command Desktop',
      color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60',
    },
    {
      role: 'Central Evidence Vault',
      href: '/vault/dashboard',
      desc: 'QR token scanning, atomic custody handovers & physical rack/shelf/bin storage indexing.',
      icon: Building2,
      badge: 'Intake Control',
      color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60',
    },
    {
      role: 'Forensic Laboratory',
      href: '/lab/dashboard',
      desc: 'Scientific analysis, sample depletion balance control & certified PDF report sealing.',
      icon: FlaskConical,
      badge: 'Science Workstation',
      color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60',
    },
    {
      role: 'Judicial Chamber & Trial',
      href: '/judge/dashboard',
      desc: 'Cryptographic hash chain verification, vertical timeline, forensic map & Court Dossier export.',
      icon: Scale,
      badge: 'Judicial Portal',
      color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60',
    },
    {
      role: 'Master Forensic Auditor',
      href: '/auditor/dashboard',
      desc: 'High-density immutable audit ledger, tamper detection & security event monitoring.',
      icon: History,
      badge: 'Auditor Ledger',
      color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60',
    },
    {
      role: 'System Administration',
      href: '/admin/dashboard',
      desc: 'Hardware device binding approval, 7-role RBAC management & infrastructure health telemetry.',
      icon: Users,
      badge: 'Security Admin',
      color: 'text-slate-500 bg-slate-100 dark:bg-slate-800',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 transition-colors">
      {/* Top Header */}
      <header className="sticky top-0 z-20 h-16 bg-white/80 dark:bg-[#0F1523]/80 backdrop-blur-md border-b border-slate-200 dark:border-slate-800 px-6 flex items-center justify-between">
        <ForenzaLogo size="md" showTagline={true} />
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Link
            href="/download"
            className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-100 hover:border-blue-500 shadow-xs transition-colors"
          >
            <Download className="w-3.5 h-3.5 text-blue-500" />
            <span>Download App</span>
          </Link>
          <Link
            href="/login"
            className="px-4 py-2 rounded-xl text-xs font-bold bg-blue-600 hover:bg-blue-700 text-white shadow-sm transition-colors"
          >
            Personnel Sign In
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-12">
        <div className="text-center max-w-2xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-xs font-bold font-mono">
            <ShieldCheck className="w-4 h-4" />
            <span>ENTERPRISE FORENSIC SECURITY PLATFORM</span>
          </div>

          <h1 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-slate-900 dark:text-white">
            Trusted Evidence.{' '}
            <span className="bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
              True Justice.
            </span>
          </h1>

          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            FORENZA manages the complete evidentiary lifecycle from crime-scene acquisition under verified GPS geofences to courtroom judicial review with mathematical SHA-256 chain-of-custody proof.
          </p>

          {/* Quick CTA Actions */}
          <div className="flex items-center justify-center flex-wrap gap-3 pt-2">
            <Link
              href="/download"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-lg shadow-blue-600/25 transition-all"
            >
              <Download className="w-4 h-4" />
              <span>Download Client App (PC / Mobile)</span>
            </Link>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl border border-slate-300 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white font-bold text-xs hover:border-blue-500 shadow-xs transition-all"
            >
              <span>Personnel Sign In</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>

        {/* Role Portals Grid */}
        <div className="space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-slate-200 dark:border-slate-800">
            <div>
              <h2 className="text-sm font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
                Operational Workstations & Role Directory
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Access certified role workstations or sign in via central authentication.
              </p>
            </div>
            <span className="text-xs text-blue-600 dark:text-blue-400 font-mono font-bold">7 CERTIFIED RBAC ROLES</span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {rolePortals.map((portal) => {
              const Icon = portal.icon
              return (
                <Link
                  key={portal.role}
                  href={portal.href}
                  className="forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-blue-500 dark:hover:border-blue-600 transition-all duration-200 group flex flex-col justify-between shadow-xs hover:shadow-md"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className={`p-2 rounded-xl ${portal.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                      <span className="text-[10px] font-bold font-mono uppercase px-2 py-0.5 rounded-full bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                        {portal.badge}
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                      {portal.role}
                    </h3>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                      {portal.desc}
                    </p>
                  </div>

                  <div className="pt-4 mt-3 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs font-bold text-blue-600 dark:text-blue-400">
                    <span>Enter Workstation</span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                  </div>
                </Link>
              )
            })}
          </div>
        </div>
      </main>
    </div>
  )
}
