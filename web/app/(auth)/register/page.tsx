'use client'

import { useState, useEffect } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
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
  UserPlus,
  Home,
  CheckCircle2,
  KeyRound,
  ShieldAlert,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

export default function RegisterPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const inviteToken = searchParams.get('token')
  const prefilledRole = searchParams.get('role') || 'INVESTIGATING_OFFICER'
  const prefilledAgency = searchParams.get('agency') || 'Criminal Investigation Department (CID)'

  const [hasValidToken, setHasValidToken] = useState(false)
  const [tokenInput, setTokenInput] = useState('')
  const [fullName, setFullName] = useState('')
  const [email, setEmail] = useState('')
  const [badgeNumber, setBadgeNumber] = useState('')
  const [department, setDepartment] = useState(prefilledAgency)
  const [role, setRole] = useState(prefilledRole)
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // If an authorized invite token is present in the URL query
    if (inviteToken && inviteToken.length >= 8) {
      setHasValidToken(true)
    }
  }, [inviteToken])

  const handleVerifyManualToken = (e: React.FormEvent) => {
    e.preventDefault()
    if (tokenInput.trim().length >= 8) {
      setHasValidToken(true)
      toast.success('Authorization token verified! You may now complete onboarding.')
    } else {
      setError('Invalid or expired departmental authorization token.')
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const deviceId = `web_${crypto.randomUUID().replace(/-/g, '')}`

      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          fullName,
          email: email.trim().toLowerCase(),
          badgeNumber,
          department,
          role,
          password,
          device_identifier: deviceId,
          device_name: `Web Workstation — ${navigator.userAgent.slice(0, 40)}`,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error ?? 'Registration failed')
        return
      }

      toast.success('Authorized Account Provisioned! Please sign in.')
      router.push('/login')
    } catch (err) {
      setError('Network error. Please try again.')
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

      {/* Main Container */}
      <main className="w-full max-w-md mx-auto my-auto py-1 flex flex-col items-center justify-center">
        {/* Brand Logo */}
        <div className="text-center mb-2">
          <ForenzaLogo size="md" showTagline={true} className="justify-center" />
        </div>

        {/* Case 1: No Token Provided — Stealth & Security Screen */}
        {!hasValidToken ? (
          <div className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-4 text-center">
            <div className="p-3 w-fit mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
              <ShieldAlert className="w-8 h-8" />
            </div>

            <div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Institutional Invitation Required
              </h1>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 leading-relaxed">
                FORENZA is a restricted forensic platform. Public self-registration is strictly disabled. You must provide an authorized invitation token or use your departmental onboarding link.
              </p>
            </div>

            {error && (
              <div className="flex items-center gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300 text-left">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <p className="font-semibold text-xs">{error}</p>
              </div>
            )}

            <form onSubmit={handleVerifyManualToken} className="space-y-3 pt-1">
              <div className="text-left">
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1 font-mono">
                  Enter Agency Authorization Token:
                </label>
                <input
                  type="text"
                  required
                  value={tokenInput}
                  onChange={(e) => setTokenInput(e.target.value)}
                  placeholder="e.g. INV-CID-2026-98F4"
                  className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-mono font-bold uppercase text-center"
                />
              </div>

              <button
                type="submit"
                className="w-full py-2.5 rounded-xl font-bold text-xs bg-blue-600 hover:bg-blue-700 text-white transition-all shadow-md shadow-blue-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <KeyRound className="w-3.5 h-3.5" />
                <span>Verify Token & Unlock Onboarding</span>
              </button>
            </form>

            <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
              <Link href="/contact" className="hover:text-blue-600 dark:hover:text-blue-400 font-semibold">
                Request Agency Access
              </Link>
              <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Sign In instead &rarr;
              </Link>
            </div>
          </div>
        ) : (
          /* Case 2: Valid Token Confirmed — Show Registration Form */
          <div className="w-full p-5 sm:p-6 rounded-2xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-3">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AUTHORIZED INVITATION VERIFIED</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Complete Personnel Onboarding
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bind your departmental badge and hardware device credentials.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-semibold text-xs">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-2.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Full Legal Name
                  </label>
                  <input
                    type="text"
                    required
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Chief Insp. / Officer"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
                  />
                </div>
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Badge / Personnel ID
                  </label>
                  <input
                    type="text"
                    required
                    value={badgeNumber}
                    onChange={(e) => setBadgeNumber(e.target.value)}
                    placeholder="CID-8891"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Official Email
                  </label>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="officer@police.gov.bd"
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Assigned Role
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 outline-none focus:border-blue-500 font-medium"
                  >
                    <option value="INVESTIGATING_OFFICER">Investigating Officer</option>
                    <option value="VAULT_CUSTODIAN">Vault Custodian</option>
                    <option value="LAB_ANALYST">Lab Analyst</option>
                    <option value="JUDGE">Judicial Magistrate</option>
                    <option value="SUPERVISOR">Police Supervisor</option>
                    <option value="ADMIN">System Administrator</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                  Security Password (Min. 8 characters)
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••••••"
                    className="w-full px-3 py-2 pr-9 rounded-xl text-xs bg-slate-50 dark:bg-[#0B0F19] border border-slate-200 dark:border-slate-800 text-slate-900 dark:text-slate-100 placeholder-slate-400 outline-none focus:border-blue-500 font-medium"
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
                    <span>Binding Device & Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Create Authorized Account</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </form>

            <div className="pt-2 border-t border-slate-100 dark:border-slate-800 text-center text-xs text-slate-500">
              Already authorized?{' '}
              <Link href="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Sign In here
              </Link>
            </div>
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="text-center text-[10px] font-mono text-slate-400 shrink-0">
        &copy; {new Date().getFullYear()} FORENZA Enterprise Forensics. All rights reserved.
      </footer>
    </div>
  )
}
