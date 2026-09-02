# SECURITY

## Overview
This document outlines the security controls currently implemented in the FORENZA-web repository.

## Implemented Security Controls

### 1. Route Authorization (Middleware)
- **Status:** IMPLEMENTED
- **Mechanism:** `middleware.ts` intercepts all Next.js App Router requests. It extracts the Supabase JWT, validates it via `getUser()`, checks the `app_role` claim against the `ROUTE_ROLES` dictionary, and deflects unauthorized users to `/unauthorized`.

### 2. Cryptographic Integrity (Evidence Hashing)
- **Status:** IMPLEMENTED
- **Mechanism:** The frontend uses the Web Crypto API to calculate the SHA-256 hash of a downloaded evidence binary. This is compared against the `master_hash` stored in the database. A mismatch explicitly triggers a red UI failure state.

### 3. API Key Protection (Proxy Pattern)
- **Status:** IMPLEMENTED
- **Mechanism:** The `GROQ_API_KEY` is completely isolated in the Node.js server environment (Server Actions / API Routes). The client only sends generic prompts to the `/api/ai/*` endpoints.

## Controls Requiring Future Configuration

### 1. Database Row Level Security (RLS)
- **Status:** CONFIGURATION REQUIRED
- **Mechanism:** While the frontend is structured to expect RLS, the actual PostgreSQL RLS policies must be applied directly in the future production Supabase project.

### 2. API Rate Limiting (DDoS / DoW Protection)
- **Status:** NOT IMPLEMENTED
- **Mechanism:** The AI proxy routes lack strict Redis-based rate limiting, meaning a compromised account could spam the Groq API and cause a Denial of Wallet.

### 3. Multi-Factor Authentication (MFA)
- **Status:** PARTIAL
- **Mechanism:** The UI structure exists, but Supabase AAL2 enforcement is not fully integrated.
