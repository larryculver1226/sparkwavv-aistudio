# Track 143: Multimodal Tools Migration to MCP

## Status: Completed
**Started**: 2026-05-07
**Completed**: 2026-05-07
**Owner**: Senior Backend Architect

## Context
Following the migration of text-based tools (Track 142), we now need to bring multimodal capabilities—specifically Resume Parsing (Text/File) and AI Image Generation—into the **MCP Model Registry**. This ensures that even complex multimodal workflows benefit from the smart fallback and referrer patches.

## Objective
Extend the MCP Model Registry to support multimodal inputs and migrate `parseResume` and `generateBrandImage` in `geminiBackend.ts`.

## Implementation Plan

### 1. MCP Registry Enhancement
- [x] Update `sparkwavv_genai_call` tool definition to accept optional multimodal data (base64).
- [x] Implement support for `gemini-2.0-flash` multimodal features in the registry index.

### 2. Service Migration
- [x] Refactor `parseResume` in `geminiBackend.ts` to use the MCP tool.
- [x] Refactor `generateBrandImage` in `geminiBackend.ts` to use the MCP tool.

### 3. Verification
- [x] Verify PDF/Image processing through the MCP gateway.
- [x] Ensure Imagen 3 or Gemini 2.0 image generation requests are correctly routed and patched.
- [x] Implement and verify "API Key rotation" in MCP Registry to handle expired keys.
- [x] Implement and verify "Database Fallback" in Firestore setup to resolve `5 NOT_FOUND` errors.

## Final Result
- **Multi-modal Support**: Resume parsing (PDF/Images) and Image Generation are now safely routed through the MCP Model Registry.
- **Resilience Layer**:
    - **Firestore**: Implemented automatic fallback to `(default)` database for both `NOT_FOUND` (5) and `PERMISSION_DENIED` (7) errors.
    - **API Keys**: Implemented key rotation across 5 environment variables and introduced an "Emergency Mode" chat fallback that bypasses Genkit's strict initialization when keys expire.
- **Safety**: Referrer patches and Model Armor are applied globally across all AI tools.
- **Key Continuity**: Automatic rotation and filtering of invalid placeholders in the MCP Registry.

## Technical Specifications
- **Multimodal Support**: Base64 data injection into `GoogleGenerativeAI` request.
- **Model Mapping**: 
  - Vision/Parse: `gemini-2.0-flash` (Primary) -> `gemini-1.5-flash` (Fallback).
  - Image Gen: `gemini-2.0-flash` (Implicitly via tool or specific endpoint).
