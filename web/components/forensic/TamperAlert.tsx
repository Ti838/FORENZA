'use client'

import { ShieldAlert, AlertTriangle, ArrowRight, ExternalLink } from 'lucide-react'
import Link from 'next/link'

interface TamperAlertProps {
  evidenceNumber?: string
  evidenceId: string
  brokenEventId?: string | null
  brokenAtIndex?: number | null
  expectedHash?: string | null
  calculatedHash?: string | null
  failureReason?: string | null
  detectedAt?: string
  onViewRecord?: () => void
  className?: string
}

export function TamperAlert({
  evidenceNumber = 'EVIDENCE ITEM',
  evidenceId,
  brokenEventId,
  brokenAtIndex,
  expectedHash,
  calculatedHash,
  failureReason = 'Cryptographic hash mismatch in custody chain sequence. Chain integrity has been broken.',
  detectedAt = new Date().toISOString(),
  onViewRecord,
  className = '',
}: TamperAlertProps) {
  return (
    <div
      role="alert"
      className={`rounded-xl border-2 border-red-500/80 bg-red-50/90 dark:bg-red-950/40 p-5 shadow-lg shadow-red-500/10 text-slate-900 dark:text-slate-100 ${className}`}
    >
      {/* Header */}
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-lg bg-red-600 text-white shadow-md shadow-red-600/30 shrink-0 mt-0.5">
            <ShieldAlert className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="px-2 py-0.5 rounded text-[11px] font-extrabold uppercase bg-red-600 text-white tracking-wider">
                CRITICAL SECURITY BREACH
              </span>
              <span className="text-xs text-red-600 dark:text-red-400 font-medium">
                Detected: {new Date(detectedAt).toLocaleString()}
              </span>
            </div>
            <h3 className="text-lg font-bold text-red-700 dark:text-red-300 mt-1">
              COMPROMISED / TAMPERED INTEGRITY
            </h3>
            <p className="text-xs text-red-600/90 dark:text-red-300/80 mt-0.5">
              The cryptographic chain of custody for evidence{' '}
              <strong className="font-mono text-red-800 dark:text-red-200">
                {evidenceNumber}
              </strong>{' '}
              has failed mathematical verification.
            </p>
          </div>
        </div>
      </div>

      {/* Details Box */}
      <div className="mt-4 p-4 rounded-lg bg-white/80 dark:bg-[#0B0F19]/90 border border-red-200 dark:border-red-900/60 space-y-2.5 text-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              Affected Evidence:
            </span>
            <span className="font-mono font-bold text-slate-900 dark:text-slate-100">
              {evidenceNumber} ({evidenceId.slice(0, 8)}...)
            </span>
          </div>
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              Broken Event Sequence:
            </span>
            <span className="font-semibold text-red-600 dark:text-red-400">
              {brokenAtIndex !== null && brokenAtIndex !== undefined
                ? `Custody Log #${brokenAtIndex + 1}`
                : 'Custody Chain Node'}
            </span>
          </div>
        </div>

        <div>
          <span className="text-slate-500 dark:text-slate-400 font-medium block">
            Verification Diagnostic:
          </span>
          <p className="text-red-700 dark:text-red-300 font-medium mt-0.5">{failureReason}</p>
        </div>

        {expectedHash && (
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              Expected Mathematical Hash:
            </span>
            <code className="block p-1.5 rounded bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-emerald-700 dark:text-emerald-400 break-all">
              {expectedHash}
            </code>
          </div>
        )}

        {calculatedHash && (
          <div>
            <span className="text-slate-500 dark:text-slate-400 font-medium block">
              Actual Altered Record Hash:
            </span>
            <code className="block p-1.5 rounded bg-slate-100 dark:bg-slate-900 text-[11px] font-mono text-red-700 dark:text-red-400 break-all">
              {calculatedHash}
            </code>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="mt-4 flex items-center justify-between flex-wrap gap-2 pt-2 border-t border-red-200/60 dark:border-red-900/40">
        <div className="flex items-center gap-1.5 text-xs text-red-600 dark:text-red-400">
          <AlertTriangle className="w-4 h-4 shrink-0" />
          <span>Judicial notice: This evidence must be marked as contested under rule 901.</span>
        </div>

        {onViewRecord ? (
          <button
            type="button"
            onClick={onViewRecord}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <span>View Affected Custody Event</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        ) : (
          <Link
            href={`/judge/evidence/${evidenceId}`}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white text-xs font-bold transition-colors shadow-sm"
          >
            <span>Inspect Custody Audit Log</span>
            <ExternalLink className="w-3.5 h-3.5" />
          </Link>
        )}
      </div>
    </div>
  )
}
