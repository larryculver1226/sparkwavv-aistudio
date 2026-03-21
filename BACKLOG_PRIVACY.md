# Sparwavv Backlog: Zero-Knowledge Privacy Architecture

This document outlines the strategic roadmap for implementing true Zero-Knowledge (ZK) privacy within the Sparwavv application. The goal is to ensure that the user remains the sole owner of their "Professional DNA" and that neither Sparwavv nor its infrastructure providers can access raw sensitive data.

---

## 🛡️ Phase 1: Client-Side Encryption Infrastructure

- [ ] **Implement `PrivacyService.ts`**
  - Use the **Web Crypto API** (AES-GCM 256-bit) for high-performance, browser-native encryption.
  - Create utility functions for `encrypt(data, key)` and `decrypt(data, key)`.
- [ ] **Session Key Management**
  - Integrate key lifecycle into `IdentityContext.tsx`.
  - **Decision Required:** Determine if the key should be derived from the Firebase Auth UID (convenience) or a user-provided **Vault Passphrase** (maximum security).
- [ ] **Field-Level Encryption Mapping**
  - Audit `DashboardData` and `UserProfile` interfaces to identify "DNA" fields (e.g., `bio`, `brandDNAAttributes`, `milestones`, `perfectDay`).
  - Implement a middleware pattern to automatically encrypt these fields before `setDoc` and decrypt after `getDoc`/`onSnapshot`.

---

## 🤖 Phase 2: Skylar & Blind AI Processing

- [ ] **Privacy-Preserving Context for LLMs**
  - Implement a "Context Redactor" that replaces sensitive PII with generic tokens before sending prompts to Skylar (Gemini).
  - Research **Differential Privacy** techniques to add mathematical noise to data used for training or fine-tuning (if applicable).
- [ ] **Local Semantic Indexing**
  - Instead of server-side vector search, explore generating embeddings in the browser (using `transformers.js` or similar) to keep the semantic index local to the user's device.

---

## 🔑 Phase 3: Vault Access & UX

- [ ] **Vault Activation UI**
  - Create a "Secure Your DNA" onboarding flow where users set up their encryption keys.
  - Implement "Emergency Recovery Kit" (PDF download with recovery codes) since ZK data is unrecoverable if the passphrase is lost.
- [ ] **Skylar "Unlock" Requests**
  - Design a UI pattern where Skylar asks for permission to "peek" at encrypted data for a specific coaching session, decrypting it only in memory for that turn.

---

## 🔍 Phase 4: Search & Verification

- [ ] **Client-Side Search (FlexSearch)**
  - Since Firestore cannot search encrypted text, implement a local search index that loads into memory upon login to allow users to filter their own data.
- [ ] **Zero-Knowledge Proofs (ZKP) for Credentials**
  - Integrate with decentralized identity providers to allow users to prove they have a degree or a specific job title without revealing the underlying document to Sparwavv.

---

## 📝 Technical Debt & Considerations

- **Performance:** Encryption/Decryption adds overhead to page loads. Monitor impact on `UserDashboard.tsx`.
- **Data Portability:** Ensure users can export their *decrypted* data easily.
- **Multi-Device Sync:** If using a passphrase, how is the key shared between a laptop and a mobile device securely? (e.g., QR code transfer).
