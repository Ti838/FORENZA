# FORENZA — Non-Destructive Branching (FZ-BRANCH) & Human Adjudication (FZ-ADJ)
**Document ID:** `DOC-BRANCH-2026-001`

---

## 1. Non-Destructive Branching (FZ-BRANCH)

When conflicting evidence histories are detected during offline sync or multi-party submissions, FORENZA **never deletes or overwrites either history**.

Instead, the system forks the evidence timeline at the common ancestor $E_k$ into parallel verifiable branches:

```
                  +---------------------------+
                  |  E_k (Common Ancestor)   |
                  +-------------+-------------+
                                |
               +----------------+----------------+
               |                                 |
               v                                 v
+-------------------------------+ +-------------------------------+
| Branch A: Primary Server Head | | Branch B: Offline Field Fork  |
| E_{k+1}(A) -> E_{k+2}(A)      | | E_{k+1}(B) -> E_{k+2}(B)      |
+-------------------------------+ +-------------------------------+
```

Both branches maintain independent cryptographic integrity, Merkle state hash chains, and digital signatures.

---

## 2. Human Adjudication Workflow (FZ-ADJ)

Only authorized human judicial officers or supervisors can adjudicate conflicting branches.

### Adjudication Decisions:
1. `ACCEPT_BRANCH_A`: Accept Primary Branch as authoritative record.
2. `ACCEPT_BRANCH_B`: Accept Secondary Branch as authoritative record.
3. `ACCEPT_BOTH`: Recognize both branches as concurrent legitimate events (e.g. parallel laboratory tests).
4. `REJECT_BRANCH_A`: Reject Primary Branch.
5. `REJECT_BRANCH_B`: Reject Secondary Branch.
6. `UNRESOLVED`: Defer decision for formal courtroom trial testimony.

### Cryptographic Record:
Every adjudication decision generates an immutable, digitally-signed `adjudications` record:
* `reviewer_id`, `reviewer_device_id`
* `decision`, `reason`, `supporting_state_ids`
* `signature` (Ed25519)
* `version` (Supports reassessments $V_1 \rightarrow V_2$ without overwriting prior rulings).
