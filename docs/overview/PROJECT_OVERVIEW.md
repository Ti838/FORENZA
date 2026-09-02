# PROJECT OVERVIEW

## Purpose
**FORENZA** is an Enterprise Forensic Evidence Platform designed to bridge the gap between field investigation and courtroom validation. The web platform serves as the administrative, investigative, and judicial counterpart to the mobile field app.

## Problem Statement
Traditional digital evidence management relies heavily on paper trails, fragmented software, and high-trust environments. FORENZA solves this by applying Zero-Trust architecture, Role-Based Access Control (RBAC), and cryptographic verification (SHA-256) to ensure an immutable Chain of Custody from the crime scene to the courtroom.

## Target Users
- **Investigating Officers:** Review and enrich captured evidence.
- **Vault Custodians:** Physically scan and accept evidence into the locker.
- **Forensic Lab Analysts:** Check out evidence and append PDF analysis reports.
- **Supervisors:** Monitor active cases and approve field geofence overrides.
- **Judges:** Verify cryptographic integrity and generate judicial dossiers.
- **Auditors/Admins:** Monitor security events and manage users/hardware.

## Current Stage
**DEVELOPMENT / DEMONSTRATION**
The project is currently configured for local development and academic/thesis demonstration. Production deployment, DNS routing, and CI/CD pipelines are intentionally not configured.

## Current Implementation vs. Future Scope
* **Current Implementation:** Core authentication, 7-role middleware routing, evidence listing, chain of custody logs, and basic AI proxy architecture.
* **Future Scope:** Actual deployment to Vercel/AWS, production Supabase provisioning, robust Redis-based rate limiting, and fully styled Judicial PDF generation.

---
## Repository Structure
The repository strictly follows Next.js App Router conventions:
- `app/` - Role-based route segments (`/officer`, `/admin`, etc.)
- `lib/` - Core business logic, RBAC rules (`rbac.ts`), and crypto verifiers.
- `types/` - Centralized schema definitions matching the PostgreSQL backend.
- `docs/` - Comprehensive technical documentation.
