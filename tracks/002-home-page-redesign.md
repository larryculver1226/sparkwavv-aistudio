# Track 002: User Benefit-focused Cinematic Home Page Redesign

**Status**: In Progress
**Date**: 2026-04-02
**Objective**: Redesign the landing page into a high-impact, cinematic experience led by Skylar, featuring an immediate "Quick Scan" hook to drive "Dive-In" engagement.

## 1. Specification
- **Skylar's Cinematic Greeting**: A central, professional AI presence (using the provided avatar) that delivers a benefit-focused message via typewriter effect.
- **"Quick Scan" DNA Preview**: 
    - A prominent "Drop Resume" zone on the hero section.
    - Immediate parsing using Gemini to show a "DNA Tease" (top 3 attributes/strengths).
    - **Disclaimer**: "This is a temporary preview. To save your DNA and start your 12-week journey, you'll re-upload this during the 'Ignition' phase."
- **Cyber-Noir Visual Vibe**: Leveraging the existing Neon Cyan/Lime on Dark Zinc palette with enhanced atmospheric effects.
- **Benefit-Driven Narrative**: Replacing placeholders with real-world outcomes for Wellness, Wealth, and Freedom.

## 2. Technical Plan
1. **Asset Management**: Save the provided Skylar image as `/public/skylar-avatar.jpg`.
2. **New Component**: `src/components/landing/CinematicHero.tsx`
    - Implement Skylar's greeting with typewriter effect.
    - Integrate the "Quick Scan" resume upload logic.
    - Display the "DNA Tease" results in a cinematic overlay.
3. **Update `src/App.tsx`**:
    - Replace `CinematicIntro` with `CinematicHero`.
    - Ensure smooth transition to the "Dive-In" (Onboarding) flow.
4. **Refine `src/components/Hero.tsx`**:
    - Update "Vision" section copy.
    - Replace "Placeholder Panels" with benefit-focused testimonials.
5. **Verification**: Run lint and compile to ensure stability.

## 3. Progress
- [x] Track Initialized
- [ ] Asset saved
- [ ] CinematicHero implemented
- [ ] App.tsx updated
- [ ] Hero.tsx refined
- [ ] Verification complete
