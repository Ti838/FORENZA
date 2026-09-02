'use client'

import Link from 'next/link'
import { StatusBadge } from '@/components/ui/StatusBadge'
import {
  Sparkles,
  UserCheck,
  ShieldCheck,
  ShieldAlert,
  ArrowRight,
  Camera,
  Layers,
  Fingerprint,
} from 'lucide-react'
import { Evidence } from '@/types'

interface EvidenceCardProps {
  evidence: Evidence | any
  href?: string
  onVerify?: (e: React.MouseEvent) => void
  className?: string
}

export function EvidenceCard({
  evidence,
  href,
  onVerify,
  className = '',
}: EvidenceCardProps) {
  const classification = evidence.classification
  const isOverride = classification?.classification_method === 'MANUAL_OVERRIDE'
  const isAiConfirmed = classification?.classification_method === 'AI_CONFIRMED'
  const primaryMedia = evidence.primary_media

  const cardContent = (
    <div
      className={`forenza-card p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-blue-400 dark:hover:border-blue-600/60 transition-all duration-200 group shadow-sm flex flex-col justify-between ${className}`}
    >
      {/* Top Bar: Evidence ID + Status */}
      <div>
        <div className="flex items-start justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-lg bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 group-hover:scale-105 transition-transform">
              <Fingerprint className="w-4 h-4" />
            </div>
            <div>
              <span className="font-mono text-sm font-extrabold text-slate-900 dark:text-slate-100 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition-colors">
                {evidence.evidence_number}
              </span>
              {evidence.case?.case_number && (
                <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
                  CASE: {evidence.case.case_number}
                </p>
              )}
            </div>
          </div>

          <StatusBadge status={evidence.status} size="sm" />
        </div>

        {/* Media Thumbnail & Classification Breakdown */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 my-3">
          {/* Media / Icon box */}
          <div className="sm:col-span-1 h-24 rounded-lg bg-slate-100 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 flex items-center justify-center overflow-hidden relative">
            {primaryMedia?.signed_url || primaryMedia?.storage_path ? (
              <img
                src={primaryMedia.signed_url || '/placeholder-evidence.jpg'}
                alt={evidence.evidence_number}
                className="w-full h-full object-cover"
                onError={(e) => {
                  // Fallback to placeholder icon
                  e.currentTarget.style.display = 'none'
                }}
              />
            ) : (
              <div className="flex flex-col items-center gap-1 text-slate-400">
                <Camera className="w-6 h-6" />
                <span className="text-[10px] font-medium">No Media</span>
              </div>
            )}
            <span className="absolute bottom-1 right-1 px-1.5 py-0.5 rounded bg-black/70 text-[9px] font-mono text-white">
              {primaryMedia?.media_type || 'PHOTO'}
            </span>
          </div>

          {/* AI vs Human Classification */}
          <div className="sm:col-span-2 space-y-2 text-xs">
            {/* AI Classification Block */}
            <div className="p-2 rounded-md bg-slate-50 dark:bg-slate-900/70 border border-slate-200/60 dark:border-slate-800/80">
              <div className="flex items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 mb-0.5">
                <span className="flex items-center gap-1 font-semibold">
                  <Sparkles className="w-3 h-3 text-purple-500" />
                  AI Model Suggestion
                </span>
                {classification?.ai_confidence && (
                  <span className="font-mono font-bold text-purple-600 dark:text-purple-400">
                    {(classification.ai_confidence * 100).toFixed(1)}%
                  </span>
                )}
              </div>
              <p className="font-medium text-slate-800 dark:text-slate-200 truncate">
                {classification?.ai_category
                  ? `${classification.ai_category} ${
                      classification.ai_object ? `→ ${classification.ai_object}` : ''
                    }`
                  : 'Pending AI Inference'}
              </p>
            </div>

            {/* Final Human Decision Block */}
            <div
              className={`p-2 rounded-md border ${
                isOverride
                  ? 'bg-amber-50/60 dark:bg-amber-950/30 border-amber-300 dark:border-amber-800'
                  : 'bg-blue-50/60 dark:bg-blue-950/30 border-blue-200 dark:border-blue-800'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] mb-0.5">
                <span className="flex items-center gap-1 font-semibold text-slate-700 dark:text-slate-300">
                  <UserCheck className="w-3 h-3 text-blue-500" />
                  Final Classification
                </span>
                {isOverride && (
                  <span className="px-1.5 py-0.2 rounded text-[10px] font-extrabold uppercase bg-amber-200 dark:bg-amber-900 text-amber-800 dark:text-amber-200">
                    OVERRIDE
                  </span>
                )}
                {isAiConfirmed && (
                  <span className="text-[10px] font-medium text-emerald-600 dark:text-emerald-400">
                    AI Confirmed
                  </span>
                )}
              </div>
              <p className="font-bold text-slate-900 dark:text-slate-100 truncate">
                {classification?.final_category || 'Unclassified'}
                {classification?.final_object ? ` • ${classification.final_object}` : ''}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer: Holder & Integrity Badge */}
      <div className="pt-3 mt-2 border-t border-slate-100 dark:border-slate-800/80 flex items-center justify-between text-xs">
        <div className="flex items-center gap-1.5 text-slate-600 dark:text-slate-400 truncate">
          <Layers className="w-3.5 h-3.5 shrink-0 text-slate-400" />
          <span className="truncate">
            Holder:{' '}
            <strong className="text-slate-800 dark:text-slate-200 font-semibold">
              {evidence.current_holder?.full_name || 'Assigned Custodian'}
            </strong>
          </span>
        </div>

        <div className="flex items-center gap-2">
          {evidence.master_hash ? (
            <span className="badge-verified">
              <ShieldCheck className="w-3 h-3" />
              Verified
            </span>
          ) : (
            <span className="badge-warning">Unsealed</span>
          )}

          <div className="p-1 rounded-full text-slate-400 group-hover:text-blue-500 group-hover:translate-x-0.5 transition-all">
            <ArrowRight className="w-4 h-4" />
          </div>
        </div>
      </div>
    </div>
  )

  if (href) {
    return <Link href={href} className="block">{cardContent}</Link>
  }

  return cardContent
}
