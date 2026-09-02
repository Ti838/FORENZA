# FORENZA-web Architecture

## Architectural Overview
The FORENZA Web Application utilizes a Serverless React architecture via Next.js (App Router). It delegates absolute authority for data persistence, real-time sync, and Row Level Security (RLS) to Supabase.

```mermaid
graph TD
    %% User Tier
    Client[Web Browser]
    
    %% Next.js Application Tier
    subgraph "FORENZA-web (Next.js App Router)"
        Middleware[Next.js Middleware<br/>Auth & Route Protection]
        RSC[React Server Components<br/>Direct DB Fetching]
        ClientComponents[Client Components<br/>Interactivity & Maps]
        API_Routes[Next.js API Routes<br/>AI & Secure Endpoints]
    end
    
    %% Backend/Infrastructure Tier
    subgraph "Supabase / External Services"
        Auth[Supabase Auth<br/>JWT Issuance]
        Postgres[(PostgreSQL<br/>with RLS)]
        Storage[Supabase Storage<br/>Encrypted Evidence]
        AI_Provider[Groq/NVIDIA AI<br/>Classification Models]
    end
    
    %% Connections
    Client -->|HTTPS| Middleware
    Middleware -->|Verifies JWT| Auth
    Middleware -->|Forwards Valid Req| RSC
    Middleware -->|Forwards Valid Req| ClientComponents
    
    RSC -->|Secure Query via SSR Client| Postgres
    ClientComponents -->|Secure Query via Browser Client| Postgres
    ClientComponents -->|File Uploads| Storage
    
    ClientComponents -->|AI Requests| API_Routes
    API_Routes -->|Proxies Request + Secret Key| AI_Provider
```

## Key Architectural Decisions
1. **Server-Side Rendering (SSR) Default:** Data fetching heavily relies on RSCs in `page.tsx` files. This ensures evidence metadata is fetched securely on the server before rendering, preventing sensitive data from bleeding into the client bundle.
2. **Middleware Route Protection:** `middleware.ts` is the gatekeeper. It intercepts all requests, extracts the JWT, fetches the user profile, and compares the user's `AppRole` against the `ROUTE_ROLES` mapping.
3. **AI Proxy Pattern:** The client never talks to Groq directly. It sends requests to `/api/ai/*`, which attaches the `GROQ_API_KEY` and forwards the request, protecting the secret.
