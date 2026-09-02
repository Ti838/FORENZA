# LOCAL DEVELOPMENT GUIDE

This document instructs a future developer on how to configure and run the FORENZA-web platform locally.

> [!CAUTION]
> **Deployment is intentionally not configured at this development stage.** Do not attempt to push this repository to Vercel/Netlify without first completing the Security & Database configuration.

## Prerequisites
- Node.js (v20+)
- npm (v10+)
- Access to a Supabase Project (Local Docker or Cloud)
- MapTiler API Key (Free Tier)
- Groq API Key (Free Tier)

## Step-by-Step Setup

1. **Clone the Repository**
   ```bash
   git clone https://github.com/Ti838/FORENZA-web.git
   cd FORENZA-web
   ```

2. **Install Dependencies**
   ```bash
   npm install
   ```

3. **Configure Environment Variables**
   Copy the example file to create your local secrets file.
   ```bash
   cp .env.example .env.local
   ```
   *Open `.env.local` and populate the placeholders. Do NOT commit this file.*

4. **Run Quality Checks**
   Ensure the codebase is structurally sound before starting.
   ```bash
   npm run typecheck
   npm run lint
   ```

5. **Start the Development Server**
   ```bash
   npm run dev
   ```
   The application will be accessible at `http://localhost:3000`.

## Testing
Unit and integration tests are configured via Vitest.
```bash
npm run test
```
