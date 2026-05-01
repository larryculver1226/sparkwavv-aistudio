# Track 103: Ignition and Discovery Phases - Sub-Agents

## 1. Plan
**Goal:** Assess and develop the design and implementation for five sub-agents/tools that Skylar utilizes during the initial diagnostic and discovery phase ("Discovery Launchpad"). These will be implemented as Genkit tools that Skylar can invoke autonomously and update the user's Wavvault directly in Firestore.

**Approach Addressing User Concerns:**
1. **Tool Registration & No-Code Prompts:** Instead of hardcoding prompts in the source code, the system instructions for each sub-agent will be fetched from a Firestore collection (e.g., `agentConfigs` or `toolConfigs`). They will be registered via `ai.defineTool` inside `backend/services/genkitService.ts`, and at runtime, they will pull their system prompts and parameters directly from Firestore. This guarantees completely "no-code" maintenance for tuning and refining sub-agent prompts.
2. **Data Persistence:** Every tool will include an asynchronous logic block connecting directly to Firebase Admin (`admin.firestore()`). Upon succeeding in parsing and generating the required AI output, the tool will update the `wavvaults/{userId}` document (and log appropriately). This guarantees that output artifacts (e.g., StrengthsPortrait, PerfectDay) are committed automatically.
3. **Data Schemas:** We will create an entirely new set of strict Zod schemas corresponding to the complex output expectations of each tool. To keep the frontend and backend correlated, we will introduce a new centralized schemas file (`src/types/schemas.ts`) which exports the Zod schemas and their inferred TypeScript types. `genkitService.ts` will import these directly for both the tool schemas and output structured generation.

**Sub-Agents to Design and Implement:**
1. **Discovery Launchpad Analyzer:**
   - *Input:* User ID, multi-modal user evaluations, attributes, "Extinguishers".
   - *Output/Schema:* `BestSelfProfileSchema` - Aspirational "best self" profile. Mitigates negative career elements.
   - *Persistence:* Writes to `wavvault.bestSelfProfile`.

2. **Narrative Journalist:**
   - *Input:* User ID, list of raw user accomplishments.
   - *Output/Schema:* `FiveStoriesSchema` - High-impact narratives containing factual "Journalist" and internal "Reflective" versions.
   - *Persistence:* Writes to `wavvault.fiveStories`.

3. **Future Visioning & Lifestyle Modeler:**
   - *Input:* User ID, 21 Questions answers (org preferences, commute, budget constraints).
   - *Output/Schema:* `FutureVisionSchema` - "Perfect Day" schedule and a "Make or Break" decision matrix.
   - *Persistence:* Writes to `wavvault.perfectDay` and `wavvault.decisionMatrix`.

4. **Energy & Productivity Optimizer:**
   - *Input:* User ID, Availability (3.5 - 7 hrs/week limit), energy trough times.
   - *Output/Schema:* `ProductivityPlanSchema` - 12-week study plan governed by 80/20 Pareto principle, mapping reboot blocks (Relax, Refresh, Review, Reflect).
   - *Persistence:* Writes to `wavvault.productivityPlan`.

5. **AI Career Diagnostics & Persona Builder:**
   - *Input:* User ID, Behavioral insights, Kickspark module inputs, psychological profiling data.
   - *Output/Schema:* `CareerPersonaSchema` - "Strengths Portrait" and personality-based career blueprint.
   - *Persistence:* Writes to `wavvault.careerPersona`.

**Review Plan:**
- Documented intended inputs, outputs, direct persistence models, and Zod schema alignment across the stack for the 5 Ignition/Discovery tools.
- Awaiting user approval to proceed with execution.

## 2. Setup
- Awaiting user review and approval of the revised plan.

## 3. Build
- Awaiting setup.
