# FORENZA Algorithm & Forensic Integrity Audit

This document classifies the security and forensic algorithms claimed by the FORENZA platform based on actual source code implementation.

| Algorithm / Standard | Purpose | Status | Notes |
|----------------------|---------|--------|-------|
| **SHA-256** | Evidence Data Integrity | `[IMPLEMENTED]` | Generated immediately upon capture by the Android client using the Dart `crypto` package. Verified by the Next.js backend on sync. |
| **AES-256-GCM** | Offline Vault Encryption | `[IMPLEMENTED]` | Implemented at the platform level via Flutter secure storage (SharedPreferences/Keystore/Keychain). Protects evidence when the device has no network. |
| **Haversine Formula** | Geofence Distance Calculation | `[IMPLEMENTED]` | Used within the Geofence Service to calculate if an officer is physically within bounds of a crime scene. |
| **Ed25519** | Cryptographic Signatures for Custody | `[PLANNED]` | Currently, chain-of-custody transfers rely on JWT authorization and server-side timestamps. True non-repudiation using asymmetric Ed25519 signing keys on the mobile device is planned for v2. |
| **Merkle Trees** | Blockchain-like Audit Trails | `[PLANNED]` | Not yet found in source code. Planned for immutable enterprise audit logs. |
| **Cosine Similarity** | AI Text/Image Discrepancy Matching | `[IMPLEMENTED]` | Utilized within the Python/Next.js AI pipeline to determine if an officer's manual description matches the AI's understanding of the image. |
| **HMAC** | API Request Authentication | `[NOT FOUND]` | Replaced by Supabase JWTs running over TLS 1.3. |

*Note: This audit is continuously updated as new features are moved from `[PLANNED]` to `[IMPLEMENTED]`.*
