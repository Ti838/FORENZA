'use client'

import { useState } from 'react'
import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import { Mail, Building, Send, ShieldCheck, CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'

export default function ContactPage() {
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    agency: '',
    role: 'Law Enforcement Agency',
    email: '',
    message: '',
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setTimeout(() => {
      setLoading(false)
      setSubmitted(true)
      toast.success('Inquiry received. A forensic solutions representative will respond shortly.')
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <Mail className="w-3.5 h-3.5" />
            <span>INSTITUTIONAL LIAISON</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Contact Forensic Solutions
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Inquire about agency onboarding, custom jurisdiction configurations, security audit packages, or judicial trial deployments.
          </p>
        </div>

        <div className="p-6 sm:p-10 rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-xl max-w-2xl mx-auto">
          {submitted ? (
            <div className="text-center py-10 space-y-4">
              <div className="p-4 w-fit mx-auto rounded-full bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h3 className="text-xl font-bold text-slate-900 dark:text-white">Inquiry Submitted Successfully</h3>
              <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-300 max-w-md mx-auto">
                Thank you. Your request has been assigned reference <strong>INQ-{Date.now().toString().slice(-6)}</strong>. Our security and compliance team will reach out via your official agency email.
              </p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Full Name</label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="Chief Insp. / Dr. / Officer"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Agency / Department</label>
                  <input
                    type="text"
                    required
                    value={formData.agency}
                    onChange={(e) => setFormData({ ...formData, agency: e.target.value })}
                    placeholder="e.g. Criminal Investigation Dept."
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Official Agency Email</label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="officer@police.gov.bd"
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  />
                </div>
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Organization Type</label>
                  <select
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                  >
                    <option>Law Enforcement Agency</option>
                    <option>Judicial / Court Chamber</option>
                    <option>Forensic Science Laboratory</option>
                    <option>Prosecution Department</option>
                    <option>Independent Audit Authority</option>
                  </select>
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-bold text-slate-700 dark:text-slate-300">Inquiry Scope / Deployment Requirement</label>
                <textarea
                  required
                  rows={4}
                  value={formData.message}
                  onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                  placeholder="Describe your case volume, number of field personnel, or specific statutory requirements..."
                  className="w-full px-4 py-2.5 rounded-xl bg-slate-50 dark:bg-[#070A12] border border-slate-200 dark:border-slate-700 text-xs text-slate-900 dark:text-white focus:outline-none focus:border-blue-500"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full py-3.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold text-xs font-mono tracking-wider shadow-md shadow-blue-600/30 flex items-center justify-center gap-2 cursor-pointer transition-all"
              >
                {loading ? (
                  <span>SUBMITTING INQUIRY...</span>
                ) : (
                  <>
                    <Send className="w-4 h-4" />
                    <span>TRANSMIT OFFICIAL INQUIRY</span>
                  </>
                )}
              </button>
            </form>
          )}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
