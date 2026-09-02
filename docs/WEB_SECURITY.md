# FORENZA Web Security

## Authentication & Authorization
- **Authentication:** Handled by Supabase Auth (JWT). 
- **Role-Based Access Control (RBAC):** Middleware (`middleware.ts`) intercepts requests and enforces role-based access. Users are assigned roles (e.g., `officer`, `admin`, `judge`, `lab_tech`).
- **MFA:** Multi-factor authentication is configured for high-level operations (e.g., vault seal override).

## Data Security Boundaries
- **Supabase RLS:** Row-Level Security ensures that even if an API endpoint is compromised, the database will reject queries for data the user does not own or have access to.
- **Audit Logging:** Every sensitive action (login, custody transfer, evidence viewing) generates an immutable audit record in the database.

## Algorithms
- **[IMPLEMENTED] Hashing:** SHA-256 for evidence integrity checks.
- **[PLANNED] Ed25519 Signatures:** Future plans for fully cryptographic non-repudiation of custody transfers. Currently handled via timestamped database flags and JWT verification.
