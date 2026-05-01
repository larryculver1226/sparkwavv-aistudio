/**
 * Guidance for updating Stage Management items.
 * These are used to provide a baseline for "no-code" management.
 */
import { Modality, StageWidgetConfig } from '../types/skylar';

export const STAGE_MANAGEMENT_GUIDANCE = {
  systemPromptTemplate: {
    title: 'System Prompt Template Guidance',
    content: `
The System Prompt Template is the "brain" of Skylar for this specific stage. It defines her personality, goals, and constraints.

### Key Variables
You can use the following variables in your template:
- {{user.displayName}}: The user's full name.
- {{user.firstName}}: The user's first name.
- {{user.role}}: The user's current or target role.
- {{user.sector}}: The industry sector the user is focused on.
- {{stage.title}}: The name of the current stage.

### Best Practices
1. **Define the Goal**: Clearly state what Skylar should help the user achieve in this turn.
2. **Set the Tone**: Use adjectives like "Provocative", "Empathetic", or "Analytical".
3. **Step-by-Step Instructions**: Give Skylar a numbered list of steps to follow.
4. **Action Triggers**: Mention specific actions Skylar can trigger (e.g., 'save_strengths', 'generate_portrait').
5. **Constraints**: Tell Skylar what NOT to do (e.g., "Don't give generic advice; always reference the user's Wavvault data").
    `
  },
  requiredArtifacts: {
    title: 'Required Artifacts Guidance',
    content: `
List the specific outputs the user must produce to "pass" this stage. 
These will be displayed as a checklist in the UI.
Example: ["Resume", "3 Commitments", "DNA Summary"]
    `
  },
  allowedModalities: {
    title: 'Allowed Modalities Guidance',
    content: `
Control how the user can interact with Skylar:
- **text**: Standard chat input.
- **audio**: Enables the microphone button for voice-to-text.
- **image**: Enables file uploads (images, PDFs, docs).
- **video**: Enables video recording or upload options.
    `
  }
};
