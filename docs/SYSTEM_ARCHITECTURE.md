# FORENZA System Architecture

## Core Philosophy
FORENZA is a unified platform separated into a **Field Operations Client** (Android App) and a **Central Intelligence & Command Platform** (Web App + Backend). 

## System Architecture Diagram

```mermaid
graph TD
    %% Android Client
    subgraph FORENZA-app
        AppUI[Flutter UI]
        Vault[(Offline Vault)]
        Sync[Sync Engine]
        
        AppUI --> Vault
        AppUI --> Sync
        Vault --> Sync
    end
    
    %% API / Backend (FORENZA-web)
    subgraph FORENZA-web
        NextAPI[Next.js API Routes]
        AIOrchestrator[AI Pipelines]
        WebUI[React/Next.js Web Interface]
        Desktop[Tauri Desktop Shell]
        
        Desktop --> WebUI
        WebUI --> NextAPI
        NextAPI --> AIOrchestrator
    end
    
    %% Infrastructure
    subgraph Infrastructure
        SupabaseDB[(PostgreSQL / Supabase)]
        Storage[(S3 Compatible Storage)]
        ExternalAI[NVIDIA / Gemini APIs]
    end
    
    %% Connections
    Sync -- HTTPS / REST --> NextAPI
    NextAPI -- SQL --> SupabaseDB
    NextAPI -- HTTP --> Storage
    AIOrchestrator -- HTTPS --> ExternalAI
    
    %% Web Client connecting to DB
    WebUI -- Supabase Client --> SupabaseDB
```

## Interconnectivity
- **Database Sharing:** Both clients interface with the same Supabase project. The web app uses SSR and API routes for heavy processing, while the mobile app connects via its Sync Engine.
- **Feature Parity:** 
  - *Android* is optimized for **capture, speed, and offline capability**.
  - *Web* is optimized for **analysis, audits, long-term case management, and judicial dossiers**.
