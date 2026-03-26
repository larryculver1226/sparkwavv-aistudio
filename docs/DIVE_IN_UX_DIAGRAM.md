# Dive-In Phase UX Diagram

The **Dive-In** phase is the foundational stage of the SPARKWavv 12-week journey (Weeks 1-2). It focuses on account setup, initializing the user's digital career repository (Wavvault), and establishing the first connection with Skylar, the AI career architect.

## UX Flow Diagram

```mermaid
graph TD
    %% Entry Point
    Start((Start)) --> Auth[User Registration / Login]
    
    %% Introduction
    Auth --> Welcome[Welcome to SPARKWavv Dashboard]
    Welcome --> Intro[12-Week Journey Overview]
    
    %% Wavvault Initialization (Onboarding)
    subgraph Onboarding: Wavvault Initialization
        Intro --> Step1[Step 1: Define Professional Identity]
        Step1 --> Step2[Step 2: Identify Core Strengths]
        Step2 --> Step3[Step 3: Share Career Stories]
    end
    
    %% AI Interaction
    Step3 --> SkylarInit[First Connection with Skylar AI]
    SkylarInit --> SparkID[Identify Initial 'Spark']
    
    %% Validation Gate
    SparkID --> Gate[Dive-In Validation Gate Review]
    Gate --> Decision{Ready for Ignition?}
    
    %% Outcomes
    Decision -- Yes --> Ignition[Phase 2: Ignition]
    Decision -- No --> Refine[Refine Wavvault & Spark]
    Refine --> SparkID
    
    %% Styling
    style Start fill:#00f3ff,stroke:#00f3ff,color:#000
    style Ignition fill:#ff00ff,stroke:#ff00ff,color:#fff
    style Gate fill:#facc15,stroke:#facc15,color:#000
```

## Key Components of the Dive-In Phase

### 1. Wavvault Initialization
Users provide the raw data that powers the AI synthesis. This includes their professional narrative, a list of strengths, and formative career stories.

### 2. Skylar Connection
The first interaction where Skylar analyzes the initial data to begin building the user's "Neural Synthesis".

### 3. The "Spark"
The core motivation or unique value proposition that will be refined throughout the journey.

### 4. Validation Gate
A critical review point where the user must demonstrate commitment to the 12-week process and have a clearly identified initial "Spark" before progressing to the **Ignition** phase.
