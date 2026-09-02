# FORENZA-web Project Audit

**Date:** September 2026
**Target:** FORENZA Web Application (Next.js)

## Executive Summary
An exhaustive audit of the `FORENZA-web` repository reveals a sophisticated Next.js App Router application built on a unified Supabase backend. The application relies heavily on a 7-Role RBAC model enforced by Next.js middleware and Supabase RLS. 

The architecture strictly mirrors the Android application's backend dependencies, acting as the administrative, investigative, and judicial counterpart to the field capture system.

## 1. Authentication & Authorization
- **Supabase SSR:** `[IMPLEMENTED]` Uses `@supabase/ssr` with cookie management in `middleware.ts`.
- **Route Protection:** `[IMPLEMENTED]` Route guarding correctly blocks unauthorized access to `/officer`, `/admin`, `/judge`, etc., based on JWT claims and DB queries.
- **RBAC Engine:** `[IMPLEMENTED]` Comprehensive Application-level RBAC is defined in `lib/rbac.ts` spanning 7 roles and ~30 granular permissions.
- **MFA:** `[MISSING]` Multi-factor authentication routing exists (`/mfa`) but implementation details are not yet enforced site-wide.

## 2. Core Functional Modules
### Dashboard / Cases
- **Case Listing:** `[IMPLEMENTED]`
- **Case Details:** `[IMPLEMENTED]`
- **Case Assignment:** `[IMPLEMENTED]`

### Evidence Management
- **Evidence Timeline:** `[IMPLEMENTED]`
- **Evidence Details:** `[IMPLEMENTED]`
- **Chain of Custody Rendering:** `[IMPLEMENTED]`
- **Verification Portal:** `[IMPLEMENTED]` Cryptographic verification logic exists in `lib/verifier`.

### Audit & Compliance
- **Audit Logs:** `[IMPLEMENTED]` Standard table displays.
- **Compliance Dashboards:** `[IMPLEMENTED]` Read-only views for AUDITOR.

### Forensic Laboratory
- **Sample Registration:** `[IMPLEMENTED]`
- **Report Uploads:** `[IMPLEMENTED]`

## 3. Technology Stack Audit
- **Framework:** Next.js 16.3.3 (App Router)
- **UI System:** TailwindCSS v4 + Radix UI Primitives + Lucide React
- **State Management:** React Server Components (RSC) + Client hooks.
- **Database:** Supabase Client.
- **Mapping:** MapLibre GL (`maplibre-gl`)
- **Crypto:** `jose` (JWT) + standard Web Crypto API.
- **PDF Generation:** `jspdf` & `jspdf-autotable`

## 4. Known Issues & Missing Features (Identified for Phase 2)
1. **Dossier Generation:** While `jspdf` is installed, full multi-page PDF generation for Judicial dossiers lacks deep styling.
2. **AI Proxy Security:** Needs verification that Groq keys are not leaked to the browser bundle.
3. **Hardware Device Management:** UI for approving/revoking Android devices (System Admin) is incomplete.

## 5. Security Posture
- **XSS / CSRF:** Handled intrinsically by Next.js and RSC.
- **Data Fetching:** Heavily relies on Supabase RLS policies (Backend Dependency). The frontend correctly uses `getUser()` instead of `getSession()` in middleware for secure validation.
