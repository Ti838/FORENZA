'use client'

import { useState } from 'react'
import { MapPin, Navigation, Building2, ShieldCheck, AlertCircle, Compass, Gauge } from 'lucide-react'

export interface MapWaypoint {
  id?: string
  latitude: number
  longitude: number
  label: string
  type: 'CRIME_SCENE' | 'CAPTURE' | 'TRANSIT' | 'VAULT'
  timestamp?: string
  speed?: number
  heading?: number
}

interface ForensicMapProps {
  crimeSceneLat?: number | null
  crimeSceneLon?: number | null
  captureLat?: number | null
  captureLon?: number | null
  vaultLat?: number | null
  vaultLon?: number | null
  transitWaypoints?: MapWaypoint[]
  geofenceRadiusMeters?: number
  distanceMeters?: number
  geofenceVerified?: boolean
  className?: string
}

export function ForensicMap({
  crimeSceneLat = 40.7128,
  crimeSceneLon = -74.006,
  captureLat = 40.7132,
  captureLon = -74.0055,
  vaultLat = 40.7200,
  vaultLon = -73.9950,
  transitWaypoints = [],
  geofenceRadiusMeters = 500,
  distanceMeters = 128,
  geofenceVerified = true,
  className = '',
}: ForensicMapProps) {
  const [selectedWaypoint, setSelectedWaypoint] = useState<string | null>('crime_scene')

  // Combine points into route
  const waypoints: MapWaypoint[] = [
    {
      latitude: crimeSceneLat || 40.7128,
      longitude: crimeSceneLon || -74.006,
      label: 'Crime Scene Perimeter',
      type: 'CRIME_SCENE',
      timestamp: 'Incident Initialized',
    },
    {
      latitude: captureLat || 40.7132,
      longitude: captureLon || -74.0055,
      label: 'Evidence Acquisition Point',
      type: 'CAPTURE',
      timestamp: 'Captured by Officer',
    },
    ...transitWaypoints,
    {
      latitude: vaultLat || 40.7200,
      longitude: vaultLon || -73.9950,
      label: 'Central Evidence Vault Storage',
      type: 'VAULT',
      timestamp: 'Secured Facility',
    },
  ]

  return (
    <div
      className={`forenza-card rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] overflow-hidden shadow-sm flex flex-col ${className}`}
    >
      {/* Map Control Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Navigation className="w-4 h-4" />
          </div>
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-900 dark:text-slate-100">
              FORENSIC ROUTE & GEOFENCE TELEMETRY
            </h4>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 font-mono">
              Haversine Calculated Distance: {distanceMeters}m (Radius: {geofenceRadiusMeters}m)
            </p>
          </div>
        </div>

        {/* Perimeter Verification Status */}
        <div>
          {geofenceVerified ? (
            <span className="badge-verified">
              <ShieldCheck className="w-3.5 h-3.5" />
              PERIMETER VERIFIED ({distanceMeters}m from scene)
            </span>
          ) : (
            <span className="badge-warning">
              <AlertCircle className="w-3.5 h-3.5" />
              OUTSIDE PERIMETER ({distanceMeters}m - OVERRIDE REQUIRED)
            </span>
          )}
        </div>
      </div>

      {/* Forensic Interactive Vector Map Canvas */}
      <div className="relative h-72 sm:h-80 bg-slate-900 overflow-hidden flex items-center justify-center select-none">
        {/* Technical Coordinate Grid Background */}
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage: `
              radial-gradient(circle at 1px 1px, #3B82F6 1px, transparent 0),
              linear-gradient(to right, #1E293B 1px, transparent 1px),
              linear-gradient(to bottom, #1E293B 1px, transparent 1px)
            `,
            backgroundSize: '24px 24px',
          }}
        />

        {/* Technical Radar Compass in corner */}
        <div className="absolute top-3 right-3 p-2 rounded-lg bg-slate-950/80 border border-slate-800 text-[10px] font-mono text-slate-400 flex items-center gap-1.5 shadow-sm">
          <Compass className="w-3.5 h-3.5 text-blue-400 animate-spin" style={{ animationDuration: '10s' }} />
          <span>NORTH 000°</span>
        </div>

        {/* Dynamic Route SVG */}
        <svg className="w-full h-full p-8" viewBox="0 0 600 240" fill="none">
          <defs>
            <linearGradient id="routeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#3B82F6" />
              <stop offset="50%" stopColor="#8B5CF6" />
              <stop offset="100%" stopColor="#10B981" />
            </linearGradient>
            <radialGradient id="geofenceZone">
              <stop offset="0%" stopColor="#3B82F6" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#3B82F6" stopOpacity="0.0" />
            </radialGradient>
          </defs>

          {/* Crime Scene Geofence 500m circle */}
          <circle cx="80" cy="140" r="55" fill="url(#geofenceZone)" stroke="#3B82F6" strokeWidth="1.5" strokeDasharray="3 3" />

          {/* Forensic Transit Vector Polyline */}
          <path
            d="M 80 140 Q 200 60, 320 120 T 520 80"
            stroke="url(#routeGradient)"
            strokeWidth="3"
            strokeLinecap="round"
            strokeDasharray="6 6"
            className="animate-pulse"
          />

          {/* Crime scene marker */}
          <g transform="translate(80, 140)" className="cursor-pointer" onClick={() => setSelectedWaypoint('crime_scene')}>
            <circle r="12" fill="#EF4444" fillOpacity="0.2" />
            <circle r="6" fill="#EF4444" />
            <text x="0" y="24" fill="#F8FAFC" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              SCENE
            </text>
          </g>

          {/* Capture waypoint */}
          <g transform="translate(130, 120)" className="cursor-pointer" onClick={() => setSelectedWaypoint('capture')}>
            <circle r="10" fill="#3B82F6" fillOpacity="0.3" />
            <circle r="5" fill="#3B82F6" />
            <text x="0" y="-12" fill="#93C5FD" fontSize="9" textAnchor="middle" fontFamily="monospace">
              ACQUIRED
            </text>
          </g>

          {/* Transit checkpoint */}
          <g transform="translate(320, 120)" className="cursor-pointer" onClick={() => setSelectedWaypoint('transit')}>
            <circle r="8" fill="#8B5CF6" fillOpacity="0.3" />
            <circle r="4" fill="#8B5CF6" />
            <text x="0" y="20" fill="#C4B5FD" fontSize="9" textAnchor="middle" fontFamily="monospace">
              TRANSIT #1
            </text>
          </g>

          {/* Vault Storage destination */}
          <g transform="translate(520, 80)" className="cursor-pointer" onClick={() => setSelectedWaypoint('vault')}>
            <circle r="14" fill="#10B981" fillOpacity="0.2" />
            <circle r="7" fill="#10B981" />
            <text x="0" y="26" fill="#6EE7B7" fontSize="10" fontWeight="bold" textAnchor="middle" fontFamily="monospace">
              VAULT
            </text>
          </g>
        </svg>

        {/* Live GPS Telemetry readout pill */}
        <div className="absolute bottom-3 left-3 px-3 py-1.5 rounded-lg bg-slate-950/90 border border-slate-800 text-slate-200 text-xs font-mono flex items-center gap-3">
          <div className="flex items-center gap-1 text-blue-400">
            <MapPin className="w-3.5 h-3.5" />
            <span>LAT: {Number(crimeSceneLat).toFixed(4)}°</span>
            <span>LON: {Number(crimeSceneLon).toFixed(4)}°</span>
          </div>
          <div className="hidden sm:flex items-center gap-1 text-emerald-400 border-l border-slate-800 pl-3">
            <Gauge className="w-3.5 h-3.5" />
            <span>ACCURACY: ±3.4m</span>
          </div>
        </div>
      </div>

      {/* Waypoint Telemetry List */}
      <div className="p-4 grid grid-cols-1 sm:grid-cols-3 gap-3 bg-slate-50 dark:bg-[#0E1422] border-t border-slate-100 dark:border-slate-800/80 text-xs">
        <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-red-600 dark:text-red-400 font-bold mb-1">
            <MapPin className="w-3.5 h-3.5" />
            <span>Point of Origin (Scene)</span>
          </div>
          <p className="font-mono text-slate-600 dark:text-slate-400">
            {Number(crimeSceneLat).toFixed(6)}, {Number(crimeSceneLon).toFixed(6)}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 font-bold mb-1">
            <Navigation className="w-3.5 h-3.5" />
            <span>Capture Location</span>
          </div>
          <p className="font-mono text-slate-600 dark:text-slate-400">
            {Number(captureLat).toFixed(6)}, {Number(captureLon).toFixed(6)}
          </p>
        </div>

        <div className="p-2.5 rounded-lg bg-white dark:bg-[#111827] border border-slate-200/80 dark:border-slate-800">
          <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-bold mb-1">
            <Building2 className="w-3.5 h-3.5" />
            <span>Secured Vault Destination</span>
          </div>
          <p className="font-mono text-slate-600 dark:text-slate-400">
            {Number(vaultLat).toFixed(6)}, {Number(vaultLon).toFixed(6)}
          </p>
        </div>
      </div>
    </div>
  )
}
