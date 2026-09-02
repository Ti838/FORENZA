# AUTHENTICATION FLOW

The application relies on Supabase Auth (JWT) integrated with Next.js Middleware.

## Standard Authentication Sequence

```mermaid
sequenceDiagram
    actor User
    participant NextJS as Next.js (Client/Server)
    participant Middleware as middleware.ts
    participant Supabase as Supabase Auth

    User->>NextJS: Submits Email/Password
    NextJS->>Supabase: POST /auth/v1/token
    
    alt Invalid Credentials
        Supabase-->>NextJS: 401 Unauthorized
        NextJS-->>User: Show Error Message
    else Valid Credentials
        Supabase-->>NextJS: Returns JWT (Access & Refresh Tokens)
        NextJS->>NextJS: Stores tokens in secure HTTP-only cookies
        NextJS-->>User: Redirects to /dashboard
    end
    
    User->>Middleware: Requests Protected Route (e.g. /judge)
    Middleware->>Middleware: Extracts JWT from Cookie
    Middleware->>Supabase: getUser() validation
    
    alt Invalid JWT or Unauthorized Role
        Middleware-->>User: Redirect to /login or /unauthorized
    else Valid & Authorized
        Middleware-->>NextJS: Pass request to React Server Component
        NextJS-->>User: Renders secure dashboard
    end
```

## Critical Security Note
The middleware specifically uses `supabase.auth.getUser()` rather than `getSession()`. This ensures the JWT is validated cryptographically against the Supabase backend on every page load, preventing session hijacking or stale token exploitation.
