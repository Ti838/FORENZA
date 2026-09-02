'use client'

import {
  ShieldCheck,
  ShieldAlert,
  Clock,
  CheckCircle2,
  AlertTriangle,
  Truck,
  Building2,
  FlaskConical,
  Gavel,
  Archive,
  Lock,
} from 'lucide-react'
import { EvidenceStatus } from '@/types'

interface StatusBadgeProps {
  status: EvidenceStatus | string
  size?: 'sm' | 'md'
  showIcon?: boolean
  className?: string
}

export function StatusBadge({
  status,
  size = 'sm',
  showIcon = true,
  className = '',
}: StatusBadgeProps) {
  const normalized = (status || '').toUpperCase()

  const config: Record<
    string,
    { label: string; bg: string; text: string; border: string; icon: any }
  > = {
    REGISTERED: {
      label: 'Registered',
      bg: 'bg-slate-100 dark:bg-slate-800',
      text: 'text-slate-700 dark:text-slate-300',
      border: 'border-slate-300 dark:border-slate-700',
      icon: Clock,
    },
    CAPTURED: {
      label: 'Captured (Unsealed)',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Clock,
    },
    SEALED: {
      label: 'Sealed & Secured',
      bg: 'bg-indigo-50 dark:bg-indigo-950/40',
      text: 'text-indigo-700 dark:text-indigo-300',
      border: 'border-indigo-200 dark:border-indigo-800',
      icon: Lock,
    },
    IN_TRANSIT: {
      label: 'In Transit',
      bg: 'bg-amber-50 dark:bg-amber-950/40',
      text: 'text-amber-700 dark:text-amber-300',
      border: 'border-amber-200 dark:border-amber-800',
      icon: Truck,
    },
    TRANSFERRED: {
      label: 'Transferred',
      bg: 'bg-sky-50 dark:bg-sky-950/40',
      text: 'text-sky-700 dark:text-sky-300',
      border: 'border-sky-200 dark:border-sky-800',
      icon: CheckCircle2,
    },
    VAULT_STORED: {
      label: 'Vault Stored',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: Building2,
    },
    LAB_RECEIVED: {
      label: 'Lab Received',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      icon: FlaskConical,
    },
    UNDER_ANALYSIS: {
      label: 'Under Analysis',
      bg: 'bg-purple-50 dark:bg-purple-950/40',
      text: 'text-purple-700 dark:text-purple-300',
      border: 'border-purple-200 dark:border-purple-800',
      icon: FlaskConical,
    },
    ANALYSIS_COMPLETED: {
      label: 'Analysis Complete',
      bg: 'bg-teal-50 dark:bg-teal-950/40',
      text: 'text-teal-700 dark:text-teal-300',
      border: 'border-teal-200 dark:border-teal-800',
      icon: CheckCircle2,
    },
    COURT_SUBMITTED: {
      label: 'Court Submitted',
      bg: 'bg-blue-50 dark:bg-blue-950/40',
      text: 'text-blue-700 dark:text-blue-300',
      border: 'border-blue-200 dark:border-blue-800',
      icon: Gavel,
    },
    ARCHIVED: {
      label: 'Archived',
      bg: 'bg-slate-100 dark:bg-slate-900',
      text: 'text-slate-500 dark:text-slate-400',
      border: 'border-slate-300 dark:border-slate-800',
      icon: Archive,
    },
    INTEGRITY_VERIFIED: {
      label: 'Integrity Verified',
      bg: 'bg-emerald-50 dark:bg-emerald-950/40',
      text: 'text-emerald-700 dark:text-emerald-300',
      border: 'border-emerald-200 dark:border-emerald-800',
      icon: ShieldCheck,
    },
    COMPROMISED_TAMPERED: {
      label: 'Compromised / Tampered',
      bg: 'bg-red-50 dark:bg-red-950/50',
      text: 'text-red-700 dark:text-red-300',
      border: 'border-red-300 dark:border-red-800',
      icon: ShieldAlert,
    },
  }

  const current = config[normalized] || {
    label: normalized.replace(/_/g, ' '),
    bg: 'bg-slate-100 dark:bg-slate-800',
    text: 'text-slate-700 dark:text-slate-300',
    border: 'border-slate-300 dark:border-slate-700',
    icon: Clock,
  }

  const IconComponent = current.icon
  const sizeStyles =
    size === 'sm' ? 'text-[11px] px-2.5 py-0.5 gap-1.5' : 'text-xs px-3 py-1 gap-2'

  return (
    <span
      className={`inline-flex items-center font-semibold rounded-full border ${current.bg} ${current.text} ${current.border} ${sizeStyles} ${className} select-none`}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3 h-3' : 'w-3.5 h-3.5'} />}
      <span>{current.label}</span>
    </span>
  )
}
