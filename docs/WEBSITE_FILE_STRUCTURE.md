# FORENZA-web File Structure

This document outlines the strict organizational structure of the FORENZA Web Application, enforcing separation of concerns.

```text
FORENZA-web/
├── app/                      # Next.js App Router (Pages & API)
│   ├── (auth)/               # Login, Registration, MFA
│   ├── admin/                # System Administrator Hub
│   ├── api/                  # Secure API Routes (AI Proxy, Downloads)
│   ├── auditor/              # Compliance Officer Hub
│   ├── judge/                # Judicial Chamber Hub
│   ├── lab/                  # Forensic Laboratory Hub
│   ├── officer/              # Investigating Officer Hub
│   ├── supervisor/           # Supervisor Hub
│   └── vault/                # Vault Custodian Hub
│
├── components/               # Reusable React Components
│   ├── brand/                # Logos, Typography
│   ├── forensic/             # Evidence Cards, Custody Timelines, Hash Badges
│   ├── layout/               # Navbars, Sidebars, Shells
│   ├── mobile/               # Responsive overlays
│   └── ui/                   # Base Radix Primitives (Buttons, Dialogs)
│
├── lib/                      # Core Business Logic & Configurations
│   ├── rbac.ts               # Role-Based Access Control logic
│   ├── supabase/             # Supabase Client initializers (Browser/Server)
│   ├── verifier/             # Cryptographic Integrity verification
│   └── crypto/               # Web Crypto wrappers
│
├── types/                    # Universal TypeScript Definitions
│   └── index.ts              # Master Data Models (matches DB schema)
│
├── public/                   # Static assets (Images, Favicons)
│
├── docs/                     # Comprehensive Architecture & Audits
│
├── middleware.ts             # Global Authentication & Role Router
├── tailwind.config.js        # UI styling tokens
└── package.json              # Dependencies & Scripts
```

## Anti-Patterns Avoided
- **No Duplicate Models:** All components rely on `types/index.ts`. There are no ad-hoc interfaces for `User` or `Evidence` scattered in components.
- **No Direct DB Access in Client:** `lib/supabase/browser.ts` is used only for real-time subscriptions and file uploads; major data fetching is done in RSCs.
