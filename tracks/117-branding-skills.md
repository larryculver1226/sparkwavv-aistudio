# Track 117: Branding Phase Skills (Narrative & Assets)

## Overview
This track introduces highly specific micro-skills for the "Branding" phase. These tools enable Skylar to analyze a user's digital footprint and automatically outline the artifacts they need to validate their narrative to the external market.

## Implementation Details
1. **Tool (`auditSocialProfile`)**:
   - A specialized wrapper that takes a LinkedIn or portfolio URL and outputs a structured checklist/heatmap of recommended changes tailored to their target Career DNA.
   
2. **Tool (`generatePortfolioStructure`)**:
   - Automatically generates a UI checklist of required case studies, artifacts, or project outlines needed to validate their specific target role.

3. **Prompt Augmentation**:
   - Updates `skylarBase.prompt` to explicitly mention `auditSocialProfile` and `generatePortfolioStructure` for use during the Branding phase.

## UI Usage
When users link their LinkedIn profile in the Branding phase, Skylar uses `auditSocialProfile` to present an actionable checklist of optimizations. When a user asks "What should my portfolio look like?", Skylar uses `generatePortfolioStructure` to immediately scaffold a targeted list of necessary case studies.
