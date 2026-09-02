# FORENZA Web Setup Guide

## Requirements
- **Node.js:** >=18.x
- **Package Manager:** npm
- **Database:** Supabase project URL & Keys

## Environment Configuration
Copy the example environment file:
```bash
cp .env.example .env.local
```
Ensure you fill in your `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, and API keys (NVIDIA, Gemini) in `.env.local`.

## Installation & Running

```bash
# Install dependencies
npm install

# Run the development server
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

## Building for Production

```bash
# Typecheck & Lint
npm run typecheck
npm run lint

# Build the application
npm run build

# Start the production server
npm run start
```
