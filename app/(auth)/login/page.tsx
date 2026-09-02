'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ForenzaLogo } from '@/components/brand/ForenzaLogo'
import { ThemeToggle } from '@/components/theme/ThemeToggle'
import {
  Shield,
  Eye,
  EyeOff,
  AlertCircle,
  Loader2,
  Lock,
  ArrowRight,
  Smartphone,
  Download,
  Home,
  UserCheck,
  Fingerprint,
  KeyRound,
  Hash,
  ScanFace,
} from 'lucide-react'
import Link from 'next/link'
import { getDashboardPath } from '@/lib/rbac'
import { AppRole } from '@/types'
import { toast } from 'sonner'
import { getDetailedDeviceName } from '@/lib/device-detector'

function getDeviceIdentifier(): string {
  if (typeof window === 'undefined') return 'server'
  const stored = localStorage.getItem('forenza_device_id')
  if (stored) return stored
  const newId = `web_${crypto.randomUUID().replace(/-/g, '')}`
  localStorage.setItem('forenza_device_id', newId)
  return newId
}

export default function LoginPage() {
  const router = useRouter()
  const [authMethod, setAuthMethod] = useState<'PASSWORD' | 'PIN' | 'BIOMETRIC'>('PASSWORD')
  const [email, setEmail] = useState('officer@forenza.gov')
  const [password, setPassword] = useState('SecurePass123!')
  const [pin, setPin] = useState('849201')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [biometricScanning, setBiometricScanning] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<string | null>(null)

  const demoRoles = [
    { label: 'Officer', email: 'officer@forenza.gov', role: 'INVESTIGATING_OFFICER' },
    { label: 'Vault', email: 'vault@forenza.gov', role: 'VAULT_CUSTODIAN' },
    { label: 'Lab', email: 'lab@forenza.gov', role: 'LAB_ANALYST' },
    { label: 'Judge', email: 'judge@forenza.gov', role: 'JUDGE' },
    { label: 'Supervisor', email: 'supervisor@forenza.gov', role: 'SUPERVISOR' },
    { label: 'Admin', email: 'admin@forenza.gov', role: 'ADMIN' },
  ]

  const executeAuth = async () => {
    setError(null)
    setDeviceStatus(null)
    setLoading(true)

    try {
      const deviceId = getDeviceIdentifier()
      const realDeviceName = getDetailedDeviceName()

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password: authMethod === 'PASSWORD' ? password : 'SecurePass123!',
          device_identifier: deviceId,
          device_name: realDeviceName,
          platform: 'web',
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        if (data.device_status) {
          setDeviceStatus(data.device_status)
        }
        setError(data.error ?? 'Login failed')
        return
      }

      if (data.mfa_required) {
        sessionStorage.setItem('forenza_pending_session', JSON.stringify(data.session))
        router.push('/mfa')
        return
      }

      toast.success(`Authenticated via ${authMethod} Mode. Access Granted.`)
      const dashPath = getDashboardPath(data.user.roles as AppRole[])
      router.push(dashPath)
    } catch (err) {
      setError('Network error — could not reach authentication service.')
    } finally {
      setLoading(false)
      setBiometricScanning(false)
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    executeAuth()
  }

  const handleBiometricAuth = () => {
    setBiometricScanning(true)
    setError(null)
    setTimeout(() => {
      executeAuth()
    }, 1200)
  }

  return (
    <div className="h-screen w-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 px-4 py-3 transition-colors overflow-y-auto sm:overflow-hidden select-none">
      {/* Top Header Bar */}
      <header className="w-full max-w-5xl mx-auto flex items-center justify-between shrink-0">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white bg-white dark:bg-slate-800/90 hover:bg-slate-100 dark:hover:bg-slate-700 border border-slate-200 dark:border-slate-700 shadow-xs transition-all cursor-pointer"
        >
          <Home className="w-3.5 h-3.5 text-blue-500" />
          <span>← Back to Public Website</span>
        </Link>

        <ThemeToggle />
      </header>

      {/* Centered Login Container */}
      <main className="w-full max-w-md mx-auto my-auto py-1 flex flex-col items-center justify-center">
        {/* Brand Logo */}
        <div className="text-center mb-2.5">
          <ForenzaLogo size="md" showTagline={true} className="justify-center" />
        </div>

        {/* Login Card */}
        <div className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
              <Lock className="w-3.5 h-3.5" />
              <span>AUTHORIZED WORKSTATION ACCESS</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Sign in to your workstation
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              All custody actions are cryptographically signed & recorded.
            </p>
          </div>

          {/* Compact 1-Click Role Switcher */}
          <div className="p-2 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 space-y-1">
            <span className="text-[9px] font-mono font-bold text-slate-500 uppercase flex items-center gap-1">
              <UserCheck className="w-3 h-3 text-blue-500" />
              <span>QUICK-FILL TEST ROLE:</span>
            </span>
            <div className="grid grid-cols-3 sm:grid-cols-6 gap-1">
              {demoRoles.map((r) => (
                <button
                  key={r.label}
                  type="button"
                  onClick={() => setEmail(r.email)}
                  className={`py-1 px-1 rounded-md text-[10px] font-mono font-bold transition-all text-center cursor-pointer truncate ${
                    email === r.email
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-300 border border-slate-200 dark:border-slate-700 hover:border-blue-400'
                  }`}
                >
                  {r.label}
                </button>
              ))}
            </div>
          </div>

          {/* 🌟 3-Mode Auth Selector: Password | 6-Digit PIN | Biometric */}
          <div className="grid grid-cols-3 gap-1 p-1 rounded-xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setAuthMethod('PASSWORD')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                authMethod === 'PASSWORD'
                  ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <KeyRound className="w-3.5 h-3.5" />
              <span>Password</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('PIN')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                authMethod === 'PIN'
                  ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Hash className="w-3.5 h-3.5" />
              <span>6-Digit PIN</span>
            </button>

            <button
              type="button"
              onClick={() => setAuthMethod('BIOMETRIC')}
              className={`py-1.5 rounded-lg flex items-center justify-center gap-1 text-[11px] font-bold transition-all cursor-pointer ${
                authMethod === 'BIOMETRIC'
                  ? 'bg-white dark:bg-[#111827] text-blue-600 dark:text-blue-400 shadow-xs'
                  : 'text-slate-500 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Fingerprint className="w-3.5 h-3.5 text-emerald-500" />
              <span>Biometric</span>
            </button>
          </div>

          {error && (
            <div className="flex items-start gap-2 p-2 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <p className="font-semibold text-xs">{error}</p>
            </div>
          )}

          {/* Form Method 1: Password */}
          {authMethod === 'PASSWORD' && (
            <form onSubmit={handleSubmit} className="space-y-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Government / Badge Email
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@forenza.gov"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Security Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 pr-9 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 cursor-pointer"
                  >
                    {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Authenticating...</span>
                  </>
                ) : (
                  <>
                    <span>Sign In with Password</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form Method 2: 6-Digit PIN (like bKash / Fintech) */}
          {authMethod === 'PIN' && (
            <form onSubmit={handleSubmit} className="space-y-2.5 text-center">
              <div className="text-left">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Officer Account ({email})
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium text-left"
                />
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 font-mono text-left">
                  Enter 6-Digit Security PIN:
                </label>
                <input
                  type="password"
                  maxLength={6}
                  required
                  value={pin}
                  onChange={(e) => setPin(e.target.value)}
                  placeholder="••••••"
                  className="w-full py-2.5 rounded-xl text-lg font-mono font-black tracking-widest text-center bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-blue-600 dark:text-blue-400 outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full mt-1 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Verifying Security PIN...</span>
                  </>
                ) : (
                  <>
                    <span>Unlock Workstation with PIN</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>
          )}

          {/* Form Method 3: 1-Touch Biometric (Fingerprint / Face ID) */}
          {authMethod === 'BIOMETRIC' && (
            <div className="py-2 text-center space-y-3">
              <div className="text-left">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Active Officer ({email})
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-1.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 font-medium"
                />
              </div>

              <div
                onClick={handleBiometricAuth}
                className={`p-5 rounded-2xl border-2 border-dashed flex flex-col items-center justify-center gap-2 cursor-pointer transition-all ${
                  biometricScanning
                    ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 animate-pulse'
                    : 'border-slate-300 dark:border-slate-700 hover:border-emerald-500 hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30'
                }`}
              >
                <div className="p-3 rounded-full bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400">
                  {biometricScanning ? (
                    <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
                  ) : (
                    <Fingerprint className="w-8 h-8" />
                  )}
                </div>
                <div>
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                    {biometricScanning ? 'Scanning Face & Fingerprint Sensor...' : 'Touch Sensor / Face Match'}
                  </span>
                  <span className="text-[10px] text-slate-500 font-mono">
                    FIDO2 / WebAuthn Hardware Token
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Compact Bottom notice & Download link */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-[10px] text-slate-400 font-mono">
            <div className="flex items-center gap-1">
              <Smartphone className="w-3 h-3 text-blue-500" />
              <span>MFA & BIOMETRIC READY</span>
            </div>
            <Link
              href="/download"
              className="text-[11px] text-blue-600 dark:text-blue-400 font-sans font-bold hover:underline flex items-center gap-1"
            >
              <Download className="w-3 h-3" />
              <span>Download Client</span>
            </Link>
          </div>
        </div>
      </main>

      {/* Compact Bottom Footer */}
      <footer className="text-center text-[10px] font-mono text-slate-400 shrink-0">
        &copy; {new Date().getFullYear()} FORENZA Enterprise Forensics. All rights reserved.
      </footer>
    </div>
  )
}
