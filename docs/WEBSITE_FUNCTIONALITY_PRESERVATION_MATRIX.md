# FORENZA-web Functionality Preservation Matrix

This matrix documents the existing features within the `FORENZA-web` application, confirming their status and stating the action to preserve them.

| Feature | Current Implementation | Current Status | Action | Final Status |
| ------- | ---------------------- | -------------- | ------ | ------------ |
| **Authentication Middleware** | `middleware.ts` uses `@supabase/ssr` `getUser()` and checks against `ROUTE_ROLES` mapping. | Fully Functional | Preserve exactly as is. Ensures secure routing for 7 roles. | IMPLEMENTED |
| **Route Structure** | Next.js App Router with separated `(auth)`, `admin`, `auditor`, `judge`, `lab`, `officer`, `supervisor`, `vault` directories. | Fully Functional | Preserve. Avoid unnecessary nested layouts unless strictly required. | IMPLEMENTED |
| **RBAC Logic** | `lib/rbac.ts` maps `AppRole` to granular permissions (e.g. `evidence:read`, `case:create`). | Fully Functional | Preserve. It's the central authority for UI conditionals. | IMPLEMENTED |
| **Evidence Types** | `types/index.ts` contains all TypeScript interfaces mirroring Supabase. | Fully Functional | Preserve. Do not duplicate into alternative files. | IMPLEMENTED |
| **Cryptographic Hash Verification** | `lib/verifier/index.ts` (or similar) handles comparing SHA-256 hashes against canonical JSON. | Fully Functional | Preserve. Ensure UI explicitly states "VERIFIED" vs "MISMATCH". | IMPLEMENTED |
| **AI Classification UI** | Dedicated components/pages display `classification_method: 'AI_CONFIRMED'` vs `'MANUAL'`. | Partially Implemented | Preserve structure; ensure AI results are distinctly labeled to avoid hallucination confusion. | IMPLEMENTED |
| **Custody Rendering** | Renders `CustodyLog` table matching `sender_id`, `receiver_id`, `current_hash`. | Fully Functional | Preserve and enhance visual flow without removing logic. | IMPLEMENTED |
| **Role Dashboards** | Individual `dashboard/page.tsx` for each role. | Fully Functional | Preserve. Ensure data scope is strictly enforced. | IMPLEMENTED |
