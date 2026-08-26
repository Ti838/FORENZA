# FORENZA — Unified REST API Contract Reference

All FORENZA client targets (Web, Desktop, and Android Mobile) communicate with this authoritative central backend API.

---

## 1. Authentication & Device Management
* `POST /api/auth/login`: Authenticate with email/password and platform device ID binding.
* `POST /api/auth/logout`: Server-side session termination and immutable audit log entry.
* `POST /api/auth/mfa/enroll`: Generate Supabase TOTP factor and QR URI.
* `POST /api/auth/mfa/verify`: Verify 6-digit TOTP challenge and upgrade session to AAL2.
* `GET /api/auth/session`: Retrieve active user profile, badge number, and RBAC roles.
* `GET /api/admin/devices`: Query list of registered hardware devices.
* `POST /api/admin/devices`: Approve device binding or revoke session access immediately.

## 2. Case & Evidence Lifecycle
* `GET /api/cases`: List active investigation cases within user's assigned scope.
* `POST /api/cases`: Create case record with crime scene GPS coordinates.
* `GET /api/cases/:id`: Detailed case metadata and assigned team members.
* `GET /api/evidence`: Query evidence items with joined classification and custody status.
* `POST /api/evidence`: Register new evidence item under an active case.
* `POST /api/evidence/:id/capture`: Record field acquisition GPS, accuracy, and timestamp.
* `POST /api/evidence/:id/media`: Upload evidence media with authoritative server-side SHA-256 byte hashing.
* `GET /api/evidence/:id/media-url`: Generate short-lived (60s TTL) private signed download URL.
* `POST /api/evidence/:id/seal`: Calculate deterministic Master Evidence Hash and generate 24h verification QR token.

## 3. AI Forensic Subsystem (Google Gemini 2.0 Flash)
* `POST /api/evidence/:id/analyze`: Server-side AI image analysis returning structured qualitative classifications.
* `POST /api/evidence/:id/classification`: Record human confirmation or manual override decision.
* `POST /api/ai/compare-reports`: Cross-compare officer field description with lab findings to detect discrepancies.
* `POST /api/ai/assistant`: Context-bounded authorized forensic query assistant.

## 4. Custody, Vault & In-Transit Telemetry
* `POST /api/evidence/:id/transfer`: Generate 15-minute single-use cryptographically signed handover token.
* `POST /api/evidence/:id/receive`: Verify handover token and extend blockchain-style hash chain ($H_n = \text{SHA256}(H_{n-1} + \text{Event}_n)$).
* `POST /api/evidence/:id/vault`: Index physical vault location (Vault ID, Rack, Shelf, Bin).
* `POST /api/evidence/:id/telemetry`: Record real-time GPS stream for evidence currently in transit.
* `GET /api/evidence/:id/telemetry`: Retrieve live transit route (or synthetic decoy coordinates for unauthorized callers).
* `GET /api/overrides`: Query geofence perimeter override requests.
* `POST /api/overrides`: Submit supervisor override request for captures outside 500m perimeter.
* `PATCH /api/overrides/:id`: Supervisor approval/rejection decision.

## 5. Forensic Laboratory Workstation
* `POST /api/lab/:id/receive`: Laboratory intake of physical evidence.
* `POST /api/lab/:id/sample`: Register sub-sample aliquot and initial quantity.
* `POST /api/lab/:id/report`: Upload certified PDF lab findings and generate SHA-256 report seal.

## 6. Judicial Review & Audit
* `GET /api/judicial/:caseId/timeline`: Query complete chronological evidence lifecycle event stream.
* `POST /api/evidence/:id/verify`: Execute live mathematical integrity verification across all chain nodes.
* `POST /api/dossier/:caseId/generate`: Stream dynamically generated Rule 902(14) Certified Court Dossier PDF.
* `GET /api/audit`: Query append-only audit ledger and export signed JSONL stream.
