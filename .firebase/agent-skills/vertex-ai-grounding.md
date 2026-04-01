# Vertex AI Grounding Skill

This module defines the patterns for grounding AI responses in Firestore data using the `@google/generative-ai` SDK.

## Core Principles
1. **Context Injection:** Inject Firestore data as context into the prompt.
2. **Function Calling:** Use function calling to trigger Firestore reads/writes.
3. **Token Optimization:** Summarize data before sending it to the model.

## Implementation Patterns

### 1. Function Calling for Data Retrieval
Define tools that the model can call to fetch real-time data from Firestore.

```typescript
// src/services/aiService.ts
import { GoogleGenAI, Type } from "@google/genai";
import { userService } from "./userService";

const getProfileTool = {
  name: "getUserProfile",
  description: "Get the user's career profile from Firestore",
  parameters: {
    type: Type.OBJECT,
    properties: {
      userId: { type: Type.STRING }
    },
    required: ["userId"]
  }
};

export async function generateCareerAdvice(prompt: string) {
  const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });
  const model = ai.models.get("gemini-3-flash-preview");
  
  const response = await model.generateContent({
    contents: [{ role: "user", parts: [{ text: prompt }] }],
    tools: [{ functionDeclarations: [getProfileTool] }]
  });
  
  // Handle function calls...
}
```

### 2. Manual Grounding (Context Injection)
Fetch data first, then include it in the system instruction or user prompt.

```typescript
export async function generateGroundedAdvice(uid: string, question: string) {
  const profile = await userService.getUserProfile(uid);
  const context = `User Profile: ${JSON.stringify(profile)}`;
  
  const response = await model.generateContent({
    contents: [
      { role: "system", parts: [{ text: `You are a career coach. Use this context: ${context}` }] },
      { role: "user", parts: [{ text: question }] }
    ]
  });
  return response.text;
}
```
