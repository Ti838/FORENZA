# SYSTEM ARCHITECTURE

## Architectural Overview
The FORENZA Web Application utilizes a Serverless React architecture via Next.js (App Router), delegating absolute authority for data persistence, real-time sync, and Row Level Security (RLS) to Supabase.

```mermaid
graph TD
    %% User Tier
    Client[Web Browser]
    
    %% Next.js Application Tier
    subgraph "FORENZA-web (Next.js App Router)"
        Middleware[Next.js Middleware<br/>Auth & Route Protection]
        RSC[React Server Components<br/>Direct DB Fetching]
        ClientComponents[Client Components<br/>Interactivity & Maps]
        API_Routes[Next.js API Routes<br/>Secure Endpoints]
    end
    
    %% Backend/Infrastructure Tier
    subgraph "External Backend Infrastructure"
        Auth[Supabase Auth<br/>JWT Issuance]
        Postgres[(Supabase PostgreSQL<br/>with RLS)]
        Storage[Supabase Storage<br/>Encrypted Evidence]
        AI_Provider[Groq/NVIDIA AI<br/>Classification Models]
    end
    
    %% Connections
    Client -->|HTTPS| Middleware
    Middleware -->|Verifies JWT| Auth
    Middleware -->|Forwards Valid Req| RSC
    Middleware -->|Forwards Valid Req| ClientComponents
    
    RSC -->|Secure Query via SSR| Postgres
    ClientComponents -->|Secure Query via Browser| Postgres
    ClientComponents -->|File Uploads| Storage
    
    ClientComponents -->|AI Requests| API_Routes
    API_Routes -->|Proxies Request + Secret Key| AI_Provider
```

## Key Architectural Principles
1. **Server-Side Rendering (SSR) Default:** Data fetching heavily relies on React Server Components (RSCs) in `page.tsx` files. This ensures evidence metadata is fetched securely on the server before rendering, preventing sensitive JSON data from bleeding into the client bundle.
2. **Middleware Gatekeeper:** `middleware.ts` intercepts all requests, extracts the JWT, and enforces 7-role access control mapping based on the configuration in `lib/rbac.ts`.
3. **AI Proxy Pattern:** The client browser never talks to Groq/LLMs directly. It sends requests to `/api/ai/*`, which securely attaches the `GROQ_API_KEY` on the server and forwards the request, protecting the secret.
