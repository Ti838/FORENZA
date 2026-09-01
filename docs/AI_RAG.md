# FORENZA — FZ-AI Semantic Retrieval & RAG Architecture
**Document ID:** `DOC-AI-RAG-2026-001`

---

## 1. Vector Search & Case Isolation

To protect sensitive multi-case investigation data, FORENZA enforces strict **Pre-Retrieval Authorization Filtering**:

```
User Query ("Find 9mm ballistic analysis")
           ↓
Authentication & Role-Based Authorization
           ↓
Filter Database Objects by Case & User Access (WHERE case_id = $1)
           ↓
Compute Query Vector Embedding (Nemotron Embed 1B)
           ↓
Cosine Similarity Search on Pre-Filtered Authorized Subset
           ↓
Send Filtered Matches to DeepSeek V4 Flash
           ↓
Grounded Finding with Exact Source Citations
```

### Security Invariants:
* **No Global Unrestricted Search:** Users can only retrieve embeddings belonging to cases where they are explicitly assigned as an officer, analyst, supervisor, or judge.
* **Content Hash Verification:** When source evidence is modified, a new embedding version is generated with an updated content hash without overwriting historical embeddings.
