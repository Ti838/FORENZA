# 🛡️ FORENZA — Trusted Evidence. True Justice.

> **Forensic Evidence Chain of Custody & Tamper-Evident Audit Platform**  
> Certified Electronic Forensic Records under Federal Rules of Evidence Rule 902(14).

![FORENZA Logo](web/public/logo.png)

---

## 📑 Complete Technical Documentation

All project documentation with **Mermaid architecture & sequence diagrams** is located in the [`/docs`](docs) directory:

| Document | Description | Key Diagrams |
|---|---|---|
| 📐 [**System Architecture**](docs/SYSTEM_ARCHITECTURE.md) | High-level system topology, microservices, and client layers. | Component Topology, Auth & Device Binding Sequence |
| 🔄 [**Evidence Lifecycle**](docs/EVIDENCE_LIFECYCLE.md) | 11-step evidence state machine and transition permissions. | State Machine Diagram, Geofence Override Sequence |
| 🔐 [**Cryptographic Specification**](docs/CRYPTOGRAPHIC_SPECIFICATION.md) | Canonical JSON, SHA-256 master hashing & custody chain. | Hash Chain Structure, Tamper Detection Flow |
| 🗄️ [**Database Schema (ERD)**](docs/DATABASE_SCHEMA.md) | 15 PostgreSQL migration schemas, foreign keys, and indexes. | Complete Entity Relationship Diagram (ERD) |
| ⚡ [**REST API Reference**](docs/API_REFERENCE.md) | Complete endpoints, request/response bodies, and RBAC matrix. | API Routing & Access Control Flow |
| 🚀 [**Deployment Runbook**](docs/DEPLOYMENT_RUNBOOK.md) | Vercel, Supabase Cloud, and FastAPI Docker deployment. | CI/CD Pipeline Diagram, Key Rotation Guide |

---

## 🏗️ Tech Stack

- **Web Application**: Next.js 15 (App Router), React 19, TypeScript 5, Tailwind CSS v4, Lucide Icons, jsPDF.
- **Mobile Application**: Flutter / Dart (Riverpod, GoRouter, Camera, Geolocator, QrFlutter, MobileScanner).
- **Database & Auth**: Supabase (PostgreSQL 15+, Row-Level Security, Database Triggers).
- **AI Classification**: FastAPI (Python 3.11), ONNX Runtime (EfficientNet-B0 fine-tuned on forensic items).
- **Testing**: Vitest Suite (34/34 Cryptographic, Geofence, and Hash Chain Unit Tests passing).

---

## ⚡ Quick Start Guide

### 1. Web Application
```bash
cd web
npm install
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to access the FORENZA Portal Navigator and all 7 role workstations in Light and Dark mode.

### 2. Run Test Suite
```bash
cd web
npm test
```

### 3. AI Inference Microservice
```bash
cd ai-service
pip install -r requirements.txt
python -m uvicorn app.main:app --reload --port 8000
```

### 4. Flutter Mobile App
```bash
cd mobile
flutter pub get
flutter run
```

---

## 🔒 Security Architecture Guarantees

1. **Deterministic Master Hashes**: $\text{SHA-256}(\text{CanonicalJSON}(E))$ computed over evidence ID, case ID, GPS coordinates, officer ID, timestamp, and media bytes.
2. **Append-Only Custody Chains**: Each event is chained: $H_i = \text{SHA-256}(H_{i-1} + \text{Event}_i)$.
3. **Database Trigger Enforcement**: `prevent_audit_modification` and `protect_master_hash` reject unauthorized SQL modifications at the engine level.
4. **Mandatory Device Binding**: Sessions are only granted to approved hardware identifiers.
5. **Decoy Telemetry**: Unauthorized transit tracking calls receive decoy status to prevent surveillance.

---

## ⚖️ Judicial Certification

Certified under **Federal Rules of Evidence Rule 902(14)** (Certified Data from Electronic Devices) with self-authenticating digital signatures, continuous hash verification, and printable Court Dossiers.
