# FORENZA-web Chain of Custody

The Chain of Custody (CoC) is the most critical forensic element of the platform. The web application visualizes the sequential log of custody events recorded in the Supabase backend.

## Transfer Sequence

```mermaid
sequenceDiagram
    actor Officer
    participant App as FORENZA App
    participant Web as FORENZA Web
    participant DB as Supabase DB
    actor Custodian

    Officer->>App: Initiate Transfer (Generates QR)
    App->>DB: Log IN_TRANSIT & create QrToken
    App-->>Officer: Displays Secure QR Code
    
    Custodian->>Web: Opens Vault Dashboard
    Officer->>Custodian: Shows QR Code
    Custodian->>Web: Scans QR Code
    Web->>DB: Validate QrToken
    
    alt Token Valid
        DB-->>Web: Success
        Web->>DB: Log VAULT_STORED (Sender: Officer, Receiver: Custodian)
        Web-->>Custodian: Display "Transfer Complete"
    else Token Invalid/Expired
        DB-->>Web: Error
        Web-->>Custodian: Display "Transfer Rejected"
    end
```

## Data Rendered in UI
When rendering the Custody Log table, the Web Application joins the `custody_logs` table with the `profiles` table to resolve `sender_id` and `receiver_id` into human-readable badge numbers and names, ensuring auditors can instantly identify personnel.
