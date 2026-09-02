# FORENZA-web Evidence Workflow

This document illustrates the complete lifecycle of evidence as handled by the FORENZA Web Application.

## Evidence Lifecycle State Machine

```mermaid
stateDiagram-v2
    [*] --> REGISTERED : Officer creates record
    REGISTERED --> CAPTURED : Hardware captures media & hashes
    CAPTURED --> SEALED : Officer finalizes classification
    
    SEALED --> IN_TRANSIT : QR Transfer Initiated
    IN_TRANSIT --> VAULT_STORED : Vault Custodian Receives
    IN_TRANSIT --> LAB_RECEIVED : Lab Analyst Receives
    
    VAULT_STORED --> IN_TRANSIT : Checked out
    LAB_RECEIVED --> UNDER_ANALYSIS : Lab work begins
    
    UNDER_ANALYSIS --> ANALYSIS_COMPLETED : Report Uploaded
    ANALYSIS_COMPLETED --> VAULT_STORED : Returned to Vault
    
    VAULT_STORED --> COURT_SUBMITTED : Judicial Chamber Access Granted
    COURT_SUBMITTED --> ARCHIVED : Case Closed
```

## Workflow Constraints
1. **Irreversible Hashing:** Once the state moves to `CAPTURED`, the `master_hash` and `file_sha256` are permanently locked.
2. **Strict Handoffs:** Evidence cannot jump from `SEALED` to `LAB_RECEIVED` without a logged `IN_TRANSIT` event to preserve the Chain of Custody.
