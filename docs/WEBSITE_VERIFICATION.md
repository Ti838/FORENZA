# FORENZA-web Verification Center

The Verification Center allows Judges and Auditors to cryptographically verify the integrity of evidence stored in the system.

## Verification Logic

```mermaid
flowchart TD
    Start[User Clicks 'Verify Integrity']
    
    FetchDB[Fetch Stored Hash from DB]
    FetchStorage[Fetch Binary File from Storage]
    
    CalcHash[Calculate SHA-256 of Binary File]
    
    Compare{Does DB Hash == Calc Hash?}
    
    Compare -- YES --> Valid[Display: INTEGRITY VERIFIED]
    Compare -- NO --> Invalid[Display: COMPROMISED / TAMPERED]
    
    Valid --> LogEvent[Log 'INTEGRITY_VERIFIED' Event]
    Invalid --> AlertEvent[Log 'INTEGRITY_FAILED' Security Event]
```

## Frontend Display
The UI strictly uses Red (`bg-red-500`) for failures and Green (`bg-green-500`) for successes. If the `INTEGRITY_FAILED` event is triggered, the evidence is visually quarantined on the dashboard.
