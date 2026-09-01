# 🛡️ FORENZA — Full Repository & System File Structure
**Creator & Intellectual Property Owner:** Timon Biswas (`timonbiswas33@gmail.com`)  
**Standard:** Enterprise Zero-Trust Architecture  
**Last Updated:** September 2026  

---

```
FORENZA/
│
├── 📜 LICENSE                             # Source-Available Proprietary License (Timon Biswas)
├── 📜 LICENSE.md                          # Formatted Markdown Legal & Anti-Cloning Agreement
├── 📖 README.md                           # Master Project Overview, Badges & Quickstart
├── ⚙️ .env.example                         # Environment Variables Template
├── 🐳 docker-compose.yml                  # Production & Local Container Orchestration
│
├── 📁 .github/                            # CI/CD Workflows & Security Automation
│   └── workflows/
│       ├── ci.yml                         # Automated Vitest & Typecheck Pipeline
│       └── release.yml                    # Cross-Platform Binary Build Pipeline
│
├── 📁 supabase/                           # PostgreSQL Zero-Trust Database & Schema
│   ├── complete_unified_schema.sql        # Master 40-Table Production Schema (RLS + Triggers)
│   ├── config.toml                        # Local Supabase CLI Configuration
│   ├── migrations/
│   │   └── 20240001000001_forenza_core_v2.sql  # Master Production Migration
│   └── legacy_migrations/                 # Consolidated Historical Migration Archive
│
├── 📁 docs/                               # Comprehensive Technical Documentation
│   ├── README.md                          # Master Documentation Index & Navigator
│   ├── FORENZA_Algorithm_Documentation.md # Master Mathematical & Algorithm Specification
│   ├── FORENZA_Algorithm_Documentation.docx # Editable Word Format
│   ├── FORENZA_Algorithm_Documentation.pdf # Printable PDF Format
│   ├── SYSTEM_ARCHITECTURE.md             # End-to-End System Topology
│   ├── CRYPTOGRAPHIC_SPECIFICATION.md     # RFC 8785, Ed25519 & SHA-256 Specs
│   ├── EPRA.md                            # Reconciliation & Divergence Pointer (FZ-EPRA)
│   ├── AI_ARCHITECTURE.md                 # Multi-Model AI Orchestrator Topology
│   ├── AI_MODELS.md                       # Model Responsibility & Execution Matrix
│   ├── AI_LIVE_VERIFICATION.md            # Live API Test Audit Log (Groq & Gemini)
│   ├── AI_SECURITY.md                     # Adversarial Prompt Injection Mitigations
│   ├── AI_RAG.md                          # Case-Isolated Semantic Retrieval Specs
│   ├── AI_PROVENANCE.md                   # AI Run Hashing & Human Review Specs
│   ├── THREAT_MODEL.md                    # STRIDE Threat Matrix & Mitigations
│   ├── COMPLIANCE_MAPPING.md              # ISO/IEC 27037 & FRE Rule 902(14)
│   └── DEPLOYMENT_RUNBOOK.md              # Vercel & Supabase Cloud Deployment Guide
│
├── 📁 web/                                # Next.js 15 Full-Stack Web Workstation
│   ├── package.json                       # Dependencies & Scripts
│   ├── tsconfig.json                      # Strict TypeScript Configuration
│   ├── .env.local                         # Active Local Environment (Ignored from Git)
│   │
│   ├── 📁 app/                            # Next.js App Router (Pages & API Routes)
│   │   ├── (auth)/                        # Authentication Route Group
│   │   │   ├── login/page.tsx             # Zero-Trust Login (Passkey / PIN / Password)
│   │   │   └── mfa/page.tsx               # TOTP Multi-Factor Authentication
│   │   ├── officer/page.tsx               # Field Officer Workstation
│   │   ├── vault/page.tsx                 # Vault Custodian Intake & Handover
│   │   ├── lab/page.tsx                   # Forensic Lab Sample Lineage Workstation
│   │   ├── judge/page.tsx                 # Judicial Review & Adjudication Chamber
│   │   ├── supervisor/page.tsx            # Chain-of-Custody Audit & Oversight
│   │   ├── auditor/page.tsx               # Independent Cryptographic Audit Chamber
│   │   ├── admin/page.tsx                 # Device Attestation & User RBAC Admin
│   │   │
│   │   └── 📁 api/                        # Authoritative REST API Gateways
│   │       ├── 📁 auth/                   # Session, Login, Logout, MFA, Attestation
│   │       ├── 📁 cases/                  # Case Lifecycle & Assigned Officers
│   │       ├── 📁 evidence/               # Seal, Register, State Append, Media Upload
│   │       ├── 📁 custody/                # Nonce-Protected Single-Use Transfers
│   │       ├── 📁 sync/                   # Asynchronous Offline Vault Sync & Replay Check
│   │       ├── 📁 verify/                 # Independent Merkle Chain & Passport Verifier
│   │       └── 📁 ai/                     # FZ-AI Multi-Model Orchestration Endpoints
│   │           ├── orchestrate/route.ts   # General Assistive Reasoning Gateway
│   │           ├── pipeline/image/route.ts # Vision Classification Pipeline
│   │           ├── pipeline/discrepancy/route.ts # EPRA Discrepancy Pipeline
│   │           ├── pipeline/search/route.ts # Case-Isolated Semantic RAG
│   │           ├── review/route.ts        # Human Judicial Review Recording
│   │           └── health/route.ts        # Provider Health Monitoring
│   │
│   ├── 📁 components/                     # Reusable Modern UI Components
│   │   ├── brand/                         # Official FORENZA Logo & Vector Badges
│   │   ├── custody/                       # Interactive Merkle State DAG Timeline
│   │   ├── forensic/                      # MapLibre GPS Geofence Maps & Scanners
│   │   └── theme/                         # High-Contrast Light / Dark Theme Switcher
│   │
│   ├── 📁 lib/                            # Core Forensic Engines & Libraries
│   │   ├── 📁 ai/                         # FZ-AI Multi-Model Subsystem
│   │   │   ├── orchestrator.ts            # Central FZ-AI Orchestrator
│   │   │   ├── router.ts                  # Task Router & Fallback Policy
│   │   │   ├── context-builder.ts         # Data Minimization & Prompt Injection Defense
│   │   │   ├── ai-provenance.ts           # Tripartite Hash Provenance Recorder
│   │   │   ├── human-review.ts            # Human Judicial Review Lifecycle Engine
│   │   │   ├── 📁 providers/              # Groq, Gemini, NVIDIA, and Mock Adapters
│   │   │   └── 📁 pipelines/              # 5 Multi-Model Forensic Execution Pipelines
│   │   ├── 📁 crypto/                     # RFC 8785 JCS, SHA-256, Ed25519 Signatures
│   │   ├── 📁 state/                      # Merkle Evidence State Engine (FZ-TWIN)
│   │   ├── 📁 reconciliation/             # EPRA & First Divergence Engine (FZ-DIV)
│   │   ├── 📁 vault/                      # AES-256-GCM Offline Vault Engine
│   │   ├── 📁 sync/                       # Monotonic Sequence & Offline Replay Sync
│   │   ├── 📁 passport/                   # FZ-PASS Package Creation & Extraction
│   │   ├── 📁 verifier/                   # Standalone Independent Verifier Engine
│   │   ├── geofence.ts                    # Haversine Geodesic Distance Engine
│   │   └── rbac.ts                        # 7-Role Permission Enforcement Matrix
│   │
│   └── 📁 __tests__/                      # Automated Vitest Test Suites (19 Files, 112 Tests)
│
├── 📁 mobile/                             # Android / iOS Flutter Field Application
│   ├── lib/
│   │   ├── core/services/                 # Local AES-256-GCM Vault & Offline Sync
│   │   └── ui/screens/                    # Camera Sealer, QR Scanner, Field Chain
│   └── pubspec.yaml                       # Flutter 3.16+ Dependencies
│
├── 📁 desktop/                            # Cross-Platform Desktop Workstation (Tauri 2.x)
│   ├── src-tauri/                         # Rust Core (Hardware Key Binding & DPAPI)
│   ├── windows/                           # Windows MSIX Installer & Setup Scripts
│   ├── macos/                             # macOS DMG Bundler & Keychain Integration
│   └── linux/                             # Linux AppImage & Secret Service Binding
│
└── 📁 ai-service/                         # Local Python / ONNX Worker Service (Optional)
    ├── Dockerfile                         # Container Configuration
    └── requirements.txt                   # Inference Dependencies
```
