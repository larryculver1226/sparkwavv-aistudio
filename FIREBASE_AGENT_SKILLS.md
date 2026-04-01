# Firebase Agent Skills Guide

This guide explains how to use the **Firebase Agent Skills** integrated into this project. These skills provide specialized instructions and architectural patterns for building robust, scalable applications with Firebase and AI Studio.

## 🚀 Getting Started

To ensure the AI agent is always using the latest best practices, run the update command:

```bash
npm run update-skills
```

This will fetch the latest remote skills from official Firebase sources and update the local manifest.

## 🧠 Available Expertise

The agent is now "skilled up" in the following areas:

### 1. React Clean Architecture
- **Service Layer:** Firestore logic is isolated in `src/services/`.
- **Custom Hooks:** Real-time state management is handled via hooks in `src/hooks/`.
- **Logic Separation:** Components are presentational; containers handle data.

### 2. AI Studio Lifecycle
- **Dev:** Local server on port 3000, environment variable management.
- **Test:** **Jest** testing with Firebase mocking.
- **Publish:** **Cloud Run** deployment in `us-central1`.
- **GitHub:** Secure export and secret management.

### 3. Vertex AI Grounding
- **Developer SDK:** Using `@google/generative-ai`.
- **Function Calling:** Triggering app-side actions from the LLM.
- **Context Injection:** Grounding responses in real-time Firestore data.

### 4. Remote MCP on Cloud Run
- **TypeScript/Node.js:** Server-side logic for the Model Context Protocol.
- **Remote Tools:** Exposing Firestore and AI logic as tools for the agent.

## 🛠️ How to Invoke Skills

When prompting the AI Studio agent, you can explicitly mention these skills to ensure compliance:

- *"Implement a new feature using the **React Clean Architecture** pattern."*
- *"Add a unit test for this service following the **AI Studio Lifecycle** skill."*
- *"Ground this AI response in the user's profile data using the **Vertex AI Grounding** patterns."*

## 📂 Project Structure

- `.firebase/agent-skills/`: Contains the markdown instruction modules.
- `scripts/update-skills.js`: Automation script for fetching remote skills.
- `FIREBASE_SKILLS_MANIFEST.md`: Central index for the AI agent.
