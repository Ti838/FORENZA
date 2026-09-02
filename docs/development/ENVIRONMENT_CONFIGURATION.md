# ENVIRONMENT CONFIGURATION

## Overview
This document outlines the required environment variables for the FORENZA Web Application.

> [!CAUTION]
> Never commit `.env.local` to version control. Never expose Service Role keys or Private APIs to the browser (Next.js `NEXT_PUBLIC_` variables).

## .env.example Breakdown

| Variable | Scope | Purpose | Status |
| -------- | ----- | ------- | ------ |
| `NEXT_PUBLIC_SUPABASE_URL` | Public / Client-Safe | URL of the Supabase backend. | **CONFIGURATION REQUIRED** |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Public / Client-Safe | Anonymous public key for Supabase API requests. | **CONFIGURATION REQUIRED** |
| `GROQ_API_KEY` | Private / Server-Only | Private API key for routing AI classification requests to Groq (LLaMA/Mistral). | **CONFIGURATION REQUIRED** |
| `NEXT_PUBLIC_MAPTILER_KEY` | Public / Client-Safe | MapTiler API key for rendering the interactive Geofence maps. | **CONFIGURATION REQUIRED** |

## Future Integrations
If the platform migrates to an air-gapped environment, the `GROQ_API_KEY` will be replaced by a local NVIDIA NIM container URL, requiring a new private environment variable (e.g., `LOCAL_NIM_URL`).
