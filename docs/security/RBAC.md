# ROLE-BASED ACCESS CONTROL (RBAC)

This document defines the strict Role-Based Access Control matrix for the web platform, based on the implementation found in `lib/rbac.ts`.

## The 7-Role Architecture

The system defines 7 distinct roles mapped to `AppRole` in the database schema:

1. **INVESTIGATING_OFFICER**: Field data capture and initial classification.
2. **SUPERVISOR**: Team oversight and geofence override approvals.
3. **VAULT_CUSTODIAN**: Secure locker management and physical custody handoffs.
4. **LAB_ANALYST**: Forensic laboratory testing and PDF report generation.
5. **JUDGE**: Read-only verification of finalized `COURT_SUBMITTED` evidence.
6. **AUDITOR**: System-wide compliance and security log monitoring.
7. **ADMIN**: User account management and device trust provisioning.

## Permission Matrix

| Feature | Officer | Supervisor | Vault | Lab | Judge | Auditor | Admin |
| ------- | ------- | ---------- | ----- | --- | ----- | ------- | ----- |
| **Login / Dashboard** | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED | IMPLEMENTED |
| **Capture Evidence** | IMPLEMENTED | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED |
| **Receive Custody** | DENIED | DENIED | IMPLEMENTED | IMPLEMENTED | DENIED | DENIED | DENIED |
| **View Audit Logs** | SELF ONLY | TEAM ONLY | SELF ONLY | SELF ONLY | DENIED | FULL ACCESS | SYSTEM ONLY |
| **Manage Users** | DENIED | DENIED | DENIED | DENIED | DENIED | DENIED | IMPLEMENTED |

> [!CAUTION]
> The permissions listed above are enforced by the UI and Next.js middleware. True security *must* be enforced by configuring PostgreSQL RLS on the production backend. The frontend UI only hides elements.
