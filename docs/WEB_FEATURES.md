# FORENZA Web Features

The FORENZA-web platform serves as the central command for the forensic system.

### [IMPLEMENTED] Dashboards
- **Officer Dashboard:** Web view for officers to manage their active cases and evidence.
- **Judge Dashboard:** Specialized view for reviewing case dossiers and timeline discrepancies.
- **Lab Dashboard:** Workflow for checking in evidence for analysis.

### [IMPLEMENTED] Judicial Timeline
- Visual, chronological display of the entire chain of custody for any given piece of evidence.
- Highlights AI-flagged anomalies (e.g., "Transfer occurred outside of geofence bounds").

### [IMPLEMENTED] Case Management
- Full CRUD operations for Cases, linking multiple pieces of evidence, suspects, and authorized personnel.

### [IMPLEMENTED] AI Review Workflows
- Automated inspection of uploaded evidence imagery.
- Generation of suggested tags and discrepancy reports.

### [IMPLEMENTED] Desktop Application
- The platform can be compiled using Tauri into a standalone Windows/macOS/Linux desktop application (`desktop/` folder) for officers needing native OS integration while retaining the full web capability.
