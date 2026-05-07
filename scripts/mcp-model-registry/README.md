# Sparkwavv MCP Model Registry

This is a **Model Abstraction Layer** implemented as an MCP (Model Context Protocol) Server. It provides a centralized gateway for all Generative AI calls in the Sparkwavv ecosystem.

## Features

1.  **Smart Model Mapping**:
    *   `CORE_REASONING` maps to `gemini-2.0-flash`.
    *   `UTILITY_TASK` maps to `gemini-1.5-flash`.
2.  **Autonomous Fallback**: If `gemini-2.0-flash` is unavailable (404/400), it automatically retries with `gemini-1.5-flash`.
3.  **Referrer Patch**: Automatically injects `referer` and `origin` headers to prevent `403 Forbidden` errors from restricted API keys.
4.  **Isolated Key Management**: Uses `.env` from the project root.

## Installation & Setup

1.  Navigate to this directory:
    ```bash
    cd scripts/mcp-model-registry
    ```
2.  Install dependencies:
    ```bash
    npm install
    ```
3.  (Optional) Test locally:
    ```bash
    npm run dev
    ```

## Integration with Sparkwavv

To use this registry in `genkitService.ts`, you can refactor existing AI calls to use the `sparkwavv_genai_call` tool via an MCP client.

### Environment Configuration

Ensure your `.env` contains:
```env
GEMINI_API_KEY=your_key_here
APP_URL=https://your-app-url.run.app
```

## MCP Tool Definition

### `sparkwavv_genai_call`
*   **Input**:
    *   `role`: The AI persona (e.g., 'Analyst').
    *   `prompt`: The task description.
    *   `temperature`: (Optional) 0.0 - 1.0.
    *   `useUtilityModel`: (Optional) Force 1.5-flash.
*   **Output**: JSON object with `text`, `model` used, and `status`.
