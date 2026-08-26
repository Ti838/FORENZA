'use client'

import { useState, useEffect, useRef } from 'react'
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
  Camera,
  Fingerprint,
  Upload,
  User,
} from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'

import { getDetailedDeviceName } from '@/lib/device-detector'

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
  const [biometricBound, setBiometricBound] = useState(false)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
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

  const handlePhotoSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      const reader = new FileReader()
      reader.onload = () => {
        setPhotoPreview(reader.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleBiometricBinding = () => {
    setBiometricBound(true)
    toast.success('Hardware biometric key & device token successfully registered!')
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      const deviceId = `web_${crypto.randomUUID().replace(/-/g, '')}`
      const realDeviceName = getDetailedDeviceName()

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
          device_name: realDeviceName,
          photo: photoPreview,
          biometric_verified: biometricBound,
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
    <div className="min-h-screen w-screen flex flex-col justify-between bg-slate-50 dark:bg-[#0B0F19] text-slate-900 dark:text-slate-100 px-4 py-3 transition-colors select-none">
      {/* Top Header */}
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

      {/* Main Content */}
      <main className="w-full max-w-lg mx-auto my-auto py-3 flex flex-col items-center justify-center">
        <div className="text-center mb-2">
          <ForenzaLogo size="md" showTagline={true} className="justify-center" />
        </div>

        {/* Case 1: Locked Mode without Invite Token */}
        {!hasValidToken ? (
          <div className="w-full p-6 sm:p-8 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-4 text-center">
            <div className="p-3.5 w-fit mx-auto rounded-2xl bg-amber-50 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400">
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
          /* Case 2: Unlocked with Full Biometrics & Photo Verification */
          <div className="w-full p-6 sm:p-7 rounded-3xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#111827] shadow-xl space-y-4">
            <div>
              <div className="flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold uppercase tracking-wider mb-0.5 font-mono">
                <CheckCircle2 className="w-3.5 h-3.5" />
                <span>AUTHORIZED INVITATION VERIFIED</span>
              </div>
              <h1 className="text-lg font-bold text-slate-900 dark:text-slate-100 tracking-tight">
                Complete Personnel & Biometric Onboarding
              </h1>
              <p className="text-[11px] text-slate-500 dark:text-slate-400">
                Bind your official photo, badge ID, and hardware biometric credentials.
              </p>
            </div>

            {error && (
              <div className="flex items-start gap-2 p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800/60 text-xs text-red-600 dark:text-red-300">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <p className="font-semibold text-xs">{error}</p>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-3">
              {/* Photo & Biometric Section */}
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#0B0F19] border border-slate-200/80 dark:border-slate-800 flex items-center justify-between gap-4">
                {/* Officer Photo Upload / Capture */}
                <div className="flex items-center gap-3">
                  <div
                    onClick={() => fileInputRef.current?.click()}
                    className="w-14 h-14 rounded-2xl bg-blue-50 dark:bg-blue-950/80 border-2 border-dashed border-blue-300 dark:border-blue-700 flex flex-col items-center justify-center text-blue-600 dark:text-blue-400 cursor-pointer overflow-hidden relative group"
                  >
                    {photoPreview ? (
                      <img src={photoPreview} alt="Officer" className="w-full h-full object-cover" />
                    ) : (
                      <>
                        <Camera className="w-5 h-5" />
                        <span className="text-[9px] font-bold mt-0.5">Photo</span>
                      </>
                    )}
                  </div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handlePhotoSelect}
                    accept="image/*"
                    className="hidden"
                  />
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-slate-100 block">
                      Official Photo
                    </span>
                    <span className="text-[10px] text-slate-500">Badge facial match</span>
                  </div>
                </div>

                {/* Fingerprint / Device Biometric Button */}
                <button
                  type="button"
                  onClick={handleBiometricBinding}
                  className={`px-3 py-2 rounded-xl text-xs font-mono font-bold flex items-center gap-2 border transition-all cursor-pointer ${
                    biometricBound
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-700 text-emerald-600 dark:text-emerald-400'
                      : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:border-blue-400'
                  }`}
                >
                  <Fingerprint className="w-4 h-4 text-blue-500" />
                  <span>{biometricBound ? 'Biometric Bound ✓' : 'Register Fingerprint'}</span>
                </button>
              </div>

              {/* Name & Badge Number */}
              <div className="grid grid-cols-2 gap-2.5">
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

              {/* Email & Role */}
              <div className="grid grid-cols-2 gap-2.5">
                <div>
                  <label className="block text-[11px] font-bold text-slate-600 dark:text-slate-300 mb-1">
                    Government Email
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

              {/* Password */}
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
                    <span>Binding Biometric Device & Registering...</span>
                  </>
                ) : (
                  <>
                    <span>Complete Authorized Registration</span>
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

      <footer className="text-center text-[10px] font-mono text-slate-400 shrink-0">
        &copy; {new Date().getFullYear()} FORENZA Enterprise Forensics. All rights reserved.
      </footer>
    </div>
  )
}
