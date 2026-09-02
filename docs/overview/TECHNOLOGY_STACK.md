# FORENZA-web Technology Stack

The following technologies are explicitly used in the FORENZA-web repository (based on `package.json` inspection).

## Core Framework
- **Next.js (v15.0.0-canary.194)**: The core Serverless React framework utilizing the App Router.
- **React (v19.0.0-rc-04b058868c-20241021)**: UI library.
- **TypeScript**: Strict type-checking aligned with backend schemas.

## Backend & Database Integration
- **Supabase (`@supabase/supabase-js`, `@supabase/ssr`)**: Handles Authentication, Database (PostgreSQL) access, and Edge Storage.

## Security & Verification
- **Web Crypto API**: Native browser cryptography used for SHA-256 evidence integrity checks.
- **Zod**: Strict schema validation for API payloads and AI responses.

## UI & Styling
- **Tailwind CSS (v3.4.1)**: Utility-first CSS framework.
- **Radix UI**: Accessible, headless UI primitives (`@radix-ui/react-dialog`, `@radix-ui/react-slot`, etc.).
- **Lucide React**: Consistent iconography suite.

## Tooling & Quality
- **ESLint**: Code linting.
- **Vitest**: Unit testing framework (configured, though tests may be sparse at this stage).

---

> [!NOTE]
> **Not Found:** The repository does not currently include heavy state-management libraries (like Redux or Zustand) because the Next.js App Router (React Server Components + Supabase realtime) handles data fetching at the edge.
