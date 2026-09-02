# FORENZA-web Functionality Matrix

This matrix evaluates the status of all major features identified in the FORENZA-web repository.

| Feature / Module | Status | Source Evidence | Main Files | Configuration Required |
| ---------------- | ------ | --------------- | ---------- | ---------------------- |
| **Authentication Flow** | IMPLEMENTED | Supabase Auth APIs | `app/(auth)/*`, `middleware.ts` | Supabase URL/Anon Key |
| **RBAC / Middleware** | IMPLEMENTED | Role checking logic | `lib/rbac.ts`, `middleware.ts` | None |
| **Evidence Listing** | IMPLEMENTED | Database fetching | `app/(roles)/*/dashboard` | Supabase DB Schema |
| **Chain of Custody** | IMPLEMENTED | Logs rendering | `components/forensic/custody` | Supabase DB Schema |
| **Cryptographic Verifier**| IMPLEMENTED | SHA-256 matching | `lib/verifier/hash.ts` | None |
| **AI Classification** | PARTIAL | Basic Groq Proxy | `app/api/ai/classify/route.ts`| `GROQ_API_KEY` |
| **MFA Enrollment** | PARTIAL | Basic Scaffold UI | `app/(auth)/mfa/page.tsx` | Supabase AAL2 Config |
| **Judicial PDF Dossier**| NOT IMPLEMENTED | `jspdf` dependency | N/A | None |
| **Device Trust UI** | NOT IMPLEMENTED | Types only | `types/index.ts` | None |
| **Deployment / CI/CD** | NOT CONFIGURED | No YAML/Actions | N/A | Vercel/AWS Setup |

> [!NOTE]
> A status of **IMPLEMENTED** means the frontend code/logic exists locally. It does not imply that the system is currently deployed or connected to a live production database.
