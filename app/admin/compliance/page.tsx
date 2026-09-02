'use client'

import { useState } from 'react'
import { AppShell } from '@/components/layout/AppShell'
import { JURISDICTIONS, JurisdictionCode, ComplianceEngine } from '@/lib/compliance'
import {
  ShieldCheck,
  Scale,
  FileCheck,
  AlertTriangle,
  CheckCircle2,
  Lock,
  Globe,
  Info,
  Layers,
  Cpu,
  BookOpen,
} from 'lucide-react'

export default function ComplianceDashboardPage() {
  const [selectedJurisdiction, setSelectedJurisdiction] = useState<JurisdictionCode>('BANGLADESH')
  const jurisdiction = JURISDICTIONS[selectedJurisdiction]
  const complianceMatrix = ComplianceEngine.getComplianceMatrix()

  return (
    <AppShell
      role="ADMIN"
      title="Compliance, Ethics & International Standards Desk"
      breadcrumbs={[
        { label: 'Admin Hub', href: '/admin/dashboard' },
        { label: 'Compliance & Standards' },
      ]}
    >
      <div className="space-y-6 max-w-7xl mx-auto">
        {/* Compliance Notice Banner */}
        <div className="p-5 rounded-2xl bg-blue-950/30 border border-blue-800/40 flex items-start gap-4">
          <Info className="w-5 h-5 text-blue-400 shrink-0 mt-0.5" />
          <div className="space-y-1">
            <h4 className="font-bold text-sm text-blue-200 font-mono">
              STANDARDS & JURISDICTIONAL COMPLIANCE ARCHITECTURE
            </h4>
            <p className="text-xs text-slate-300 leading-relaxed">
              FORENZA is designed with reference to internationally recognized digital-evidence and information-security practices (including ISO/IEC 27037, ISO/IEC 27038, and NIST SP 800-86). Legal admissibility is jurisdiction-dependent and determined by the competent judicial authority.
            </p>
          </div>
        </div>

        {/* Jurisdiction Selector Bar */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-2 text-xs font-mono font-bold text-slate-500 uppercase">
              <Globe className="w-4 h-4 text-blue-500" />
              <span>ACTIVE LEGAL JURISDICTION ENGINE</span>
            </div>
            <h3 className="text-base font-bold text-slate-900 dark:text-slate-100">
              {jurisdiction.name}
            </h3>
            <p className="text-xs text-slate-500 font-mono">
              Statutory Basis: {jurisdiction.statutoryBasis} • Default Retention: {jurisdiction.defaultRetentionYears} Years
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {(Object.keys(JURISDICTIONS) as JurisdictionCode[]).map((code) => (
              <button
                key={code}
                onClick={() => setSelectedJurisdiction(code)}
                className={`px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition-all border ${
                  selectedJurisdiction === code
                    ? 'bg-blue-600 border-blue-500 text-white shadow-md shadow-blue-600/30'
                    : 'bg-slate-100 dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {code}
              </button>
            ))}
          </div>
        </div>

        {/* Compliance Controls Matrix */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-mono font-bold text-slate-400 uppercase flex items-center gap-2">
              <Layers className="w-4 h-4 text-emerald-400" />
              <span>TECHNICAL COMPLIANCE & GOVERNANCE MATRIX ({complianceMatrix.length} CONTROLS)</span>
            </h3>
            <span className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3.5 h-3.5" />
              <span>ALL TECHNICAL CONTROLS VERIFIED IN SOFTWARE</span>
            </span>
          </div>

          <div className="grid grid-cols-1 gap-3">
            {complianceMatrix.map((ctrl) => (
              <div
                key={ctrl.id}
                className="p-5 rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 flex flex-col md:flex-row md:items-start justify-between gap-4"
              >
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <span className="px-2 py-0.5 rounded text-[10px] font-mono font-bold bg-blue-500/10 text-blue-400 border border-blue-500/20">
                      {ctrl.id}
                    </span>
                    <h4 className="font-bold text-sm text-slate-900 dark:text-slate-100">
                      {ctrl.name}
                    </h4>
                    <span className="text-xs font-mono text-slate-500">
                      [{ctrl.standard}]
                    </span>
                  </div>

                  <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed">
                    {ctrl.description}
                  </p>

                  <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 text-[11px] font-mono text-slate-500">
                    <span className="text-emerald-700 dark:text-emerald-400">
                      ✓ Verification: {ctrl.technicalVerification}
                    </span>
                    <span className="text-amber-700 dark:text-amber-400">
                      ⚠ Boundary: {ctrl.limitation}
                    </span>
                  </div>
                </div>

                <div className="shrink-0 flex items-center">
                  <span className="px-3 py-1 rounded-full text-xs font-mono font-bold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/30 flex items-center gap-1.5">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{ctrl.status}</span>
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Ethical AI & Legal Hold Charter Card */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="p-5 rounded-2xl bg-purple-950/20 border border-purple-800/30 space-y-2">
            <h4 className="font-bold text-sm text-purple-200 font-mono flex items-center gap-2">
              <Cpu className="w-4 h-4 text-purple-400" />
              <span>ETHICAL AI & UNCERTAINTY GOVERNANCE</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>AI is strictly an assistive recommendation tool.</li>
              <li>AI never determines guilt, criminal liability, or court admissibility.</li>
              <li>Honest qualitative confidence metrics (HIGH / MEDIUM / LOW / UNCERTAIN).</li>
              <li>Original AI output is preserved alongside mandatory human decision.</li>
              <li>No demographic, racial, religious, or discriminatory profiling inference.</li>
            </ul>
          </div>

          <div className="p-5 rounded-2xl bg-amber-950/20 border border-amber-800/30 space-y-2">
            <h4 className="font-bold text-sm text-amber-200 font-mono flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-400" />
              <span>LEGAL HOLD & ORIGINAL PRESERVATION</span>
            </h4>
            <ul className="text-xs text-slate-300 space-y-1.5 list-disc list-inside leading-relaxed">
              <li>Original evidence media bytes remain strictly immutable and read-only.</li>
              <li>Redactions and OCR create linked derived artifacts (ISO/IEC 27038).</li>
              <li>Active legal holds block ordinary deletion or disposition triggers.</li>
              <li>Dual-sign authentication enforced for all custody handovers.</li>
              <li>Append-only audit logs cannot be modified or deleted by users.</li>
            </ul>
          </div>
        </div>
      </div>
    </AppShell>
  )
}
