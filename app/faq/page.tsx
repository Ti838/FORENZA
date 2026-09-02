'use client'

import { useState } from 'react'
import { PublicNavbar } from '@/components/public/Navbar'
import { PublicFooter } from '@/components/public/Footer'
import { HelpCircle, ChevronDown, ChevronUp } from 'lucide-react'

export default function FAQPage() {
  const [openIndex, setOpenIndex] = useState<number | null>(0)

  const faqs = [
    {
      q: 'What is FORENZA?',
      a: 'FORENZA is an enterprise forensic evidence chain-of-custody platform designed to manage the entire lifecycle of physical and digital evidence—from crime scene capture to courtroom trial—using cryptographic SHA-256 integrity proofs.',
    },
    {
      q: 'How does evidence capture work?',
      a: 'Evidence is captured through controlled device workflows. The system records GPS coordinates, accuracy, UTC timestamps, and calculates a deterministic SHA-256 hash on raw media bytes immediately upon acquisition.',
    },
    {
      q: 'Can FORENZA work offline without internet?',
      a: 'Yes. In emergency offline mode, FORENZA hashes and encrypts evidence locally using AES-256 in an application-private vault. The officer can depart the crime scene immediately, and the app will automatically synchronize with the server once connectivity is restored.',
    },
    {
      q: 'How is evidence integrity verified?',
      a: 'Integrity is verified by recalculating the SHA-256 hash over media and canonical metadata and comparing it with the master seal recorded at capture. If any bit or historical custody event is altered, verification returns COMPROMISED / TAMPERED.',
    },
    {
      q: 'How does custody transfer work?',
      a: 'Custody transfers require dual authentication. The current custodian generates a 15-minute, single-use cryptographically signed QR token. When the receiving officer scans it, an append-only custody event is linked to the previous custody hash.',
    },
    {
      q: 'Does AI make final legal decisions?',
      a: 'No. AI (Google Gemini 2.0 Flash) is strictly an assistive tool providing suggested object classifications and discrepancy detection. All final decisions require human confirmation or manual override by an authorized investigator or analyst.',
    },
    {
      q: 'How is location privacy handled?',
      a: 'Location is only recorded during initial evidence capture and authorized in-transit movements. Unauthorized callers receive synthetic decoy coordinates via our defensive honeypot mechanism.',
    },
    {
      q: 'Who can access evidence?',
      a: 'Access is strictly controlled through 7 Role-Based Access Control (RBAC) tiers enforced via PostgreSQL Row Level Security (RLS). Users only see cases and evidence within their authorized institutional scope.',
    },
    {
      q: 'What happens if a device is lost or stolen?',
      a: 'All locally stored offline evidence is encrypted with AES-256 and stored in private sandboxes outside the device gallery. Administrators can instantly revoke a compromised device remotely.',
    },
    {
      q: 'How does the Court Dossier work?',
      a: 'The Court Dossier generates a structured, self-authenticating PDF document under Federal Rules of Evidence Rule 902(14) containing the full case index, chronological timeline, custody history, hash proofs, and QR verification codes.',
    },
  ]

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-[#070A12] text-slate-900 dark:text-slate-100 font-sans transition-colors">
      <PublicNavbar />

      <main className="max-w-4xl mx-auto px-4 sm:px-6 py-16 space-y-12">
        <div className="space-y-4 text-center">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800 text-xs font-mono font-bold text-blue-600 dark:text-blue-400">
            <HelpCircle className="w-3.5 h-3.5" />
            <span>FREQUENTLY ASKED QUESTIONS</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-black tracking-tight">
            Questions & Forensic Answers
          </h1>
          <p className="text-sm sm:text-base text-slate-600 dark:text-slate-300 leading-relaxed max-w-2xl mx-auto">
            Everything you need to know about evidence capture, cryptographic integrity, offline emergency protocols, and judicial review.
          </p>
        </div>

        <div className="space-y-4">
          {faqs.map((faq, index) => {
            const isOpen = openIndex === index
            return (
              <div
                key={faq.q}
                className="rounded-3xl bg-white dark:bg-[#0F1523] border border-slate-200 dark:border-slate-800 shadow-sm overflow-hidden transition-all"
              >
                <button
                  type="button"
                  onClick={() => setOpenIndex(isOpen ? null : index)}
                  className="w-full p-6 text-left flex items-center justify-between gap-4 font-bold text-sm sm:text-base text-slate-900 dark:text-white cursor-pointer"
                >
                  <span>{faq.q}</span>
                  {isOpen ? <ChevronUp className="w-5 h-5 text-blue-500 shrink-0" /> : <ChevronDown className="w-5 h-5 text-slate-400 shrink-0" />}
                </button>

                {isOpen && (
                  <div className="px-6 pb-6 pt-1 text-xs sm:text-sm text-slate-600 dark:text-slate-300 leading-relaxed border-t border-slate-100 dark:border-slate-800/80">
                    {faq.a}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </main>

      <PublicFooter />
    </div>
  )
}
