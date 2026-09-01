# FORENZA — FZ-AI Model Responsibility Matrix
**Document ID:** `DOC-AI-MODELS-2026-001`

---

## 1. Model Responsibility Breakdown

| Engine | Default Model Identifier | Environment Variable | Forensic Responsibility |
| :--- | :--- | :--- | :--- |
| **DeepSeek V4 Flash** | `deepseek-ai/deepseek-r1` | `NVIDIA_REASONING_MODEL` | **Primary Reasoning Engine**: Timeline reasoning, custody-chain explanation, EPRA divergence explanation, case summarization, and forensic report drafting. |
| **Muse Glimmer 30B** | `nvidia/neva-22b` | `NVIDIA_VISION_MODEL` | **Forensic Vision Engine**: Evidence image visual descriptions, object identification, condition descriptions, and visual anomaly observations. |
| **Nemotron OCR V2** | `nvidia/nemotron-ocr` | `NVIDIA_OCR_MODEL` | **Forensic OCR Engine**: Verbatim text extraction from evidence labels, serial numbers, stamped forms, and multilingual physical exhibits. |
| **Nemotron Embed 1B** | `nvidia/nv-embedqa-e5-v5` | `NVIDIA_EMBEDDING_MODEL` | **Semantic Retrieval Engine**: Vector embeddings for tenant-isolated semantic search across evidence, custody notes, and lab reports. |
| **Nemotron 3.5 Lightning** | `nvidia/nemotron-4-340b-instruct` | `NVIDIA_FAST_MODEL` | **Fast Task Engine**: Low-latency classification, metadata categorization, short summaries, and routine tagging. |
| **NVIDIA Safety** | `nvidia/llama-3.1-nemoguard-8b` | `NVIDIA_SAFETY_MODEL` | **Forensic Content Safety**: Evaluates adversarial prompt injections while permitting legitimate forensic discussion of crime evidence. |
| **Riva Translate 4B** | `meta/llama-3.1-8b-instruct` | `NVIDIA_TRANSLATION_MODEL` | **Translation Engine**: Translates multilingual case notes and witness statements into standardized working copies without modifying the original text. |
| **Google Gemini** | `gemini-2.0-flash` | `GEMINI_MODEL` | **Fallback & Cross-Checker**: Multimodal secondary provider for high availability and automated cross-verification. |

---

## 2. Multi-Model Pipelines

1. **Pipeline A (Evidence Image Analysis):** Image $\rightarrow$ SHA-256 $\rightarrow$ OCR (if document) $\rightarrow$ Vision analysis $\rightarrow$ DeepSeek synthesis $\rightarrow$ Human Review.
2. **Pipeline B (Custody Discrepancy & EPRA):** Custody history $\rightarrow$ Merkle state verification $\rightarrow$ EPRA algorithm $\rightarrow$ Divergence point $\rightarrow$ DeepSeek explanation $\rightarrow$ Human Review.
3. **Pipeline C (Case Search & Semantic RAG):** Query $\rightarrow$ Embedding $\rightarrow$ Case-isolated vector filter $\rightarrow$ DeepSeek reasoning with grounded citations.
4. **Pipeline D (Lab Report Analysis):** Report document $\rightarrow$ SHA-256 $\rightarrow$ OCR text extraction $\rightarrow$ Structured summary $\rightarrow$ Human Review.
5. **Pipeline E (Multilingual Translation):** Original text $\rightarrow$ SHA-256 $\rightarrow$ Riva translation $\rightarrow$ Versioned assistive copy.
