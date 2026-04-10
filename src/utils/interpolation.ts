/**
 * src/utils/interpolation.ts
 * Replaces {{variable}} tags in system prompts with real user/session data.
 */

interface InterpolationData {
  user?: {
    displayName?: string;
    currentRole?: string;
    targetRole?: string;
  };
  stage?: {
    title: string;
    artifactName?: string;
  };
  // Add more as the platform evolves
}

export const interpolatePrompt = (
  template: string, 
  data: InterpolationData
): string => {
  let finalPrompt = template;

  // 1. Handle User Data
  if (data.user) {
    finalPrompt = finalPrompt.replace(/{{user.displayName}}/g, data.user.displayName || "Professional");
    finalPrompt = finalPrompt.replace(/{{user.currentRole}}/g, data.user.currentRole || "Current Role");
    finalPrompt = finalPrompt.replace(/{{user.targetRole}}/g, data.user.targetRole || "Target Career Path");
  }

  // 2. Handle Stage Data
  if (data.stage) {
    finalPrompt = finalPrompt.replace(/{{stage.title}}/g, data.stage.title);
    finalPrompt = finalPrompt.replace(/{{stage.artifactName}}/g, data.stage.artifactName || "Required Output");
  }

  return finalPrompt;
};
