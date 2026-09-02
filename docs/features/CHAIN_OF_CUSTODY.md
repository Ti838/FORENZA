# CHAIN OF CUSTODY

## Purpose
To maintain an immutable, chronologically verifiable log of all physical and digital transfers of evidence.

## Current Status
**IMPLEMENTED (UI & Logging)**

## Technical Flow
The Chain of Custody operates on cryptographic handshakes initiated by the Android Field App and verified by the Web Application.

```mermaid
sequenceDiagram
    actor Sender
    participant App as Mobile/Web UI
    participant DB as Supabase Backend
    actor Receiver

    Sender->>App: Initiate Transfer (Generates Token)
    App->>DB: Log IN_TRANSIT & create QrToken
    
    Receiver->>App: Scans QR Code / Enters Token
    App->>DB: Validate QrToken
    
    alt Token Valid
        DB-->>App: Success
        App->>DB: Log Transfer (Sender ID, Receiver ID, Timestamp)
        App-->>Receiver: Display "Transfer Complete"
    else Token Invalid/Expired
        DB-->>App: Error
        App-->>Receiver: Display "Transfer Rejected"
    end
```

## Important Files
- `components/forensic/custody-timeline.tsx` (Renders the logs)
- `types/index.ts` (Defines `CustodyLog` schema)

## Security Considerations
The frontend relies on the backend to enforce that the `sender_id` perfectly matches the currently authenticated user's JWT `sub` claim. 
