# FORENZA Intelligence & Command Platform (Web)

![FORENZA Web](https://via.placeholder.com/800x200.png?text=FORENZA+Intelligence+Platform)

The FORENZA Web Application is the central command, control, and intelligence platform for the FORENZA forensic ecosystem. It provides a highly secure interface for judicial review, laboratory analysis, and administrative oversight of the chain of custody.

## 🚀 Major Features
- **Judicial Timeline:** Complete, chronologically immutable visual timeline of every piece of evidence from field capture to court.
- **AI Intelligence Pipelines:** Integration with NVIDIA and Gemini to automatically detect discrepancies, perform OCR, and flag tampering.
- **Role-Based Dashboards:** Specialized, isolated views for Officers, Judges, Lab Technicians, and Auditors.
- **Cryptographic Verification:** Validates SHA-256 hashes submitted by field clients against the secure database.
- **Desktop Wrapper:** Tauri-based native desktop compilation for Windows/macOS/Linux.

## 🛠 Technology Stack
- **Framework:** Next.js (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS
- **Database / Auth:** Supabase (PostgreSQL with RLS)
- **AI Orchestration:** Custom pipeline (NVIDIA NIM, Gemini)
- **Desktop Build:** Tauri (Rust)

## 🏗 Architecture
The platform is built on Next.js Server-Side Rendering (SSR) to ensure sensitive data is never exposed to the client unnecessarily. The database relies on strict Row-Level Security (RLS) to enforce data boundaries.

Please see the [Web Architecture Documentation](docs/WEB_ARCHITECTURE.md) and the [System Architecture Diagram](docs/SYSTEM_ARCHITECTURE.md).

## ⚙️ Setup & Installation

### Prerequisites
- Node.js (v18+)
- npm
- Supabase Project

### Environment Configuration
Copy the `.env.example` file to create your local environment file:
```bash
cp .env.example .env.local
```
Ensure you populate the `NEXT_PUBLIC_SUPABASE_URL` and required API keys.

### Run Commands
```bash
# 1. Install dependencies
npm install

# 2. Start development server
npm run dev
```

## 🧪 Testing & Verification
```bash
# Typecheck
npm run typecheck

# Linting
npm run lint

# Execute Vitest Suite
npm test
```

## 📦 Building & Deployment
```bash
# Build the Next.js production bundle
npm run build

# Start production server
npm run start
```
*For deployment, standard Vercel or Docker-based Node environments are fully supported.*

## 🔗 Documentation Links
- [System Architecture](docs/SYSTEM_ARCHITECTURE.md)
- [Web Architecture](docs/WEB_ARCHITECTURE.md)
- [Database Schema (ER Diagram)](docs/WEB_DATABASE.md)
- [AI Pipelines](docs/WEB_AI.md)
- [Security & RBAC](docs/WEB_SECURITY.md)
- [Algorithm Audit](ALGORITHM_AUDIT.md)

---
*FORENZA System - Central Intelligence Platform*
