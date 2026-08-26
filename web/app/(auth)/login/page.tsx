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
} from 'lucide-react'
import Link from 'next/link'
import { getDashboardPath } from '@/lib/rbac'
import { AppRole } from '@/types'

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
  const [email, setEmail] = useState('officer@forenza.gov')
  const [password, setPassword] = useState('SecurePass123!')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [deviceStatus, setDeviceStatus] = useState<string | null>(null)

  const demoRoles = [
    { label: 'Officer', email: 'officer@forenza.gov' },
    { label: 'Vault', email: 'vault@forenza.gov' },
    { label: 'Lab', email: 'lab@forenza.gov' },
    { label: 'Judge', email: 'judge@forenza.gov' },
    { label: 'Supervisor', email: 'supervisor@forenza.gov' },
    { label: 'Admin', email: 'admin@forenza.gov' },
  ]

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setDeviceStatus(null)
    setLoading(true)

    try {
      const deviceId = getDeviceIdentifier()

      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: email.trim().toLowerCase(),
          password,
          device_identifier: deviceId,
          device_name: `Web Browser — ${navigator.userAgent.slice(0, 40)}`,
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

      // Navigate to role-based dashboard
      const dashPath = getDashboardPath(data.user.roles as AppRole[])
      router.push(dashPath)
    } catch (err) {
      setError('Network error — could not reach authentication service. Please check your connection.')
      console.error('[FORENZA LOGIN]', err)
    } finally {
      setLoading(false)
    }
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
        <div className="text-center mb-3">
          <ForenzaLogo size="md" showTagline={true} className="justify-center" />
        </div>

        {/* Login Card */}
        <div className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-3">
          <div>
            <div className="flex items-center gap-1.5 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase tracking-wider mb-0.5">
              <Lock className="w-3.5 h-3.5" />
              <span>AUTHORIZED PERSONNEL ACCESS</span>
            </div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
              Sign in to your workstation
            </h1>
            <p className="text-[11px] text-slate-500 dark:text-slate-400">
              All system access and custody interactions are cryptographically recorded.
            </p>
          </div>

          {/* Compact 1-Click Role Switcher */}
          <div className="p-2.5 rounded-xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 space-y-1.5">
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
                  className={`py-1 px-1.5 rounded-md text-[10px] font-mono font-bold transition-all text-center cursor-pointer truncate ${
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

          {error && (
            <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-xs">{error}</p>
                {deviceStatus === 'PENDING' && (
                  <p className="text-[10px] mt-0.5">
                    Your hardware device token is pending administrator approval.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-2.5">
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                Government / Badge Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="officer@forenza.gov"
                className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1"
              >
                Security Password
              </label>
              <div className="relative">
                <input
                  id="password"
                  type={showPassword ? 'text' : 'password'}
                  required
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••••••"
                  className="w-full px-3 py-2 pr-9 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium transition-all"
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
              className="w-full mt-1 py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer"
            >
              {loading ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Authenticating...</span>
                </>
              ) : (
                <>
                  <span>Sign In to FORENZA</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </form>

          {/* Compact Bottom notice & Register / Download links */}
          <div className="pt-2 border-t border-slate-100 dark:border-slate-800 space-y-1.5 text-center">
            <div className="text-[11px] text-slate-500">
              New personnel or officer?{' '}
              <Link href="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Create Authorized Account
              </Link>
            </div>
            <div className="flex items-center justify-between text-[10px] text-slate-400 font-mono pt-1">
              <div className="flex items-center gap-1">
                <Smartphone className="w-3 h-3 text-blue-500" />
                <span>MFA & DEVICE BINDING</span>
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
        </div>
      </main>

      {/* Compact Bottom Footer */}
      <footer className="text-center text-[10px] font-mono text-slate-400 shrink-0">
        &copy; {new Date().getFullYear()} FORENZA Enterprise Forensics. All rights reserved.
      </footer>
    </div>
  )
}
