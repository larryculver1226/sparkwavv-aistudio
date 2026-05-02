# Track 119: V2 Phase-Specific Skills

## Overview
This track introduces the "V2" suite of phase-specific micro-skills to bridge remaining UX gaps across the five Journey phases (Dive-In, Ignition, Discovery, Branding, Outreach).

## Implementation Details
1. **Tool (`parseResumeToVault`)** (Dive-In):
   - Accepts raw resume text and parses it into foundational 'WavVault' taxonomy (Work History, Skills, Education) to bypass generic Q&A.
2. **Tool (`assessOperatingStyle`)** (Ignition):
   - Categorizes and saves the user's optimal working environment constraints (Maker vs. Manager, Async vs. Sync, Remote vs. Office) into the Career Blueprint.
3. **Tool (`analyzeIndustryTrends`)** (Discovery):
   - Generates a "Market Heatmap" of macro trends (automation risk, hiring volume, geographic hotspots) for a specific sub-industry.
4. **Tool (`draftElevatorPitch`)** (Branding):
   - Distills the career blueprint into contextual 30-second conversational scripts or short bios for Networking.
5. **Tool (`triggerMockInterview`)** (Outreach):
   - Initiates a constrained temporal mode role-playing a specific hiring manager avatar, subsequently outputting a scorecard widget.

## Prompt Augmentation
Updates `skylarBase.prompt` to explicitly mention these new tools alongside their respective phases.
