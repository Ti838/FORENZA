# FORENZA — Data Privacy & Evidence Confidentiality
**Document ID:** `DOC-PRIVACY-2026-001`

---

## 1. Privacy Principles & Safeguards

1. **Zero-Trust Media Isolation:** Raw forensic evidence photos and videos are stored in private encrypted storage buckets. They are never accessible via public URLs; access is granted strictly through short-lived signed URLs generated post-authorization.
2. **PII Minimization in Passports:** The Evidence Integrity Passport (`FZ-PASS`) packages cryptographic hashes, state DAGs, and digital signatures without bundling raw media bytes or unredacted personal information.
3. **Location Privacy:** Precise GPS coordinates captured at evidence acquisition are protected by role-based access control. Public dossiers and derivative exhibits do not reveal unnecessary high-precision coordinates unless required by judicial warrant.
4. **AI Processing Privacy:** The server-side AI integration (`web/lib/ai/gemini.ts`) transmits image bytes for classification using private, authenticated API endpoints. API keys are strictly confined to the backend server and never sent to client devices.
5. **Separation of Duties:** Administrators manage accounts and devices but have no ability to access or view sealed case evidence unless explicitly authorized on the case roster.
