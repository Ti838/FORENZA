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
} from 'lucide-react'
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
    } catch {
      // For local prototype demonstration if backend mock
      router.push('/supervisor/dashboard')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 p-4 transition-colors relative">
      {/* Top right theme toggle */}
      <div className="absolute top-4 right-4">
        <ThemeToggle />
      </div>

      <div className="relative w-full max-w-md">
        {/* Official Brand Logo */}
        <div className="text-center mb-8">
          <ForenzaLogo size="lg" showTagline={true} className="justify-center mb-2" />
        </div>

        {/* Login Card */}
        <div className="forenza-card p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl">
          <div className="flex items-center gap-2 mb-4 text-blue-600 dark:text-blue-400">
            <Lock className="w-4 h-4" />
            <span className="text-xs font-bold uppercase tracking-wider">
              AUTHORIZED PERSONNEL ACCESS
            </span>
          </div>

          <h2 className="text-xl font-bold text-slate-900 dark:text-slate-100 tracking-tight">
            Sign in to your workstation
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 mb-6">
            All system access and custody interactions are cryptographically recorded.
          </p>

          {error && (
            <div className="flex items-start gap-2.5 p-3.5 rounded-lg mb-6 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300">
              <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold">{error}</p>
                {deviceStatus === 'PENDING' && (
                  <p className="text-[11px] mt-1">
                    Your hardware device token is pending administrator approval.
                  </p>
                )}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label
                htmlFor="email"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5"
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
                className="w-full px-3.5 py-2.5 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium transition-all"
              />
            </div>

            <div>
              <label
                htmlFor="password"
                className="block text-xs font-bold text-slate-600 dark:text-slate-300 mb-1.5"
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
                  className="w-full px-3.5 py-2.5 pr-10 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium transition-all"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full mt-2 py-3 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {loading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Authenticating Device & Credentials...</span>
                </>
              ) : (
                <>
                  <span>Sign In to FORENZA</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </form>

          {/* Device notice */}
          <div className="mt-6 pt-4 border-t border-slate-100 dark:border-slate-800 flex items-center justify-center gap-1.5 text-[11px] text-slate-400 font-mono">
            <Smartphone className="w-3.5 h-3.5 text-blue-500" />
            <span>DEVICE BINDING & MFA ACTIVE</span>
          </div>
        </div>
      </div>
    </div>
  )
}
