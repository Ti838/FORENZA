'use client'

import { useEffect, useState, useRef } from 'react'
import QRCode from 'qrcode'
import { ForenzaLogo } from '@/components/brand/ForenzaLogo'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { QrCode, Download, Printer, ShieldCheck } from 'lucide-react'
import { toast } from 'sonner'

interface QRCardProps {
  evidenceNumber: string
  evidenceId: string
  qrToken: string
  status?: string
  caseNumber?: string
  expiresAt?: string
  className?: string
}

export function QRCard({
  evidenceNumber,
  evidenceId,
  qrToken,
  status = 'SEALED',
  caseNumber,
  expiresAt,
  className = '',
}: QRCardProps) {
  const [dataUrl, setDataUrl] = useState<string | null>(null)
  const printRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!qrToken) return

    // Generate high-resolution QR with crisp borders
    QRCode.toDataURL(qrToken, {
      width: 400,
      margin: 2,
      color: {
        dark: '#0F172A',
        light: '#FFFFFF',
      },
      errorCorrectionLevel: 'H',
    })
      .then((url) => setDataUrl(url))
      .catch((err) => console.error('Failed to generate QR code:', err))
  }, [qrToken])

  const handleDownload = () => {
    if (!dataUrl) return
    const a = document.createElement('a')
    a.href = dataUrl
    a.download = `FORENZA_QR_${evidenceNumber}.png`
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    toast.success(`QR Badge for ${evidenceNumber} downloaded`)
  }

  const handlePrint = () => {
    window.print()
  }

  return (
    <div
      className={`forenza-card p-5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-md max-w-sm mx-auto ${className}`}
    >
      {/* Printable Badge Body */}
      <div
        ref={printRef}
        className="p-4 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 flex flex-col items-center text-center select-none"
      >
        {/* Brand header */}
        <div className="flex items-center justify-between w-full pb-3 border-b border-slate-200 dark:border-slate-800">
          <ForenzaLogo size="sm" showTagline={false} />
          <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/60 px-2 py-0.5 rounded">
            EVIDENCE ID
          </span>
        </div>

        {/* QR Display */}
        <div className="my-4 p-3 bg-white rounded-xl shadow-inner border border-slate-200 flex items-center justify-center">
          {dataUrl ? (
            <img
              src={dataUrl}
              alt={`FORENZA QR Token for ${evidenceNumber}`}
              className="w-48 h-48 object-contain"
            />
          ) : (
            <div className="w-48 h-48 flex flex-col items-center justify-center text-slate-400 gap-2">
              <QrCode className="w-8 h-8 animate-pulse text-blue-500" />
              <span className="text-xs">Generating Forensic QR...</span>
            </div>
          )}
        </div>

        {/* Evidence Metadata */}
        <div className="w-full space-y-1.5 text-center">
          <h3 className="font-mono text-base font-extrabold text-slate-900 dark:text-slate-100 tracking-tight">
            {evidenceNumber}
          </h3>
          {caseNumber && (
            <p className="text-xs text-slate-600 dark:text-slate-400 font-mono">
              CASE: <span className="font-bold text-slate-800 dark:text-slate-200">{caseNumber}</span>
            </p>
          )}
          <div className="pt-1 flex justify-center">
            <StatusBadge status={status} size="sm" />
          </div>
        </div>

        {/* Verification notice */}
        <div className="mt-3 pt-2.5 border-t border-slate-200 dark:border-slate-800/80 w-full flex items-center justify-center gap-1 text-[10px] text-slate-500 dark:text-slate-400 font-mono">
          <ShieldCheck className="w-3 h-3 text-emerald-500" />
          <span>CRYPTOGRAPHICALLY SIGNED JWT TOKEN</span>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="grid grid-cols-2 gap-2 mt-4">
        <button
          type="button"
          onClick={handleDownload}
          disabled={!dataUrl}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Save PNG</span>
        </button>
        <button
          type="button"
          onClick={handlePrint}
          disabled={!dataUrl}
          className="inline-flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold bg-blue-600 hover:bg-blue-700 text-white transition-colors shadow-sm disabled:opacity-50"
        >
          <Printer className="w-3.5 h-3.5" />
          <span>Print Badge</span>
        </button>
      </div>
    </div>
  )
}
