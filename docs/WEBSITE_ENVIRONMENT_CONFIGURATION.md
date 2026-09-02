# FORENZA-web Environment Configuration

This document outlines the required environment variables for the FORENZA Web Application.

> [!CAUTION]
> Never commit `.env.local` to version control. Never expose Service Role keys or Private APIs to the browser (Next.js `NEXT_PUBLIC_` variables).

| Variable | Required | Purpose | Client/Server | Secret? |
| -------- | -------- | ------- | ------------- | ------- |
| `NEXT_PUBLIC_SUPABASE_URL` | YES | URL of the Supabase backend. | Client & Server | No |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | YES | Anonymous public key for Supabase API requests. | Client & Server | No |
| `SUPABASE_SERVICE_ROLE_KEY` | NO | Admin key used exclusively for bypassing RLS in secure server-side administrative tasks. | Server Only | **YES** |
| `NEXT_PUBLIC_MAPTILER_KEY` | YES | MapTiler API key for rendering the interactive Geofence/Live tracking maps. | Client | No |
| `GROQ_API_KEY` | YES | Private API key for routing AI requests to Groq (LLaMA/Mistral). | Server Only | **YES** |

## Best Practices
- **Client vs Server:** Only variables prefixed with `NEXT_PUBLIC_` are bundled into the browser JavaScript.
- **Server Routes:** Files in `app/api/*` and Server Actions (`"use server"`) can safely read non-public variables.
