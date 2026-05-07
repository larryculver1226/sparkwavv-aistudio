import { ModelArmorClient } from '@google-cloud/modelarmor';

/**
 * ModelArmorService
 */
export class ModelArmorService {
  private client: ModelArmorClient | null = null;
  private project: string;
  private location: string;
  private policyName: string | undefined;

  constructor() {
    this.project = process.env.VERTEX_AI_PROJECT_ID || process.env.VITE_FIREBASE_PROJECT_ID || '';
    this.location = process.env.VERTEX_AI_LOCATION || 'us-central1';
    this.policyName = process.env.VERTEX_AI_MODEL_ARMOR_POLICY;

    if (this.project && this.location) {
      try {
        this.client = new ModelArmorClient({
          apiEndpoint: `${this.location}-modelarmor.googleapis.com`,
        });
      } catch (error) {
        console.error('[ModelArmor] Failed to initialize client:', error);
      }
    }
  }

  /**
   * sanitizes user input to prevent prompt injection and jailbreaking.
   */
  async sanitizePrompt(text: string): Promise<{
    isSafe: boolean;
    sanitizedText: string;
    findings?: any[];
  }> {
    if (!this.client || !this.policyName) {
      // Graceful bypass if not configured
      return { isSafe: true, sanitizedText: text };
    }

    try {
      const parent = `projects/${this.project}/locations/${this.location}`;
      
      const [response] = await this.client.sanitizeUserPrompt({
        name: this.policyName,
        userPrompt: { text },
      });

      const result = response.sanitizationResult;
      const isSafe = !result?.filterMatch;

      return {
        isSafe,
        sanitizedText: isSafe ? text : '[REDACTED DUE TO SECURITY POLICY]',
        findings: result?.filterMatches
      };
    } catch (error) {
      console.error('[ModelArmor] Prompt sanitization failed:', error);
      // Fail open or closed? For a career partner, we might fail open but log.
      return { isSafe: true, sanitizedText: text };
    }
  }

  /**
   * sanitizes model output to prevent PII leakage and unsafe content.
   */
  async sanitizeResponse(text: string): Promise<{
    isSafe: boolean;
    sanitizedText: string;
    findings?: any[];
  }> {
    if (!this.client || !this.policyName) {
      return { isSafe: true, sanitizedText: text };
    }

    try {
      const [response] = await this.client.sanitizeModelResponse({
        name: this.policyName,
        modelResponse: { text },
      });

      const result = response.sanitizationResult;
      const isSafe = !result?.filterMatch;

      return {
        isSafe,
        sanitizedText: result?.sanitizedContent?.text || text,
        findings: result?.filterMatches
      };
    } catch (error) {
      console.error('[ModelArmor] Response sanitization failed:', error);
      return { isSafe: true, sanitizedText: text };
    }
  }
}

export const modelArmor = new ModelArmorService();
