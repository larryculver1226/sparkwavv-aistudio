# Security Specification: Database Scraping Protection

## Data Invariants
1. No user can list documents in `wavvault`, `dashboards`, or `users` that do not belong to their `uid`.
2. Public metadata (`metadata`, `tenants`, `programs`) is read-only for non-admins.
3. `SecurityLog` and `SystemLog` are write-only for the system and read-only for admins.

## The "Dirty Dozen" Payloads (Red Team Tests)

| # | Attack Type | Payload/Query | Expected |
|---|---|---|---|
| 1 | Identity Spoof | `get(/users/attacker_id)` where attacker_id != my_id | DENIED |
| 2 | List Scraping | `list(/wavvault)` without `where("userId", "==", my_id)` | DENIED |
| 3 | Field Injection | `update(/users/my_id)` with `{ role: 'admin' }` | DENIED |
| 4 | Orphaned Write | `create(/artifacts/1)` with non-existent `userId` | DENIED |
| 5 | PII Leak (Unverified) | `get(/users/my_id)` with `email_verified: false` | DENIED (for sensitive fields) |
| 6 | Immutable Bypass | `update(/dashboards/my_id)` with `{ userId: 'other_id' }` | DENIED |
| 7 | Global Delete | `delete(/metadata/skylar_global)` | DENIED |
| 8 | Shadow Update | `update(/wavvault/my_id)` with `{ extra_field: 'malicious' }` | DENIED (via hasOnly) |
| 9 | Status Shortcut | `update(/journeys/my_id)` with `{ status: 'completed' }` without passing gates | DENIED |
| 10 | Recursive Cost | Aggressive recursive `list` query | DENIED (via security overhead limits) |
| 11 | ID Poisoning | `create(/users/!@#$%^&*)` | DENIED (via isValidId) |
| 12 | Path Injection | `get(/users/../admins/root)` | DENIED (Firestore native protection) |

## Test Runner (Logic Check)
*Drafting hardened rules next.*
