# Track 104: Branding Phase Sub-Agents & Tools

## 1. Plan
**Goal:** Assess and develop design and implementation strategies for three specialized sub-agents/tools used by Skylar during the Narrative Synthesis (Branding) phase. Similar to the previous phase, these tools will be implemented as Genkit tools, utilizing "no-code" dynamic system prompts stored in Firestore and strict Zod schemas for structured output data written directly to the user's Wavvault.

**Sub-Agents to Design and Implement:**

1. **Personal Brand Architect:**
   - *Input:* User ID, inner traits, career persona, best self profile.
   - *Output/Schema:* `BrandIdentitySchema` - Narrative themes, "movie poster" tagline, and brand attributes for external profile optimization.
   - *Persistence:* Writes to `wavvault.brandIdentity` as a top-level field (overwriting when updated).
   - *No-Code Prompting:* Uses system prompt stored in `agentConfigs` doc `architect_brand_identity`.

2. **AI Resume & Cover Letter Generator:**
   - *Input:* User ID, target job description, Five Stories, and selected Wavvault historical data (provided by Skylar fetching it using `fetch_wavvault_data`).
   - *Output/Schema:* `ApplicationMaterialsSchema` - ATS-optimized resume (bullets, summary) and tailored cover letter content.
   - *Persistence:* Appends the generated resume and cover letter objects into the user's `synthesizedAssets` array on their main Wavvault document.
   - *No-Code Prompting:* Uses system prompt stored in `agentConfigs` doc `generate_application_materials`.

3. **Smart Credential Verifier:**
   - *Input:* User ID, current credentials/skills, target role qualifications.
   - *Output/Schema:* `CredentialAnalysisSchema` - Identified skill gaps, recommended courses/next experiments, and an alignment score.
   - *Persistence:* Writes to `wavvault.credentialAnalysis` as a top-level field (overwriting when updated).
   - *No-Code Prompting:* Uses system prompt stored in `agentConfigs` doc `verify_credentials`.

**Review Plan:**
- Plan adjusted based on user feedback. The schemas will be added to `src/types/schemas.ts`, types to `src/types/wavvault.ts`, and the tool logic inside `backend/services/genkitService.ts`.
- Ready to proceed to Setup and Build.

## 2. Setup
- Replaced schema and output structures to align with answers to clarifying questions. Appended cover letter/resume directly to `synthesizedAssets`. Configured tools to fetch configurable system prompts.

## 3. Build
- Defined strict Zod schemas for `BrandIdentity`, `ApplicationMaterials`, and `CredentialAnalysis`.
- Updated `WavVault` interface with the fields/types.
- Developed three new Genkit tools: `architect_brand_identity`, `generate_application_materials` and `verify_credentials`.
- All tools persist their generated valid schemas synchronously to Firestore upon completion.
