'use client'

import { useState } from 'react'
import { Copy, Check, ShieldCheck, ShieldAlert, RefreshCw, KeyRound } from 'lucide-react'
import { toast } from 'sonner'

interface HashCardProps {
  hash: string | null
  title?: string
  algorithm?: string
  status?: 'VERIFIED' | 'FAILED' | 'UNSEALED'
  onVerify?: () => Promise<void>
  isVerifying?: boolean
  className?: string
  subtitle?: string
}

export function HashCard({
  hash,
  title = 'SHA-256 INTEGRITY SEAL',
  algorithm = 'SHA-256 / Web Crypto API',
  status = 'VERIFIED',
  onVerify,
  isVerifying = false,
  className = '',
  subtitle,
}: HashCardProps) {
  const [copied, setCopied] = useState(false)

  const handleCopy = () => {
    if (!hash) return
    navigator.clipboard.writeText(hash)
    setCopied(true)
    toast.success('Cryptographic SHA-256 hash copied to clipboard')
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div
      className={`forenza-card p-4 sm:p-5 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-sm ${className}`}
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 pb-3 mb-3 border-b border-slate-100 dark:border-slate-800/80">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <KeyRound className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              {title}
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">{subtitle || algorithm}</p>
          </div>
        </div>

        {/* Verification Status Badge */}
        {hash ? (
          status === 'VERIFIED' ? (
            <span className="badge-verified">
              <ShieldCheck className="w-3.5 h-3.5" />
              INTEGRITY VERIFIED
            </span>
          ) : status === 'FAILED' ? (
            <span className="badge-compromised">
              <ShieldAlert className="w-3.5 h-3.5" />
              COMPROMISED / TAMPERED
            </span>
          ) : (
            <span className="badge-warning">PENDING SEAL</span>
          )
        ) : (
          <span className="badge-warning">UNSEALED</span>
        )}
      </div>

      {/* Monospace Hash Box */}
      <div className="relative group">
        <div className="p-3 rounded-lg bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 font-mono text-xs sm:text-[13px] text-slate-800 dark:text-slate-200 break-all select-all leading-relaxed">
          {hash ? (
            <span>{hash}</span>
          ) : (
            <span className="text-slate-400 italic font-sans text-xs">
              Evidence has not yet been sealed with a cryptographic master hash.
            </span>
          )}
        </div>
      </div>

      {/* Footer Actions */}
      {hash && (
        <div className="flex items-center justify-between gap-3 mt-3 pt-2">
          <button
            type="button"
            onClick={handleCopy}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors"
          >
            {copied ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-500" />
                <span>Copied</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Hash</span>
              </>
            )}
          </button>

          {onVerify && (
            <button
              type="button"
              onClick={onVerify}
              disabled={isVerifying}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md text-xs font-medium bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/60 dark:hover:bg-blue-900/60 text-blue-600 dark:text-blue-400 border border-blue-200 dark:border-blue-800 transition-colors disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${isVerifying ? 'animate-spin' : ''}`} />
              <span>{isVerifying ? 'Verifying Integrity...' : 'Verify Cryptographic Hash'}</span>
            </button>
          )}
        </div>
      )}
    </div>
  )
}
