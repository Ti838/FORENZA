# FORENZA-web Local Development Guide

This guide provides instructions for setting up and running the FORENZA Web Application locally for academic demonstration, testing, and development.

> [!WARNING]
> This project is currently configured for LOCAL DEVELOPMENT ONLY. Do not deploy this application to production without completing the Security Checklist.

## Prerequisites
- Node.js (v20+ recommended)
- npm (v10+ recommended)
- Local Supabase instance or Development Supabase Cloud Project

## Setup Instructions

1. **Install Dependencies**
   Navigate to the `FORENZA-web` directory and install the Node modules:
   ```bash
   npm install
   ```

2. **Configure Environment Variables**
   Copy the example environment file and configure it:
   ```bash
   cp .env.example .env.local
   ```
   *See `WEBSITE_ENVIRONMENT_CONFIGURATION.md` for specific variable definitions.*

3. **Run the Development Server**
   Start the Next.js App Router server:
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

## Code Quality & Testing

- **Type Checking:**
  Ensure TypeScript integrity across the codebase:
  ```bash
  npm run typecheck
  ```

- **Linting:**
  Run ESLint to enforce code style:
  ```bash
  npm run lint
  ```

- **Unit Testing:**
  Execute the Vitest suite:
  ```bash
  npm run test
  ```

## Production Build Test
To verify the application can be built for future deployment (validates static generation and RSCs):
```bash
npm run build
```
