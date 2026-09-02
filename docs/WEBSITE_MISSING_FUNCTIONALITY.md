# FORENZA-web Missing Functionality Analysis

This document identifies functionality that is required by the FORENZA workflow but is currently missing or incomplete in the web application.

## 1. Judicial Dossier Generation (PDF)
- **Why it is needed:** The Judicial Chamber requires sealed, verifiable, multi-page dossiers (PDF format) containing all evidence metadata, chain of custody logs, and cryptographic hashes to admit evidence into court.
- **Current State:** `jspdf` is installed in `package.json`, but a fully styled, multi-page dossier generator component is not implemented.
- **Can it be implemented locally?:** Yes.
- **Backend Dependency?:** Fetches joined data (Cases -> Evidence -> Custody -> Verification).
- **Security Implications:** PDFs must not execute JavaScript. Data rendered must be authorized by RLS.

## 2. Multi-Factor Authentication (MFA) Setup
- **Why it is needed:** Confidential workstations (Admin, Supervisor) require MFA to prevent unauthorized access.
- **Current State:** The route `/(auth)/mfa` exists, but the enrollment flow (QR code generation for authenticator apps) using Supabase Auth is incomplete.
- **Can it be implemented locally?:** Yes, via Supabase MFA APIs.
- **Backend Dependency?:** Supabase Auth AAL2 verification.
- **Security Implications:** High. Required for Zero-Trust architecture.

## 3. Hardware Device Trust Management UI
- **Why it is needed:** System Administrators must be able to approve, revoke, and monitor the Android hardware devices running `FORENZA-app`.
- **Current State:** `ApprovedDevice` model exists in `types/index.ts`, but the `app/admin/devices` UI to manage them is missing.
- **Can it be implemented locally?:** Yes.
- **Backend Dependency?:** Supabase `approved_devices` table.
- **Security Implications:** Medium. Prevents rogue Android apps from syncing data.

## 4. Advanced AI Proxy Rate-Limiting
- **Why it is needed:** To prevent malicious officers from exhausting the Groq/NVIDIA AI API limits via the Next.js API routes.
- **Current State:** Basic AI routes exist but lack strict per-user rate limiting using a store/Redis.
- **Can it be implemented locally?:** Yes, using standard Next.js memory cache or Vercel KV (simulated locally).
- **Backend Dependency?:** Requires KV/Redis for distributed limiting (if deployed).
- **Security Implications:** Prevents Denial of Wallet (DoW) attacks.
