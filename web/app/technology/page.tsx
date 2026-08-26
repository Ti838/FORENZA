import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import { Cpu, Database, Server, Smartphone, Lock, Map, Layers, CheckCircle2 } from 'lucide-react'

export default function TechnologyPage() {
  const stack = [
    {
      category: 'Frontend & Desktop Workstation',
      tech: 'Next.js 16 • React 19 • TypeScript • Tailwind CSS • Tauri 2.x (Rust Core)',
      desc: 'High-performance React server components with zero-flash dynamic theme management and cross-platform desktop compilation for Windows, macOS, and Linux.',
      icon: Cpu,
    },
    {
      category: 'Mobile Field Client',
      tech: 'Flutter 3.x • Pure Dart Crypto • SQLite Local Vault • Geolocator',
      desc: 'Native Android and iOS mobile application with hardware camera integration, real-time GPS geofence radar, and offline-first AES-256 local encrypted storage.',
      icon: Smartphone,
    },
    {
      category: 'Database & Private Storage',
      tech: 'PostgreSQL 15.0+ • Supabase Auth • PostGIS • Row Level Security (RLS)',
      desc: 'Enterprise relational database with 17 migrations, strict foreign key constraints, append-only audit triggers, and S3-compatible private object storage.',
      icon: Database,
    },
    {
      category: 'AI Forensic Subsystem',
      tech: 'Google Gemini API (gemini-2.0-flash) • Structured Output Schema',
      desc: 'Server-side vision and multimodal AI analyzing evidence images and cross-referencing officer field descriptions with laboratory findings.',
      icon: Server,
    },
    {
      category: 'Cryptographic Subsystem',
      tech: 'W3C SubtleCrypto • Node.js Crypto • Pure Dart Crypto • SHA-256',
      desc: 'Deterministic master evidence hashing ($H = \text{SHA256}(\text{Media} + \text{Meta})$) and genesis-anchored recursive custody hash chain calculation.',
      icon: Lock,
    },
    {
      category: 'Spatial Mapping & Dossier Engine',
      tech: 'MapTiler Vector Tiles • Leaflet / MapLibre • jsPDF Dossier Streamer',
      desc: 'High-resolution satellite mapping HUD with real-time route rendering and automated Rule 902(14) Certified Court Dossier PDF streaming.',
      icon: Map,
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="space-y-4 text-center max-w-3xl mx-auto">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <Layers className="w-3.5 h-3.5" />
            <span>AUTHORITATIVE TECHNOLOGY STACK</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Engineered for Cryptographic Certainty
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed">
            Every component in the FORENZA architecture is selected for deterministic reproducibility, low-latency execution, and zero-trust security.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {stack.map((item) => {
            const Icon = item.icon
            return (
              <div
                key={item.category}
                className="p-6 sm:p-8 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-sm space-y-3"
              >
                <div className="p-3 w-fit rounded-2xl bg-blue-50 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                  <Icon className="w-5 h-5" />
                </div>
                <h3 className="font-bold text-base text-slate-900 dark:text-white">{item.category}</h3>
                <p className="text-xs font-mono text-blue-600 dark:text-blue-400 font-bold">{item.tech}</p>
                <p className="text-xs text-slate-600 dark:text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            )
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
