# DEVELOPER HANDOVER

Welcome to the FORENZA Web Application repository. This document is designed to get you up to speed immediately.

## What this project is
FORENZA is an Enterprise Forensic Evidence Platform. This specific repository is the Next.js App Router Web Application. It serves as the administrative and judicial dashboard, complementing the Android Field App.

## Current State
**Development / Demonstration Stage.**
The architecture is solid, the UI is built, and the 7-role middleware is enforced. However, it is **not deployed** and the backend (Supabase) requires your provisioning.

## What is Implemented
- The complete Next.js UI structure for all 7 roles.
- `middleware.ts` for JWT-based route protection.
- The AI Proxy route (`/api/ai/classify`).
- Cryptographic hash verification logic (`lib/verifier/hash.ts`).

## What is Partial
- Multi-Factor Authentication (MFA) UI exists, but backend enforcement is missing.

## What is Planned / Not Implemented
- **Judicial Dossier PDF Generation:** You will need to implement the PDF builder using `jspdf`.
- **Hardware Device Trust UI:** A table in `/admin` to approve Android Device IDs is required.

## What Needs Configuration
- **Supabase:** You must provision a project and apply the SQL schemas (found in `types/index.ts` representations).
- **Environment Variables:** See `docs/development/ENVIRONMENT_CONFIGURATION.md`.

## Important Directories
- `app/`: Where the Next.js pages and API routes live.
- `lib/`: Where core business logic (like RBAC) lives.
- `types/`: Where the TypeScript definitions reflecting the database live.

## Things That Must NOT Be Changed Casually
- **`middleware.ts`**: The entire security posture relies on this file accurately routing based on JWT claims.
- **`lib/rbac.ts`**: Altering this matrix can grant investigating officers access to administrative panels.

## Recommended Next Steps
1. Provision a local or cloud Supabase instance.
2. Build the Judicial Dossier PDF generator.
3. Implement Redis rate-limiting on the AI proxy.
4. Prepare the project for a Vercel staging deployment.
