'use client'

import { useState, useEffect } from 'react'
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
  ShieldAlert,
  Terminal,
  Activity,
  MapPin,
  RefreshCw,
} from 'lucide-react'

export default function SecurityPage() {
  const [isHackedMode, setIsHackedMode] = useState(false)
  const [tick, setTick] = useState(0)

  // Simulation tick to dynamically change decoy coordinates in real-time
  useEffect(() => {
    if (!isHackedMode) return
    const interval = setInterval(() => {
      setTick((t) => t + 1)
    }, 1500)
    return () => clearInterval(interval)
  }, [isHackedMode])

  const decoyCities = [
    { name: 'Dhaka Sector 4', baseLat: 23.8103, baseLng: 90.4125, speed: '52 km/h' },
    { name: 'Chittagong Port', baseLat: 22.3569, baseLng: 91.7832, speed: '68 km/h' },
    { name: 'Rajshahi Highway', baseLat: 24.3745, baseLng: 88.6042, speed: '34 km/h' },
    { name: 'Khulna Bypass', baseLat: 22.8456, baseLng: 89.5403, speed: '60 km/h' },
    { name: 'Sylhet Border', baseLat: 24.8949, baseLng: 91.8687, speed: '45 km/h' },
  ]

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
            FORENZA employs a zero-trust, multi-layered security model ensuring that physical evidence and digital artifacts remain tamper-evident and untraceable across their entire lifecycle.
          </p>
        </div>

        {/* 🌟 LIVE CLASS DEMO: Interactive Anti-Hacking & Ghost Decoy Swarm Simulator */}
        <section className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0E131F] border-2 border-blue-500/40 dark:border-blue-500/30 shadow-2xl space-y-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-200 dark:border-slate-800">
            <div>
              <div className="flex items-center gap-2 text-xs font-mono font-bold text-blue-600 dark:text-blue-400 uppercase">
                <Activity className="w-4 h-4 animate-pulse text-emerald-500" />
                <span>LIVE ANTI-SURVEILLANCE & HONEYPOT RADAR SIMULATOR</span>
              </div>
              <h2 className="text-xl font-bold text-slate-900 dark:text-white mt-1">
                Live Attack & Ghost Decoy Swarm Demonstration
              </h2>
              <p className="text-xs text-slate-500">
                Click the attack button to simulate an unauthorized adversary attempting to track in-transit evidence.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsHackedMode(!isHackedMode)}
              className={`px-5 py-3 rounded-2xl font-bold text-xs font-mono flex items-center gap-2 transition-all shadow-lg cursor-pointer ${
                isHackedMode
                  ? 'bg-red-600 hover:bg-red-700 text-white shadow-red-600/40 animate-pulse'
                  : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-600/30'
              }`}
            >
              {isHackedMode ? (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>SIMULATING ATTACK (CLICK TO RESTORE)</span>
                </>
              ) : (
                <>
                  <Radio className="w-4 h-4" />
                  <span>SIMULATE ADVERSARY INTRUSION PROBE</span>
                </>
              )}
            </button>
          </div>

          {/* Dynamic Radar Display */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Map / Telemetry Feed */}
            <div className="p-5 rounded-2xl bg-slate-950 text-slate-100 font-mono text-xs space-y-4 border border-slate-800 relative overflow-hidden">
              <div className="flex items-center justify-between">
                <span className="text-slate-400 font-bold uppercase flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-blue-400" />
                  <span>WHAT THE ADVERSARY SEES:</span>
                </span>
                <span
                  className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold ${
                    isHackedMode ? 'bg-red-500/20 text-red-400 border border-red-500/40' : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40'
                  }`}
                >
                  {isHackedMode ? '5 GHOST DECOY VECTORS ACTIVE' : 'AUTHORIZED POLICE TELEMETRY'}
                </span>
              </div>

              {!isHackedMode ? (
                <div className="p-4 rounded-xl bg-slate-900 border border-slate-800 space-y-2">
                  <div className="text-emerald-400 font-bold flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>SECURE SINGLE-VEHICLE TRANSIT (AUTHORIZED)</span>
                  </div>
                  <div className="text-[11px] text-slate-400 space-y-1">
                    <p>• Evidence: #EV-2026-089 (Seized Firearms)</p>
                    <p>• Real Coordinates: 23.8103° N, 90.4125° E (Dhaka HQ)</p>
                    <p>• Officer IP: 10.244.0.8 [Private Police VPN • Untraceable Outside]</p>
                    <p>• Speed: 42 km/h • Geofence: 500m Active</p>
                  </div>
                </div>
              ) : (
                <div className="space-y-2">
                  <div className="p-3 rounded-xl bg-red-950/60 border border-red-700/50 text-red-300 space-y-1">
                    <div className="font-bold flex items-center gap-2 text-xs text-red-200">
                      <ShieldAlert className="w-4 h-4 text-red-400 animate-bounce" />
                      <span>INTRUSION ATTEMPT BLOCKED • REAL IP MASKED</span>
                    </div>
                    <p className="text-[10px] text-red-300">
                      Real police location is 100% encrypted in vault. Adversary is being fed 5 simultaneously scattering fake locations:
                    </p>
                  </div>

                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {decoyCities.map((city, idx) => {
                      const dynamicLat = (city.baseLat + (Math.sin(tick + idx) * 0.04)).toFixed(4)
                      const dynamicLng = (city.baseLng + (Math.cos(tick + idx) * 0.04)).toFixed(4)
                      return (
                        <div
                          key={city.name}
                          className="p-2 rounded-lg bg-slate-900 border border-red-900/40 flex items-center justify-between text-[11px]"
                        >
                          <span className="font-bold text-red-400">
                            Decoy #{idx + 1} ({city.name})
                          </span>
                          <span className="text-slate-400 font-mono">
                            {dynamicLat}° N, {dynamicLng}° E • {city.speed}
                          </span>
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right: Security Terminal Logs */}
            <div className="p-5 rounded-2xl bg-[#090D16] text-slate-300 font-mono text-xs space-y-3 border border-slate-800">
              <div className="flex items-center justify-between pb-2 border-b border-slate-800">
                <span className="font-bold text-blue-400 flex items-center gap-2">
                  <Terminal className="w-4 h-4" />
                  <span>IMMUTABLE SECURITY ENGINE LOGS</span>
                </span>
                <span className="text-[10px] text-slate-500">PORT 443 • ZERO LEAKAGE</span>
              </div>

              <div className="space-y-2 text-[11px] leading-relaxed text-slate-400">
                <p className="text-emerald-400">[00:00:01] System initialized in Zero-Trust Stealth Mode.</p>
                <p className="text-slate-400">[00:00:02] robots.txt: Search engine crawlers disallowed on all forensic routes.</p>
                <p className="text-slate-400">[00:00:03] Public self-registration: DISABLED (Token-Gated only).</p>

                {isHackedMode && (
                  <>
                    <p className="text-red-400 animate-pulse font-bold">
                      [00:00:14] ⚠️ ALERT: Unauthorized telemetry probe from External IP: 198.51.100.77
                    </p>
                    <p className="text-amber-400">
                      [00:00:14] 🛡️ IP Stripped: Officer physical device IP remains invisible behind edge proxy.
                    </p>
                    <p className="text-blue-400">
                      [00:00:15] 📡 Honeypot Triggered: Emitting 5 synthetic multi-point decoy vectors across Bangladesh.
                    </p>
                    <p className="text-purple-400">
                      [00:00:16] 📜 Security Incident SHA-256 written to PostgreSQL immutable audit ledger.
                    </p>
                    <p className="text-emerald-400 font-bold">
                      [00:00:17] ✓ RESULT: Adversary tracking failed. True evidence location 100% confidential.
                    </p>
                  </>
                )}
              </div>
            </div>
          </div>
        </section>

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

        {/* Responsible Disclosure */}
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
