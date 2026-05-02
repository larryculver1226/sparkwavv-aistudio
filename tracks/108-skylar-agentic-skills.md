# Track 108: Skylar Special Skills Assessment

## Overview
The user asked if Skylar (the AI assistant) needs "special skills" in addition to the Genkit tools already implemented. This document assesses the current toolset and recommends advanced agentic skills Skylar would benefit from to transition from a responsive assistant to a proactive, autonomous career agent.

## Assessment of Current Architecture
Currently, Skylar operates primarily as a **"React & Retrieve"** agent:
- Relies on user prompts or dashboard triggers to execute tasks.
- Uses Genkit tools to process data, update Firestore schemas (`WavVault`, `matchedOpportunities`, `interviewSessions`), and provide insights.
- Tools are statically defined in `backend/services/genkitService.ts`.

## Recommended Special Skills for Skylar

To make Skylar a truly autonomous and proactive career engine, the following "Special Skills" (advanced capability modules) should be incorporated:

### 1. Vectorized Memory & Long-Term Recall (RAG)
**Why:** Currently, Skylar relies on a limited `history` array and the structured `WavVault` document. Over a 6-month job search, the subtle nuances, off-hand comments, and recurring frustrations will be lost if they don't fit perfectly into a strict schema.
**How it integrates:**
- Integrate a Vector Database (e.g., Pinecone or Firestore Vector Search if using Enterprise).
- **Architecture:** Create a `memorizeContextTool` and `recallContextTool` in `genkitService.ts`. Skylar is prompted to selectively embed unstructured conversational nuggets into the vector store and query it when context-switching.

### 2. Autonomous Web Scraping & Market Grounding
**Why:** Skylar currently matches against an arbitrary `marketPostings` payload or generalized Google Search. To provide precise insights, Skylar needs to "read" actual corporate URLs, founder blogs, and live job postings directly.
**How it integrates:**
- **Architecture:** Introduce a `scrapeUrlTool` (using a headless browser API or proxy like Firecrawl/Tavily). 
- When a user asks "Will I fit in at Neural Dynamics?", Skylar fetches their culture page, compares it against the user's `BestSelfProfile` and `Extinguishers`, and returns a highly personalized cultural fit analysis.

### 3. Integrated Scheduling & Temporal Awareness (Calendar Skill)
**Why:** The `applicationSchedule` is currently just generated text. Skylar should help the user literally block out time for applying, networking, and protecting their "energy protocol."
**How it integrates:**
- **Architecture:** `manageCalendarTool` hooking into Google Calendar API via OAuth (stored securely in user tokens).
- Skylar can actively enforce the user's "Energy Protocol" by checking availability and suggesting: "You hit your 3.5 hrs of networking this week. I've blocked Thursday for Deep Work."

### 4. Headless Outreach Execution
**Why:** During the Outreach Phase, Skylar drafts recruiter messages (`draftedIntro`). The next level is Skylar actively sending or teeing them up.
**How it integrates:**
- **Architecture:** Integrate SendGrid, Gmail API, or LinkedIn API (via proxy) using an `executeOutreachTool`. 
- Skylar drafts the message, asks the user for explicit "Send Approval" via a UI widget, and then dispatches the email, moving the opportunity to an "outreached" status in the `DiscoveryBento`.

### 5. Multi-format Asset Generation (PDF/Docx Export Skill)
**Why:** Skylar generates `ApplicationMaterials` in JSON/Markdown. Users need to attach actual PDFs to ATS systems.
**How it integrates:**
- **Architecture:** Create an `exportAssetTool` that triggers a serverless Cloud Function containing `Puppeteer` or a PDF library. 
- It converts Skylar's optimized HTML/Markdown resumes into perfectly formatted ATS-compliant PDFs, storing them in Firebase Storage and returning the download URL to the chat.

## Architectural Integration Pattern
To manage these skills without overwhelming the context window, we should implement a **"Skill Registry" or "Tool Router"**:
1. **Dynamic Tool Loading:** Instead of injecting *all* 15 tools into every Gemini call, Skylar has a preliminary "routing" thought process: "What skills do I need for this prompt?"
2. **Phase-Gated Access:** Only inject `executeOutreachTool` if the user is verified to be in the "Outreach Phase" within their `timelineStage`.

## Next Steps
To proceed, we can select one of these High-Impact Skills (like **Autonomous Web Scraping** or **Vectorized Memory**) and implement it as the next Genkit capability, tying it seamlessly into Skylar's prompt execution loop.
