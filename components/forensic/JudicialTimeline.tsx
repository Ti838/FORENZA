'use client'

import {
  ShieldCheck,
  ShieldAlert,
  Camera,
  Sparkles,
  UserCheck,
  Lock,
  ArrowRightLeft,
  Truck,
  Building2,
  FlaskConical,
  FileCheck,
  Gavel,
  Clock,
  MapPin,
  User,
  Key,
} from 'lucide-react'
import { EvidenceEvent, CustodyLog, EvidenceEventType } from '@/types'

interface JudicialTimelineProps {
  events: (EvidenceEvent | CustodyLog | any)[]
  isCompromised?: boolean
  brokenEventId?: string | null
  className?: string
}

export function JudicialTimeline({
  events = [],
  isCompromised = false,
  brokenEventId = null,
  className = '',
}: JudicialTimelineProps) {
  const getEventConfig = (type: string) => {
    switch (type) {
      case 'REGISTERED':
        return { label: 'Evidence Item Registered', icon: Clock, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' }
      case 'CAPTURED':
        return { label: 'Field Evidence Captured & Geotagged', icon: Camera, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' }
      case 'CLASSIFIED_AI':
        return { label: 'AI Classification Inferred', icon: Sparkles, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' }
      case 'CLASSIFIED_MANUAL':
        return { label: 'Human Classification Confirmed', icon: UserCheck, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' }
      case 'SEALED':
        return { label: 'Cryptographic SHA-256 Master Seal Applied', icon: Lock, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' }
      case 'TRANSFER_INITIATED':
        return { label: 'Custody Handover Token Generated', icon: Key, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' }
      case 'TRANSFER_COMPLETED':
      case 'RECEIVED':
      case 'TRANSFERRED':
        return { label: 'Custody Handover Completed & Chain Extended', icon: ArrowRightLeft, color: 'text-sky-500 bg-sky-50 dark:bg-sky-950/60' }
      case 'TRANSIT_STARTED':
      case 'TRANSIT_STOPPED':
        return { label: 'Transit Telemetry Monitored', icon: Truck, color: 'text-amber-500 bg-amber-50 dark:bg-amber-950/60' }
      case 'VAULT_STORED':
        return { label: 'Vault Facility Secured & Location Indexed', icon: Building2, color: 'text-emerald-500 bg-emerald-50 dark:bg-emerald-950/60' }
      case 'LAB_RECEIVED':
        return { label: 'Forensic Lab Intake Registered', icon: FlaskConical, color: 'text-purple-500 bg-purple-50 dark:bg-purple-950/60' }
      case 'ANALYSIS_COMPLETED':
        return { label: 'Scientific Analysis Completed', icon: FlaskConical, color: 'text-teal-500 bg-teal-50 dark:bg-teal-950/60' }
      case 'REPORT_UPLOADED':
        return { label: 'Forensic Report Uploaded & Sealed', icon: FileCheck, color: 'text-blue-500 bg-blue-50 dark:bg-blue-950/60' }
      case 'COURT_SUBMITTED':
        return { label: 'Judicial Evidence Package Submitted', icon: Gavel, color: 'text-indigo-500 bg-indigo-50 dark:bg-indigo-950/60' }
      default:
        return { label: type.replace(/_/g, ' '), icon: ShieldCheck, color: 'text-slate-500 bg-slate-100 dark:bg-slate-800' }
    }
  }

  if (!events || events.length === 0) {
    return (
      <div className="p-8 rounded-xl border border-dashed border-slate-300 dark:border-slate-800 text-center text-slate-400">
        <Clock className="w-8 h-8 mx-auto mb-2 opacity-50" />
        <p className="text-sm font-medium">No custody events recorded yet.</p>
      </div>
    )
  }

  return (
    <div className={`relative pl-6 space-y-6 sm:space-y-8 before:absolute before:left-3 before:top-3 before:bottom-3 before:w-0.5 before:bg-slate-200 dark:before:bg-slate-800 ${className}`}>
      {events.map((event, index) => {
        const eventType = event.event_type || event.action || 'EVENT'
        const config = getEventConfig(eventType)
        const Icon = config.icon
        const isBroken = brokenEventId === event.id

        return (
          <div key={event.id || index} className="relative group">
            {/* Timeline Node Icon */}
            <div
              className={`absolute -left-[30px] top-0.5 w-7 h-7 rounded-full flex items-center justify-center border-2 ${
                isBroken
                  ? 'border-red-500 bg-red-100 dark:bg-red-950 text-red-600 animate-bounce shadow-md shadow-red-500/20'
                  : 'border-white dark:border-[#0B0F19] bg-white dark:bg-[#111827] shadow-sm'
              }`}
            >
              <Icon className={`w-3.5 h-3.5 ${isBroken ? 'text-red-600' : 'text-slate-600 dark:text-slate-300'}`} />
            </div>

            {/* Event Content Card */}
            <div
              className={`p-4 rounded-xl border transition-all ${
                isBroken
                  ? 'border-red-500 bg-red-50/80 dark:bg-red-950/40 shadow-md shadow-red-500/10'
                  : 'border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] hover:border-slate-300 dark:hover:border-slate-700 shadow-xs'
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 pb-2 mb-2 border-b border-slate-100 dark:border-slate-800/80">
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-slate-100">
                    {config.label}
                  </h4>
                  {isBroken ? (
                    <span className="badge-compromised">TAMPERED NODE</span>
                  ) : (
                    <span className="badge-verified">CHAIN INTACT</span>
                  )}
                </div>

                <span className="text-xs font-mono text-slate-500 dark:text-slate-400">
                  {new Date(event.created_at || event.timestamp || Date.now()).toLocaleString('en-US', {
                    dateStyle: 'medium',
                    timeStyle: 'medium',
                  })}
                </span>
              </div>

              {/* Event Metadata details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-slate-600 dark:text-slate-400 mt-2">
                {/* Actor */}
                <div className="flex items-center gap-1.5 truncate">
                  <User className="w-3.5 h-3.5 shrink-0 text-slate-400" />
                  <span className="truncate">
                    Actor:{' '}
                    <strong className="text-slate-800 dark:text-slate-200 font-semibold">
                      {event.actor?.full_name ||
                        event.receiver?.full_name ||
                        event.sender?.full_name ||
                        'Authorized Personnel'}
                    </strong>
                    {event.actor?.badge_number && ` (Badge #${event.actor.badge_number})`}
                  </span>
                </div>

                {/* Location */}
                {(event.latitude || event.longitude || event.metadata?.location_label) && (
                  <div className="flex items-center gap-1.5 truncate">
                    <MapPin className="w-3.5 h-3.5 shrink-0 text-blue-500" />
                    <span className="font-mono truncate">
                      {event.metadata?.location_label ||
                        `${Number(event.latitude).toFixed(5)}, ${Number(event.longitude).toFixed(5)}`}
                    </span>
                  </div>
                )}
              </div>

              {/* Cryptographic hash chain snippet if present */}
              {event.current_hash && (
                <div className="mt-2.5 pt-2 border-t border-slate-100 dark:border-slate-800/60 flex items-center justify-between text-[11px] font-mono">
                  <span className="text-slate-400">Node Hash:</span>
                  <span className="text-slate-700 dark:text-slate-300 font-semibold truncate max-w-[240px]">
                    {event.current_hash.slice(0, 16)}...{event.current_hash.slice(-8)}
                  </span>
                </div>
              )}

              {/* Custom notes or metadata */}
              {event.notes && (
                <p className="mt-2 text-xs italic text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-[#0B0F19] p-2 rounded border border-slate-100 dark:border-slate-800/80">
                  &ldquo;{event.notes}&rdquo;
                </p>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
