# Track 063: Vertex AI Configuration Guide

## Status
- [x] Plan: 2026-04-14
- [x] Setup: 2026-04-14
- [x] Build: 2026-04-14

## Objectives
- Provide a clear guide for finding and setting Vertex AI environment variables.
- Document the exact locations in Google Cloud Console for each key.

## Implementation Details

### 1. Search & Conversation (Managed RAG)
- **VERTEX_AI_SEARCH_ENGINE_ID**:
  - **Location**: [Google Cloud Console > Search & Conversation](https://console.cloud.google.com/gen-app-builder/engines)
  - **How to find**: Open your Search App. The ID is visible in the "Data" tab or the URL (e.g., `.../engines/YOUR_ID/...`).
- **VERTEX_AI_SEARCH_DATA_STORE_ID**:
  - **Location**: Inside your Search Engine > **Data Stores** tab.
  - **How to find**: Copy the ID of the data store linked to your engine.

### 2. Specialized Models
- **VERTEX_AI_MEDLM_MODEL_ID**:
  - **Value**: Use `medlm-medium@latest` or `medlm-large@latest`.
  - **Note**: Ensure your project has access to MedLM in the [Vertex AI Model Garden](https://console.cloud.google.com/vertex-ai/model-garden).

### 3. Online Prediction (Endpoints)
- **VERTEX_AI_LOBKOWICZ_ENDPOINT_ID**
- **VERTEX_AI_FINANCE_ENDPOINT_ID**
- **VERTEX_AI_TECH_ENDPOINT_ID**
  - **Location**: [Vertex AI > Online Prediction > Endpoints](https://console.cloud.google.com/vertex-ai/online-prediction/endpoints)
  - **How to find**: After deploying a model to an endpoint, copy the numeric **Endpoint ID** from the list.

### 4. Infrastructure
- **VERTEX_AI_FINE_TUNING_BUCKET**:
  - **Location**: [Cloud Storage > Buckets](https://console.cloud.google.com/storage/browser)
  - **How to find**: Create a bucket (e.g., `wavvault-tuning-data`). Use just the name (no `gs://` prefix).

## Verification
- [x] Guide documented in Track 063.
- [x] Instructions provided to the user.
