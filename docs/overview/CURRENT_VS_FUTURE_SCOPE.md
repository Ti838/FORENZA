# CURRENT VS FUTURE SCOPE

> [!WARNING]
> This document explicitly separates features that exist in the codebase today from features planned for future production releases. Do not conflate the two.

## CURRENTLY IMPLEMENTED

### Core Architecture
- Next.js 16 App Router configuration.
- Shared `types/index.ts` synchronized with Supabase schema.
- Global Next.js Middleware (`middleware.ts`) extracting JWTs.

### Security & RBAC
- Granular permission matrix defined in `lib/rbac.ts`.
- 7 distinct role-based route groups (e.g., `(roles)/officer`, `(roles)/judge`).
- Route protection logic deflecting unauthorized users.

### Evidence & Workflows
- Cryptographic integrity verification logic (SHA-256 hash comparison).
- Chain of Custody event logs rendering (joining profiles to transfers).
- Basic AI Proxy route (`/api/ai/classify`) protecting the Groq secret key.

---

## PARTIALLY IMPLEMENTED

### Multi-Factor Authentication (MFA)
- The UI route `/(auth)/mfa` exists.
- **Missing:** The actual Supabase AAL2 QR code enrollment and verification logic.

### AI Integration
- The secure proxy exists.
- **Missing:** Strict Redis-based rate limiting per user (to prevent Denial of Wallet).

---

## CONFIGURATION REQUIRED

The following features have code paths but require external configuration by a future developer:

### Interactive Maps
- The frontend expects MapTiler integrations.
- **Action:** A future developer must provide `NEXT_PUBLIC_MAPTILER_KEY` in production.

### Database (Supabase)
- The frontend relies completely on Supabase.
- **Action:** A future developer must provision a Supabase project, execute the SQL schema definitions, and configure RLS policies.

---

## NOT IMPLEMENTED

### Judicial Dossier PDF Generation
- No styled PDF rendering component exists yet. (Only the `jspdf` dependency is listed).

### Hardware Device Trust UI
- The database schema for `ApprovedDevice` is defined.
- No UI table exists in `/admin` to approve or revoke Android device IDs.

---

## FUTURE DEVELOPMENT

- **CI/CD Pipelines:** GitHub Actions for automated testing and Vercel deployments.
- **Air-Gapped AI:** Replacing Groq Cloud API with a local NVIDIA NIM container for high-security on-premise deployments.
